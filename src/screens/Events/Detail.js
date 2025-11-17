import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { theme, spacing } from "../../constants";

const EventDetailScreen = ({ route }) => {
  const { event } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>{event?.title || "Event"} Details</Text>
      <Text style={styles.subtext}>
        This is a placeholder for event details view
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

export default EventDetailScreen;
