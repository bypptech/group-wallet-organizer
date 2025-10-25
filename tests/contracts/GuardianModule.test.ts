import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { GuardianModule } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * GuardianModule コントラクトテスト
 *
 * テスト範囲:
 * - 初期化
 * - リカバリフロー（initiateRecovery, approveRecovery, completeRecovery）
 * - 緊急凍結（emergencyFreeze, emergencyUnfreeze）
 * - Guardian管理（追加、削除、閾値更新）
 * - タイムロック検証
 * - アクセス制御
 */
describe("GuardianModule", function () {
  let guardianModule: GuardianModule;
  let admin: SignerWithAddress;
  let guardian1: SignerWithAddress;
  let guardian2: SignerWithAddress;
  let guardian3: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let escrowRegistry: SignerWithAddress;
  let policyManager: SignerWithAddress;

  const VAULT_ID = ethers.keccak256(ethers.toUtf8Bytes("test-vault-1"));
  const RECOVERY_TIMELOCK = 3 * 24 * 60 * 60; // 3 days

  beforeEach(async function () {
    [
      admin,
      guardian1,
      guardian2,
      guardian3,
      user1,
      user2,
      escrowRegistry,
      policyManager,
    ] = await ethers.getSigners();

    // Deploy GuardianModule
    const GuardianModule = await ethers.getContractFactory("GuardianModule");
    const guardianModuleProxy = await upgrades.deployProxy(
      GuardianModule,
      [
        admin.address,
        escrowRegistry.address,
        policyManager.address,
        [guardian1.address, guardian2.address, guardian3.address],
        2, // threshold = 2
      ],
      { kind: "uups" }
    );
    await guardianModuleProxy.waitForDeployment();

    guardianModule = guardianModuleProxy as unknown as GuardianModule;
  });

  describe("初期化", function () {
    it("正しく初期化されること", async function () {
      expect(await guardianModule.escrowRegistry()).to.equal(escrowRegistry.address);
      expect(await guardianModule.policyManager()).to.equal(policyManager.address);
      expect(await guardianModule.guardianThreshold()).to.equal(2);
      expect(await guardianModule.recoveryTimelock()).to.equal(RECOVERY_TIMELOCK);
    });

    it("AdminがADMIN_ROLEを持つこと", async function () {
      const ADMIN_ROLE = await guardianModule.ADMIN_ROLE();
      expect(await guardianModule.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("初期GuardiansがGUARDIAN_ROLEを持つこと", async function () {
      const GUARDIAN_ROLE = await guardianModule.GUARDIAN_ROLE();
      expect(await guardianModule.hasRole(GUARDIAN_ROLE, guardian1.address)).to.be.true;
      expect(await guardianModule.hasRole(GUARDIAN_ROLE, guardian2.address)).to.be.true;
      expect(await guardianModule.hasRole(GUARDIAN_ROLE, guardian3.address)).to.be.true;
    });

    it("Guardian数が正しいこと", async function () {
      expect(await guardianModule.getGuardianCount()).to.equal(3);
    });

    it("Guardian一覧を取得できること", async function () {
      const guardians = await guardianModule.getGuardians();
      expect(guardians).to.have.lengthOf(3);
      expect(guardians).to.include(guardian1.address);
      expect(guardians).to.include(guardian2.address);
      expect(guardians).to.include(guardian3.address);
    });
  });

  describe("リカバリフロー", function () {
    const OLD_ACCOUNT = ethers.Wallet.createRandom().address;
    const NEW_ACCOUNT = ethers.Wallet.createRandom().address;
    const RECOVERY_REASON = "Lost access to old account";

    it("Guardianがリカバリを開始できること", async function () {
      const tx = await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "RecoveryInitiated"
      );

      expect(event).to.exist;

      // Get requestId from event or use counter (ID starts from 1)
      const requestId = 1;

      // Check recovery request
      const request = await guardianModule.getRecoveryRequest(requestId);
      expect(request.vaultId).to.equal(VAULT_ID);
      expect(request.oldAccount).to.equal(OLD_ACCOUNT);
      expect(request.newAccount).to.equal(NEW_ACCOUNT);
      expect(request.reason).to.equal(RECOVERY_REASON);
      expect(request.executed).to.be.false;
      expect(request.cancelled).to.be.false;
    });

    it("非Guardianがリカバリを開始できないこと", async function () {
      await expect(
        guardianModule
          .connect(user1)
          .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON)
      ).to.be.revertedWithCustomError(guardianModule, "NotGuardian");
    });

    it("initiatorが自動的に承認されること", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      const requestId = 1; // First recovery ID
      const approvers = await guardianModule.getRecoveryApprovers(requestId);
      expect(approvers).to.have.lengthOf(1);
      expect(approvers[0]).to.equal(guardian1.address);
    });

    it("他のGuardianがリカバリを承認できること", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      const requestId = 1;
      await expect(
        guardianModule.connect(guardian2).approveRecovery(requestId)
      )
        .to.emit(guardianModule, "RecoveryApproved")
        .withArgs(requestId, guardian2.address);

      const approvers = await guardianModule.getRecoveryApprovers(requestId);
      expect(approvers).to.have.lengthOf(2);
    });

    it("同じGuardianが二重承認できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      const requestId = 1;
      await expect(
        guardianModule.connect(guardian1).approveRecovery(requestId)
      ).to.be.revertedWithCustomError(guardianModule, "AlreadyApproved");
    });

    it("タイムロック前はリカバリ完了できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      const requestId = 1;
      await guardianModule.connect(guardian2).approveRecovery(requestId);

      await expect(
        guardianModule.connect(guardian1).completeRecovery(requestId)
      ).to.be.revertedWithCustomError(guardianModule, "RecoveryNotReady");
    });

    it("承認が閾値未満ではリカバリ完了できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      // Advance time past timelock
      await time.increase(RECOVERY_TIMELOCK + 1);

      const requestId = 1;
      await expect(
        guardianModule.connect(guardian1).completeRecovery(requestId)
      ).to.be.revertedWithCustomError(guardianModule, "InsufficientApprovals");
    });

    it("タイムロック後かつ閾値以上の承認でリカバリ完了できること", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      await guardianModule.connect(guardian2).approveRecovery(1);

      // Advance time past timelock
      await time.increase(RECOVERY_TIMELOCK + 1);

      await expect(
        guardianModule.connect(guardian1).completeRecovery(1)
      )
        .to.emit(guardianModule, "RecoveryCompleted")
        .withArgs(1, VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT);

      const request = await guardianModule.getRecoveryRequest(1);
      expect(request.executed).to.be.true;
    });

    it("Guardianがリカバリをキャンセルできること", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      await expect(
        guardianModule.connect(guardian2).cancelRecovery(1)
      )
        .to.emit(guardianModule, "RecoveryCancelled")
        .withArgs(1, guardian2.address);

      const request = await guardianModule.getRecoveryRequest(1);
      expect(request.cancelled).to.be.true;
    });

    it("キャンセル後のリカバリは完了できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      await guardianModule.connect(guardian2).approveRecovery(1);
      await guardianModule.connect(guardian2).cancelRecovery(1);

      await time.increase(RECOVERY_TIMELOCK + 1);

      await expect(
        guardianModule.connect(guardian1).completeRecovery(1)
      ).to.be.revertedWithCustomError(guardianModule, "RecoveryAlreadyCancelled");
    });

    it("実行済みリカバリは再度完了できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, RECOVERY_REASON);

      await guardianModule.connect(guardian2).approveRecovery(1);
      await time.increase(RECOVERY_TIMELOCK + 1);
      await guardianModule.connect(guardian1).completeRecovery(1);

      await expect(
        guardianModule.connect(guardian1).completeRecovery(1)
      ).to.be.revertedWithCustomError(guardianModule, "RecoveryAlreadyExecuted");
    });
  });

  describe("緊急凍結", function () {
    const FREEZE_DURATION = 7 * 24 * 60 * 60; // 7 days
    const FREEZE_REASON = "Suspicious activity detected";

    it("Guardianがvaultを凍結できること", async function () {
      await expect(
        guardianModule
          .connect(guardian1)
          .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON)
      )
        .to.emit(guardianModule, "EmergencyFreeze")
        .withArgs(VAULT_ID, guardian1.address, FREEZE_DURATION, FREEZE_REASON);

      const freezeState = await guardianModule.getFreezeState(VAULT_ID);
      expect(freezeState.frozen).to.be.true;
      expect(freezeState.freezer).to.equal(guardian1.address);
      expect(freezeState.reason).to.equal(FREEZE_REASON);
    });

    it("非Guardianがvaultを凍結できないこと", async function () {
      await expect(
        guardianModule
          .connect(user1)
          .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON)
      ).to.be.revertedWithCustomError(guardianModule, "NotGuardian");
    });

    it("最大凍結期間を超える凍結はエラーになること", async function () {
      const MAX_FREEZE_DURATION = await guardianModule.MAX_FREEZE_DURATION();
      const excessiveDuration = Number(MAX_FREEZE_DURATION) + 1;

      await expect(
        guardianModule
          .connect(guardian1)
          .emergencyFreeze(VAULT_ID, excessiveDuration, FREEZE_REASON)
      ).to.be.revertedWithCustomError(guardianModule, "InvalidTimelock");
    });

    it("Guardianが凍結を解除できること", async function () {
      await guardianModule
        .connect(guardian1)
        .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON);

      await expect(
        guardianModule.connect(guardian2).emergencyUnfreeze(VAULT_ID)
      )
        .to.emit(guardianModule, "EmergencyUnfreeze")
        .withArgs(VAULT_ID, guardian2.address);

      const freezeState = await guardianModule.getFreezeState(VAULT_ID);
      expect(freezeState.frozen).to.be.false;
    });

    it("凍結されていないvaultの解除はエラーになること", async function () {
      await expect(
        guardianModule.connect(guardian1).emergencyUnfreeze(VAULT_ID)
      ).to.be.revertedWithCustomError(guardianModule, "VaultNotFrozen");
    });

    it("凍結期間経過後に自動解凍できること", async function () {
      await guardianModule
        .connect(guardian1)
        .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON);

      // Advance time past freeze duration
      await time.increase(FREEZE_DURATION + 1);

      await expect(
        guardianModule.connect(user1).autoUnfreeze(VAULT_ID)
      )
        .to.emit(guardianModule, "EmergencyUnfreeze")
        .withArgs(VAULT_ID, user1.address);

      const freezeState = await guardianModule.getFreezeState(VAULT_ID);
      expect(freezeState.frozen).to.be.false;
    });

    it("凍結期間中は自動解凍できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON);

      await expect(
        guardianModule.connect(user1).autoUnfreeze(VAULT_ID)
      ).to.be.revertedWithCustomError(guardianModule, "RecoveryNotReady");
    });

    it("凍結されたvaultではリカバリを開始できないこと", async function () {
      await guardianModule
        .connect(guardian1)
        .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON);

      const OLD_ACCOUNT = ethers.Wallet.createRandom().address;
      const NEW_ACCOUNT = ethers.Wallet.createRandom().address;

      await expect(
        guardianModule
          .connect(guardian1)
          .initiateRecovery(VAULT_ID, OLD_ACCOUNT, NEW_ACCOUNT, "test")
      ).to.be.revertedWithCustomError(guardianModule, "VaultFrozen");
    });

    it("vault凍結状態を確認できること", async function () {
      expect(await guardianModule.isVaultFrozen(VAULT_ID)).to.be.false;

      await guardianModule
        .connect(guardian1)
        .emergencyFreeze(VAULT_ID, FREEZE_DURATION, FREEZE_REASON);

      expect(await guardianModule.isVaultFrozen(VAULT_ID)).to.be.true;
    });
  });

  describe("Guardian管理", function () {
    let newGuardian: SignerWithAddress;

    beforeEach(async function () {
      [newGuardian] = await ethers.getSigners();
    });

    it("AdminがGuardianを追加できること", async function () {
      await expect(
        guardianModule.connect(admin).addGuardian(newGuardian.address)
      )
        .to.emit(guardianModule, "GuardianAdded")
        .withArgs(newGuardian.address, admin.address);

      expect(await guardianModule.isGuardian(newGuardian.address)).to.be.true;
      expect(await guardianModule.getGuardianCount()).to.equal(4);
    });

    it("非AdminがGuardianを追加できないこと", async function () {
      await expect(
        guardianModule.connect(user1).addGuardian(newGuardian.address)
      ).to.be.reverted;
    });

    it("既存Guardianの追加はエラーになること", async function () {
      await expect(
        guardianModule.connect(admin).addGuardian(guardian1.address)
      ).to.be.revertedWithCustomError(guardianModule, "GuardianAlreadyExists");
    });

    it("AdminがGuardianを削除できること", async function () {
      await expect(
        guardianModule.connect(admin).removeGuardian(guardian3.address)
      )
        .to.emit(guardianModule, "GuardianRemoved")
        .withArgs(guardian3.address, admin.address);

      expect(await guardianModule.isGuardian(guardian3.address)).to.be.false;
      expect(await guardianModule.getGuardianCount()).to.equal(2);
    });

    it("非AdminがGuardianを削除できないこと", async function () {
      await expect(
        guardianModule.connect(user1).removeGuardian(guardian3.address)
      ).to.be.reverted;
    });

    it("存在しないGuardianの削除はエラーになること", async function () {
      await expect(
        guardianModule.connect(admin).removeGuardian(newGuardian.address)
      ).to.be.revertedWithCustomError(guardianModule, "GuardianNotFound");
    });

    it("閾値以下になる削除はエラーになること", async function () {
      // Current: 3 guardians, threshold: 2
      // Remove one guardian -> 2 guardians (OK)
      await guardianModule.connect(admin).removeGuardian(guardian3.address);

      // Try to remove another -> 1 guardian (threshold is 2, should fail)
      await expect(
        guardianModule.connect(admin).removeGuardian(guardian2.address)
      ).to.be.revertedWithCustomError(guardianModule, "CannotRemoveLastGuardian");
    });

    it("AdminがGuardian閾値を更新できること", async function () {
      await expect(
        guardianModule.connect(admin).updateGuardianThreshold(3)
      )
        .to.emit(guardianModule, "GuardianThresholdUpdated")
        .withArgs(2, 3);

      expect(await guardianModule.guardianThreshold()).to.equal(3);
    });

    it("Guardian数を超える閾値設定はエラーになること", async function () {
      await expect(
        guardianModule.connect(admin).updateGuardianThreshold(4)
      ).to.be.revertedWithCustomError(guardianModule, "InvalidThreshold");
    });

    it("0の閾値設定はエラーになること", async function () {
      await expect(
        guardianModule.connect(admin).updateGuardianThreshold(0)
      ).to.be.revertedWithCustomError(guardianModule, "InvalidThreshold");
    });
  });

  describe("設定管理", function () {
    it("Adminがリカバリタイムロックを更新できること", async function () {
      const newTimelock = 5 * 24 * 60 * 60; // 5 days

      await expect(
        guardianModule.connect(admin).updateRecoveryTimelock(newTimelock)
      )
        .to.emit(guardianModule, "RecoveryTimelockUpdated")
        .withArgs(RECOVERY_TIMELOCK, newTimelock);

      expect(await guardianModule.recoveryTimelock()).to.equal(newTimelock);
    });

    it("0のタイムロック設定はエラーになること", async function () {
      await expect(
        guardianModule.connect(admin).updateRecoveryTimelock(0)
      ).to.be.revertedWithCustomError(guardianModule, "InvalidTimelock");
    });

    it("AdminがEscrowRegistryアドレスを更新できること", async function () {
      const newRegistry = ethers.Wallet.createRandom().address;

      await expect(
        guardianModule.connect(admin).updateEscrowRegistry(newRegistry)
      )
        .to.emit(guardianModule, "EscrowRegistryUpdated")
        .withArgs(escrowRegistry.address, newRegistry);

      expect(await guardianModule.escrowRegistry()).to.equal(newRegistry);
    });

    it("AdminがPolicyManagerアドレスを更新できること", async function () {
      const newManager = ethers.Wallet.createRandom().address;

      await expect(
        guardianModule.connect(admin).updatePolicyManager(newManager)
      )
        .to.emit(guardianModule, "PolicyManagerUpdated")
        .withArgs(policyManager.address, newManager);

      expect(await guardianModule.policyManager()).to.equal(newManager);
    });

    it("非Adminが設定を更新できないこと", async function () {
      await expect(
        guardianModule.connect(user1).updateRecoveryTimelock(7 * 24 * 60 * 60)
      ).to.be.reverted;

      await expect(
        guardianModule.connect(user1).updateEscrowRegistry(ethers.Wallet.createRandom().address)
      ).to.be.reverted;

      await expect(
        guardianModule.connect(user1).updatePolicyManager(ethers.Wallet.createRandom().address)
      ).to.be.reverted;
    });
  });

  describe("アップグレード", function () {
    it("AdminがUUPSアップグレードを承認できること", async function () {
      expect(
        await guardianModule.hasRole(await guardianModule.ADMIN_ROLE(), admin.address)
      ).to.be.true;
    });

    it("非Adminがアップグレードできないこと", async function () {
      expect(
        await guardianModule.hasRole(await guardianModule.ADMIN_ROLE(), user1.address)
      ).to.be.false;
    });
  });
});
