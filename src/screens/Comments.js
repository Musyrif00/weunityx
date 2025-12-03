import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { postService, userService } from "../services/firebase";

const CommentsScreen = ({ route, navigation }) => {
  const { post } = route.params || {};
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (post) {
      loadComments();
    }
  }, [post]);

  const loadComments = async () => {
    try {
      setLoading(true);
      // Get comments from post data
      const postComments = post.comments || [];

      // Convert ISO strings back to Date objects if needed
      const commentsWithDates = postComments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
      }));

      setComments(commentsWithDates);

      // Load user data for each comment
      const userIds = [
        ...new Set(postComments.map((comment) => comment.userId)),
      ];
      const userData = {};

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userInfo = await userService.getUser(userId);
            userData[userId] = userInfo;
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error);
          }
        })
      );

      setUsers(userData);
    } catch (error) {
      console.error("Error loading comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    const commentText = newComment.trim();
    const tempCommentId = Date.now().toString();
    setSubmitting(true);

    try {
      const commentData = {
        userId: user.uid,
        text: commentText,
      };

      // Optimistic update
      const tempComment = {
        ...commentData,
        id: tempCommentId,
        createdAt: new Date(),
      };
      setComments((prev) => [...prev, tempComment]);
      setNewComment("");

      // Get current user data for notification
      const currentUserData = await userService.getUser(user.uid);

      // Add to Firebase
      const newCommentData = await postService.addComment(
        post.id,
        commentData,
        currentUserData
      );

      // Update with real comment data
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === tempCommentId
            ? { ...newCommentData, userId: user.uid }
            : comment
        )
      );

      // Add current user to users if not already there
      if (!users[user.uid]) {
        setUsers((prev) => ({
          ...prev,
          [user.uid]: {
            id: user.uid,
            fullName: user.displayName || "You",
            avatar: user.photoURL,
          },
        }));
      }
    } catch (error) {
      // Remove optimistic update on error
      setComments((prev) =>
        prev.filter((comment) => comment.id !== tempCommentId)
      );
      setNewComment(commentText);
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";

    const commentDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const renderComment = ({ item: comment }) => {
    const commentUser = users[comment.userId];

    return (
      <View style={styles.commentContainer}>
        <Avatar.Image
          source={{
            uri:
              commentUser?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                commentUser?.fullName || "User"
              )}&background=702963&color=fff`,
          }}
          size={36}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <TouchableOpacity
              onPress={() => {
                if (commentUser && comment.userId !== user.uid) {
                  navigation.navigate("UserProfile", { user: commentUser });
                }
              }}
            >
              <Text style={styles.commentUserName}>
                {commentUser?.fullName || "User"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
          <Text style={styles.commentTime}>
            {formatTime(comment.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          iconColor={staticTheme.colors.text}
        />
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 40 }} />
      </View>

      <Divider />

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={staticTheme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={styles.commentsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment!</Text>
            </View>
          }
        />
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <Divider />
        <View style={styles.inputRow}>
          <Avatar.Image
            source={{
              uri:
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.displayName || "You"
                )}&background=702963&color=fff`,
            }}
            size={32}
            style={styles.inputAvatar}
          />
          <TextInput
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            style={styles.textInput}
            contentStyle={styles.textInputContent}
            disabled={submitting}
          />
          <IconButton
            icon="send"
            disabled={!newComment.trim() || submitting}
            onPress={handleSubmitComment}
            iconColor={
              newComment.trim() && !submitting
                ? staticTheme.colors.primary
                : staticTheme.colors.disabled
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: staticTheme.colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  commentsList: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  commentContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "flex-start",
  },
  commentAvatar: {
    marginRight: spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.xs,
  },
  commentText: {
    fontSize: 16,
    color: staticTheme.colors.text,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  inputContainer: {
    backgroundColor: staticTheme.colors.background,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputAvatar: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: staticTheme.colors.surface,
    marginRight: spacing.sm,
    maxHeight: 100,
  },
  textInputContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
  },
  errorText: {
    fontSize: 18,
    color: staticTheme.colors.textSecondary,
  },
});

export default CommentsScreen;
