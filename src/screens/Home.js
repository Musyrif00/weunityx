import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";
import { Text, IconButton, Avatar, Chip } from "react-native-paper";
import { Card, User } from "../components";
import { theme, spacing, mockPosts, mockUsers } from "../constants";
import { useAuth } from "../contexts/AuthContext";

const PostCard = ({ post, user }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Card style={styles.postCard}>
      <User
        user={user}
        onPress={() => console.log("Navigate to user profile")}
      />

      {post.content && <Text style={styles.postContent}>{post.content}</Text>}

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      )}

      {post.location && (
        <Chip icon="map-marker" style={styles.locationChip}>
          {post.location}
        </Chip>
      )}

      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <IconButton
            icon={liked ? "heart" : "heart-outline"}
            iconColor={liked ? theme.colors.error : theme.colors.textSecondary}
            onPress={() => setLiked(!liked)}
          />
          <Text style={styles.actionText}>{post.likes + (liked ? 1 : 0)}</Text>

          <IconButton
            icon="comment-outline"
            iconColor={theme.colors.textSecondary}
            onPress={() => console.log("Navigate to comments")}
          />
          <Text style={styles.actionText}>{post.comments}</Text>
        </View>

        <IconButton
          icon={saved ? "bookmark" : "bookmark-outline"}
          iconColor={saved ? theme.colors.primary : theme.colors.textSecondary}
          onPress={() => setSaved(!saved)}
        />
      </View>

      <Text style={styles.timestamp}>
        {post.timestamp.toLocaleDateString()}
      </Text>
    </Card>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState(mockPosts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderPost = ({ item }) => {
    const postUser = mockUsers.find((u) => u.id === item.userId);
    return <PostCard post={item} user={postUser} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/inlinelogo.jpg")}
          style={styles.headerLogo}
        />
        <View style={styles.headerActions}>
          <IconButton
            icon="plus"
            onPress={() => navigation.navigate("NewPost")}
          />
          <IconButton
            icon="bell-outline"
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  headerLogo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
  },
  headerActions: {
    flexDirection: "row",
  },
  listContent: {
    padding: spacing.md,
  },
  postCard: {
    marginBottom: spacing.md,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    marginVertical: spacing.sm,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: spacing.sm,
  },
  locationChip: {
    alignSelf: "flex-start",
    marginVertical: spacing.sm,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: spacing.md,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default HomeScreen;
