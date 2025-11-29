"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpGetWalletBalances = exports.httpGetTransactions = exports.httpGetTokenBalances = exports.httpGetNativeBalance = exports.testWallet = void 0;
const functions = require("firebase-functions");
const moralis_1 = require("moralis");
const cors = require("cors");
// Initialize CORS
const corsHandler = cors({ origin: true });
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
        throw new Error("Moralis API key not configured");
    }
    await moralis_1.default.start({
        apiKey: apiKey,
    });
    moralisInitialized = true;
    console.log("Moralis initialized successfully");
};
// Simple HTTP endpoint for testing
exports.testWallet = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // Simple response without Moralis for testing
            res.json({
                success: true,
                message: "Wallet service is running!",
                timestamp: new Date().toISOString(),
                mockData: {
                    balance: "1000000000000000000",
                    formatted: "1.0",
                    symbol: "ETH",
                },
            });
        }
        catch (error) {
            console.error("Test wallet error:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
});
// HTTP endpoint for native balance
exports.httpGetNativeBalance = functions.https.onRequest(async (req, res) => {
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
            const result = await moralis_1.default.EvmApi.balance.getNativeBalance({
                address,
                chain,
            });
            res.json({
                success: true,
                balance: result.result.balance,
                formatted: weiToEth(result.result.balance.toString()),
                symbol: "ETH",
            });
        }
        catch (error) {
            console.error("HTTP getNativeBalance error:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
});
// HTTP endpoint for token balances
exports.httpGetTokenBalances = functions.https.onRequest(async (req, res) => {
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
            const result = await moralis_1.default.EvmApi.token.getWalletTokenBalances({
                address,
                chain,
            });
            const tokens = result.result.map((token) => {
                var _a, _b;
                return ({
                    token_address: token.token_address || "",
                    name: token.name || "",
                    symbol: token.symbol || "",
                    decimals: token.decimals || 0,
                    balance: ((_a = token.balance) === null || _a === void 0 ? void 0 : _a.toString()) || "0",
                    formatted: token.decimals
                        ? (parseFloat(((_b = token.balance) === null || _b === void 0 ? void 0 : _b.toString()) || "0") /
                            Math.pow(10, token.decimals)).toString()
                        : "0",
                    logo: token.logo || null,
                    thumbnail: token.thumbnail || null,
                });
            });
            res.json({
                success: true,
                tokens,
            });
        }
        catch (error) {
            console.error("HTTP getTokenBalances error:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
});
// HTTP endpoint for transactions
exports.httpGetTransactions = functions.https.onRequest(async (req, res) => {
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
            const result = await moralis_1.default.EvmApi.transaction.getWalletTransactions({
                address,
                chain,
                limit,
            });
            const transactions = result.result.map((tx) => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return ({
                    hash: tx.hash || "",
                    block_number: ((_a = tx.block_number) === null || _a === void 0 ? void 0 : _a.toString()) || ((_b = tx.blockNumber) === null || _b === void 0 ? void 0 : _b.toString()) || "0",
                    block_timestamp: tx.block_timestamp || tx.blockTimestamp || "",
                    from_address: tx.from_address || tx.fromAddress || "",
                    to_address: tx.to_address || tx.toAddress || "",
                    value: ((_c = tx.value) === null || _c === void 0 ? void 0 : _c.toString()) || "0",
                    formatted: weiToEth(((_d = tx.value) === null || _d === void 0 ? void 0 : _d.toString()) || "0"),
                    gas: ((_e = tx.gas) === null || _e === void 0 ? void 0 : _e.toString()) || "0",
                    gas_price: ((_f = tx.gas_price) === null || _f === void 0 ? void 0 : _f.toString()) || ((_g = tx.gasPrice) === null || _g === void 0 ? void 0 : _g.toString()) || "0",
                    nonce: ((_h = tx.nonce) === null || _h === void 0 ? void 0 : _h.toString()) || "0",
                    success: true,
                });
            });
            res.json({
                success: true,
                transactions,
            });
        }
        catch (error) {
            console.error("HTTP getTransactions error:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
});
// HTTP endpoint for wallet balances (native + tokens)
exports.httpGetWalletBalances = functions.https.onRequest(async (req, res) => {
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
            const nativeResult = await moralis_1.default.EvmApi.balance.getNativeBalance({
                address,
                chain,
            });
            // Get token balances
            const tokenResult = await moralis_1.default.EvmApi.token.getWalletTokenBalances({
                address,
                chain,
            });
            const native = {
                balance: nativeResult.result.balance,
                formatted: weiToEth(nativeResult.result.balance.toString()),
                symbol: "ETH",
            };
            const tokens = tokenResult.result.map((token) => {
                var _a, _b;
                return ({
                    token_address: token.token_address || "",
                    name: token.name || "",
                    symbol: token.symbol || "",
                    decimals: token.decimals || 0,
                    balance: ((_a = token.balance) === null || _a === void 0 ? void 0 : _a.toString()) || "0",
                    formatted: token.decimals
                        ? (parseFloat(((_b = token.balance) === null || _b === void 0 ? void 0 : _b.toString()) || "0") /
                            Math.pow(10, token.decimals)).toString()
                        : "0",
                    logo: token.logo || null,
                    thumbnail: token.thumbnail || null,
                });
            });
            res.json({
                success: true,
                native,
                tokens,
            });
        }
        catch (error) {
            console.error("HTTP getWalletBalances error:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
});
//# sourceMappingURL=http-functions.js.map