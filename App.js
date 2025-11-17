import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider, lightTheme } from "./src/contexts/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import PushNotificationService from "./src/services/pushNotifications";

const AppContent = () => {
  // Always use light theme (disabled dynamic theming)

  useEffect(() => {
    // Set up notification listeners
    const notificationListener =
      PushNotificationService.addNotificationReceivedListener(
        (notification) => {
          console.log("Notification received:", notification);
        }
      );

    const responseListener =
      PushNotificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log("Notification response:", response);
          // Handle notification tap
          const { data } = response.notification.request.content;

          // You can navigate to specific screens based on notification data
          // Example: if (data.screen) navigation.navigate(data.screen, data.params);
        }
      );

    return () => {
      PushNotificationService.removeNotificationSubscription(
        notificationListener
      );
      PushNotificationService.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <PaperProvider theme={lightTheme}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
