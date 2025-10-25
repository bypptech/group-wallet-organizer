/**
 * WalletConnect Configuration for Family Wallet Mobile
 */

import '@walletconnect/react-native-compat';
import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// WalletConnect Project ID (Get from https://cloud.walletconnect.com/)
const PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// WalletConnect Core instance
let core: Core;
let web3wallet: IWeb3Wallet;

/**
 * Initialize WalletConnect Web3Wallet
 */
export async function initializeWalletConnect(): Promise<IWeb3Wallet> {
  if (web3wallet) {
    return web3wallet;
  }

  // Initialize Core
  core = new Core({
    projectId: PROJECT_ID,
  });

  // Initialize Web3Wallet
  web3wallet = await Web3Wallet.init({
    core,
    metadata: {
      name: 'Family Wallet',
      description: 'Multi-signature shared wallet for families',
      url: 'https://familywallet.app',
      icons: ['https://familywallet.app/icon.png'],
    },
  });

  // Set up event listeners
  setupEventListeners();

  return web3wallet;
}

/**
 * Setup WalletConnect event listeners
 */
function setupEventListeners() {
  if (!web3wallet) return;

  // Session proposal event
  web3wallet.on('session_proposal', async (proposal) => {
    console.log('Session proposal received:', proposal);

    // Auto-approve for Family Wallet dApp
    // In production, show approval UI to user
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        eip155: {
          chains: ['eip155:84532'], // Base Sepolia
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          events: ['chainChanged', 'accountsChanged'],
          accounts: [
            'eip155:84532:0x0000000000000000000000000000000000000000', // Replace with actual account
          ],
        },
      },
    });

    const session = await web3wallet.approveSession({
      id: proposal.id,
      namespaces: approvedNamespaces,
    });

    console.log('Session approved:', session);
  });

  // Session request event
  web3wallet.on('session_request', async (event) => {
    console.log('Session request received:', event);

    const { topic, params, id } = event;
    const { request } = params;

    // Handle different request methods
    switch (request.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        // Show transaction approval UI
        // For now, reject
        await web3wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: getSdkError('USER_REJECTED'),
          },
        });
        break;

      case 'personal_sign':
      case 'eth_sign':
      case 'eth_signTypedData':
        // Show signature approval UI
        // For now, reject
        await web3wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: getSdkError('USER_REJECTED'),
          },
        });
        break;

      default:
        await web3wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: getSdkError('UNSUPPORTED_METHODS'),
          },
        });
    }
  });

  // Session delete event
  web3wallet.on('session_delete', (event) => {
    console.log('Session deleted:', event);
  });
}

/**
 * Pair with dApp using URI
 */
export async function pairWithUri(uri: string): Promise<void> {
  if (!web3wallet) {
    await initializeWalletConnect();
  }

  await web3wallet.core.pairing.pair({ uri });
}

/**
 * Get all active sessions
 */
export function getActiveSessions() {
  if (!web3wallet) {
    return {};
  }

  return web3wallet.getActiveSessions();
}

/**
 * Disconnect a session
 */
export async function disconnectSession(topic: string): Promise<void> {
  if (!web3wallet) {
    throw new Error('WalletConnect not initialized');
  }

  await web3wallet.disconnectSession({
    topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}

/**
 * Get WalletConnect instance
 */
export function getWeb3Wallet(): IWeb3Wallet | null {
  return web3wallet || null;
}
