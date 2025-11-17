import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useWallet } from "../../contexts/WalletContext";
import { theme } from "../../constants/theme";

const { width } = Dimensions.get("window");

const TokenDetailScreen = ({ route, navigation }) => {
  const { token, chain } = route.params;
  const { getTokenPrice, refreshWalletData } = useWallet();

  const [tokenPrice, setTokenPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock price data for demonstration
  const mockPriceData = {
    labels: ["1h", "6h", "12h", "1d", "7d"],
    datasets: [
      {
        data: [
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
        ],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  useEffect(() => {
    loadTokenPrice();
  }, []);

  const loadTokenPrice = async () => {
    if (!token.address) return; // Skip for native tokens

    try {
      setIsLoading(true);
      const price = await getTokenPrice(token.address, chain.chainId);
      setTokenPrice(price);
    } catch (error) {
      console.error("Error loading token price:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTokenPrice(), refreshWalletData()]);
    setRefreshing(false);
  };

  const formatBalance = (balance, decimals = 6) => {
    if (!balance) return "0.00";
    return parseFloat(balance).toFixed(decimals);
  };

  const formatPrice = (price) => {
    if (!price) return "$0.00";
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const calculateValue = () => {
    if (!token.formatted || !tokenPrice?.usdPrice) return "$0.00";
    const value = parseFloat(token.formatted) * tokenPrice.usdPrice;
    return `$${value.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <View style={styles.tokenInfo}>
                {token.logo && (
                  <View style={styles.tokenLogoContainer}>
                    <Image
                      source={{ uri: token.logo }}
                      style={styles.tokenLogo}
                    />
                  </View>
                )}
                <View style={styles.tokenDetails}>
                  <Text style={styles.tokenName}>
                    {token.name || token.symbol || "Unknown Token"}
                  </Text>
                  <Text style={styles.tokenSymbol}>
                    {token.symbol || "TOKEN"}
                  </Text>
                  <Chip
                    style={styles.chainChip}
                    textStyle={styles.chainChipText}
                  >
                    {chain.name}
                  </Chip>
                </View>
              </View>
            </View>

            <View style={styles.balanceSection}>
              <Text style={styles.balanceAmount}>
                {formatBalance(token.formatted)} {token.symbol}
              </Text>
              <Text style={styles.balanceValue}>{calculateValue()}</Text>
            </View>
          </LinearGradient>
        </Card>

        {/* Price Information */}
        {tokenPrice && (
          <Card style={styles.priceCard}>
            <Card.Title title="Price Information" />
            <Card.Content>
              <View style={styles.priceInfo}>
                <Text style={styles.currentPrice}>
                  {formatPrice(tokenPrice.usdPrice)}
                </Text>
                <Chip
                  style={styles.priceChangeChip}
                  textStyle={styles.priceChangeText}
                >
                  +2.45% (24h)
                </Chip>
              </View>

              <Text style={styles.priceNote}>
                Live price tracking coming soon...
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Token Information */}
        <Card style={styles.infoCard}>
          <Card.Title title="Token Information" />
          <Card.Content>
            {token.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contract Address:</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {token.address}
                </Text>
              </View>
            )}

            {token.decimals && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Decimals:</Text>
                <Text style={styles.infoValue}>{token.decimals}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network:</Text>
              <Text style={styles.infoValue}>{chain.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Balance:</Text>
              <Text style={styles.infoValue}>
                {formatBalance(token.formatted)} {token.symbol}
              </Text>
            </View>

            {tokenPrice && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Current Price:</Text>
                  <Text style={styles.infoValue}>
                    {formatPrice(tokenPrice.usdPrice)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Value:</Text>
                  <Text style={styles.infoValue}>{calculateValue()}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon="send"
            onPress={() => navigation.navigate("SendToken", { token, chain })}
            style={styles.actionButton}
          >
            Send
          </Button>

          <Button
            mode="outlined"
            icon="swap-horizontal"
            onPress={() => navigation.navigate("SwapTokens", { token, chain })}
            style={styles.actionButton}
          >
            Swap
          </Button>
        </View>

        {/* Recent Transactions */}
        <Card style={styles.transactionsCard}>
          <Card.Title
            title="Recent Transactions"
            right={(props) => (
              <Button
                {...props}
                mode="text"
                onPress={() =>
                  navigation.navigate("TransactionHistory", { token })
                }
              >
                View All
              </Button>
            )}
          />
          <Card.Content>
            <Text style={styles.comingSoon}>
              Token-specific transaction history coming soon...
            </Text>
          </Card.Content>
        </Card>
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
  headerCard: {
    margin: 16,
    elevation: 8,
  },
  gradient: {
    padding: 20,
    borderRadius: 12,
  },
  header: {
    marginBottom: 20,
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenLogoContainer: {
    marginRight: 16,
  },
  tokenLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tokenSymbol: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    marginBottom: 8,
  },
  chainChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
  },
  chainChipText: {
    color: "white",
    fontSize: 12,
  },
  balanceSection: {
    alignItems: "center",
  },
  balanceAmount: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceValue: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
  },
  priceCard: {
    margin: 16,
    marginTop: 8,
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  priceChangeChip: {
    backgroundColor: theme.colors.success + "20",
  },
  priceChangeText: {
    color: theme.colors.success,
    fontSize: 12,
  },
  priceNote: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    marginTop: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    textAlign: "right",
    fontFamily: "monospace",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  transactionsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  comingSoon: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    paddingVertical: 20,
  },
});

export default TokenDetailScreen;
