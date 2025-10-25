const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Deploying final contracts...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // Deploy GuardianModule with proxy
  console.log('1. Deploying GuardianModule (Upgradeable with UUPS Proxy)...');
  const GuardianModule = await hre.ethers.getContractFactory('GuardianModule');
  const guardianModule = await hre.upgrades.deployProxy(
    GuardianModule,
    [
      deployer.address, // admin
      '0x636b998315e77408806CccFCC93af4D1179afc2f', // escrowRegistry
      '0xE903dc0061212Abd78668d81a8c5F02C603Dc19E', // policyManager
      [deployer.address], // initialGuardians
      1 // guardianThreshold
    ],
    { kind: 'uups' }
  );
  await guardianModule.waitForDeployment();

  const guardianModuleAddress = await guardianModule.getAddress();
  console.log('   ✅ GuardianModule deployed to:', guardianModuleAddress, '\n');

  // Deploy ERC20Paymaster with proxy
  console.log('2. Deploying ERC20Paymaster (Upgradeable with UUPS Proxy)...');
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
  console.log('Final Deployment Summary');
  console.log('='.repeat(70));

  const addresses = {
    network: 'baseSepolia',
    chainId: 84532,
    contracts: {
      EscrowRegistry: '0x636b998315e77408806CccFCC93af4D1179afc2f',
      PolicyManager: '0xE903dc0061212Abd78668d81a8c5F02C603Dc19E',
      RoleVerifier: '0xA68B80144d3291D5b53cE8C62c306fE195668d60',
      GuardianModule: guardianModuleAddress,
      ERC20Paymaster: erc20PaymasterAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  Object.entries(addresses.contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log('='.repeat(70), '\n');

  // Save addresses to file
  const outputPath = 'deployments/base-sepolia.json';
  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log('✅ Deployment info saved to:', outputPath, '\n');

  console.log('📝 Update these addresses in apps/web/src/lib/contracts.ts\n');

  console.log('🔍 Verify contracts on Basescan:');
  console.log(`  npx hardhat verify --network baseSepolia ${addresses.contracts.EscrowRegistry}`);
  console.log(`  npx hardhat verify --network baseSepolia ${addresses.contracts.PolicyManager}`);
  console.log(`  npx hardhat verify --network baseSepolia ${addresses.contracts.RoleVerifier}`);
  console.log(`  npx hardhat verify --network baseSepolia ${addresses.contracts.GuardianModule}`);
  console.log(`  npx hardhat verify --network baseSepolia ${addresses.contracts.ERC20Paymaster}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
