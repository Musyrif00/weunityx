import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
} from "react-native";
import { Video } from "expo-av";
import {
  Text,
  IconButton,
  Avatar,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { Card, User, HeaderLogo } from "../components";
import ReportModal from "../components/ReportModal";
import { theme as staticTheme, spacing } from "../constants";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  postService,
  userService,
  storyService,
  savedPostsService,
} from "../services/firebase";

const PostCard = ({
  post,
  user: postUser,
  onLike,
  onComment,
  onSave,
  navigation,
}) => {
  const { user: currentUser } = useAuth();

  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;

  const [liked, setLiked] = useState(
    post.likes?.includes(currentUser?.uid) || false
  );
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);

  // Check if post is saved when component mounts
  useEffect(() => {
    if (!currentUser) return;

    const checkIfSaved = async () => {
      try {
        const isSaved = await savedPostsService.isPostSaved(
          currentUser.uid,
          post.id
        );
        setSaved(isSaved);
      } catch (error) {
        console.error("Error checking if post is saved:", error);
      }
    };

    checkIfSaved();
  }, [currentUser?.uid, post.id]);

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      const wasLiked = liked;
      setLiked(!liked);
      setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

      // Get current user data for notification
      const currentUserData = await userService.getUser(currentUser.uid);

      await postService.toggleLike(
        post.id,
        currentUser.uid,
        wasLiked,
        currentUserData
      );
      onLike?.(post.id, !wasLiked);
    } catch (error) {
      // Revert optimistic update on error
      setLiked(liked);
      setLikesCount(post.likesCount || 0);
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to update like status");
    }
  };

  const handleComment = () => {
    onComment?.(post);
  };

  const handleSave = async () => {
    try {
      const wasSaved = saved;
      setSaved(!saved);

      await savedPostsService.toggleSavePost(
        currentUser.uid,
        post.id,
        wasSaved
      );
      onSave?.(post.id, !wasSaved);
    } catch (error) {
      // Revert optimistic update on error
      setSaved(saved);
      console.error("Error toggling save:", error);
      Alert.alert("Error", "Failed to save/unsave post");
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `Check out this post by ${
        postUser?.fullName || "someone"
      } on WeUnityX!\n\n"${post.content || "New post"}"`;

      const result = await Share.share({
        message: shareContent,
        title: "Share Post from WeUnityX",
      });

      if (result.action === Share.sharedAction) {
        // Post was shared successfully
        // Share functionality here
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      Alert.alert("Error", "Failed to share post");
    }
  };

  const handleBlockUser = async () => {
    try {
      Alert.alert(
        "Block User",
        `Are you sure you want to block ${
          postUser?.fullName || "this user"
        }? You won't see their posts anymore.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block",
            style: "destructive",
            onPress: async () => {
              await blockingService.blockUser(currentUser.uid, post.userId);
              Alert.alert("Success", "User has been blocked");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error blocking user:", error);
      Alert.alert("Error", "Failed to block user");
    }
  };

  const handleReportPost = () => {
    setShowReportModal(true);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const postTime = new Date(timestamp);
    const diff = now - postTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return postTime.toLocaleDateString();
  };

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  return (
    <>
      <Card style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={{ flex: 1 }}>
            <User
              user={postUser}
              onPress={(user) => {
                navigation.navigate("UserProfile", { user });
              }}
            />
          </View>
          {post.userId !== currentUser.uid && (
            <IconButton
              icon="dots-vertical"
              onPress={() => {
                Alert.alert("Post Options", "What would you like to do?", [
                  { text: "Report Post", onPress: handleReportPost },
                  { text: "Block User", onPress: handleBlockUser },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
            />
          )}
        </View>

        {post.content && <Text style={styles.postContent}>{post.content}</Text>}

        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}

        {post.video && (
          <Video
            source={{ uri: post.video }}
            style={styles.postVideo}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
          />
        )}

        {post.location && (
          <Chip icon="map-marker" style={styles.locationChip}>
            {post.location}
          </Chip>
        )}

        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <IconButton
              icon={liked ? "heart" : "heart-outline"}
              iconColor={
                liked
                  ? staticTheme.colors.error
                  : staticTheme.colors.textSecondary
              }
              onPress={handleLike}
            />
            <Text style={styles.actionText}>{likesCount}</Text>

            <IconButton
              icon="comment-outline"
              iconColor={staticTheme.colors.textSecondary}
              onPress={handleComment}
            />
            <Text style={styles.actionText}>{post.commentsCount || 0}</Text>

            <IconButton
              icon="share-outline"
              iconColor={staticTheme.colors.textSecondary}
              onPress={handleShare}
            />
          </View>

          <IconButton
            icon={saved ? "bookmark" : "bookmark-outline"}
            iconColor={
              saved
                ? staticTheme.colors.primary
                : staticTheme.colors.textSecondary
            }
            onPress={handleSave}
          />
        </View>

        <Text style={styles.timestamp}>{formatTimestamp(post.createdAt)}</Text>
      </Card>

      <ReportModal
        visible={showReportModal}
        onDismiss={() => setShowReportModal(false)}
        contentType="post"
        contentId={post.id}
        contentOwnerId={post.userId}
        reporterId={currentUser.uid}
      />
    </>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time posts
    const unsubscribe = postService.subscribeToPosts((postsData) => {
      setPosts(postsData);
      setLoading(false);

      // Load user data for posts
      loadUsersData(postsData);
    });

    // Load stories
    loadStories();

    return () => unsubscribe?.();
  }, [user]);

  const loadStories = async () => {
    if (!user) return;

    try {
      // For now, get all active stories. In production, you'd get from followed users
      const followingUserIds = [user.uid]; // Add followed user IDs here
      const activeStories = await storyService.getActiveStories(
        followingUserIds
      );

      // Group stories by user
      const groupedStories = {};
      activeStories.forEach((story) => {
        if (!groupedStories[story.userId]) {
          groupedStories[story.userId] = [];
        }
        groupedStories[story.userId].push(story);
      });

      // Convert to array with user info
      const storiesArray = Object.keys(groupedStories).map((userId) => ({
        userId,
        stories: groupedStories[userId],
        hasUnviewed: groupedStories[userId].some(
          (story) => !story.views?.includes(user.uid)
        ),
      }));

      setStories(storiesArray);
    } catch (error) {
      console.error("Error loading stories:", error);
    }
  };

  const loadUsersData = async (postsData) => {
    try {
      const userIds = [...new Set(postsData.map((post) => post.userId))];
      const usersData = {};

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userData = await userService.getUser(userId);
            if (userData) {
              usersData[userId] = userData;
            }
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error);
          }
        })
      );

      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStories();
    } catch (error) {
      console.error("Error refreshing:", error);
    }
    // The subscription will automatically update the data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = useCallback(
    (postId, isLiked) => {
      // Update local state for immediate feedback
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: (post.likesCount || 0) + (isLiked ? 1 : -1),
                likes: isLiked
                  ? [...(post.likes || []), user.uid]
                  : (post.likes || []).filter((uid) => uid !== user.uid),
              }
            : post
        )
      );
    },
    [user]
  );

  const handleComment = useCallback(
    (post) => {
      // Convert Date objects to ISO strings for navigation serialization
      const serializablePost = {
        ...post,
        createdAt: post.createdAt?.toISOString() || null,
        updatedAt: post.updatedAt?.toISOString() || null,
      };
      navigation.navigate("Comments", { post: serializablePost });
    },
    [navigation]
  );

  const handleSave = useCallback((postId, isSaved) => {
    // Post save/unsave functionality completed
    // Implement save to user's saved posts
  }, []);

  const StoryItem = ({ storyData }) => {
    const storyUser = users[storyData.userId] || {
      id: storyData.userId,
      fullName: "User",
      avatar: null,
    };

    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => handleViewStory(storyData)}
      >
        <View
          style={[
            styles.storyAvatar,
            storyData.hasUnviewed && styles.unviewedStory,
          ]}
        >
          <Avatar.Image
            source={{
              uri:
                storyUser.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  storyUser.fullName || "User"
                )}&background=702963&color=fff`,
            }}
            size={60}
          />
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {storyUser.fullName || "User"}
        </Text>
      </TouchableOpacity>
    );
  };

  const AddStoryItem = () => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => navigation.navigate("NewStory")}
    >
      <View style={styles.addStoryAvatar}>
        <Avatar.Image
          source={{
            uri:
              user.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.displayName || "You"
              )}&background=6366f1&color=fff`,
          }}
          size={60}
        />
        <View style={styles.addStoryIcon}>
          <IconButton
            icon="plus"
            iconColor={staticTheme.colors.surface}
            size={16}
          />
        </View>
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        Your Story
      </Text>
    </TouchableOpacity>
  );

  const StoriesSection = () => {
    if (stories.length === 0) return null;

    return (
      <View style={styles.storiesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          <AddStoryItem />
          {stories.map((storyData) => (
            <StoryItem key={storyData.userId} storyData={storyData} />
          ))}
        </ScrollView>
      </View>
    );
  };

  const handleViewStory = async (storyData) => {
    try {
      // Mark story as viewed
      for (const story of storyData.stories) {
        if (!story.views?.includes(user.uid)) {
          await storyService.viewStory(story.id, user.uid);
        }
      }

      // Update local state
      setStories((prev) =>
        prev.map((s) =>
          s.userId === storyData.userId ? { ...s, hasUnviewed: false } : s
        )
      );

      // Navigate to story viewer (you can implement this screen later)
      Alert.alert(
        "Story Viewer",
        "Story viewing interface will be implemented next!"
      );
    } catch (error) {
      console.error("Error viewing story:", error);
      Alert.alert("Error", "Failed to view story");
    }
  };

  const renderPost = useCallback(
    ({ item }) => {
      const postUser = users[item.userId] || {
        id: item.userId,
        fullName: "Unknown User",
        name: "Unknown User",
        displayName: "Unknown User",
        username: "unknown",
        avatar: `https://ui-avatars.com/api/?name=Unknown+User&background=702963&color=fff`,
        verified: false,
      };

      // User data properly loaded

      return (
        <PostCard
          post={item}
          user={postUser}
          onLike={handleLike}
          onComment={handleComment}
          onSave={handleSave}
          navigation={navigation}
        />
      );
    },
    [users, handleLike, handleComment, handleSave]
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="post-outline"
        size={64}
        iconColor={staticTheme.colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>Welcome to WeUnityX!</Text>
      <Text style={styles.emptySubtitle}>
        Start following people or create your first post to see content here.
      </Text>
      <View style={styles.emptyActions}>
        <IconButton
          icon="plus"
          mode="contained-tonal"
          onPress={() => navigation.navigate("NewPost")}
          style={styles.emptyActionButton}
        >
          Create Post
        </IconButton>
        <IconButton
          icon="account-search"
          mode="outlined"
          onPress={() => navigation.navigate("Search")}
          style={styles.emptyActionButton}
        >
          Find People
        </IconButton>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={staticTheme.colors.primary}
          style={{ flex: 1, justifyContent: "center" }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HeaderLogo />
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="plus"
            onPress={() => navigation.navigate("NewPost")}
          />
          <IconButton
            icon="bell-outline"
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        extraData={users}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.emptyListContent,
        ]}
        ListHeaderComponent={<StoriesSection />}
        ListEmptyComponent={<EmptyState />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileAvatar: {
    marginRight: spacing.sm,
  },
  headerLogo: {
    width: 100,
    height: 28,
    resizeMode: "contain",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
  },
  userGreeting: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
    marginTop: 2,
  },
  headerLogo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
  },
  headerActions: {
    flexDirection: "row",
  },
  listContent: {
    padding: spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  postCard: {
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: staticTheme.colors.text,
    marginVertical: spacing.sm,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: spacing.sm,
  },
  postVideo: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: spacing.sm,
    backgroundColor: staticTheme.colors.surface,
  },
  locationChip: {
    alignSelf: "flex-start",
    marginVertical: spacing.sm,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginRight: spacing.md,
  },
  timestamp: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  emptyActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  emptyActionButton: {
    marginHorizontal: spacing.sm,
  },
  // Stories Styles
  storiesContainer: {
    backgroundColor: staticTheme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
    paddingVertical: spacing.sm,
  },
  storiesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: "center",
    width: 80,
  },
  storyAvatar: {
    marginBottom: spacing.xs,
  },
  unviewedStory: {
    padding: 3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: staticTheme.colors.primary,
  },
  addStoryAvatar: {
    position: "relative",
    marginBottom: spacing.xs,
  },
  addStoryIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  storyUsername: {
    fontSize: 12,
    color: staticTheme.colors.text,
    textAlign: "center",
    maxWidth: 80,
  },
});

export default HomeScreen;
