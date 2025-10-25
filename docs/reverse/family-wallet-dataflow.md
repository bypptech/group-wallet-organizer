
# データフロー図（逆生成）

## 認証フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant W as Web/Mobile
    participant A as API (Hono)
    participant D as Neon DB
    
    U->>W: ログイン情報入力
    W->>A: POST /auth/login
    A->>D: ユーザー検証
    D-->>A: ユーザー情報
    A->>A: JWT生成 (HS256)
    A-->>W: { token, refreshToken }
    W->>W: localStorage保存
    W-->>U: ログイン完了
```

## エスクロー作成フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant W as Web UI
    participant H as useCreateEscrow
    participant A as AA Client (未実装)
    participant B as Bundler (未実装)
    participant E as EntryPoint (未実装)
    participant R as EscrowRegistry (未実装)
    
    U->>W: エスクロー作成ウィザード入力
    W->>H: フォーム送信
    H->>A: createUserOperation()
    A->>A: UserOp生成 (callData, nonce, signature)
    A->>B: eth_sendUserOperation
    B->>E: handleOps()
    E->>R: createEscrow()
    R-->>E: EscrowCreated event
    E-->>B: UserOp実行完了
    B-->>A: UserOp receipt
    A-->>H: トランザクションハッシュ
    H-->>W: UI更新
    W-->>U: 作成完了通知
```

## 承認フロー

```mermaid
sequenceDiagram
    participant U as Guardian
    participant W as Web UI (ApprovalsHub)
    participant H as useApprovalFlow
    participant A as AA Client (未実装)
    participant R as EscrowRegistry (未実装)
    participant V as RoleVerifier (未実装)
    
    U->>W: "Approve" ボタンクリック
    W->>H: handleApprove(escrowId)
    H->>A: createApprovalUserOp()
    A->>A: Merkle Proof生成
    A->>R: approveRelease(escrowId, proof)
    R->>V: verify(proof, rolesRoot)
    V-->>R: 検証結果
    R->>R: approvalsCount++
    R-->>A: EscrowApproved event
    A-->>H: トランザクション完了
    H-->>W: 承認カウント更新
    W-->>U: 承認完了通知
```

## データ取得フロー（Subgraph統合）

```mermaid
flowchart TD
    A[Web UI] --> B[useEscrows フック]
    B --> C{データソース}
    C -->|オンチェーン| D[The Graph Subgraph]
    C -->|オフチェーン| E[Hono API]
    
    D --> F[GraphQL Query]
    F --> G[Escrow Entity]
    G --> H[UI表示]
    
    E --> I[GET /escrows]
    I --> J[Neon DB]
    J --> K[タイムライン・コメント]
    K --> H
```

## 状態管理フロー

```mermaid
flowchart LR
    A[コンポーネント] --> B[useVaultStore]
    B --> C[Zustand ストア]
    C --> D{アクション}
    D -->|setCurrentVault| E[Vault状態更新]
    D -->|addEscrow| F[Escrow追加]
    D -->|updateApprovals| G[承認状態更新]
    E --> A
    F --> A
    G --> A
```

## 招待フロー

```mermaid
sequenceDiagram
    participant O as Owner
    participant W as Web UI (GroupCreation)
    participant A as API
    participant D as Neon DB
    participant I as 招待者
    
    O->>W: 招待リンク生成
    W->>A: POST /vaults/:id/invites
    A->>A: EIP-712署名検証 (未実装)
    A->>D: 招待トークン保存
    D-->>A: 招待ID
    A-->>W: { inviteUrl, qrCode }
    W-->>O: QRコード表示
    
    I->>W: 招待リンクアクセス
    W->>A: GET /invites/:token
    A->>D: トークン検証
    D-->>A: Vault情報
    A-->>W: Vault詳細
    I->>W: "参加する" クリック
    W->>A: POST /vaults/:id/members
    A->>D: メンバー追加
    D-->>A: 成功
    A-->>W: 参加完了
    W-->>I: Dashboard へリダイレクト
```

## エラーハンドリングフロー

```mermaid
flowchart TD
    A[エラー発生] --> B{エラー種別}
    B -->|401 Unauthorized| C[JWT更新 → リトライ]
    B -->|403 Forbidden| D[権限エラー表示]
    B -->|404 Not Found| E[Not Foundページ]
    B -->|Network Error| F[リトライ or フォールバック]
    B -->|UserOp Revert| G[ガス不足チェック]
    G -->|ガス不足| H[Paymaster スポンサー要求]
    G -->|その他| I[エラートースト表示]
    
    C --> J[再実行]
    D --> K[Toast通知]
    E --> L[ホームへ戻る]
    F --> M[オフラインモード]
    H --> N[スポンサー申請UI]
    I --> K
```

## 通知フロー

```mermaid
sequenceDiagram
    participant C as コントラクト
    participant S as Subgraph
    participant W as Webhook (未実装)
    participant A as API
    participant P as Push通知サービス (未実装)
    participant U as ユーザー
    
    C->>S: EscrowApproved イベント
    S->>W: Webhook トリガー
    W->>A: POST /notifications
    A->>P: Expo Push / Web Push
    P->>U: 通知配信
    
    Note over A,U: Web: Service Worker経由<br/>Mobile: Expo Push Token経由
```

## リアルタイム更新フロー（計画）

```mermaid
flowchart LR
    A[Web UI] --> B[Polling<br/>5秒ごと]
    A --> C[WebSocket<br/>(未実装)]
    
    B --> D[GET /escrows/:id]
    D --> E[状態変化検出]
    E --> F[UI再レンダリング]
    
    C --> G[リアルタイム更新<br/>受信]
    G --> F
```
