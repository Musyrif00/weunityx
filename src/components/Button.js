import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Button as PaperButton } from "react-native-paper";
import { theme, spacing, borderRadius } from "../constants/theme";

const Button = ({
  mode = "contained",
  variant = "primary",
  size = "medium",
  children,
  style,
  disabled = false,
  loading = false,
  onPress,
  ...props
}) => {
  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: borderRadius.lg,
    };

    const sizeStyles = {
      small: { height: 36, paddingHorizontal: spacing.md },
      medium: { height: 44, paddingHorizontal: spacing.lg },
      large: { height: 52, paddingHorizontal: spacing.xl },
    };

    const variantStyles = {
      primary: {
        backgroundColor:
          mode === "contained" ? theme.colors.primary : "transparent",
        borderColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor:
          mode === "contained" ? theme.colors.secondary : "transparent",
        borderColor: theme.colors.secondary,
      },
      danger: {
        backgroundColor:
          mode === "contained" ? theme.colors.error : "transparent",
        borderColor: theme.colors.error,
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant], style];
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textSecondary;
    if (mode === "contained") return "#ffffff";

    const colorMap = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      danger: theme.colors.error,
    };

    return colorMap[variant] || theme.colors.primary;
  };

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      style={getButtonStyles()}
      labelStyle={{
        color: getTextColor(),
        fontSize: size === "small" ? 14 : size === "large" ? 18 : 16,
        fontWeight: "600",
      }}
      {...props}
    >
      {children}
    </PaperButton>
  );
};

export default Button;
