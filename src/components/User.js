import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { theme, spacing, borderRadius } from "../constants/theme";

const User = ({
  user,
  showFollowButton = false,
  showBio = false,
  onPress,
  onFollowPress,
  size = "medium",
  style,
}) => {
  const avatarSize = {
    small: 40,
    medium: 50,
    large: 60,
  }[size];

  const UserContent = (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: user.avatar }}
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          {user.verified && (
            <IconButton
              icon="check-circle"
              iconColor={theme.colors.primary}
              size={16}
              style={styles.verifiedIcon}
            />
          )}
        </View>
        <Text style={styles.username}>@{user.username}</Text>
        {showBio && user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>
      {showFollowButton && (
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => onFollowPress?.(user)}
        >
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(user)} activeOpacity={0.7}>
        {UserContent}
      </TouchableOpacity>
    );
  }

  return UserContent;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  avatar: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  verifiedIcon: {
    margin: 0,
    marginLeft: spacing.xs / 2,
  },
  username: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  bio: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: spacing.xs,
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  followText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default User;
