#!/bin/bash

# Smart Contract Deployment Script for Base Sepolia

echo "================================================"
echo "Smart Contract Deployment to Base Sepolia"
echo "================================================"
echo ""

# Check environment variables
if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY environment variable not set"
  echo "Please set it in .env file or export it:"
  echo "  export PRIVATE_KEY=your_private_key"
  exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
  echo "⚠️  Warning: BASE_SEPOLIA_RPC_URL not set, using default"
  export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
fi

echo "📋 Deployment Configuration:"
echo "   Network: Base Sepolia (Chain ID: 84532)"
echo "   RPC: $BASE_SEPOLIA_RPC_URL"
echo ""

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile

if [ $? -ne 0 ]; then
  echo "❌ Compilation failed"
  exit 1
fi

echo "✅ Compilation successful"
echo ""

# Deploy contracts
echo "🚀 Deploying contracts to Base Sepolia..."
echo ""

# Run deployment script
npx hardhat run scripts/deploy-escrow.cjs --network baseSepolia

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Update contract addresses in apps/web/src/lib/contracts.ts"
echo "   2. Verify contracts on Basescan"
echo "   3. Test contract interactions from frontend"
echo ""
