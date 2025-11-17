import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme, spacing } from "../constants";

const NewPostScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Create New Post</Text>
      <Text style={styles.subtext}>
        This is a placeholder for creating new posts
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

export default NewPostScreen;
