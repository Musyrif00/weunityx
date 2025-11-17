// Moralis configuration - REST API only (no SDK)

// Moralis configuration
const MORALIS_CONFIG = {
  // You'll need to get these from your Moralis dashboard
  apiKey:
    process.env.EXPO_PUBLIC_MORALIS_API_KEY || "YOUR_MORALIS_API_KEY_HERE",

  // Supported chains - you can add more as needed
  supportedChains: [
    {
      name: "Ethereum",
      chainId: "0x1",
      symbol: "ETH",
      rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      explorerUrl: "https://etherscan.io",
    },
    {
      name: "Polygon",
      chainId: "0x89",
      symbol: "MATIC",
      rpcUrl: "https://polygon-rpc.com",
      explorerUrl: "https://polygonscan.com",
    },
    {
      name: "BSC",
      chainId: "0x38",
      symbol: "BNB",
      rpcUrl: "https://bsc-dataseed1.binance.org",
      explorerUrl: "https://bscscan.com",
    },
    // Testnets for development
    {
      name: "Sepolia",
      chainId: "0xaa36a7",
      symbol: "ETH",
      rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      explorerUrl: "https://sepolia.etherscan.io",
      testnet: true,
    },
    {
      name: "Mumbai",
      chainId: "0x13881",
      symbol: "MATIC",
      rpcUrl: "https://matic-mumbai.chainstacklabs.com",
      explorerUrl: "https://mumbai.polygonscan.com",
      testnet: true,
    },
  ],
};

let moralisInitialized = false;

// Note: We're using direct REST API calls instead of the Moralis SDK
// to avoid Node.js polyfill issues in React Native

/**
 * Get supported chains
 */
export const getSupportedChains = () => {
  return MORALIS_CONFIG.supportedChains;
};

/**
 * Get chain info by chain ID
 */
export const getChainInfo = (chainId) => {
  return MORALIS_CONFIG.supportedChains.find(
    (chain) => chain.chainId === chainId
  );
};

/**
 * Get chain info by name
 */
export const getChainByName = (name) => {
  return MORALIS_CONFIG.supportedChains.find(
    (chain) => chain.name.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Convert hex chain ID to decimal
 */
export const hexToDecimal = (hex) => {
  return parseInt(hex, 16);
};

/**
 * Convert decimal chain ID to hex
 */
export const decimalToHex = (decimal) => {
  return "0x" + decimal.toString(16);
};

export default MORALIS_CONFIG;
