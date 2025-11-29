import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image, Alert } from "react-native";
import {
  Text,
  IconButton,
  Button,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { Card, HeaderLogo } from "../../components";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { userService, postService } from "../../services/firebase";

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadUserData();
    }
  }, [user?.uid]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load user profile data
      const profile = await userService.getUser(user.uid);

      // Ensure profile has default values
      const followers = profile?.followers || [];
      const following = profile?.following || [];

      const safeProfile = {
        ...profile,
        followers,
        following,
        followersCount: profile?.followersCount ?? followers.length,
        followingCount: profile?.followingCount ?? following.length,
        bio: profile?.bio || "Welcome to my WeUnityX profile! 🚀",
        fullName: profile?.fullName || user?.displayName || "User",
        avatar: profile?.avatar || user?.photoURL,
      };

      setUserProfile(safeProfile);

      // Load user posts
      const posts = await postService.getUserPosts(user.uid);
      setUserPosts(posts);
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HeaderLogo />
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="cog"
            onPress={() => navigation.navigate("Settings")}
          />
          <IconButton icon="logout" onPress={handleLogout} />
        </View>
      </View>

      <Card style={styles.profileCard}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={staticTheme.colors.primary}
            />
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <Image
                source={{
                  uri:
                    userProfile?.avatar ||
                    user?.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userProfile?.fullName || user?.displayName || "User"
                    )}&background=702963&color=fff`,
                }}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.name}>
                  {userProfile?.fullName || user?.displayName || "User"}
                </Text>
                <Text style={styles.email}>{user?.email}</Text>
                {userProfile?.username && (
                  <Text style={styles.username}>@{userProfile.username}</Text>
                )}
              </View>
              <IconButton
                icon="pencil"
                onPress={() => navigation.navigate("EditProfile")}
              />
            </View>

            <View style={styles.stats}>
              <StatItem label="Posts" value={userPosts.length || 0} />
              <StatItem
                label="Followers"
                value={userProfile?.followersCount || 0}
              />
              <StatItem
                label="Following"
                value={userProfile?.followingCount || 0}
              />
            </View>

            <Text style={styles.bio}>
              {userProfile?.bio || "Welcome to my WeUnityX profile! 🚀"}
            </Text>
          </>
        )}
      </Card>

      <Card style={styles.menuCard}>
        <Text style={styles.menuTitle}>Menu</Text>

        <View style={styles.menuItem}>
          <IconButton icon="video-wireless" />
          <Text style={styles.menuText}>Go Live</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => navigation.navigate("LiveStream")}
          />
        </View>

        <Divider />

        <View style={styles.menuItem}>
          <IconButton icon="account-group" />
          <Text style={styles.menuText}>Friends</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => navigation.navigate("Friends")}
          />
        </View>

        <Divider />

        <View style={styles.menuItem}>
          <IconButton icon="bookmark" />
          <Text style={styles.menuText}>Saved Posts</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => navigation.navigate("SavedPosts")}
          />
        </View>

        <Divider />

        <View style={styles.menuItem}>
          <IconButton icon="cog" />
          <Text style={styles.menuText}>Settings</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => navigation.navigate("Settings")}
          />
        </View>
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
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
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
  },
  headerLogo: {
    width: 100,
    height: 28,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  headerActions: {
    flexDirection: "row",
  },
  profileCard: {
    margin: spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 24,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  username: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.lg,
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
  bio: {
    fontSize: 16,
    color: staticTheme.colors.text,
    lineHeight: 24,
  },
  menuCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: staticTheme.colors.text,
  },
});

export default ProfileScreen;
