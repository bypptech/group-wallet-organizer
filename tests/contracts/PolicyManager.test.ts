import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PolicyManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PolicyManager", function () {
  let policyManager: PolicyManager;
  let admin: SignerWithAddress;
  let guardian: SignerWithAddress;
  let vaultAddress: SignerWithAddress;
  let proposer: SignerWithAddress;
  let approver1: SignerWithAddress;
  let approver2: SignerWithAddress;

  const ZERO_HASH = ethers.ZeroHash;

  beforeEach(async function () {
    [admin, guardian, vaultAddress, proposer, approver1, approver2] = await ethers.getSigners();

    const PolicyManagerFactory = await ethers.getContractFactory("PolicyManager");
    const policyManagerProxy = await upgrades.deployProxy(
      PolicyManagerFactory,
      [admin.address],
      { kind: "uups" }
    );
    await policyManagerProxy.waitForDeployment();

    policyManager = policyManagerProxy as unknown as PolicyManager;

    // Guardian ロールを付与
    const GUARDIAN_ROLE = await policyManager.GUARDIAN_ROLE();
    await policyManager.connect(admin).grantRole(GUARDIAN_ROLE, guardian.address);
  });

  describe("初期化", function () {
    it("管理者ロールが正しく設定される", async function () {
      const ADMIN_ROLE = await policyManager.ADMIN_ROLE();
      expect(await policyManager.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Guardian ロールが正しく付与される", async function () {
      const GUARDIAN_ROLE = await policyManager.GUARDIAN_ROLE();
      expect(await policyManager.hasRole(GUARDIAN_ROLE, guardian.address)).to.be.true;
    });
  });

  describe("ポリシー作成", function () {
    it("管理者がポリシーを作成できる", async function () {
      const tx = await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        2, // minApprovals
        ethers.parseEther("10"), // maxAmount
        86400, // cooldownPeriod (1日)
        ZERO_HASH, // rolesRoot
        ZERO_HASH  // ownersRoot
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // イベントの検証
      const events = await policyManager.queryFilter(
        policyManager.filters.PolicyCreated(),
        receipt!.blockNumber
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.policyId).to.equal(1);
      expect(events[0].args.vaultAddress).to.equal(vaultAddress.address);
      expect(events[0].args.minApprovals).to.equal(2);
    });

    it("作成したポリシーを取得できる", async function () {
      await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        2,
        ethers.parseEther("10"),
        86400,
        ZERO_HASH,
        ZERO_HASH
      );

      const policy = await policyManager.getPolicy(1);
      expect(policy.id).to.equal(1);
      expect(policy.vaultAddress).to.equal(vaultAddress.address);
      expect(policy.minApprovals).to.equal(2);
      expect(policy.maxAmount).to.equal(ethers.parseEther("10"));
      expect(policy.cooldownPeriod).to.equal(86400);
      expect(policy.enabled).to.be.true;
    });

    it("無効なVaultアドレスでエラーになる", async function () {
      await expect(
        policyManager.connect(admin).createPolicy(
          ethers.ZeroAddress,
          2,
          ethers.parseEther("10"),
          86400,
          ZERO_HASH,
          ZERO_HASH
        )
      ).to.be.revertedWith("Invalid vault address");
    });

    it("minApprovalsが0でエラーになる", async function () {
      await expect(
        policyManager.connect(admin).createPolicy(
          vaultAddress.address,
          0,
          ethers.parseEther("10"),
          86400,
          ZERO_HASH,
          ZERO_HASH
        )
      ).to.be.revertedWith("Min approvals must be greater than 0");
    });

    it("maxAmountが0でエラーになる", async function () {
      await expect(
        policyManager.connect(admin).createPolicy(
          vaultAddress.address,
          2,
          0,
          86400,
          ZERO_HASH,
          ZERO_HASH
        )
      ).to.be.revertedWith("Max amount must be greater than 0");
    });

    it("管理者以外はポリシーを作成できない", async function () {
      await expect(
        policyManager.connect(proposer).createPolicy(
          vaultAddress.address,
          2,
          ethers.parseEther("10"),
          86400,
          ZERO_HASH,
          ZERO_HASH
        )
      ).to.be.reverted;
    });
  });

  describe("Vault別のポリシー取得", function () {
    beforeEach(async function () {
      await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        2,
        ethers.parseEther("10"),
        86400,
        ZERO_HASH,
        ZERO_HASH
      );

      await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        3,
        ethers.parseEther("20"),
        172800,
        ZERO_HASH,
        ZERO_HASH
      );
    });

    it("Vault別のポリシー一覧を取得できる", async function () {
      const policies = await policyManager.getPoliciesByVault(vaultAddress.address);
      expect(policies.length).to.equal(2);
      expect(policies[0]).to.equal(1);
      expect(policies[1]).to.equal(2);
    });
  });

  describe("ポリシー更新提案フロー", function () {
    let policyId: bigint;

    beforeEach(async function () {
      const tx = await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        2, // 2人の承認が必要
        ethers.parseEther("10"),
        86400,
        ZERO_HASH,
        ZERO_HASH
      );
      const receipt = await tx.wait();
      const events = await policyManager.queryFilter(
        policyManager.filters.PolicyCreated(),
        receipt!.blockNumber
      );
      policyId = events[0].args.policyId;
    });

    it("ポリシー更新を提案できる", async function () {
      const tx = await policyManager.connect(proposer).proposeUpdatePolicy(
        policyId,
        3, // 新しいminApprovals
        ethers.parseEther("20"), // 新しいmaxAmount
        172800, // 新しいcooldownPeriod
        ZERO_HASH,
        ZERO_HASH
      );

      const receipt = await tx.wait();
      const events = await policyManager.queryFilter(
        policyManager.filters.PolicyUpdateProposed(),
        receipt!.blockNumber
      );

      expect(events.length).to.equal(1);
      expect(events[0].args.proposalId).to.equal(1);
      expect(events[0].args.policyId).to.equal(policyId);
      expect(events[0].args.proposer).to.equal(proposer.address);
    });

    it("提案を承認できる", async function () {
      // 提案を作成
      await policyManager.connect(proposer).proposeUpdatePolicy(
        policyId,
        3,
        ethers.parseEther("20"),
        172800,
        ZERO_HASH,
        ZERO_HASH
      );

      // 承認
      await policyManager.connect(approver1).approvePolicyUpdate(1);

      const [, , approvalCount] = await policyManager.getProposal(1);
      expect(approvalCount).to.equal(1);
    });

    it("必要な承認数に達すると自動的に実行される", async function () {
      // 提案を作成
      await policyManager.connect(proposer).proposeUpdatePolicy(
        policyId,
        3,
        ethers.parseEther("20"),
        172800,
        ZERO_HASH,
        ZERO_HASH
      );

      // 2人が承認
      await policyManager.connect(approver1).approvePolicyUpdate(1);
      await policyManager.connect(approver2).approvePolicyUpdate(1);

      // ポリシーが更新されているか確認
      const policy = await policyManager.getPolicy(policyId);
      expect(policy.minApprovals).to.equal(3);
      expect(policy.maxAmount).to.equal(ethers.parseEther("20"));
      expect(policy.cooldownPeriod).to.equal(172800);

      // 提案が実行済みか確認
      const [, , , executed] = await policyManager.getProposal(1);
      expect(executed).to.be.true;
    });

    it("同じユーザーは複数回承認できない", async function () {
      await policyManager.connect(proposer).proposeUpdatePolicy(
        policyId,
        3,
        ethers.parseEther("20"),
        172800,
        ZERO_HASH,
        ZERO_HASH
      );

      await policyManager.connect(approver1).approvePolicyUpdate(1);

      await expect(
        policyManager.connect(approver1).approvePolicyUpdate(1)
      ).to.be.revertedWith("Already approved");
    });

    it("存在しないポリシーの更新提案はエラーになる", async function () {
      await expect(
        policyManager.connect(proposer).proposeUpdatePolicy(
          999, // 存在しないID
          3,
          ethers.parseEther("20"),
          172800,
          ZERO_HASH,
          ZERO_HASH
        )
      ).to.be.revertedWith("Policy does not exist");
    });
  });

  describe("Guardian緊急操作", function () {
    let policyId: bigint;

    beforeEach(async function () {
      const tx = await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        2,
        ethers.parseEther("10"),
        86400,
        ZERO_HASH,
        ZERO_HASH
      );
      const receipt = await tx.wait();
      const events = await policyManager.queryFilter(
        policyManager.filters.PolicyCreated(),
        receipt!.blockNumber
      );
      policyId = events[0].args.policyId;
    });

    it("Guardianが緊急更新を実行できる", async function () {
      const tx = await policyManager.connect(guardian).emergencyUpdatePolicy(
        policyId,
        5, // 新しいminApprovals
        ethers.parseEther("50"), // 新しいmaxAmount
        259200, // 新しいcooldownPeriod (3日)
        "セキュリティ上の理由"
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // ポリシーが即座に更新されているか確認
      const policy = await policyManager.getPolicy(policyId);
      expect(policy.minApprovals).to.equal(5);
      expect(policy.maxAmount).to.equal(ethers.parseEther("50"));
      expect(policy.cooldownPeriod).to.equal(259200);
    });

    it("Guardian以外は緊急更新できない", async function () {
      await expect(
        policyManager.connect(proposer).emergencyUpdatePolicy(
          policyId,
          5,
          ethers.parseEther("50"),
          259200,
          "test"
        )
      ).to.be.reverted;
    });
  });

  describe("ポリシー有効化・無効化", function () {
    let policyId: bigint;

    beforeEach(async function () {
      const tx = await policyManager.connect(admin).createPolicy(
        vaultAddress.address,
        2,
        ethers.parseEther("10"),
        86400,
        ZERO_HASH,
        ZERO_HASH
      );
      const receipt = await tx.wait();
      const events = await policyManager.queryFilter(
        policyManager.filters.PolicyCreated(),
        receipt!.blockNumber
      );
      policyId = events[0].args.policyId;
    });

    it("管理者がポリシーを無効化できる", async function () {
      await policyManager.connect(admin).disablePolicy(policyId);

      const policy = await policyManager.getPolicy(policyId);
      expect(policy.enabled).to.be.false;
    });

    it("管理者がポリシーを有効化できる", async function () {
      await policyManager.connect(admin).disablePolicy(policyId);
      await policyManager.connect(admin).enablePolicy(policyId);

      const policy = await policyManager.getPolicy(policyId);
      expect(policy.enabled).to.be.true;
    });

    it("無効化されたポリシーは更新提案できない", async function () {
      await policyManager.connect(admin).disablePolicy(policyId);

      await expect(
        policyManager.connect(proposer).proposeUpdatePolicy(
          policyId,
          3,
          ethers.parseEther("20"),
          172800,
          ZERO_HASH,
          ZERO_HASH
        )
      ).to.be.revertedWith("Policy is disabled");
    });

    it("管理者以外は有効化・無効化できない", async function () {
      await expect(
        policyManager.connect(proposer).disablePolicy(policyId)
      ).to.be.reverted;

      await expect(
        policyManager.connect(proposer).enablePolicy(policyId)
      ).to.be.reverted;
    });
  });

  describe("存在しないポリシーへのアクセス", function () {
    it("存在しないポリシーの取得でエラーになる", async function () {
      await expect(
        policyManager.getPolicy(999)
      ).to.be.revertedWith("Policy does not exist");
    });

    it("存在しないポリシーの有効化でエラーになる", async function () {
      await expect(
        policyManager.connect(admin).enablePolicy(999)
      ).to.be.revertedWith("Policy does not exist");
    });

    it("存在しないポリシーの無効化でエラーになる", async function () {
      await expect(
        policyManager.connect(admin).disablePolicy(999)
      ).to.be.revertedWith("Policy does not exist");
    });

    it("存在しないポリシーの緊急更新でエラーになる", async function () {
      await expect(
        policyManager.connect(guardian).emergencyUpdatePolicy(
          999,
          5,
          ethers.parseEther("50"),
          259200,
          "test"
        )
      ).to.be.revertedWith("Policy does not exist");
    });
  });
});
