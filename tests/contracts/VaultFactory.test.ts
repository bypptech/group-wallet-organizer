import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultFactory } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ZeroAddress } from "ethers";

describe("VaultFactory", function () {
  let vaultFactory: VaultFactory;
  let admin: SignerWithAddress;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let vaultImplementation: string;

  // Sample UUID (16 bytes as bytes16)
  const sampleUUID = "0x123456789abcdef0123456789abcdef0"; // 32 hex chars = 16 bytes

  beforeEach(async function () {
    [admin, owner, user1] = await ethers.getSigners();

    // Deploy a mock Vault implementation (we'll use a simple contract for testing)
    // In production, this would be the actual Vault implementation
    const MockVault = await ethers.getContractFactory("MockVault");
    const mockVault = await MockVault.deploy();
    await mockVault.waitForDeployment();
    vaultImplementation = await mockVault.getAddress();

    // Deploy VaultFactory
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    vaultFactory = await VaultFactory.deploy();
    await vaultFactory.waitForDeployment();

    // Initialize VaultFactory
    await vaultFactory.initialize(vaultImplementation, admin.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct implementation address", async function () {
      expect(await vaultFactory.vaultImplementation()).to.equal(vaultImplementation);
    });

    it("Should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await vaultFactory.DEFAULT_ADMIN_ROLE();
      expect(await vaultFactory.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should set correct chain ID", async function () {
      const network = await ethers.provider.getNetwork();
      expect(await vaultFactory.chainId()).to.equal(network.chainId);
    });

    it("Should revert if initialized with zero address implementation", async function () {
      const VaultFactory = await ethers.getContractFactory("VaultFactory");
      const newFactory = await VaultFactory.deploy();
      await newFactory.waitForDeployment();

      await expect(
        newFactory.initialize(ZeroAddress, admin.address)
      ).to.be.revertedWithCustomError(newFactory, "InvalidImplementation");
    });

    it("Should revert if initialized with zero address admin", async function () {
      const VaultFactory = await ethers.getContractFactory("VaultFactory");
      const newFactory = await VaultFactory.deploy();
      await newFactory.waitForDeployment();

      await expect(
        newFactory.initialize(vaultImplementation, ZeroAddress)
      ).to.be.revertedWithCustomError(newFactory, "InvalidOwner");
    });

    it("Should not allow double initialization", async function () {
      await expect(
        vaultFactory.initialize(vaultImplementation, admin.address)
      ).to.be.revertedWithCustomError(vaultFactory, "InvalidInitialization");
    });
  });

  describe("Vault Creation", function () {
    it("Should create a new vault with valid parameters", async function () {
      const uuid = sampleUUID;
      const vaultName = "Test Vault";

      const tx = await vaultFactory.createVault(uuid, owner.address, vaultName);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VaultCreated"
      );
      expect(event).to.not.be.undefined;

      // Verify vault was created
      const [vaultAddress, exists] = await vaultFactory.getVaultByUuid(uuid);
      expect(exists).to.be.true;
      expect(vaultAddress).to.not.equal(ZeroAddress);

      // Verify vault is registered
      expect(await vaultFactory.isVault(vaultAddress)).to.be.true;
    });

    it("Should revert when creating vault with zero owner address", async function () {
      await expect(
        vaultFactory.createVault(sampleUUID, ZeroAddress, "Test Vault")
      ).to.be.revertedWithCustomError(vaultFactory, "InvalidOwner");
    });

    it("Should revert when creating vault with duplicate UUID", async function () {
      const uuid = sampleUUID;
      await vaultFactory.createVault(uuid, owner.address, "First Vault");

      await expect(
        vaultFactory.createVault(uuid, user1.address, "Second Vault")
      ).to.be.revertedWithCustomError(vaultFactory, "VaultAlreadyExists");
    });

    it("Should create multiple vaults with different UUIDs", async function () {
      const uuid1 = "0x123456789abcdef0123456789abcdef0";
      const uuid2 = "0xfedcba9876543210fedcba9876543210";

      await vaultFactory.createVault(uuid1, owner.address, "Vault 1");
      await vaultFactory.createVault(uuid2, owner.address, "Vault 2");

      const [vault1Address, exists1] = await vaultFactory.getVaultByUuid(uuid1);
      const [vault2Address, exists2] = await vaultFactory.getVaultByUuid(uuid2);

      expect(exists1).to.be.true;
      expect(exists2).to.be.true;
      expect(vault1Address).to.not.equal(vault2Address);
    });

    it("Should emit VaultCreated event with correct parameters", async function () {
      const uuid = sampleUUID;
      const vaultName = "Test Vault";

      await expect(vaultFactory.createVault(uuid, owner.address, vaultName))
        .to.emit(vaultFactory, "VaultCreated")
        .withArgs(
          // vaultAddress will be dynamic
          (value: string) => value !== ZeroAddress,
          uuid,
          owner.address,
          // salt will be dynamic
          (value: string) => value !== "0x" + "0".repeat(64),
          // caip10 will be dynamic but should contain the chain ID
          (value: string) => value.startsWith("eip155:")
        );
    });
  });

  describe("Vault Prediction", function () {
    it("Should predict vault address before creation", async function () {
      const uuid = sampleUUID;
      const predictedAddress = await vaultFactory.predictVaultAddress(
        uuid,
        owner.address
      );

      expect(predictedAddress).to.not.equal(ZeroAddress);

      // Create vault and verify it matches prediction
      const tx = await vaultFactory.createVault(uuid, owner.address, "Test Vault");
      await tx.wait();

      const [actualAddress] = await vaultFactory.getVaultByUuid(uuid);
      expect(actualAddress).to.equal(predictedAddress);
    });

    it("Should produce different predictions for different UUIDs", async function () {
      const uuid1 = "0x123456789abcdef0123456789abcdef0";
      const uuid2 = "0xfedcba9876543210fedcba9876543210";

      const predicted1 = await vaultFactory.predictVaultAddress(uuid1, owner.address);
      const predicted2 = await vaultFactory.predictVaultAddress(uuid2, owner.address);

      expect(predicted1).to.not.equal(predicted2);
    });

    it("Should produce different predictions for different owners", async function () {
      const uuid = sampleUUID;

      const predicted1 = await vaultFactory.predictVaultAddress(uuid, owner.address);
      const predicted2 = await vaultFactory.predictVaultAddress(uuid, user1.address);

      expect(predicted1).to.not.equal(predicted2);
    });
  });

  describe("Vault Lookup", function () {
    beforeEach(async function () {
      await vaultFactory.createVault(sampleUUID, owner.address, "Test Vault");
    });

    it("Should retrieve vault by UUID", async function () {
      const [vaultAddress, exists, salt] = await vaultFactory.getVaultByUuid(sampleUUID);

      expect(exists).to.be.true;
      expect(vaultAddress).to.not.equal(ZeroAddress);
      expect(salt).to.not.equal("0x" + "0".repeat(64));
    });

    it("Should retrieve UUID by vault address", async function () {
      const [vaultAddress] = await vaultFactory.getVaultByUuid(sampleUUID);
      const [uuid, exists] = await vaultFactory.getUuidByVault(vaultAddress);

      expect(exists).to.be.true;
      expect(uuid).to.equal(sampleUUID);
    });

    it("Should revert when querying non-existent vault", async function () {
      const nonExistentAddress = "0x1234567890123456789012345678901234567890";

      await expect(
        vaultFactory.getUuidByVault(nonExistentAddress)
      ).to.be.revertedWithCustomError(vaultFactory, "VaultNotFound");
    });

    it("Should return false for non-existent UUID", async function () {
      const nonExistentUUID = "0xfedcba9876543210fedcba9876543210";
      const [vaultAddress, exists] = await vaultFactory.getVaultByUuid(nonExistentUUID);

      expect(exists).to.be.false;
      expect(vaultAddress).to.equal(ZeroAddress);
    });
  });

  describe("CAIP-10 Identifier", function () {
    beforeEach(async function () {
      await vaultFactory.createVault(sampleUUID, owner.address, "Test Vault");
    });

    it("Should generate correct CAIP-10 identifier", async function () {
      const [vaultAddress] = await vaultFactory.getVaultByUuid(sampleUUID);
      const caip10 = await vaultFactory.getCAIP10(vaultAddress);

      const network = await ethers.provider.getNetwork();
      const expectedPrefix = `eip155:${network.chainId}:`;

      expect(caip10).to.include(expectedPrefix);
      expect(caip10).to.include(vaultAddress.toLowerCase());
    });

    it("Should revert when requesting CAIP-10 for non-existent vault", async function () {
      const nonExistentAddress = "0x1234567890123456789012345678901234567890";

      await expect(
        vaultFactory.getCAIP10(nonExistentAddress)
      ).to.be.revertedWithCustomError(vaultFactory, "VaultNotFound");
    });
  });

  describe("Implementation Update", function () {
    it("Should allow admin to update implementation", async function () {
      // Deploy new implementation
      const MockVault = await ethers.getContractFactory("MockVault");
      const newImplementation = await MockVault.deploy();
      await newImplementation.waitForDeployment();
      const newImplAddress = await newImplementation.getAddress();

      // Update implementation
      await expect(vaultFactory.connect(admin).updateImplementation(newImplAddress))
        .to.emit(vaultFactory, "ImplementationUpdated")
        .withArgs(vaultImplementation, newImplAddress);

      expect(await vaultFactory.vaultImplementation()).to.equal(newImplAddress);
    });

    it("Should revert when non-admin tries to update implementation", async function () {
      const MockVault = await ethers.getContractFactory("MockVault");
      const newImplementation = await MockVault.deploy();
      await newImplementation.waitForDeployment();
      const newImplAddress = await newImplementation.getAddress();

      await expect(
        vaultFactory.connect(user1).updateImplementation(newImplAddress)
      ).to.be.reverted;
    });

    it("Should revert when updating to zero address", async function () {
      await expect(
        vaultFactory.connect(admin).updateImplementation(ZeroAddress)
      ).to.be.revertedWithCustomError(vaultFactory, "InvalidImplementation");
    });
  });

  describe("Access Control", function () {
    it("Should have correct roles assigned", async function () {
      const DEFAULT_ADMIN_ROLE = await vaultFactory.DEFAULT_ADMIN_ROLE();
      const OPERATOR_ROLE = await vaultFactory.OPERATOR_ROLE();

      expect(await vaultFactory.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await vaultFactory.hasRole(OPERATOR_ROLE, admin.address)).to.be.true;
    });

    it("Should allow role management by admin", async function () {
      const OPERATOR_ROLE = await vaultFactory.OPERATOR_ROLE();

      await vaultFactory.connect(admin).grantRole(OPERATOR_ROLE, user1.address);
      expect(await vaultFactory.hasRole(OPERATOR_ROLE, user1.address)).to.be.true;

      await vaultFactory.connect(admin).revokeRole(OPERATOR_ROLE, user1.address);
      expect(await vaultFactory.hasRole(OPERATOR_ROLE, user1.address)).to.be.false;
    });
  });

  describe("Gas Optimization", function () {
    it("Should efficiently create multiple vaults", async function () {
      const gasUsed: bigint[] = [];

      for (let i = 0; i < 5; i++) {
        const uuid = `0x${i.toString(16).padStart(32, "0")}`;
        const tx = await vaultFactory.createVault(uuid, owner.address, `Vault ${i}`);
        const receipt = await tx.wait();
        gasUsed.push(receipt!.gasUsed);
      }

      // Verify gas usage is relatively consistent
      const maxGas = Math.max(...gasUsed.map((g) => Number(g)));
      const minGas = Math.min(...gasUsed.map((g) => Number(g)));
      const variance = ((maxGas - minGas) / minGas) * 100;

      // Variance should be less than 20%
      expect(variance).to.be.lessThan(20);
    });
  });
});
