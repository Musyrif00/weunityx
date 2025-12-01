import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Moralis from "moralis";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// Initialize Firebase Admin
admin.initializeApp();

// Helper function to convert Wei to Ether
const weiToEth = (wei: string): string => {
  return (parseFloat(wei) / 1e18).toString();
};

// Initialize Moralis
let moralisInitialized = false;

const initializeMoralis = async () => {
  if (moralisInitialized) return;

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Moralis API key not configured. Set MORALIS_API_KEY in functions/.env file"
    );
  }

  await Moralis.start({
    apiKey: apiKey,
  });

  moralisInitialized = true;
  console.log("Moralis initialized successfully");
};

// Helper function to validate Ethereum address
const isValidAddress = (address: string): boolean => {
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
};

// Helper function to validate chain ID
const isValidChain = (chain: string): boolean => {
  const validChains = ["0x1", "0x89", "0x38", "0xaa36a7", "0x13881"];
  return validChains.includes(chain);
};

// Get native token balance
export const getNativeBalance = functions.https.onCall(
  async (data, context) => {
    try {
      await initializeMoralis();

      const { address, chain = "0x1" } = data;

      // Validate input
      if (!address || !isValidAddress(address)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid wallet address"
        );
      }

      if (!isValidChain(chain)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Unsupported blockchain network"
        );
      }

      const response = await Moralis.EvmApi.balance.getNativeBalance({
        address,
        chain,
      });

      const result = response.toJSON();

      return {
        balance: result.balance,
        formatted: weiToEth(result.balance),
      };
    } catch (error) {
      console.error("getNativeBalance error:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to get native balance: ${error}`
      );
    }
  }
);

// Get ERC20 token balances
export const getTokenBalances = functions.https.onCall(
  async (data, context) => {
    try {
      await initializeMoralis();

      const { address, chain = "0x1" } = data;

      // Validate input
      if (!address || !isValidAddress(address)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid wallet address"
        );
      }

      if (!isValidChain(chain)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Unsupported blockchain network"
        );
      }

      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain,
      });

      const tokens = response.toJSON();

      return tokens.map((token: any) => ({
        token_address: token.token_address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: token.balance,
        formatted:
          token.balance && token.decimals
            ? (
                parseFloat(token.balance) / Math.pow(10, token.decimals)
              ).toString()
            : "0",
        logo: token.logo,
        thumbnail: token.thumbnail,
      }));
    } catch (error) {
      console.error("getTokenBalances error:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to get token balances: ${error}`
      );
    }
  }
);

// Get complete wallet balances (native + tokens)
export const getWalletBalances = functions.https.onCall(
  async (data, context) => {
    try {
      await initializeMoralis();

      const { address, chain = "0x1" } = data;

      // Validate input
      if (!address || !isValidAddress(address)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid wallet address"
        );
      }

      if (!isValidChain(chain)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Unsupported blockchain network"
        );
      }

      // Get native balance
      const nativeResponse = await Moralis.EvmApi.balance.getNativeBalance({
        address,
        chain,
      });
      const nativeResult = nativeResponse.toJSON();

      // Get token balances
      const tokenResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain,
      });
      const tokenResults = tokenResponse.toJSON();

      return {
        native: {
          balance: nativeResult.balance,
          formatted: weiToEth(nativeResult.balance),
        },
        tokens: tokenResults.map((token: any) => ({
          token_address: token.token_address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          balance: token.balance,
          formatted:
            token.balance && token.decimals
              ? (
                  parseFloat(token.balance) / Math.pow(10, token.decimals)
                ).toString()
              : "0",
          logo: token.logo,
          thumbnail: token.thumbnail,
        })),
      };
    } catch (error) {
      console.error("getWalletBalances error:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to get wallet balances: ${error}`
      );
    }
  }
);

// Get transaction history
export const getTransactions = functions.https.onCall(async (data, context) => {
  try {
    await initializeMoralis();

    const { address, chain = "0x1", limit = 20 } = data;

    // Validate input
    if (!address || !isValidAddress(address)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid wallet address"
      );
    }

    if (!isValidChain(chain)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Unsupported blockchain network"
      );
    }

    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
      address,
      chain,
      limit: Math.min(limit, 100), // Limit to 100 max
    });

    const transactions = response.toJSON();

    return transactions.result.map((tx: any) => ({
      hash: tx.hash,
      block_number: tx.block_number,
      block_timestamp: tx.block_timestamp,
      from_address: tx.from_address,
      to_address: tx.to_address,
      value: tx.value,
      formatted: weiToEth(tx.value),
      gas_price: tx.gas_price,
      gas: tx.gas,
      nonce: tx.nonce,
      success: tx.receipt_status === "1",
    }));
  } catch (error) {
    console.error("getTransactions error:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to get transactions: ${error}`
    );
  }
});

// Get NFTs
export const getNFTs = functions.https.onCall(async (data, context) => {
  try {
    await initializeMoralis();

    const { address, chain = "0x1", limit = 20 } = data;

    // Validate input
    if (!address || !isValidAddress(address)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid wallet address"
      );
    }

    if (!isValidChain(chain)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Unsupported blockchain network"
      );
    }

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
      limit: Math.min(limit, 100),
      mediaItems: true,
    });

    const nfts = response.toJSON();

    return nfts.result.map((nft: any) => {
      let metadata = null;
      try {
        metadata = nft.metadata ? JSON.parse(nft.metadata) : null;
      } catch (e) {
        // Invalid JSON metadata
      }

      return {
        token_address: nft.token_address,
        token_id: nft.token_id,
        name: nft.name,
        symbol: nft.symbol,
        contract_type: nft.contract_type,
        metadata: metadata,
        image: metadata?.image || nft.media?.media_collection?.high?.url,
      };
    });
  } catch (error) {
    console.error("getNFTs error:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to get NFTs: ${error}`
    );
  }
});

// Get token price
export const getTokenPrice = functions.https.onCall(async (data, context) => {
  try {
    await initializeMoralis();

    const { tokenAddress, chain = "0x1" } = data;

    // Validate input
    if (!tokenAddress || !isValidAddress(tokenAddress)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid token address"
      );
    }

    if (!isValidChain(chain)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Unsupported blockchain network"
      );
    }

    const response = await Moralis.EvmApi.token.getTokenPrice({
      address: tokenAddress,
      chain,
    });

    return response.toJSON();
  } catch (error) {
    console.error("getTokenPrice error:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to get token price: ${error}`
    );
  }
});

// Get wallet summary across multiple chains
export const getWalletSummary = functions.https.onCall(
  async (data, context) => {
    try {
      await initializeMoralis();

      const { address, chains = ["0x1"] } = data;

      // Validate input
      if (!address || !isValidAddress(address)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid wallet address"
        );
      }

      const summaries = await Promise.all(
        chains.map(async (chain: string) => {
          try {
            if (!isValidChain(chain)) {
              return { chainId: chain, error: "Unsupported chain" };
            }

            // Get balances and recent transactions
            const [nativeResponse, tokenResponse, txResponse] =
              await Promise.all([
                Moralis.EvmApi.balance.getNativeBalance({ address, chain }),
                Moralis.EvmApi.token.getWalletTokenBalances({ address, chain }),
                Moralis.EvmApi.transaction.getWalletTransactions({
                  address,
                  chain,
                  limit: 5,
                }),
              ]);

            const native = nativeResponse.toJSON();
            const tokens = tokenResponse.toJSON();
            const transactions = txResponse.toJSON();

            return {
              chainId: chain,
              balances: {
                native: {
                  balance: native.balance,
                  formatted: weiToEth(native.balance),
                },
                tokens: tokens.map((token: any) => ({
                  token_address: token.token_address,
                  name: token.name,
                  symbol: token.symbol,
                  formatted:
                    token.balance && token.decimals
                      ? parseFloat(token.balance) / Math.pow(10, token.decimals)
                      : "0",
                })),
              },
              recentTransactions: transactions.result.slice(0, 5),
              hasActivity:
                tokens.length > 0 ||
                parseFloat(weiToEth(native.balance)) > 0 ||
                transactions.result.length > 0,
            };
          } catch (error) {
            console.warn(`Error fetching data for chain ${chain}:`, error);
            return {
              chainId: chain,
              error: error instanceof Error ? error.message : String(error),
              hasActivity: false,
            };
          }
        })
      );

      return summaries;
    } catch (error) {
      console.error("getWalletSummary error:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to get wallet summary: ${error}`
      );
    }
  }
);

// Search tokens (simplified - you might want to implement a more sophisticated search)
export const searchTokens = functions.https.onCall(async (data, context) => {
  try {
    // For now, return empty array
    // You can implement token search using external APIs or databases
    return [];
  } catch (error) {
    console.error("searchTokens error:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to search tokens: ${error}`
    );
  }
});

// Generate Agora RTC Token
export const generateAgoraToken = functions.https.onCall(
  async (data, context) => {
    try {
      const { channelName, uid = 0, role = "publisher" } = data;

      // Validate input
      if (!channelName) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Channel name is required"
        );
      }

      // Get Agora credentials from environment variables
      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      if (!appId || !appCertificate) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Agora credentials not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in functions/.env file"
        );
      }

      // Token expiration time (24 hours from now)
      const expirationTimeInSeconds = 86400; // 24 hours
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      // Determine role (1 = publisher, 2 = subscriber)
      const userRole =
        role === "audience" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

      // Generate token
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        userRole,
        privilegeExpiredTs,
        privilegeExpiredTs
      );

      console.log(
        `Generated Agora token for channel: ${channelName}, uid: ${uid}`
      );

      return {
        token,
        appId,
        channelName,
        uid,
        expiresAt: privilegeExpiredTs,
      };
    } catch (error) {
      console.error("generateAgoraToken error:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to generate Agora token: ${error}`
      );
    }
  }
);

// Scheduled function to clean up old live streams (runs daily at midnight)
export const cleanupOldLiveStreams = functions.pubsub
  .schedule("0 0 * * *") // Run at midnight every day
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Starting cleanup of old live streams...");

      const db = admin.firestore();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query for streams older than 30 days that are not active
      const oldStreamsQuery = db
        .collection("liveStreams")
        .where("isActive", "==", false)
        .where("endedAt", "<", thirtyDaysAgo);

      const snapshot = await oldStreamsQuery.get();

      if (snapshot.empty) {
        console.log("No old streams to delete");
        return null;
      }

      // Delete streams in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      let deletedCount = 0;
      let batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        deletedCount++;

        // Commit batch when it reaches 500 operations
        if (batchCount === batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} deletions`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} deletions`);
      }

      console.log(
        `Successfully deleted ${deletedCount} old live streams (older than 30 days)`
      );
      return { deletedCount };
    } catch (error) {
      console.error("Error cleaning up old live streams:", error);
      throw error;
    }
  });
