import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Button, Input } from "../../components";
import { theme, spacing } from "../../constants/theme";

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Sign In Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.text}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your WeUnityX account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <Button
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
            style={styles.signInButton}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate("ResetPassword")}
            style={styles.forgotButton}
          >
            Forgot Password?
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("SignUp")}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  signInButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  forgotButton: {
    alignSelf: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
});

export default SignInScreen;
