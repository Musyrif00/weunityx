import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  IconButton,
  Button as PaperButton,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Button, Input, Card } from "../components";
import { theme as staticTheme, spacing } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { postService, userService } from "../services/firebase";

const NewPostScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access photos"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setSelectedVideo(null);
        setMediaType("image");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleVideoPicker = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access videos"
        );
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
        setSelectedImage(null);
        setMediaType("video");
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick video");
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access camera"
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.type === "video") {
          setSelectedVideo(asset);
          setSelectedImage(null);
          setMediaType("video");
        } else {
          setSelectedImage(asset);
          setSelectedVideo(null);
          setMediaType("image");
        }
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const handleLocationPicker = async () => {
    setLoadingLocation(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access location"
        );
        setLoadingLocation(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocoding to get address
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].name || ""} ${
          address[0].city || ""
        }, ${address[0].region || ""}`.trim();
        setLocation({
          address: locationString,
          coordinates: { latitude, longitude },
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !selectedImage && !selectedVideo) {
      Alert.alert(
        "Error",
        "Please add some content, an image, or a video to your post"
      );
      return;
    }

    setLoading(true);
    try {
      // Prepare post data
      const postData = {
        userId: user.uid,
        content: content.trim(),
        location: location?.address || null,
        coordinates: location?.coordinates || null,
      };

      // Convert media to blob if selected
      let mediaFile = null;
      if (selectedImage) {
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        mediaFile = new File([blob], `image_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
      } else if (selectedVideo) {
        const response = await fetch(selectedVideo.uri);
        const blob = await response.blob();
        mediaFile = new File([blob], `video_${Date.now()}.mp4`, {
          type: "video/mp4",
        });
        postData.mediaType = "video";
      }

      // Create post
      const newPost = await postService.createPost(postData, mediaFile);

      // Navigate back and show success
      navigation.goBack();
      Alert.alert("Success", "Your post has been created!");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (mediaType === "image") setMediaType(null);
  };

  const removeVideo = () => {
    setSelectedVideo(null);
    if (mediaType === "video") setMediaType(null);
  };

  const removeLocation = () => {
    setLocation(null);
  };

  const showImageOptions = () => {
    Alert.alert("Add Image", "Choose an option", [
      { text: "Camera", onPress: handleCameraCapture },
      { text: "Gallery", onPress: handleImagePicker },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Create Post</Text>
        <PaperButton
          mode="contained"
          onPress={handleCreatePost}
          loading={loading}
          disabled={
            loading || (!content.trim() && !selectedImage && !selectedVideo)
          }
          style={styles.postButton}
          labelStyle={styles.postButtonText}
        >
          Post
        </PaperButton>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.postCard}>
          <Input
            placeholder="What's on your mind?"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            style={styles.contentInput}
          />

          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.selectedImage}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <IconButton icon="close" iconColor="#fff" size={20} />
              </TouchableOpacity>
            </View>
          )}

          {selectedVideo && (
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: selectedVideo.uri }}
                style={styles.selectedVideo}
                useNativeControls
                resizeMode="contain"
                shouldPlay={false}
              />
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={removeVideo}
              >
                <IconButton icon="close" iconColor="#fff" size={20} />
              </TouchableOpacity>
            </View>
          )}

          {location && (
            <View style={styles.locationContainer}>
              <Chip
                icon="map-marker"
                onClose={removeLocation}
                style={styles.locationChip}
              >
                {location.address}
              </Chip>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={showImageOptions}
            >
              <IconButton
                icon="camera"
                iconColor={staticTheme.colors.primary}
              />
              <Text style={styles.actionText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleVideoPicker}
            >
              <IconButton icon="video" iconColor={staticTheme.colors.primary} />
              <Text style={styles.actionText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLocationPicker}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator
                  size="small"
                  color={staticTheme.colors.primary}
                />
              ) : (
                <IconButton
                  icon="map-marker"
                  iconColor={staticTheme.colors.primary}
                />
              )}
              <Text style={styles.actionText}>Location</Text>
            </TouchableOpacity>
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
  postButton: {
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 20,
  },
  postButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  postCard: {
    padding: spacing.lg,
  },
  contentInput: {
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  videoContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  selectedVideo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeVideoButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  locationContainer: {
    marginBottom: spacing.md,
  },
  locationChip: {
    alignSelf: "flex-start",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.border,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    color: staticTheme.colors.primary,
    marginTop: spacing.xs,
  },
});

export default NewPostScreen;
