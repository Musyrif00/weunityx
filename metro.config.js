const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude functions directory and all its contents from Metro bundler
config.resolver.blockList = [
  // Functions directory patterns for both Unix and Windows paths
  /functions\/.*/,
  /functions\\.*/,
  /.*\/functions\/.*/,
  /.*\\functions\\.*/,
  // Specific lib directory exclusions
  /.*\/lib\/.*/,
  /.*\\lib\\.*/,
  // Direct lib index references
  /lib\/index/,
  /lib\\index/,
];

module.exports = config;
