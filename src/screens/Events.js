import React, { useState } from "react";
import { View, StyleSheet, FlatList, Image, ScrollView } from "react-native";
import { Text, IconButton, Chip, FAB } from "react-native-paper";
import { Card } from "../components";
import { theme, spacing, mockEvents } from "../constants";

const EventCard = ({ event, onPress }) => {
  return (
    <Card onPress={onPress} style={styles.eventCard}>
      {event.image && (
        <Image source={{ uri: event.image }} style={styles.eventImage} />
      )}

      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>

        <View style={styles.eventMeta}>
          <Chip icon="calendar" style={styles.metaChip}>
            {event.date.toLocaleDateString()}
          </Chip>

          <Chip icon="map-marker" style={styles.metaChip}>
            {event.location}
          </Chip>
        </View>

        <View style={styles.eventFooter}>
          <Text style={styles.attendeesText}>{event.attendees} attending</Text>

          <IconButton
            icon="bookmark-outline"
            iconColor={theme.colors.primary}
            onPress={() => console.log("Save event")}
          />
        </View>
      </View>
    </Card>
  );
};

const EventsScreen = ({ navigation }) => {
  const [events, setEvents] = useState(mockEvents);
  const [filter, setFilter] = useState("all");

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return event.date > new Date();
    if (filter === "past") return event.date < new Date();
    return true;
  });

  const renderEvent = ({ item }) => (
    <EventCard
      event={item}
      onPress={() => navigation.navigate("EventDetail", { event: item })}
    />
  );

  const FilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {["all", "upcoming", "past"].map((filterType) => (
        <Chip
          key={filterType}
          selected={filter === filterType}
          onPress={() => setFilter(filterType)}
          style={styles.filterChip}
        >
          {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
        </Chip>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/inlinelogo.jpg")}
            style={styles.headerLogo}
          />
          <Text style={styles.title}>Events</Text>
        </View>
        <IconButton
          icon="magnify"
          onPress={() => console.log("Search events")}
        />
      </View>

      <FilterChips />

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  eventCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    height: 150,
  },
  eventContent: {
    padding: spacing.md,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: spacing.md,
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
  attendeesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default EventsScreen;
