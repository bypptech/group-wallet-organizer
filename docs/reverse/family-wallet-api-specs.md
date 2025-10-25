
# API仕様書（逆生成）

**ベースURL**: `http://localhost:3001` (開発環境)  
**本番URL**: 未定

## 認証方式

**JWT (HS256)**
- Access Token: 有効期限 1時間
- Refresh Token: 有効期限 7日間
- ヘッダー: `Authorization: Bearer <token>`

## エンドポイント一覧

### 認証関連

#### POST /auth/register
**説明**: 新規ユーザー登録

**リクエスト**:
```typescript
{
  email: string;
  password: string;
  name?: string;
}
```

**レスポンス** (201):
```typescript
{
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  token: string;
  refreshToken: string;
}
```

#### POST /auth/login
**説明**: ユーザーログイン

**リクエスト**:
```typescript
{
  email: string;
  password: string;
}
```

**レスポンス** (200):
```typescript
{
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
  refreshToken: string;
}
```

**エラーレスポンス** (401):
```typescript
{
  error: "Invalid credentials"
}
```

#### POST /auth/refresh
**説明**: トークン更新

**リクエスト**:
```typescript
{
  refreshToken: string;
}
```

**レスポンス** (200):
```typescript
{
  token: string;
  refreshToken: string;
}
```

#### GET /me
**説明**: 現在のユーザー情報取得

**ヘッダー**: `Authorization: Bearer <token>`

**レスポンス** (200):
```typescript
{
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}
```

### Vault 管理

#### GET /vaults
**説明**: ユーザーが所属するVault一覧取得

**クエリパラメータ**:
- `role?: string` - ロールでフィルタ (owner, guardian, requester, viewer)

**レスポンス** (200):
```typescript
{
  vaults: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    role: 'owner' | 'guardian' | 'requester' | 'viewer';
    memberCount: number;
  }>;
}
```

#### POST /vaults
**説明**: 新規Vault作成

**リクエスト**:
```typescript
{
  name: string;
  description?: string;
  policy?: {
    threshold: number;
    timelock: number;
  };
}
```

**レスポンス** (201):
```typescript
{
  vault: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
  };
}
```

#### GET /vaults/:id
**説明**: Vault詳細取得

**レスポンス** (200):
```typescript
{
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  policy: {
    threshold: number;
    timelock: number;
    rolesRoot: string;
  };
  members: Array<{
    userId: string;
    role: string;
    weight: number;
    joinedAt: string;
  }>;
}
```

#### GET /vaults/:id/members
**説明**: Vaultメンバー一覧取得

**レスポンス** (200):
```typescript
{
  members: Array<{
    userId: string;
    email: string;
    name: string | null;
    role: 'owner' | 'guardian' | 'requester' | 'viewer';
    weight: number;
    joinedAt: string;
  }>;
}
```

#### POST /vaults/:id/members
**説明**: メンバー追加（招待承認後）

**リクエスト**:
```typescript
{
  userId: string;
  role: 'owner' | 'guardian' | 'requester' | 'viewer';
  weight?: number;
}
```

**レスポンス** (201):
```typescript
{
  member: {
    userId: string;
    role: string;
    weight: number;
    joinedAt: string;
  };
}
```

#### DELETE /vaults/:id/members/:userId
**説明**: メンバー削除

**レスポンス** (204): No Content

### 招待管理

#### GET /vaults/:id/invites
**説明**: Vaultの招待リンク一覧取得

**レスポンス** (200):
```typescript
{
  invites: Array<{
    id: string;
    token: string;
    role: string;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
  }>;
}
```

#### POST /vaults/:id/invites
**説明**: 招待リンク生成

**リクエスト**:
```typescript
{
  role: 'owner' | 'guardian' | 'requester' | 'viewer';
  expiresIn?: number; // 秒数、デフォルト 7日間
  maxUses?: number;   // 使用回数制限
}
```

**レスポンス** (201):
```typescript
{
  invite: {
    id: string;
    token: string;
    inviteUrl: string;
    qrCode: string; // Base64エンコードされたQRコード画像
    role: string;
    expiresAt: string;
  };
}
```

#### GET /invites/:token
**説明**: 招待トークン検証

**レスポンス** (200):
```typescript
{
  valid: boolean;
  vault: {
    id: string;
    name: string;
    description: string | null;
  };
  role: string;
  expiresAt: string;
}
```

**エラーレスポンス** (404):
```typescript
{
  error: "Invalid or expired invite token"
}
```

#### DELETE /vaults/:id/invites/:inviteId
**説明**: 招待リンク失効

**レスポンス** (204): No Content

### Escrow 管理

#### GET /escrows
**説明**: Escrow一覧取得

**クエリパラメータ**:
- `vaultId?: string` - Vaultでフィルタ
- `status?: string` - ステータスでフィルタ (pending, approved, released, cancelled, expired)
- `role?: string` - 自分のロールでフィルタ

**レスポンス** (200):
```typescript
{
  escrows: Array<{
    id: string;
    vaultId: string;
    payer: string;
    payee: string;
    token: string;
    amount: string;
    status: 'pending' | 'approved' | 'released' | 'cancelled' | 'expired';
    deadline: string;
    approvalsCount: number;
    requiredApprovals: number;
    createdAt: string;
  }>;
}
```

#### POST /escrows
**説明**: Escrowドラフト登録（オンチェーン作成前）

**リクエスト**:
```typescript
{
  vaultId: string;
  payer: string;
  payee: string;
  token: string;
  amount: string;
  target: string;
  data: string;
  deadline: string; // ISO 8601
  metadata?: {
    title?: string;
    description?: string;
    attachments?: string[];
  };
}
```

**レスポンス** (201):
```typescript
{
  escrow: {
    id: string;
    ...
  };
}
```

#### GET /escrows/:id
**説明**: Escrow詳細取得

**レスポンス** (200):
```typescript
{
  id: string;
  vaultId: string;
  payer: string;
  payee: string;
  token: string;
  amount: string;
  target: string;
  data: string;
  status: string;
  deadline: string;
  policy: {
    threshold: number;
    timelock: number;
  };
  approvals: Array<{
    userId: string;
    approvedAt: string;
    weight: number;
  }>;
  timeline: Array<{
    type: 'created' | 'approved' | 'revoked' | 'released' | 'cancelled' | 'comment';
    userId: string;
    timestamp: string;
    data?: any;
  }>;
  createdAt: string;
}
```

#### GET /escrows/:id/timeline
**説明**: Escrowタイムライン取得

**レスポンス** (200):
```typescript
{
  timeline: Array<{
    id: string;
    type: 'created' | 'approved' | 'revoked' | 'released' | 'cancelled' | 'comment';
    userId: string;
    userName: string;
    timestamp: string;
    data?: {
      comment?: string;
      txHash?: string;
      reason?: string;
    };
  }>;
}
```

### Policy 管理

#### GET /policies
**説明**: Policy一覧取得

**クエリパラメータ**:
- `vaultId?: string`

**レスポンス** (200):
```typescript
{
  policies: Array<{
    id: string;
    vaultId: string;
    threshold: number;
    timelock: number;
    rolesRoot: string;
    version: number;
    createdAt: string;
  }>;
}
```

#### POST /policies
**説明**: Policy変更要求（タイムロック付き）

**リクエスト**:
```typescript
{
  vaultId: string;
  threshold: number;
  timelock: number;
  roles: Array<{
    userId: string;
    role: string;
    weight: number;
  }>;
}
```

**レスポンス** (201):
```typescript
{
  policy: {
    id: string;
    scheduledAt: string; // タイムロック解除時刻
    ...
  };
}
```

### 通知

#### POST /notifications
**説明**: Push通知送信（内部API）

**リクエスト**:
```typescript
{
  userId: string;
  title: string;
  body: string;
  data?: {
    escrowId?: string;
    vaultId?: string;
    type: 'approval_request' | 'approval_granted' | 'escrow_released' | 'invite';
  };
}
```

**レスポンス** (200):
```typescript
{
  success: boolean;
  messageId?: string;
}
```

### Paymaster スポンサー

#### POST /paymaster/sponsor
**説明**: ガススポンサー申請

**リクエスト**:
```typescript
{
  userOp: {
    sender: string;
    nonce: string;
    callData: string;
    // ... その他 UserOperation フィールド
  };
  entryPoint: string;
}
```

**レスポンス** (200):
```typescript
{
  sponsored: boolean;
  paymasterAndData?: string;
  fallbackMode?: boolean;
}
```

**エラーレスポンス** (400):
```typescript
{
  error: "Sponsorship rejected",
  reason: "Daily limit exceeded" | "Invalid operation" | "Insufficient balance";
  fallbackMode: true;
}
```

## エラーコード一覧

| コード | ステータス | メッセージ | 説明 |
|--------|-----------|-----------|------|
| AUTH_001 | 401 | Invalid credentials | 認証情報が無効 |
| AUTH_002 | 401 | Token expired | トークンが期限切れ |
| AUTH_003 | 403 | Insufficient permissions | 権限不足 |
| VAULT_001 | 404 | Vault not found | Vaultが見つからない |
| VAULT_002 | 403 | Not a vault member | Vaultメンバーではない |
| ESCROW_001 | 404 | Escrow not found | Escrowが見つからない |
| ESCROW_002 | 400 | Invalid escrow state | Escrow状態が不正 |
| INVITE_001 | 404 | Invalid invite token | 招待トークンが無効 |
| INVITE_002 | 410 | Invite expired | 招待が期限切れ |
| PAYMASTER_001 | 400 | Sponsorship rejected | スポンサー拒否 |

## レスポンス共通形式

### 成功レスポンス
```typescript
{
  // データを直接返す（ラッパーなし）
}
```

### エラーレスポンス
```typescript
{
  error: string;
  code?: string;
  details?: any;
}
```
