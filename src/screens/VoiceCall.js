import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { Text, IconButton, Avatar } from "react-native-paper";
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

const VoiceCallScreen = ({ route, navigation }) => {
  const { channelName, otherUser } = route.params;
  const { user } = useAuth();
  const agoraEngineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [muted, setMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
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

  useEffect(() => {
    let interval;
    if (joined && remoteUid) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [joined, remoteUid]);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "WeUnityX needs access to your microphone for voice calls",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
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
          "Microphone access is required for voice calls"
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
        onJoinChannelSuccess: (connection, elapsed) => {
          setJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          setRemoteUid(uid);
        },
        onUserOffline: (_connection, uid, reason) => {
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
          Alert.alert("Call Error", `Error: ${msg}`);
        },
      });

      // Enable audio
      agoraEngine.enableAudio();

      // Set speaker to earpiece by default
      agoraEngine.setDefaultAudioRouteToSpeakerphone(false);

      // Join channel with token
      agoraEngine.joinChannel(tokenData.token, channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to start voice call: " + error.message);
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

  const toggleSpeaker = () => {
    if (agoraEngineRef.current) {
      agoraEngineRef.current.setEnableSpeakerphone(!speakerEnabled);
      setSpeakerEnabled(!speakerEnabled);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* User Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar.Image
          source={{
            uri:
              otherUser?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                otherUser?.fullName || "User"
              )}&background=702963&color=fff`,
          }}
          size={150}
        />
        <Text style={styles.userName}>{otherUser?.fullName}</Text>
        <Text style={styles.callStatus}>
          {remoteUid ? formatDuration(callDuration) : "Calling..."}
        </Text>
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
            size={32}
          />
          <Text style={styles.controlLabel}>{muted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, speakerEnabled && styles.activeControl]}
          onPress={toggleSpeaker}
        >
          <IconButton
            icon={speakerEnabled ? "volume-high" : "volume-off"}
            iconColor="white"
            size={32}
          />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>
      </View>

      {/* End Call Button */}
      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <IconButton icon="phone-hangup" iconColor="white" size={32} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 24,
  },
  callStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    marginBottom: 40,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeControl: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
  },
  controlLabel: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    position: "absolute",
    bottom: -20,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.error,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VoiceCallScreen;
