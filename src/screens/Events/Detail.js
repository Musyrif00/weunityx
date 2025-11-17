import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  IconButton,
  Button as PaperButton,
  Chip,
  Avatar,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { Card } from "../../components";
import { theme as staticTheme, spacing } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { eventService, userService } from "../../services/firebase";

const EventDetailScreen = ({ route, navigation }) => {
  const { event: eventParam } = route.params || {};
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isAttending, setIsAttending] = useState(false);
  const [organizer, setOrganizer] = useState(null);

  useEffect(() => {
    if (eventParam?.id) {
      loadEventDetails();
    } else if (eventParam) {
      // Convert ISO strings back to Date objects if needed
      const eventWithDates = {
        ...eventParam,
        date: eventParam.date ? new Date(eventParam.date) : new Date(),
        createdAt: eventParam.createdAt
          ? new Date(eventParam.createdAt)
          : new Date(),
      };
      setEvent(eventWithDates);
      setIsAttending(eventWithDates.attendees?.includes(user.uid) || false);
      loadOrganizerData(eventWithDates.createdBy);
      setLoading(false);
    }
  }, [eventParam?.id, user.uid]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getEvent(eventParam.id);

      if (eventData) {
        setEvent(eventData);
        setIsAttending(eventData.attendees?.includes(user.uid) || false);
        await loadOrganizerData(eventData.createdBy);
      }
    } catch (error) {
      console.error("Error loading event details:", error);
      Alert.alert("Error", "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizerData = async (organizerId) => {
    try {
      const userData = await userService.getUser(organizerId);
      setOrganizer(userData);
    } catch (error) {
      console.error("Error loading organizer data:", error);
    }
  };

  const handleAttendanceToggle = async () => {
    if (!event?.id) return;

    setAttendanceLoading(true);
    try {
      await eventService.toggleAttendance(event.id, user.uid, isAttending);
      setIsAttending(!isAttending);

      // Update local attendee count
      setEvent((prev) => ({
        ...prev,
        attendeesCount: isAttending
          ? (prev.attendeesCount || 0) - 1
          : (prev.attendeesCount || 0) + 1,
      }));
    } catch (error) {
      console.error("Error toggling attendance:", error);
      Alert.alert("Error", "Failed to update attendance");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const formatEventDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEventTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isEventPast = (date) => {
    return date && new Date(date) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <IconButton
          icon="calendar-remove"
          size={64}
          iconColor={staticTheme.colors.textSecondary}
        />
        <Text style={styles.errorText}>Event not found</Text>
        <PaperButton
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </PaperButton>
      </View>
    );
  }

  const isPastEvent = isEventPast(event.date);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Event Details</Text>
        <IconButton
          icon="share"
          onPress={() => {
            /* Share event functionality */
          }}
        />
      </View>

      {/* Event Image */}
      {event.image && (
        <Image source={{ uri: event.image }} style={styles.eventImage} />
      )}

      {/* Event Details */}
      <Card style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.category && (
            <Chip style={styles.categoryChip}>{event.category}</Chip>
          )}
        </View>

        <Text style={styles.eventDescription}>{event.description}</Text>

        {/* Date and Time */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <IconButton
              icon="calendar"
              iconColor={staticTheme.colors.primary}
              size={20}
            />
            <View>
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>
                {formatEventDate(event.date)}
              </Text>
            </View>
          </View>

          <View style={styles.dateTimeItem}>
            <IconButton
              icon="clock"
              iconColor={staticTheme.colors.primary}
              size={20}
            />
            <View>
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>
                {formatEventTime(event.date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationContainer}>
          <IconButton
            icon="map-marker"
            iconColor={staticTheme.colors.primary}
            size={20}
          />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Location</Text>
            <Text style={styles.locationValue}>{event.location}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Organizer */}
        <View style={styles.organizerContainer}>
          <Text style={styles.organizerTitle}>Organized by</Text>
          <View style={styles.organizerInfo}>
            <Avatar.Image
              source={{
                uri:
                  organizer?.avatar ||
                  event.organizerAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    organizer?.fullName || "Organizer"
                  )}&background=702963&color=fff`,
              }}
              size={40}
            />
            <View style={styles.organizerDetails}>
              <Text style={styles.organizerName}>
                {organizer?.fullName ||
                  event.organizerName ||
                  "Unknown Organizer"}
              </Text>
              {organizer?.bio && (
                <Text style={styles.organizerBio} numberOfLines={2}>
                  {organizer.bio}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("UserProfile", {
                  user: { id: event.createdBy, ...organizer },
                })
              }
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Attendance Info */}
        <View style={styles.attendanceContainer}>
          <View style={styles.attendanceInfo}>
            <Text style={styles.attendanceCount}>
              {event.attendeesCount || 0} attending
            </Text>
            {event.interestedCount > 0 && (
              <Text style={styles.interestedCount}>
                {event.interestedCount} interested
              </Text>
            )}
          </View>

          {/* Attendance Button */}
          <PaperButton
            mode={isAttending ? "outlined" : "contained"}
            onPress={handleAttendanceToggle}
            loading={attendanceLoading}
            disabled={attendanceLoading || isPastEvent}
            style={[
              styles.attendanceButton,
              isAttending && styles.attendingButton,
              isPastEvent && styles.disabledButton,
            ]}
            labelStyle={[
              styles.attendanceButtonText,
              isAttending && styles.attendingButtonText,
            ]}
          >
            {isPastEvent
              ? "Event Ended"
              : isAttending
              ? "Attending"
              : "Attend Event"}
          </PaperButton>
        </View>
      </Card>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticTheme.colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: staticTheme.colors.text,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
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
  eventImage: {
    width: "100%",
    height: 200,
  },
  eventCard: {
    margin: spacing.md,
  },
  eventHeader: {
    marginBottom: spacing.lg,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    alignSelf: "flex-start",
  },
  eventDescription: {
    fontSize: 16,
    color: staticTheme.colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  dateTimeContainer: {
    marginBottom: spacing.lg,
  },
  dateTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  dateTimeValue: {
    fontSize: 16,
    color: staticTheme.colors.text,
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  locationValue: {
    fontSize: 16,
    color: staticTheme.colors.text,
    fontWeight: "500",
  },
  divider: {
    marginVertical: spacing.lg,
  },
  organizerContainer: {
    marginBottom: spacing.lg,
  },
  organizerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.md,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizerDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
  },
  organizerBio: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewProfileText: {
    fontSize: 14,
    color: staticTheme.colors.primary,
    fontWeight: "600",
  },
  attendanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceCount: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
  },
  interestedCount: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  attendanceButton: {
    borderRadius: 20,
    marginLeft: spacing.md,
  },
  attendingButton: {
    borderColor: staticTheme.colors.primary,
  },
  disabledButton: {
    backgroundColor: staticTheme.colors.textSecondary,
  },
  attendanceButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  attendingButtonText: {
    color: staticTheme.colors.primary,
  },
});

export default EventDetailScreen;
