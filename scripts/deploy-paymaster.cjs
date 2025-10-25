const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Deploying ERC20Paymaster...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // Deploy ERC20Paymaster with proxy
  console.log('Deploying ERC20Paymaster (Upgradeable with UUPS Proxy)...');
  const ERC20Paymaster = await hre.ethers.getContractFactory('ERC20Paymaster');
  const erc20Paymaster = await hre.upgrades.deployProxy(
    ERC20Paymaster,
    [
      deployer.address, // entryPoint
      deployer.address, // admin
      hre.ethers.parseEther('1') // dailySpendLimit (1 ETH)
    ],
    { kind: 'uups' }
  );
  await erc20Paymaster.waitForDeployment();

  const erc20PaymasterAddress = await erc20Paymaster.getAddress();
  console.log('✅ ERC20Paymaster deployed to:', erc20PaymasterAddress, '\n');

  // Summary
  const addresses = {
    network: 'baseSepolia',
    chainId: 84532,
    contracts: {
      EscrowRegistry: '0x636b998315e77408806CccFCC93af4D1179afc2f',
      PolicyManager: '0xE903dc0061212Abd78668d81a8c5F02C603Dc19E',
      RoleVerifier: '0xA68B80144d3291D5b53cE8C62c306fE195668d60',
      GuardianModule: '0x18e89214CB9ED4bC16362b158C5D0E35d87c7828',
      ERC20Paymaster: erc20PaymasterAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log('='.repeat(70));
  console.log('All Deployed Contracts');
  console.log('='.repeat(70));
  Object.entries(addresses.contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log('='.repeat(70), '\n');

  // Save addresses to file
  const outputPath = 'deployments/base-sepolia.json';
  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log('✅ Deployment info saved to:', outputPath, '\n');

  console.log('📝 Update addresses in apps/web/src/lib/contracts.ts\n');

  console.log('🔍 Verify contracts on Basescan:');
  Object.entries(addresses.contracts).forEach(([name, address]) => {
    console.log(`  npx hardhat verify --network baseSepolia ${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
