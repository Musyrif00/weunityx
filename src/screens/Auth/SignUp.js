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
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Button, Input } from "../../components";
import { theme as staticTheme, spacing } from "../../constants/theme";

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      await updateProfile(user, {
        displayName: formData.fullName.trim(),
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          formData.fullName
        )}&background=702963&color=fff`,
        bio: "",
        verified: false,
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account already exists with this email address.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/weak-password":
          errorMessage =
            "Password is too weak. Please choose a stronger password.";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Sign Up Failed", errorMessage);
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
            iconColor={staticTheme.colors.text}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.title}>Join WeUnityX</Text>
          <Text style={styles.subtitle}>
            Create your account to get started
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange("fullName", value)}
            placeholder="Enter your full name"
            error={errors.fullName}
          />

          <Input
            label="Username"
            value={formData.username}
            onChangeText={(value) => handleInputChange("username", value)}
            placeholder="Choose a username"
            autoCapitalize="none"
            error={errors.username}
          />

          <Input
            label="Email Address"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
            placeholder="Create a password"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) =>
              handleInputChange("confirmPassword", value)
            }
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.signUpButton}
          >
            Create Account
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("SignIn")}
            >
              Sign In
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
    backgroundColor: staticTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
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
  },
  form: {
    flex: 1,
  },
  signUpButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
  },
  linkText: {
    color: staticTheme.colors.primary,
    fontWeight: "600",
  },
});

export default SignUpScreen;
