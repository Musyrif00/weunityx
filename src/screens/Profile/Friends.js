import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme as staticTheme, spacing } from "../../constants";

const FriendsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Friends</Text>
      <Text style={styles.subtext}>This is a placeholder for friends list</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
    padding: spacing.md,
  },
  placeholder: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtext: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
  },
});

export default FriendsScreen;
