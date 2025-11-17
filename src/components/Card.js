import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card as PaperCard, Text } from "react-native-paper";
import {
  theme as staticTheme,
  spacing,
  borderRadius,
  shadows,
} from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

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
  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;

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
          backgroundColor: staticTheme.colors.background,
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
    borderColor: staticTheme.colors.border,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
});

export default Card;
