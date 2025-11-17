import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Text, IconButton } from "react-native-paper";
import {
  theme as staticTheme,
  spacing,
  borderRadius,
} from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

const User = ({
  user,
  showFollowButton = false,
  showBio = false,
  onPress,
  onFollowPress,
  size = "medium",
  style,
}) => {
  // Always use light theme (disabled dynamic theming)
  const currentTheme = staticTheme;

  // Text should now be visible with explicit colors

  const avatarSize = {
    small: 40,
    medium: 50,
    large: 60,
  }[size];

  const UserContent = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        flex: 1,
      }}
    >
      <Image
        source={{ uri: user.avatar }}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          marginRight: 12,
        }}
      />
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#000000",
          }}
        >
          {user?.fullName || user?.displayName || "Unknown User"}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#666666",
            marginTop: 2,
          }}
        >
          @{user?.username || user?.email?.split("@")[0] || "unknown"}
        </Text>
      </View>
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
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  avatar: {
    marginRight: spacing.md,
    flexShrink: 0, // Prevent avatar from shrinking
  },
  info: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0, // Allow shrinking for text overflow
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    // Note: color will be applied inline with dynamic theme
    minHeight: 20,
    flex: 1, // Allow text to take available space
  },
  verifiedIcon: {
    margin: 0,
    marginLeft: spacing.xs / 2,
    flexShrink: 0, // Prevent icon from shrinking
  },
  username: {
    fontSize: 14,
    // Note: color will be applied inline with dynamic theme
    marginTop: spacing.xs / 2,
    minHeight: 18,
  },
  bio: {
    fontSize: 14,
    // Note: color will be applied inline with dynamic theme
    marginTop: spacing.xs,
  },
  followButton: {
    // Note: backgroundColor will be applied inline with dynamic theme
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
