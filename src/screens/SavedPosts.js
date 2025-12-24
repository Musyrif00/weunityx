import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { Text, IconButton, ActivityIndicator, Chip } from "react-native-paper";
import { Card, User } from "../components";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import {
  savedPostsService,
  userService,
  postService,
} from "../services/firebase";

const SavedPostCard = ({ post, user: postUser, onUnsave, onComment }) => {
  const { user: currentUser } = useAuth();
  const [liked, setLiked] = useState(
    post.likes?.includes(currentUser.uid) || false
  );
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const handleLike = async () => {
    try {
      const wasLiked = liked;
      setLiked(!liked);
      setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

      await postService.toggleLike(post.id, currentUser.uid, wasLiked);
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

  const handleUnsave = async () => {
    try {
      await savedPostsService.toggleSavePost(currentUser.uid, post.id, true);
      onUnsave?.(post.id);
    } catch (error) {
      console.error("Error unsaving post:", error);
      Alert.alert("Error", "Failed to unsave post");
    }
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

  return (
    <Card style={styles.postCard}>
      <User
        user={postUser}
        subtitle={formatTimestamp(post.createdAt)}
        onPress={() => {
          /* Navigate to user profile */
        }}
      />

      {post.content && <Text style={styles.postContent}>{post.content}</Text>}

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
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
        </View>

        <IconButton
          icon="bookmark"
          iconColor={staticTheme.colors.primary}
          onPress={handleUnsave}
        />
      </View>
    </Card>
  );
};

const SavedPostsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);

      // Subscribe to saved posts
      const unsubscribe = savedPostsService.subscribeToSavedPosts(
        user.uid,
        async (postsData) => {
          setSavedPosts(postsData);

          // Load user data for post authors
          const userIds = [...new Set(postsData.map((p) => p.userId))];
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
          setLoading(false);
          setRefreshing(false);
        }
      );

      return () => unsubscribe?.();
    } catch (error) {
      console.error("Error loading saved posts:", error);
      Alert.alert("Error", "Failed to load saved posts");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedPosts();
  };

  const handleUnsave = (postId) => {
    setSavedPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleComment = (post) => {
    navigation.navigate("Comments", {
      post: {
        ...post,
        createdAt: post.createdAt?.toISOString?.() || post.createdAt,
      },
      user: users[post.userId],
    });
  };

  const renderSavedPost = ({ item }) => {
    const postUser = users[item.userId];

    // Skip rendering if user data not loaded yet
    if (!postUser) {
      return null;
    }

    return (
      <SavedPostCard
        post={item}
        user={postUser}
        onUnsave={handleUnsave}
        onComment={handleComment}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No saved posts yet</Text>
        <Text style={styles.emptySubtext}>
          Save posts by tapping the bookmark icon
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={savedPosts}
        renderItem={renderSavedPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    padding: spacing.md,
  },
  postCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: staticTheme.colors.text,
    marginBottom: spacing.md,
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: spacing.md,
    resizeMode: "cover",
  },
  locationChip: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.border,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginRight: spacing.sm,
  },
});

export default SavedPostsScreen;
