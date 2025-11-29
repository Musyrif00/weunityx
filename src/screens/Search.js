import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image, Alert } from "react-native";
import {
  Text,
  Searchbar,
  Chip,
  ActivityIndicator,
  Card as PaperCard,
} from "react-native-paper";
import { User, Card } from "../components";
import Logo from "../components/Logo";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { searchService, userService, postService } from "../services/firebase";

const SearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("users");
  const [results, setResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  const loadSuggestedUsers = async () => {
    try {
      setLoadingSuggestions(true);
      const suggestions = await searchService.getSuggestedUsers(user.uid, 10);
      setSuggestedUsers(suggestions);
    } catch (error) {
      console.error("Error loading suggested users:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      let searchResults = [];

      switch (searchType) {
        case "users":
          searchResults = await searchService.searchUsers(query);
          break;
        case "posts":
          searchResults = await searchService.searchPosts(query);
          // Load user data for posts
          const postsWithUsers = await Promise.all(
            searchResults.map(async (post) => {
              const postUser = await userService.getUser(post.userId);
              return { ...post, user: postUser };
            })
          );
          searchResults = postsWithUsers;
          break;
        case "events":
          searchResults = await searchService.searchEvents(query);
          // Load user data for events
          const eventsWithUsers = await Promise.all(
            searchResults.map(async (event) => {
              const eventUser = await userService.getUser(event.userId);
              return { ...event, user: eventUser };
            })
          );
          searchResults = eventsWithUsers;
          break;
        default:
          break;
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPress = async (targetUser) => {
    try {
      await userService.toggleFollow(user.uid, targetUser.id, false);
      // Update local state
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isFollowing: true } : u
        )
      );
      setResults((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isFollowing: true } : u
        )
      );
    } catch (error) {
      console.error("Error following user:", error);
      Alert.alert("Error", "Failed to follow user");
    }
  };

  const renderUser = ({ item }) => (
    <User
      user={{
        id: item.id,
        fullName: item.fullName || item.name,
        username: item.username,
        avatar: item.avatar,
        bio: item.bio,
        isFollowing: item.isFollowing || false,
      }}
      showFollowButton={item.id !== user.uid}
      showBio={true}
      onPress={(userData) =>
        navigation.navigate("UserProfile", { user: userData })
      }
      onFollowPress={() => handleFollowPress(item)}
      style={styles.userItem}
    />
  );

  const renderPost = ({ item }) => (
    <Card
      post={item}
      user={item.user}
      onPress={() => navigation.navigate("PostDetail", { post: item })}
      style={styles.postItem}
    />
  );

  const renderEvent = ({ item }) => (
    <PaperCard style={styles.eventCard}>
      <PaperCard.Content>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.eventDate}>
          {item.date?.toLocaleDateString()} at {item.date?.toLocaleTimeString()}
        </Text>
        <Text style={styles.eventLocation}>{item.location?.address}</Text>
      </PaperCard.Content>
    </PaperCard>
  );

  const renderSearchResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={staticTheme.colors.primary} />
          <Text style={styles.loadingText}>Sensing...</Text>
        </View>
      );
    }

    if (results.length === 0 && searchQuery.trim().length >= 2) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {searchType} found for "{searchQuery}"
          </Text>
        </View>
      );
    }

    const renderItem = () => {
      switch (searchType) {
        case "users":
          return renderUser;
        case "posts":
          return renderPost;
        case "events":
          return renderEvent;
        default:
          return renderUser;
      }
    };

    return (
      <FlatList
        data={results}
        renderItem={renderItem()}
        keyExtractor={(item) => `${searchType}-${item.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContainer}
      />
    );
  };

  const SearchFilters = () => (
    <View style={styles.filtersContainer}>
      {["users", "posts"].map((type) => (
        <Chip
          key={type}
          selected={searchType === type}
          onPress={() => {
            setSearchType(type);
            if (searchQuery.trim().length >= 2) {
              handleSearch(searchQuery);
            }
          }}
          style={styles.filterChip}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Chip>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size="medium" />
      </View>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={`Sense ${searchType} on WeUnityX`}
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <SearchFilters />

      {searchQuery.trim().length >= 2 ? (
        renderSearchResults()
      ) : (
        <View style={styles.exploreContainer}>
          <Text style={styles.exploreTitle}>Discover People</Text>
          {loadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={staticTheme.colors.primary}
              />
            </View>
          ) : (
            <FlatList
              data={suggestedUsers}
              renderItem={renderUser}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No suggested users found</Text>
              }
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
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
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  resultsContainer: {
    padding: spacing.md,
  },
  userItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  postItem: {
    marginBottom: spacing.md,
  },
  eventCard: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: 12,
    color: staticTheme.colors.primary,
    marginBottom: spacing.xs,
  },
  eventLocation: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xl,
  },
  exploreContainer: {
    flex: 1,
    padding: spacing.md,
  },
  exploreTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.md,
  },
});

export default SearchScreen;
