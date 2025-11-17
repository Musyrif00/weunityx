import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput as PaperTextInput, HelperText } from "react-native-paper";
import { theme, spacing, borderRadius } from "../constants/theme";

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
              ? theme.colors.surface
              : theme.colors.background,
            borderColor: error
              ? theme.colors.error
              : isFocused
              ? theme.colors.primary
              : theme.colors.border,
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
