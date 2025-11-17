import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image, ScrollView } from "react-native";
import {
  Text,
  IconButton,
  Chip,
  FAB,
  ActivityIndicator,
} from "react-native-paper";
import { Card } from "../components";
import { HeaderLogo } from "../components/Logo";
import { theme as staticTheme, spacing } from "../constants";
import { eventService } from "../services/firebase";

const EventCard = ({ event, onPress }) => {
  const formatEventDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isEventPast = (date) => {
    return date && new Date(date) < new Date();
  };

  const isPast = isEventPast(event.date);

  return (
    <Card
      onPress={onPress}
      style={[styles.eventCard, isPast && styles.pastEventCard]}
    >
      {event.image && (
        <Image source={{ uri: event.image }} style={styles.eventImage} />
      )}

      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {isPast && (
            <Chip style={styles.pastChip} textStyle={styles.pastChipText}>
              Past
            </Chip>
          )}
        </View>

        <Text style={styles.eventDescription} numberOfLines={3}>
          {event.description}
        </Text>

        <View style={styles.eventMeta}>
          <Chip icon="calendar" style={styles.metaChip}>
            {formatEventDate(event.date)}
          </Chip>

          <Chip icon="map-marker" style={styles.metaChip}>
            {event.location}
          </Chip>

          {event.category && (
            <Chip style={styles.metaChip}>{event.category}</Chip>
          )}
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.eventStats}>
            <Text style={styles.attendeesText}>
              {event.attendeesCount || 0} attending
            </Text>
            <Text style={styles.organizerText}>
              by {event.organizerName || "Unknown"}
            </Text>
          </View>

          <IconButton
            icon="bookmark-outline"
            iconColor={staticTheme.colors.primary}
            onPress={(e) => {
              e.stopPropagation();
              // Save event functionality
            }}
          />
        </View>
      </View>
    </Card>
  );
};

const EventsScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadEvents();

    // Subscribe to real-time events updates
    const unsubscribe = eventService.subscribeToEvents((eventsData) => {
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await eventService.getEvents(50);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filteredEvents = events.filter((event) => {
    const now = new Date();
    const eventDate = new Date(event.date);

    switch (filter) {
      case "upcoming":
        return eventDate > now;
      case "past":
        return eventDate < now;
      case "today":
        return eventDate.toDateString() === now.toDateString();
      case "this-week":
        const weekFromNow = new Date();
        weekFromNow.setDate(now.getDate() + 7);
        return eventDate >= now && eventDate <= weekFromNow;
      default:
        return true;
    }
  });

  const renderEvent = ({ item }) => (
    <EventCard
      event={item}
      onPress={() => {
        // Convert Date objects to ISO strings for navigation serialization
        const serializableEvent = {
          ...item,
          date: item.date?.toISOString() || null,
          createdAt: item.createdAt?.toISOString() || null,
        };
        navigation.navigate("EventDetail", { event: serializableEvent });
      }}
    />
  );

  const FilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {[
        { key: "all", label: "All" },
        { key: "upcoming", label: "Upcoming" },
        { key: "today", label: "Today" },
        { key: "this-week", label: "This Week" },
        { key: "past", label: "Past" },
      ].map((filterType) => (
        <Chip
          key={filterType.key}
          selected={filter === filterType.key}
          onPress={() => setFilter(filterType.key)}
          style={styles.filterChip}
        >
          {filterType.label}
        </Chip>
      ))}
    </ScrollView>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="calendar-outline"
        size={64}
        iconColor={staticTheme.colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === "all"
          ? "Be the first to create an event!"
          : `No ${filter} events at the moment.`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={staticTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HeaderLogo />
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="magnify"
            onPress={() => {
              /* Search events functionality */
            }}
          />
        </View>
      </View>

      <FilterChips />

      <View style={styles.eventCount}>
        <Text style={styles.eventCountText}>
          {filteredEvents.length}{" "}
          {filteredEvents.length === 1 ? "event" : "events"}
          {filter !== "all" && ` (${filter})`}
        </Text>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredEvents.length === 0 && styles.emptyListContent,
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={<EmptyState />}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("AddEvent")}
      />
    </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: staticTheme.colors.text,
  },
  headerActions: {
    flexDirection: "row",
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  eventCount: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  eventCountText: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  eventCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventImage: {
    width: "100%",
    height: 150,
  },
  eventContent: {
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginRight: spacing.sm,
  },
  pastChip: {
    backgroundColor: staticTheme.colors.textSecondary,
  },
  pastChipText: {
    color: "#ffffff",
    fontSize: 12,
  },
  eventDescription: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  eventMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  metaChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventStats: {
    flex: 1,
  },
  attendeesText: {
    fontSize: 14,
    fontWeight: "600",
    color: staticTheme.colors.text,
  },
  organizerText: {
    fontSize: 12,
    color: staticTheme.colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 16,
    color: staticTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: staticTheme.colors.primary,
  },
});

export default EventsScreen;
