import React, { useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Button, Input, Card } from "../../components";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { eventService } from "../../services/firebase";

const AddEventScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
  });
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errors, setErrors] = useState({});

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
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleLocationPicker = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access location"
        );
        setLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].name || ""} ${
          address[0].city || ""
        }, ${address[0].region || ""}`.trim();
        handleInputChange("location", locationString);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEventTime(selectedTime);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Event location is required";
    }

    // Check if event date/time is in the future
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(eventTime.getHours(), eventTime.getMinutes());

    if (eventDateTime <= new Date()) {
      newErrors.date = "Event must be scheduled for a future date/time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Combine date and time
      const eventDateTime = new Date(eventDate);
      eventDateTime.setHours(eventTime.getHours(), eventTime.getMinutes());

      const eventData = {
        ...formData,
        date: eventDateTime,
        createdBy: user.uid,
        organizerName: user.displayName || "Unknown",
        organizerAvatar:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.displayName || "User"
          )}&background=702963&color=fff`,
      };

      // Convert image to blob if selected
      let imageFile = null;
      if (selectedImage) {
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        imageFile = new File([blob], `event_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
      }

      await eventService.createEvent(eventData, imageFile);

      Alert.alert("Success", "Event created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Create Event</Text>
        <PaperButton
          mode="contained"
          onPress={handleCreateEvent}
          loading={loading}
          disabled={loading}
          style={styles.createButton}
          labelStyle={styles.createButtonText}
        >
          Create
        </PaperButton>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          {/* Event Image */}
          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.eventImage}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <IconButton icon="close" iconColor="#fff" size={20} />
              </TouchableOpacity>
            </View>
          )}

          {/* Form Fields */}
          <Input
            label="Event Title"
            value={formData.title}
            onChangeText={(value) => handleInputChange("title", value)}
            placeholder="What's the name of your event?"
            error={errors.title}
          />

          <Input
            label="Description"
            value={formData.description}
            onChangeText={(value) => handleInputChange("description", value)}
            placeholder="Tell people about your event"
            multiline
            numberOfLines={4}
            error={errors.description}
          />

          <Input
            label="Category"
            value={formData.category}
            onChangeText={(value) => handleInputChange("category", value)}
            placeholder="e.g., Music, Tech, Sports"
            error={errors.category}
          />

          {/* Date & Time Selectors */}
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{formatDate(eventDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>{formatTime(eventTime)}</Text>
            </TouchableOpacity>
          </View>

          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

          {/* Location */}
          <View style={styles.locationContainer}>
            <Input
              label="Location"
              value={formData.location}
              onChangeText={(value) => handleInputChange("location", value)}
              placeholder="Where is your event?"
              error={errors.location}
            />
            <TouchableOpacity
              style={styles.locationButton}
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
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleImagePicker}
            >
              <IconButton
                icon="camera"
                iconColor={staticTheme.colors.primary}
              />
              <Text style={styles.actionText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={eventTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
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
  createButton: {
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 20,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  formCard: {
    padding: spacing.lg,
  },
  imageContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  eventImage: {
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
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: staticTheme.colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateTimeValue: {
    fontSize: 16,
    color: staticTheme.colors.text,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    color: staticTheme.colors.error,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  locationButton: {
    marginLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.border,
  },
  actionButton: {
    alignItems: "center",
    padding: spacing.md,
  },
  actionText: {
    fontSize: 14,
    color: staticTheme.colors.primary,
    marginTop: spacing.xs,
  },
});

export default AddEventScreen;
