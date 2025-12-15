// Agora Configuration from environment variables
// Get your App ID from: https://console.agora.io/

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID;

// You'll need to implement a token server for production
// For development/testing, you can use null (less secure)
// IMPORTANT: You must enable "Testing Mode" in Agora Console for null token to work
export const AGORA_TOKEN = null;

// Optional: Certificate for token generation (for production)
export const AGORA_CERTIFICATE =
  process.env.EXPO_PUBLIC_AGORA_CERTIFICATE || "";

export default {
  appId: process.env.EXPO_PUBLIC_AGORA_APP_ID,
  token: null,
  certificate: process.env.EXPO_PUBLIC_AGORA_CERTIFICATE || "",
};
