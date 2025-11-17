import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Text,
  IconButton,
  Button as PaperButton,
  ActivityIndicator,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";
import { Button, Input, Card } from "../../components";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { userService, storageService } from "../../services/firebase";

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
    location: "",
    website: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const userProfile = await userService.getUser(user.uid);

      if (userProfile) {
        setFormData({
          fullName: userProfile.fullName || user.displayName || "",
          username: userProfile.username || "",
          bio: userProfile.bio || "",
          location: userProfile.location || "",
          website: userProfile.website || "",
        });
      } else {
        // Use Firebase Auth data as fallback
        setFormData({
          fullName: user.displayName || "",
          username: user.email?.split("@")[0] || "",
          bio: "",
          location: "",
          website: "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
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

    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = "Bio must be less than 160 characters";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let profileImageUrl = user.photoURL;

      // Upload new profile image if selected
      if (profileImage) {
        const response = await fetch(profileImage.uri);
        const blob = await response.blob();
        const imageFile = new File([blob], `profile_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        profileImageUrl = await storageService.uploadImage(
          imageFile,
          "profiles"
        );
      }

      // Update user profile in Firestore
      const updatedData = {
        ...formData,
        username: formData.username.toLowerCase(),
        avatar: profileImageUrl,
      };

      await userService.updateUser(user.uid, updatedData);

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: formData.fullName,
        photoURL: profileImageUrl,
      });

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <PaperButton
          mode="contained"
          onPress={handleSaveProfile}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
          labelStyle={styles.saveButtonText}
        >
          Save
        </PaperButton>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={styles.imageContainer}
            >
              <Image
                source={{
                  uri:
                    profileImage?.uri ||
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      formData.fullName || "User"
                    )}&background=702963&color=fff`,
                }}
                style={styles.profileImage}
              />
              <View style={styles.imageOverlay}>
                <IconButton icon="camera" iconColor="#fff" size={20} />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to change profile picture</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
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
              label="Bio"
              value={formData.bio}
              onChangeText={(value) => handleInputChange("bio", value)}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={3}
              error={errors.bio}
            />

            <Input
              label="Location"
              value={formData.location}
              onChangeText={(value) => handleInputChange("location", value)}
              placeholder="Where are you located?"
              error={errors.location}
            />

            <Input
              label="Website"
              value={formData.website}
              onChangeText={(value) => handleInputChange("website", value)}
              placeholder="https://yourwebsite.com"
              autoCapitalize="none"
              keyboardType="url"
              error={errors.website}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  saveButton: {
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  profileCard: {
    padding: spacing.lg,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  imageContainer: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageHint: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
  },
  formSection: {
    flex: 1,
  },
});

export default EditProfileScreen;
