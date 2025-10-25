## A Multi-Signature Wallet Management System on Base Network

This wallet is a wallet application that enables families and groups to securely manage funds with escrow control through multiple approvers. It leverages Account Abstraction (ERC-4337) to provide gasless transactions and flexible policy management.

## Features

- **Multi-Signature Support**: Secure fund management with multiple approvers
- **Gasless Transactions**: Seamless UX through Account Abstraction (ERC-4337)
- **Flexible Access Control**: Role-based permission management (Owner/Admin/Member)
- **Multi-Chain**: Support for Base Sepolia and Ethereum Sepolia
- **Demo Mode**: Experience features without wallet connection

## Main Features

### Group Wallet Management
- Share wallets with multiple members
- Role-based access control (Owner/Admin/Member)
- Member addition and removal functionality

### Escrow Management
- Multi-signature payment approval flow
- Custom policy settings (amount limits, number of approvers, etc.)
- Real-time approval status tracking
- Communication through comment functionality

### Share Keys
- Secure key sharing among group members
- CAIP-10 format address management
- Demo mode support

### Account Abstraction
- Gasless transactions with Paymaster support
- Customizable signature verification
- Efficient transaction submission via Bundler

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.x or higher
- PostgreSQL (or Neon)

