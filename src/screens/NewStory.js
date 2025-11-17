import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  IconButton,
  TextInput,
  Button as PaperButton,
  ActivityIndicator,
  Card,
} from "react-native-paper";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { storyService, storageService } from "../services/firebase";

const NewStoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async (sourceType) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your photos to create a story."
        );
        return;
      }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Story aspect ratio
        quality: 0.8,
      };

      let result;
      if (sourceType === "camera") {
        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== "granted") {
          Alert.alert(
            "Permission needed",
            "We need camera access to take a photo."
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Add Photo",
      "Choose how you want to add a photo to your story",
      [
        {
          text: "Camera",
          onPress: () => pickImage("camera"),
        },
        {
          text: "Photo Library",
          onPress: () => pickImage("library"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleCreateStory = async () => {
    if (!image) {
      Alert.alert("Error", "Please add a photo to your story");
      return;
    }

    setLoading(true);
    try {
      // Upload image to Firebase Storage
      const imageUri = image.uri;
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const imageName = `stories/${user.uid}_${Date.now()}.jpg`;
      const imageUrl = await storageService.uploadImage(blob, imageName);

      // Create story in Firestore
      const storyData = {
        userId: user.uid,
        image: imageUrl,
        caption: caption.trim(),
        type: "image",
      };

      await storyService.createStory(storyData);

      Alert.alert("Success", "Your story has been posted!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error creating story:", error);
      Alert.alert("Error", "Failed to create story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          onPress={() => navigation.goBack()}
          iconColor={staticTheme.colors.text}
        />
        <Text style={styles.headerTitle}>New Story</Text>
        <PaperButton
          onPress={handleCreateStory}
          disabled={!image || loading}
          loading={loading}
          mode="contained"
          compact
          style={styles.shareButton}
        >
          Share
        </PaperButton>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Image Preview */}
        <Card style={styles.imageContainer}>
          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={showImagePicker}
              >
                <IconButton
                  icon="camera"
                  iconColor={staticTheme.colors.surface}
                  style={styles.changeImageIcon}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={showImagePicker}
            >
              <IconButton
                icon="camera-plus"
                size={48}
                iconColor={staticTheme.colors.textSecondary}
              />
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Caption Input */}
        <Card style={styles.captionCard}>
          <TextInput
            placeholder="Add a caption..."
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
            style={styles.captionInput}
            contentStyle={styles.captionInputContent}
            disabled={loading}
          />
        </Card>

        {/* Story Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Story Settings</Text>
          <Text style={styles.infoText}>
            • Your story will be visible for 24 hours
          </Text>
          <Text style={styles.infoText}>
            • Your followers can see and reply to your story
          </Text>
          <Text style={styles.infoText}>
            • You can see who viewed your story
          </Text>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={staticTheme.colors.primary}
            />
            <Text style={styles.loadingText}>Creating your story...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  shareButton: {
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  imageContainer: {
    aspectRatio: 9 / 16,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  imagePreview: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeImageButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  changeImageIcon: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.surface,
  },
  placeholderText: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.sm,
  },
  captionCard: {
    padding: 0,
    marginBottom: spacing.md,
  },
  captionInput: {
    backgroundColor: "transparent",
    minHeight: 80,
  },
  captionInputContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  infoContainer: {
    marginTop: spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    minWidth: 200,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: staticTheme.colors.text,
    textAlign: "center",
  },
});

export default NewStoryScreen;
