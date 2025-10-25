
# テスト仕様書（逆生成）

## 概要
既存の実装とAPI仕様書から抽出したテスト仕様書です。

---

## 1. 認証関連のテスト

### 1.1 JWT認証テスト

#### TC-AUTH-001: アクセストークン生成
**前提条件:**
- 有効なユーザーデータが存在する

**テストステップ:**
1. `signAccessToken()` を有効なペイロードで呼び出す
2. 生成されたトークンを検証する

**期待結果:**
- トークンが正常に生成される
- トークンに `type: 'access'` が含まれる
- 有効期限が15分後に設定される

#### TC-AUTH-002: リフレッシュトークン生成
**前提条件:**
- 有効なユーザーデータが存在する

**テストステップ:**
1. `signRefreshToken()` を有効なペイロードで呼び出す
2. 生成されたトークンを検証する

**期待結果:**
- トークンが正常に生成される
- トークンに `type: 'refresh'` が含まれる
- 有効期限が7日後に設定される

#### TC-AUTH-003: トークン検証（正常系）
**前提条件:**
- 有効なアクセストークンが存在する

**テストステップ:**
1. `verifyToken()` で有効なトークンを検証する

**期待結果:**
- トークンが正常に検証される
- デコードされたペイロードが返される

#### TC-AUTH-004: トークン検証（異常系 - 期限切れ）
**前提条件:**
- 期限切れのトークンが存在する

**テストステップ:**
1. `verifyToken()` で期限切れトークンを検証する

**期待結果:**
- エラーが発生する
- 401 Unauthorizedが返される

#### TC-AUTH-005: 認証ミドルウェア（正常系）
**前提条件:**
- 有効なAuthorizationヘッダーが存在する

**テストステップ:**
1. リクエストに `Authorization: Bearer <token>` を付与する
2. `requireAuth` ミドルウェアを通過する

**期待結果:**
- ミドルウェアが通過する
- `c.get('user')` にユーザー情報が設定される

#### TC-AUTH-006: 認証ミドルウェア（異常系 - トークンなし）
**前提条件:**
- Authorizationヘッダーが存在しない

**テストステップ:**
1. Authorizationヘッダーなしでリクエストを送信する

**期待結果:**
- 401 Unauthorizedが返される
- エラーメッセージ "Unauthorized" が返される

---

## 2. Vault管理のテスト

### 2.1 Vault CRUD操作

#### TC-VAULT-001: Vault作成
**前提条件:**
- 有効な認証トークンが存在する

**テストステップ:**
1. POST /vaults に以下のデータを送信:
```json
{
  "vaultId": "0x1234...64文字",
  "name": "Test Vault",
  "description": "Test Description",
  "vaultAddress": "0x1234567890123456789012345678901234567890",
  "policyId": "0x9876...64文字"
}
```

**期待結果:**
- 201 Createdが返される
- 作成されたVaultデータが返される
- データベースにレコードが作成される

#### TC-VAULT-002: Vault一覧取得
**前提条件:**
- データベースに複数のVaultが存在する

**テストステップ:**
1. GET /vaults を呼び出す

**期待結果:**
- 200 OKが返される
- Vault配列が返される

#### TC-VAULT-003: Vaultフィルタリング（メンバーアドレス）
**前提条件:**
- 特定のアドレスがメンバーのVaultが存在する

**テストステップ:**
1. GET /vaults?address=0x123... を呼び出す

**期待結果:**
- 200 OKが返される
- 指定アドレスがメンバーのVaultのみ返される

#### TC-VAULT-004: Vault詳細取得（正常系）
**前提条件:**
- 有効なVault IDが存在する

**テストステップ:**
1. GET /vaults/:id を呼び出す

**期待結果:**
- 200 OKが返される
- Vault詳細とメンバー一覧が返される

#### TC-VAULT-005: Vault詳細取得（異常系 - 存在しないID）
**前提条件:**
- 存在しないVault IDを使用する

**テストステップ:**
1. GET /vaults/:id を存在しないIDで呼び出す

**期待結果:**
- 404 Not Foundが返される
- エラーメッセージ "Vault not found" が返される

#### TC-VAULT-006: Vault更新
**前提条件:**
- 有効なVault IDが存在する

**テストステップ:**
1. PATCH /vaults/:id に更新データを送信:
```json
{
  "name": "Updated Vault Name",
  "description": "Updated Description"
}
```

**期待結果:**
- 200 OKが返される
- 更新されたVaultデータが返される
- updatedAtが更新される

### 2.2 メンバー管理

#### TC-VAULT-007: メンバー追加（正常系）
**前提条件:**
- 有効なVault IDが存在する
- 追加するアドレスがメンバーではない

**テストステップ:**
1. POST /vaults/:id/members に以下のデータを送信:
```json
{
  "address": "0x9876...",
  "role": "guardian",
  "weight": 2,
  "addedBy": "0x1234..."
}
```

**期待結果:**
- 201 Createdが返される
- 追加されたメンバーデータが返される

#### TC-VAULT-008: メンバー追加（異常系 - 重複）
**前提条件:**
- アドレスが既にメンバーとして存在する

**テストステップ:**
1. POST /vaults/:id/members で既存メンバーを追加しようとする

**期待結果:**
- 409 Conflictが返される
- エラーメッセージ "Member already exists" が返される

#### TC-VAULT-009: メンバー削除（正常系）
**前提条件:**
- 削除対象のメンバーが存在する

**テストステップ:**
1. DELETE /vaults/:id/members/:address を呼び出す

**期待結果:**
- 200 OKが返される
- 削除されたメンバーデータが返される

#### TC-VAULT-010: メンバー削除（異常系 - 存在しないメンバー）
**前提条件:**
- 削除対象のメンバーが存在しない

**テストステップ:**
1. DELETE /vaults/:id/members/:address を存在しないアドレスで呼び出す

**期待結果:**
- 404 Not Foundが返される

---

## 3. Escrow管理のテスト

### 3.1 Escrowドラフト操作

#### TC-ESCROW-001: Escrowドラフト作成
**前提条件:**
- 有効なVault IDが存在する

**テストステップ:**
1. POST /escrows に以下のデータを送信:
```json
{
  "vaultId": "uuid",
  "requester": "0x1234...",
  "recipient": "0x5678...",
  "token": "0x9abc...",
  "amount": "1000000",
  "reason": "Test escrow"
}
```

**期待結果:**
- 201 Createdが返される
- statusが "draft" で作成される

#### TC-ESCROW-002: Escrow一覧取得（フィルタなし）
**前提条件:**
- 複数のEscrowドラフトが存在する

**テストステップ:**
1. GET /escrows を呼び出す

**期待結果:**
- 200 OKが返される
- Escrow配列が返される

#### TC-ESCROW-003: Escrow一覧取得（Vaultフィルタ）
**前提条件:**
- 特定のVaultのEscrowが存在する

**テストステップ:**
1. GET /escrows?vaultId=uuid を呼び出す

**期待結果:**
- 指定VaultのEscrowのみ返される

#### TC-ESCROW-004: Escrow一覧取得（ステータスフィルタ）
**前提条件:**
- 異なるステータスのEscrowが存在する

**テストステップ:**
1. GET /escrows?status=draft を呼び出す

**期待結果:**
- ステータスが "draft" のEscrowのみ返される

#### TC-ESCROW-005: Escrow詳細取得（タイムライン付き）
**前提条件:**
- escrowIdが設定されたEscrowが存在する
- タイムラインイベントが存在する

**テストステップ:**
1. GET /escrows/:id を呼び出す

**期待結果:**
- Escrow詳細とタイムラインが返される

#### TC-ESCROW-006: Escrowドラフト更新
**前提条件:**
- 有効なEscrowドラフトが存在する

**テストステップ:**
1. PATCH /escrows/:id に更新データを送信:
```json
{
  "escrowId": "0x1234...64文字",
  "status": "submitted",
  "txHash": "0x5678...64文字"
}
```

**期待結果:**
- 200 OKが返される
- 更新されたデータが返される

### 3.2 タイムライン管理

#### TC-ESCROW-007: タイムライン取得
**前提条件:**
- Escrowにタイムラインイベントが存在する

**テストステップ:**
1. GET /escrows/:id/timeline を呼び出す

**期待結果:**
- 200 OKが返される
- タイムラインイベント配列が時系列順で返される

#### TC-ESCROW-008: タイムラインイベント追加
**前提条件:**
- 有効なEscrow IDが存在する

**テストステップ:**
1. POST /escrows/:id/timeline に以下のデータを送信:
```json
{
  "escrowId": "0x1234...64文字",
  "eventType": "escrow_approved",
  "actor": "0x5678...",
  "txHash": "0x9abc...64文字"
}
```

**期待結果:**
- 201 Createdが返される
- 追加されたイベントデータが返される

---

## 4. Policy管理のテスト

### 4.1 Policy操作

#### TC-POLICY-001: Policy作成
**前提条件:**
- 有効なVault IDが存在する

**テストステップ:**
1. POST /policies に以下のデータを送信:
```json
{
  "policyId": "0x1234...64文字",
  "vaultId": "uuid",
  "threshold": 2,
  "timelock": 86400,
  "rolesRoot": "0x5678...64文字",
  "ownersRoot": "0x9abc...64文字"
}
```

**期待結果:**
- 201 Createdが返される
- activeがtrueで作成される

#### TC-POLICY-002: Policy一覧取得（フィルタなし）
**前提条件:**
- 複数のPolicyが存在する

**テストステップ:**
1. GET /policies を呼び出す

**期待結果:**
- 200 OKが返される
- Policy配列が返される

#### TC-POLICY-003: Policy一覧取得（Vaultフィルタ）
**前提条件:**
- 特定のVaultのPolicyが存在する

**テストステップ:**
1. GET /policies?vaultId=uuid を呼び出す

**期待結果:**
- 指定VaultのPolicyのみ返される

#### TC-POLICY-004: Policy一覧取得（activeフィルタ）
**前提条件:**
- active/inactiveなPolicyが存在する

**テストステップ:**
1. GET /policies?active=true を呼び出す

**期待結果:**
- アクティブなPolicyのみ返される

#### TC-POLICY-005: Policy更新
**前提条件:**
- 有効なPolicy IDが存在する

**テストステップ:**
1. PATCH /policies/:id に更新データを送信:
```json
{
  "threshold": 3,
  "timelock": 172800
}
```

**期待結果:**
- 200 OKが返される
- 更新されたデータが返される

#### TC-POLICY-006: PolicyId別取得
**前提条件:**
- 有効なpolicyId（オンチェーンID）が存在する

**テストステップ:**
1. GET /policies/by-policy-id/:policyId を呼び出す

**期待結果:**
- 200 OKが返される
- 該当するPolicyが返される

---

## 5. 招待管理のテスト

### 5.1 招待操作

#### TC-INVITE-001: 招待作成（EIP-712署名付き）
**前提条件:**
- 有効なVault IDとEIP-712署名が存在する

**テストステップ:**
1. POST /invites に以下のデータを送信:
```json
{
  "vaultId": "uuid",
  "role": "guardian",
  "weight": 1,
  "signature": "0x1234...署名",
  "expiresAt": "2024-12-31T23:59:59Z",
  "createdBy": "0x5678..."
}
```

**期待結果:**
- 201 Createdが返される
- 一意のトークンが生成される
- inviteUrlが生成される

#### TC-INVITE-002: 招待検証（有効な招待）
**前提条件:**
- 有効期限内の未使用招待が存在する

**テストステップ:**
1. GET /invites/:token を呼び出す

**期待結果:**
- 200 OKが返される
- 招待詳細が返される

#### TC-INVITE-003: 招待検証（期限切れ）
**前提条件:**
- 期限切れの招待が存在する

**テストステップ:**
1. GET /invites/:token を期限切れトークンで呼び出す

**期待結果:**
- 410 Goneが返される
- エラーメッセージ "Invite has expired" が返される

#### TC-INVITE-004: 招待検証（使用済み）
**前提条件:**
- 既に使用済みの招待が存在する

**テストステップ:**
1. GET /invites/:token を使用済みトークンで呼び出す

**期待結果:**
- 410 Goneが返される
- エラーメッセージ "Invite has already been used" が返される

#### TC-INVITE-005: 招待受諾（正常系）
**前提条件:**
- 有効な招待トークンが存在する

**テストステップ:**
1. POST /invites/:token/accept に以下のデータを送信:
```json
{
  "address": "0x1234...",
  "signature": "0x5678...署名"
}
```

**期待結果:**
- 200 OKが返される
- メンバーとして追加される
- 招待が使用済みになる

#### TC-INVITE-006: 招待受諾（異常系 - 既にメンバー）
**前提条件:**
- アドレスが既にVaultメンバーである

**テストステップ:**
1. POST /invites/:token/accept を既存メンバーで実行

**期待結果:**
- 409 Conflictが返される
- エラーメッセージ "You are already a member of this vault" が返される

#### TC-INVITE-007: 招待削除
**前提条件:**
- 削除対象の招待が存在する

**テストステップ:**
1. DELETE /invites/:id を呼び出す

**期待結果:**
- 200 OKが返される
- データベースから削除される

---

## 6. 通知管理のテスト

### 6.1 通知操作

#### TC-NOTIF-001: 通知作成
**前提条件:**
- 有効なユーザーアドレスが存在する

**テストステップ:**
1. POST /notifications に以下のデータを送信:
```json
{
  "userId": "0x1234...",
  "vaultId": "uuid",
  "type": "escrow_created",
  "title": "New Escrow",
  "message": "A new escrow has been created"
}
```

**期待結果:**
- 201 Createdが返される
- readがfalseで作成される

#### TC-NOTIF-002: 通知一覧取得（ユーザーフィルタ）
**前提条件:**
- 特定ユーザーの通知が存在する

**テストステップ:**
1. GET /notifications?userId=0x1234... を呼び出す

**期待結果:**
- 200 OKが返される
- 指定ユーザーの通知のみ返される

#### TC-NOTIF-003: 通知一覧取得（未読フィルタ）
**前提条件:**
- 未読通知が存在する

**テストステップ:**
1. GET /notifications?userId=0x1234...&read=false を呼び出す

**期待結果:**
- 未読通知のみ返される

#### TC-NOTIF-004: 通知を既読にする
**前提条件:**
- 未読通知が存在する

**テストステップ:**
1. PATCH /notifications/:id/read を呼び出す

**期待結果:**
- 200 OKが返される
- readがtrueに更新される
- readAtが設定される

#### TC-NOTIF-005: 未読通知数取得
**前提条件:**
- ユーザーの未読通知が存在する

**テストステップ:**
1. GET /notifications/unread-count?userId=0x1234... を呼び出す

**期待結果:**
- 200 OKが返される
- 未読通知数が返される

#### TC-NOTIF-006: 全通知既読
**前提条件:**
- ユーザーの未読通知が複数存在する

**テストステップ:**
1. POST /notifications/mark-all-read に userId を送信

**期待結果:**
- 200 OKが返される
- 全通知が既読になる

---

## 7. Paymaster関連のテスト

### 7.1 スポンサーシップ

#### TC-PAY-001: スポンサーシップリクエスト（正常系）
**前提条件:**
- 有効なUserOperationデータが存在する

**テストステップ:**
1. POST /paymaster/sponsor に UserOperation を送信

**期待結果:**
- 200 OKが返される
- paymasterAndDataが返される
- sponsoredがtrueになる

#### TC-PAY-002: 資格チェック（正常系）
**前提条件:**
- 十分な残高を持つユーザーアドレスが存在する

**テストステップ:**
1. GET /paymaster/eligibility?userAddress=0x1234...&token=USDC を呼び出す

**期待結果:**
- 200 OKが返される
- eligibleがtrueになる

#### TC-PAY-003: Paymaster残高取得（トークン指定）
**前提条件:**
- Paymasterアドレスが設定されている

**テストステップ:**
1. GET /paymaster/balance?token=USDC を呼び出す

**期待結果:**
- 200 OKが返される
- トークン残高が返される
- decimalsが6（USDC）になる

#### TC-PAY-004: ガス代見積もり
**前提条件:**
- 有効なUserOperationデータが存在する

**テストステップ:**
1. POST /paymaster/estimate に UserOperation を送信

**期待結果:**
- 200 OKが返される
- トークン換算のガス代が返される

---

## 8. バリデーションのテスト

### 8.1 入力検証

#### TC-VAL-001: Vault作成（バリデーションエラー - vaultId形式）
**前提条件:**
- 不正な形式のvaultIdを使用する

**テストステップ:**
1. POST /vaults に不正なvaultIdを送信

**期待結果:**
- 400 Bad Requestが返される
- バリデーションエラー詳細が返される

#### TC-VAL-002: Escrow作成（バリデーションエラー - amount）
**前提条件:**
- 空のamountを使用する

**テストステップ:**
1. POST /escrows に空のamountを送信

**期待結果:**
- 400 Bad Requestが返される
- バリデーションエラーが返される

#### TC-VAL-003: Policy作成（バリデーションエラー - threshold）
**前提条件:**
- threshold < 1を使用する

**テストステップ:**
1. POST /policies に threshold: 0 を送信

**期待結果:**
- 400 Bad Requestが返される
- バリデーションエラーが返される

---

## 9. サービスレイヤーのテスト

### 9.1 EscrowService

#### TC-SVC-ESC-001: Subgraphからエスクロー取得
**前提条件:**
- SubgraphにEscrowデータが存在する

**テストステップ:**
1. `fetchEscrowsFromSubgraph()` を呼び出す

**期待結果:**
- Escrow配列が返される

#### TC-SVC-ESC-002: エスクロードラフト作成
**前提条件:**
- 有効なドラフトデータが存在する

**テストステップ:**
1. `createEscrowDraft()` を呼び出す

**期待結果:**
- ドラフトが作成される
- statusが "draft" になる

#### TC-SVC-ESC-003: Subgraphデータ同期
**前提条件:**
- SubgraphとNeonで差分がある

**テストステップ:**
1. `syncEscrowFromSubgraph()` を呼び出す

**期待結果:**
- Neonのデータが更新される

### 9.2 InviteService

#### TC-SVC-INV-001: 招待トークン生成
**前提条件:**
- なし

**テストステップ:**
1. `generateInviteToken()` を呼び出す

**期待結果:**
- 64文字のhex文字列が返される

#### TC-SVC-INV-002: EIP-712 TypedData生成
**前提条件:**
- 有効な招待メッセージが存在する

**テストステップ:**
1. `generateTypedData()` を呼び出す

**期待結果:**
- 正しい形式のTypedDataが返される

#### TC-SVC-INV-003: 招待検証（有効）
**前提条件:**
- 有効な招待トークンが存在する

**テストステップ:**
1. `validateInvite()` を呼び出す

**期待結果:**
- `valid: true` が返される

#### TC-SVC-INV-004: 招待検証（期限切れ）
**前提条件:**
- 期限切れの招待が存在する

**テストステップ:**
1. `validateInvite()` を期限切れトークンで呼び出す

**期待結果:**
- `valid: false` が返される
- `error: "Invite has expired"` が返される

### 9.3 PaymasterService

#### TC-SVC-PAY-001: スポンサーシップリクエスト処理
**前提条件:**
- 有効なUserOperationが存在する

**テストステップ:**
1. `requestSponsorship()` を呼び出す

**期待結果:**
- SponsorshipResponseが返される
- sponsoredがtrueになる

#### TC-SVC-PAY-002: 資格チェック（残高不足）
**前提条件:**
- 残高が不足しているアドレスを使用する

**テストステップ:**
1. `checkEligibility()` を呼び出す

**期待結果:**
- `eligible: false` が返される
- 理由が返される

#### TC-SVC-PAY-003: トークン換算ガスコスト計算
**前提条件:**
- 有効なガスコストが存在する

**テストステップ:**
1. `calculateTokenCost()` を USDC で呼び出す

**期待結果:**
- トークン数量が返される
- フォーマット済み文字列が返される

### 9.4 PolicyService

#### TC-SVC-POL-001: ポリシー作成（監査ログ付き）
**前提条件:**
- 有効なポリシーデータが存在する

**テストステップ:**
1. `createPolicy()` を呼び出す

**期待結果:**
- ポリシーが作成される
- 監査ログが記録される

#### TC-SVC-POL-002: ポリシー更新（監査ログ付き）
**前提条件:**
- 既存のポリシーが存在する

**テストステップ:**
1. `updatePolicy()` を呼び出す

**期待結果:**
- ポリシーが更新される
- 変更内容が監査ログに記録される

#### TC-SVC-POL-003: ポリシー変更履歴取得
**前提条件:**
- ポリシーの変更履歴が存在する

**テストステップ:**
1. `getPolicyChangeHistory()` を呼び出す

**期待結果:**
- 変更履歴配列が返される
- 時系列順に並んでいる

### 9.5 TimelineService

#### TC-SVC-TL-001: 承認イベント記録
**前提条件:**
- 有効なEscrow IDが存在する

**テストステップ:**
1. `recordApproval()` を呼び出す

**期待結果:**
- 承認イベントが記録される
- eventTypeが "escrow_approved" になる

#### TC-SVC-TL-002: 承認進捗計算
**前提条件:**
- 複数の承認イベントが存在する

**テストステップ:**
1. `calculateApprovalProgress()` を呼び出す

**期待結果:**
- 現在の承認数が返される
- 進捗パーセンテージが計算される
- 承認者リストが返される

#### TC-SVC-TL-003: タイムライン統計
**前提条件:**
- タイムラインイベントが複数存在する

**テストステップ:**
1. `getTimelineStats()` を呼び出す

**期待結果:**
- イベント総数が返される
- イベントタイプ別の統計が返される

---

## 10. エラーハンドリングのテスト

### 10.1 共通エラー

#### TC-ERR-001: データベース接続エラー
**前提条件:**
- データベースが利用不可

**テストステップ:**
1. 任意のAPIエンドポイントを呼び出す

**期待結果:**
- 500 Internal Server Errorが返される
- エラー詳細が返される

#### TC-ERR-002: 不正なJSON形式
**前提条件:**
- 不正な形式のJSONを送信する

**テストステップ:**
1. POST リクエストに不正なJSONを送信

**期待結果:**
- 400 Bad Requestが返される

#### TC-ERR-003: 存在しないエンドポイント
**前提条件:**
- 定義されていないエンドポイントを使用する

**テストステップ:**
1. GET /invalid-endpoint を呼び出す

**期待結果:**
- 404 Not Foundが返される

---

## 11. 統合テスト

### 11.1 エンドツーエンドフロー

#### TC-E2E-001: Vault作成からEscrowリリースまで
**テストステップ:**
1. Vault作成（POST /vaults）
2. ポリシー設定（POST /policies）
3. メンバー追加（POST /vaults/:id/members）
4. Escrowドラフト作成（POST /escrows）
5. 承認記録（POST /escrows/:id/timeline）
6. リリース実行

**期待結果:**
- 全ステップが正常に完了する
- タイムラインに全イベントが記録される

#### TC-E2E-002: 招待フロー
**テストステップ:**
1. 招待作成（POST /invites）
2. 招待検証（GET /invites/:token）
3. 招待受諾（POST /invites/:token/accept）
4. メンバー確認（GET /vaults/:id/members）

**期待結果:**
- 招待が使用済みになる
- 新メンバーが追加される

---

## 受け入れ基準サマリー

### 機能要件
- ✅ 全APIエンドポイントが仕様書通りに動作する
- ✅ バリデーションが正しく機能する
- ✅ エラーハンドリングが適切に行われる
- ✅ データベース操作が正常に動作する
- ✅ サービスレイヤーのビジネスロジックが正しい

### 非機能要件
- ✅ レスポンスタイムが200ms以下（95パーセンタイル）
- ✅ 並行リクエストに対応できる
- ✅ トランザクション整合性が保たれる
- ✅ セキュリティ要件（認証、バリデーション）を満たす

### テストカバレッジ目標
- 単体テスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%
