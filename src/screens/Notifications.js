import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image, Alert } from "react-native";
import {
  Text,
  IconButton,
  Avatar,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { Card } from "../components";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { notificationService, userService } from "../services/firebase";

const NotificationItem = ({ notification, onPress, users }) => {
  const notificationUser = users[notification.fromUserId] || {
    fullName: "Unknown User",
    avatar: null,
  };

  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return "heart";
      case "comment":
        return "comment";
      case "follow":
        return "account-plus";
      case "story":
        return "camera";
      case "call_voice":
        return "phone";
      case "call_video":
        return "video";
      default:
        return "bell";
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case "like":
        return staticTheme.colors.error;
      case "comment":
        return staticTheme.colors.primary;
      case "follow":
        return "#4CAF50";
      case "story":
        return "#9C27B0";
      case "call_voice":
      case "call_video":
        return "#00BCD4";
      default:
        return staticTheme.colors.textSecondary;
    }
  };

  const getMessage = () => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      case "story":
        return "viewed your story";
      default:
        return notification.message || "sent you a notification";
    }
  };

  const getTimeAgo = () => {
    if (!notification.createdAt) return "";

    const now = new Date();
    const notificationDate =
      notification.createdAt instanceof Date
        ? notification.createdAt
        : new Date(notification.createdAt);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <Card
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadNotification,
      ]}
    >
      <View style={styles.notificationContent}>
        <Avatar.Image
          source={{
            uri:
              notificationUser.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                notificationUser.fullName || "User"
              )}&background=702963&color=fff`,
          }}
          size={50}
        />

        <View style={styles.notificationBody}>
          <View style={styles.notificationMain}>
            <Text style={styles.notificationText}>
              <Text style={styles.userName}>{notificationUser.fullName}</Text>{" "}
              <Text style={styles.actionText}>{getMessage()}</Text>
            </Text>
            <Text style={styles.timeText}>{getTimeAgo()}</Text>
          </View>

          <IconButton
            icon={getIcon()}
            iconColor={getIconColor()}
            size={20}
            style={styles.notificationIcon}
          />
        </View>

        {!notification.read && <View style={styles.unreadIndicator} />}
      </View>
    </Card>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Subscribe to real-time notifications
      const unsubscribe = notificationService.subscribeToNotifications(
        user.uid,
        async (notificationsData) => {
          setNotifications(notificationsData);

          // Load user data for notifications
          const userIds = [
            ...new Set(notificationsData.map((n) => n.fromUserId)),
          ];
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
        }
      );

      return () => unsubscribe?.();
    } catch (error) {
      console.error("Error loading notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      await Promise.all(
        unreadNotifications.map((notification) =>
          notificationService.markNotificationAsRead(notification.id)
        )
      );

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
      Alert.alert("Error", "Failed to mark notifications as read");
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await notificationService.markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }

      // Navigate based on notification type
      switch (notification.type) {
        case "like":
        case "comment":
          if (notification.postId) {
            navigation.navigate("Comments", {
              post: { id: notification.postId },
            });
          }
          break;
        case "follow":
          navigation.navigate("UserProfile", {
            user: users[notification.fromUserId],
          });
          break;
        case "call_voice":
          if (notification.data?.channelName) {
            navigation.navigate("VoiceCall", {
              channelName: notification.data.channelName,
              otherUser: {
                id: notification.data.callerId,
                fullName: notification.data.callerName,
                avatar: notification.data.callerAvatar,
              },
            });
          }
          break;
        case "call_video":
          if (notification.data?.channelName) {
            navigation.navigate("VideoCall", {
              channelName: notification.data.channelName,
              otherUser: {
                id: notification.data.callerId,
                fullName: notification.data.callerName,
                avatar: notification.data.callerAvatar,
              },
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  const renderNotification = ({ item }) => (
    <NotificationItem
      notification={item}
      users={users}
      onPress={() => handleNotificationPress(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  const FilterChips = () => (
    <View style={styles.filterContainer}>
      {["all", "unread", "like", "comment", "follow"].map((filterType) => (
        <Chip
          key={filterType}
          selected={filter === filterType}
          onPress={() => setFilter(filterType)}
          style={styles.filterChip}
        >
          {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
        </Chip>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/inlinelogo.jpg")}
            style={styles.headerLogo}
          />
          <Text style={styles.title}>Notifications</Text>
        </View>
        <IconButton icon="check-all" onPress={handleMarkAllAsRead} />
      </View>

      <FilterChips />

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: staticTheme.colors.text,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  notificationCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notificationMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  notificationText: {
    fontSize: 14,
    color: staticTheme.colors.text,
    lineHeight: 20,
    flex: 1,
  },
  actionText: {
    color: staticTheme.colors.textSecondary,
  },
  notificationLeft: {
    position: "relative",
    marginRight: spacing.md,
  },
  notificationIcon: {
    position: "absolute",
    bottom: -8,
    right: -8,
    backgroundColor: staticTheme.colors.background,
    margin: 0,
  },
  notificationInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: staticTheme.colors.primary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: staticTheme.colors.primary,
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
  },
});

export default NotificationsScreen;
