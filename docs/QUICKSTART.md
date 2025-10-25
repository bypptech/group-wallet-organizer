# Quick Start Guide - Local Development

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (if not already done)

```bash
pnpm install
```

### 2. Configure Your Environment

The `.env` file has been created for you. You need to update it with your actual credentials:

#### Minimum Required Configuration:

Edit `.env` and update these values:

```env
# 1. Get Neon Database URL from https://console.neon.tech/
DATABASE_URL=postgresql://user:password@your-host.neon.tech/database?sslmode=require
NEON_DATABASE_URL=postgresql://user:password@your-host.neon.tech/database?sslmode=require

# 2. Get Alchemy API Key from https://dashboard.alchemy.com/
VITE_ALCHEMY_API_KEY=your_actual_alchemy_api_key

# 3. Get WalletConnect Project ID from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_actual_walletconnect_project_id
```

#### Optional: Use Mock Mode (No Database Setup)

If you want to start immediately without database setup:

```env
USE_MOCK_DATA=true
```

This will use in-memory mock data instead of a real database.

### 3. Initialize Database (if using real database)

```bash
cd apps/api
pnpm db:push
cd ../..
```

### 4. Start the Development Servers

**Option A: Use the startup script (recommended)**

```bash
./dev-local.sh
```

**Option B: Start manually**

```bash
# Terminal 1 - API Server
cd apps/api
pnpm dev

# Terminal 2 - Web Server
cd apps/web
pnpm dev
```

### 5. Open Your Browser

- **Frontend**: http://localhost:5000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📋 Configuration Checklist

- [ ] `.env` file exists (✅ created for you)
- [ ] Database URL configured (or `USE_MOCK_DATA=true`)
- [ ] Alchemy API key set
- [ ] WalletConnect Project ID set
- [ ] Dependencies installed (`pnpm install`)
- [ ] Database schema pushed (`pnpm db:push`)
- [ ] Servers running

## 🔧 What's Been Set Up

This local development environment is configured to:

✅ Use **localhost API** instead of Cloudflare Workers
✅ Use **Neon PostgreSQL** database (or mock mode)
✅ Run **frontend** on port 5000
✅ Run **API** on port 3001
✅ Use **Base Sepolia** testnet
✅ Support **WalletConnect** for wallet connections

## 🎯 Next Steps

### For Development:

1. **Connect Your Wallet**: Use MetaMask with Base Sepolia network
2. **Get Test ETH**: Use Base Sepolia faucet
3. **Start Building**: The app is ready for development!

### For Smart Contract Deployment:

```bash
# Compile contracts
pnpm compile

# Deploy to local network
pnpm deploy:local

# Deploy to Base Sepolia
pnpm hardhat run scripts/deploy.ts --network baseSepolia
```

## 🛟 Troubleshooting

### Database Connection Fails

**Solution 1**: Use mock mode
```env
USE_MOCK_DATA=true
```

**Solution 2**: Check your Neon database URL format
```
postgresql://user:password@host.neon.tech/database?sslmode=require
```

### API Server Won't Start

**Check**: Port 3001 is available
```bash
lsof -i :3001
```

**Fix**: Kill any process using port 3001
```bash
kill -9 $(lsof -t -i:3001)
```

### Frontend Can't Connect to API

**Check**: API server is running
```bash
curl http://localhost:3001/health
```

**Expected Response**: `{"status":"ok"}`

### Wallet Won't Connect

**Check**:
1. MetaMask is installed and unlocked
2. You're on Base Sepolia network (Chain ID: 84532)
3. `VITE_WALLETCONNECT_PROJECT_ID` is set in `.env`

## 📚 Additional Resources

- **Full Setup Guide**: See `LOCAL_SETUP.md` for detailed instructions
- **API Documentation**: Check `apps/api/README.md`
- **Contract Docs**: See `contracts/README.md`
- **Main README**: Project overview in `README.md`

## 🔑 Environment Variables Reference

### Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | Neon PostgreSQL connection | https://console.neon.tech/ |
| `VITE_ALCHEMY_API_KEY` | Alchemy RPC access | https://dashboard.alchemy.com/ |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect integration | https://cloud.walletconnect.com/ |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_MOCK_DATA` | Use mock data instead of DB | `false` |
| `PORT` | API server port | `3001` |
| `VITE_API_URL` | API endpoint | `http://localhost:3001/api` |

## 💡 Development Tips

### Hot Reload

Both servers support hot reload:
- **Web**: Vite HMR automatically reloads on file changes
- **API**: Hono server restarts on TypeScript file changes

### Database Changes

After modifying the schema:

```bash
cd apps/api
pnpm db:push
```

### Testing

```bash
# Run all tests
pnpm test

# Run API tests
cd apps/api && pnpm test

# Run Web tests
cd apps/web && pnpm test

# Run E2E tests
cd apps/web && pnpm test:e2e
```

## 🎉 You're Ready!

Your local development environment is fully configured and ready to use.

Start coding and enjoy building! 🚀
