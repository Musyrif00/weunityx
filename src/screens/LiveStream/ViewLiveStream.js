import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Text as RNText,
  ScrollView,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RenderModeType,
} from "react-native-agora";
import { useAuth } from "../../contexts/AuthContext";
import { liveStreamService, userService } from "../../services/firebase";
import { generateAgoraToken } from "../../services/agoraService";
import { AGORA_APP_ID } from "../../config/agora";
import { theme, spacing } from "../../constants";

const ViewLiveStreamScreen = ({ route, navigation }) => {
  const { streamId } = route.params;
  const { user } = useAuth();
  const [streamData, setStreamData] = useState(null);
  const [hostInfo, setHostInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [hostUid, setHostUid] = useState(null);
  const agoraEngineRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const hasLeftStream = useRef(false);
  const broadcasterUidRef = useRef(0); // Store expected broadcaster UID

  useEffect(() => {
    loadStreamData();
    initializeAgora();

    return () => {
      cleanup();
    };
  }, []);

  const loadStreamData = async () => {
    try {
      const stream = await liveStreamService.getLiveStream(streamId);
      if (!stream) {
        Alert.alert("Error", "Live stream not found");
        navigation.goBack();
        return;
      }

      if (!stream.isActive) {
        Alert.alert("Stream Ended", "This live stream has ended");
        navigation.goBack();
        return;
      }

      setStreamData(stream);

      // Load host info
      const host = await userService.getUser(stream.userId);
      setHostInfo(host);

      // Subscribe to stream updates
      unsubscribeRef.current = liveStreamService.subscribeToLiveStream(
        streamId,
        (updatedStream) => {
          if (!updatedStream || !updatedStream.isActive) {
            Alert.alert("Stream Ended", "The host has ended this live stream");
            navigation.goBack();
            return;
          }
          setViewerCount(updatedStream.viewerCount || 0);
        }
      );

      // Increment viewer count
      await liveStreamService.joinLiveStream(streamId);
    } catch (error) {
      console.error("Error loading stream data:", error);
      Alert.alert("Error", "Failed to load stream");
      navigation.goBack();
    }
  };

  const initializeAgora = async () => {
    try {
      if (!AGORA_APP_ID) {
        Alert.alert("Error", "Agora App ID is not configured");
        return;
      }

      // Create Agora engine instance
      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;

      // Initialize engine with LiveBroadcasting profile for streaming
      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      console.log("✅ Agora engine initialized with LiveBroadcasting profile");

      // Enable video and audio to receive streams
      engine.enableVideo();
      engine.enableAudio();

      // Set speaker on for live streams
      engine.setDefaultAudioRouteToSpeakerphone(true);

      // Event handlers will be registered in joinStream() to avoid being overwritten
      console.log("✅ Viewer setup complete, waiting for stream data...");
    } catch (error) {
      console.error("Error initializing Agora:", error);
      Alert.alert("Error", "Failed to connect to stream");
    }
  };

  useEffect(() => {
    if (streamData && agoraEngineRef.current) {
      joinStream();
    }
  }, [streamData]);

  const joinStream = async () => {
    try {
      if (!streamData || !agoraEngineRef.current) {
        console.log("❌ Missing streamData or agora engine");
        return;
      }

      console.log("Generating token for viewer...");
      console.log("Channel:", streamData.channelName);
      console.log("Host UID:", streamData.hostUid);

      // Generate unique numeric UID for viewer (hash the user.uid to get a number != 0)
      // Generate unique numeric UID for viewer
      const viewerUid =
        (Math.abs(
          user.uid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) %
          1000000) +
        1;

      console.log("Viewer UID:", viewerUid);

      // Generate Agora token for audience role
      let token;
      try {
        const tokenResult = await generateAgoraToken(
          streamData.channelName,
          viewerUid,
          "audience"
        );
        token = tokenResult.token;
        console.log("✅ Token generated successfully");
        console.log("Token length:", token.length);
      } catch (tokenError) {
        console.error("❌ Token generation failed:", tokenError);
        Alert.alert(
          "Error",
          "Failed to generate stream token: " + tokenError.message
        );
        return;
      }

      // Store broadcaster UID for use in callback
      broadcasterUidRef.current = streamData.hostUid || 0;

      // Set client role to audience
      const engine = agoraEngineRef.current;
      await engine.setClientRole(ClientRoleType.ClientRoleAudience);
      console.log("✅ Client role set to audience");

      // Re-register event handlers right before joining
      engine.registerEventHandler({
        onJoinChannelSuccess: async () => {
          console.log("✅ Viewer joined channel successfully");
          setIsConnected(true);
        },
        onUserJoined: async (_connection, uid) => {
          console.log("👤 Broadcaster joined with UID:", uid);

          try {
            // Setup remote video for the broadcaster when they join
            await engine.setupRemoteVideo({
              uid: uid,
              renderMode: RenderModeType.RenderModeHidden,
            });
            console.log("📺 Remote video setup for UID:", uid);

            // Subscribe to broadcaster's streams
            await engine.muteRemoteVideoStream(uid, false);
            await engine.muteRemoteAudioStream(uid, false);
            console.log("✅ Subscribed to broadcaster streams");

            setHostUid(uid);
          } catch (error) {
            console.error("❌ Error setting up remote video:", error);
          }
        },
        onUserOffline: () => {
          console.log("👋 Broadcaster left");
          setHostUid(null);
          Alert.alert("Stream Ended", "The host has ended the live stream");
          navigation.goBack();
        },
        onRemoteVideoStateChanged: (_connection, uid, state, reason) => {
          console.log(
            "📹 Remote video state:",
            state,
            "UID:",
            uid,
            "Reason:",
            reason
          );
          if (state === 2) {
            console.log("✅ Remote video decoding started");
            setHostUid(uid);
          }
        },
        onError: (err, msg) => {
          console.error("❌ Agora Error:", err, msg);
        },
      });

      // Join channel
      console.log("📡 Calling joinChannel...");
      console.log("Parameters:", {
        token: token ? `${token.substring(0, 20)}...` : "null",
        channel: streamData.channelName,
        uid: viewerUid,
        role: "audience",
      });

      const result = await agoraEngineRef.current.joinChannel(
        token,
        streamData.channelName,
        viewerUid,
        {
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
          clientRoleType: ClientRoleType.ClientRoleAudience,
          publishMicrophoneTrack: false,
          publishCameraTrack: false,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        }
      );
      console.log("📡 joinChannel result:", result);
    } catch (error) {
      console.error("❌ Error joining stream:", error);
      Alert.alert("Error", "Failed to join stream: " + error.message);
    }
  };

  const leaveStream = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.leaveChannel();
      }

      if (streamId && !hasLeftStream.current) {
        await liveStreamService.leaveLiveStream(streamId);
        hasLeftStream.current = true;
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error leaving stream:", error);
      navigation.goBack();
    }
  };

  const cleanup = async () => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
      }
      if (streamId && !hasLeftStream.current) {
        await liveStreamService.leaveLiveStream(streamId);
        hasLeftStream.current = true;
      }
    } catch (error) {
      console.error("Error cleaning up:", error);
    }
  };

  if (!streamData || !hostInfo) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading stream...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Host Video Stream */}
      <View style={styles.videoContainer}>
        {isConnected && hostUid !== null ? (
          <RtcSurfaceView canvas={{ uid: hostUid }} style={styles.video} />
        ) : (
          <View style={styles.connectingContainer}>
            <Text style={styles.connectingText}>
              {isConnected
                ? "Waiting for host video..."
                : "Connecting to stream..."}
            </Text>
          </View>
        )}
      </View>

      {/* Top Info */}
      <View style={styles.topInfo}>
        <TouchableOpacity style={styles.backButton} onPress={leaveStream}>
          <IconButton icon="arrow-left" iconColor="#fff" size={24} />
        </TouchableOpacity>

        <View style={styles.hostInfo}>
          <Text style={styles.hostName}>
            {hostInfo.displayName || hostInfo.username}
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveBadge}>
              <RNText style={styles.liveText}>LIVE</RNText>
            </View>
            <View style={styles.viewerBadge}>
              <IconButton icon="eye" iconColor="#fff" size={16} />
              <RNText style={styles.viewerText}>{viewerCount}</RNText>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Interaction Area */}
      <View style={styles.bottomArea}>
        <Text style={styles.streamTitle}>{streamData.title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  connectingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  connectingText: {
    color: "#fff",
    fontSize: 16,
  },
  topInfo: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
  },
  hostInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  hostName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  liveBadge: {
    backgroundColor: "#E63946",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
  },
  viewerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: -8,
  },
  bottomArea: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  streamTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: spacing.md,
    borderRadius: 8,
  },
});

export default ViewLiveStreamScreen;
