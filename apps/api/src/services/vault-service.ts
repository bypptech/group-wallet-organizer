/**
 * Vault Service
 *
 * Vault管理のためのサービスクラス
 * - Vault作成・取得・更新
 * - CAIP-10識別子サポート
 * - VaultFactory統合
 */

import {
  getDatabase,
  vaults,
  members,
  type NewVault,
  type Vault,
  type NewMember,
  type Member,
} from "../db/client.js";
import { eq, and, or, desc } from "drizzle-orm";
import { AuditService } from "./audit-service.js";
import type {
  Address,
  CAIP10Address,
  UUID,
  VaultIdentifier,
} from "@/packages/shared";
import {
  toCAIP10,
  parseCAIP10,
  createVaultIdentifier,
  validateVaultIdentifier,
} from "@/packages/shared";

/**
 * Vault作成パラメータ
 */
export interface CreateVaultParams {
  address: Address;
  chainId: number;
  uuid: UUID;
  name: string;
  description?: string;
  salt?: string;
  factoryAddress?: Address;
  owner: Address;
  ownerRole?: string;
}

/**
 * Vault検索パラメータ
 */
export interface VaultSearchParams {
  address?: Address;
  caip10?: CAIP10Address;
  uuid?: UUID;
  chainId?: number;
  owner?: Address;
}

/**
 * VaultService クラス
 */
export class VaultService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Vaultを作成
   */
  async createVault(params: CreateVaultParams): Promise<Vault> {
    const db = await getDatabase();

    // CAIP-10識別子を生成
    const caip10 = toCAIP10(params.chainId, params.address);

    // Vault作成
    const newVault: NewVault = {
      address: params.address,
      chainId: params.chainId,
      caip10,
      uuid: params.uuid,
      name: params.name,
      description: params.description,
      salt: params.salt,
      factoryAddress: params.factoryAddress,
    };

    const [vault] = await db.insert(vaults).values(newVault).returning();

    // Ownerをメンバーとして追加
    await this.addMember({
      vaultId: vault.id,
      address: params.owner,
      role: params.ownerRole || "owner",
      weight: 10,
      addedBy: params.owner,
    });

    // 監査ログ記録
    await this.auditService.log({
      vaultId: vault.id,
      actor: params.owner,
      action: "vault_created",
      resource: "vault",
      resourceId: params.address,
      data: {
        chainId: params.chainId,
        caip10,
        factoryAddress: params.factoryAddress,
      },
    });

    return vault;
  }

  /**
   * Vaultをアドレスで取得
   */
  async getVaultByAddress(
    address: Address,
    chainId?: number
  ): Promise<Vault | null> {
    const db = await getDatabase();

    const conditions = chainId
      ? and(eq(vaults.address, address), eq(vaults.chainId, chainId))
      : eq(vaults.address, address);

    const [vault] = await db
      .select()
      .from(vaults)
      .where(conditions!)
      .limit(1);

    return vault || null;
  }

  /**
   * VaultをCAIP-10識別子で取得
   */
  async getVaultByCAIP10(caip10: CAIP10Address): Promise<Vault | null> {
    const db = await getDatabase();

    const [vault] = await db
      .select()
      .from(vaults)
      .where(eq(vaults.caip10, caip10))
      .limit(1);

    return vault || null;
  }

  /**
   * VaultをUUIDで取得
   */
  async getVaultByUUID(uuid: UUID): Promise<Vault | null> {
    const db = await getDatabase();

    const [vault] = await db
      .select()
      .from(vaults)
      .where(eq(vaults.uuid, uuid))
      .limit(1);

    return vault || null;
  }

  /**
   * Vaultを検索（複数条件）
   */
  async searchVaults(params: VaultSearchParams): Promise<Vault[]> {
    const db = await getDatabase();

    const conditions = [];

    if (params.address) {
      conditions.push(eq(vaults.address, params.address));
    }
    if (params.caip10) {
      conditions.push(eq(vaults.caip10, params.caip10));
    }
    if (params.uuid) {
      conditions.push(eq(vaults.uuid, params.uuid));
    }
    if (params.chainId) {
      conditions.push(eq(vaults.chainId, params.chainId));
    }

    if (conditions.length === 0) {
      return [];
    }

    const result = await db
      .select()
      .from(vaults)
      .where(or(...conditions))
      .orderBy(desc(vaults.createdAt));

    return result;
  }

  /**
   * ユーザーが所属するVaultを取得
   */
  async getVaultsByUser(
    userAddress: Address,
    chainId?: number
  ): Promise<Vault[]> {
    const db = await getDatabase();

    let query = db
      .select({ vault: vaults })
      .from(members)
      .innerJoin(vaults, eq(members.vaultId, vaults.id))
      .where(eq(members.address, userAddress));

    if (chainId) {
      query = query.where(eq(vaults.chainId, chainId));
    }

    const result = await query.orderBy(desc(vaults.createdAt));

    return result.map((r) => r.vault);
  }

  /**
   * VaultIdentifierを作成
   */
  createVaultIdentifier(vault: Vault): VaultIdentifier {
    return createVaultIdentifier(
      vault.address as Address,
      vault.chainId,
      vault.uuid,
      vault.name,
      {
        salt: vault.salt as `0x${string}` | undefined,
        factoryAddress: vault.factoryAddress as Address | undefined,
      }
    );
  }

  /**
   * Vaultを更新
   */
  async updateVault(
    vaultId: string,
    updates: {
      name?: string;
      description?: string;
      policyId?: string;
    },
    actor: Address
  ): Promise<Vault> {
    const db = await getDatabase();

    const [updatedVault] = await db
      .update(vaults)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(vaults.id, vaultId))
      .returning();

    // 監査ログ記録
    await this.auditService.log({
      vaultId,
      actor,
      action: "vault_updated",
      resource: "vault",
      resourceId: updatedVault.address,
      data: updates,
    });

    return updatedVault;
  }

  /**
   * メンバーを追加
   */
  async addMember(params: {
    vaultId: string;
    address: Address;
    role: string;
    weight?: number;
    addedBy: Address;
  }): Promise<Member> {
    const db = await getDatabase();

    const newMember: NewMember = {
      vaultId: params.vaultId,
      address: params.address,
      role: params.role,
      weight: params.weight || 1,
      addedBy: params.addedBy,
    };

    const [member] = await db.insert(members).values(newMember).returning();

    // 監査ログ記録
    await this.auditService.log({
      vaultId: params.vaultId,
      actor: params.addedBy,
      action: "member_added",
      resource: "member",
      resourceId: params.address,
      data: {
        role: params.role,
        weight: params.weight,
      },
    });

    return member;
  }

  /**
   * メンバーを取得
   */
  async getMembers(vaultId: string): Promise<Member[]> {
    const db = await getDatabase();

    const result = await db
      .select()
      .from(members)
      .where(eq(members.vaultId, vaultId))
      .orderBy(desc(members.addedAt));

    return result;
  }

  /**
   * メンバーの権限確認
   */
  async isMember(vaultId: string, address: Address): Promise<boolean> {
    const db = await getDatabase();

    const [member] = await db
      .select()
      .from(members)
      .where(and(eq(members.vaultId, vaultId), eq(members.address, address)))
      .limit(1);

    return !!member;
  }

  /**
   * メンバーの役割確認
   */
  async getMemberRole(
    vaultId: string,
    address: Address
  ): Promise<string | null> {
    const db = await getDatabase();

    const [member] = await db
      .select()
      .from(members)
      .where(and(eq(members.vaultId, vaultId), eq(members.address, address)))
      .limit(1);

    return member?.role || null;
  }

  /**
   * メンバーを削除
   */
  async removeMember(
    vaultId: string,
    address: Address,
    actor: Address
  ): Promise<void> {
    const db = await getDatabase();

    await db
      .delete(members)
      .where(and(eq(members.vaultId, vaultId), eq(members.address, address)));

    // 監査ログ記録
    await this.auditService.log({
      vaultId,
      actor,
      action: "member_removed",
      resource: "member",
      resourceId: address,
      data: {},
    });
  }

  /**
   * Chain IDでVaultを取得
   */
  async getVaultsByChainId(chainId: number): Promise<Vault[]> {
    const db = await getDatabase();

    const result = await db
      .select()
      .from(vaults)
      .where(eq(vaults.chainId, chainId))
      .orderBy(desc(vaults.createdAt));

    return result;
  }

  /**
   * Vaultの統計情報を取得
   */
  async getVaultStats(vaultId: string): Promise<{
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const db = await getDatabase();

    const [vault] = await db
      .select()
      .from(vaults)
      .where(eq(vaults.id, vaultId))
      .limit(1);

    if (!vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    const membersList = await this.getMembers(vaultId);

    return {
      memberCount: membersList.length,
      createdAt: vault.createdAt,
      updatedAt: vault.updatedAt,
    };
  }
}
