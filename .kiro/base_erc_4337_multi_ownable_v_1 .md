# ファミリー共有ウォレット × Base（ERC‑4337 + MultiOwnable + EscrowRegistry）開発仕様書 v1.3

**最終更新日:** 2025-09-28  
**対象チェーン:** Base (EVM)  
**要素技術:** ERC‑4337（Account Abstraction）, MultiOwnable, EscrowRegistry（条件登録方式）, Paymaster（USDC/JPYCガス支払い）, WalletConnect v2, Expo.dev, Hono API

---

## 0. エグゼクティブサマリー
- 家族や小規模グループが、**共同管理ウォレット**を通じて資産・IoT操作権を安全に管理。 
- 各ユーザーは **4337 スマートアカウント**を所有。共同資産は **EscrowRegistry** に条件レコードとして登録。 
- **MultiOwnableポリシー**に基づき承認条件（署名/タイムロック/M-of-N）を満たした場合のみ資産が移転。 
- 通貨は **ETH/USDC(Base)/JPYC** をサポート。 
- クライアントは **Expo.dev（React Native）**、APIは **Hono（TypeScript）**、接続は **WalletConnect v2**。

---

## 0.1 4337 Wallet & MultiOwnable の“元仕様”の把握と本設計への反映
**要点整理（オリジナルの仕様観点）**
- **ERC‑4337（AA）**: EOAに依存せず、検証ロジック/署名方式/セッション鍵/ソーシャルリカバリ等をモジュール化。UserOperation を Bundler が集約実行、Paymaster によりガス抽象化が可能。
- **MultiOwnable**: 規格というより **複数オーナー/ロール/しきい値/タイムロック** をスマコンに実装するデザインパターン。Safe系/MPC系/カスタム実装に共通の考え方。

**本仕様への具体的な反映**
- 各メンバーは **4337スマートアカウント**（Kernel/Safe4337等）を所持し、**approveRelease** などの承認操作を **UserOperation** として送信（→ Bundler → EntryPoint）。
- **Paymaster** を介して **USDC/JPYCガス** を許容（UX改善）。
- **MultiOwnableの要素** は **Policy{threshold,timelock,rolesRoot}** として **EscrowRegistry** 内に実装。RELEASE/CANCEL/POLICY_UPDATE の各操作に対し **M-of-N + Timelock** を適用。
- ロールメンバーは **Merkle Root（rolesRoot）** で圧縮し、更新時は強い承認条件＋タイムロック。

---

## 0.2 アカウントとグループの概念設計（分かりやすい整理）
**アカウント（Account）**
- 人にひもづくウォレット。**4337スマートアカウント**。
- 役割: 提案・承認の主体。署名はEIP‑712/AAで実行。

**グループ（Group / Vault）**
- 家族などの集合体。UI上の「ボード」。
- 実体は **EscrowRegistry 上のエスクロー集合** を **vaultId** で束ねた論理グループ。
- グループの“ルール”は **Policy（MultiOwnable的条件）** として定義。

**エスクロー（Escrow）**
- 1件の支出/送金/外部コール/IoT権限付与要求を **レコード化**。
- `payer`,`payee`,`token`,`amount`,`policyId`,`deadline` を保持。
- `release(escrowId, proof)` 時に **グループのルール（Policy）** を満たしているかを検証し、移転/コール実行。

**権限と可視化**
- Viewer / Member / Guardian / Owner は **rolesRoot** により表現（UIでは役割名で表示）。
- だれが何を提案・承認しているかは Subgraph で集計しタイムライン表示。

**モデルの関係図（簡略）**
```
[Account A (4337)]    [Account B (4337)]    [Account C (4337)]
       \                    |                    /
        \                   |                   /
           ---- Group/Vault (vaultId=FAMILY-1) ----
                           |
                   Policy {threshold, timelock, rolesRoot}
                           |
                  EscrowRegistry (単一コントラクト)
                      |  create/approve/release/cancel
                  [Escrow #101] [Escrow #102] ...
```

**ポイント**
- 共同管理“ウォレット”の実体を **単一のレジストリ + 論理グルーピング** へ還元し、**デプロイ1回&履歴一元管理** を実現。
- MultiOwnable の概念を **Policy** に落とし込み、**操作ごとの M-of-N/Timelock** を明示。

---

## 1. 開発環境
### 1.1 ツールチェーン（推奨セット）
- **Solidity/コントラクト**
  - **Foundry**（推奨）：`forge`（ビルド/テスト/フォーク/E2E）, `cast`（CLI呼び出し）, `anvil`（ローカルノード）
  - **Hardhat**（補助/代替）：`hardhat-deploy`, `hardhat-ethers`, `solidity-coverage`, `hardhat-gas-reporter`
  - **OpenZeppelin**：`@openzeppelin/contracts`（ERC20, Ownable 等）
  - **静的解析**：**Slither**、**solhint**、**prettier-plugin-solidity**
  - **プロパティテスト/ファジング**：Foundry 標準 + （任意）Echidna
- **サブグラフ**：The Graph（`graph-cli`）
- **API**：Hono（TypeScript）, Node.js 20 / Cloudflare Workers（miniflare 開発）
- **フロント**：
  - Web：Next.js 15, **wagmi v2 + viem**
  - モバイル：Expo SDK 52, React Native 0.75, **WalletConnect v2 RN**

### 1.2 セットアップ手順（抜粋）
```bash
# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version

# Node
fnm use 20 || nvm use 20

# リポジトリ
pnpm i
pnpm -w dlx rimraf node_modules && pnpm i --frozen-lockfile

# Lint/Format
pnpm solhint
pnpm lint && pnpm format
```

### 1.3 CI チェック
- `forge test -vvv`（全テスト）
- `forge test --fork-url=$BASE_RPC`（Base フォーク）
- `slither .`（静的解析）
- `hardhat coverage && hardhat-gas-reporter`（必要に応じて）

---

## 2. コントラクト設計
### 2.1 EscrowRegistry.sol
**構造体:**
```solidity
struct Escrow {
    address payer;
    address payee;
    address token;      // ETH=0, ERC20=address (USDC/JPYC対応)
    uint256 amount;
    bytes32 policyId;
    uint64 createdAt;
    uint64 deadline;
    bool released;
}

struct Policy {
    uint8 threshold;    // M-of-N
    uint32 timelock;    // 秒
    bytes32 rolesRoot;  // Merkle Root
}
```

**関数:**
```solidity
function createEscrow(Escrow calldata e, bytes calldata payerSig) external returns (uint256 escrowId);
function approveRelease(uint256 escrowId, bytes calldata sig) external;
function revokeApproval(uint256 escrowId) external;
function release(uint256 escrowId, bytes calldata proof) external;
function cancel(uint256 escrowId) external;
function policyOf(bytes32 policyId) external view returns (Policy memory);
```

**特徴:**
- ERC20 は `transferFrom`。Permit (EIP-2612/3009) 対応。
- `release` 時に条件検証（署名集約・timelock・threshold）。
- `rolesRoot` は Merkle 検証で更新可能。

### 2.2 MultiOwnablePolicy
- RELEASE: M-of-N 署名
- CANCEL: より強い M-of-N
- POLICY_UPDATE: Owner+Guardian 必須 + Timelock

### 2.3 デバイス連携
- IoT デバイスは **Device DID/Ethereum Address** をレジストリに登録。
- `createEscrow` の `target=deviceACL` による権限付与。
- デバイス署名は Hono API で検証。

---

## 3. API設計 (Hono)
※ AA（4337）向けの RPC/Bundler/Paymaster 認証は API からは **渡さない**。クライアントが直接 Bundler/Paymaster に署名済み UserOperation を送る。API はメタ/補助（チャレンジ発行、オフチェーン記録、集計）に専念。

### 認証
- JWT (familyId, memberId)
- Wallet署名検証 (EIP-712)

### エンドポイント
```http
POST /escrows            # createEscrow
POST /escrows/:id/approve # approveRelease
POST /escrows/:id/release # release
POST /escrows/:id/cancel  # cancel
GET  /escrows?vaultId=... # 一覧
GET  /policies/:id        # ポリシー参照
POST /policies/:id        # ポリシー更新

POST /auth/device/challenge # IoTデバイス相互認証
POST /auth/device/verify    # IoT署名検証
```

### 型定義例 (TypeScript)
```ts
interface EscrowInput {
  payer: string;
  payee: string;
  token: string; // 0x0=ETH, USDC, JPYC
  amount: string;
  policyId: string;
  deadline?: number;
}
```

### 認証
- JWT (familyId, memberId)
- Wallet署名検証 (EIP-712)

### エンドポイント
```http
POST /escrows            # createEscrow
POST /escrows/:id/approve # approveRelease
POST /escrows/:id/release # release
POST /escrows/:id/cancel  # cancel
GET  /escrows?vaultId=... # 一覧
GET  /policies/:id        # ポリシー参照
POST /policies/:id        # ポリシー更新

POST /auth/device/challenge # IoTデバイス相互認証
POST /auth/device/verify    # IoT署名検証
```

### 型定義例 (TypeScript)
```ts
interface EscrowInput {
  payer: string;
  payee: string;
  token: string; // 0x0=ETH, USDC, JPYC
  amount: string;
  policyId: string;
  deadline?: number;
}
```

---

## 4. クライアント実装
### 4.1 SDK 選定（ウォレット/AA）
- **Web（Next.js）**
  - 接続: **wagmi v2 + viem**（WalletConnect v2 Modal, Coinbase Wallet SDK）
  - AA: **permissionless / viem** 又は **Biconomy Smart Accounts SDK** 又は **Safe{Core} AA**（いずれも Base 対応の Bundler/Paymaster と連携）
  - 推奨構成（保守性/採用実績/自由度のバランス）: **viem + permissionless + 外部Bundler（Stackup/Pimlico等）**
- **モバイル（Expo）**
  - 接続: **@walletconnect/modal-react-native**（Universal Link/Deep Link）
  - 署名: 外部ウォレット（Coinbase Wallet, MetaMask, Rainbow 等）に委譲
  - AA: クライアントで UserOperation を構築し、**Bundler RPC** に直接 POST（`permissionless` の RN 対応 or 専用薄ラッパを使用）

> **代替**: Biconomy / Safe SDK を Web で採用し、モバイルは WalletConnect 経由で署名。将来 Native embedded wallet を検討。

### 4.2 Expo.dev（React Native）
- 主要ライブラリ: `@walletconnect/modal-react-native`, `viem`, `expo-notifications`, `expo-barcode-scanner`
- フロー: QR起動 → 外部ウォレット承認 → UserOperation 構築 → Bundler 送信 → Txハッシュ取得 → Hono API にメタ書き込み

### 4.3 Web（Next.js）
- 主要ライブラリ: `wagmi@2`, `viem`, `@walletconnect/modal`, （AA）`permissionless` or `@biconomy/account`
- フロー: Connect → EscrowInput 生成 → `createEscrow` → `approveRelease` → `release`

### 4.4 4337 具体フロー（擬似コード）
```ts
// 1) Client builds UserOperation
const uo = await aaClient.buildUserOp({
  target: ESCROW_REGISTRY,
  data: iface.encodeFunctionData('approveRelease', [escrowId, sig]),
});

// 2) Paymaster sponsorship (USDC/JPYC)
const sponsored = await paymaster.sponsorUserOperation(uo);

// 3) Send to Bundler
const res = await bundler.sendUserOperation(sponsored);
const receipt = await bundler.waitForTx(res);
```

---

## 5. ユースケース
1. **生活費送金** (少額)
   - Member → `createEscrow(token=JPYC, amount=5000)`
   - 1-of-3 承認 → `release`

2. **高額購入** (家電)
   - Member → `createEscrow(token=USDC, amount=500)`
   - 2-of-3 承認 + 24h timelock → `release`

3. **IoTデバイス権限付与**
   - Owner → `createEscrow(target=deviceACL, data=grant(user,7days))`
   - 承認 → `release` → デバイス権限付与

4. **キャンセル/返金**
   - deadline超過 → Guardian 承認 → `cancel`

5. **Paymaster（JPYC/USDC）支払い**
   - クライアントは Paymaster に sponsorship を要求 → 承認された UserOperation を Bundler 経由で送信

---
1. **生活費送金** (少額)
   - Member → `createEscrow(token=JPYC, amount=5000)`
   - 1-of-3 承認 → `release`

2. **高額購入** (家電)
   - Member → `createEscrow(token=USDC, amount=500)`
   - 2-of-3 承認 + 24h timelock → `release`

3. **IoTデバイス権限付与**
   - Owner → `createEscrow(target=deviceACL, data=grant(user,7days))`
   - 承認 → `release` → デバイス権限付与

4. **キャンセル/返金**
   - deadline超過 → Guardian 承認 → `cancel`

---

## 6. ガス最適化
- 単一コントラクト (EscrowRegistry) でデプロイコスト削減
- Merkle Root によるロール管理
- オフチェーン署名集約 + 一括 `release`
- Paymaster による USDC/JPYC ガス支払い

---

## 7. テスト計画
### 7.1 単体（Foundry）
- Escrow: create / approve / revoke / release / cancel
- Policy: threshold/timelock/rolesRoot 更新
- ERC20: USDC/JPYC permit/3009 経由ロック

### 7.2 結合（Foundry + Anvil）
- approve → revoke → approve 順序
- timelock 経過検証、deadline 失効シナリオ
- IoT: challenge → verify → ACL grant 呼び出し

### 7.3 E2E（Playwright + wagmi/WalletConnect モック）
- Web: Connect → Create → Approve → Release
- Mobile: Expo → WalletConnect → Approve → Release

### 7.4 解析/品質
- Slither（再入稿/可視性/代入脆弱）
- Coverage >= 90%
- Gas レポート: 閾値/メンバー数スケーリング

---

## 8. 運用
- Vault単位でエスクローをグループ化
- 月次レポート: タグ別支出 (食費/教育/医療)
- Social Recovery: Guardian紛失時の復旧

---

## 変更履歴
- v1.4 (2025-09-28) **Solidity 開発環境/ツール**（Foundry/Slither 等）を明記。**ウォレット/AA SDK 選定**（wagmi+viem+permissionless/WalletConnect RN）と 4337 フローを追記。
- v1.3 (2025-09-28) JPYC対応、開発仕様書レベルに具体化。
- v1.2 (2025-09-28) EscrowRegistry方式採用。
- v1.1 (2025-09-28) Hono API / Expo.dev / WalletConnect対応。
- v1.0 (2025-09-28) 初版作成。

