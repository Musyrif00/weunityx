"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAgoraToken = exports.searchTokens = exports.getWalletSummary = exports.getTokenPrice = exports.getNFTs = exports.getTransactions = exports.getWalletBalances = exports.getTokenBalances = exports.getNativeBalance = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const moralis_1 = require("moralis");
const agora_token_1 = require("agora-token");
// Initialize Firebase Admin
admin.initializeApp();
// Helper function to convert Wei to Ether
const weiToEth = (wei) => {
    return (parseFloat(wei) / 1e18).toString();
};
// Initialize Moralis
let moralisInitialized = false;
const initializeMoralis = async () => {
    var _a;
    if (moralisInitialized)
        return;
    const apiKey = (_a = functions.config().moralis) === null || _a === void 0 ? void 0 : _a.api_key;
    if (!apiKey) {
        throw new Error('Moralis API key not configured. Set it with: firebase functions:config:set moralis.api_key="YOUR_KEY"');
    }
    await moralis_1.default.start({
        apiKey: apiKey,
    });
    moralisInitialized = true;
    console.log("Moralis initialized successfully");
};
// Helper function to validate Ethereum address
const isValidAddress = (address) => {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
};
// Helper function to validate chain ID
const isValidChain = (chain) => {
    const validChains = ["0x1", "0x89", "0x38", "0xaa36a7", "0x13881"];
    return validChains.includes(chain);
};
// Get native token balance
exports.getNativeBalance = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { address, chain = "0x1" } = data;
        // Validate input
        if (!address || !isValidAddress(address)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid wallet address");
        }
        if (!isValidChain(chain)) {
            throw new functions.https.HttpsError("invalid-argument", "Unsupported blockchain network");
        }
        const response = await moralis_1.default.EvmApi.balance.getNativeBalance({
            address,
            chain,
        });
        const result = response.toJSON();
        return {
            balance: result.balance,
            formatted: weiToEth(result.balance),
        };
    }
    catch (error) {
        console.error("getNativeBalance error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get native balance: ${error}`);
    }
});
// Get ERC20 token balances
exports.getTokenBalances = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { address, chain = "0x1" } = data;
        // Validate input
        if (!address || !isValidAddress(address)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid wallet address");
        }
        if (!isValidChain(chain)) {
            throw new functions.https.HttpsError("invalid-argument", "Unsupported blockchain network");
        }
        const response = await moralis_1.default.EvmApi.token.getWalletTokenBalances({
            address,
            chain,
        });
        const tokens = response.toJSON();
        return tokens.map((token) => ({
            token_address: token.token_address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            balance: token.balance,
            formatted: token.balance && token.decimals
                ? (parseFloat(token.balance) / Math.pow(10, token.decimals)).toString()
                : "0",
            logo: token.logo,
            thumbnail: token.thumbnail,
        }));
    }
    catch (error) {
        console.error("getTokenBalances error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get token balances: ${error}`);
    }
});
// Get complete wallet balances (native + tokens)
exports.getWalletBalances = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { address, chain = "0x1" } = data;
        // Validate input
        if (!address || !isValidAddress(address)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid wallet address");
        }
        if (!isValidChain(chain)) {
            throw new functions.https.HttpsError("invalid-argument", "Unsupported blockchain network");
        }
        // Get native balance
        const nativeResponse = await moralis_1.default.EvmApi.balance.getNativeBalance({
            address,
            chain,
        });
        const nativeResult = nativeResponse.toJSON();
        // Get token balances
        const tokenResponse = await moralis_1.default.EvmApi.token.getWalletTokenBalances({
            address,
            chain,
        });
        const tokenResults = tokenResponse.toJSON();
        return {
            native: {
                balance: nativeResult.balance,
                formatted: weiToEth(nativeResult.balance),
            },
            tokens: tokenResults.map((token) => ({
                token_address: token.token_address,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                balance: token.balance,
                formatted: token.balance && token.decimals
                    ? (parseFloat(token.balance) / Math.pow(10, token.decimals)).toString()
                    : "0",
                logo: token.logo,
                thumbnail: token.thumbnail,
            })),
        };
    }
    catch (error) {
        console.error("getWalletBalances error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get wallet balances: ${error}`);
    }
});
// Get transaction history
exports.getTransactions = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { address, chain = "0x1", limit = 20 } = data;
        // Validate input
        if (!address || !isValidAddress(address)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid wallet address");
        }
        if (!isValidChain(chain)) {
            throw new functions.https.HttpsError("invalid-argument", "Unsupported blockchain network");
        }
        const response = await moralis_1.default.EvmApi.transaction.getWalletTransactions({
            address,
            chain,
            limit: Math.min(limit, 100), // Limit to 100 max
        });
        const transactions = response.toJSON();
        return transactions.result.map((tx) => ({
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
    }
    catch (error) {
        console.error("getTransactions error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get transactions: ${error}`);
    }
});
// Get NFTs
exports.getNFTs = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { address, chain = "0x1", limit = 20 } = data;
        // Validate input
        if (!address || !isValidAddress(address)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid wallet address");
        }
        if (!isValidChain(chain)) {
            throw new functions.https.HttpsError("invalid-argument", "Unsupported blockchain network");
        }
        const response = await moralis_1.default.EvmApi.nft.getWalletNFTs({
            address,
            chain,
            limit: Math.min(limit, 100),
            mediaItems: true,
        });
        const nfts = response.toJSON();
        return nfts.result.map((nft) => {
            var _a, _b, _c;
            let metadata = null;
            try {
                metadata = nft.metadata ? JSON.parse(nft.metadata) : null;
            }
            catch (e) {
                // Invalid JSON metadata
            }
            return {
                token_address: nft.token_address,
                token_id: nft.token_id,
                name: nft.name,
                symbol: nft.symbol,
                contract_type: nft.contract_type,
                metadata: metadata,
                image: (metadata === null || metadata === void 0 ? void 0 : metadata.image) || ((_c = (_b = (_a = nft.media) === null || _a === void 0 ? void 0 : _a.media_collection) === null || _b === void 0 ? void 0 : _b.high) === null || _c === void 0 ? void 0 : _c.url),
            };
        });
    }
    catch (error) {
        console.error("getNFTs error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get NFTs: ${error}`);
    }
});
// Get token price
exports.getTokenPrice = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { tokenAddress, chain = "0x1" } = data;
        // Validate input
        if (!tokenAddress || !isValidAddress(tokenAddress)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid token address");
        }
        if (!isValidChain(chain)) {
            throw new functions.https.HttpsError("invalid-argument", "Unsupported blockchain network");
        }
        const response = await moralis_1.default.EvmApi.token.getTokenPrice({
            address: tokenAddress,
            chain,
        });
        return response.toJSON();
    }
    catch (error) {
        console.error("getTokenPrice error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get token price: ${error}`);
    }
});
// Get wallet summary across multiple chains
exports.getWalletSummary = functions.https.onCall(async (data, context) => {
    try {
        await initializeMoralis();
        const { address, chains = ["0x1"] } = data;
        // Validate input
        if (!address || !isValidAddress(address)) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid wallet address");
        }
        const summaries = await Promise.all(chains.map(async (chain) => {
            try {
                if (!isValidChain(chain)) {
                    return { chainId: chain, error: "Unsupported chain" };
                }
                // Get balances and recent transactions
                const [nativeResponse, tokenResponse, txResponse] = await Promise.all([
                    moralis_1.default.EvmApi.balance.getNativeBalance({ address, chain }),
                    moralis_1.default.EvmApi.token.getWalletTokenBalances({ address, chain }),
                    moralis_1.default.EvmApi.transaction.getWalletTransactions({
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
                        tokens: tokens.map((token) => ({
                            token_address: token.token_address,
                            name: token.name,
                            symbol: token.symbol,
                            formatted: token.balance && token.decimals
                                ? parseFloat(token.balance) / Math.pow(10, token.decimals)
                                : "0",
                        })),
                    },
                    recentTransactions: transactions.result.slice(0, 5),
                    hasActivity: tokens.length > 0 ||
                        parseFloat(weiToEth(native.balance)) > 0 ||
                        transactions.result.length > 0,
                };
            }
            catch (error) {
                console.warn(`Error fetching data for chain ${chain}:`, error);
                return {
                    chainId: chain,
                    error: error instanceof Error ? error.message : String(error),
                    hasActivity: false,
                };
            }
        }));
        return summaries;
    }
    catch (error) {
        console.error("getWalletSummary error:", error);
        throw new functions.https.HttpsError("internal", `Failed to get wallet summary: ${error}`);
    }
});
// Search tokens (simplified - you might want to implement a more sophisticated search)
exports.searchTokens = functions.https.onCall(async (data, context) => {
    try {
        // For now, return empty array
        // You can implement token search using external APIs or databases
        return [];
    }
    catch (error) {
        console.error("searchTokens error:", error);
        throw new functions.https.HttpsError("internal", `Failed to search tokens: ${error}`);
    }
});
// Generate Agora RTC Token
exports.generateAgoraToken = functions.https.onCall(async (data, context) => {
    var _a, _b;
    try {
        const { channelName, uid = 0, role = "publisher" } = data;
        // Validate input
        if (!channelName) {
            throw new functions.https.HttpsError("invalid-argument", "Channel name is required");
        }
        // Get Agora credentials from Firebase config
        const appId = (_a = functions.config().agora) === null || _a === void 0 ? void 0 : _a.app_id;
        const appCertificate = (_b = functions.config().agora) === null || _b === void 0 ? void 0 : _b.certificate;
        if (!appId || !appCertificate) {
            throw new functions.https.HttpsError("failed-precondition", 'Agora credentials not configured. Set them with: firebase functions:config:set agora.app_id="YOUR_APP_ID" agora.certificate="YOUR_CERTIFICATE"');
        }
        // Token expiration time (24 hours from now)
        const expirationTimeInSeconds = 86400; // 24 hours
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        // Determine role (1 = publisher, 2 = subscriber)
        const userRole = role === "audience" ? agora_token_1.RtcRole.SUBSCRIBER : agora_token_1.RtcRole.PUBLISHER;
        // Generate token
        const token = agora_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, userRole, privilegeExpiredTs, privilegeExpiredTs);
        console.log(`Generated Agora token for channel: ${channelName}, uid: ${uid}`);
        return {
            token,
            appId,
            channelName,
            uid,
            expiresAt: privilegeExpiredTs,
        };
    }
    catch (error) {
        console.error("generateAgoraToken error:", error);
        throw new functions.https.HttpsError("internal", `Failed to generate Agora token: ${error}`);
    }
});
//# sourceMappingURL=index.js.map