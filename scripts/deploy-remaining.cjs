const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Deploying remaining contracts...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // Get current nonce
  const currentNonce = await hre.ethers.provider.getTransactionCount(deployer.address);
  console.log('Current nonce:', currentNonce, '\n');

  // Deploy RoleVerifier
  console.log('1. Deploying RoleVerifier...');
  const RoleVerifier = await hre.ethers.getContractFactory('RoleVerifier');
  const roleVerifier = await RoleVerifier.deploy({ nonce: currentNonce });
  await roleVerifier.waitForDeployment();

  const roleVerifierAddress = await roleVerifier.getAddress();
  console.log('   ✅ RoleVerifier deployed to:', roleVerifierAddress, '\n');

  // Deploy GuardianModule with proxy
  console.log('2. Deploying GuardianModule (Upgradeable with UUPS Proxy)...');
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
  console.log('3. Deploying ERC20Paymaster (Upgradeable with UUPS Proxy)...');
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
  console.log('RoleVerifier:', roleVerifierAddress);
  console.log('GuardianModule:', guardianModuleAddress);
  console.log('ERC20Paymaster:', erc20PaymasterAddress);
  console.log('='.repeat(70), '\n');

  // Save addresses to file
  const addresses = {
    network: 'baseSepolia',
    chainId: 84532,
    contracts: {
      EscrowRegistry: '0x636b998315e77408806CccFCC93af4D1179afc2f', // From previous deploy
      PolicyManager: '0xE903dc0061212Abd78668d81a8c5F02C603Dc19E',   // From previous deploy
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

  console.log('📝 All contract addresses:');
  console.log(`  EscrowRegistry: ${addresses.contracts.EscrowRegistry}`);
  console.log(`  PolicyManager: ${addresses.contracts.PolicyManager}`);
  console.log(`  RoleVerifier: ${addresses.contracts.RoleVerifier}`);
  console.log(`  GuardianModule: ${addresses.contracts.GuardianModule}`);
  console.log(`  ERC20Paymaster: ${addresses.contracts.ERC20Paymaster}`);

  console.log('\n🔍 Verify contracts on Basescan:');
  Object.entries(addresses.contracts).forEach(([name, address]) => {
    console.log(`   npx hardhat verify --network baseSepolia ${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
