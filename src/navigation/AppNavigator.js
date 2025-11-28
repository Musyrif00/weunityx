import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { IconButton } from "react-native-paper";
import { theme as staticTheme } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

// Import screens
import HomeScreen from "../screens/Home";
import MessagesScreen from "../screens/Messages/List";
import ProfileScreen from "../screens/Profile/MyProfile";
import SearchScreen from "../screens/Search";
import NotificationsScreen from "../screens/Notifications";

// Wallet screens
import {
  WalletScreen,
  TransactionHistory,
  TokenDetail,
} from "../screens/Wallet";

// Auth screens
import SignInScreen from "../screens/Auth/SignIn";
import SignUpScreen from "../screens/Auth/SignUp";
import ResetPasswordScreen from "../screens/Auth/ResetPassword";

// Other screens
import ChatScreen from "../screens/Messages/Chat";
import NewMessageScreen from "../screens/Messages/NewMessage";
import NewPostScreen from "../screens/NewPost";
import NewStoryScreen from "../screens/NewStory";
import CommentsScreen from "../screens/Comments";
import UserProfileScreen from "../screens/Profile/User";
import EditProfileScreen from "../screens/Profile/Edit";
import SettingsScreen from "../screens/Profile/Settings";
import SavedPostsScreen from "../screens/SavedPosts";
import BlockedUsersScreen from "../screens/BlockedUsers";

import { useAuth } from "../contexts/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

const TabIcon = ({ name, color, size }) => (
  <IconButton icon={name} iconColor={color} size={size} />
);

const TabNavigator = () => {
  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="magnify" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="wallet" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="message" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: staticTheme.colors.background },
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  // Always use light theme (disabled dynamic theming)
  const theme = staticTheme;

  if (isLoading) {
    return null; // You can return a loading screen here
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="NewMessage" component={NewMessageScreen} />
          <Stack.Screen name="NewPost" component={NewPostScreen} />
          <Stack.Screen name="NewStory" component={NewStoryScreen} />
          <Stack.Screen name="Comments" component={CommentsScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen
            name="TransactionHistory"
            component={TransactionHistory}
            options={{ title: "Transaction History" }}
          />
          <Stack.Screen
            name="TokenDetail"
            component={TokenDetail}
            options={({ route }) => ({
              title: route.params?.token?.symbol || "Token Details",
            })}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
