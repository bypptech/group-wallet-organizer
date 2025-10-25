/**
 * Invite Service
 *
 * 招待トークン生成、EIP-712署名、失効管理
 */

import { getDatabase, invites, members, type NewInvite, type NewMember } from "../db/client.js";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

/**
 * EIP-712 Domain
 */
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * 招待メッセージ（EIP-712）
 */
export interface InviteMessage {
  vaultId: string;
  role: string;
  weight: number;
  expiresAt: number; // Unix timestamp
  nonce: string;
}

/**
 * InviteService クラス
 */
export class InviteService {
  private domain: EIP712Domain;

  constructor(chainId?: number, verifyingContract?: string) {
    this.domain = {
      name: "FamilyWallet",
      version: "1",
      chainId: chainId || parseInt(process.env.CHAIN_ID || "84532"),
      verifyingContract: verifyingContract || process.env.ESCROW_REGISTRY_ADDRESS || "0x0",
    };
  }

  /**
   * 招待トークン生成
   */
  generateInviteToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * ノンス生成
   */
  generateNonce(): string {
    return randomBytes(16).toString("hex");
  }

  /**
   * EIP-712 TypedData生成
   */
  generateTypedData(message: InviteMessage) {
    return {
      domain: this.domain,
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Invite: [
          { name: "vaultId", type: "bytes32" },
          { name: "role", type: "string" },
          { name: "weight", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "nonce", type: "string" },
        ],
      },
      primaryType: "Invite" as const,
      message,
    };
  }

  /**
   * 招待作成（署名付き）
   */
  async createInvite(
    vaultId: string,
    role: "owner" | "guardian" | "requester" | "viewer",
    createdBy: string,
    expiresAt: Date,
    signature: string,
    weight = 1,
    metadata?: Record<string, any>
  ) {
    const db = getDatabase();

    const token = this.generateInviteToken();

    const newInvite: NewInvite = {
      vaultId,
      token,
      role,
      weight,
      signature,
      expiresAt,
      createdBy,
      metadata,
    };

    const result = await db.insert(invites).values(newInvite).returning();
    return result[0];
  }

  /**
   * 招待取得（トークンで）
   */
  async getInviteByToken(token: string) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * 招待検証
   */
  async validateInvite(token: string): Promise<{
    valid: boolean;
    error?: string;
    invite?: any;
  }> {
    const invite = await this.getInviteByToken(token);

    if (!invite) {
      return { valid: false, error: "Invite not found" };
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return { valid: false, error: "Invite has expired", invite };
    }

    if (invite.usedAt) {
      return { valid: false, error: "Invite has already been used", invite };
    }

    return { valid: true, invite };
  }

  /**
   * 招待受諾
   */
  async acceptInvite(
    token: string,
    userAddress: string,
    userSignature: string
  ): Promise<{
    success: boolean;
    error?: string;
    member?: any;
  }> {
    const validation = await this.validateInvite(token);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const invite = validation.invite;
    const db = getDatabase();

    try {
      // TODO: ユーザー署名検証
      // EIP-712でユーザーが招待受諾に同意したことを検証

      // メンバーとして追加
      const newMember: NewMember = {
        vaultId: invite.vaultId,
        address: userAddress,
        role: invite.role,
        weight: invite.weight || 1,
        addedBy: invite.createdBy,
        metadata: {
          inviteToken: token,
          acceptedAt: new Date().toISOString(),
          userSignature,
        },
      };

      const memberResult = await db.insert(members).values(newMember).returning();

      // 招待を使用済みにする
      await db
        .update(invites)
        .set({
          usedAt: new Date(),
          usedBy: userAddress,
        })
        .where(eq(invites.id, invite.id));

      return {
        success: true,
        member: memberResult[0],
      };
    } catch (error) {
      console.error("Accept invite error:", error);

      // 既にメンバーの場合
      if (
        error instanceof Error &&
        error.message.includes("unique constraint")
      ) {
        return {
          success: false,
          error: "User is already a member of this vault",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to accept invite",
      };
    }
  }

  /**
   * 招待失効
   */
  async revokeInvite(inviteId: string, revokedBy: string) {
    const db = getDatabase();

    const result = await db
      .update(invites)
      .set({
        metadata: {
          revoked: true,
          revokedAt: new Date().toISOString(),
          revokedBy,
        },
      })
      .where(eq(invites.id, inviteId))
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * 期限切れ招待削除
   */
  async cleanupExpiredInvites() {
    const db = getDatabase();

    const result = await db
      .delete(invites)
      .where(
        and(
          gt(new Date(), invites.expiresAt),
          eq(invites.usedAt, null as any) // 未使用のもののみ
        )
      )
      .returning();

    return result;
  }

  /**
   * Vault別有効な招待一覧
   */
  async getActiveInvites(vaultId: string) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.vaultId, vaultId),
          gt(invites.expiresAt, new Date()),
          eq(invites.usedAt, null as any)
        )
      );

    return result;
  }

  /**
   * 招待統計
   */
  async getInviteStats(vaultId: string) {
    const db = getDatabase();

    const allInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.vaultId, vaultId));

    const now = new Date();

    const stats = {
      total: allInvites.length,
      active: allInvites.filter((i) => !i.usedAt && new Date(i.expiresAt) > now).length,
      used: allInvites.filter((i) => i.usedAt).length,
      expired: allInvites.filter((i) => !i.usedAt && new Date(i.expiresAt) <= now).length,
      byRole: {
        owner: allInvites.filter((i) => i.role === "owner").length,
        guardian: allInvites.filter((i) => i.role === "guardian").length,
        requester: allInvites.filter((i) => i.role === "requester").length,
        viewer: allInvites.filter((i) => i.role === "viewer").length,
      },
    };

    return stats;
  }

  /**
   * 招待URL生成
   */
  generateInviteUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.WEB_ORIGIN || "http://localhost:5174";
    return `${base}/invite/${token}`;
  }

  /**
   * QRコード用データ生成
   */
  generateQRData(token: string, baseUrl?: string): {
    url: string;
    data: string;
  } {
    const url = this.generateInviteUrl(token, baseUrl);
    return {
      url,
      data: JSON.stringify({
        type: "family_wallet_invite",
        token,
        url,
        version: "1.0",
      }),
    };
  }

  /**
   * 招待ハッシュ生成（重複チェック用）
   */
  generateInviteHash(vaultId: string, role: string, expiresAt: Date): string {
    const data = `${vaultId}-${role}-${expiresAt.toISOString()}`;
    return createHash("sha256").update(data).digest("hex");
  }
}

/**
 * シングルトンインスタンス
 */
let inviteServiceInstance: InviteService | null = null;

/**
 * InviteServiceインスタンス取得
 */
export function getInviteService(): InviteService {
  if (!inviteServiceInstance) {
    inviteServiceInstance = new InviteService();
  }
  return inviteServiceInstance;
}
