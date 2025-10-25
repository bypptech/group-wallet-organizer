/**
 * Paymaster API Routes
 *
 * エンドポイント:
 * - POST /paymaster/sponsor - スポンサーシップリクエスト
 * - GET /paymaster/eligibility - スポンサーシップ資格チェック
 * - GET /paymaster/balance - Paymasterトークン残高取得
 */

import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

const sponsorRequestSchema = z.object({
  userOp: z.object({
    sender: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    nonce: z.string(),
    initCode: z.string(),
    callData: z.string(),
    callGasLimit: z.string(),
    verificationGasLimit: z.string(),
    preVerificationGas: z.string(),
    maxFeePerGas: z.string(),
    maxPriorityFeePerGas: z.string(),
    paymasterAndData: z.string(),
    signature: z.string(),
  }),
  entryPoint: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.enum(["USDC", "JPYC"]).optional(),
  vaultId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});

const eligibilityCheckSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.enum(["USDC", "JPYC"]),
  vaultId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * POST /paymaster/sponsor
 * スポンサーシップリクエスト
 *
 * UserOperationに対してPaymasterがガス代をスポンサーするための署名を生成
 */
app.post("/sponsor", async (c) => {
  try {
    const body = await c.req.json();
    const validated = sponsorRequestSchema.parse(body);

    // TODO: 実際のPaymaster実装
    // 1. UserOperationを検証
    // 2. スポンサーシップ資格をチェック（残高、日次上限等）
    // 3. Paymaster署名を生成
    // 4. paymasterAndData を構築して返す

    // 環境変数からPaymaster設定を取得
    const paymasterAddress = process.env.PAYMASTER_ADDRESS;
    const bundlerUrl = process.env.BUNDLER_URL;

    if (!paymasterAddress) {
      return c.json(
        { error: "Paymaster not configured" },
        503
      );
    }

    // モック実装 - 実際のPaymaster連携は別途実装
    // Pimlico、Alchemy、Biconomy等のPaymaster APIと連携する
    const mockPaymasterAndData = `${paymasterAddress}${"0".repeat(130)}`; // Mock data

    return c.json({
      paymasterAndData: mockPaymasterAndData,
      preVerificationGas: validated.userOp.preVerificationGas,
      verificationGasLimit: validated.userOp.verificationGasLimit,
      callGasLimit: validated.userOp.callGasLimit,
      sponsored: true,
      sponsor: paymasterAddress,
    });
  } catch (error) {
    console.error("Sponsor request error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to sponsor transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /paymaster/eligibility
 * スポンサーシップ資格チェック
 *
 * ユーザーがPaymasterを使用できるかをチェック
 */
app.get("/eligibility", async (c) => {
  try {
    const userAddress = c.req.query("userAddress");
    const token = c.req.query("token");
    const vaultId = c.req.query("vaultId");

    if (!userAddress || !token) {
      return c.json(
        { error: "userAddress and token are required" },
        400
      );
    }

    const validated = eligibilityCheckSchema.parse({
      userAddress,
      token,
      vaultId,
    });

    // TODO: 実際の資格チェック実装
    // 1. トークン残高チェック
    // 2. 日次上限チェック
    // 3. Vaultメンバーシップチェック（vaultIdが指定されている場合）

    // モック実装
    const eligible = true;
    const reason = eligible ? "Sufficient balance" : "Insufficient balance";

    return c.json({
      eligible,
      reason,
      userAddress: validated.userAddress,
      token: validated.token,
      vaultId: validated.vaultId,
    });
  } catch (error) {
    console.error("Eligibility check error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to check eligibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /paymaster/balance
 * Paymasterトークン残高取得
 *
 * Paymasterが保有するトークン残高を取得
 */
app.get("/balance", async (c) => {
  try {
    const token = c.req.query("token");

    if (!token) {
      return c.json({ error: "token is required" }, 400);
    }

    if (token !== "USDC" && token !== "JPYC") {
      return c.json({ error: "Invalid token. Must be USDC or JPYC" }, 400);
    }

    // TODO: 実際の残高取得実装
    // 1. オンチェーンからPaymasterのトークン残高を取得
    // 2. ERC20.balanceOf(paymasterAddress)を呼び出し

    // モック実装
    const mockBalance = {
      USDC: "1000000000", // 1,000 USDC (6 decimals)
      JPYC: "1000000000000000000000", // 1,000 JPYC (18 decimals)
    };

    return c.json({
      token,
      balance: mockBalance[token as "USDC" | "JPYC"],
      decimals: token === "USDC" ? 6 : 18,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return c.json(
      {
        error: "Failed to get balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /paymaster/estimate
 * ガス代見積もり
 *
 * UserOperationのガス代をトークン換算で見積もる
 */
app.post("/estimate", async (c) => {
  try {
    const body = await c.req.json();

    const estimateSchema = z.object({
      userOp: z.object({
        callGasLimit: z.string(),
        verificationGasLimit: z.string(),
        preVerificationGas: z.string(),
        maxFeePerGas: z.string(),
      }),
      token: z.enum(["USDC", "JPYC"]),
    });

    const validated = estimateSchema.parse(body);

    // TODO: 実際のガス見積もり実装
    // 1. ガスコスト計算
    // 2. トークン換算（Oracle価格参照）

    // モック実装
    const totalGas =
      BigInt(validated.userOp.callGasLimit) +
      BigInt(validated.userOp.verificationGasLimit) +
      BigInt(validated.userOp.preVerificationGas);

    const gasCostInETH = totalGas * BigInt(validated.userOp.maxFeePerGas);

    // Mock price: 1 ETH = 2000 USDC or 300000 JPYC
    const tokenAmount =
      validated.token === "USDC"
        ? (gasCostInETH * BigInt(2000)) / BigInt(10 ** 18)
        : (gasCostInETH * BigInt(300000)) / BigInt(10 ** 18);

    return c.json({
      token: validated.token,
      estimatedCost: tokenAmount.toString(),
      gasUsed: totalGas.toString(),
      gasPriceWei: validated.userOp.maxFeePerGas,
    });
  } catch (error) {
    console.error("Estimate error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to estimate cost",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
