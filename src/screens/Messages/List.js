import React, { useState } from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import { Text, IconButton, Avatar, Badge } from "react-native-paper";
import { Card } from "../../components";
import { theme, spacing, mockUsers } from "../../constants";

const ChatItem = ({ chat, onPress }) => {
  return (
    <Card onPress={onPress} style={styles.chatCard}>
      <View style={styles.chatContent}>
        <Avatar.Image source={{ uri: chat.avatar }} size={50} />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.chatTime}>{chat.lastMessageTime}</Text>
          </View>
          <View style={styles.chatPreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {chat.lastMessage}
            </Text>
            {chat.unreadCount > 0 && (
              <Badge size={20} style={styles.unreadBadge}>
                {chat.unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const MessagesListScreen = ({ navigation }) => {
  const [chats] = useState([
    {
      id: 1,
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
      lastMessage: "Hey! How are you doing?",
      lastMessageTime: "2m ago",
      unreadCount: 2,
    },
    {
      id: 2,
      name: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?img=2",
      lastMessage: "Thanks for the help!",
      lastMessageTime: "1h ago",
      unreadCount: 0,
    },
  ]);

  const renderChat = ({ item }) => (
    <ChatItem
      chat={item}
      onPress={() => navigation.navigate("Chat", { chat: item })}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../../assets/inlinelogo.jpg")}
            style={styles.headerLogo}
          />
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="magnify"
            onPress={() => console.log("Search messages")}
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
  headerActions: {
    flexDirection: "row",
  },
  listContent: {
    padding: spacing.md,
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
    fontWeight: "600",
    color: theme.colors.text,
  },
  chatTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  chatPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    marginLeft: spacing.sm,
  },
});

export default MessagesListScreen;
