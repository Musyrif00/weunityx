import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card as PaperCard, Text } from "react-native-paper";
import { theme, spacing, borderRadius, shadows } from "../constants/theme";

const Card = ({
  children,
  title,
  subtitle,
  onPress,
  style,
  elevation = "md",
  padding = "md",
  ...props
}) => {
  const paddingValue = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  }[padding];

  const cardContent = (
    <View
      style={[
        styles.container,
        shadows[elevation],
        {
          padding: paddingValue,
          backgroundColor: theme.colors.background,
          borderRadius: borderRadius.lg,
        },
        style,
      ]}
    >
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} {...props}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default Card;
