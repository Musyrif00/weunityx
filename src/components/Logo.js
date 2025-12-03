import React from "react";
import { Image, StyleSheet } from "react-native";

// HeaderLogo - Specifically for main screen headers (Home, Messages, Profile)
// Uses inlinelogo.jpg and can be resized from one place
const HeaderLogo = ({ style }) => {
  return (
    <Image
      source={require("../../assets/inlinelogo.jpg")}
      style={[styles.headerLogo, style]}
    />
  );
};

// Generic Logo component for other uses (splash, with name, etc.)
const Logo = ({ type = "inline", size = "default", style }) => {
  const logoSources = {
    inline: require("../../assets/inlinelogo.jpg"),
    splash: require("../../assets/logosplash.jpg"),
    withName: require("../../assets/logowithname.jpg"),
  };

  const logoSizes = {
    small: { width: 80, height: 24 },
    default: { width: 120, height: 32 },
    medium: { width: 150, height: 40 },
    large: { width: 200, height: 50 },
  };

  const logoSize = logoSizes[size] || logoSizes.default;
  const logoSource = logoSources[type] || logoSources.inline;

  return (
    <Image
      source={logoSource}
      style={[
        styles.logo,
        {
          width: logoSize.width,
          height: logoSize.height,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  // EDIT THIS SIZE TO RESIZE ALL MAIN SCREEN HEADERS AT ONCE
  headerLogo: {
    width: 150, // Change this width
    height: 50, // Change this height
    resizeMode: "cover",
  },
  // Generic logo styling
  logo: {
    resizeMode: "contain",
  },
});

export { HeaderLogo };
export default Logo;
