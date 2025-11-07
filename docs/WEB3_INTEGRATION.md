# Web3 Wallet Integration Documentation

## Overview

EduVault now includes full Web3 wallet integration with support for multiple wallet providers including MetaMask, WalletConnect, and Coinbase Wallet. This allows users to connect their blockchain wallets, manage their identities, and interact with decentralized features.

## Features

✅ **Multiple Wallet Support**
- MetaMask (Browser Extension)
- WalletConnect (Mobile & Desktop)
- Coinbase Wallet
- Other injected wallets

✅ **Multi-Chain Support**
- Ethereum Mainnet & Sepolia Testnet
- Polygon & Polygon Amoy
- Celo & Celo Alfajores

✅ **State Management**
- Persistent wallet connections
- Real-time balance updates
- Network switching
- Connection status tracking

✅ **User Experience**
- Responsive UI for mobile & desktop
- Loading states & error handling
- Connection status indicators
- Wallet address formatting

## Architecture

### Core Components

#### 1. Web3 Configuration (`src/lib/web3/config.js`)
Central configuration for wagmi with:
- Chain configurations
- Wallet connectors setup
- Transport providers

#### 2. Web3Provider (`src/providers/Web3Provider.jsx`)
React context provider that wraps the application with:
- WagmiProvider for blockchain interactions
- QueryClientProvider for data fetching/caching

#### 3. useWallet Hook (`src/hooks/useWallet.js`)
Custom hook that provides:
- Connection state (address, isConnected, isConnecting)
- Wallet methods (connectWallet, disconnectWallet)
- Balance information
- Network management (switchNetwork)
- Error handling

#### 4. Utility Functions (`src/utils/formatAddress.js`)
Helper functions for:
- Address formatting (0x1234...5678)
- Balance formatting
- Chain name resolution

### UI Components

#### WalletModal (`src/components/WalletModal.jsx`)
Multi-step modal for:
1. **Step 1**: Get a Wallet (educational)
2. **Step 2**: Connect Wallet (actual connection with error handling)
3. **Step 3**: Set Up Profile (only accessible after successful connection)

**Key Features:**
- Dynamic connector list from wagmi
- Real-time connection status
- Loading indicators
- Error messages
- Auto-advance on successful connection
- Wallet address display
- Connection validation before profile setup

#### Navbar (`src/components/Navbar.jsx`)
Updated with:
- Connect button (when not connected)
- Wallet address display (when connected)
- Balance information
- Dropdown menu with:
  - View Profile
  - Disconnect option
- Responsive design for mobile

## Setup Instructions

### 1. Get WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up / Log in
3. Create a new project
4. Copy your Project ID

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Install Dependencies

```bash
pnpm install --legacy-peer-deps
```

### 4. Run Development Server

```bash
pnpm dev
```

## Usage Guide

### Connecting a Wallet

1. Click "Connect Wallet" button in the Navbar
2. Choose your preferred wallet from the modal
3. Approve the connection in your wallet
4. Once connected, you'll see your address in the Navbar

### Using the useWallet Hook

```javascript
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const {
    address,           // User's wallet address
    isConnected,       // Connection status
    isConnecting,      // Loading state
    balance,           // Formatted balance
    balanceSymbol,     // Token symbol (ETH, MATIC, etc.)
    chainId,           // Current chain ID
    connectors,        // Available connectors
    connectWallet,     // Function to connect
    disconnectWallet,  // Function to disconnect
    switchNetwork,     // Function to switch chains
    error              // Connection errors
  } = useWallet();

  // Use the wallet state and methods in your component
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={() => connectWallet(connectors[0])}>
          Connect
        </button>
      )}
    </div>
  );
}
```

### Checking Connection Status

```javascript
const { isConnected, address } = useWallet();

if (isConnected && address) {
  // User is connected, proceed with blockchain operations
  console.log('User wallet:', address);
}
```

### Handling Disconnection

```javascript
const { disconnectWallet } = useWallet();

const handleLogout = async () => {
  await disconnectWallet();
  // Clear user session or redirect
};
```

## Supported Networks

| Network | Chain ID | Type |
|---------|----------|------|
| Ethereum Mainnet | 1 | Mainnet |
| Sepolia | 11155111 | Testnet |
| Polygon | 137 | Mainnet |
| Polygon Amoy | 80002 | Testnet |
| Celo | 42220 | Mainnet |
| Celo Alfajores | 44787 | Testnet |

## Testing

### Testing with MetaMask

1. Install MetaMask browser extension
2. Create/import a wallet
3. Connect to Sepolia testnet (recommended for testing)
4. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
5. Test connection in the application

### Testing with WalletConnect

1. Open the application on desktop
2. Click "WalletConnect" option
3. Scan QR code with mobile wallet (MetaMask, Trust Wallet, etc.)
4. Approve connection on mobile

### Testing with Coinbase Wallet

1. Install Coinbase Wallet extension or mobile app
2. Select "Coinbase Wallet" option
3. Approve connection

## Troubleshooting

### Connection Fails

**Issue**: Wallet connection fails or shows error

**Solutions**:
- Ensure wallet extension is installed and unlocked
- Check that you're on a supported network
- Try refreshing the page
- Clear browser cache
- Check console for specific error messages

### WalletConnect QR Code Not Showing

**Issue**: QR code doesn't appear for WalletConnect

**Solutions**:
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly
- Check that the Project ID is active in WalletConnect Cloud
- Check browser console for errors

### Balance Not Showing

**Issue**: Wallet connected but balance is 0 or not displayed

**Solutions**:
- Ensure you have funds in your wallet
- Check that you're on the correct network
- Wait a few seconds for balance to load
- Try disconnecting and reconnecting

### Network Switching Issues

**Issue**: Can't switch networks

**Solutions**:
- Check that the target network is configured in your wallet
- Some wallets require manual network addition
- Try switching manually in the wallet first

## Security Considerations

### Best Practices

1. **Never store private keys**: The application only connects to wallets, never stores keys
2. **Validate transactions**: Always verify transaction details before signing
3. **Use testnets**: Test with testnets before deploying to mainnet
4. **Environment variables**: Keep `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` secure
5. **User education**: Inform users about wallet security

### Connection Safety

- Connections are client-side only
- No private keys are transmitted
- Users approve all transactions
- Disconnect when not in use

## Advanced Configuration

### Adding Custom Networks

Edit `src/lib/web3/config.js`:

```javascript
import { defineChain } from 'viem';

const myCustomChain = defineChain({
  id: 12345,
  name: 'My Custom Chain',
  network: 'custom',
  nativeCurrency: {
    decimals: 18,
    name: 'Custom Token',
    symbol: 'CTK',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.customchain.com'],
    },
    public: {
      http: ['https://rpc.customchain.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.customchain.com' },
  },
});

// Add to chains array in config
export const chains = [mainnet, sepolia, myCustomChain];
```

### Custom RPC Providers

Use custom RPC endpoints for better performance:

```javascript
// In config.js
transports: {
  [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
  // ... other chains
}
```

## API Reference

### useWallet Hook

```typescript
interface UseWalletReturn {
  // State
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | undefined;
  balanceSymbol: string | undefined;
  isBalanceLoading: boolean;
  chainId: number;
  connectors: Connector[];
  currentConnector: Connector | undefined;
  connectorName: string | null;
  
  // Methods
  connectWallet: (connector: Connector) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  
  // Errors
  error: Error | null;
}
```

### Format Utilities

```typescript
// Format wallet address
formatAddress(address: string, startChars?: number, endChars?: number): string

// Format transaction hash
formatHash(hash: string, startChars?: number, endChars?: number): string

// Format balance value
formatBalance(balance: string | number, decimals?: number): string

// Get chain name from ID
getChainName(chainId: number): string
```

## Future Enhancements

- [ ] Add support for more wallet providers (Ledger, Trezor)
- [ ] Implement ENS name resolution
- [ ] Add transaction history tracking
- [ ] Implement gas estimation
- [ ] Add multi-signature wallet support
- [ ] Integrate with smart contracts for EduVault features

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review the [wagmi documentation](https://wagmi.sh/)
- Check the [WalletConnect docs](https://docs.walletconnect.com/)

## License

This Web3 integration is part of the EduVault project.



