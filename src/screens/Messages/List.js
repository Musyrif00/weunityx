import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import {
  Text,
  IconButton,
  Avatar,
  Badge,
  ActivityIndicator,
} from "react-native-paper";
import { Card } from "../../components";
import { HeaderLogo } from "../../components/Logo";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/firebase";

const ChatItem = ({ chat, currentUserId, onPress }) => {
  // Get the other participant's data
  const otherParticipant = chat.participants.find((id) => id !== currentUserId);
  const otherUserData = chat.participantsData[otherParticipant];
  const unreadCount = chat.unreadCount?.[currentUserId] || 0;

  const formatLastMessageTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? "now" : `${minutes}m`;
    }
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString();
  };

  return (
    <Card onPress={onPress} style={styles.chatCard}>
      <View style={styles.chatContent}>
        <Avatar.Image
          source={{
            uri:
              otherUserData?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                otherUserData?.fullName || "User"
              )}&background=702963&color=fff`,
          }}
          size={50}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text
              style={[
                styles.chatName,
                unreadCount > 0 && styles.unreadChatName,
              ]}
            >
              {otherUserData?.fullName || "Unknown User"}
            </Text>
            <Text style={styles.chatTime}>
              {formatLastMessageTime(chat.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.chatPreview}>
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadLastMessage,
              ]}
              numberOfLines={1}
            >
              {chat.lastMessage || "Start a conversation"}
            </Text>
            {unreadCount > 0 && (
              <Badge size={20} style={styles.unreadBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const MessagesListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadChats();
    }
  }, [user?.uid]);

  const loadChats = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userChats = await chatService.getUserChats(user.uid);
      setChats(userChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    // Serialize Date objects to avoid navigation warnings
    const serializableChat = {
      ...chat,
      lastMessageAt: chat.lastMessageAt?.toISOString() || null,
      createdAt: chat.createdAt?.toISOString() || null,
      updatedAt: chat.updatedAt?.toISOString() || null,
    };
    navigation.navigate("Chat", { chat: serializableChat });
  };

  const renderChat = ({ item }) => (
    <ChatItem
      chat={item}
      currentUserId={user?.uid}
      onPress={() => handleChatPress(item)}
    />
  );

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

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="message-outline"
        size={64}
        iconColor={staticTheme.colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by tapping the + button
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
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
            icon="magnify"
            onPress={() => {
              /* Search messages functionality */
            }}
          />
          <IconButton
            icon="plus"
            onPress={() => navigation.navigate("NewMessage")}
          />
        </View>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          chats.length === 0 && styles.emptyListContent,
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: staticTheme.colors.text,
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
  chatCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  chatContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "400",
    color: staticTheme.colors.text,
  },
  unreadChatName: {
    fontWeight: "600",
  },
  chatTime: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
  },
  chatPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  unreadLastMessage: {
    color: staticTheme.colors.text,
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: staticTheme.colors.primary,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
});

export default MessagesListScreen;
