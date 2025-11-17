import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
} from "react-native";
import {
  Text,
  Card,
  List,
  Chip,
  IconButton,
  ActivityIndicator,
  Divider,
  Button,
} from "react-native-paper";
import { useWallet } from "../../contexts/WalletContext";
import { theme } from "../../constants/theme";

const TransactionHistoryScreen = ({ navigation }) => {
  const {
    transactions,
    isLoading,
    refreshing,
    selectedChain,
    supportedChains,
    refreshWalletData,
  } = useWallet();

  const [expandedTx, setExpandedTx] = useState(null);

  // Handle refresh
  const handleRefresh = async () => {
    await refreshWalletData();
  };

  // Get current chain info
  const getCurrentChain = () => {
    return supportedChains.find((chain) => chain.chainId === selectedChain);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format transaction value
  const formatValue = (value, symbol = "ETH") => {
    if (!value || value === "0") return `0 ${symbol}`;
    return `${parseFloat(value).toFixed(6)} ${symbol}`;
  };

  // Get transaction type and color
  const getTransactionInfo = (tx, walletAddress) => {
    const isSent = tx.from.toLowerCase() === walletAddress.toLowerCase();
    const isReceived = tx.to.toLowerCase() === walletAddress.toLowerCase();

    if (isSent && isReceived) {
      return {
        type: "Self",
        color: theme.colors.warning,
        icon: "swap-horizontal",
      };
    } else if (isSent) {
      return { type: "Sent", color: theme.colors.error, icon: "arrow-up" };
    } else if (isReceived) {
      return {
        type: "Received",
        color: theme.colors.success,
        icon: "arrow-down",
      };
    } else {
      return {
        type: "Contract",
        color: theme.colors.primary,
        icon: "code-braces",
      };
    }
  };

  // Open transaction in block explorer
  const openInExplorer = (txHash) => {
    const currentChain = getCurrentChain();
    if (currentChain?.explorerUrl) {
      const url = `${currentChain.explorerUrl}/tx/${txHash}`;
      Linking.openURL(url);
    }
  };

  // Toggle transaction details
  const toggleTransactionDetails = (txHash) => {
    setExpandedTx(expandedTx === txHash ? null : txHash);
  };

  if (isLoading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={styles.loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.headerTitle}>Transaction History</Text>
            <Text style={styles.headerSubtitle}>
              {getCurrentChain()?.name || "Unknown Network"}
            </Text>
          </Card.Content>
        </Card>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                Transactions will appear here once you start using your wallet
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.transactionCard}>
            {transactions.map((tx, index) => {
              const txInfo = getTransactionInfo(tx, ""); // You'll need to pass wallet address
              const isExpanded = expandedTx === tx.hash;

              return (
                <View key={tx.hash}>
                  <List.Item
                    title={`${txInfo.type} ${formatValue(
                      tx.formatted,
                      getCurrentChain()?.symbol
                    )}`}
                    description={formatDate(tx.blockTimestamp)}
                    left={() => (
                      <View style={styles.transactionIcon}>
                        <List.Icon icon={txInfo.icon} color={txInfo.color} />
                      </View>
                    )}
                    right={() => (
                      <View style={styles.transactionRight}>
                        <Chip
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor: tx.success
                                ? theme.colors.success + "20"
                                : theme.colors.error + "20",
                            },
                          ]}
                          textStyle={{
                            color: tx.success
                              ? theme.colors.success
                              : theme.colors.error,
                            fontSize: 10,
                          }}
                        >
                          {tx.success ? "Success" : "Failed"}
                        </Chip>
                        <IconButton
                          icon={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          onPress={() => toggleTransactionDetails(tx.hash)}
                        />
                      </View>
                    )}
                    onPress={() => toggleTransactionDetails(tx.hash)}
                  />

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Divider />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hash:</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {tx.hash}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>From:</Text>
                        <Text style={styles.detailValue}>
                          {formatAddress(tx.from)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>To:</Text>
                        <Text style={styles.detailValue}>
                          {formatAddress(tx.to)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Block:</Text>
                        <Text style={styles.detailValue}>
                          #{tx.blockNumber}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Gas Used:</Text>
                        <Text style={styles.detailValue}>
                          {tx.gasUsed
                            ? parseInt(tx.gasUsed).toLocaleString()
                            : "Unknown"}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Nonce:</Text>
                        <Text style={styles.detailValue}>{tx.nonce}</Text>
                      </View>

                      <Button
                        mode="outlined"
                        onPress={() => openInExplorer(tx.hash)}
                        style={styles.explorerButton}
                        icon="open-in-new"
                      >
                        View on Explorer
                      </Button>
                    </View>
                  )}

                  {index < transactions.length - 1 && !isExpanded && (
                    <Divider />
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {/* Load More Button */}
        {transactions.length >= 20 && (
          <Button
            mode="outlined"
            onPress={handleRefresh}
            style={styles.loadMoreButton}
            loading={refreshing}
          >
            Load More Transactions
          </Button>
        )}
      </ScrollView>
    </View>
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  transactionCard: {
    margin: 16,
    marginTop: 8,
  },
  transactionIcon: {
    justifyContent: "center",
  },
  transactionRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusChip: {
    marginBottom: 4,
    height: 24,
  },
  expandedContent: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 2,
    textAlign: "right",
    fontFamily: "monospace",
  },
  explorerButton: {
    marginTop: 12,
  },
  loadMoreButton: {
    margin: 16,
    marginTop: 8,
  },
});

export default TransactionHistoryScreen;
