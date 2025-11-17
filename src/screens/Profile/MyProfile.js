import React from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Text, IconButton, Button, Divider } from "react-native-paper";
import { Card } from "../../components";
import { theme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

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
          <Image
            source={require("../../../assets/inlinelogo.jpg")}
            style={styles.headerLogo}
          />
          <Text style={styles.title}>Profile</Text>
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
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri:
                user?.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.displayName || "User"
                )}&background=6366f1&color=fff`,
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.displayName || "User"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <IconButton
            icon="pencil"
            onPress={() => navigation.navigate("EditProfile")}
          />
        </View>

        <View style={styles.stats}>
          <StatItem label="Posts" value="12" />
          <StatItem label="Followers" value="234" />
          <StatItem label="Following" value="89" />
        </View>

        <Text style={styles.bio}>Welcome to my WeUnityX profile! 🚀</Text>
      </Card>

      <Card style={styles.menuCard}>
        <Text style={styles.menuTitle}>Menu</Text>

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
          <IconButton icon="chevron-right" />
        </View>

        <Divider />

        <View style={styles.menuItem}>
          <IconButton icon="calendar" />
          <Text style={styles.menuText}>My Events</Text>
          <IconButton icon="chevron-right" />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
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
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  menuCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
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
    color: theme.colors.text,
  },
});

export default ProfileScreen;
