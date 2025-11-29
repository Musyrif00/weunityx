import { auth } from "../config/firebase";
import { AGORA_APP_ID } from "../config/agora";

// Firebase Cloud Function URL
const FUNCTIONS_URL = "https://us-central1-weunityx.cloudfunctions.net";

/**
 * Generate Agora RTC token for a channel
 * @param {string} channelName - The name of the channel
 * @param {number} uid - User ID (default: 0)
 * @param {string} role - User role: 'publisher' or 'audience' (default: 'publisher')
 * @returns {Promise<{token: string, appId: string, channelName: string, uid: number, expiresAt: number}>}
 */
export const generateAgoraToken = async (
  channelName,
  uid = 0,
  role = "publisher"
) => {
  try {
    // Get ID token for authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    const idToken = await user.getIdToken();

    // Call Cloud Function via HTTP
    const response = await fetch(`${FUNCTIONS_URL}/generateAgoraToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        data: { channelName, uid, role },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate token");
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error("Error generating Agora token:", error);
    throw error;
  }
};

/**
 * Get Agora App ID
 * @returns {string}
 */
export const getAgoraAppId = () => {
  return AGORA_APP_ID;
};

export default {
  generateAgoraToken,
  getAgoraAppId,
};
