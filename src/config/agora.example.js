// Agora Configuration
// Get your App ID from: https://console.agora.io/
// Copy this file to agora.js and add your credentials

export const AGORA_APP_ID = "your_agora_app_id_here";

// You'll need to implement a token server for production
// For development/testing, you can use null (less secure)
// Set to null for testing without token restrictions
export const AGORA_TOKEN = null;

// Optional: Certificate for token generation (for production)
export const AGORA_CERTIFICATE = "";

export default {
  appId: "your_agora_app_id_here",
  token: null,
  certificate: "",
};
