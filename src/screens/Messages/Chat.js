import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme, spacing } from "../../constants";

const ChatScreen = ({ route }) => {
  const { chat } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Chat with {chat?.name || "User"}</Text>
      <Text style={styles.subtext}>
        This is a placeholder for the chat functionality
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: spacing.md,
  },
  placeholder: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export default ChatScreen;
