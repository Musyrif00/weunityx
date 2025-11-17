import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

export const deviceSize = {
  width,
  height,
  isSmallDevice: width < 375,
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",
};

export const getResponsiveSize = (size) => {
  const baseWidth = 375; // iPhone X width
  return (width / baseWidth) * size;
};
