import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  List,
  Divider,
  IconButton,
  Avatar,
  Card,
  Button as PaperButton,
  RadioButton,
} from "react-native-paper";
import { spacing, theme as staticTheme } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

const SettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, themeMode, setThemeMode, THEME_MODES } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleThemeSelection = () => {
    Alert.alert("Select Theme", "Choose your preferred theme", [
      {
        text: "Light",
        onPress: () => setThemeMode(THEME_MODES.LIGHT),
      },
      {
        text: "Dark",
        onPress: () => setThemeMode(THEME_MODES.DARK),
      },
      {
        text: "System",
        onPress: () => setThemeMode(THEME_MODES.SYSTEM),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System Default";
      default:
        return "System Default";
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Delete",
              "Are you absolutely sure? This will permanently delete your account and all associated data.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: () => {
                    // TODO: Implement account deletion
                    Alert.alert(
                      "Feature Coming Soon",
                      "Account deletion will be available in a future update."
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const SettingsSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );

  const SettingsItem = ({
    title,
    subtitle,
    icon,
    onPress,
    rightComponent,
    showDivider = true,
  }) => (
    <>
      <List.Item
        title={title}
        description={subtitle}
        left={(props) => <List.Icon {...props} icon={icon} />}
        right={rightComponent}
        onPress={onPress}
        style={styles.listItem}
      />
      {showDivider && <Divider />}
    </>
  );

  const ToggleSettingsItem = ({ title, subtitle, icon, value, onToggle }) => (
    <SettingsItem
      title={title}
      subtitle={subtitle}
      icon={icon}
      rightComponent={() => (
        <Switch
          value={value}
          onValueChange={onToggle}
          color={staticTheme.colors.primary}
        />
      )}
    />
  );

  const styles = getStyles(theme);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <SettingsSection title="Profile">
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Avatar.Image
            source={{
              uri:
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.displayName || "User"
                )}&background=702963&color=fff`,
            }}
            size={60}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.displayName || "User"}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.editProfileText}>Tap to edit profile</Text>
          </View>
          <IconButton icon="chevron-right" />
        </TouchableOpacity>
      </SettingsSection>

      {/* Privacy & Security */}
      <SettingsSection title="Privacy & Security">
        <ToggleSettingsItem
          title="Private Account"
          subtitle="Only people you approve can follow you"
          icon="lock"
          value={privateAccount}
          onToggle={setPrivateAccount}
        />
        <ToggleSettingsItem
          title="Show Online Status"
          subtitle="Let others see when you're active"
          icon="circle"
          value={showOnlineStatus}
          onToggle={setShowOnlineStatus}
        />
        <SettingsItem
          title="Blocked Users"
          subtitle="Manage blocked accounts"
          icon="account-cancel"
          onPress={() => navigation.navigate("BlockedUsers")}
        />
        <SettingsItem
          title="Data & Privacy"
          subtitle="Manage your data and privacy settings"
          icon="shield-check"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "This feature will be available in a future update."
            )
          }
          showDivider={false}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications">
        <ToggleSettingsItem
          title="Push Notifications"
          subtitle="Receive notifications about activity"
          icon="bell"
          value={notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />
        <SettingsItem
          title="Email Notifications"
          subtitle="Manage email notification preferences"
          icon="email"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "This feature will be available in a future update."
            )
          }
        />
        <SettingsItem
          title="Notification Sounds"
          subtitle="Customize notification sounds"
          icon="volume-high"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "This feature will be available in a future update."
            )
          }
          showDivider={false}
        />
      </SettingsSection>

      {/* App Preferences */}
      <SettingsSection title="App Preferences">
        {/* Theme setting temporarily disabled 
        <SettingsItem
          title="Theme"
          subtitle={`Current: ${getThemeDisplayText()}`}
          icon="palette"
          onPress={handleThemeSelection}
        />
        */}
        <SettingsItem
          title="Language"
          subtitle="Change app language"
          icon="translate"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Language options will be available in a future update."
            )
          }
        />
        <SettingsItem
          title="Data Usage"
          subtitle="Manage data and storage settings"
          icon="database"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Data management will be available in a future update."
            )
          }
          showDivider={false}
        />
      </SettingsSection>

      {/* Support & About */}
      <SettingsSection title="Support & About">
        <SettingsItem
          title="Help Center"
          subtitle="Get help and support"
          icon="help-circle"
          onPress={() =>
            Alert.alert(
              "Help Center",
              "Contact support at support@weunityx.com"
            )
          }
        />
        <SettingsItem
          title="Report a Problem"
          subtitle="Report bugs or issues"
          icon="bug"
          onPress={() =>
            Alert.alert(
              "Report Problem",
              "Send bug reports to bugs@weunityx.com"
            )
          }
        />
        <SettingsItem
          title="Terms of Service"
          subtitle="Read our terms and conditions"
          icon="file-document"
          onPress={() =>
            Alert.alert(
              "Terms of Service",
              "Terms of service will be displayed here."
            )
          }
        />
        <SettingsItem
          title="Privacy Policy"
          subtitle="Learn about our privacy practices"
          icon="shield-account"
          onPress={() =>
            Alert.alert(
              "Privacy Policy",
              "Privacy policy will be displayed here."
            )
          }
        />
        <SettingsItem
          title="About WeUnityX"
          subtitle="Version 1.0.0"
          icon="information"
          onPress={() =>
            Alert.alert(
              "About WeUnityX",
              "WeUnityX v1.0.0\nBuilt with React Native and Firebase"
            )
          }
          showDivider={false}
        />
      </SettingsSection>

      {/* Account Actions */}
      <View style={styles.actionsSection}>
        <PaperButton
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          labelStyle={styles.logoutButtonText}
        >
          Logout
        </PaperButton>

        <PaperButton
          mode="outlined"
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
          labelStyle={styles.deleteButtonText}
        >
          Delete Account
        </PaperButton>
      </View>
    </ScrollView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: staticTheme.colors.background,
    },
    section: {
      marginVertical: spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: staticTheme.colors.textSecondary,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionCard: {
      marginHorizontal: spacing.md,
      backgroundColor: staticTheme.colors.surface,
    },
    listItem: {
      paddingVertical: spacing.sm,
    },
    profileSection: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
    },
    profileInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "bold",
      color: staticTheme.colors.text,
      marginBottom: spacing.xs,
    },
    profileEmail: {
      fontSize: 14,
      color: staticTheme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    editProfileText: {
      fontSize: 12,
      color: staticTheme.colors.primary,
    },
    actionsSection: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xl,
      gap: spacing.md,
    },
    logoutButton: {
      borderColor: staticTheme.colors.primary,
    },
    logoutButtonText: {
      color: staticTheme.colors.primary,
    },
    deleteButton: {
      borderColor: staticTheme.colors.error,
    },
    deleteButtonText: {
      color: staticTheme.colors.error,
    },
  });

export default SettingsScreen;
