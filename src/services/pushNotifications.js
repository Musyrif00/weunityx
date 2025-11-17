import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class PushNotificationService {
  expoPushToken = null;

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return null;
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
    } else {
      alert("Must use physical device for Push Notifications");
      return null;
    }

    this.expoPushToken = token;
    return token;
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  }

  // Get push token
  getExpoPushToken() {
    return this.expoPushToken;
  }

  // Add notification received listener
  addNotificationReceivedListener(listener) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Add notification response listener
  addNotificationResponseReceivedListener(listener) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Remove notification listeners
  removeNotificationSubscription(subscription) {
    if (subscription) {
      Notifications.removeNotificationSubscription(subscription);
    }
  }

  // Create notification channels for Android
  async createNotificationChannels() {
    if (Platform.OS === "android") {
      // Create different channels for different types of notifications
      await Notifications.setNotificationChannelAsync("likes", {
        name: "Likes",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF0000",
      });

      await Notifications.setNotificationChannelAsync("comments", {
        name: "Comments",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0000FF",
      });

      await Notifications.setNotificationChannelAsync("follows", {
        name: "Follows",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00FF00",
      });

      await Notifications.setNotificationChannelAsync("events", {
        name: "Events",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFA500",
      });

      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#800080",
      });
    }
  }

  // Format notification based on type
  formatNotification(type, data) {
    switch (type) {
      case "like":
        return {
          title: "New Like",
          body: `${data.userName} liked your post`,
          categoryId: "likes",
        };
      case "comment":
        return {
          title: "New Comment",
          body: `${data.userName} commented on your post`,
          categoryId: "comments",
        };
      case "follow":
        return {
          title: "New Follower",
          body: `${data.userName} started following you`,
          categoryId: "follows",
        };
      case "event":
        return {
          title: "Event Update",
          body: `${data.userName} is interested in your event`,
          categoryId: "events",
        };
      case "message":
        return {
          title: "New Message",
          body: `${data.userName}: ${data.message}`,
          categoryId: "messages",
        };
      default:
        return {
          title: "WeUnityX",
          body: data.message || "You have a new notification",
          categoryId: "default",
        };
    }
  }
}

export default new PushNotificationService();
