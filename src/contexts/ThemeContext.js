import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme } from "react-native-paper";

// Light theme
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#702963",
    secondary: "#f59e0b",
    accent: "#10b981",
    background: "#ffffff",
    surface: "#f9fafb",
    text: "#1f2937",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    error: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#3b82f6",
    card: "#ffffff",
    notification: "#702963",
  },
  dark: false,
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
  },
};

// Dark theme
const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#818cf8",
    secondary: "#fbbf24",
    accent: "#34d399",
    background: "#111827",
    surface: "#1f2937",
    text: "#f9fafb",
    textSecondary: "#9ca3af",
    border: "#374151",
    error: "#f87171",
    success: "#34d399",
    warning: "#fbbf24",
    info: "#60a5fa",
    card: "#1f2937",
    notification: "#818cf8",
  },
  dark: true,
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
  },
};

// Theme preferences
const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const ThemeContext = createContext({
  theme: lightTheme,
  themeMode: THEME_MODES.SYSTEM,
  isDarkMode: false,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const STORAGE_KEY = "@theme_mode";

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(THEME_MODES.SYSTEM);
  const [systemColorScheme, setSystemColorScheme] = useState(
    Appearance.getColorScheme()
  );

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const changeThemeMode = (mode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  const toggleTheme = () => {
    const newMode = isDarkMode ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    changeThemeMode(newMode);
  };

  // Determine if dark mode should be active
  const isDarkMode =
    themeMode === THEME_MODES.DARK ||
    (themeMode === THEME_MODES.SYSTEM && systemColorScheme === "dark");

  // Get the current theme
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme: currentTheme,
    themeMode,
    isDarkMode,
    setThemeMode: changeThemeMode,
    toggleTheme,
    THEME_MODES,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Export theme constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export { lightTheme, darkTheme };
