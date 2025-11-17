import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  Modal,
  Portal,
  Text,
  RadioButton,
  Button,
  TextInput,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { theme as staticTheme, spacing } from "../constants";
import { reportingService } from "../services/firebase";

const ReportModal = ({
  visible,
  onDismiss,
  contentType,
  contentId,
  contentOwnerId,
  reporterId,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    { value: "spam", label: "Spam or unwanted content" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "hateSpeech", label: "Hate speech or discrimination" },
    { value: "violence", label: "Violence or threats" },
    { value: "nudity", label: "Nudity or sexual content" },
    { value: "misinformation", label: "False or misleading information" },
    { value: "copyright", label: "Copyright infringement" },
    { value: "selfHarm", label: "Self-harm or suicide" },
    { value: "other", label: "Other (please specify)" },
  ];

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for reporting");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      Alert.alert("Error", "Please specify the reason for reporting");
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        reporterId,
        contentType,
        contentId,
        contentOwnerId,
        reason: selectedReason,
        customReason: selectedReason === "other" ? customReason.trim() : null,
        description: customReason.trim() || null,
      };

      await reportingService.reportContent(reportData);

      Alert.alert(
        "Report Submitted",
        "Thank you for your report. We'll review it and take appropriate action if needed.",
        [
          {
            text: "OK",
            onPress: () => {
              setSelectedReason("");
              setCustomReason("");
              onDismiss();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Report Content</Text>
          <Text style={styles.subtitle}>
            Help us understand what's happening
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.content}>
          <Text style={styles.reasonsTitle}>Why are you reporting this?</Text>

          <RadioButton.Group
            onValueChange={setSelectedReason}
            value={selectedReason}
          >
            {reportReasons.map((reason) => (
              <View key={reason.value} style={styles.reasonItem}>
                <View style={styles.reasonRow}>
                  <RadioButton value={reason.value} />
                  <Text style={styles.reasonText}>{reason.label}</Text>
                </View>
              </View>
            ))}
          </RadioButton.Group>

          {selectedReason === "other" && (
            <TextInput
              label="Please specify"
              value={customReason}
              onChangeText={setCustomReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.customReasonInput}
              placeholder="Describe the issue..."
            />
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmitReport}
            loading={loading}
            disabled={loading || !selectedReason}
            style={styles.submitButton}
          >
            Submit Report
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: staticTheme.colors.background,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: "80%",
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: staticTheme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: staticTheme.colors.textSecondary,
  },
  divider: {
    backgroundColor: staticTheme.colors.border,
  },
  content: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: staticTheme.colors.text,
    marginBottom: spacing.md,
  },
  reasonItem: {
    marginBottom: spacing.sm,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  reasonText: {
    fontSize: 14,
    color: staticTheme.colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  customReasonInput: {
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  submitButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});

export default ReportModal;
