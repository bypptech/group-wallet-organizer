const hre = require('hardhat');

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const nonce = await hre.ethers.provider.getTransactionCount(signer.address);
  console.log('Current nonce:', nonce);

  const pendingNonce = await hre.ethers.provider.getTransactionCount(signer.address, 'pending');
  console.log('Pending nonce:', pendingNonce);

  const feeData = await hre.ethers.provider.getFeeData();
  console.log('Gas price:', hre.ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'), 'gwei');
  console.log('MaxFeePerGas:', hre.ethers.formatUnits(feeData.maxFeePerGas || 0n, 'gwei'), 'gwei');
  console.log('MaxPriorityFeePerGas:', hre.ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, 'gwei'), 'gwei');
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
