# ID設計改良 変更仕様書

**対象プロジェクト**: Family Wallet
**変更種別**: アーキテクチャ改善
**影響範囲**: スマートコントラクト、データベース、API、フロントエンド
**優先度**: 高（Phase 11 - 本番デプロイ前に実施推奨）
**作成日**: 2025-10-12
**バージョン**: 1.0

---

## 📋 目次

1. [変更の背景と目的](#1-変更の背景と目的)
2. [現状の問題点](#2-現状の問題点)
3. [改良後の設計](#3-改良後の設計)
4. [変更内容の詳細](#4-変更内容の詳細)
5. [実装タスク](#5-実装タスク)
6. [テスト計画](#6-テスト計画)
7. [マイグレーション計画](#7-マイグレーション計画)
8. [ロールバック計画](#8-ロールバック計画)

---

## 1. 変更の背景と目的

### 背景

dAppsにおけるID・識別データ設計のベストプラクティスに基づき、現在の Family Wallet の ID 管理を見直した結果、以下の課題が判明しました：

1. **型の不一致**: `bytes32 vaultId` と `address vaultAddress` が混在
2. **マルチチェーン非対応**: chain_id の欠如
3. **CREATE2未実装**: UUID→address の決定的変換なし
4. **セッション管理不在**: CSRF対策・署名フロー追跡が困難
5. **ガス非効率**: 32 bytes (bytes32) vs 20 bytes (address)

### 目的

- ✅ **型安全性の向上**: address型への統一
- ✅ **マルチチェーン対応**: CAIP-10標準準拠
- ✅ **決定的デプロイ**: CREATE2によるUUID→address変換
- ✅ **セキュリティ強化**: セッション管理の実装
- ✅ **ガス最適化**: 20 bytesへの削減

---

## 2. 現状の問題点

### 2.1 コントラクト層の問題

#### GuardianModule.sol

```solidity
// ❌ 現状: bytes32を使用
struct RecoveryRequest {
    bytes32 vaultId;  // 32 bytes - 無駄が多い
    // ...
}

function initiateRecovery(
    bytes32 vaultId,  // ❌ UUID想定だがコントラクトで扱いにくい
    address newOwner,
    bytes32[] calldata proof
) external;
```

**問題点**:
- 実際のVaultコントラクトアドレスとの紐付けが必要
- ERC4337 Smart Account Addressと直接連携できない
- ガス効率が悪い（32 bytes vs 20 bytes）

#### EscrowRegistry.sol

```solidity
// ✅ 正しい: addressを使用
struct Escrow {
    address vaultAddress;  // 20 bytes - 効率的
    // ...
}
```

**問題点**:
- GuardianModuleとの整合性がない

### 2.2 データベース層の問題

```typescript
// apps/api/src/db/schema.ts

// ❌ 問題1: vaultIdとvaultAddressの二重管理
export const vaults = pgTable("vaults", {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: varchar("vault_id", { length: 66 }).notNull().unique(), // bytes32
    vaultAddress: varchar("vault_address", { length: 42 }).notNull(), // address
    // ...
});

// ❌ 問題2: chain_id不在
// マルチチェーン展開時に同じアドレスが衝突

// ❌ 問題3: sessionテーブル不在
// CSRF対策・署名フロー追跡が困難
```

### 2.3 型定義の問題

```typescript
// ❌ 現状: CAIP-10非対応
interface Vault {
    vaultId: string;       // bytes32 (hex)
    vaultAddress: string;  // address (hex)
    // chain_id なし
}
```

---

## 3. 改良後の設計

### 3.1 ID体系の標準化

#### 識別子の種類と用途

| 種別 | 名称 | 型 | サイズ | 用途 | 主な利用場所 |
|------|------|-----|-------|------|------------|
| **Primary** | `address` | address | 20 bytes | オンチェーン識別子 | スマートコントラクト |
| **Secondary** | `uuid` | UUIDv4 | 16 bytes | オフチェーン管理 | DB主キー |
| **Chain Context** | `chainId` | uint256 | 32 bytes | チェーン識別 | 全レイヤー |
| **CAIP-10** | `caip10` | string | 可変 | 標準形式 | 外部連携 |
| **CREATE2** | `salt` | bytes32 | 32 bytes | 決定的デプロイ | VaultFactory |

#### CAIP-10形式

```
Format: namespace:chain_id:address
Example: eip155:8453:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
         ^^^^^^  ^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         |       |     └─ address (20 bytes)
         |       └─ Chain ID (Base Mainnet)
         └─ Namespace (EIP-155)
```

### 3.2 新しいデータ構造

#### TypeScript型定義

```typescript
/**
 * Vault識別子（改良版）
 */
export interface VaultIdentifier {
  // 🔑 Primary: オンチェーン
  address: `0x${string}`;          // 主識別子（20 bytes）
  chainId: number;                 // Chain ID
  caip10: `eip155:${number}:0x${string}`; // CAIP-10形式

  // 🏷️ Secondary: オフチェーン
  uuid: string;                    // UUIDv4（DB主キー）

  // 🔐 CREATE2
  salt?: `0x${string}`;            // CREATE2 salt
  factoryAddress?: `0x${string}`; // Factory契約アドレス

  // 📊 Display
  name: string;                    // 表示名
  shortAddress: string;            // 短縮形（0x742d...bEb）
}
```

---

## 4. 変更内容の詳細

### 4.1 スマートコントラクトの変更

#### 変更1: GuardianModule.sol

**ファイルパス**: `contracts/modules/GuardianModule.sol`

**変更内容**:

```solidity
// ❌ Before
struct RecoveryRequest {
    uint256 id;
    bytes32 vaultId;  // 削除
    address oldOwner;
    address newOwner;
    // ...
}

// ✅ After
struct RecoveryRequest {
    uint256 id;
    address vaultAddress;  // bytes32 vaultId → address に変更
    address oldOwner;
    address newOwner;
    // ...
}
```

**影響を受ける関数**:

```solidity
// 1. initiateRecovery
function initiateRecovery(
    address vaultAddress,  // bytes32 vaultId → address に変更
    address oldOwner,
    address newOwner,
    bytes32[] calldata proof
) external onlyGuardian returns (uint256 requestId);

// 2. completeRecovery
function completeRecovery(
    uint256 requestId
) external onlyGuardian;

// 3. emergencyFreeze
function emergencyFreeze(
    address vaultAddress,  // bytes32 vaultId → address に変更
    uint256 duration,
    string calldata reason
) external onlyGuardian;

// 4. emergencyUnfreeze
function emergencyUnfreeze(
    address vaultAddress  // bytes32 vaultId → address に変更
) external onlyGuardian;

// 5. isVaultFrozen
function isVaultFrozen(
    address vaultAddress  // bytes32 vaultId → address に変更
) external view returns (bool);
```

**イベントの変更**:

```solidity
// ❌ Before
event RecoveryInitiated(
    uint256 indexed requestId,
    bytes32 indexed vaultId,
    address indexed newOwner
);

// ✅ After
event RecoveryInitiated(
    uint256 indexed requestId,
    address indexed vaultAddress,  // bytes32 → address
    address indexed newOwner
);
```

**マッピングの変更**:

```solidity
// ❌ Before
mapping(bytes32 => uint256) public vaultToRecoveryId;
mapping(bytes32 => FreezeState) public freezeStates;

// ✅ After
mapping(address => uint256) public vaultToRecoveryId;
mapping(address => FreezeState) public freezeStates;
```

#### 変更2: VaultFactory.sol（新規作成）

**ファイルパス**: `contracts/factory/VaultFactory.sol`

**実装内容**:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IVault.sol";

/**
 * @title VaultFactory
 * @notice CREATE2を使用してVaultを決定的にデプロイ
 */
contract VaultFactory {
    using Clones for address;

    /// @notice Vault実装アドレス
    address public immutable vaultImplementation;

    /// @notice デプロイされたVault一覧
    mapping(address => bool) public isVault;

    /// @notice UUID→Vaultアドレスのマッピング
    mapping(bytes16 => address) public uuidToVault;

    event VaultCreated(
        address indexed vaultAddress,
        bytes16 indexed uuid,
        address indexed owner,
        bytes32 salt
    );

    constructor(address _vaultImplementation) {
        vaultImplementation = _vaultImplementation;
    }

    /**
     * @notice UUIDからVaultをデプロイ
     * @param uuid UUIDv4（16 bytes）
     * @param owner 初期オーナー
     * @return vaultAddress デプロイされたVaultアドレス
     */
    function createVault(
        bytes16 uuid,
        address owner
    ) external returns (address vaultAddress) {
        require(uuidToVault[uuid] == address(0), "UUID already used");

        // CREATE2用のsaltを生成
        bytes32 salt = keccak256(abi.encodePacked(
            uuid,
            owner,
            block.chainid
        ));

        // CREATE2でデプロイ
        vaultAddress = Clones.cloneDeterministic(
            vaultImplementation,
            salt
        );

        // 初期化
        IVault(vaultAddress).initialize(owner);

        // 記録
        isVault[vaultAddress] = true;
        uuidToVault[uuid] = vaultAddress;

        emit VaultCreated(vaultAddress, uuid, owner, salt);
    }

    /**
     * @notice デプロイ先アドレスを事前計算
     * @param uuid UUIDv4（16 bytes）
     * @param owner 初期オーナー
     * @return predictedAddress 予測されるアドレス
     */
    function predictVaultAddress(
        bytes16 uuid,
        address owner
    ) external view returns (address predictedAddress) {
        bytes32 salt = keccak256(abi.encodePacked(
            uuid,
            owner,
            block.chainid
        ));

        predictedAddress = Clones.predictDeterministicAddress(
            vaultImplementation,
            salt,
            address(this)
        );
    }
}
```

### 4.2 データベーススキーマの変更

#### 変更1: vaultsテーブル

**ファイルパス**: `apps/api/src/db/schema.ts`

```typescript
// ✅ After
export const vaults = pgTable(
  "vaults",
  {
    // 🔑 Primary Keys
    id: uuid("id").primaryKey().defaultRandom(),
    address: varchar("address", { length: 42 }).notNull().unique(), // 主識別子

    // 🌐 Chain Context
    chainId: integer("chain_id").notNull(), // 追加
    caip10: varchar("caip10", { length: 100 }).notNull().unique(), // 追加

    // 🔐 CREATE2 Metadata
    salt: varchar("salt", { length: 66 }), // 追加
    factoryAddress: varchar("factory_address", { length: 42 }), // 追加

    // 📝 Display Info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // 🏷️ Policy Reference
    policyId: varchar("policy_id", { length: 66 }),

    // 📊 Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // 🔗 Metadata
    metadata: jsonb("metadata"),
  },
  (table) => ({
    addressIdx: uniqueIndex("vault_address_idx").on(table.address),
    caip10Idx: uniqueIndex("vault_caip10_idx").on(table.caip10), // 追加
    chainIdIdx: index("vault_chain_id_idx").on(table.chainId), // 追加
    saltIdx: index("vault_salt_idx").on(table.salt), // 追加
  })
);
```

#### 変更2: sessionsテーブル（新規作成）

```typescript
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(), // session_id

    // 🧑 User Identity
    userAddress: varchar("user_address", { length: 42 }).notNull(),
    chainId: integer("chain_id").notNull(),

    // 🎫 Session Info
    token: varchar("token", { length: 255 }).notNull().unique(), // JWT token
    expiresAt: timestamp("expires_at").notNull(),

    // 🖥️ Client Info
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6対応

    // 📊 Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),

    // 🔗 Metadata
    metadata: jsonb("metadata"),
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    userAddressIdx: index("session_user_idx").on(table.userAddress),
    expiresAtIdx: index("session_expires_idx").on(table.expiresAt),
  })
);
```

### 4.3 TypeScript型定義の追加

**ファイルパス**: `packages/shared/src/types/identifiers.ts`（新規作成）

```typescript
/**
 * CAIP-10準拠のアカウント識別子
 * Format: chain_id:address
 * Example: eip155:8453:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
 */
export type CAIP10Address = `eip155:${number}:0x${string}`;

/**
 * Vaultの包括的な識別子
 */
export interface VaultIdentifier {
  // 🔑 Primary: オンチェーン識別子
  address: `0x${string}`;
  chainId: number;
  caip10: CAIP10Address;

  // 🏷️ Secondary: オフチェーン管理用
  uuid: string;

  // 🔐 Metadata: CREATE2関連
  salt?: `0x${string}`;
  factoryAddress?: `0x${string}`;

  // 📊 Display: UI表示用
  name: string;
  shortAddress: string;
}

/**
 * ユーザー識別子
 */
export interface UserIdentifier {
  walletAddress: `0x${string}`;
  chainId: number;
  caip10: CAIP10Address;
  uuid: string;
  sessionId?: string;
  did?: string;
  ens?: string;
}

/**
 * トランザクション識別子
 */
export interface TransactionIdentifier {
  txHash: `0x${string}`;
  chainId: number;
  uuid: string;
  userOpHash?: `0x${string}`;
  bundlerTxHash?: `0x${string}`;
  escrowId?: `0x${string}`;
  vaultAddress?: `0x${string}`;
}

/**
 * エスクロー識別子
 */
export interface EscrowIdentifier {
  escrowId: `0x${string}`;
  chainId: number;
  uuid: string;
  vaultAddress: `0x${string}`;
  requesterAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
}
```

### 4.4 ユーティリティ関数の実装

**ファイルパス**: `packages/shared/src/utils/identifiers.ts`（新規作成）

```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * UUID文字列をbytes16に変換
 */
export function uuidToBytes16(uuid: string): `0x${string}` {
  const hex = uuid.replace(/-/g, '');
  return `0x${hex}` as `0x${string}`;
}

/**
 * bytes16をUUID文字列に変換
 */
export function bytes16ToUuid(bytes: `0x${string}`): string {
  const hex = bytes.slice(2);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * CAIP-10形式の作成
 */
export function toCAIP10(
  chainId: number,
  address: `0x${string}`
): `eip155:${number}:0x${string}` {
  return `eip155:${chainId}:${address}`;
}

/**
 * CAIP-10形式のパース
 */
export function parseCAIP10(caip10: string): {
  namespace: string;
  chainId: number;
  address: `0x${string}`;
} {
  const [namespace, chainIdStr, address] = caip10.split(':');
  return {
    namespace,
    chainId: parseInt(chainIdStr, 10),
    address: address as `0x${string}`,
  };
}

/**
 * アドレスの短縮形を作成
 */
export function shortenAddress(
  address: `0x${string}`,
  startLength = 6,
  endLength = 4
): string {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * CREATE2用のsalt生成
 */
export function generateSalt(
  uuid: string,
  owner: `0x${string}`,
  chainId: number
): `0x${string}` {
  const uuidBytes = uuidToBytes16(uuid);
  // keccak256(abi.encodePacked(uuid, owner, chainId))
  // この部分はethers.jsやviemを使用して実装
  return '0x...' as `0x${string}`; // プレースホルダー
}
```

### 4.5 API変更

#### 変更1: Vaultサービス

**ファイルパス**: `apps/api/src/services/vault-service.ts`

```typescript
import { db } from '../db/client';
import { vaults } from '../db/schema';
import { toCAIP10, shortenAddress } from '@shared/utils/identifiers';
import type { VaultIdentifier } from '@shared/types/identifiers';

export class VaultService {
  /**
   * VaultIdentifierを構築
   */
  async getVaultIdentifier(
    address: `0x${string}`,
    chainId: number
  ): Promise<VaultIdentifier> {
    const vault = await db.query.vaults.findFirst({
      where: (vaults, { eq, and }) =>
        and(
          eq(vaults.address, address),
          eq(vaults.chainId, chainId)
        ),
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    return {
      address,
      chainId,
      caip10: toCAIP10(chainId, address),
      uuid: vault.id,
      salt: vault.salt as `0x${string}` | undefined,
      factoryAddress: vault.factoryAddress as `0x${string}` | undefined,
      name: vault.name,
      shortAddress: shortenAddress(address),
    };
  }
}
```

#### 変更2: セッション管理サービス（新規）

**ファイルパス**: `apps/api/src/services/session-service.ts`

```typescript
import { db } from '../db/client';
import { sessions } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { SignJWT, jwtVerify } from 'jose';

export class SessionService {
  /**
   * セッションを作成
   */
  async createSession(
    userAddress: `0x${string}`,
    chainId: number,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ sessionId: string; token: string }> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

    // JWT生成
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      sessionId,
      userAddress,
      chainId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresAt)
      .sign(secret);

    // DB保存
    await db.insert(sessions).values({
      id: sessionId,
      userAddress,
      chainId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { sessionId, token };
  }

  /**
   * セッションを検証
   */
  async verifySession(token: string): Promise<{
    sessionId: string;
    userAddress: `0x${string}`;
    chainId: number;
  }> {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      sessionId: payload.sessionId as string,
      userAddress: payload.userAddress as `0x${string}`,
      chainId: payload.chainId as number,
    };
  }
}
```

### 4.6 フロントエンド変更

#### 変更1: VaultFactoryフック

**ファイルパス**: `apps/web/src/hooks/useVaultFactory.ts`（新規作成）

```typescript
import { useContractWrite, useContractRead } from 'wagmi';
import { v4 as uuidv4 } from 'uuid';
import { uuidToBytes16 } from '@shared/utils/identifiers';
import { VAULT_FACTORY_ABI, VAULT_FACTORY_ADDRESS } from '@/lib/contracts';

export function useVaultFactory() {
  const { writeAsync: createVaultWrite } = useContractWrite({
    address: VAULT_FACTORY_ADDRESS,
    abi: VAULT_FACTORY_ABI,
    functionName: 'createVault',
  });

  const createVault = async (ownerAddress: `0x${string}`) => {
    // 1. UUIDv4を生成
    const uuid = uuidv4();
    const uuidBytes = uuidToBytes16(uuid);

    // 2. オンチェーンでデプロイ
    const tx = await createVaultWrite({
      args: [uuidBytes, ownerAddress],
    });

    return {
      uuid,
      txHash: tx.hash,
    };
  };

  return { createVault };
}
```

---

## 5. 実装タスク

### Phase 1: 基盤実装（3日）

#### タスク1.1: スマートコントラクト

```bash
- [ ] VaultFactory.sol 実装
  - CREATE2デプロイ機能
  - アドレス予測機能
  - イベント定義
- [ ] IVault.sol インターフェース定義
- [ ] GuardianModule.sol 修正
  - bytes32 vaultId → address vaultAddress
  - 全関数のシグネチャ変更
  - イベント更新
  - マッピング更新
- [ ] テストファイル作成
  - VaultFactory.test.ts
  - GuardianModule.test.ts（修正版）
```

#### タスク1.2: 型定義・ユーティリティ

```bash
- [ ] packages/shared/src/types/identifiers.ts 作成
  - VaultIdentifier
  - UserIdentifier
  - TransactionIdentifier
  - EscrowIdentifier
  - CAIP10Address
- [ ] packages/shared/src/utils/identifiers.ts 作成
  - uuidToBytes16
  - bytes16ToUuid
  - toCAIP10
  - parseCAIP10
  - shortenAddress
  - generateSalt
- [ ] テストファイル作成
  - identifiers.test.ts
```

### Phase 2: データベース・API（4日）

#### タスク2.1: データベーススキーマ

```bash
- [ ] apps/api/src/db/schema.ts 更新
  - vaultsテーブル修正
    - chainId列追加
    - caip10列追加
    - salt列追加
    - factoryAddress列追加
  - sessionsテーブル追加
  - インデックス追加
- [ ] マイグレーションスクリプト作成
  - 001_add_chain_context.sql
  - 002_add_sessions_table.sql
- [ ] 既存データ移行スクリプト
  - migrate-vaults.ts
```

#### タスク2.2: APIサービス

```bash
- [ ] apps/api/src/services/vault-service.ts 更新
  - getVaultIdentifier実装
  - address-basedクエリへ変更
- [ ] apps/api/src/services/session-service.ts 作成
  - createSession
  - verifySession
  - refreshSession
  - revokeSession
- [ ] apps/api/src/routes/vaults.ts 更新
  - CAIP-10対応
- [ ] apps/api/src/routes/sessions.ts 作成
  - POST /sessions（ログイン）
  - DELETE /sessions（ログアウト）
  - GET /sessions/current（現在のセッション）
```

### Phase 3: フロントエンド（3日）

#### タスク3.1: フック実装

```bash
- [ ] apps/web/src/hooks/useVaultFactory.ts 作成
  - createVault
  - predictVaultAddress
- [ ] apps/web/src/hooks/useSession.ts 作成
  - login
  - logout
  - getCurrentSession
- [ ] apps/web/src/hooks/useVaultIdentifier.ts 作成
  - getVaultIdentifier
  - formatVaultDisplay
```

#### タスク3.2: コントラクト設定

```bash
- [ ] apps/web/src/lib/contracts.ts 更新
  - VAULT_FACTORY_ADDRESS追加
  - VAULT_FACTORY_ABI追加
- [ ] apps/web/src/lib/chains.ts 更新
  - CAIP-10ヘルパー関数追加
```

### Phase 4: テスト・検証（2日）

```bash
- [ ] ユニットテスト実行
  - スマートコントラクト: 100%カバレッジ
  - ユーティリティ関数: 100%カバレッジ
- [ ] 統合テスト
  - VaultFactory → Vault作成フロー
  - セッション管理フロー
- [ ] E2Eテスト
  - Vaultデプロイ→メンバー追加→エスクロー作成
```

---

## 6. テスト計画

### 6.1 スマートコントラクトテスト

#### VaultFactory.test.ts

```typescript
describe('VaultFactory', () => {
  describe('createVault', () => {
    it('UUIDからVaultをデプロイできる', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuidBytes = uuidToBytes16(uuid);
      const owner = accounts[0].address;

      const tx = await vaultFactory.createVault(uuidBytes, owner);
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === 'VaultCreated');
      expect(event).to.exist;
      expect(event.args.uuid).to.equal(uuidBytes);
    });

    it('同じUUIDで2回デプロイできない', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuidBytes = uuidToBytes16(uuid);
      const owner = accounts[0].address;

      await vaultFactory.createVault(uuidBytes, owner);

      await expect(
        vaultFactory.createVault(uuidBytes, owner)
      ).to.be.revertedWith('UUID already used');
    });
  });

  describe('predictVaultAddress', () => {
    it('デプロイ前にアドレスを予測できる', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuidBytes = uuidToBytes16(uuid);
      const owner = accounts[0].address;

      const predicted = await vaultFactory.predictVaultAddress(
        uuidBytes,
        owner
      );

      const tx = await vaultFactory.createVault(uuidBytes, owner);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'VaultCreated');

      expect(event.args.vaultAddress).to.equal(predicted);
    });
  });
});
```

#### GuardianModule.test.ts（修正版）

```typescript
describe('GuardianModule (address-based)', () => {
  describe('initiateRecovery', () => {
    it('addressベースでリカバリーを開始できる', async () => {
      const vaultAddress = vault.address;
      const newOwner = accounts[1].address;
      const proof = []; // Merkle proof

      const tx = await guardianModule.initiateRecovery(
        vaultAddress,  // bytes32 vaultId → address に変更
        accounts[0].address,
        newOwner,
        proof
      );

      await expect(tx)
        .to.emit(guardianModule, 'RecoveryInitiated')
        .withArgs(1, vaultAddress, newOwner);
    });
  });
});
```

### 6.2 APIテスト

```typescript
// apps/api/test/services/vault-service.test.ts

describe('VaultService', () => {
  describe('getVaultIdentifier', () => {
    it('VaultIdentifierを正しく構築できる', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const chainId = 8453;

      const identifier = await vaultService.getVaultIdentifier(
        address,
        chainId
      );

      expect(identifier.address).to.equal(address);
      expect(identifier.chainId).to.equal(chainId);
      expect(identifier.caip10).to.equal(
        `eip155:8453:${address}`
      );
      expect(identifier.shortAddress).to.equal('0x742d...bEb');
    });
  });
});
```

---

## 7. マイグレーション計画

### 7.1 データベースマイグレーション

#### Step 1: スキーマ追加

```sql
-- migrations/001_add_chain_context.sql

-- vaultsテーブルに列追加
ALTER TABLE vaults
  ADD COLUMN chain_id INTEGER NOT NULL DEFAULT 8453,
  ADD COLUMN caip10 VARCHAR(100),
  ADD COLUMN salt VARCHAR(66),
  ADD COLUMN factory_address VARCHAR(42);

-- CAIP-10形式を生成
UPDATE vaults
SET caip10 = CONCAT('eip155:', chain_id, ':', vault_address);

-- NOT NULL制約を追加
ALTER TABLE vaults ALTER COLUMN caip10 SET NOT NULL;

-- インデックス追加
CREATE UNIQUE INDEX vault_caip10_idx ON vaults(caip10);
CREATE INDEX vault_chain_id_idx ON vaults(chain_id);
CREATE INDEX vault_salt_idx ON vaults(salt);
```

#### Step 2: sessionsテーブル作成

```sql
-- migrations/002_add_sessions_table.sql

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE UNIQUE INDEX session_token_idx ON sessions(token);
CREATE INDEX session_user_idx ON sessions(user_address);
CREATE INDEX session_expires_idx ON sessions(expires_at);
```

### 7.2 既存データ移行

```typescript
// scripts/migrate-vaults.ts

import { db } from '../apps/api/src/db/client';
import { vaults } from '../apps/api/src/db/schema';

async function migrateVaults() {
  console.log('🔄 Starting vault migration...');

  const allVaults = await db.select().from(vaults);

  for (const vault of allVaults) {
    const caip10 = `eip155:${vault.chainId}:${vault.address}`;

    await db
      .update(vaults)
      .set({ caip10 })
      .where(eq(vaults.id, vault.id));

    console.log(`✅ Migrated vault ${vault.id} → ${caip10}`);
  }

  console.log('✅ Migration completed');
}

migrateVaults();
```

---

## 8. ロールバック計画

### 8.1 データベースロールバック

```sql
-- rollback/001_remove_chain_context.sql

-- 列を削除
ALTER TABLE vaults
  DROP COLUMN chain_id,
  DROP COLUMN caip10,
  DROP COLUMN salt,
  DROP COLUMN factory_address;

-- インデックスを削除
DROP INDEX IF EXISTS vault_caip10_idx;
DROP INDEX IF EXISTS vault_chain_id_idx;
DROP INDEX IF EXISTS vault_salt_idx;
```

```sql
-- rollback/002_remove_sessions_table.sql

DROP TABLE IF EXISTS sessions;
```

### 8.2 コントラクトロールバック

**注意**: デプロイ済みコントラクトは変更不可。以下は新規デプロイ時のみ有効。

```solidity
// GuardianModule.sol (rollback version)
// bytes32 vaultId に戻す場合のコード
```

---

## 付録A: チェックリスト

### 実装前チェック

- [ ] 仕様書のレビュー完了
- [ ] チーム全員の承認取得
- [ ] テストネット環境の準備
- [ ] バックアップの取得

### 実装中チェック

- [ ] Phase 1完了（コントラクト・型定義）
- [ ] Phase 2完了（DB・API）
- [ ] Phase 3完了（フロントエンド）
- [ ] Phase 4完了（テスト）

### デプロイ前チェック

- [ ] すべてのテストが通過
- [ ] カバレッジ90%以上
- [ ] ガスレポート確認
- [ ] セキュリティ監査完了

### デプロイ後チェック

- [ ] Basescan検証完了
- [ ] フロントエンド接続確認
- [ ] エンドツーエンド動作確認
- [ ] 監視・アラート設定完了

---

## 付録B: 参考資料

- [CAIP-10: Account ID Specification](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md)
- [EIP-1167: Minimal Proxy Contract](https://eips.ethereum.org/EIPS/eip-1167)
- [OpenZeppelin Clones](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)
- [CREATE2 Deployer](https://github.com/0age/Create2Deployer)

---

**以上、ID設計改良の変更仕様書**
