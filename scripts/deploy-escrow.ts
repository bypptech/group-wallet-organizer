import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying EscrowRegistry contract...\n')

  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n')

  // Deploy EscrowRegistry
  console.log('1. Deploying EscrowRegistry (Upgradeable)...')
  const EscrowRegistry = await ethers.getContractFactory('EscrowRegistry')
  const escrowRegistry = await EscrowRegistry.deploy()
  await escrowRegistry.waitForDeployment()
  
  const escrowRegistryAddress = await escrowRegistry.getAddress()
  console.log('   ✅ EscrowRegistry deployed to:', escrowRegistryAddress)

  // Initialize
  console.log('   Initializing EscrowRegistry...')
  const initTx = await escrowRegistry.initialize(deployer.address)
  await initTx.wait()
  console.log('   ✅ EscrowRegistry initialized\n')

  // Deploy PolicyManager
  console.log('2. Deploying PolicyManager...')
  const PolicyManager = await ethers.getContractFactory('PolicyManager')
  const policyManager = await PolicyManager.deploy()
  await policyManager.waitForDeployment()
  
  const policyManagerAddress = await policyManager.getAddress()
  console.log('   ✅ PolicyManager deployed to:', policyManagerAddress)

  // Initialize PolicyManager
  console.log('   Initializing PolicyManager...')
  const initPolicyTx = await policyManager.initialize(deployer.address)
  await initPolicyTx.wait()
  console.log('   ✅ PolicyManager initialized\n')

  // Deploy RoleVerifier
  console.log('3. Deploying RoleVerifier...')
  const RoleVerifier = await ethers.getContractFactory('RoleVerifier')
  const roleVerifier = await RoleVerifier.deploy()
  await roleVerifier.waitForDeployment()

  const roleVerifierAddress = await roleVerifier.getAddress()
  console.log('   ✅ RoleVerifier deployed to:', roleVerifierAddress, '\n')

  // Deploy GuardianModule
  console.log('4. Deploying GuardianModule...')
  const GuardianModule = await ethers.getContractFactory('GuardianModule')
  const guardianModule = await GuardianModule.deploy()
  await guardianModule.waitForDeployment()

  const guardianModuleAddress = await guardianModule.getAddress()
  console.log('   ✅ GuardianModule deployed to:', guardianModuleAddress)

  // Initialize GuardianModule
  console.log('   Initializing GuardianModule...')
  const initGuardianTx = await guardianModule.initialize(deployer.address)
  await initGuardianTx.wait()
  console.log('   ✅ GuardianModule initialized\n')

  // Deploy ERC20Paymaster
  console.log('5. Deploying ERC20Paymaster...')
  const ERC20Paymaster = await ethers.getContractFactory('ERC20Paymaster')
  const erc20Paymaster = await ERC20Paymaster.deploy()
  await erc20Paymaster.waitForDeployment()

  const erc20PaymasterAddress = await erc20Paymaster.getAddress()
  console.log('   ✅ ERC20Paymaster deployed to:', erc20PaymasterAddress)

  // Initialize ERC20Paymaster (using deployer as temporary entryPoint)
  console.log('   Initializing ERC20Paymaster...')
  const initPaymasterTx = await erc20Paymaster.initialize(deployer.address, deployer.address)
  await initPaymasterTx.wait()
  console.log('   ✅ ERC20Paymaster initialized\n')

  // Summary
  console.log('='.repeat(70))
  console.log('Deployment Summary')
  console.log('='.repeat(70))
  console.log('EscrowRegistry:', escrowRegistryAddress)
  console.log('PolicyManager:', policyManagerAddress)
  console.log('RoleVerifier:', roleVerifierAddress)
  console.log('GuardianModule:', guardianModuleAddress)
  console.log('ERC20Paymaster:', erc20PaymasterAddress)
  console.log('='.repeat(70), '\n')

  // Save addresses to file
  const fs = require('fs')
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
  }

  const outputPath = 'deployments/base-sepolia.json'
  fs.mkdirSync('deployments', { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2))
  console.log('✅ Deployment info saved to:', outputPath, '\n')

  console.log('📝 Update these addresses in apps/web/src/lib/contracts.ts:')
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
  `)

  console.log('\n🔍 Verify contracts on Basescan:')
  console.log(`   npx hardhat verify --network baseSepolia ${escrowRegistryAddress}`)
  console.log(`   npx hardhat verify --network baseSepolia ${policyManagerAddress}`)
  console.log(`   npx hardhat verify --network baseSepolia ${roleVerifierAddress}`)
  console.log(`   npx hardhat verify --network baseSepolia ${guardianModuleAddress}`)
  console.log(`   npx hardhat verify --network baseSepolia ${erc20PaymasterAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
