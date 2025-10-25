# Local Development Setup Guide

This guide will help you set up the Family Wallet application for local development without using Cloudflare Workers.

## Prerequisites

- Node.js 20.x or higher
- pnpm package manager
- Neon PostgreSQL account (https://console.neon.tech/)
- Alchemy account for RPC access (https://dashboard.alchemy.com/)
- WalletConnect Project ID (https://cloud.walletconnect.com/)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` and configure the following required variables:

#### Required for Basic Functionality:

```env
# Neon Database URL (get from https://console.neon.tech/)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
NEON_DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Alchemy API Key (get from https://dashboard.alchemy.com/)
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your_alchemy_api_key
RPC_URL=https://base-sepolia.g.alchemy.com/v2/your_alchemy_api_key

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

#### Optional (for advanced features):

```env
# Pimlico Bundler (for account abstraction)
BUNDLER_URL=https://api.pimlico.io/v2/84532/rpc?apikey=your_pimlico_api_key
VITE_BUNDLER_RPC_URL=https://api.pimlico.io/v2/84532/rpc?apikey=your_pimlico_api_key

# Smart Contract Addresses (after deployment)
VITE_ESCROW_REGISTRY_ADDRESS=0x...
VITE_POLICY_MANAGER_ADDRESS=0x...
VITE_PAYMASTER_ADDRESS=0x...
```

### 3. Set Up Database

Initialize your Neon database schema:

```bash
cd apps/api
pnpm db:push
```

### 4. Start Development Servers

Use the provided startup script to run both API and Web servers:

```bash
./dev-local.sh
```

Or start them manually:

```bash
# Terminal 1 - API Server
cd apps/api
pnpm dev

# Terminal 2 - Web Server
cd apps/web
pnpm dev
```

## Access the Application

- **Web Frontend**: http://localhost:5000
- **API Backend**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## Development Mode Options

### Using Mock Data (No Database Required)

If you want to develop without setting up a database, you can use mock data mode:

```env
USE_MOCK_DATA=true
```

This is useful for:
- Quick prototyping
- Frontend development
- Testing UI components

### Local vs Production API

The application is configured to use `localhost:3001` by default. The code automatically falls back to this when `VITE_API_URL` is not set:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Frontend   │         │   Backend    │                  │
│  │   (Vite)     │────────▶│   (Hono)     │                  │
│  │ Port: 5000   │         │ Port: 3001   │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                           │
│                                   ▼                           │
│                          ┌─────────────────┐                 │
│                          │  Neon Database  │                 │
│                          │   (PostgreSQL)  │                 │
│                          └─────────────────┘                 │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  External Services                                      │ │
│  │  - Alchemy RPC (Base Sepolia)                          │ │
│  │  - WalletConnect                                        │ │
│  │  - Pimlico Bundler (optional)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences from Production

| Aspect | Local Development | Production (Replit/Cloudflare) |
|--------|------------------|-------------------------------|
| API Server | Hono on Node.js (port 3001) | Cloudflare Workers |
| Web Server | Vite Dev Server (port 5000) | Static files |
| Database | Direct Neon connection | Neon via Cloudflare |
| Environment | .env file | Replit Secrets/Cloudflare Env |

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Check if your IP is allowed in Neon's firewall settings
3. Try enabling mock mode: `USE_MOCK_DATA=true`

### API Not Connecting

If the frontend can't connect to the API:

1. Verify the API server is running on port 3001
2. Check for CORS errors in browser console
3. Ensure `WEB_ORIGIN=http://localhost:5000` in .env

### Wallet Connection Issues

If you can't connect your wallet:

1. Verify `VITE_WALLETCONNECT_PROJECT_ID` is set
2. Check if you're on the correct network (Base Sepolia)
3. Ensure MetaMask is installed and unlocked

## Available Scripts

### Root Level

```bash
pnpm dev              # Start both API and Web servers
pnpm dev:api          # Start only API server
pnpm dev:web          # Start only Web server
pnpm build            # Build all packages
pnpm test             # Run all tests
```

### API (apps/api)

```bash
pnpm dev              # Start API server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

### Web (apps/web)

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
```

## Next Steps

1. **Deploy Smart Contracts**: Follow the contract deployment guide to deploy escrow contracts to Base Sepolia
2. **Configure Contract Addresses**: Update `.env` with deployed contract addresses
3. **Set Up Subgraph**: Configure The Graph indexer for efficient data querying
4. **Enable Account Abstraction**: Set up Pimlico bundler and paymaster

## Need Help?

- Check the main README.md for general project information
- Review the API documentation in `apps/api/README.md`
- See contract documentation in `contracts/README.md`
- Open an issue on GitHub for bugs or questions

## Production Deployment

When you're ready to deploy to production:

1. Use `pnpm build:api` to build for Cloudflare Workers
2. Use `pnpm deploy:cloudflare` to deploy the API
3. Use Vercel or similar for frontend deployment
4. Ensure all environment variables are set in production
