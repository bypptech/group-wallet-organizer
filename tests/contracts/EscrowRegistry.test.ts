import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { EscrowRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EscrowRegistry", function () {
  let escrowRegistry: EscrowRegistry;
  let admin: SignerWithAddress;
  let vaultAddress: SignerWithAddress;
  let requester: SignerWithAddress;
  let recipient: SignerWithAddress;
  let guardian1: SignerWithAddress;
  let guardian2: SignerWithAddress;

  beforeEach(async function () {
    [admin, vaultAddress, requester, recipient, guardian1, guardian2] = await ethers.getSigners();

    const EscrowRegistryFactory = await ethers.getContractFactory("EscrowRegistry");
    const escrowRegistryProxy = await upgrades.deployProxy(
      EscrowRegistryFactory,
      [admin.address],
      { kind: "uups" }
    );
    await escrowRegistryProxy.waitForDeployment();

    escrowRegistry = escrowRegistryProxy as unknown as EscrowRegistry;
  });

  describe("初期化", function () {
    it("管理者ロールが正しく設定される", async function () {
      const ADMIN_ROLE = await escrowRegistry.ADMIN_ROLE();
      expect(await escrowRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("エスクローカウンターが1から開始される", async function () {
      expect(await escrowRegistry.getEscrowCounter()).to.equal(1);
    });
  });

  describe("エスクロー作成", function () {
    it("エスクローを正常に作成できる", async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress, // ETH
        amount: ethers.parseEther("1.0"),
        escrowType: 0, // ALLOWANCE
        approvalType: 0, // ASYNC
        title: "お小遣い",
        description: "今月のお小遣い",
        scheduledReleaseAt: now + 86400, // 1日後
        expiresAt: now + 86400 * 7, // 7日後
        metadataHash: ethers.ZeroHash,
      };

      const tx = await escrowRegistry.connect(requester).createEscrow(params);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;

      // イベントの検証
      const events = await escrowRegistry.queryFilter(
        escrowRegistry.filters.EscrowCreated(),
        receipt!.blockNumber
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.escrowId).to.equal(1);
      expect(events[0].args.vaultAddress).to.equal(vaultAddress.address);
      expect(events[0].args.requester).to.equal(requester.address);
    });

    it("無効なVaultアドレスでエラーになる", async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: ethers.ZeroAddress,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: ethers.parseEther("1.0"),
        escrowType: 0,
        approvalType: 0,
        title: "Test",
        description: "Test",
        scheduledReleaseAt: now + 86400,
        expiresAt: now + 86400 * 7,
        metadataHash: ethers.ZeroHash,
      };

      await expect(
        escrowRegistry.connect(requester).createEscrow(params)
      ).to.be.revertedWith("Invalid vault address");
    });

    it("金額が0でエラーになる", async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: 0,
        escrowType: 0,
        approvalType: 0,
        title: "Test",
        description: "Test",
        scheduledReleaseAt: now + 86400,
        expiresAt: now + 86400 * 7,
        metadataHash: ethers.ZeroHash,
      };

      await expect(
        escrowRegistry.connect(requester).createEscrow(params)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("有効期限が過去の場合エラーになる", async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: ethers.parseEther("1.0"),
        escrowType: 0,
        approvalType: 0,
        title: "Test",
        description: "Test",
        scheduledReleaseAt: now - 86400,
        expiresAt: now - 1,
        metadataHash: ethers.ZeroHash,
      };

      await expect(
        escrowRegistry.connect(requester).createEscrow(params)
      ).to.be.revertedWith("Expiry time must be in the future");
    });
  });

  describe("エスクロー取得", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: ethers.parseEther("1.0"),
        escrowType: 0,
        approvalType: 0,
        title: "テストエスクロー",
        description: "テスト用",
        scheduledReleaseAt: now + 86400,
        expiresAt: now + 86400 * 7,
        metadataHash: ethers.ZeroHash,
      };

      const tx = await escrowRegistry.connect(requester).createEscrow(params);
      const receipt = await tx.wait();
      const events = await escrowRegistry.queryFilter(
        escrowRegistry.filters.EscrowCreated(),
        receipt!.blockNumber
      );
      escrowId = events[0].args.escrowId;
    });

    it("エスクロー情報を取得できる", async function () {
      const escrow = await escrowRegistry.getEscrow(escrowId);
      expect(escrow.id).to.equal(escrowId);
      expect(escrow.vaultAddress).to.equal(vaultAddress.address);
      expect(escrow.requester).to.equal(requester.address);
      expect(escrow.recipient).to.equal(recipient.address);
      expect(escrow.amount).to.equal(ethers.parseEther("1.0"));
      expect(escrow.title).to.equal("テストエスクロー");
      expect(escrow.state).to.equal(0); // DRAFT
    });

    it("Vault別のエスクローリストを取得できる", async function () {
      const escrows = await escrowRegistry.getVaultEscrows(vaultAddress.address);
      expect(escrows.length).to.equal(1);
      expect(escrows[0]).to.equal(escrowId);
    });

    it("リクエスター別のエスクローリストを取得できる", async function () {
      const escrows = await escrowRegistry.getRequesterEscrows(requester.address);
      expect(escrows.length).to.equal(1);
      expect(escrows[0]).to.equal(escrowId);
    });
  });

  describe("エスクロー状態変更", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: ethers.parseEther("1.0"),
        escrowType: 0,
        approvalType: 0,
        title: "Test",
        description: "Test",
        scheduledReleaseAt: now + 86400,
        expiresAt: now + 86400 * 7,
        metadataHash: ethers.ZeroHash,
      };

      const tx = await escrowRegistry.connect(requester).createEscrow(params);
      const receipt = await tx.wait();
      const events = await escrowRegistry.queryFilter(
        escrowRegistry.filters.EscrowCreated(),
        receipt!.blockNumber
      );
      escrowId = events[0].args.escrowId;
    });

    it("リクエスターが状態を変更できる", async function () {
      await escrowRegistry.connect(requester).changeEscrowState(escrowId, 1); // PENDING
      const escrow = await escrowRegistry.getEscrow(escrowId);
      expect(escrow.state).to.equal(1);
    });

    it("権限のないユーザーは状態を変更できない", async function () {
      await expect(
        escrowRegistry.connect(guardian1).changeEscrowState(escrowId, 1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("承認フロー", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: ethers.parseEther("1.0"),
        escrowType: 0,
        approvalType: 0,
        title: "Test",
        description: "Test",
        scheduledReleaseAt: now + 86400,
        expiresAt: now + 86400 * 7,
        metadataHash: ethers.ZeroHash,
      };

      const tx = await escrowRegistry.connect(requester).createEscrow(params);
      const receipt = await tx.wait();
      const events = await escrowRegistry.queryFilter(
        escrowRegistry.filters.EscrowCreated(),
        receipt!.blockNumber
      );
      escrowId = events[0].args.escrowId;

      // PENDING状態に変更
      await escrowRegistry.connect(requester).changeEscrowState(escrowId, 1);

      // 承認状態を初期化
      const now2 = Math.floor(Date.now() / 1000);
      await escrowRegistry.connect(requester).initializeApprovalState(
        escrowId,
        2, // 2人の承認が必要
        now2 + 86400 // 承認期限: 1日後
      );
    });

    it("承認を付与できる", async function () {
      await escrowRegistry.connect(guardian1).approveEscrow(escrowId);

      const [, currentApprovals] = await escrowRegistry.getApprovalState(escrowId);
      expect(currentApprovals).to.equal(1);
    });

    it("必要な承認数に達すると状態が変わる", async function () {
      await escrowRegistry.connect(guardian1).approveEscrow(escrowId);
      await escrowRegistry.connect(guardian2).approveEscrow(escrowId);

      const escrow = await escrowRegistry.getEscrow(escrowId);
      expect(escrow.state).to.equal(2); // APPROVED
    });

    it("同じユーザーは複数回承認できない", async function () {
      await escrowRegistry.connect(guardian1).approveEscrow(escrowId);

      await expect(
        escrowRegistry.connect(guardian1).approveEscrow(escrowId)
      ).to.be.revertedWith("Already approved");
    });
  });

  describe("エスクローキャンセル", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const params = {
        vaultAddress: vaultAddress.address,
        recipient: recipient.address,
        tokenAddress: ethers.ZeroAddress,
        amount: ethers.parseEther("1.0"),
        escrowType: 0,
        approvalType: 0,
        title: "Test",
        description: "Test",
        scheduledReleaseAt: now + 86400,
        expiresAt: now + 86400 * 7,
        metadataHash: ethers.ZeroHash,
      };

      const tx = await escrowRegistry.connect(requester).createEscrow(params);
      const receipt = await tx.wait();
      const events = await escrowRegistry.queryFilter(
        escrowRegistry.filters.EscrowCreated(),
        receipt!.blockNumber
      );
      escrowId = events[0].args.escrowId;
    });

    it("リクエスターがキャンセルできる", async function () {
      await escrowRegistry.connect(requester).cancelEscrow(escrowId, "不要になった");

      const escrow = await escrowRegistry.getEscrow(escrowId);
      expect(escrow.state).to.equal(5); // CANCELLED
    });

    it("権限のないユーザーはキャンセルできない", async function () {
      await expect(
        escrowRegistry.connect(guardian1).cancelEscrow(escrowId, "test")
      ).to.be.revertedWith("Not authorized");
    });
  });
});
