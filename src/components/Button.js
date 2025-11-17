import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Button as PaperButton } from "react-native-paper";
import {
  theme as staticTheme,
  spacing,
  borderRadius,
} from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

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
  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;

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
          mode === "contained" ? staticTheme.colors.primary : "transparent",
        borderColor: staticTheme.colors.primary,
      },
      secondary: {
        backgroundColor:
          mode === "contained" ? staticTheme.colors.secondary : "transparent",
        borderColor: staticTheme.colors.secondary,
      },
      danger: {
        backgroundColor:
          mode === "contained" ? staticTheme.colors.error : "transparent",
        borderColor: staticTheme.colors.error,
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant], style];
  };

  const getTextColor = () => {
    if (disabled) return staticTheme.colors.textSecondary;
    if (mode === "contained") return "#ffffff";

    const colorMap = {
      primary: staticTheme.colors.primary,
      secondary: staticTheme.colors.secondary,
      danger: staticTheme.colors.error,
    };

    return colorMap[variant] || staticTheme.colors.primary;
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
