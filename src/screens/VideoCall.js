import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
  RenderModeType,
} from "react-native-agora";
import { AGORA_APP_ID } from "../config/agora";
import { theme } from "../constants/theme";
import { generateAgoraToken } from "../services/agoraService";
import { useAuth } from "../contexts/AuthContext";
import { callService } from "../services/firebase";

const VideoCallScreen = ({ route, navigation }) => {
  const { channelName, otherUser } = route.params;
  const { user } = useAuth();
  const agoraEngineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [localUid, setLocalUid] = useState(null);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [agoraToken, setAgoraToken] = useState(null);

  useEffect(() => {
    initAgora();
    return () => {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
      }
    };
  }, []);

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

  const initAgora = async () => {
    try {
      // Request permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Denied",
          "Camera and microphone access are required for video calls"
        );
        navigation.goBack();
        return;
      }

      // Generate unique numeric UID for this user
      const uid =
        (Math.abs(
          user.uid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) %
          1000000) +
        1;
      setLocalUid(uid);
      console.log("📱 Local UID:", uid);

      // Generate Agora token
      console.log("Generating token for channel:", channelName);
      const tokenData = await generateAgoraToken(channelName, uid, "publisher");
      setAgoraToken(tokenData.token);
      console.log("Token generated successfully");

      // Create RTC engine
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;

      // Initialize engine
      agoraEngine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      // Register event handlers
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log("✅ Joined channel successfully");
          setJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          console.log("👤 Remote user joined with UID:", uid);
          setRemoteUid(uid);
        },
        onRemoteVideoStateChanged: (_connection, uid, state, reason) => {
          console.log("📹 Remote video state changed:", { uid, state, reason });
          // State 0 = Stopped, State 1 = Starting, State 2 = Decoding, State 3 = Frozen, State 4 = Failed
          // Reason 5 = Remote user muted video, Reason 6 = Remote user unmuted video
          if (reason === 5 || state === 0) {
            // Remote user turned off camera
            setRemoteVideoMuted(true);
          } else if (reason === 6 || state === 2) {
            // Remote user turned on camera or video is decoding
            setRemoteVideoMuted(false);
          }
        },
        onUserOffline: (_connection, uid) => {
          console.log("👋 Remote user left:", uid);
          setRemoteUid(null);
          // End the call immediately when the other person leaves
          Alert.alert(
            "Call Ended",
            `${otherUser?.fullName} left the call`,
            [
              {
                text: "OK",
                onPress: () => handleEndCall(),
              },
            ],
            { cancelable: false }
          );
        },
        onError: (err, msg) => {
          console.error("❌ Agora Error:", err, msg);
        },
      });

      // Enable audio and video modules
      agoraEngine.enableAudio();
      agoraEngine.enableVideo();

      // Set speaker on by default for video calls
      agoraEngine.setDefaultAudioRouteToSpeakerphone(true);

      // Start preview first
      agoraEngine.startPreview();

      // Small delay to ensure preview starts
      await new Promise((resolve) => setTimeout(resolve, 200));
      setLocalVideoReady(true);

      // Join channel with token and publish camera/mic
      await agoraEngine.joinChannel(tokenData.token, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      console.log("✅ Joined channel with UID:", uid);
    } catch (error) {
      Alert.alert("Error", "Failed to start video call: " + error.message);
      navigation.goBack();
    }
  };

  const handleEndCall = async () => {
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
      }

      // Cancel call notification for the other user
      if (otherUser?.id && channelName) {
        try {
          await callService.cancelCallNotification(otherUser.id, channelName);
        } catch (error) {
          console.error("Error canceling call notification:", error);
        }
      }

      navigation.goBack();
    } catch (error) {
      navigation.goBack();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (otherUser?.id && channelName) {
        callService
          .cancelCallNotification(otherUser.id, channelName)
          .catch((err) => console.error("Cleanup error:", err));
      }
    };
  }, [otherUser?.id, channelName]);

  const toggleMute = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.muteLocalAudioStream(!muted);
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (agoraEngineRef.current) {
      const newState = !videoEnabled;
      // Enable or disable local video capture and publishing
      if (newState) {
        // Turn camera ON
        agoraEngineRef.current.muteLocalVideoStream(false);
        agoraEngineRef.current.enableLocalVideo(true);
        agoraEngineRef.current.startPreview();
        setLocalVideoReady(true);
      } else {
        // Turn camera OFF
        agoraEngineRef.current.muteLocalVideoStream(true);
        agoraEngineRef.current.enableLocalVideo(false);
        agoraEngineRef.current.stopPreview();
        setLocalVideoReady(false);
      }
      setVideoEnabled(newState);
    }
  };

  const toggleSpeaker = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.setEnableSpeakerphone(!speakerEnabled);
      setSpeakerEnabled(!speakerEnabled);
    }
  };

  const switchCamera = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.switchCamera();
    }
  };

  return (
    <View style={styles.container}>
      {/* Remote Video (Full Screen) */}
      {remoteUid ? (
        <>
          <RtcSurfaceView
            key={`remote-${remoteUid}`}
            canvas={{
              uid: remoteUid,
              renderMode: RenderModeType.RenderModeHidden,
            }}
            style={styles.remoteVideo}
          />
          {/* Video Paused Overlay */}
          {remoteVideoMuted && (
            <View style={styles.videoPausedOverlay}>
              <View style={styles.videoPausedContent}>
                <IconButton icon="video-off" size={60} iconColor="white" />
                <Text style={styles.videoPausedText}>Video Paused</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            Calling {otherUser?.fullName}...
          </Text>
        </View>
      )}

      {/* Local Video (Picture-in-Picture) */}
      {videoEnabled && localVideoReady && localUid && (
        <View style={styles.localVideoContainer}>
          <RtcSurfaceView
            canvas={{
              uid: localUid,
              sourceType: VideoSourceType.VideoSourceCamera,
            }}
            style={styles.localVideo}
          />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, muted && styles.activeControl]}
          onPress={toggleMute}
        >
          <IconButton
            icon={muted ? "microphone-off" : "microphone"}
            iconColor="white"
            size={28}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !videoEnabled && styles.activeControl]}
          onPress={toggleVideo}
        >
          <IconButton
            icon={videoEnabled ? "video" : "video-off"}
            iconColor="white"
            size={28}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
          <IconButton icon="camera-flip" iconColor="white" size={28} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            !speakerEnabled && styles.activeControl,
          ]}
          onPress={toggleSpeaker}
        >
          <IconButton
            icon={speakerEnabled ? "volume-high" : "volume-off"}
            iconColor="white"
            size={28}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <IconButton icon="phone-hangup" iconColor="white" size={28} />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{otherUser?.fullName}</Text>
        <Text style={styles.callStatus}>
          {remoteUid ? "Connected" : "Calling..."}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  waitingText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  videoPausedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  videoPausedContent: {
    alignItems: "center",
  },
  videoPausedText: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
    marginTop: 12,
  },
  localVideoContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#000",
    zIndex: 10,
    elevation: 10,
  },
  localVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    zIndex: 20,
    elevation: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeControl: {
    backgroundColor: theme.colors.error,
  },
  endCallButton: {
    backgroundColor: theme.colors.error,
  },
  userInfo: {
    position: "absolute",
    top: Platform.OS === "ios" ? 220 : 200,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 12,
    borderRadius: 8,
    zIndex: 15,
    elevation: 15,
  },
  userName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  callStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
});

export default VideoCallScreen;
