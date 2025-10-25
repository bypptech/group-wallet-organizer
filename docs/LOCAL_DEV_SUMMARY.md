# Local Development Setup Summary

## ✅ What Has Been Configured

Your local development environment is now fully set up to run without Cloudflare Workers. Here's what has been configured:

### 📁 Files Created

1. **`.env`** - Main environment configuration file
   - Pre-configured with all necessary variables
   - Contains comments explaining where to get each value
   - **⚠️ IMPORTANT**: Update with your actual credentials before starting

2. **`.env.example`** - Template for environment variables
   - Safe to commit to git
   - Reference for setting up new environments

3. **`dev-local.sh`** - Automated startup script
   - Starts both API and Web servers
   - Checks configuration
   - Handles cleanup on exit
   - **Usage**: `./dev-local.sh`

4. **`QUICKSTART.md`** - Fast setup guide
   - 5-minute quick start
   - Minimal configuration steps
   - Troubleshooting tips

5. **`LOCAL_SETUP.md`** - Comprehensive documentation
   - Detailed setup instructions
   - Architecture overview
   - Complete troubleshooting guide

### 🔧 System Configuration

#### API Server (Port 3001)
- **Framework**: Hono on Node.js
- **Entry Point**: `apps/api/src/server-hono.ts`
- **Database**: Neon PostgreSQL (or MOCK mode)
- **Environment Loading**: Reads from root `.env` file
- **Start Command**: `pnpm dev` (from `apps/api`)

#### Web Server (Port 5000)
- **Framework**: Vite + React
- **Entry Point**: `apps/web/src/App.tsx`
- **API Connection**: `http://localhost:3001/api` (default)
- **Environment Loading**: Reads `VITE_*` variables from root `.env`
- **Start Command**: `pnpm dev` (from `apps/web`)

#### Database
- **Provider**: Neon PostgreSQL (Serverless Postgres)
- **Connection**: Direct from Node.js API server
- **Schema Tool**: Drizzle ORM
- **Fallback**: Mock data mode available

### 🌐 Network & Services

#### Blockchain
- **Network**: Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC Provider**: Alchemy
- **Explorer**: https://sepolia.basescan.org/

#### External Services
- **Neon Database**: PostgreSQL serverless database
- **Alchemy**: RPC endpoint provider
- **WalletConnect**: Wallet connection protocol
- **Pimlico** (Optional): Bundler for account abstraction

### 🎯 Key Differences from Production

| Feature | Local Development | Production (Replit/Cloudflare) |
|---------|------------------|-------------------------------|
| API Runtime | Node.js | Cloudflare Workers |
| API Server | Hono dev server (port 3001) | Cloudflare Workers |
| Web Server | Vite dev server (port 5000) | Static hosting |
| Database | Direct Neon connection | Neon via Cloudflare |
| Environment | `.env` file | Replit Secrets/Cloudflare Env Vars |
| Hot Reload | ✅ Enabled | ❌ N/A |

## 🚀 Starting Development

### Quick Start (3 Steps)

1. **Update `.env` with your credentials**
   ```bash
   # Edit .env and add:
   # - DATABASE_URL (from Neon)
   # - VITE_ALCHEMY_API_KEY (from Alchemy)
   # - VITE_WALLETCONNECT_PROJECT_ID (from WalletConnect)
   ```

2. **Initialize database** (if using real DB)
   ```bash
   cd apps/api && pnpm db:push && cd ../..
   ```

3. **Start servers**
   ```bash
   ./dev-local.sh
   ```

### Alternative: Quick Test with Mock Data

If you want to start immediately without configuring services:

1. **Set mock mode in `.env`**
   ```env
   USE_MOCK_DATA=true
   ```

2. **Start servers**
   ```bash
   ./dev-local.sh
   ```

3. **Access**
   - Frontend: http://localhost:5000
   - API: http://localhost:3001

## 📋 Environment Variables Checklist

### Required (for full functionality)

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `NEON_DATABASE_URL` - Same as DATABASE_URL
- [ ] `VITE_ALCHEMY_API_KEY` - Alchemy API key for RPC
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- [ ] `BASE_SEPOLIA_RPC_URL` - Alchemy RPC URL
- [ ] `RPC_URL` - Same as BASE_SEPOLIA_RPC_URL

### Optional (for advanced features)

- [ ] `BUNDLER_URL` - Pimlico bundler for account abstraction
- [ ] `VITE_BUNDLER_RPC_URL` - Same as BUNDLER_URL
- [ ] `VITE_ESCROW_REGISTRY_ADDRESS` - Deployed contract address
- [ ] `VITE_POLICY_MANAGER_ADDRESS` - Deployed contract address
- [ ] `VITE_PAYMASTER_ADDRESS` - Deployed contract address

### Quick Start (mock mode)

- [x] `USE_MOCK_DATA=true` - Use in-memory mock data

## 🔍 Verification

### Check if servers are running:

```bash
# Check API
curl http://localhost:3001/health
# Expected: {"status":"ok"}

# Check Web (open in browser)
open http://localhost:5000
```

### Check environment loading:

```bash
# From apps/api directory
cd apps/api
node -e "require('dotenv').config({path:'../../.env'}); console.log('DB:', process.env.DATABASE_URL?.substring(0,30))"

# From apps/web directory (check Vite env)
cd apps/web
grep VITE_ ../../.env
```

## 🛠 Development Workflow

### Making Changes

1. **Edit code** - Changes are automatically detected
2. **Hot reload** - Browser/server reloads automatically
3. **Test** - Changes visible immediately

### Database Changes

When you modify the database schema:

```bash
cd apps/api
pnpm db:push          # Push changes to database
pnpm db:studio        # Open Drizzle Studio (GUI)
```

### Running Tests

```bash
# All tests
pnpm test

# API tests only
cd apps/api && pnpm test

# Web tests only
cd apps/web && pnpm test

# E2E tests
cd apps/web && pnpm test:e2e
```

## 📚 Additional Resources

### Getting API Keys

1. **Neon Database**
   - Sign up: https://console.neon.tech/
   - Create a new project
   - Copy connection string from dashboard

2. **Alchemy**
   - Sign up: https://dashboard.alchemy.com/
   - Create a new app (Base Sepolia)
   - Copy API key

3. **WalletConnect**
   - Sign up: https://cloud.walletconnect.com/
   - Create a new project
   - Copy Project ID

4. **Pimlico** (Optional)
   - Sign up: https://dashboard.pimlico.io/
   - Create API key
   - Use for bundler/paymaster

### Helpful Commands

```bash
# Check ports
lsof -i :3001  # API port
lsof -i :5000  # Web port

# Kill processes if ports are in use
kill -9 $(lsof -t -i:3001)
kill -9 $(lsof -t -i:5000)

# View logs
cd apps/api && pnpm dev    # API logs
cd apps/web && pnpm dev    # Web logs

# Database management
cd apps/api
pnpm db:studio             # Open GUI
pnpm db:push              # Push schema changes
pnpm db:migrate           # Run migrations
```

## 🐛 Common Issues & Solutions

### Issue: Database Connection Fails

**Solution 1**: Use mock mode
```env
USE_MOCK_DATA=true
```

**Solution 2**: Verify DATABASE_URL format
```
postgresql://user:password@host.neon.tech/db?sslmode=require
```

**Solution 3**: Check Neon IP allowlist

### Issue: Port Already in Use

```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Issue: VITE_ variables not loading

**Cause**: Vite only loads variables with `VITE_` prefix

**Solution**: Ensure web-facing variables start with `VITE_`

### Issue: Hot reload not working

**Solution**: Restart dev server
```bash
# Kill servers (Ctrl+C)
# Restart
./dev-local.sh
```

## ✅ You're All Set!

Your local development environment is configured and ready. The application will:

- ✅ Run API on `localhost:3001`
- ✅ Run Web on `localhost:5000`
- ✅ Connect to Neon database (or use mock data)
- ✅ Use Base Sepolia testnet
- ✅ Support wallet connections via WalletConnect
- ✅ Hot reload on code changes

**Start developing**: `./dev-local.sh`

**Need help?** Check `QUICKSTART.md` or `LOCAL_SETUP.md`

Happy coding! 🚀
