import React, { useState } from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import { Text, IconButton, Avatar, Chip } from "react-native-paper";
import { Card } from "../components";
import { theme, spacing } from "../constants";

const NotificationItem = ({ notification }) => {
  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return "heart";
      case "comment":
        return "comment";
      case "follow":
        return "account-plus";
      case "event":
        return "calendar";
      default:
        return "bell";
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case "like":
        return theme.colors.error;
      case "comment":
        return theme.colors.primary;
      case "follow":
        return theme.colors.success;
      case "event":
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <Card style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationLeft}>
          <Avatar.Image source={{ uri: notification.avatar }} size={40} />
          <IconButton
            icon={getIcon()}
            iconColor={getIconColor()}
            size={16}
            style={styles.notificationIcon}
          />
        </View>

        <View style={styles.notificationInfo}>
          <Text style={styles.notificationText}>
            <Text style={styles.userName}>{notification.userName}</Text>{" "}
            {notification.message}
          </Text>
          <Text style={styles.timeText}>{notification.time}</Text>
        </View>

        {!notification.read && <View style={styles.unreadIndicator} />}
      </View>
    </Card>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const [filter, setFilter] = useState("all");
  const [notifications] = useState([
    {
      id: 1,
      type: "like",
      userName: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
      message: "liked your post",
      time: "5m ago",
      read: false,
    },
    {
      id: 2,
      type: "comment",
      userName: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?img=2",
      message: "commented on your post",
      time: "1h ago",
      read: true,
    },
    {
      id: 3,
      type: "follow",
      userName: "Mike Johnson",
      avatar: "https://i.pravatar.cc/150?img=3",
      message: "started following you",
      time: "2h ago",
      read: false,
    },
    {
      id: 4,
      type: "event",
      userName: "Sarah Wilson",
      avatar: "https://i.pravatar.cc/150?img=4",
      message: "invited you to an event",
      time: "1d ago",
      read: true,
    },
  ]);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  const renderNotification = ({ item }) => (
    <NotificationItem notification={item} />
  );

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
        <IconButton
          icon="check-all"
          onPress={() => console.log("Mark all as read")}
        />
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  notificationLeft: {
    position: "relative",
    marginRight: spacing.md,
  },
  notificationIcon: {
    position: "absolute",
    bottom: -8,
    right: -8,
    backgroundColor: theme.colors.background,
    margin: 0,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  userName: {
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: spacing.sm,
  },
});

export default NotificationsScreen;
