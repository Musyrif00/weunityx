import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput as PaperTextInput, HelperText } from "react-native-paper";
import {
  theme as staticTheme,
  spacing,
  borderRadius,
} from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error = "",
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  autoCapitalize = "sentences",
  style,
  ...props
}) => {
  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        disabled={disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        error={!!error}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: disabled
              ? staticTheme.colors.surface
              : staticTheme.colors.background,
            borderColor: error
              ? staticTheme.colors.error
              : isFocused
              ? staticTheme.colors.primary
              : staticTheme.colors.border,
          },
        ]}
        contentStyle={styles.inputContent}
        {...props}
      />
      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  inputContent: {
    paddingHorizontal: spacing.md,
  },
});

export default Input;
