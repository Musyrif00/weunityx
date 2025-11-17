import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import walletService from "../services/walletService";
import { getSupportedChains } from "../config/moralis";

const WalletContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  WALLET_ADDRESS: "wallet_address",
  SELECTED_CHAIN: "selected_chain",
  WALLET_BALANCES: "wallet_balances",
};

export const WalletProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedChain, setSelectedChain] = useState("0x1"); // Default to Ethereum
  const [balances, setBalances] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize wallet context
  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setIsLoading(true);

      // Initialize wallet service
      await walletService.initialize();

      // Load saved wallet data
      const [savedAddress, savedChain] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CHAIN),
      ]);

      if (savedAddress) {
        setWalletAddress(savedAddress);
      }

      if (savedChain) {
        setSelectedChain(savedChain);
      }

      setIsInitialized(true);
      setError(null);
    } catch (error) {
      console.error("Error initializing wallet:", error);
      setError("Failed to initialize wallet service");
    } finally {
      setIsLoading(false);
    }
  };

  // Add wallet address
  const addWallet = async (address) => {
    try {
      if (!walletService.validateAddress(address)) {
        throw new Error("Invalid wallet address");
      }

      setIsLoading(true);
      setError(null);

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
      setWalletAddress(address);

      // Fetch initial data
      await refreshWalletData(address, selectedChain);

      return true;
    } catch (error) {
      console.error("Error adding wallet:", error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove wallet
  const removeWallet = async () => {
    try {
      setIsLoading(true);

      // Clear storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS),
        AsyncStorage.removeItem(STORAGE_KEYS.WALLET_BALANCES),
      ]);

      // Clear state
      setWalletAddress(null);
      setBalances(null);
      setTransactions([]);
      setNfts([]);
      setError(null);

      return true;
    } catch (error) {
      console.error("Error removing wallet:", error);
      setError("Failed to remove wallet");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Change selected chain
  const changeChain = async (chainId) => {
    try {
      setIsLoading(true);
      setError(null);

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CHAIN, chainId);
      setSelectedChain(chainId);

      // Refresh data for new chain
      if (walletAddress) {
        await refreshWalletData(walletAddress, chainId);
      }

      return true;
    } catch (error) {
      console.error("Error changing chain:", error);
      setError("Failed to change blockchain network");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh wallet data
  const refreshWalletData = async (
    address = walletAddress,
    chain = selectedChain
  ) => {
    if (!address) return;

    try {
      setRefreshing(true);
      setError(null);

      const [walletBalances, walletTransactions, walletNFTs] =
        await Promise.all([
          walletService.getWalletBalances(address, chain),
          walletService.getTransactions(address, chain, 20).catch(() => []),
          walletService.getNFTs(address, chain, 20).catch(() => []),
        ]);

      setBalances(walletBalances);
      setTransactions(walletTransactions);
      setNfts(walletNFTs);

      // Cache balances
      await AsyncStorage.setItem(
        STORAGE_KEYS.WALLET_BALANCES,
        JSON.stringify(walletBalances)
      );
    } catch (error) {
      console.error("Error refreshing wallet data:", error);
      setError("Failed to refresh wallet data");
    } finally {
      setRefreshing(false);
    }
  };

  // Get wallet summary for multiple chains
  const getMultiChainSummary = async (address = walletAddress) => {
    if (!address) return [];

    try {
      setIsLoading(true);
      const supportedChains = getSupportedChains();
      const mainnetChains = supportedChains
        .filter((chain) => !chain.testnet)
        .map((chain) => chain.chainId);

      const summary = await walletService.getWalletSummary(
        address,
        mainnetChains
      );
      return summary.filter((chain) => chain.hasActivity);
    } catch (error) {
      console.error("Error getting multi-chain summary:", error);
      setError("Failed to get wallet summary");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Search for tokens
  const searchTokens = async (query, chain = selectedChain) => {
    try {
      const results = await walletService.searchTokens(query, chain);
      return results;
    } catch (error) {
      console.error("Error searching tokens:", error);
      return [];
    }
  };

  // Get token price
  const getTokenPrice = async (tokenAddress, chain = selectedChain) => {
    try {
      const price = await walletService.getTokenPrice(tokenAddress, chain);
      return price;
    } catch (error) {
      console.error("Error getting token price:", error);
      return null;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Auto-refresh wallet data every 30 seconds when app is active
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      refreshWalletData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress, selectedChain]);

  const value = {
    // State
    isInitialized,
    walletAddress,
    selectedChain,
    balances,
    transactions,
    nfts,
    isLoading,
    error,
    refreshing,

    // Actions
    addWallet,
    removeWallet,
    changeChain,
    refreshWalletData,
    getMultiChainSummary,
    searchTokens,
    getTokenPrice,
    clearError,

    // Utils
    supportedChains: getSupportedChains(),
    hasWallet: !!walletAddress,
    isValidAddress: walletService.validateAddress,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
