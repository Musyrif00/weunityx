import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Portal,
  Modal,
  TextInput,
  List,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useWallet } from "../../contexts/WalletContext";
import { theme } from "../../constants/theme";

const { width } = Dimensions.get("window");

const WalletScreen = ({ navigation }) => {
  const {
    walletAddress,
    selectedChain,
    balances,
    isLoading,
    error,
    refreshing,
    hasWallet,
    supportedChains,
    refreshWalletData,
    changeChain,
    clearError,
    removeWallet,
  } = useWallet();

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);

  // Show add wallet modal if no wallet is connected
  useEffect(() => {
    if (!hasWallet) {
      setShowAddWallet(true);
    }
  }, [hasWallet]);

  // Handle refresh
  const handleRefresh = async () => {
    await refreshWalletData();
  };

  // Handle chain change
  const handleChainChange = async (chainId) => {
    await changeChain(chainId);
    setShowChainSelector(false);
  };

  // Get current chain info
  const getCurrentChain = () => {
    return supportedChains.find((chain) => chain.chainId === selectedChain);
  };

  // Format balance for display
  const formatBalance = (balance, decimals = 6) => {
    if (!balance) return "0.00";
    const num = parseFloat(balance);
    return num.toFixed(decimals);
  };

  // Handle token press
  const handleTokenPress = (token) => {
    // Ensure token has the required properties for TokenDetail screen
    if (!token) return;

    // For native tokens, create a proper token structure
    const normalizedToken = {
      name: token.name || currentChain?.name || "Native Token",
      symbol: token.symbol || currentChain?.symbol || "ETH",
      formatted: token.formatted || "0",
      logo: token.logo || null,
      address: token.address || "native",
      ...token,
    };

    navigation.navigate("TokenDetail", {
      token: normalizedToken,
      chain: getCurrentChain(),
    });
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (walletAddress) {
      // In a real app, you'd use Clipboard API
      Alert.alert("Address Copied", `${walletAddress} copied to clipboard`);
    }
  };

  // Disconnect wallet
  const handleDisconnectWallet = () => {
    Alert.alert(
      "Disconnect Wallet",
      "Are you sure you want to disconnect your wallet?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await removeWallet();
          },
        },
      ]
    );
  };

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error]);

  if (!hasWallet) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <IconButton
            icon="wallet"
            size={80}
            iconColor={theme.colors.primary}
          />
          <Text style={styles.emptyStateTitle}>No Wallet Connected</Text>
          <Text style={styles.emptyStateDescription}>
            Connect your crypto wallet to view your balances, tokens, and
            transaction history
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowAddWallet(true)}
            style={styles.connectWalletButton}
          >
            Connect Wallet
          </Button>
        </View>
        <AddWalletModal
          visible={showAddWallet}
          onDismiss={() => setShowAddWallet(false)}
        />
      </View>
    );
  }

  const currentChain = getCurrentChain();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Network Selector */}
        <View style={styles.networkContainer}>
          <Text style={styles.networkLabel}>Network</Text>
          <Button
            mode="outlined"
            onPress={() => setShowChainSelector(true)}
            icon="chevron-down"
            style={styles.networkButton}
            labelStyle={styles.networkButtonLabel}
          >
            {currentChain?.name || "Select Network"}
          </Button>
        </View>

        {/* Header Card with Balance */}
        <Card style={styles.headerCard}>
          <LinearGradient
            colors={[
              "#702963", // App primary color
              "#8b3a7a", // Lighter shade
              "#a54d91", // Even lighter for nice gradient
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatBalance(balances?.native?.formatted)}{" "}
                {balances?.native?.symbol}
              </Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {walletAddress}
              </Text>
              <Button
                mode="text"
                onPress={copyAddress}
                compact
                labelStyle={styles.copyAddressLabel}
                contentStyle={styles.copyAddressContent}
              >
                Tap to copy address
              </Button>

              <View style={styles.walletActions}>
                <Button
                  mode="outlined"
                  icon="qrcode"
                  onPress={() => setShowQR(true)}
                  textColor="white"
                  style={styles.walletActionButton}
                  labelStyle={styles.walletActionLabel}
                >
                  QR Code
                </Button>
                <Button
                  mode="outlined"
                  icon="logout"
                  onPress={handleDisconnectWallet}
                  textColor="white"
                  style={[
                    styles.walletActionButton,
                    styles.disconnectActionButton,
                  ]}
                  labelStyle={styles.walletActionLabel}
                >
                  Disconnect
                </Button>
              </View>
            </View>
          </LinearGradient>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionButton}>
            <IconButton
              icon="arrow-up"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor="white"
              size={24}
              onPress={() => navigation.navigate("SendToken")}
            />
            <Text style={styles.actionText}>Send</Text>
          </View>
          <View style={styles.actionButton}>
            <IconButton
              icon="arrow-down"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor="white"
              size={24}
              onPress={() => navigation.navigate("ReceiveToken")}
            />
            <Text style={styles.actionText}>Receive</Text>
          </View>
          <View style={styles.actionButton}>
            <IconButton
              icon="swap-horizontal"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor="white"
              size={24}
              onPress={() => navigation.navigate("SwapTokens")}
            />
            <Text style={styles.actionText}>Swap</Text>
          </View>
          <View style={styles.actionButton}>
            <IconButton
              icon="history"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor="white"
              size={24}
              onPress={() => navigation.navigate("TransactionHistory")}
            />
            <Text style={styles.actionText}>History</Text>
          </View>
        </View>

        {/* Token List */}
        <Card style={styles.tokenCard}>
          <Card.Title title="Your Tokens" />
          <Card.Content>
            {isLoading ? (
              <ActivityIndicator size="large" style={styles.loading} />
            ) : (
              <>
                {/* Native Token */}
                <List.Item
                  title={currentChain?.name || "Native Token"}
                  description={`${formatBalance(balances?.native?.formatted)} ${
                    balances?.native?.symbol
                  }`}
                  left={(props) => <List.Icon {...props} icon="currency-eth" />}
                  right={() => (
                    <Text style={styles.tokenValue}>
                      ${formatBalance("0", 2)}
                    </Text>
                  )}
                  onPress={() => handleTokenPress(balances?.native)}
                />
                <Divider />

                {/* ERC20 Tokens */}
                {balances?.tokens?.map((token, index) => (
                  <View key={`${token.address}-${index}`}>
                    <List.Item
                      title={token.name || token.symbol}
                      description={`${formatBalance(token.formatted)} ${
                        token.symbol
                      }`}
                      left={(props) =>
                        token.logo ? (
                          <Image
                            source={{ uri: token.logo }}
                            style={styles.tokenLogo}
                          />
                        ) : (
                          <List.Icon {...props} icon="currency-usd" />
                        )
                      }
                      right={() => (
                        <Text style={styles.tokenValue}>
                          ${formatBalance("0", 2)}
                        </Text>
                      )}
                      onPress={() => handleTokenPress(token)}
                    />
                    {index < balances.tokens.length - 1 && <Divider />}
                  </View>
                ))}

                {(!balances?.tokens || balances.tokens.length === 0) && (
                  <Text style={styles.noTokensText}>
                    No tokens found on {currentChain?.name}
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* QR Code Modal */}
      <Portal>
        <Modal
          visible={showQR}
          onDismiss={() => setShowQR(false)}
          contentContainerStyle={styles.qrModal}
        >
          <Text style={styles.qrTitle}>Receive {currentChain?.symbol}</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={walletAddress || ""}
              size={200}
              backgroundColor="white"
            />
          </View>
          <Text style={styles.qrAddress}>{walletAddress}</Text>
          <Button
            mode="contained"
            onPress={copyAddress}
            style={styles.qrButton}
          >
            Copy Address
          </Button>
        </Modal>
      </Portal>

      {/* Chain Selector Modal */}
      <Portal>
        <Modal
          visible={showChainSelector}
          onDismiss={() => setShowChainSelector(false)}
          contentContainerStyle={styles.chainModal}
        >
          <Text style={styles.chainModalTitle}>Select Network</Text>
          {supportedChains.map((chain) => (
            <List.Item
              key={chain.chainId}
              title={chain.name}
              description={chain.symbol}
              left={(props) => <List.Icon {...props} icon="link" />}
              right={() =>
                selectedChain === chain.chainId ? (
                  <List.Icon icon="check" />
                ) : null
              }
              onPress={() => handleChainChange(chain.chainId)}
            />
          ))}
        </Modal>
      </Portal>
    </View>
  );
};

// Add Wallet Modal Component
const AddWalletModal = ({ visible, onDismiss }) => {
  const { addWallet, isLoading } = useWallet();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleAddWallet = async () => {
    if (!address.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    const success = await addWallet(address.trim());
    if (success) {
      onDismiss();
      setAddress("");
      setError("");
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.addWalletModal}
      >
        <Text style={styles.addWalletTitle}>Add Wallet</Text>
        <Text style={styles.addWalletSubtitle}>
          Enter your wallet address to view balances and transaction history
        </Text>

        <TextInput
          label="Wallet Address"
          value={address}
          onChangeText={setAddress}
          placeholder="0x..."
          error={!!error}
          style={styles.addressInput}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAddWallet}
            loading={isLoading}
            disabled={isLoading}
            style={styles.modalButton}
          >
            Add Wallet
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  networkContainer: {
    margin: 16,
    marginBottom: 8,
  },
  networkLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  networkButton: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  networkButtonLabel: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    elevation: 8,
  },
  gradient: {
    padding: 20,
    borderRadius: 12,
  },
  balanceSection: {
    alignItems: "center",
  },
  walletActions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  walletActionButton: {
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    flex: 1,
  },
  disconnectActionButton: {
    borderColor: "rgba(239, 68, 68, 0.6)",
  },
  walletActionLabel: {
    color: "white",
    fontSize: 13,
  },
  copyAddressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  copyAddressContent: {
    opacity: 1,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  balanceAmount: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  addressText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "monospace",
    maxWidth: width * 0.7,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginVertical: 20,
  },
  actionButton: {
    alignItems: "center",
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.text,
  },
  tokenCard: {
    margin: 16,
    marginTop: 0,
  },
  loading: {
    marginVertical: 20,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenValue: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  noTokensText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginVertical: 20,
  },
  qrModal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
  },
  qrAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "monospace",
  },
  qrButton: {
    width: "100%",
  },
  chainModal: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    maxHeight: "70%",
  },
  chainModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 20,
    paddingBottom: 10,
  },
  addWalletModal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  addWalletTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addWalletSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  addressInput: {
    marginBottom: 10,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  connectWalletButton: {
    paddingHorizontal: 32,
  },
});

export default WalletScreen;
