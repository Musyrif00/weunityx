import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  IconButton,
  Avatar,
  TextInput,
  ActivityIndicator,
} from "react-native-paper";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { chatService, callService } from "../../services/firebase";

const MessageBubble = ({ message, isOwn, senderData }) => {
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!isOwn && (
        <Avatar.Image
          source={{ uri: senderData?.avatar }}
          size={32}
          style={styles.messageAvatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {message.message}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isOwn ? styles.ownMessageTime : styles.otherMessageTime,
          ]}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const ChatScreen = ({ route, navigation }) => {
  const { chat, otherUser } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const flatListRef = useRef(null);

  // Deserialize chat dates if they are strings (from navigation serialization)
  const deserializeChat = (chat) => {
    if (!chat) return chat;
    return {
      ...chat,
      lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : null,
      createdAt: chat.createdAt ? new Date(chat.createdAt) : null,
      updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : null,
    };
  };

  const deserializedChat = deserializeChat(chat);

  // Get the other participant's data
  const otherParticipant =
    currentChat?.participants?.find((id) => id !== user.uid) || otherUser?.id;
  const otherParticipantData =
    currentChat?.participantsData?.[otherParticipant] || otherUser;

  useEffect(() => {
    const initializeChat = async () => {
      if (deserializedChat?.id) {
        setCurrentChat(deserializedChat);
      } else if (otherUser?.id) {
        // Get or create chat with the other user
        try {
          const existingChat = await chatService.getOrCreateChat(
            user.uid,
            otherUser.id
          );
          setCurrentChat(existingChat);
        } catch (error) {
          console.error("Error getting/creating chat:", error);
          setLoading(false);
        }
      }
    };

    initializeChat();
  }, [deserializedChat?.id, otherUser?.id, user.uid]);

  useEffect(() => {
    if (!currentChat?.id) return;

    // Subscribe to messages
    const unsubscribe = chatService.subscribeToMessages(
      currentChat.id,
      (messagesData) => {
        setMessages(messagesData);
        setLoading(false);
        // Scroll to bottom when new messages arrive
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    // Mark messages as read when entering chat
    chatService
      .markMessagesAsRead(currentChat.id, user.uid)
      .catch(console.error);

    return () => unsubscribe?.();
  }, [currentChat?.id, user.uid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      await chatService.sendMessage(
        currentChat.id,
        user.uid,
        otherParticipant,
        messageText
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message text on error
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.senderId === user.uid;
    const senderData = isOwn
      ? chat?.participantsData?.[user.uid]
      : otherParticipantData;

    return (
      <MessageBubble message={item} isOwn={isOwn} senderData={senderData} />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Avatar.Image
            source={{ uri: otherParticipantData?.avatar }}
            size={40}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {otherParticipantData?.fullName}
            </Text>
            <Text style={styles.headerUsername}>
              @{otherParticipantData?.username}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="phone"
            onPress={async () => {
              // Sort user IDs to ensure same channel name regardless of who initiates
              const sortedIds = [user.uid, otherParticipantData?.id].sort();
              const channelName =
                currentChat?.id || `call_${sortedIds[0]}_${sortedIds[1]}`;

              // Send call notification to other user
              try {
                await callService.sendCallNotification(
                  user.uid,
                  otherParticipantData?.id,
                  channelName,
                  "voice"
                );
              } catch (error) {
                console.error("Error sending call notification:", error);
              }

              navigation.navigate("VoiceCall", {
                channelName,
                otherUser: otherParticipantData,
              });
            }}
          />
          <IconButton
            icon="video"
            onPress={async () => {
              // Sort user IDs to ensure same channel name regardless of who initiates
              const sortedIds = [user.uid, otherParticipantData?.id].sort();
              const channelName =
                currentChat?.id || `call_${sortedIds[0]}_${sortedIds[1]}`;

              // Send call notification to other user
              try {
                await callService.sendCallNotification(
                  user.uid,
                  otherParticipantData?.id,
                  channelName,
                  "video"
                );
              } catch (error) {
                console.error("Error sending call notification:", error);
              }

              navigation.navigate("VideoCall", {
                channelName,
                otherUser: otherParticipantData,
              });
            }}
          />
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.messageInputContainer}>
          <TextInput
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.messageInput}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <IconButton icon="send" iconColor="#ffffff" size={20} />
            )}
          </TouchableOpacity>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
    backgroundColor: staticTheme.colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
  },
  headerUsername: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  headerActions: {
    flexDirection: "row",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.md,
  },
  messageContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: "85%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginRight: spacing.sm,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    maxWidth: "100%",
  },
  ownBubble: {
    backgroundColor: staticTheme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: staticTheme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: staticTheme.colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: staticTheme.colors.textSecondary,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.border,
    backgroundColor: staticTheme.colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  messageInput: {
    flex: 1,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 25,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: staticTheme.colors.textSecondary,
  },
});

export default ChatScreen;
