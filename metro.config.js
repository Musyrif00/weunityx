const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude functions directory and all its contents from Metro bundler
config.resolver.blockList = [
  // Functions directory patterns for both Unix and Windows paths
  /functions\/.*/,
  /functions\\.*/,
  /.*\/functions\/.*/,
  /.*\\functions\\.*/,
  // Exclude only the local lib directory (not node_modules lib directories)
  /^lib\/.*/,
  /^lib\\.*/,
  // Direct lib index references in root
  /^lib\/index/,
  /^lib\\index/,
];

// Custom resolver to handle react-native-svg/css
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-svg/css") {
    return context.resolveRequest(context, "react-native-svg", platform);
  }
  // Default behavior for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
