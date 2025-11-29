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
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
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

      // Generate Agora token
      console.log("Generating token for channel:", channelName);
      const tokenData = await generateAgoraToken(channelName, 0, "publisher");
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
          setJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          setRemoteUid(uid);
        },
        onUserOffline: (_connection, uid) => {
          setRemoteUid(null);
          Alert.alert("Call Ended", `${otherUser?.fullName} left the call`);
        },
      });

      // Enable audio and video
      agoraEngine.enableAudio();
      agoraEngine.enableVideo();
      agoraEngine.startPreview();

      // Set speaker on by default for video calls
      agoraEngine.setDefaultAudioRouteToSpeakerphone(true);

      // Join channel with token
      agoraEngine.joinChannel(tokenData.token, channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
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

  const toggleMute = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.muteLocalAudioStream(!muted);
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.muteLocalVideoStream(!videoEnabled);
      setVideoEnabled(!videoEnabled);
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
      {/* Video Placeholder - Agora v4 requires additional video view setup */}
      <View style={styles.videoPlaceholder}>
        <Text style={styles.placeholderText}>
          {remoteUid
            ? `In call with ${otherUser?.fullName}`
            : `Calling ${otherUser?.fullName}...`}
        </Text>
        <Text style={styles.placeholderSubtext}>
          Video rendering requires Agora Video View component
        </Text>
        <Text style={styles.placeholderSubtext}>Audio call is working</Text>
      </View>

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
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    padding: 20,
  },
  placeholderText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  placeholderSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
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
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
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
