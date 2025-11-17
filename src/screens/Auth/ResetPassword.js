import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Button, Input } from "../../components";
import { theme as staticTheme, spacing } from "../../constants/theme";

const ResetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      Alert.alert(
        "Email Sent",
        "Password reset email has been sent to your email address. Please check your inbox and follow the instructions to reset your password.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("SignIn"),
          },
        ]
      );
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Reset Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="check-circle"
            size={64}
            iconColor={staticTheme.colors.success}
          />
          <Text style={styles.title}>Email Sent!</Text>
          <Text style={styles.subtitle}>
            Check your email and follow the instructions to reset your password.
          </Text>
        </View>
        <Button
          onPress={() => navigation.navigate("SignIn")}
          style={styles.button}
        >
          Back to Sign In
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={staticTheme.colors.text}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your
          password.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Send Reset Email
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("SignIn")}
          style={styles.backToSignInButton}
        >
          Back to Sign In
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  backButton: {
    position: "absolute",
    left: -spacing.md,
    top: -spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  backToSignInButton: {
    alignSelf: "center",
  },
});

export default ResetPasswordScreen;
