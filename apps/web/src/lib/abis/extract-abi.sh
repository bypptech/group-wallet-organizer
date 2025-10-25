#!/bin/bash
# Extract ABI from artifacts and copy to frontend

echo "Extracting ABIs..."

# EscrowRegistry
jq '.abi' ../../artifacts/contracts/EscrowRegistry.sol/EscrowRegistry.json > apps/web/src/lib/abis/EscrowRegistry.json

# PolicyManager
jq '.abi' ../../artifacts/contracts/modules/PolicyManager.sol/PolicyManager.json > apps/web/src/lib/abis/PolicyManager.json

# RoleVerifier
jq '.abi' ../../artifacts/contracts/modules/RoleVerifier.sol/RoleVerifier.json > apps/web/src/lib/abis/RoleVerifier.json

echo "ABIs extracted successfully!"
