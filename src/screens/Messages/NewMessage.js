import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  IconButton,
  Searchbar,
  ActivityIndicator,
} from "react-native-paper";
import { User, Card } from "../../components";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { userService, chatService } from "../../services/firebase";

const NewMessageScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    loadRecentChats();
  }, []);

  const loadRecentChats = async () => {
    try {
      const chats = await chatService.getUserChats(user.uid);
      setRecentChats(chats.slice(0, 5)); // Show only recent 5 chats
    } catch (error) {
      console.error("Error loading recent chats:", error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await userService.searchUsers(query.trim());
      // Filter out current user from results
      const filteredResults = results.filter((u) => u.id !== user.uid);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (selectedUser) => {
    try {
      // Prepare user data for chat
      const currentUserData = {
        fullName: user.displayName || "User",
        username: user.email?.split("@")[0] || "user",
        avatar:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.displayName || "User"
          )}&background=702963&color=fff`,
      };

      const selectedUserData = {
        fullName: selectedUser.fullName,
        username: selectedUser.username,
        avatar: selectedUser.avatar,
      };

      // Create or get existing chat
      const chat = await chatService.createOrGetChat(
        user.uid,
        selectedUser.id,
        currentUserData,
        selectedUserData
      );

      // Navigate to chat screen
      navigation.navigate("Chat", { chat });
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleRecentChatPress = (chat) => {
    navigation.navigate("Chat", { chat });
  };

  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <User
        user={item}
        onPress={() => handleStartChat(item)}
        showFollowButton={false}
        showBio={true}
      />
    </Card>
  );

  const renderRecentChatItem = ({ item }) => {
    const otherParticipant = item.participants.find((id) => id !== user.uid);
    const otherUserData = item.participantsData[otherParticipant];

    return (
      <Card style={styles.userCard} onPress={() => handleRecentChatPress(item)}>
        <View style={styles.recentChatContent}>
          <User
            user={{
              id: otherParticipant,
              name: otherUserData?.fullName,
              username: otherUserData?.username,
              avatar: otherUserData?.avatar,
            }}
            showFollowButton={false}
          />
          <View style={styles.recentChatInfo}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || "Start a conversation"}
            </Text>
            <Text style={styles.lastMessageTime}>
              {item.lastMessageAt?.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>New Message</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search for people..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          loading={loading}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {searchQuery.trim().length === 0 ? (
          // Show recent chats when not searching
          <>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            <FlatList
              data={recentChats}
              renderItem={renderRecentChatItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No recent conversations. Search for people to start
                    chatting!
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          // Show search results
          <>
            <Text style={styles.sectionTitle}>
              {loading
                ? "Searching..."
                : `Search Results (${searchResults.length})`}
            </Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={staticTheme.colors.primary}
                />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchQuery.trim().length >= 2 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No users found for "{searchQuery}"
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </>
        )}
      </View>
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
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginLeft: spacing.sm,
  },
  searchContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: staticTheme.colors.surface,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.md,
  },
  userCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  recentChatContent: {
    flexDirection: "column",
  },
  recentChatInfo: {
    marginLeft: spacing.xl + spacing.md, // Align with user info
    marginTop: spacing.xs,
  },
  lastMessage: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  lastMessageTime: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
});

export default NewMessageScreen;
