import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../config/firebase";

// Collections
export const COLLECTIONS = {
  USERS: "users",
  POSTS: "posts",
  EVENTS: "events",
  MESSAGES: "messages",
  CHATS: "chats",
  NOTIFICATIONS: "notifications",
  STORIES: "stories",
  SAVED_POSTS: "savedPosts",
  BLOCKED_USERS: "blockedUsers",
  REPORTS: "reports",
};

// Helper function to generate chat ID
const getChatId = (userId1, userId2) => {
  return [userId1, userId2].sort().join("_");
};

// USER SERVICES
export const userService = {
  // Get user profile
  getUser: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  // Update user profile
  updateUser: async (userId, userData) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        ...userData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (searchTerm) => {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where("username", ">=", searchTerm.toLowerCase()),
        where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Follow/Unfollow user
  toggleFollow: async (currentUserId, targetUserId, isFollowing) => {
    try {
      const currentUserRef = doc(db, COLLECTIONS.USERS, currentUserId);
      const targetUserRef = doc(db, COLLECTIONS.USERS, targetUserId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId),
          followingCount: increment(-1),
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId),
          followersCount: increment(-1),
        });
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId),
          followingCount: increment(1),
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId),
          followersCount: increment(1),
        });
      }
      return true;
    } catch (error) {
      console.error("Error toggling follow:", error);
      throw error;
    }
  },

  // Update push token
  updatePushToken: async (userId, pushToken) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        pushToken,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating push token:", error);
      throw error;
    }
  },

  // Get user push token
  getUserPushToken: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return userDoc.data().pushToken || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting user push token:", error);
      return null;
    }
  },
};

// POST SERVICES
export const postService = {
  // Create post with image or video support
  createPost: async (postData, mediaFile = null) => {
    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media file if provided
      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");
        const folder = isVideo ? "videos" : "images";
        const mediaRef = ref(
          storage,
          `posts/${folder}/${Date.now()}_${mediaFile.name}`
        );
        const snapshot = await uploadBytes(mediaRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
        mediaType = isVideo ? "video" : "image";
      }

      const post = {
        ...postData,
        image: !mediaType || mediaType === "image" ? mediaUrl : null,
        video: mediaType === "video" ? mediaUrl : null,
        mediaType: mediaType || null,
        likes: [],
        likesCount: 0,
        comments: [],
        commentsCount: 0,
        shares: [],
        sharesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.POSTS), post);
      return { id: docRef.id, ...post };
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // Get posts with real-time updates
  subscribeToPosts: (callback, limitCount = 20) => {
    try {
      const postsRef = collection(db, COLLECTIONS.POSTS);
      const q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        callback(posts);
      });
    } catch (error) {
      console.error("Error subscribing to posts:", error);
      throw error;
    }
  },

  // Get user's posts
  getUserPosts: async (userId, limitCount = 20) => {
    try {
      const postsRef = collection(db, COLLECTIONS.POSTS);
      const q = query(
        postsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting user posts:", error);
      throw error;
    }
  },

  // Toggle like post with notification
  toggleLike: async (postId, userId, isLiked, senderUserData = null) => {
    try {
      const postRef = doc(db, COLLECTIONS.POSTS, postId);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
          likesCount: increment(-1),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          likesCount: increment(1),
        });

        // Send like notification if someone else's post
        if (senderUserData) {
          try {
            // Get the post to find the owner
            const postDoc = await getDoc(postRef);
            if (postDoc.exists()) {
              const postData = postDoc.data();
              const postOwnerId = postData.userId;

              // Don't send notification if user likes their own post
              if (postOwnerId && postOwnerId !== userId) {
                // Create notification
                const notificationData = {
                  userId: postOwnerId,
                  fromUserId: userId,
                  type: "like",
                  postId,
                  message: `${
                    senderUserData.fullName || "Someone"
                  } liked your post`,
                };

                const pushData = {
                  title: "New Like",
                  body: `${
                    senderUserData.fullName || "Someone"
                  } liked your post`,
                  data: {
                    type: "like",
                    postId,
                    categoryId: "likes",
                    screen: "Comments",
                    params: { post: { id: postId } },
                  },
                };

                await notificationService.createNotificationWithPush(
                  notificationData,
                  pushData
                );
              }
            }
          } catch (notificationError) {
            console.error(
              "Error sending like notification:",
              notificationError
            );
            // Don't fail the like operation if notification fails
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },

  // Add comment with notification
  addComment: async (postId, commentData, senderUserData = null) => {
    try {
      const comment = {
        ...commentData,
        id: Date.now().toString(),
        createdAt: new Date(), // Use regular Date instead of serverTimestamp
      };

      const postRef = doc(db, COLLECTIONS.POSTS, postId);
      await updateDoc(postRef, {
        comments: arrayUnion(comment),
        commentsCount: increment(1),
      });

      // Send comment notification if someone else's post
      if (senderUserData && commentData.userId) {
        try {
          // Get the post to find the owner
          const postDoc = await getDoc(postRef);
          if (postDoc.exists()) {
            const postData = postDoc.data();
            const postOwnerId = postData.userId;

            // Don't send notification if user comments on their own post
            if (postOwnerId && postOwnerId !== commentData.userId) {
              // Create notification
              const notificationData = {
                userId: postOwnerId,
                fromUserId: commentData.userId,
                type: "comment",
                postId,
                message: `${
                  senderUserData.fullName || "Someone"
                } commented on your post`,
              };

              const pushData = {
                title: "New Comment",
                body: `${senderUserData.fullName || "Someone"} commented: "${
                  comment.text
                }"`,
                data: {
                  type: "comment",
                  postId,
                  categoryId: "comments",
                  screen: "Comments",
                  params: { post: { id: postId } },
                },
              };

              await notificationService.createNotificationWithPush(
                notificationData,
                pushData
              );
            }
          }
        } catch (notificationError) {
          console.error(
            "Error sending comment notification:",
            notificationError
          );
          // Don't fail the comment operation if notification fails
        }
      }

      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId, imageUrl = null) => {
    try {
      // Delete image if exists
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      await deleteDoc(doc(db, COLLECTIONS.POSTS, postId));
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
};

// SAVED POSTS SERVICES
export const savedPostsService = {
  // Save/unsave post
  toggleSavePost: async (userId, postId, isSaved) => {
    try {
      const saveId = `${userId}_${postId}`;
      const saveRef = doc(db, COLLECTIONS.SAVED_POSTS, saveId);

      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, {
          userId,
          postId,
          savedAt: serverTimestamp(),
        });
      }
      return true;
    } catch (error) {
      console.error("Error toggling save post:", error);
      throw error;
    }
  },

  // Check if post is saved
  isPostSaved: async (userId, postId) => {
    try {
      const saveId = `${userId}_${postId}`;
      const saveDoc = await getDoc(doc(db, COLLECTIONS.SAVED_POSTS, saveId));
      return saveDoc.exists();
    } catch (error) {
      console.error("Error checking if post is saved:", error);
      return false;
    }
  },

  // Get saved posts
  getUserSavedPosts: async (userId, limitCount = 20) => {
    try {
      const savedPostsRef = collection(db, COLLECTIONS.SAVED_POSTS);
      const q = query(
        savedPostsRef,
        where("userId", "==", userId),
        orderBy("savedAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const savedPostIds = snapshot.docs.map((doc) => doc.data().postId);

      if (savedPostIds.length === 0) return [];

      // Get the actual posts
      const postsPromises = savedPostIds.map((postId) =>
        getDoc(doc(db, COLLECTIONS.POSTS, postId))
      );

      const postsSnapshots = await Promise.all(postsPromises);

      return postsSnapshots
        .filter((snap) => snap.exists())
        .map((snap) => ({
          id: snap.id,
          ...snap.data(),
          createdAt: snap.data().createdAt?.toDate(),
        }));
    } catch (error) {
      console.error("Error getting saved posts:", error);
      throw error;
    }
  },

  // Subscribe to saved posts
  subscribeToSavedPosts: (userId, callback, limitCount = 20) => {
    try {
      const savedPostsRef = collection(db, COLLECTIONS.SAVED_POSTS);
      const q = query(
        savedPostsRef,
        where("userId", "==", userId),
        orderBy("savedAt", "desc"),
        limit(limitCount)
      );

      return onSnapshot(q, async (snapshot) => {
        const savedPostIds = snapshot.docs.map((doc) => doc.data().postId);

        if (savedPostIds.length === 0) {
          callback([]);
          return;
        }

        // Get the actual posts
        const postsPromises = savedPostIds.map((postId) =>
          getDoc(doc(db, COLLECTIONS.POSTS, postId))
        );

        const postsSnapshots = await Promise.all(postsPromises);

        const savedPosts = postsSnapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt?.toDate(),
          }));

        callback(savedPosts);
      });
    } catch (error) {
      console.error("Error subscribing to saved posts:", error);
      throw error;
    }
  },
};

// USER BLOCKING SERVICES
export const blockingService = {
  // Block user
  blockUser: async (blockerId, blockedUserId) => {
    try {
      const blockId = `${blockerId}_${blockedUserId}`;

      await setDoc(doc(db, COLLECTIONS.BLOCKED_USERS, blockId), {
        blockerId,
        blockedUserId,
        blockedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  },

  // Unblock user
  unblockUser: async (blockerId, blockedUserId) => {
    try {
      const blockId = `${blockerId}_${blockedUserId}`;
      await deleteDoc(doc(db, COLLECTIONS.BLOCKED_USERS, blockId));
      return true;
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  },

  // Check if user is blocked
  isUserBlocked: async (blockerId, blockedUserId) => {
    try {
      const blockId = `${blockerId}_${blockedUserId}`;
      const blockDoc = await getDoc(
        doc(db, COLLECTIONS.BLOCKED_USERS, blockId)
      );
      return blockDoc.exists();
    } catch (error) {
      console.error("Error checking if user is blocked:", error);
      return false;
    }
  },

  // Get blocked users
  getBlockedUsers: async (userId) => {
    try {
      const blockedRef = collection(db, COLLECTIONS.BLOCKED_USERS);
      const q = query(
        blockedRef,
        where("blockerId", "==", userId),
        orderBy("blockedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const blockedUserIds = snapshot.docs.map(
        (doc) => doc.data().blockedUserId
      );

      if (blockedUserIds.length === 0) return [];

      // Get user details for blocked users
      const usersPromises = blockedUserIds.map((userId) =>
        getDoc(doc(db, COLLECTIONS.USERS, userId))
      );

      const usersSnapshots = await Promise.all(usersPromises);

      return usersSnapshots
        .filter((snap) => snap.exists())
        .map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }));
    } catch (error) {
      console.error("Error getting blocked users:", error);
      throw error;
    }
  },

  // Check mutual blocking (both users blocking each other)
  checkMutualBlocking: async (user1Id, user2Id) => {
    try {
      const [user1BlocksUser2, user2BlocksUser1] = await Promise.all([
        blockingService.isUserBlocked(user1Id, user2Id),
        blockingService.isUserBlocked(user2Id, user1Id),
      ]);

      return {
        user1BlocksUser2,
        user2BlocksUser1,
        eitherBlocked: user1BlocksUser2 || user2BlocksUser1,
      };
    } catch (error) {
      console.error("Error checking mutual blocking:", error);
      return {
        user1BlocksUser2: false,
        user2BlocksUser1: false,
        eitherBlocked: false,
      };
    }
  },
};

// REPORTING SERVICES
export const reportingService = {
  // Report content (user, post, comment, etc.)
  reportContent: async (reportData) => {
    try {
      const report = {
        ...reportData,
        reportedAt: serverTimestamp(),
        status: "pending", // pending, reviewed, resolved, dismissed
        reviewedAt: null,
        reviewedBy: null,
        resolution: null,
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), report);
      return { id: docRef.id, ...report };
    } catch (error) {
      console.error("Error reporting content:", error);
      throw error;
    }
  },

  // Get user's reports
  getUserReports: async (userId) => {
    try {
      const reportsRef = collection(db, COLLECTIONS.REPORTS);
      const q = query(
        reportsRef,
        where("reporterId", "==", userId),
        orderBy("reportedAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        reportedAt: doc.data().reportedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting user reports:", error);
      throw error;
    }
  },

  // Get reports by content type
  getReportsByType: async (contentType, contentId) => {
    try {
      const reportsRef = collection(db, COLLECTIONS.REPORTS);
      const q = query(
        reportsRef,
        where("contentType", "==", contentType),
        where("contentId", "==", contentId),
        orderBy("reportedAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        reportedAt: doc.data().reportedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting reports by type:", error);
      throw error;
    }
  },

  // Update report status (admin function)
  updateReportStatus: async (
    reportId,
    status,
    resolution = null,
    reviewerId = null
  ) => {
    try {
      const updateData = {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
      };

      if (resolution) {
        updateData.resolution = resolution;
      }

      await updateDoc(doc(db, COLLECTIONS.REPORTS, reportId), updateData);
      return true;
    } catch (error) {
      console.error("Error updating report status:", error);
      throw error;
    }
  },
};

// EVENT SERVICES
export const eventService = {
  // Create event
  createEvent: async (eventData, imageFile = null) => {
    try {
      let imageUrl = null;

      if (imageFile) {
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const event = {
        ...eventData,
        image: imageUrl,
        attendees: [],
        attendeesCount: 0,
        interested: [],
        interestedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), event);
      return { id: docRef.id, ...event };
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  // Get events
  getEvents: async (limitCount = 20) => {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(eventsRef, orderBy("date", "asc"), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting events:", error);
      throw error;
    }
  },

  // Get event details
  getEvent: async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        return {
          id: eventDoc.id,
          ...data,
          date: data.date?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting event:", error);
      throw error;
    }
  },

  // Join/Leave event
  toggleAttendance: async (eventId, userId, isAttending) => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);

      if (isAttending) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(userId),
          attendeesCount: increment(-1),
        });
      } else {
        await updateDoc(eventRef, {
          attendees: arrayUnion(userId),
          attendeesCount: increment(1),
        });
      }
      return true;
    } catch (error) {
      console.error("Error toggling attendance:", error);
      throw error;
    }
  },

  // Subscribe to events with real-time updates
  subscribeToEvents: (callback, limitCount = 20) => {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(eventsRef, orderBy("date", "asc"), limit(limitCount));

      return onSnapshot(q, (snapshot) => {
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        callback(events);
      });
    } catch (error) {
      console.error("Error subscribing to events:", error);
      throw error;
    }
  },
};

// CHAT SERVICES
export const chatService = {
  // Get user chats
  getUserChats: async (userId) => {
    try {
      const chatsRef = collection(db, COLLECTIONS.CHATS);
      const q = query(
        chatsRef,
        where("participants", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastMessageAt: doc.data().lastMessageAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting user chats:", error);
      throw error;
    }
  },

  // Create or get chat
  createOrGetChat: async (userId1, userId2, user1Data, user2Data) => {
    try {
      const chatId = getChatId(userId1, userId2);
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        return { id: chatDoc.id, ...chatDoc.data() };
      }

      // Create new chat
      const newChat = {
        participants: [userId1, userId2],
        participantsData: {
          [userId1]: user1Data,
          [userId2]: user2Data,
        },
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        unreadCount: { [userId1]: 0, [userId2]: 0 },
        createdAt: serverTimestamp(),
      };

      await setDoc(chatRef, newChat);
      return { id: chatId, ...newChat };
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (chatId, senderId, receiverId, message, type = "text") => {
    try {
      const messageData = {
        chatId,
        senderId,
        receiverId,
        message,
        type,
        createdAt: serverTimestamp(),
        read: false,
      };

      // Add message to messages collection
      await addDoc(collection(db, COLLECTIONS.MESSAGES), messageData);

      // Update chat with last message
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
      await updateDoc(chatRef, {
        lastMessage: message,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${receiverId}`]: increment(1),
      });

      return messageData;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Subscribe to messages
  subscribeToMessages: (chatId, callback) => {
    try {
      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        callback(messages);
      });
    } catch (error) {
      console.error("Error subscribing to messages:", error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId, userId) => {
    try {
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0,
      });

      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        where("receiverId", "==", userId),
        where("read", "==", false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  // Get or create chat (wrapper for createOrGetChat)
  getOrCreateChat: async (userId1, userId2) => {
    try {
      const chatId = getChatId(userId1, userId2);
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        return { id: chatDoc.id, ...chatDoc.data() };
      }

      // Get user data for both users
      const [user1Data, user2Data] = await Promise.all([
        userService.getUser(userId1),
        userService.getUser(userId2),
      ]);

      // Create new chat
      return await chatService.createOrGetChat(
        userId1,
        userId2,
        user1Data,
        user2Data
      );
    } catch (error) {
      console.error("Error getting/creating chat:", error);
      throw error;
    }
  },
};

// NOTIFICATION SERVICES
export const notificationService = {
  // Create notification
  createNotification: async (notificationData) => {
    try {
      const notification = {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        notification
      );
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  // Get user notifications
  getUserNotifications: async (userId, limitCount = 50) => {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true,
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Subscribe to notifications
  subscribeToNotifications: (userId, callback) => {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        callback(notifications);
      });
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      throw error;
    }
  },

  // Create notification and send push
  createNotificationWithPush: async (notificationData, pushData = null) => {
    try {
      // Create database notification
      const notification = await notificationService.createNotification(
        notificationData
      );

      // Send push notification if user has push token
      if (pushData && notificationData.userId) {
        try {
          const pushToken = await userService.getUserPushToken(
            notificationData.userId
          );

          if (pushToken) {
            await notificationService.sendPushNotification(pushToken, pushData);
          }
        } catch (pushError) {
          console.error("Error sending push notification:", pushError);
          // Don't fail the whole operation if push fails
        }
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification with push:", error);
      throw error;
    }
  },

  // Send push notification via Expo Push API
  sendPushNotification: async (pushToken, { title, body, data = {} }) => {
    try {
      const message = {
        to: pushToken,
        sound: "default",
        title,
        body,
        data,
        channelId: data.categoryId || "default",
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Push notification failed: ${responseData.message}`);
      }

      return responseData;
    } catch (error) {
      console.error("Error sending push notification:", error);
      throw error;
    }
  },

  // Batch send push notifications
  sendBatchPushNotifications: async (tokens, { title, body, data = {} }) => {
    try {
      const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data,
        channelId: data.categoryId || "default",
      }));

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `Batch push notification failed: ${responseData.message}`
        );
      }

      return responseData;
    } catch (error) {
      console.error("Error sending batch push notifications:", error);
      throw error;
    }
  },
};

// SEARCH SERVICES
export const searchService = {
  // Search users
  searchUsers: async (query, limitCount = 20) => {
    try {
      if (!query || query.trim().length < 2) return [];

      const usersRef = collection(db, COLLECTIONS.USERS);
      const searchQuery = query.toLowerCase().trim();

      // Search by fullName (case-insensitive)
      const nameQuery = query(
        usersRef,
        where("fullName", ">=", searchQuery),
        where("fullName", "<=", searchQuery + "\uf8ff"),
        limit(limitCount)
      );

      // Search by username (case-insensitive)
      const usernameQuery = query(
        usersRef,
        where("username", ">=", searchQuery),
        where("username", "<=", searchQuery + "\uf8ff"),
        limit(limitCount)
      );

      const [nameSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(usernameQuery),
      ]);

      const users = new Map();

      // Combine results and remove duplicates
      nameSnapshot.docs.forEach((doc) => {
        users.set(doc.id, { id: doc.id, ...doc.data() });
      });

      usernameSnapshot.docs.forEach((doc) => {
        users.set(doc.id, { id: doc.id, ...doc.data() });
      });

      return Array.from(users.values());
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Search posts
  searchPosts: async (query, limitCount = 20) => {
    try {
      if (!query || query.trim().length < 2) return [];

      const postsRef = collection(db, COLLECTIONS.POSTS);
      const searchQuery = query.toLowerCase().trim();

      // Note: This is a basic search. For production, consider using Algolia or similar
      const q = query(
        postsRef,
        where("content", ">=", searchQuery),
        where("content", "<=", searchQuery + "\uf8ff"),
        orderBy("content"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error searching posts:", error);
      throw error;
    }
  },

  // Search events
  searchEvents: async (query, limitCount = 20) => {
    try {
      if (!query || query.trim().length < 2) return [];

      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const searchQuery = query.toLowerCase().trim();

      // Search by title
      const titleQuery = query(
        eventsRef,
        where("title", ">=", searchQuery),
        where("title", "<=", searchQuery + "\uf8ff"),
        limit(limitCount)
      );

      // Search by description
      const descQuery = query(
        eventsRef,
        where("description", ">=", searchQuery),
        where("description", "<=", searchQuery + "\uf8ff"),
        limit(limitCount)
      );

      const [titleSnapshot, descSnapshot] = await Promise.all([
        getDocs(titleQuery),
        getDocs(descQuery),
      ]);

      const events = new Map();

      titleSnapshot.docs.forEach((doc) => {
        events.set(doc.id, {
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        });
      });

      descSnapshot.docs.forEach((doc) => {
        events.set(doc.id, {
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        });
      });

      return Array.from(events.values());
    } catch (error) {
      console.error("Error searching events:", error);
      throw error;
    }
  },

  // Get trending/suggested users
  getSuggestedUsers: async (currentUserId, limitCount = 10) => {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where("id", "!=", currentUserId),
        orderBy("followersCount", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting suggested users:", error);
      throw error;
    }
  },
};

// STORY SERVICES
export const storyService = {
  // Create story
  createStory: async (storyData) => {
    try {
      const story = {
        ...storyData,
        id: Date.now().toString(),
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        views: [],
        viewsCount: 0,
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.STORIES), story);
      return { id: docRef.id, ...story };
    } catch (error) {
      console.error("Error creating story:", error);
      throw error;
    }
  },

  // Get user stories (active only)
  getUserStories: async (userId) => {
    try {
      const storiesRef = collection(db, COLLECTIONS.STORIES);
      const now = new Date();
      const q = query(
        storiesRef,
        where("userId", "==", userId),
        where("expiresAt", ">", now),
        orderBy("expiresAt"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting user stories:", error);
      throw error;
    }
  },

  // Get all active stories (for home feed)
  getActiveStories: async (followingUserIds = [], limitCount = 50) => {
    try {
      const storiesRef = collection(db, COLLECTIONS.STORIES);
      const now = new Date();

      // Get stories from followed users
      let stories = [];

      if (followingUserIds.length > 0) {
        // Firestore 'in' query limit is 10, so we need to batch
        const batches = [];
        for (let i = 0; i < followingUserIds.length; i += 10) {
          const batch = followingUserIds.slice(i, i + 10);
          const q = query(
            storiesRef,
            where("userId", "in", batch),
            where("expiresAt", ">", now),
            orderBy("expiresAt"),
            orderBy("createdAt", "desc")
          );
          batches.push(getDocs(q));
        }

        const snapshots = await Promise.all(batches);
        snapshots.forEach((snapshot) => {
          stories.push(
            ...snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              expiresAt: doc.data().expiresAt?.toDate(),
            }))
          );
        });
      }

      // Sort by creation time and limit
      stories.sort((a, b) => b.createdAt - a.createdAt);
      return stories.slice(0, limitCount);
    } catch (error) {
      console.error("Error getting active stories:", error);
      throw error;
    }
  },

  // Subscribe to stories
  subscribeToStories: (followingUserIds, callback) => {
    try {
      const storiesRef = collection(db, COLLECTIONS.STORIES);
      const now = new Date();

      // For real-time updates, we'll listen to all active stories
      // In production, you might want to optimize this
      const q = query(
        storiesRef,
        where("expiresAt", ">", now),
        orderBy("expiresAt"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const stories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate(),
        }));

        // Filter to only followed users' stories
        const filteredStories = stories.filter((story) =>
          followingUserIds.includes(story.userId)
        );

        callback(filteredStories);
      });
    } catch (error) {
      console.error("Error subscribing to stories:", error);
      throw error;
    }
  },

  // View story (add to views)
  viewStory: async (storyId, viewerId) => {
    try {
      const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
      await updateDoc(storyRef, {
        views: arrayUnion(viewerId),
        viewsCount: increment(1),
      });
      return true;
    } catch (error) {
      console.error("Error viewing story:", error);
      throw error;
    }
  },

  // Delete story
  deleteStory: async (storyId) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STORIES, storyId));
      return true;
    } catch (error) {
      console.error("Error deleting story:", error);
      throw error;
    }
  },

  // Clean up expired stories (utility function)
  cleanupExpiredStories: async () => {
    try {
      const storiesRef = collection(db, COLLECTIONS.STORIES);
      const now = new Date();
      const q = query(storiesRef, where("expiresAt", "<=", now));

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.docs.length} expired stories`);
      return snapshot.docs.length;
    } catch (error) {
      console.error("Error cleaning up expired stories:", error);
      throw error;
    }
  },
};

// STORAGE SERVICES
export const storageService = {
  // Upload image
  uploadImage: async (file, fileName) => {
    try {
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  // Delete image
  deleteImage: async (imageUrl) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },
};

// CALL SERVICE
export const callService = {
  // Send call notification to user
  sendCallNotification: async (
    callerId,
    receiverId,
    channelName,
    callType = "voice"
  ) => {
    try {
      const callerDoc = await getDoc(doc(db, COLLECTIONS.USERS, callerId));
      const callerData = callerDoc.data();

      // Create notification data
      const notificationData = {
        userId: receiverId,
        fromUserId: callerId,
        type: callType === "voice" ? "call_voice" : "call_video",
        message: `${callerData?.fullName || "Someone"} is calling you`,
        data: {
          channelName,
          callerId,
          callerName: callerData?.fullName,
          callerAvatar: callerData?.avatar,
          callType,
        },
      };

      // Create push notification data
      const pushData = {
        title:
          callType === "voice"
            ? "📞 Incoming Voice Call"
            : "📹 Incoming Video Call",
        body: `${callerData?.fullName || "Someone"} is calling you`,
        data: {
          type: callType === "voice" ? "call_voice" : "call_video",
          channelName,
          callerId,
          callerName: callerData?.fullName,
          callerAvatar: callerData?.avatar,
          callType,
          categoryId: "calls",
        },
      };

      // Create notification with push
      await notificationService.createNotificationWithPush(
        notificationData,
        pushData
      );

      return true;
    } catch (error) {
      console.error("Error sending call notification:", error);
      throw error;
    }
  },
};
