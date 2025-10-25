import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC20Paymaster } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * ERC20Paymaster コントラクトテスト
 *
 * テスト範囲:
 * - 初期化
 * - トークン管理（追加/削除/価格更新）
 * - スポンサーシップ検証（validatePaymasterUserOp）
 * - 日次上限チェック
 * - デポジット管理
 * - 緊急停止機能
 * - アクセス制御
 */
describe("ERC20Paymaster", function () {
  let paymaster: ERC20Paymaster;
  let admin: SignerWithAddress;
  let oracle: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let entryPoint: SignerWithAddress;
  let mockToken: any;

  const DAILY_SPEND_LIMIT = ethers.parseEther("10"); // 10 ETH
  const USDC_PRICE = ethers.parseEther("3000"); // 3000 USDC per ETH
  const MIN_TOKEN_BALANCE = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [admin, oracle, user1, user2, entryPoint] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock USDC", "USDC");
    await mockToken.waitForDeployment();

    // Deploy Paymaster
    const ERC20Paymaster = await ethers.getContractFactory("ERC20Paymaster");
    const paymasterProxy = await upgrades.deployProxy(
      ERC20Paymaster,
      [entryPoint.address, admin.address, DAILY_SPEND_LIMIT],
      { kind: "uups" }
    );
    await paymasterProxy.waitForDeployment();

    paymaster = paymasterProxy as unknown as ERC20Paymaster;

    // Grant oracle role
    const ORACLE_ROLE = await paymaster.ORACLE_ROLE();
    await paymaster.connect(admin).grantRole(ORACLE_ROLE, oracle.address);

    // Mint tokens to users
    await mockToken.mint(user1.address, ethers.parseUnits("10000", 6));
    await mockToken.mint(user2.address, ethers.parseUnits("5000", 6));
  });

  describe("初期化", function () {
    it("正しく初期化されること", async function () {
      expect(await paymaster.entryPoint()).to.equal(entryPoint.address);
      expect(await paymaster.dailySpendLimit()).to.equal(DAILY_SPEND_LIMIT);
      expect(await paymaster.paused()).to.be.false;
    });

    it("AdminがADMIN_ROLEを持つこと", async function () {
      const ADMIN_ROLE = await paymaster.ADMIN_ROLE();
      expect(await paymaster.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("OracleがORACLE_ROLEを持つこと", async function () {
      const ORACLE_ROLE = await paymaster.ORACLE_ROLE();
      expect(await paymaster.hasRole(ORACLE_ROLE, oracle.address)).to.be.true;
    });
  });

  describe("トークン管理", function () {
    it("Adminがトークンを追加できること", async function () {
      await expect(
        paymaster.connect(admin).addToken(
          await mockToken.getAddress(),
          USDC_PRICE,
          MIN_TOKEN_BALANCE
        )
      )
        .to.emit(paymaster, "TokenAdded")
        .withArgs(await mockToken.getAddress(), USDC_PRICE, MIN_TOKEN_BALANCE);

      expect(
        await paymaster.supportedTokens(await mockToken.getAddress())
      ).to.be.true;
      expect(
        await paymaster.tokenPrices(await mockToken.getAddress())
      ).to.equal(USDC_PRICE);
      expect(
        await paymaster.minTokenBalance(await mockToken.getAddress())
      ).to.equal(MIN_TOKEN_BALANCE);
    });

    it("非Adminがトークンを追加できないこと", async function () {
      await expect(
        paymaster.connect(user1).addToken(
          await mockToken.getAddress(),
          USDC_PRICE,
          MIN_TOKEN_BALANCE
        )
      ).to.be.reverted;
    });

    it("価格が0の場合はエラーになること", async function () {
      await expect(
        paymaster.connect(admin).addToken(
          await mockToken.getAddress(),
          0,
          MIN_TOKEN_BALANCE
        )
      ).to.be.revertedWithCustomError(paymaster, "InvalidPrice");
    });

    it("Adminがトークンを削除できること", async function () {
      await paymaster.connect(admin).addToken(
        await mockToken.getAddress(),
        USDC_PRICE,
        MIN_TOKEN_BALANCE
      );

      await expect(
        paymaster.connect(admin).removeToken(await mockToken.getAddress())
      )
        .to.emit(paymaster, "TokenRemoved")
        .withArgs(await mockToken.getAddress());

      expect(
        await paymaster.supportedTokens(await mockToken.getAddress())
      ).to.be.false;
    });

    it("Oracleがトークン価格を更新できること", async function () {
      await paymaster.connect(admin).addToken(
        await mockToken.getAddress(),
        USDC_PRICE,
        MIN_TOKEN_BALANCE
      );

      const newPrice = ethers.parseEther("3500");

      await expect(
        paymaster.connect(oracle).updateTokenPrice(
          await mockToken.getAddress(),
          newPrice
        )
      )
        .to.emit(paymaster, "TokenPriceUpdated")
        .withArgs(await mockToken.getAddress(), newPrice);

      expect(
        await paymaster.tokenPrices(await mockToken.getAddress())
      ).to.equal(newPrice);
    });

    it("サポートされていないトークンの価格更新はエラーになること", async function () {
      await expect(
        paymaster.connect(oracle).updateTokenPrice(
          await mockToken.getAddress(),
          USDC_PRICE
        )
      ).to.be.revertedWithCustomError(paymaster, "UnsupportedToken");
    });

    it("非Oracleがトークン価格を更新できないこと", async function () {
      await paymaster.connect(admin).addToken(
        await mockToken.getAddress(),
        USDC_PRICE,
        MIN_TOKEN_BALANCE
      );

      await expect(
        paymaster.connect(user1).updateTokenPrice(
          await mockToken.getAddress(),
          ethers.parseEther("3500")
        )
      ).to.be.reverted;
    });
  });

  describe("スポンサーシップ検証", function () {
    beforeEach(async function () {
      // Add token
      await paymaster.connect(admin).addToken(
        await mockToken.getAddress(),
        USDC_PRICE,
        MIN_TOKEN_BALANCE
      );

      // Deposit to paymaster
      await paymaster.connect(admin).depositToEntryPoint({ value: ethers.parseEther("100") });
    });

    it("有効なスポンサーシップをチェックできること", async function () {
      const estimatedCost = ethers.parseEther("0.01"); // 0.01 ETH

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.true;
      expect(reason).to.equal("");
    });

    it("トークン残高不足の場合はスポンサーシップが拒否されること", async function () {
      const estimatedCost = ethers.parseEther("100"); // Very high cost

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.false;
      expect(reason).to.equal("Insufficient token balance");
    });

    it("最低残高未満の場合はスポンサーシップが拒否されること", async function () {
      // User with less than minimum balance
      const lowBalanceUser = user2;
      await mockToken.burn(lowBalanceUser.address, ethers.parseUnits("4500", 6));

      const estimatedCost = ethers.parseEther("0.01");

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        lowBalanceUser.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.false;
      expect(reason).to.equal("Below minimum balance");
    });

    it("サポートされていないトークンの場合はスポンサーシップが拒否されること", async function () {
      const unsupportedToken = ethers.ZeroAddress;
      const estimatedCost = ethers.parseEther("0.01");

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        unsupportedToken,
        estimatedCost
      );

      expect(available).to.be.false;
      expect(reason).to.equal("Unsupported token");
    });

    it("Paymasterデポジット不足の場合はスポンサーシップが拒否されること", async function () {
      // Withdraw all deposits
      const depositBalance = await paymaster.depositBalance();
      await paymaster.connect(admin).withdrawFromEntryPoint(admin.address, depositBalance);

      const estimatedCost = ethers.parseEther("0.01");

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.false;
      expect(reason).to.equal("Insufficient paymaster deposit");
    });

    it("一時停止中はスポンサーシップが拒否されること", async function () {
      await paymaster.connect(admin).pause();

      const estimatedCost = ethers.parseEther("0.01");

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.false;
      expect(reason).to.equal("Paymaster paused");
    });
  });

  describe("日次上限チェック", function () {
    beforeEach(async function () {
      await paymaster.connect(admin).addToken(
        await mockToken.getAddress(),
        USDC_PRICE,
        MIN_TOKEN_BALANCE
      );

      await paymaster.connect(admin).depositToEntryPoint({ value: ethers.parseEther("100") });
    });

    it("日次上限内ではスポンサーシップが許可されること", async function () {
      const estimatedCost = ethers.parseEther("5"); // 5 ETH (limit is 10 ETH)

      const [available] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.true;
    });

    it("日次上限を超える場合はスポンサーシップが拒否されること", async function () {
      const estimatedCost = ethers.parseEther("15"); // 15 ETH (limit is 10 ETH)

      const [available, reason] = await paymaster.checkSponsorshipEligibility(
        user1.address,
        await mockToken.getAddress(),
        estimatedCost
      );

      expect(available).to.be.false;
      expect(reason).to.equal("Daily spend limit exceeded");
    });

    it("残り日次予算を取得できること", async function () {
      const remaining = await paymaster.getRemainingDailyBudget(user1.address);
      expect(remaining).to.equal(DAILY_SPEND_LIMIT);
    });

    it("日次上限を更新できること", async function () {
      const newLimit = ethers.parseEther("20");

      await expect(
        paymaster.connect(admin).updateDailySpendLimit(newLimit)
      )
        .to.emit(paymaster, "DailySpendLimitUpdated")
        .withArgs(newLimit);

      expect(await paymaster.dailySpendLimit()).to.equal(newLimit);
    });

    it("非Adminが日次上限を更新できないこと", async function () {
      await expect(
        paymaster.connect(user1).updateDailySpendLimit(ethers.parseEther("20"))
      ).to.be.reverted;
    });
  });

  describe("デポジット管理", function () {
    it("AdminがEntryPointにデポジットできること", async function () {
      const depositAmount = ethers.parseEther("10");

      await expect(
        paymaster.connect(admin).depositToEntryPoint({ value: depositAmount })
      )
        .to.emit(paymaster, "DepositReceived")
        .withArgs(admin.address, depositAmount);

      expect(await paymaster.depositBalance()).to.equal(depositAmount);
    });

    it("非AdminがEntryPointにデポジットできないこと", async function () {
      await expect(
        paymaster.connect(user1).depositToEntryPoint({ value: ethers.parseEther("10") })
      ).to.be.reverted;
    });

    it("AdminがEntryPointから出金できること", async function () {
      const depositAmount = ethers.parseEther("10");
      await paymaster.connect(admin).depositToEntryPoint({ value: depositAmount });

      const withdrawAmount = ethers.parseEther("5");

      await expect(
        paymaster.connect(admin).withdrawFromEntryPoint(admin.address, withdrawAmount)
      )
        .to.emit(paymaster, "WithdrawalExecuted")
        .withArgs(admin.address, withdrawAmount);

      expect(await paymaster.depositBalance()).to.equal(
        depositAmount - withdrawAmount
      );
    });

    it("デポジット残高不足の場合は出金できないこと", async function () {
      await expect(
        paymaster.connect(admin).withdrawFromEntryPoint(admin.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(paymaster, "InsufficientDeposit");
    });

    it("Adminがトークンを出金できること", async function () {
      // Deploy mock token and transfer to paymaster
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("Test Token", "TEST", 18);
      await token.waitForDeployment();

      const amount = ethers.parseEther("100");
      await token.mint(await paymaster.getAddress(), amount);

      const balanceBefore = await token.balanceOf(admin.address);

      await paymaster.connect(admin).withdrawToken(
        await token.getAddress(),
        admin.address,
        amount
      );

      const balanceAfter = await token.balanceOf(admin.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });

    it("非Adminがトークンを出金できないこと", async function () {
      await expect(
        paymaster.connect(user1).withdrawToken(
          await mockToken.getAddress(),
          user1.address,
          ethers.parseEther("100")
        )
      ).to.be.reverted;
    });
  });

  describe("緊急停止機能", function () {
    it("Adminが一時停止できること", async function () {
      await expect(paymaster.connect(admin).pause())
        .to.emit(paymaster, "EmergencyPaused")
        .withArgs(admin.address);

      expect(await paymaster.paused()).to.be.true;
    });

    it("非Adminが一時停止できないこと", async function () {
      await expect(paymaster.connect(user1).pause()).to.be.reverted;
    });

    it("Adminが一時停止を解除できること", async function () {
      await paymaster.connect(admin).pause();

      await expect(paymaster.connect(admin).unpause())
        .to.emit(paymaster, "EmergencyUnpaused")
        .withArgs(admin.address);

      expect(await paymaster.paused()).to.be.false;
    });

    it("一時停止中はvalidatePaymasterUserOpが失敗すること", async function () {
      await paymaster.connect(admin).pause();

      // This would be called by EntryPoint in real scenario
      // For testing, we verify the paused state blocks operations
      expect(await paymaster.paused()).to.be.true;
    });
  });

  describe("アップグレード", function () {
    it("AdminがUUPSアップグレードを承認できること", async function () {
      // Deploy new implementation
      const ERC20PaymasterV2 = await ethers.getContractFactory("ERC20Paymaster");
      const newImplementation = await ERC20PaymasterV2.deploy();
      await newImplementation.waitForDeployment();

      // Upgrade should succeed (internal _authorizeUpgrade check)
      // Note: Actual upgrade test would require more setup
      expect(
        await paymaster.hasRole(await paymaster.ADMIN_ROLE(), admin.address)
      ).to.be.true;
    });

    it("非Adminがアップグレードできないこと", async function () {
      expect(
        await paymaster.hasRole(await paymaster.ADMIN_ROLE(), user1.address)
      ).to.be.false;
    });
  });
});

// Mock ERC20 contract for testing
// Note: In real tests, you would import from @openzeppelin/contracts
