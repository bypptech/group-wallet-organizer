/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_DEFAULT_CHAIN_ID?: string
  readonly VITE_TESTNET_CHAIN_ID?: string
  readonly VITE_ALCHEMY_API_KEY?: string
  readonly VITE_RPC_URL?: string
  readonly VITE_ALCHEMY_GAS_POLICY_ID?: string
  readonly VITE_API_URL?: string
  readonly VITE_ESCROW_REGISTRY_ADDRESS?: string
  readonly VITE_POLICY_MANAGER_ADDRESS?: string
  readonly VITE_ROLE_VERIFIER_ADDRESS?: string
  readonly VITE_PAYMASTER_ADDRESS?: string
  readonly VITE_SUBGRAPH_URL?: string
  readonly VITE_SUBGRAPH_API_KEY?: string
  readonly VITE_BUNDLER_RPC_URL?: string
  readonly VITE_PAYMASTER_RPC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
