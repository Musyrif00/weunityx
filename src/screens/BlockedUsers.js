import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  IconButton,
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { Card, User } from "../components";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { blockingService } from "../services/firebase";

const BlockedUsersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const blocked = await blockingService.getBlockedUsers(user.uid);
      setBlockedUsers(blocked);
    } catch (error) {
      console.error("Error loading blocked users:", error);
      Alert.alert("Error", "Failed to load blocked users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBlockedUsers();
  };

  const handleUnblockUser = async (blockedUser) => {
    try {
      Alert.alert(
        "Unblock User",
        `Are you sure you want to unblock ${
          blockedUser.fullName || blockedUser.name
        }?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unblock",
            onPress: async () => {
              await blockingService.unblockUser(user.uid, blockedUser.id);
              setBlockedUsers((prev) =>
                prev.filter((u) => u.id !== blockedUser.id)
              );
              Alert.alert("Success", "User has been unblocked");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error unblocking user:", error);
      Alert.alert("Error", "Failed to unblock user");
    }
  };

  const renderBlockedUser = ({ item }) => (
    <Card style={styles.userCard}>
      <View style={styles.userContainer}>
        <User
          user={{
            ...item,
            avatar:
              item.avatar ||
              item.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                item.fullName || item.name || "User"
              )}&background=702963&color=fff`,
            name: item.fullName || item.name || "Unknown User",
            username: item.username || item.email?.split("@")[0] || "user",
          }}
          size="medium"
        />
        <Button
          mode="outlined"
          onPress={() => handleUnblockUser(item)}
          style={styles.unblockButton}
          compact
        >
          Unblock
        </Button>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon="account-cancel"
          size={64}
          iconColor={staticTheme.colors.textSecondary}
        />
        <Text style={styles.emptyText}>No blocked users</Text>
        <Text style={styles.emptySubtext}>You haven't blocked anyone yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
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
  userCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unblockButton: {
    borderColor: staticTheme.colors.primary,
  },
});

export default BlockedUsersScreen;
