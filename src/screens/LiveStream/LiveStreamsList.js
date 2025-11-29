import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { Text, Card, Badge, ActivityIndicator } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import { liveStreamService, userService } from "../../services/firebase";
import { theme, spacing } from "../../constants";

const LiveStreamsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hostData, setHostData] = useState({});

  useEffect(() => {
    const unsubscribe = liveStreamService.subscribeToActiveLiveStreams(
      async (activeStreams) => {
        setStreams(activeStreams);
        setLoading(false);
        setRefreshing(false);

        // Load host data for each stream
        const hosts = {};
        for (const stream of activeStreams) {
          if (!hosts[stream.userId]) {
            try {
              const hostInfo = await userService.getUser(stream.userId);
              hosts[stream.userId] = hostInfo;
            } catch (error) {
              console.error("Error loading host info:", error);
            }
          }
        }
        setHostData((prev) => ({ ...prev, ...hosts }));
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handleStreamPress = (stream) => {
    navigation.navigate("ViewLiveStream", { streamId: stream.id });
  };

  const handleGoLive = () => {
    navigation.navigate("LiveStream");
  };

  const renderStreamItem = ({ item }) => {
    const host = hostData[item.userId];

    return (
      <TouchableOpacity
        style={styles.streamCard}
        onPress={() => handleStreamPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.streamPreview}>
          {/* Placeholder for stream thumbnail - you can add actual video preview later */}
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.placeholderText}>LIVE</Text>
          </View>

          {/* Live Badge */}
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          {/* Viewer Count */}
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerText}>👁 {item.viewerCount || 0}</Text>
          </View>
        </View>

        <View style={styles.streamInfo}>
          <Text style={styles.streamTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.hostName} numberOfLines={1}>
            {host?.displayName || host?.username || "Loading..."}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No live streams right now</Text>
        <Text style={styles.emptySubtext}>Be the first to go live!</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Streams</Text>
        <TouchableOpacity style={styles.goLiveButton} onPress={handleGoLive}>
          <Text style={styles.goLiveButtonText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {/* Streams List */}
      <FlatList
        data={streams}
        renderItem={renderStreamItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  goLiveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  goLiveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  listContainer: {
    padding: spacing.md,
    flexGrow: 1,
  },
  streamCard: {
    flex: 1,
    margin: spacing.sm,
    maxWidth: "48%",
  },
  streamPreview: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  liveBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "#E63946",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  viewerBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  streamInfo: {
    paddingVertical: spacing.sm,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  hostName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default LiveStreamsListScreen;
