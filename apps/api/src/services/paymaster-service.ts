/**
 * Paymaster Service
 *
 * Sponsorshipリクエスト処理、トークン残高チェック、fallback処理
 */

import { createPublicClient, http, type Address, type Hash } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * UserOperation（ERC-4337）
 */
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hash;
  callData: Hash;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hash;
  signature: Hash;
}

/**
 * Sponsorshipリクエスト
 */
export interface SponsorshipRequest {
  userOp: Partial<UserOperation>;
  entryPoint: Address;
  token?: "USDC" | "JPYC";
  vaultId?: string;
}

/**
 * Sponsorshipレスポンス
 */
export interface SponsorshipResponse {
  paymasterAndData: Hash;
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  sponsored: boolean;
  sponsor?: Address;
  estimatedCost?: string;
}

/**
 * トークン価格情報
 */
interface TokenPrice {
  token: string;
  priceInETH: bigint; // Wei単位
  decimals: number;
}

/**
 * PaymasterService クラス
 */
export class PaymasterService {
  private publicClient: ReturnType<typeof createPublicClient>;
  private paymasterAddress: Address;
  private bundlerUrl: string;

  // トークン価格キャッシュ（本番環境ではOracle使用）
  private tokenPrices: Map<string, TokenPrice> = new Map([
    [
      "USDC",
      {
        token: "USDC",
        priceInETH: BigInt("500000000000000"), // 0.0005 ETH per USDC (mock)
        decimals: 6,
      },
    ],
    [
      "JPYC",
      {
        token: "JPYC",
        priceInETH: BigInt("3333333333333"), // ~0.0000033 ETH per JPYC (mock)
        decimals: 18,
      },
    ],
  ]);

  constructor(paymasterAddress?: Address, bundlerUrl?: string, rpcUrl?: string) {
    this.paymasterAddress =
      paymasterAddress || (process.env.PAYMASTER_ADDRESS as Address) || "0x0";
    this.bundlerUrl = bundlerUrl || process.env.BUNDLER_URL || "";

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl || process.env.RPC_URL),
    });
  }

  /**
   * Sponsorshipリクエスト処理
   */
  async requestSponsorship(
    request: SponsorshipRequest
  ): Promise<SponsorshipResponse | null> {
    try {
      // 1. 資格チェック
      const eligible = await this.checkEligibility(
        request.userOp.sender!,
        request.token || "USDC",
        request.vaultId
      );

      if (!eligible.eligible) {
        console.log("Sponsorship not eligible:", eligible.reason);
        return null;
      }

      // 2. ガス見積もり
      const gasEstimate = await this.estimateGas(request.userOp);

      // 3. PaymasterAndData生成
      const paymasterAndData = this.buildPaymasterAndData(
        request.token || "USDC",
        gasEstimate.maxCost
      );

      // 4. レスポンス構築
      return {
        paymasterAndData,
        preVerificationGas: gasEstimate.preVerificationGas,
        verificationGasLimit: gasEstimate.verificationGasLimit,
        callGasLimit: gasEstimate.callGasLimit,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        sponsored: true,
        sponsor: this.paymasterAddress,
        estimatedCost: gasEstimate.estimatedCost,
      };
    } catch (error) {
      console.error("Sponsorship request failed:", error);
      return null;
    }
  }

  /**
   * 資格チェック
   */
  async checkEligibility(
    userAddress: Address,
    token: "USDC" | "JPYC",
    vaultId?: string
  ): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      // TODO: 実際のチェック実装
      // 1. トークン残高チェック
      // 2. 日次上限チェック
      // 3. Vaultメンバーシップチェック

      // モック実装
      const hasBalance = await this.checkTokenBalance(userAddress, token);
      if (!hasBalance) {
        return {
          eligible: false,
          reason: `Insufficient ${token} balance`,
        };
      }

      return {
        eligible: true,
      };
    } catch (error) {
      console.error("Eligibility check failed:", error);
      return {
        eligible: false,
        reason: "Eligibility check failed",
      };
    }
  }

  /**
   * トークン残高チェック
   */
  private async checkTokenBalance(
    userAddress: Address,
    token: "USDC" | "JPYC"
  ): Promise<boolean> {
    // TODO: 実際のERC20残高チェック
    // const tokenAddress = this.getTokenAddress(token);
    // const balance = await this.publicClient.readContract({
    //   address: tokenAddress,
    //   abi: erc20Abi,
    //   functionName: 'balanceOf',
    //   args: [userAddress],
    // });

    // モック実装
    return true;
  }

  /**
   * ガス見積もり
   */
  private async estimateGas(userOp: Partial<UserOperation>): Promise<{
    preVerificationGas: bigint;
    verificationGasLimit: bigint;
    callGasLimit: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    maxCost: bigint;
    estimatedCost: string;
  }> {
    // TODO: 実際のガス見積もり（Bundler APIまたはeth_estimateUserOperationGas）

    // モック実装
    const preVerificationGas = BigInt(21000);
    const verificationGasLimit = BigInt(100000);
    const callGasLimit = BigInt(200000);

    // 現在のガス価格取得
    const gasPrice = await this.publicClient.getGasPrice();
    const maxFeePerGas = (gasPrice * BigInt(120)) / BigInt(100); // 20% buffer
    const maxPriorityFeePerGas = (gasPrice * BigInt(10)) / BigInt(100); // 10%

    const maxCost =
      (preVerificationGas + verificationGasLimit + callGasLimit) * maxFeePerGas;

    return {
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      maxCost,
      estimatedCost: maxCost.toString(),
    };
  }

  /**
   * PaymasterAndData構築
   */
  private buildPaymasterAndData(token: "USDC" | "JPYC", maxCost: bigint): Hash {
    // PaymasterAndData format:
    // [paymasterAddress: 20 bytes][token: 20 bytes][maxCost: 32 bytes][signature: 65 bytes]

    // TODO: 実際の署名生成
    // const tokenAddress = this.getTokenAddress(token);
    // const signature = await this.signPaymasterData(...);

    // モック実装
    const mockSignature = "0x" + "0".repeat(130); // 65 bytes signature
    return (this.paymasterAddress + mockSignature.slice(2)) as Hash;
  }

  /**
   * トークン換算ガスコスト計算
   */
  async calculateTokenCost(
    gasCostInWei: bigint,
    token: "USDC" | "JPYC"
  ): Promise<{
    token: string;
    amount: bigint;
    formatted: string;
  }> {
    const price = this.tokenPrices.get(token);
    if (!price) {
      throw new Error(`Token price not found: ${token}`);
    }

    // Token amount = (gasCostInWei / priceInETH) * 10^decimals
    const tokenAmount = (gasCostInWei * BigInt(10 ** price.decimals)) / price.priceInETH;

    // Format for display
    const formatted =
      (Number(tokenAmount) / 10 ** price.decimals).toFixed(price.decimals) + ` ${token}`;

    return {
      token,
      amount: tokenAmount,
      formatted,
    };
  }

  /**
   * Paymaster残高取得
   */
  async getPaymasterBalance(token?: "USDC" | "JPYC"): Promise<{
    token?: string;
    balance: bigint;
    formatted: string;
  }> {
    if (token) {
      // TODO: ERC20残高取得
      // const tokenAddress = this.getTokenAddress(token);
      // const balance = await this.publicClient.readContract({...});

      // モック実装
      const mockBalances = {
        USDC: BigInt("1000000000"), // 1,000 USDC
        JPYC: BigInt("1000000000000000000000"), // 1,000 JPYC
      };

      const balance = mockBalances[token];
      const decimals = this.tokenPrices.get(token)!.decimals;
      const formatted = (Number(balance) / 10 ** decimals).toFixed(2) + ` ${token}`;

      return { token, balance, formatted };
    } else {
      // ETH残高取得
      const balance = await this.publicClient.getBalance({
        address: this.paymasterAddress,
      });

      const formatted = (Number(balance) / 10 ** 18).toFixed(4) + " ETH";

      return { balance, formatted };
    }
  }

  /**
   * Sponsorship統計
   */
  async getSponsorshipStats(vaultId?: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    totalCost: bigint;
    averageCost: bigint;
  }> {
    // TODO: データベースから統計取得

    // モック実装
    return {
      total: 100,
      successful: 95,
      failed: 5,
      totalCost: BigInt("50000000000000000"), // 0.05 ETH
      averageCost: BigInt("500000000000000"), // 0.0005 ETH
    };
  }

  /**
   * Fallback処理（Paymaster失敗時）
   */
  async handleFallback(
    userOp: Partial<UserOperation>,
    error: Error
  ): Promise<SponsorshipResponse | null> {
    console.log("Handling fallback for sponsorship failure:", error.message);

    // Fallback options:
    // 1. ユーザー自身のETHで支払う（paymasterAndData = "0x"）
    // 2. 別のPaymasterを試す
    // 3. トランザクションを遅延させる

    // ここではユーザー自身のETHで支払うオプションを返す
    const gasEstimate = await this.estimateGas(userOp);

    return {
      paymasterAndData: "0x" as Hash,
      preVerificationGas: gasEstimate.preVerificationGas,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      callGasLimit: gasEstimate.callGasLimit,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      sponsored: false,
      estimatedCost: gasEstimate.estimatedCost,
    };
  }
}

/**
 * シングルトンインスタンス
 */
let paymasterServiceInstance: PaymasterService | null = null;

/**
 * PaymasterServiceインスタンス取得
 */
export function getPaymasterService(): PaymasterService {
  if (!paymasterServiceInstance) {
    paymasterServiceInstance = new PaymasterService();
  }
  return paymasterServiceInstance;
}
