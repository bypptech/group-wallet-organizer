import { ethers } from "hardhat";

async function main() {
  const Example = await ethers.getContractFactory("Example");
  const example = await Example.deploy();
  await example.waitForDeployment();
  console.log("Example deployed to:", await example.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

