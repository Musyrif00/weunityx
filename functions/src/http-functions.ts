import * as functions from "firebase-functions";
import Moralis from "moralis";
const cors = require("cors");

// Initialize CORS
const corsHandler = cors({ origin: true });

// Helper function to convert Wei to Ether
const weiToEth = (wei: string): string => {
  return (parseFloat(wei) / 1e18).toString();
};

// Initialize Moralis
let moralisInitialized = false;

const initializeMoralis = async () => {
  if (moralisInitialized) return;

  const apiKey = functions.config().moralis?.api_key;
  if (!apiKey) {
    throw new Error("Moralis API key not configured");
  }

  await Moralis.start({
    apiKey: apiKey,
  });

  moralisInitialized = true;
  console.log("Moralis initialized successfully");
};

// Simple HTTP endpoint for testing
export const testWallet = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Simple response without Moralis for testing
      res.json({
        success: true,
        message: "Wallet service is running!",
        timestamp: new Date().toISOString(),
        mockData: {
          balance: "1000000000000000000", // 1 ETH
          formatted: "1.0",
          symbol: "ETH",
        },
      });
    } catch (error) {
      console.error("Test wallet error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
});

// HTTP endpoint for native balance
export const httpGetNativeBalance = functions.https.onRequest(
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { address, chain = "0x1" } = req.body;

        if (!address) {
          res.status(400).json({
            success: false,
            error: "Address is required",
          });
          return;
        }

        await initializeMoralis();

        const result = await Moralis.EvmApi.balance.getNativeBalance({
          address,
          chain,
        });

        res.json({
          success: true,
          balance: result.result.balance,
          formatted: weiToEth(result.result.balance.toString()),
          symbol: "ETH",
        });
      } catch (error) {
        console.error("HTTP getNativeBalance error:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
);

// HTTP endpoint for token balances
export const httpGetTokenBalances = functions.https.onRequest(
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { address, chain = "0x1" } = req.body;

        if (!address) {
          res.status(400).json({
            success: false,
            error: "Address is required",
          });
          return;
        }

        await initializeMoralis();

        const result = await Moralis.EvmApi.token.getWalletTokenBalances({
          address,
          chain,
        });

        const tokens = result.result.map((token: any) => ({
          token_address: token.token_address || "",
          name: token.name || "",
          symbol: token.symbol || "",
          decimals: token.decimals || 0,
          balance: token.balance?.toString() || "0",
          formatted: token.decimals
            ? (
                parseFloat(token.balance?.toString() || "0") /
                Math.pow(10, token.decimals)
              ).toString()
            : "0",
          logo: token.logo || null,
          thumbnail: token.thumbnail || null,
        }));

        res.json({
          success: true,
          tokens,
        });
      } catch (error) {
        console.error("HTTP getTokenBalances error:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
);

// HTTP endpoint for transactions
export const httpGetTransactions = functions.https.onRequest(
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { address, chain = "0x1", limit = 10 } = req.body;

        if (!address) {
          res.status(400).json({
            success: false,
            error: "Address is required",
          });
          return;
        }

        await initializeMoralis();

        const result = await Moralis.EvmApi.transaction.getWalletTransactions({
          address,
          chain,
          limit,
        });

        const transactions = result.result.map((tx: any) => ({
          hash: tx.hash || "",
          block_number:
            tx.block_number?.toString() || tx.blockNumber?.toString() || "0",
          block_timestamp: tx.block_timestamp || tx.blockTimestamp || "",
          from_address: tx.from_address || tx.fromAddress || "",
          to_address: tx.to_address || tx.toAddress || "",
          value: tx.value?.toString() || "0",
          formatted: weiToEth(tx.value?.toString() || "0"),
          gas: tx.gas?.toString() || "0",
          gas_price: tx.gas_price?.toString() || tx.gasPrice?.toString() || "0",
          nonce: tx.nonce?.toString() || "0",
          success: true,
        }));

        res.json({
          success: true,
          transactions,
        });
      } catch (error) {
        console.error("HTTP getTransactions error:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
);

// HTTP endpoint for wallet balances (native + tokens)
export const httpGetWalletBalances = functions.https.onRequest(
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { address, chain = "0x1" } = req.body;

        if (!address) {
          res.status(400).json({
            success: false,
            error: "Address is required",
          });
          return;
        }

        await initializeMoralis();

        // Get native balance
        const nativeResult = await Moralis.EvmApi.balance.getNativeBalance({
          address,
          chain,
        });

        // Get token balances
        const tokenResult = await Moralis.EvmApi.token.getWalletTokenBalances({
          address,
          chain,
        });

        const native = {
          balance: nativeResult.result.balance,
          formatted: weiToEth(nativeResult.result.balance.toString()),
          symbol: "ETH",
        };

        const tokens = tokenResult.result.map((token: any) => ({
          token_address: token.token_address || "",
          name: token.name || "",
          symbol: token.symbol || "",
          decimals: token.decimals || 0,
          balance: token.balance?.toString() || "0",
          formatted: token.decimals
            ? (
                parseFloat(token.balance?.toString() || "0") /
                Math.pow(10, token.decimals)
              ).toString()
            : "0",
          logo: token.logo || null,
          thumbnail: token.thumbnail || null,
        }));

        res.json({
          success: true,
          native,
          tokens,
        });
      } catch (error) {
        console.error("HTTP getWalletBalances error:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
);
