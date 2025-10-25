const hre = require('hardhat');

async function main() {
  // EscrowRegistry proxy deployment transaction
  const txHash = '0xf8136c36f6ee888960a3cbb6e39f07eae78bc824c53ced3162965a7a485dc697';

  const tx = await hre.ethers.provider.getTransaction(txHash);
  if (tx && tx.blockNumber) {
    console.log('EscrowRegistry deployed at block:', tx.blockNumber);
  } else {
    console.log('Transaction not found or pending');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
