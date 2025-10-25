import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'

// WalletConnect Project ID (required for RainbowKit)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.warn('[wagmi] VITE_WALLETCONNECT_PROJECT_ID is not set')
}

console.log('[wagmi] Initializing with Project ID:', projectId ? '✓ Set' : '✗ Missing')

// Alchemy RPC URL
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY

// RPC URLs
const getBaseRpcUrl = () => {
  if (alchemyApiKey) {
    return `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  }
  return 'https://mainnet.base.org'
}

const getBaseSepoliaRpcUrl = () => {
  if (alchemyApiKey) {
    return `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
  }
  return 'https://sepolia.base.org'
}

// Configure Coinbase Wallet preference
// Use 'smartWalletOnly' to prefer Smart Wallet (better localhost compatibility)
coinbaseWallet.preference = 'smartWalletOnly'

console.log('[wagmi] Coinbase Wallet preference set to:', coinbaseWallet.preference)

// Configure wallets using connectorsForWallets
// This allows fine-grained control over wallet preferences
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet, // Coinbase Wallet (Smart Wallet mode for better compatibility)
      ],
    },
    {
      groupName: 'More',
      wallets: [
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'Pay First',
    projectId: projectId || 'YOUR_PROJECT_ID',
  }
)

console.log('[wagmi] Connectors created:', connectors.length)

// Create Wagmi config
export const config = createConfig({
  connectors,
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(getBaseRpcUrl()),
    [baseSepolia.id]: http(getBaseSepoliaRpcUrl()),
  },
  ssr: false,
  // Disable auto-connection to prevent MetaMask from auto-popping up
  multiInjectedProviderDiscovery: false,
})

console.log('[wagmi] Configuration created successfully')
console.log('[wagmi] Chains:', [base.name, baseSepolia.name])
console.log('[wagmi] Wallets: MetaMask, Coinbase Wallet (Smart Wallet + Extension), Rainbow, WalletConnect')

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
