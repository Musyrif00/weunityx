# WeUnityX Wallet Integration with Moralis

This document explains how to set up and use the Moralis Web3 API integration for wallet functionality in your WeUnityX app.

## Features

✅ **Multi-chain Support**

- Ethereum Mainnet
- Polygon
- Binance Smart Chain
- Testnets (Sepolia, Mumbai)

✅ **Wallet Management**

- View wallet balances (native tokens + ERC20)
- Transaction history
- Token details and metadata
- Multi-chain wallet overview

✅ **Real-time Data**

- Live balance updates
- Transaction status tracking
- Token price information (when available)

## Setup Instructions

### 1. Get Moralis API Key

1. Visit [moralis.io](https://moralis.io) and create an account
2. Create a new project in your Moralis dashboard
3. Navigate to "Web3 APIs" and copy your API key

### 2. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Add your Moralis API key to `.env`:
   ```env
   EXPO_PUBLIC_MORALIS_API_KEY=your_actual_api_key_here
   ```

### 3. Install Dependencies

The following packages have been installed:

- `moralis` - Moralis Web3 API SDK
- `react-native-qrcode-svg` - QR code generation
- `@react-native-async-storage/async-storage` - Local storage

### 4. Update Navigation

The wallet has been integrated into your main navigation:

- New "Wallet" tab in the bottom navigation
- Additional screens for transaction history and token details

## Usage

### Adding a Wallet

1. Open the app and navigate to the Wallet tab
2. Enter a valid Ethereum address (0x...)
3. The app will fetch and display:
   - Native token balance (ETH, MATIC, BNB)
   - All ERC20 token balances
   - Recent transactions

### Viewing Balances

- **Main Screen**: Shows total balance and token list
- **Chain Selector**: Switch between different blockchains
- **Token Details**: Tap any token to view detailed information

### Transaction History

- View recent transactions for the wallet
- See transaction details (hash, from/to, gas, status)
- Open transactions in block explorer

## Supported Networks

| Network  | Chain ID | Symbol | Explorer               |
| -------- | -------- | ------ | ---------------------- |
| Ethereum | 0x1      | ETH    | etherscan.io           |
| Polygon  | 0x89     | MATIC  | polygonscan.com        |
| BSC      | 0x38     | BNB    | bscscan.com            |
| Sepolia  | 0xaa36a7 | ETH    | sepolia.etherscan.io   |
| Mumbai   | 0x13881  | MATIC  | mumbai.polygonscan.com |

## API Endpoints Used

The app uses these Moralis API endpoints:

- `getNativeBalance` - Get native token balance
- `getWalletTokenBalances` - Get ERC20 token balances
- `getWalletTransactions` - Get transaction history
- `getWalletNFTs` - Get NFT collections (future feature)
- `getTokenPrice` - Get token prices (when available)

## Error Handling

- Network connectivity issues
- Invalid wallet addresses
- API rate limits
- Chain switching errors

All errors are handled gracefully with user-friendly messages.

## Security Notes

⚠️ **Important Security Considerations:**

1. **View-Only**: This integration is READ-ONLY. Users cannot send transactions or access private keys.

2. **API Key**: Keep your Moralis API key secure. It's exposed in the client but has usage limits.

3. **Address Validation**: All addresses are validated before API calls.

4. **No Private Keys**: The app never handles or stores private keys.

## Future Enhancements

🔄 **Planned Features:**

- Real-time price tracking with charts
- NFT gallery and details
- DeFi protocol integrations
- Token swapping (external service)
- Push notifications for transactions
- Portfolio analytics

## Troubleshooting

### Common Issues

1. **"Invalid wallet address"**

   - Ensure the address starts with '0x'
   - Check that it's exactly 42 characters long
   - Verify it's a valid Ethereum address format

2. **"Failed to fetch balances"**

   - Check your internet connection
   - Verify your Moralis API key is correct
   - Ensure you haven't exceeded API rate limits

3. **"Network not supported"**
   - The wallet might be on a network not yet supported
   - Try switching to Ethereum, Polygon, or BSC

### Getting Help

- Check the Moralis documentation: [docs.moralis.io](https://docs.moralis.io)
- Review the console logs for detailed error messages
- Ensure your API key has the correct permissions

## Code Structure

```
src/
├── config/
│   └── moralis.js          # Moralis configuration
├── contexts/
│   └── WalletContext.js    # Wallet state management
├── services/
│   └── walletService.js    # Moralis API interactions
└── screens/
    └── Wallet/
        ├── WalletScreen.js     # Main wallet interface
        ├── TransactionHistory.js # Transaction list
        └── TokenDetail.js      # Token details view
```

## Testing

Test the wallet functionality with these steps:

1. Use a well-known wallet address (like Vitalik's: `0xd8da6bf26964af9d7eed9e03e53415d37aa96045`)
2. Try different networks to see multi-chain support
3. Check transaction history for active wallets
4. Verify error handling with invalid addresses

---

This wallet integration provides a solid foundation for Web3 functionality in your social media app. Users can easily track their crypto assets while engaging with your platform's social features.
