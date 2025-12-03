import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { ThemeProvider, lightTheme } from "./src/contexts/ThemeContext";
import { WalletProvider } from "./src/contexts/WalletContext";
import AppNavigator from "./src/navigation/AppNavigator";
import PushNotificationService from "./src/services/pushNotifications";
import IncomingCallModal from "./src/components/IncomingCallModal";
import { notificationService, callService } from "./src/services/firebase";

// Initialize Firebase before anything else
import "./src/config/firebase";

// Polyfill for TextEncoder/TextDecoder (required for QR code generation)
import "fast-text-encoding";

const NavigationWrapper = () => {
  const { user } = useAuth();
  const navigationRef = useRef(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  useEffect(() => {
    // Set up notification listeners
    try {
      const notificationListener =
        PushNotificationService.addNotificationReceivedListener(
          (notification) => {
            // Check if it's a call notification
            const { data } = notification.request.content;
            if (data?.type === "call_voice" || data?.type === "call_video") {
              setIncomingCall({
                caller: {
                  id: data.callerId,
                  fullName: data.callerName,
                  avatar: data.callerAvatar,
                },
                callType: data.callType,
                channelName: data.channelName,
              });
              setShowIncomingCall(true);
            }
          }
        );

      const responseListener =
        PushNotificationService.addNotificationResponseReceivedListener(
          (response) => {
            const { data } = response.notification.request.content;

            // Handle call notification tap
            if (data?.type === "call_voice" || data?.type === "call_video") {
              handleAcceptCall();
            }
          }
        );

      return () => {
        PushNotificationService.removeNotificationSubscription(
          notificationListener
        );
        PushNotificationService.removeNotificationSubscription(
          responseListener
        );
      };
    } catch (error) {
      console.error("Error setting up push notifications:", error);
    }
  }, []);

  // Listen for call notifications in Firestore
  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let unsubscribe;
    try {
      unsubscribe = notificationService.subscribeToNotifications(
        user.uid,
        (notifications) => {
          // Check for new call notifications
          const callNotification = notifications.find(
            (n) =>
              !n.read &&
              (n.type === "call_voice" || n.type === "call_video") &&
              n.data?.channelName &&
              n.data?.callActive === true
          );

          if (callNotification) {
            // Check if call is not too old (max 60 seconds)
            const callAge =
              Date.now() - (callNotification.data.callStartTime || 0);
            if (callAge < 60000) {
              setIncomingCall({
                caller: {
                  id: callNotification.data.callerId,
                  fullName: callNotification.data.callerName,
                  avatar: callNotification.data.callerAvatar,
                },
                callType: callNotification.data.callType,
                channelName: callNotification.data.channelName,
                notificationId: callNotification.id,
              });
              setShowIncomingCall(true);
            } else {
              // Auto-dismiss old call notification and mark as inactive
              notificationService.markNotificationAsRead(callNotification.id);
              // Also update callActive to false
              callService
                .cancelCallNotification(
                  user.uid,
                  callNotification.data.channelName
                )
                .catch((err) =>
                  console.error("Error canceling old call:", err)
                );
            }
          } else if (showIncomingCall) {
            // Call was canceled, hide the modal
            setShowIncomingCall(false);
            setIncomingCall(null);
          }
        }
      );
    } catch (error) {
      console.error("Error subscribing to call notifications:", error);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, showIncomingCall]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;

    // Mark notification as read
    if (incomingCall.notificationId) {
      notificationService.markNotificationAsRead(incomingCall.notificationId);
    }

    // Navigate to call screen
    const screenName =
      incomingCall.callType === "voice" ? "VoiceCall" : "VideoCall";
    navigationRef.current?.navigate(screenName, {
      channelName: incomingCall.channelName,
      otherUser: incomingCall.caller,
    });

    setShowIncomingCall(false);
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    // Mark notification as read
    if (incomingCall?.notificationId) {
      notificationService.markNotificationAsRead(incomingCall.notificationId);
    }

    setShowIncomingCall(false);
    setIncomingCall(null);
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <AppNavigator />

      {/* Incoming Call Modal */}
      <IncomingCallModal
        visible={showIncomingCall}
        caller={incomingCall?.caller}
        callType={incomingCall?.callType}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <PaperProvider theme={lightTheme}>
        <AuthProvider>
          <WalletProvider>
            <NavigationWrapper />
          </WalletProvider>
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
