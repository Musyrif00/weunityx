import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Searchbar, Chip } from "react-native-paper";
import { User } from "../components";
import { theme, spacing, mockUsers } from "../constants";

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("users");
  const [results, setResults] = useState(mockUsers);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setResults(mockUsers);
      return;
    }

    const filtered = mockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  };

  const renderUser = ({ item }) => (
    <User
      user={item}
      showFollowButton={true}
      showBio={true}
      onPress={(user) => navigation.navigate("UserProfile", { user })}
      onFollowPress={(user) => console.log("Follow", user.name)}
      style={styles.userItem}
    />
  );

  const SearchFilters = () => (
    <View style={styles.filtersContainer}>
      {["users", "posts", "events"].map((type) => (
        <Chip
          key={type}
          selected={searchType === type}
          onPress={() => setSearchType(type)}
          style={styles.filterChip}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Chip>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search WeUnityX"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <SearchFilters />

      {searchQuery ? (
        <FlatList
          data={results}
          renderItem={renderUser}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No results found</Text>
          }
        />
      ) : (
        <View style={styles.exploreContainer}>
          <Text style={styles.exploreTitle}>Discover People</Text>
          <FlatList
            data={mockUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: theme.colors.surface,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    borderBottomColor: theme.colors.border,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: spacing.xl,
  },
  exploreContainer: {
    flex: 1,
    padding: spacing.md,
  },
  exploreTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
});

export default SearchScreen;
