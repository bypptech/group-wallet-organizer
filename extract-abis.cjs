const fs = require('fs');
const path = require('path');

const contracts = [
  {
    artifact: 'artifacts/contracts/EscrowRegistry.sol/EscrowRegistry.json',
    output: 'apps/web/src/lib/abis/EscrowRegistry.json'
  },
  {
    artifact: 'artifacts/contracts/modules/PolicyManager.sol/PolicyManager.json',
    output: 'apps/web/src/lib/abis/PolicyManager.json'
  },
  {
    artifact: 'artifacts/contracts/modules/RoleVerifier.sol/RoleVerifier.json',
    output: 'apps/web/src/lib/abis/RoleVerifier.json'
  }
];

contracts.forEach(({ artifact, output }) => {
  const data = JSON.parse(fs.readFileSync(artifact, 'utf8'));
  fs.writeFileSync(output, JSON.stringify(data.abi, null, 2));
  const filename = path.basename(output);
  console.log('Extracted ' + filename);
});

console.log('All ABIs extracted successfully!');
