import React from "react";
import { View, StyleSheet, Modal } from "react-native";
import { Text, Avatar, IconButton } from "react-native-paper";
import { theme } from "../constants/theme";

const IncomingCallModal = ({
  visible,
  caller,
  callType,
  onAccept,
  onDecline,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Caller Avatar */}
          <Avatar.Image
            source={{
              uri:
                caller?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  caller?.fullName || "User"
                )}&background=702963&color=fff`,
            }}
            size={120}
            style={styles.avatar}
          />

          {/* Caller Name */}
          <Text style={styles.callerName}>{caller?.fullName || "Unknown"}</Text>

          {/* Call Type */}
          <Text style={styles.callType}>
            {callType === "voice"
              ? "📞 Incoming Voice Call"
              : "📹 Incoming Video Call"}
          </Text>

          {/* Call Actions */}
          <View style={styles.actionsContainer}>
            {/* Decline Button */}
            <View style={styles.actionButton}>
              <IconButton
                icon="phone-hangup"
                iconColor="white"
                size={32}
                style={[styles.iconButton, styles.declineButton]}
                onPress={onDecline}
              />
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            {/* Accept Button */}
            <View style={styles.actionButton}>
              <IconButton
                icon={callType === "voice" ? "phone" : "video"}
                iconColor="white"
                size={32}
                style={[styles.iconButton, styles.acceptButton]}
                onPress={onAccept}
              />
              <Text style={styles.actionLabel}>Accept</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    alignItems: "center",
    padding: 40,
  },
  avatar: {
    marginBottom: 24,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  callerName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  callType: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 48,
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 60,
  },
  actionButton: {
    alignItems: "center",
  },
  iconButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  declineButton: {
    backgroundColor: "#EF4444",
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  actionLabel: {
    color: "white",
    fontSize: 14,
    marginTop: 8,
  },
});

export default IncomingCallModal;
