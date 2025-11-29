import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Text as RNText,
} from "react-native";
import { Text, IconButton, Badge } from "react-native-paper";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from "react-native-agora";
import { useAuth } from "../../contexts/AuthContext";
import { liveStreamService } from "../../services/firebase";
import { generateAgoraToken } from "../../services/agoraService";
import { AGORA_APP_ID } from "../../config/agora";
import { theme, spacing } from "../../constants";

const LiveStreamScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState(null);
  const agoraEngineRef = useRef(null);
  const channelName = useRef(`live_${user.uid}_${Date.now()}`);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    initializeAgora();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      if (!AGORA_APP_ID) {
        Alert.alert("Error", "Agora App ID is not configured");
        return;
      }

      // Create Agora engine instance
      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;

      // Initialize engine
      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Enable video
      engine.enableVideo();

      // Set client role to broadcaster
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Register event handlers
      engine.registerEventHandler({
        onUserJoined: (_connection, uid) => {
          console.log("Viewer joined:", uid);
        },
        onUserOffline: (_connection, uid, reason) => {
          console.log("Viewer left:", uid);
        },
        onError: (err) => {
          console.error("Agora Error:", err);
        },
      });
    } catch (error) {
      console.error("Error initializing Agora:", error);
      Alert.alert("Error", "Failed to initialize streaming");
    }
  };

  const startLiveStream = async () => {
    try {
      if (!agoraEngineRef.current) {
        Alert.alert("Error", "Streaming not initialized");
        return;
      }

      // Generate Agora token
      const token = await generateAgoraToken(channelName.current, user.uid);

      // Create live stream in Firebase
      const stream = await liveStreamService.createLiveStream({
        userId: user.uid,
        channelName: channelName.current,
        title: `${user.displayName || user.username}'s Live`,
      });

      setStreamId(stream.id);

      // Join channel
      await agoraEngineRef.current.joinChannel(
        token,
        channelName.current,
        null,
        0
      );

      setIsStreaming(true);

      // Subscribe to viewer count updates
      unsubscribeRef.current = liveStreamService.subscribeToLiveStream(
        stream.id,
        (streamData) => {
          if (streamData) {
            setViewerCount(streamData.viewerCount || 0);
          }
        }
      );
    } catch (error) {
      console.error("Error starting live stream:", error);
      Alert.alert("Error", "Failed to start live stream");
    }
  };

  const endLiveStream = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.leaveChannel();
      }

      if (streamId) {
        await liveStreamService.endLiveStream(streamId);
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      setIsStreaming(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error ending live stream:", error);
      Alert.alert("Error", "Failed to end stream properly");
      navigation.goBack();
    }
  };

  const toggleCamera = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.enableLocalVideo(!isCameraOn);
        setIsCameraOn(!isCameraOn);
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  const toggleMute = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.muteLocalAudioStream(!isMuted);
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  const switchCamera = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.switchCamera();
        setIsFrontCamera(!isFrontCamera);
      }
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  };

  const handleEndStreamPress = () => {
    Alert.alert(
      "End Live Stream",
      "Are you sure you want to end your live stream?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Stream", onPress: endLiveStream, style: "destructive" },
      ]
    );
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
      if (streamId && isStreaming) {
        await liveStreamService.endLiveStream(streamId);
      }
    } catch (error) {
      console.error("Error cleaning up:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Video Preview/Stream */}
      <View style={styles.videoContainer}>
        {isStreaming && isCameraOn ? (
          <RtcSurfaceView
            canvas={{ uid: 0 }}
            style={styles.video}
            zOrderMediaOverlay={true}
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <Text style={styles.noVideoText}>
              {!isStreaming ? "Ready to go live" : "Camera is off"}
            </Text>
          </View>
        )}
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <IconButton icon="arrow-left" iconColor="#fff" size={24} />
        </TouchableOpacity>

        {isStreaming && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveBadge}>
              <RNText style={styles.liveText}>LIVE</RNText>
            </View>
            <View style={styles.viewerBadge}>
              <IconButton icon="eye" iconColor="#fff" size={16} />
              <RNText style={styles.viewerText}>{viewerCount}</RNText>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {!isStreaming ? (
          <TouchableOpacity
            style={styles.goLiveButton}
            onPress={startLiveStream}
          >
            <Text style={styles.goLiveText}>Go Live</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={switchCamera}
            >
              <IconButton icon="camera-flip" iconColor="#fff" size={28} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <IconButton
                icon={isMuted ? "microphone-off" : "microphone"}
                iconColor="#fff"
                size={28}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCamera}
            >
              <IconButton
                icon={isCameraOn ? "video" : "video-off"}
                iconColor="#fff"
                size={28}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndStreamPress}
            >
              <IconButton icon="close" iconColor="#fff" size={28} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  noVideoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  topControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  liveBadge: {
    backgroundColor: "#E63946",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  liveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
  bottomControls: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  goLiveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 30,
    alignItems: "center",
  },
  goLiveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  endButton: {
    backgroundColor: "#E63946",
  },
});

export default LiveStreamScreen;
