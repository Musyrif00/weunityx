# Secure Moralis Integration with Firebase Cloud Functions

This guide shows you how to set up a secure Moralis integration using Firebase Cloud Functions as middleware, keeping your API keys safe on the server side.

## Architecture

```
Expo App → Firebase Cloud Functions → Moralis API → Blockchain Networks
```

**Benefits:**

- ✅ Moralis API key stays secure on server
- ✅ No React Native polyfill issues
- ✅ Better rate limiting control
- ✅ Server-side caching possible
- ✅ Authentication & authorization at function level

## Setup Instructions

### 1. Firebase Project Setup

1. **Create a Firebase Project**

   ```bash
   # Install Firebase CLI if you haven't
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Initialize Firebase in your project
   firebase init
   ```

2. **Select services:** Functions, and any others you need

3. **Update firebase.json** with your project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-firebase-project-id"
     }
   }
   ```

### 2. Cloud Functions Setup

1. **Navigate to functions directory:**

   ```bash
   cd functions
   npm install
   ```

2. **Set your Moralis API Key (IMPORTANT - Keep it secure):**

   ```bash
   firebase functions:config:set moralis.api_key="YOUR_MORALIS_API_KEY_HERE"
   ```

3. **Build and deploy functions:**
   ```bash
   npm run build
   firebase deploy --only functions
   ```

### 3. Client-Side Configuration

1. **Update your Firebase config** in `src/config/firebase.js` to include Functions:

   ```javascript
   import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

   // Add this to your existing firebase config
   export const functions = getFunctions(app);

   // For development/testing (optional)
   if (__DEV__) {
     connectFunctionsEmulator(functions, "localhost", 5001);
   }
   ```

2. **Test the wallet functionality** - The wallet should now work without polyfill issues!

## Available Cloud Functions

Your Firebase project now has these callable functions:

### Core Functions

- `getNativeBalance(address, chain)` - Get native token balance (ETH, MATIC, etc.)
- `getTokenBalances(address, chain)` - Get all ERC20 token balances
- `getWalletBalances(address, chain)` - Get complete wallet overview
- `getTransactions(address, chain, limit)` - Get transaction history
- `getNFTs(address, chain, limit)` - Get NFT collections

### Advanced Functions

- `getTokenPrice(tokenAddress, chain)` - Get current token price
- `getWalletSummary(address, chains[])` - Multi-chain wallet summary
- `searchTokens(query, chain)` - Search for tokens (can be customized)

## Supported Networks

| Network           | Chain ID | Symbol |
| ----------------- | -------- | ------ |
| Ethereum          | 0x1      | ETH    |
| Polygon           | 0x89     | MATIC  |
| BSC               | 0x38     | BNB    |
| Sepolia (testnet) | 0xaa36a7 | ETH    |
| Mumbai (testnet)  | 0x13881  | MATIC  |

## Security Features

✅ **Server-side API key storage** - Moralis API key never exposed to clients
✅ **Input validation** - All addresses and chains validated before API calls  
✅ **Rate limiting** - Firebase automatically handles rate limiting
✅ **Authentication** - Easy to add Firebase Auth checks to functions
✅ **Error handling** - Proper error responses without exposing internals

## Development & Testing

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start --only functions

# Your app will use local functions instead of deployed ones
```

### Testing Functions

```bash
# Test a specific function
firebase functions:shell

# In the shell:
getNativeBalance({address: "0x...", chain: "0x1"})
```

### Monitoring

```bash
# View function logs
firebase functions:log

# Real-time logs
firebase functions:log --follow
```

## Cost Considerations

- **Firebase Functions:** Pay per invocation (generous free tier)
- **Moralis API:** Your existing plan limits apply
- **Optimization:** Consider implementing server-side caching for frequently requested data

## Adding New Functions

To add new Moralis functionality:

1. **Add function in** `functions/src/index.ts`:

   ```typescript
   export const myNewFunction = functions.https.onCall(
     async (data, context) => {
       // Your Moralis API call here
     }
   );
   ```

2. **Update client service** `src/services/walletService.js`:

   ```javascript
   async myNewFeature(params) {
     return await this.callCloudFunction('myNewFunction', params);
   }
   ```

3. **Deploy:**
   ```bash
   firebase deploy --only functions
   ```

## Troubleshooting

### Common Issues

1. **"Function not found"**

   - Ensure functions are deployed: `firebase deploy --only functions`
   - Check function names match exactly

2. **"Moralis API key not configured"**

   - Set the config: `firebase functions:config:set moralis.api_key="YOUR_KEY"`
   - Redeploy after setting config

3. **CORS errors**

   - Functions include CORS headers automatically
   - Ensure your Firebase config is correct

4. **Rate limiting**
   - Moralis rate limits apply to your server
   - Consider implementing caching for frequently requested data

### Debug Commands

```bash
# Check function config
firebase functions:config:get

# View deployed functions
firebase functions:list

# Check logs for errors
firebase functions:log --only=error
```

## Production Deployment

1. **Environment separation:**

   ```bash
   # Deploy to staging
   firebase use staging
   firebase deploy --only functions

   # Deploy to production
   firebase use production
   firebase deploy --only functions
   ```

2. **Monitor performance:**
   - Use Firebase Console to monitor function performance
   - Set up alerts for errors or high latency

This setup gives you a production-ready, secure Moralis integration that scales automatically with Firebase! 🚀
