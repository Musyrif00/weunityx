import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  IconButton,
  Button as PaperButton,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { Card } from "../../components";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { userService, postService } from "../../services/firebase";

const UserProfileScreen = ({ route, navigation }) => {
  const { user: targetUser } = route.params || {};
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUser.uid === targetUser?.id;

  useEffect(() => {
    if (targetUser?.id) {
      loadUserData();
    }
  }, [targetUser?.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const profile = await userService.getUser(targetUser.id);

      // Check if profile exists (user might be deleted)
      if (!profile) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Ensure profile has default values for arrays and counts
      const safeProfile = {
        ...profile,
        followers: profile.followers || [],
        following: profile.following || [],
        followersCount: profile.followersCount || 0,
        followingCount: profile.followingCount || 0,
      };

      setUserProfile(safeProfile);

      // Check if current user is following this user
      if (!isOwnProfile) {
        setIsFollowing(
          safeProfile.followers.includes(currentUser.uid) || false
        );
      }

      // Load user posts
      const posts = await postService.getUserPosts(targetUser.id, 10);
      setUserPosts(posts);
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;

    setFollowLoading(true);
    try {
      await userService.toggleFollow(
        currentUser.uid,
        targetUser.id,
        isFollowing
      );
      setIsFollowing(!isFollowing);

      // Update local follower count
      setUserProfile((prev) => ({
        ...prev,
        followersCount: isFollowing
          ? (prev.followersCount || 0) - 1
          : (prev.followersCount || 0) + 1,
      }));
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const PostItem = ({ post }) => (
    <TouchableOpacity style={styles.postItem}>
      {post.image ? (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      ) : (
        <View style={styles.textPost}>
          <Text style={styles.postText} numberOfLines={3}>
            {post.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <IconButton
          icon="account-off"
          size={64}
          iconColor={staticTheme.colors.textSecondary}
        />
        <Text style={styles.errorText}>User not found</Text>
        <PaperButton
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </PaperButton>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{userProfile.fullName || "User"}</Text>
        <IconButton
          icon="dots-vertical"
          onPress={() => {
            /* More options */
          }}
        />
      </View>

      {/* Profile Info */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri:
                userProfile.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userProfile.fullName || "User"
                )}&background=702963&color=fff`,
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{userProfile.fullName || "User"}</Text>
            <Text style={styles.username}>@{userProfile.username}</Text>
            {userProfile.location && (
              <Text style={styles.location}>📍 {userProfile.location}</Text>
            )}
          </View>
          {!isOwnProfile && (
            <PaperButton
              mode={isFollowing ? "outlined" : "contained"}
              onPress={handleFollowToggle}
              loading={followLoading}
              disabled={followLoading}
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              labelStyle={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isFollowing ? "Following" : "Follow"}
            </PaperButton>
          )}
        </View>

        {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}

        {userProfile.website && (
          <TouchableOpacity style={styles.websiteContainer}>
            <Text style={styles.website}>🔗 {userProfile.website}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.stats}>
          <StatItem label="Posts" value={userPosts.length} />
          <StatItem label="Followers" value={userProfile.followersCount} />
          <StatItem label="Following" value={userProfile.followingCount} />
        </View>
      </Card>

      {/* Posts Grid */}
      <Card style={styles.postsCard}>
        <Text style={styles.postsTitle}>Posts</Text>
        <Divider style={styles.divider} />

        {userPosts.length > 0 ? (
          <View style={styles.postsGrid}>
            {userPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyPosts}>
            <IconButton
              icon="camera-outline"
              size={48}
              iconColor={staticTheme.colors.textSecondary}
            />
            <Text style={styles.emptyPostsText}>
              {isOwnProfile
                ? "You haven't shared any posts yet"
                : "No posts yet"}
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: staticTheme.colors.text,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  profileCard: {
    margin: spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  followButton: {
    marginLeft: spacing.sm,
    borderRadius: 20,
  },
  followingButton: {
    borderColor: staticTheme.colors.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: staticTheme.colors.primary,
  },
  bio: {
    fontSize: 16,
    color: staticTheme.colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  websiteContainer: {
    marginBottom: spacing.md,
  },
  website: {
    fontSize: 14,
    color: staticTheme.colors.primary,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.border,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  postsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
  },
  divider: {
    marginBottom: spacing.md,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  postItem: {
    width: "32%",
    aspectRatio: 1,
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  textPost: {
    backgroundColor: staticTheme.colors.surface,
    padding: spacing.sm,
    justifyContent: "center",
    height: "100%",
  },
  postText: {
    fontSize: 12,
    color: staticTheme.colors.text,
    textAlign: "center",
  },
  emptyPosts: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyPostsText: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});

export default UserProfileScreen;
