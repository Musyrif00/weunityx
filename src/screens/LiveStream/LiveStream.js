import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Text as RNText,
  BackHandler,
  PermissionsAndroid,
} from "react-native";
import { Text, IconButton, Badge } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RenderModeType,
  VideoMirrorModeType,
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
  const [isPaused, setIsPaused] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const agoraEngineRef = useRef(null);
  const channelName = useRef(`live_${user.uid}_${Date.now()}`);
  const unsubscribeRef = useRef(null);
  const isUnmountingRef = useRef(false);

  useEffect(() => {
    initializeAgora();
    return () => {
      isUnmountingRef.current = true;
      cleanup();
    };
  }, []);

  // Handle back button and navigation events
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused
      if (isPaused && isStreaming) {
        // Resume the stream
        resumeStream();
      }

      // Handle hardware back button on Android
      const onBackPress = () => {
        if (isStreaming) {
          handleNavigateAway();
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        // Screen is unfocused
        if (isStreaming && !isUnmountingRef.current) {
          // Pause the stream when navigating away
          pauseStream();
        }
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [isStreaming, isPaused])
  );

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        return (
          granted["android.permission.RECORD_AUDIO"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.CAMERA"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error("Permission error:", err);
        return false;
      }
    }
    return true;
  };

  const initializeAgora = async () => {
    try {
      if (!AGORA_APP_ID) {
        Alert.alert("Error", "Agora App ID is not configured");
        return;
      }

      // Request permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Denied",
          "Camera and microphone access are required for live streaming"
        );
        navigation.goBack();
        return;
      }

      // Create Agora engine instance
      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;

      // Initialize engine with Communication profile
      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      // Register event handlers
      engine.registerEventHandler({
        onError: (err, msg) => {
          console.error("Agora Error:", err, msg);
        },
      });

      // Enable video and audio before preview
      engine.enableVideo();
      engine.enableAudio();

      // Start preview
      await engine.startPreview();

      // Force re-render to show the video
      setTimeout(() => {
        setIsPreviewReady(true);
      }, 300);
    } catch (error) {
      console.error("Error initializing Agora:", error);
      Alert.alert("Error", "Failed to initialize streaming: " + error.message);
    }
  };

  const startLiveStream = async () => {
    try {
      if (!agoraEngineRef.current) {
        Alert.alert("Error", "Streaming not initialized");
        return;
      }

      // Generate Agora token for publisher role
      const token = await generateAgoraToken(
        channelName.current,
        0,
        "publisher"
      );

      // Create live stream in Firebase with host UID
      const stream = await liveStreamService.createLiveStream({
        userId: user.uid,
        channelName: channelName.current,
        title: `${user.displayName || user.username}'s Live`,
        hostUid: 0, // Store host's Agora UID so viewers know who to watch
      });

      setStreamId(stream.id);

      // Re-register event handlers right before joining
      agoraEngineRef.current.registerEventHandler({
        onError: (err, msg) => {
          console.error("Agora Error:", err, msg);
        },
      });

      // Join channel as broadcaster
      await agoraEngineRef.current.joinChannel(
        token,
        channelName.current,
        null,
        0
      );

      // Ensure local video/audio are not muted
      await agoraEngineRef.current.muteLocalVideoStream(false);
      await agoraEngineRef.current.muteLocalAudioStream(false);

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

  const pauseStream = async () => {
    try {
      console.log("Pausing stream...");
      if (agoraEngineRef.current) {
        // Disable local video and audio when paused
        await agoraEngineRef.current.enableLocalVideo(false);
        await agoraEngineRef.current.muteLocalAudioStream(true);
      }
      setIsPaused(true);
    } catch (error) {
      console.error("Error pausing stream:", error);
    }
  };

  const resumeStream = async () => {
    try {
      console.log("Resuming stream...");
      if (agoraEngineRef.current) {
        // Re-enable video and audio based on previous state
        await agoraEngineRef.current.enableLocalVideo(isCameraOn);
        await agoraEngineRef.current.muteLocalAudioStream(isMuted);
      }
      setIsPaused(false);
    } catch (error) {
      console.error("Error resuming stream:", error);
    }
  };

  const handleNavigateAway = () => {
    Alert.alert(
      "Live Stream Active",
      "You have an active live stream. What would you like to do?",
      [
        {
          text: "Continue Streaming",
          onPress: () => {
            // Stay on the screen
          },
          style: "cancel",
        },
        {
          text: "End Stream",
          onPress: () => {
            endLiveStream();
          },
          style: "destructive",
        },
      ],
      { cancelable: false }
    );
  };

  const endLiveStream = async () => {
    try {
      isUnmountingRef.current = true;

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
      setIsPaused(false);
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
        agoraEngineRef.current.stopPreview();
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
        {isCameraOn && !isPaused ? (
          isPreviewReady ? (
            <RtcSurfaceView
              key="livestream-preview"
              canvas={{
                uid: 0,
                renderMode: RenderModeType.RenderModeHidden,
                mirrorMode: VideoMirrorModeType.VideoMirrorModeAuto,
              }}
              style={styles.video}
            />
          ) : (
            <View style={styles.noVideoContainer}>
              <Text style={styles.noVideoText}>Initializing camera...</Text>
            </View>
          )
        ) : (
          <View style={styles.noVideoContainer}>
            <Text style={styles.noVideoText}>
              {isPaused ? "Stream Paused" : "Camera is off"}
            </Text>
            {isPaused && (
              <Text style={styles.pausedSubText}>
                Your stream is paused. Return to this screen to resume.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (isStreaming) {
              handleNavigateAway();
            } else {
              navigation.goBack();
            }
          }}
        >
          <IconButton icon="arrow-left" iconColor="#fff" size={24} />
        </TouchableOpacity>

        {isStreaming && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveBadge, isPaused && styles.pausedBadge]}>
              <RNText style={styles.liveText}>
                {isPaused ? "PAUSED" : "LIVE"}
              </RNText>
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
    width: "100%",
    height: "100%",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
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
  pausedSubText: {
    color: "#ccc",
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
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
  pausedBadge: {
    backgroundColor: "#FFA500",
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
