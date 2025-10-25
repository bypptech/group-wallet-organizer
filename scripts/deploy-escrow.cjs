const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Deploying EscrowRegistry contract...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // Deploy EscrowRegistry with proxy
  console.log('1. Deploying EscrowRegistry (Upgradeable with UUPS Proxy)...');
  const EscrowRegistry = await hre.ethers.getContractFactory('EscrowRegistry');
  const escrowRegistry = await hre.upgrades.deployProxy(
    EscrowRegistry,
    [deployer.address],
    { kind: 'uups' }
  );
  await escrowRegistry.waitForDeployment();

  const escrowRegistryAddress = await escrowRegistry.getAddress();
  console.log('   ✅ EscrowRegistry deployed to:', escrowRegistryAddress, '\n');

  // Deploy PolicyManager with proxy
  console.log('2. Deploying PolicyManager (Upgradeable with UUPS Proxy)...');
  const PolicyManager = await hre.ethers.getContractFactory('PolicyManager');
  const policyManager = await hre.upgrades.deployProxy(
    PolicyManager,
    [deployer.address],
    { kind: 'uups' }
  );
  await policyManager.waitForDeployment();

  const policyManagerAddress = await policyManager.getAddress();
  console.log('   ✅ PolicyManager deployed to:', policyManagerAddress, '\n');

  // Deploy RoleVerifier
  console.log('3. Deploying RoleVerifier...');
  const RoleVerifier = await hre.ethers.getContractFactory('RoleVerifier');
  const roleVerifier = await RoleVerifier.deploy();
  await roleVerifier.waitForDeployment();

  const roleVerifierAddress = await roleVerifier.getAddress();
  console.log('   ✅ RoleVerifier deployed to:', roleVerifierAddress, '\n');

  // Deploy GuardianModule with proxy
  console.log('4. Deploying GuardianModule (Upgradeable with UUPS Proxy)...');
  const GuardianModule = await hre.ethers.getContractFactory('GuardianModule');
  const guardianModule = await hre.upgrades.deployProxy(
    GuardianModule,
    [deployer.address],
    { kind: 'uups' }
  );
  await guardianModule.waitForDeployment();

  const guardianModuleAddress = await guardianModule.getAddress();
  console.log('   ✅ GuardianModule deployed to:', guardianModuleAddress, '\n');

  // Deploy ERC20Paymaster with proxy
  console.log('5. Deploying ERC20Paymaster (Upgradeable with UUPS Proxy)...');
  const ERC20Paymaster = await hre.ethers.getContractFactory('ERC20Paymaster');
  const erc20Paymaster = await hre.upgrades.deployProxy(
    ERC20Paymaster,
    [deployer.address, deployer.address],
    { kind: 'uups' }
  );
  await erc20Paymaster.waitForDeployment();

  const erc20PaymasterAddress = await erc20Paymaster.getAddress();
  console.log('   ✅ ERC20Paymaster deployed to:', erc20PaymasterAddress, '\n');

  // Summary
  console.log('='.repeat(70));
  console.log('Deployment Summary');
  console.log('='.repeat(70));
  console.log('EscrowRegistry:', escrowRegistryAddress);
  console.log('PolicyManager:', policyManagerAddress);
  console.log('RoleVerifier:', roleVerifierAddress);
  console.log('GuardianModule:', guardianModuleAddress);
  console.log('ERC20Paymaster:', erc20PaymasterAddress);
  console.log('='.repeat(70), '\n');

  // Save addresses to file
  const addresses = {
    network: 'baseSepolia',
    chainId: 84532,
    contracts: {
      EscrowRegistry: escrowRegistryAddress,
      PolicyManager: policyManagerAddress,
      RoleVerifier: roleVerifierAddress,
      GuardianModule: guardianModuleAddress,
      ERC20Paymaster: erc20PaymasterAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const outputPath = 'deployments/base-sepolia.json';
  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log('✅ Deployment info saved to:', outputPath, '\n');

  console.log('📝 Update these addresses in apps/web/src/lib/contracts.ts:');
  console.log(`
export const ESCROW_REGISTRY_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as \`0x\${string}\`,
  [baseSepolia.id]: '${escrowRegistryAddress}' as \`0x\${string}\`,
} as const

export const POLICY_MANAGER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as \`0x\${string}\`,
  [baseSepolia.id]: '${policyManagerAddress}' as \`0x\${string}\`,
} as const

export const ROLE_VERIFIER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as \`0x\${string}\`,
  [baseSepolia.id]: '${roleVerifierAddress}' as \`0x\${string}\`,
} as const

export const GUARDIAN_MODULE_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as \`0x\${string}\`,
  [baseSepolia.id]: '${guardianModuleAddress}' as \`0x\${string}\`,
} as const

export const ERC20_PAYMASTER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as \`0x\${string}\`,
  [baseSepolia.id]: '${erc20PaymasterAddress}' as \`0x\${string}\`,
} as const
  `);

  console.log('\n🔍 Verify contracts on Basescan:');
  console.log(`   npx hardhat verify --network baseSepolia ${escrowRegistryAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${policyManagerAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${roleVerifierAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${guardianModuleAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${erc20PaymasterAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
