# デモモード設計書

## 概要

どのウォレットでもアクセス可能なデモ用データを提供しつつ、通常のウォレット接続ユーザーには厳格な権限管理を維持する仕組みを設計します。

## 設計方針

### アプローチ1: 専用デモVaultの作成（推奨）

特定のVaultを「デモモード」としてマークし、すべてのユーザーに読み取り専用アクセスを許可します。

#### DB設計

```typescript
// vaults テーブルに追加
export const vaults = pgTable("vaults", {
  // 既存フィールド...
  isDemo: boolean("is_demo").default(false).notNull(),
  demoReadOnly: boolean("demo_read_only").default(true).notNull(),

  // metadataに以下を追加可能
  // metadata: {
  //   demoConfig: {
  //     allowedActions: ['view_vault', 'view_escrows', 'view_members'],
  //     restrictedActions: ['create_escrow', 'approve_escrow', 'add_member']
  //   }
  // }
});

// sessions テーブルに追加（オプション）
export const sessions = pgTable("sessions", {
  // 既存フィールド...
  isDemoSession: boolean("is_demo_session").default(false).notNull(),
});
```

#### 実装詳細

**1. デモVaultの作成**

```typescript
// デモVault作成スクリプト
const DEMO_VAULT = {
  address: "0xDEMO000000000000000000000000000000000001",
  name: "Demo Team Wallet",
  description: "Explore features with pre-populated demo data",
  chainId: 84532, // Base Sepolia
  isDemo: true,
  demoReadOnly: true,
  metadata: {
    demoConfig: {
      allowedActions: [
        'view_vault',
        'view_escrows',
        'view_members',
        'view_policies',
        'view_shareable_keys'
      ],
      restrictedActions: [
        'create_escrow',
        'approve_escrow',
        'add_member',
        'create_shareable_key',
        'send_payment'
      ]
    }
  }
};
```

**2. デモデータのシード**

```typescript
// デモメンバー
const DEMO_MEMBERS = [
  { address: "0xAlice...", role: "owner", weight: 2 },
  { address: "0xBob...", role: "guardian", weight: 1 },
  { address: "0xCarol...", role: "requester", weight: 1 }
];

// デモEscrow（支払いリクエスト）
const DEMO_ESCROWS = [
  {
    name: "Team Lunch Expenses",
    type: "payment",
    totalAmount: "50000000", // 50 USDC
    status: "submitted",
    requester: "0xAlice...",
    recipient: "0xRestaurant...",
    reason: "Monthly team lunch gathering"
  },
  {
    name: "Equipment Purchase",
    type: "payment",
    totalAmount: "200000000", // 200 USDC
    status: "approved",
    requester: "0xBob..."
  }
];

// デモShareable Keys
const DEMO_SHAREABLE_KEYS = [
  {
    name: "Accountant Access",
    keyType: "vault",
    permissions: ["view_vault", "view_escrows"],
    status: "active"
  }
];
```

**3. ミドルウェア実装**

```typescript
// apps/api/src/middleware/demoMode.ts
export async function demoModeMiddleware(req, res, next) {
  const vaultId = req.params.vaultId;

  // Vaultがデモモードかチェック
  const vault = await db.query.vaults.findFirst({
    where: eq(vaults.id, vaultId)
  });

  if (vault?.isDemo) {
    // デモモードの場合、特別な処理
    req.isDemoMode = true;
    req.demoConfig = vault.metadata?.demoConfig;

    // 読み取り専用操作のみ許可
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const action = getActionFromRoute(req.path, req.method);

      if (req.demoConfig?.restrictedActions?.includes(action)) {
        return res.status(403).json({
          error: 'Demo mode: This action is restricted',
          message: 'Connect your wallet to access full features'
        });
      }
    }
  }

  next();
}
```

**4. フロントエンド実装**

```typescript
// apps/web/src/hooks/useDemoMode.ts
export function useDemoMode(vaultId: string) {
  const { data: vault } = useQuery({
    queryKey: ['vault', vaultId],
    queryFn: () => fetchVault(vaultId)
  });

  const isDemo = vault?.isDemo ?? false;
  const demoConfig = vault?.metadata?.demoConfig;

  const canPerformAction = (action: string) => {
    if (!isDemo) return true;
    return !demoConfig?.restrictedActions?.includes(action);
  };

  return {
    isDemo,
    canPerformAction,
    demoMessage: isDemo
      ? "You're viewing demo data. Connect your wallet for full access."
      : null
  };
}
```

```typescript
// apps/web/src/components/DemoBanner.tsx
export function DemoBanner({ vaultId }: { vaultId: string }) {
  const { isDemo } = useDemoMode(vaultId);

  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <InfoIcon className="w-5 h-5" />
          <span>You're viewing demo data. Connect your wallet for full access.</span>
        </div>
        <Button onClick={() => connectWallet()}>
          Connect Wallet
        </Button>
      </div>
    </div>
  );
}
```

## セキュリティ考慮事項とリスク

### ✅ メリット

1. **データ分離**: デモVaultは通常のVaultと完全に分離
2. **権限制御**: 既存の権限システムをそのまま使用可能
3. **監査可能**: デモモードアクセスをaudit_logsで追跡
4. **柔軟性**: デモデータの更新・削除が容易

### ⚠️ リスク

#### 1. データ整合性リスク
**問題**: 複数ユーザーが同時にデモVaultにアクセスすると、データの不整合が発生する可能性

**対策**:
- デモVaultは読み取り専用に設定
- 定期的にデモデータをリセット（日次など）
- リセットスクリプトをcronジョブで実行

```typescript
// scripts/reset-demo-data.ts
export async function resetDemoData() {
  // デモVaultのデータをリセット
  await db.delete(escrows).where(eq(escrows.vaultId, DEMO_VAULT_ID));
  await db.delete(comments).where(/* ... */);

  // 初期デモデータを再投入
  await seedDemoData();
}
```

#### 2. プライバシーリスク
**問題**: デモモードでも実際のEthereumアドレスを表示すると、プライバシー懸念

**対策**:
- デモVaultには架空のアドレスを使用
- 実際のアドレスではなく、ニックネーム表示（Alice, Bob, Carol）

```typescript
const DEMO_ADDRESSES = {
  "0xDEMOALICE0000000000000000000000000000001": "Alice (Owner)",
  "0xDEMOBOB00000000000000000000000000000002": "Bob (Guardian)",
  "0xDEMOCAROL000000000000000000000000000003": "Carol (Requester)"
};
```

#### 3. パフォーマンスリスク
**問題**: 多数のユーザーが同時にデモVaultにアクセスすると負荷増加

**対策**:
- デモVaultデータをRedisなどにキャッシュ
- CDNでデモVault情報を配信
- Rate limitingを設定

```typescript
// キャッシュ戦略
const DEMO_CACHE_TTL = 3600; // 1 hour

export async function getDemoVault() {
  const cached = await redis.get(`demo:vault:${DEMO_VAULT_ID}`);
  if (cached) return JSON.parse(cached);

  const vault = await db.query.vaults.findFirst({
    where: eq(vaults.id, DEMO_VAULT_ID),
    with: {
      members: true,
      escrows: true,
      shareableKeys: true
    }
  });

  await redis.setex(`demo:vault:${DEMO_VAULT_ID}`, DEMO_CACHE_TTL, JSON.stringify(vault));
  return vault;
}
```

#### 4. 悪用リスク
**問題**: デモモードを利用したスパム・DoS攻撃

**対策**:
- IPベースのRate limiting
- CAPTCHAの導入（オプション）
- 異常なアクセスパターンの検知

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/demo', demoLimiter);
```

#### 5. 混乱リスク
**問題**: ユーザーがデモモードと実際のウォレットを混同

**対策**:
- 明確なUIの差別化（デモバナー、色分け）
- ウォレット未接続時は常にデモモード表示
- デモから実際のウォレットへの遷移をスムーズに

```typescript
// apps/web/src/pages/wallet-demo.tsx
export default function WalletDemo() {
  const { address } = useAccount();

  // ウォレット未接続の場合、自動的にデモVaultを表示
  const vaultId = address ? userVaultId : DEMO_VAULT_ID;

  return (
    <>
      {!address && <DemoBanner />}
      <VaultDetail vaultId={vaultId} />
    </>
  );
}
```

## 実装フェーズ

### Phase 1: DB準備
- [ ] `vaults`テーブルに`isDemo`フィールド追加
- [ ] マイグレーションスクリプト作成

### Phase 2: デモデータ作成
- [ ] デモVault作成スクリプト
- [ ] サンプルデータシードスクリプト
- [ ] データリセットスクリプト

### Phase 3: API実装
- [ ] デモモードミドルウェア実装
- [ ] 読み取り専用エンドポイント実装
- [ ] Rate limiting設定

### Phase 4: フロントエンド実装
- [ ] `useDemoMode`フック実装
- [ ] デモバナーコンポーネント
- [ ] UIの差別化（デモモード表示）

### Phase 5: テスト・デプロイ
- [ ] ユニットテスト
- [ ] E2Eテスト（デモモード）
- [ ] パフォーマンステスト
- [ ] 本番デプロイ

## 代替案: アプローチ2（非推奨）

### セッションベースのデモモード

各ユーザーセッションごとに一時的なデモデータを生成する方式。

**メリット**:
- ユーザーごとに独立したデモ体験
- データ競合なし

**デメリット**:
- 実装コストが高い
- ストレージコスト増加
- クリーンアップ処理が複雑

この方式は、よりリッチなデモ体験が必要な場合のみ検討すべきです。

## 推奨実装

**アプローチ1（専用デモVault）** を推奨します。

理由:
- シンプルで実装コストが低い
- 既存のDB構造を最大限活用
- セキュリティリスクを最小限に抑制
- パフォーマンス最適化が容易
