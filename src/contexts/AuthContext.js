import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { userService } from "../services/firebase";
import PushNotificationService from "../services/pushNotifications";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState(null);

  useEffect(() => {
    // Initialize push notifications
    const initializePushNotifications = async () => {
      try {
        // Create notification channels
        await PushNotificationService.createNotificationChannels();

        // Register for push notifications
        const token =
          await PushNotificationService.registerForPushNotificationsAsync();
        if (token) {
          setPushToken(token);
        }
      } catch (error) {
        console.error("Error initializing push notifications:", error);
      }
    };

    initializePushNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Update push token in Firebase when user logs in
        if (pushToken) {
          try {
            await userService.updatePushToken(user.uid, pushToken);
          } catch (error) {
            console.error("Error updating push token:", error);
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [pushToken]);

  // Update push token when it changes
  useEffect(() => {
    const updatePushToken = async () => {
      if (user && pushToken) {
        try {
          await userService.updatePushToken(user.uid, pushToken);
        } catch (error) {
          console.error("Error updating push token:", error);
        }
      }
    };

    updatePushToken();
  }, [user, pushToken]);

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    logout,
    isLoading,
    pushToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
