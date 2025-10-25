import { base, baseSepolia } from 'wagmi/chains'
import EscrowRegistryABI from './abis/EscrowRegistry.json'
import PolicyManagerABI from './abis/PolicyManager.json'
import RoleVerifierABI from './abis/RoleVerifier.json'
import FamilyWalletABI from './abis/FamilyWallet.json'
import FamilyWalletFactoryABI from './abis/FamilyWalletFactory.json'

/**
 * Contract addresses by chain
 * Deployed on Base Sepolia: 2025-10-04
 */
export const ESCROW_REGISTRY_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '0x636b998315e77408806CccFCC93af4D1179afc2f' as `0x${string}`,
} as const

export const POLICY_MANAGER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '0xE903dc0061212Abd78668d81a8c5F02C603Dc19E' as `0x${string}`,
} as const

export const ROLE_VERIFIER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '0xA68B80144d3291D5b53cE8C62c306fE195668d60' as `0x${string}`,
} as const

export const GUARDIAN_MODULE_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '0x18e89214CB9ED4bC16362b158C5D0E35d87c7828' as `0x${string}`,
} as const

export const ERC20_PAYMASTER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '0xb4F5880bbAD08803dc9F473b427b1Bc385431D16' as `0x${string}`,
} as const

export const VAULT_FACTORY_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy to Base
  [baseSepolia.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy to Base Sepolia
} as const

/**
 * Contract ABIs
 */
export const escrowRegistryABI = EscrowRegistryABI as const
export const policyManagerABI = PolicyManagerABI as const
export const roleVerifierABI = RoleVerifierABI as const
export const familyWalletABI = FamilyWalletABI as const
export const familyWalletFactoryABI = FamilyWalletFactoryABI as const

export const FAMILY_WALLET_FACTORY_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '0x636b998315e77408806CccFCC93af4D1179afc2f' as `0x${string}`,
} as const

/**
 * USDC Token Address (for Shareable Keys payment)
 */
export const USDC_ADDRESS = {
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // Base Mainnet USDC
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`, // Base Sepolia USDC
} as const

/**
 * ERC20 ABI (minimal - for USDC operations)
 */
export const erc20ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/**
 * Contract configuration helper
 */
export const getContractAddress = (
  contract: 'escrowRegistry' | 'policyManager' | 'roleVerifier' | 'guardianModule' | 'erc20Paymaster' | 'vaultFactory' | 'familyWalletFactory' | 'usdc',
  chainId: number
): `0x${string}` => {
  switch (contract) {
    case 'escrowRegistry':
      return ESCROW_REGISTRY_ADDRESS[chainId as keyof typeof ESCROW_REGISTRY_ADDRESS] || ESCROW_REGISTRY_ADDRESS[baseSepolia.id]
    case 'policyManager':
      return POLICY_MANAGER_ADDRESS[chainId as keyof typeof POLICY_MANAGER_ADDRESS] || POLICY_MANAGER_ADDRESS[baseSepolia.id]
    case 'roleVerifier':
      return ROLE_VERIFIER_ADDRESS[chainId as keyof typeof ROLE_VERIFIER_ADDRESS] || ROLE_VERIFIER_ADDRESS[baseSepolia.id]
    case 'guardianModule':
      return GUARDIAN_MODULE_ADDRESS[chainId as keyof typeof GUARDIAN_MODULE_ADDRESS] || GUARDIAN_MODULE_ADDRESS[baseSepolia.id]
    case 'erc20Paymaster':
      return ERC20_PAYMASTER_ADDRESS[chainId as keyof typeof ERC20_PAYMASTER_ADDRESS] || ERC20_PAYMASTER_ADDRESS[baseSepolia.id]
    case 'vaultFactory':
      return VAULT_FACTORY_ADDRESS[chainId as keyof typeof VAULT_FACTORY_ADDRESS] || VAULT_FACTORY_ADDRESS[baseSepolia.id]
    case 'familyWalletFactory':
      return FAMILY_WALLET_FACTORY_ADDRESS[chainId as keyof typeof FAMILY_WALLET_FACTORY_ADDRESS] || FAMILY_WALLET_FACTORY_ADDRESS[baseSepolia.id]
    case 'usdc':
      return USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS] || USDC_ADDRESS[baseSepolia.id]
  }
}

/**
 * Contract constants
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const

/**
 * Escrow types
 */
export enum EscrowType {
  ALLOWANCE = 0,
  BILL_PAYMENT = 1,
  GIFT = 2,
  REIMBURSEMENT = 3,
  OTHER = 4
}

/**
 * Approval types
 */
export enum ApprovalType {
  ASYNC = 0,
  SYNC = 1
}

/**
 * Escrow states
 */
export enum EscrowState {
  DRAFT = 0,
  PENDING = 1,
  APPROVED = 2,
  READY = 3,
  RELEASED = 4,
  CANCELLED = 5,
  EXPIRED = 6
}

/**
 * Role types (matches RoleVerifier.sol)
 */
export enum Role {
  NONE = 0,
  VIEWER = 1,
  APPROVER = 2,
  ADMIN = 3,
  GUARDIAN = 4
}
