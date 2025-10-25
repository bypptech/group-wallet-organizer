# Family Wallet - マルチシグネチャエスクローウォレット

> Base Network 上で動作するマルチシグネチャエスクローウォレットシステム

**Family Wallet** は、家族やグループで資金を安全に管理し、複数の承認者によるエスクロー制御を実現する Web3 アプリケーションです。

## 📊 プロジェクト進捗状況

**現在のステータス**: ✅ テストネットデプロイ準備完了

### 完了したフェーズ
- ✅ **Phase 1**: モノレポ構造セットアップ
- ✅ **Phase 2**: Web3 基盤構築（wagmi v2 + RainbowKit + Account Abstraction）
- ✅ **Phase 3**: Smart Contract 実装（EscrowRegistry, PolicyManager, RoleVerifier）
- ✅ **Phase 4**: Frontend 統合（契約フック、ABI、コンポーネント）

### 次のステップ
- 🔄 Base Sepolia へのコントラクトデプロイ
- 🔄 フロントエンドの実装完成
- 🔄 エンドツーエンドテスト

詳細は [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) と [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

---

# bypp AICoding Kit 統合ドキュメント

> AI駆動Web3開発フレームワーク - 仕様先行・TDD・AI協調による高品質な開発環境の完全ガイド

**bypp AICoding Kit**（旧: Tsumiki × Web3AIVibeCodingKit 統合開発フレームワーク）は、複数のAIツールを統合し、仕様書作成からTDD実装まで一貫した開発フローを提供するWeb3アプリケーション開発フレームワークです。

## 目次

- [概要](#概要)
- [技術スタック・アーキテクチャ](#技術スタック・アーキテクチャ)
- [前提環境・依存関係](#前提環境・依存関係)
- [初期インストール設定ガイド](#初期インストール設定ガイド)
- [設定の優先適用順とガバナンス](#設定の優先適用順とガバナンス)
- [プロジェクト構造](#プロジェクト構造)
- [AI設定の単一ソース運用](#ai設定の単一ソース運用)
- [MCPサーバー統合](#mcpサーバー統合)
- [開発フロー](#開発フロー)
- [実行コマンド一覧](#実行コマンド一覧)
- [新規プロジェクトへの適用手順](#新規プロジェクトへの適用手順)
- [認証・セキュリティ](#認証・セキュリティ)
- [品質保証・CI/CD](#品質保証・cicd)
- [トラブルシューティング](#トラブルシューティング)
- [開発実例](#開発実例)
- [今後の拡張提案](#今後の拡張提案)
- [リソース・ドキュメント](#リソース・ドキュメント)

## 概要

### 🎯 開発思想
- **Spec-First**: コードより先に仕様書
- **Test-First**: 実装より先にテスト
- **AI-Collaboration**: 適材適所のAI活用

### 統合の目的
- **VibeKit** → Web3 DApp開発の手順書・テンプレート構成
- **Tsumiki** → 仕様生成・テスト駆動・逆生成を可能にするコマンド群
- **統合効果** → 手順に従い、コマンドを回すだけでWeb3 AI TDDが実践できる開発環境

### 🔧 コアコンポーネント
- **Kiro**（仕様管理）: `.kiro/specs` での正本管理
- **Tsumiki**（仕様/TDD自動化）: `@kairo-*`, `@tdd-*`, `@rev-*` コマンド群
- **複数AI**（Claude/Gemini/Codex）: 役割分担による効率的開発
- **単一ソース運用**（`.ai/`）: 設定の一貫性保証

## 技術スタック・アーキテクチャ

### アーキテクチャ構成（現状反映）
- **フロントエンド**: React 18 + Vite（`apps/web`）
  - ルーティング: Wouter
  - スタイリング: TailwindCSS + Shadcn/UI（Radixベース）
  - サーバ状態管理: TanStack Query
- **バックエンド**: Hono on Node.js（`apps/api`）
  - 認証: JWT（`/auth/register` `/auth/login` `/auth/refresh` `/me`）
  - 実装: `jose` + `bcryptjs`
  - バリデーション: Zod
- **データ**: Drizzle ORM + PostgreSQL（Supabase 互換）
- **配信方式**: Option B（Web と API の分離配信）
  - Web: `apps/web` を独立ビルド/配信
  - API: `apps/api` は静的配信を行わず純API
- **モノレポ構成**: npm workspaces
  - `apps/web`, `apps/api`, `packages/shared`
  - パスエイリアス: `@shared/*` → `packages/shared/src/*`

### AI統合構成
- **Claude**: コーディング・実装・デバッグ（主要責務）
- **Gemini**: 要件定義・設計・レビュー（仕様フェーズ）
- **Codex**: オートコンプリート・スニペット・ドキュメント（開発支援）
- **Kiro**: ワークフロー・品質ゲート・仕様管理（統制）

## 前提環境・依存関係

### 必須環境
- Node.js LTS（推奨: v20）/ npm
- git

### 推奨環境
- VSCode 等のエディタ（TypeScript 対応）

### 主要依存関係

#### 実行時依存
| カテゴリ | パッケージ | 用途 |
|---------|-----------|------|
| **API** | `hono`, `@hono/node-server` | Web APIフレームワーク |
| | `jose`, `bcryptjs` | JWT認証・パスワードハッシュ |
| **Web** | `react`, `react-dom` | UIフレームワーク |
| | `@tanstack/react-query` | サーバ状態管理 |
| | `wouter` | ルーティング |
| | `@radix-ui/*`, `shadcn/ui` | UIコンポーネント |
| **共通** | `zod` | バリデーション・型定義 |
| | `drizzle-orm` | ORM（データベース） |

#### 開発時依存
| カテゴリ | パッケージ | 用途 |
|---------|-----------|------|
| **ビルド** | `vite`, `esbuild` | フロントエンドビルド |
| | `tsx`, `typescript` | TypeScript実行・型チェック |
| **データベース** | `drizzle-kit` | マイグレーション・スキーマ管理 |
| **ブロックチェーン** | `hardhat` | スマートコントラクト開発（任意） |
| **品質** | （未設定） | 必要に応じて導入 |
| **テスト** | `jest`, `ts-jest` | テストフレームワーク（任意） |

## 初期インストール設定ガイド

### 前提環境確認
```bash
# 必須環境の確認
node --version    # v20以上推奨
npm --version     # 最新版推奨
git --version     # 2.x以上

# 推奨ツール
code --version    # VSCode（任意）
```

### Step 1: プロジェクトのクローンと依存関係インストール
```bash
# リポジトリのクローン
git clone <your-repo-url>
cd bypp-aicoding-kit

# workspaces全体の依存関係をインストール
npm ci

# インストール確認
npm list --depth=0

# 依存関係の確認
npm run check-deps  # 依存関係の整合性チェック（スクリプトがある場合）
```

### Step 2: AI設定の初期化
```bash
# AI設定を各ツールに生成・適用
npm run ai:migrate

# コマンドテンプレートを配布（Claude/Codex）
npm run agents:sync

# MCP設定を確認
npm run mcp:check
```

### Step 3: 環境変数の設定
```bash
# .env.example をコピーして .env を作成
cp .env.example .env

# .env ファイルを編集（必須項目）
cat >> .env << 'EOF'
# データベース（必須）
DATABASE_URL=postgres://username:password@localhost:5432/myproject

# API設定（必須）
JWT_SECRET=$(openssl rand -hex 32)
WEB_ORIGIN=http://localhost:5173
PORT=5000

# MCP設定（任意 - AI機能拡張用）
GITHUB_TOKEN=ghp_your_github_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Web3設定（任意 - スマートコントラクト開発用）
PRIVATE_KEY=your_private_key_for_contracts
ALCHEMY_API_KEY=your_alchemy_api_key
EOF
```

### Step 4: 初期動作確認
```bash
# 全体のビルドテスト
npm run build:api
npm run build:web

# 開発サーバーの起動
npm run dev
# → API: http://localhost:5000 で起動
# → Web: http://localhost:5173 で起動

# AI設定の動作確認
npm run ai:migrate && npm run agents:sync
git status  # 差分がないことを確認
```

## 設定の優先適用順とガバナンス

### AGENTS.md統括による優先順位

ルート `AGENTS.md` が全体を統括し、以下の優先順位で設定が適用されます：

1. **会話の指示**（System/Developer/User）
2. **ルート `AGENTS.md`**（運用規範・全体統括）
3. **下位ディレクトリの `AGENTS.md`**（より近い階層が優先）
   - `.claude/AGENTS.md` - Claude固有の補足
   - `.gemini/AGENTS.md` - Gemini固有の補足
   - `.codex/AGENTS.md` - Codex固有の補足
4. **仕様の正本**: `.kiro/specs/<project>/{requirements.md,design.md,tasks.md}`
5. **AI設定の正本**: `.ai/{config.yaml,quality-gates.yaml}`（ツール側は生成物）
6. **ドラフト仕様**: `docs/{specs,design,tasks}`（レビュー後 `.kiro/specs` へ同期）

### 役割分担の明確化
- **「何を作るか」**: `.kiro/specs`（要件/設計/タスク）を優先
- **「どう進めるか」**: ルート `AGENTS.md` の運用規範を優先
- **「どう設定するか」**: `.ai/` は AI 設定の単一ソース（`.claude/` `.codex/` `.gemini/` は生成物）

### AGENTS.md依存関係図
```mermaid
graph TB
    A[ルート AGENTS.md<br/>運用規範・全体統括] --> B[.claude/AGENTS.md<br/>Claude固有補足]
    A --> C[.gemini/AGENTS.md<br/>Gemini固有補足]
    A --> D[.codex/AGENTS.md<br/>Codex固有補足]

    A --> E[.kiro/specs/<project>/<br/>仕様の正本]
    A --> F[.ai/config.yaml<br/>AI設定の正本]
    A --> G[docs/specs/<br/>ドラフト仕様]

    E --> H[requirements.md<br/>要件定義書]
    E --> I[design.md<br/>設計書]
    E --> J[tasks.md<br/>タスクリスト]

    F --> K[.claude/CLAUDE.generated.md]
    F --> L[.gemini/settings.generated.json]
    F --> M[.codex/CODEX.generated.md]

    style A fill:#ff9999
    style E fill:#99ccff
    style F fill:#99ff99
```

## プロジェクト構造

```bash
bypp-aicoding-kit/
├── .ai/                  # AI設定の単一ソース（実装済み）
│   ├── config.yaml       # 共通設定（project/roles/techStack/quality/mcp）
│   ├── quality-gates.yaml # 品質ゲートの正本
│   └── templates/
│       └── commands/     # 共通コマンド雛形（Claude/Codexへ配布）
│
├── .claude/              # Claude設定（生成物＋補助）
│   ├── AGENTS.md         # Claude用指示書
│   ├── CLAUDE.md / CLAUDE.generated.md
│   ├── commands/         # AIコマンド定義（Tsumiki提供）
│   ├── agents/           # AIエージェント設定
│   └── mcp.json         # ルート mcp.json の同期生成
│
├── .codex/               # Codex設定（生成物＋補助）※実装済み
│   ├── AGENTS.md         # Codex用指示書
│   ├── CODEX.md / CODEX.generated.md
│   └── commands/         # Codexコマンド
│
├── .gemini/              # Gemini設定
│   ├── AGENTS.md         # Gemini用指示書
│   ├── GEMINI.md / GEMINI.generated.md
│   ├── prompts/          # プロンプトテンプレート
│   └── settings.json / settings.generated.json
│
├── .kiro/                # Kiro仕様管理（正本）
│   ├── specs/<project>/  # プロジェクト仕様書
│   │   ├── requirements.md # 要件定義書
│   │   ├── design.md     # 設計書
│   │   └── tasks.md      # タスクリスト
│   ├── settings/         # Kiro設定
│   └── steering/         # ワークフロー定義
│
├── docs/                 # ドキュメント（ドラフト）
│   ├── specs/            # 要件定義書ドラフト
│   ├── design/           # 設計書ドラフト
│   ├── tasks/            # タスクリストドラフト
│   ├── templates/        # 各種テンプレート
│   └── ai-configuration.md # AI設定説明
│
├── scripts/              # 自動化スクリプト
│   ├── ai-config-migrator.js  # .ai → 各ツールへの生成/合成＋mcp同期（実装済み）
│   ├── agents/
│   │   └── sync-commands.ts   # 共通コマンド雛形の配布（実装済み）
│   ├── specs/
│   │   └── sync-specs.js      # docs と .kiro/specs の同期（実装済み）
│   ├── mcp/
│   │   └── check.sh           # mcp.json 定義の確認（実装済み）
│   ├── vibekit/               # VibeKit用スクリプト
│   ├── spec-init.sh           # 仕様初期化
│   ├── tdd-cycle.sh           # TDDサイクル実行
│   └── reverse-gen.sh         # 逆生成スクリプト
│
├── apps/                 # アプリケーション
│   ├── web/             # React + Vite（Option B/分離配信）
│   └── api/             # Hono API（JWT認証, 静的配信なし）
│
├── packages/             # 共有パッケージ
│   └── shared/          # 共通型・zod/drizzle スキーマ
│
├── contracts/            # スマートコントラクト（Hardhat、任意利用）
│
├── tsumiki-main/         # Tsumikiコア実装
│
├── .github/              # GitHub設定
│   └── workflows/
│       └── ai-sync.yml  # 同期漏れ検知CI（実装済み）
│
├── mcp.json             # MCPサーバー定義（単一ソース）
├── tsconfig.base.json   # パスエイリアス設定（@shared/*）
├── package.json         # npm workspaces設定
└── AGENTS.md           # 運用規範（最優先）
```

## AI設定の単一ソース運用

### 設定ファイル構造
`.ai/`ディレクトリが全AIツールの設定の正本として機能します：

```yaml
# .ai/config.yaml - 共通設定
project:
  name: "bypp-aicoding-kit"
  type: "web3-fullstack"
  description: "AI駆動Web3開発フレームワーク"

# AI役割定義
roles:
  claude:
    primary: "coding"
    specialization:
      - "implementation"
      - "debugging"
      - "refactoring"
  gemini:
    primary: "requirements"
    specialization:
      - "specification"
      - "design"
      - "review"
  codex:
    primary: "completion"
    specialization:
      - "autocomplete"
      - "snippets"
      - "documentation"
  kiro:
    primary: "orchestration"
    specialization:
      - "workflow"
      - "quality-gates"
      - "spec-management"

# 技術スタック
techStack:
  frontend:
    framework: "React + Vite"
    version: "18.x"
    styling: "TailwindCSS + Shadcn/UI"
    router: "Wouter"
    state: "TanStack Query"
  backend:
    framework: "Hono"
    runtime: "Node.js"
    authentication: "JWT (jose + bcryptjs)"
    validation: "Zod"
  database:
    orm: "Drizzle"
    provider: "PostgreSQL/Supabase"
  monorepo:
    structure:
      - "apps/web"
      - "apps/api"
      - "packages/shared"

# 品質設定
quality:
  testing:
    strategy: "TDD"
    coverage: 80
  linting:
    tool: "(optional)"
  security:
    jwt_rotation: true
    secret_management: "env"
```

### 各AIツールへの自動生成メカニズム

#### `npm run ai:migrate` の処理フロー

**1. Claude向け生成** (`.claude/CLAUDE.generated.md`)
```markdown
## プロジェクトコンテキスト
- 名前: bypp-aicoding-kit
- タイプ: web3-fullstack
- 主要責務: コーディング・実装・デバッグ

## 技術スタック詳細
### フロントエンド
- Framework: React 18.x + Vite
- Styling: TailwindCSS + Shadcn/UI
- Router: Wouter
- State: TanStack Query

### バックエンド
- Framework: Hono on Node.js
- Auth: JWT (jose + bcryptjs)
- Validation: Zod

## コーディングガイドライン
- TDDサイクル: Red → Green → Refactor
- カバレッジ目標: 80%
- Linter: Biome
- 命名規約: camelCase (functions), PascalCase (components/types)
```

**2. Gemini向け生成** (`.gemini/settings.generated.json`)
```json
{
  "project": {
    "name": "bypp-aicoding-kit",
    "type": "web3-fullstack"
  },
  "aiRole": {
    "primary": "requirements",
    "specializations": [
      "specification",
      "design",
      "review"
    ]
  },
  "workflowIntegration": {
    "specFirst": true,
    "reviewGates": {
      "requirements": true,
      "design": true,
      "implementation": false
    }
  },
  "qualityChecks": {
    "requirementsCompleteness": 90,
    "designConsistency": true,
    "testCoverage": 80
  }
}
```

**3. Codex向け生成** (`.codex/CODEX.generated.md`)
```markdown
## オートコンプリート設定
- 言語: TypeScript, JavaScript, Solidity
- フレームワーク認識: React, Hono, Hardhat
- インポート自動解決: @shared/* → packages/shared/src/*

## スニペットテンプレート
### React Component
```typescript
import React from 'react';

interface ${1:ComponentName}Props {
  ${2:// props}
}

export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = (props) => {
  return (
    <div>
      ${3:// content}
    </div>
  );
};
```

### Hono Endpoint
```typescript
app.${1:get}('${2:/path}', async (c) => {
  ${3:// handler logic}
  return c.json({ ${4:data} });
});
```
```

#### コマンド配布メカニズム (`npm run agents:sync`)
```typescript
// .ai/templates/commands/ の共通コマンド雛形を
// .claude/commands/ と .codex/commands/ へ配布
// 既存ファイルは上書きしない（カスタマイズ保護）

async function syncCommands() {
  const templateDir = '.ai/templates/commands/';
  const templates = await fs.readdir(templateDir);

  // Claude向け配布
  for (const template of templates) {
    const claudeTarget = `.claude/commands/${template}`;
    if (!exists(claudeTarget)) {
      copyFile(`${templateDir}${template}`, claudeTarget);
      console.log(`✓ Distributed ${template} to Claude`);
    }
  }

  // Codex向け配布
  for (const template of templates) {
    const codexTarget = `.codex/commands/${template}`;
    if (!exists(codexTarget)) {
      copyFile(`${templateDir}${template}`, codexTarget);
      console.log(`✓ Distributed ${template} to Codex`);
    }
  }

  // Geminiは独自のプロンプト形式のため変換
  await convertToGeminiFormat(templates, '.gemini/prompts/');
}
```

### CI/CDによる同期保証（実装済み）
`.github/workflows/ai-sync.yml`が設定の同期漏れを自動検知:

```yaml
name: AI Configuration Sync Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  sync-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run AI migrations
        run: |
          npm run ai:migrate
          npm run agents:sync

      - name: Check for uncommitted changes
        run: |
          if [[ -n $(git status --porcelain) ]]; then
            echo "❌ AI設定の同期が必要です。以下を実行してください:"
            echo "npm run ai:migrate && npm run agents:sync"
            git diff
            exit 1
          fi
          echo "✅ AI設定は同期されています"
```

## MCPサーバー統合

### 利用可能なMCPサーバー（7種）
ルート `mcp.json` を単一ソースとし、`ai:migrate` で各ツールへ同期:

| サーバー | 用途 | 環境変数 |
|---------|-----|---------|
| **context7** | 最新コード・ドキュメント参照 | なし |
| **sequential-thinking** | 順序立てた思考プロセス | なし |
| **OpenZeppelin** | Solidityコントラクト参照 | なし |
| **GitHub** | リポジトリ操作・Issue管理 | `GITHUB_TOKEN` |
| **Playwright** | E2Eテスト自動化 | なし |
| **Apidog** | API設計・テスト | なし（リモート） |
| **Supabase** | データベース操作 | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

### mcp.json設定例
```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "description": "最新コード・ドキュメント参照"
    },
    "GitHub": {
      "command": "npx",
      "args": ["-y", "github-mcp-server"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" },
      "description": "GitHub操作・Issue管理"
    },
    "Supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      },
      "description": "データベース操作"
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "description": "思考プロセス支援"
    },
    "OpenZeppelinSolidityContracts": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.openzeppelin.com/contracts/solidity/mcp"],
      "description": "Solidityコントラクト参照"
    },
    "Playwright": {
      "command": "npx",
      "args": ["-y", "playwright-mcp-server"],
      "description": "E2Eテスト自動化"
    },
    "Apidog": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.apidog.com/server"],
      "description": "API設計・テスト"
    }
  }
}
```

### 環境変数設定
```bash
# MCP用環境変数（.env.local）
GITHUB_TOKEN=ghp_your_github_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 開発フロー

### 仕様作成フロー（Spec → Design → Tasks）
```bash
# 1) ドラフト生成（docs側）- 順次作成・レビュー必須
@kairo-requirements    # 要件定義書作成 → レビュー待ち
# ↓ レビュー承認後
@kairo-design         # 設計書作成 → レビュー待ち
# ↓ レビュー承認後
@kairo-tasks          # タスクリスト作成 → レビュー待ち

# 2) 全レビュー完了後、正本へ同期
npm run specs:sync -- --project <name>  # docs → .kiro/specs/<name>
```

> **ログ記録ルール**: 各 `@kairo-*` コマンドの実行後は `.kiro/logs/YYYYMMDD-kairo-<command>.md` 形式で結果概要を保存し、テンプレートは `.kiro/logs/README.md` を参照してください。

### TDD実装フロー（Red → Green → Refactor）
```bash
# TDDサイクル（AGENTS.md定義の順次実行）
@tdd-requirements     # TDD要件定義
@tdd-testcases       # テストケース作成
@tdd-red             # 失敗テスト作成（RED）
@tdd-green           # 最小実装（GREEN）
@tdd-refactor        # リファクタリング（REFACTOR）

# 段階的進行（各ステップでフィードバック反映）
# 必ずタスクリストに基づいて順番に実装
```

### レガシーコード統合フロー
```bash
# 既存コードから仕様・テストを逆生成
@rev-requirements    # 既存コードから要件抽出
@rev-design         # 設計ドキュメント生成
@rev-tasks          # タスクリスト作成
@rev-specs          # テスト仕様書生成
```

### 運用ツールとコマンド体系
ルート `AGENTS.md` で定義された運用規範に基づき、以下のツールが連携動作します：

#### AI設定管理ツール
- `npm run ai:migrate` - `.ai/` → 各AIツールへ設定生成/合成
- `npm run agents:sync` - 共通コマンド雛形配布（Claude/Codex）
- `npm run mcp:check` - MCP一覧確認

> CI (`.github/workflows/ci.yml`) でも `pnpm run ai:migrate` と `pnpm run agents:sync` を実行し、テンプレートとの差分が無いことを検証しています。

#### 仕様書管理ツール
- `npm run specs:sync -- --project <name>` - ドラフト（docs）→ 正本（.kiro/specs）
- `npm run specs:sync -- --project <name> --from kiro` - 逆方向同期

#### 統一エージェントコマンド
AGENTS.mdで定義された表記統一：
- `@kairo-*` - 仕様系コマンド
- `@tdd-*` - TDD系コマンド
- `@rev-*` - 逆生成系コマンド

## 実行コマンド一覧

### 開発サーバー
```bash
npm run dev          # API + Web 同時起動
npm run dev:api      # API（Hono）のみ起動
npm run dev:web      # Web（Vite）のみ起動
```

### ビルド・デプロイ
```bash
# ビルド
npm run build:web    # Webビルド（production）
npm run build:api    # APIビルド（production）

# 起動
npm start                    # API本番起動（ビルド後）
npm run preview -w apps/web  # Webプレビュー（apps/web の "preview" スクリプト）

# 本番デプロイ（例）
npm run deploy:vercel    # Vercelデプロイ（Web）
npm run deploy:railway   # Railwayデプロイ（API）
```

### AI設定管理
```bash
npm run ai:migrate   # .ai → 各ツールへ生成・同期
npm run agents:sync  # コマンドテンプレート配布（Claude/Codex）
npm run mcp:check    # MCP定義確認・疎通テスト
```

### 仕様書管理
```bash
# 仕様同期
npm run specs:sync -- --project <name>              # docs → .kiro/specs
npm run specs:sync -- --project <name> --from kiro  # 逆方向同期

# 仕様初期化
npm run spec:init    # 仕様雛形作成
```

### データベース
```bash
# スキーマ管理
npm run db:push      # スキーマをDBに反映
```

### コントラクト（Web3）
```bash
# テスト・デプロイ（設定済み）
npm run test:contracts    # コントラクトテスト実行
npm run deploy:local      # ローカルデプロイ（Hardhat）

# 参考: Hardhatタスクの実行
npm run hardhat -- node      # ローカルノード起動
npm run hardhat -- console   # Hardhatコンソール
```

### 品質管理（任意）
```bash
# リント・フォーマット
# 本テンプレートでは未設定です。必要に応じて追加してください。
```

### ユーティリティ
```bash
# クリーンアップ
npm run clean        # ビルド成果物削除
npm run clean:deps   # node_modules削除・再インストール

# 依存関係管理
npm run update:deps  # 依存関係アップデート
npm run audit:fix    # セキュリティ脆弱性修正
```

## 新規プロジェクトへの適用手順

### 概要
bypp AICoding Kitを新規プロジェクトに適用する際の完全な手順ガイドです。既存プロジェクトの改良または全く新しいプロジェクトの構築、どちらにも対応しています。

### Phase 1: 環境準備とセットアップ

#### Step 1.1: 基盤環境の確認
```bash
# 必須環境の確認
node --version    # v20以上推奨
npm --version     # 最新版推奨
git --version     # 2.x以上

# 推奨ツールの確認
code --version    # VSCode（任意）
```

#### Step 1.2: プロジェクト初期化
```bash
# 新規プロジェクトの場合
mkdir my-web3-project
cd my-web3-project
git init

# 既存プロジェクトの場合
cd existing-project
git checkout -b feature/bypp-integration  # バックアップ用ブランチ作成
```

#### Step 1.3: bypp AICoding Kit のクローンと適用
```bash
# 方法A: テンプレートとしてクローン
git clone https://github.com/your-org/bypp-aicoding-kit.git temp-kit
cp -r temp-kit/.ai ./                    # AI設定をコピー
cp -r temp-kit/.claude ./                # Claude設定をコピー
cp -r temp-kit/.gemini ./                # Gemini設定をコピー
cp -r temp-kit/.codex ./                 # Codex設定をコピー
cp -r temp-kit/.kiro ./                  # Kiro設定をコピー
cp -r temp-kit/scripts ./                # スクリプトをコピー
cp -r temp-kit/.github ./               # CI設定をコピー
cp temp-kit/mcp.json ./                  # MCP設定をコピー
cp temp-kit/tsconfig.base.json ./        # TypeScript設定をコピー
cp temp-kit/AGENTS.md ./                 # 運用規範をコピー
rm -rf temp-kit                          # 一時ディレクトリ削除

# 方法B: git submodule として追加
git submodule add https://github.com/your-org/bypp-aicoding-kit.git .kit
ln -s .kit/.ai ./                        # シンボリックリンク作成
ln -s .kit/.claude ./
ln -s .kit/.gemini ./
ln -s .kit/.codex ./
ln -s .kit/.kiro ./
ln -s .kit/scripts ./
ln -s .kit/mcp.json ./
```

#### Step 1.4: プロジェクト構造の適用
```bash
# 必要なディレクトリ構造を作成
mkdir -p apps/web apps/api packages/shared/src
mkdir -p docs/{specs,design,tasks,templates}
mkdir -p contracts tests/contracts
mkdir -p .github/workflows

# package.json のベース作成（workspace設定）
cat > package.json << 'EOF'
{
  "name": "my-web3-project",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "npm run dev --workspace=apps/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "build:api": "npm run build --workspace=apps/api",
    "build:web": "npm run build --workspace=apps/web",
    "ai:migrate": "node scripts/ai-config-migrator.js",
    "agents:sync": "npx tsx scripts/agents/sync-commands.ts",
    "mcp:check": "bash scripts/mcp/check.sh",
    "specs:sync": "node scripts/specs/sync-specs.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "tsx": "^4.7.0"
  }
}
EOF
```

### Phase 2: AI設定のカスタマイズ

#### Step 2.1: プロジェクト固有設定の適用
```bash
# .ai/config.yaml をプロジェクトに合わせて編集
cat > .ai/config.yaml << 'EOF'
project:
  name: "my-web3-project"              # プロジェクト名を変更
  type: "web3-fullstack"               # プロジェクトタイプ（web3-fullstack/dapp/defi/nft）
  description: "あなたのプロジェクトの説明"

roles:
  claude:
    primary: "coding"
    specialization:
      - "implementation"
      - "debugging"
      - "refactoring"
  gemini:
    primary: "requirements"
    specialization:
      - "specification"
      - "design"
      - "review"
  codex:
    primary: "completion"
    specialization:
      - "autocomplete"
      - "snippets"
      - "documentation"

techStack:
  frontend:
    framework: "React + Vite"           # 必要に応じて変更（Next.js等）
    styling: "TailwindCSS + Shadcn/UI"  # 必要に応じて変更
  backend:
    framework: "Hono"                   # 必要に応じて変更（Express等）
    authentication: "JWT (jose + bcryptjs)"
  database:
    orm: "Drizzle"                      # 必要に応じて変更（Prisma等）
    provider: "PostgreSQL/Supabase"     # 必要に応じて変更

quality:
  testing:
    strategy: "TDD"
    coverage: 80
  linting:
    tool: "Biome"                       # 必要に応じて変更（ESLint等）
EOF
```

#### Step 2.2: AI設定の生成と初期化
```bash
# 依存関係をインストール
npm install

# AI設定を各ツールに生成・適用
npm run ai:migrate

# コマンドテンプレートを配布
npm run agents:sync

# MCP設定を確認
npm run mcp:check
```

### Phase 3: プロジェクト構造の構築

#### Step 3.1: Web アプリケーション構造の作成
```bash
# Web アプリ（React + Vite）
cd apps/web
npm init -y
npm install react react-dom @types/react @types/react-dom
npm install -D vite @vitejs/plugin-react typescript tailwindcss postcss autoprefixer
npm install @tanstack/react-query wouter zod

# Vite設定
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
EOF

# TypeScript設定
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# package.json の更新
cat > package.json << 'EOF'
{
  "name": "web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
EOF

cd ../..
```

#### Step 3.2: API サーバー構造の作成
```bash
# API サーバー（Hono）
cd apps/api
npm init -y
npm install hono @hono/node-server jose bcryptjs zod drizzle-orm
npm install -D @types/bcryptjs tsx typescript

# Hono設定
mkdir -p src/routes src/middleware src/lib
cat > src/index.ts << 'EOF'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.get('/', (c) => {
  return c.json({ message: 'Hello from Hono API!' })
})

const port = parseInt(process.env.PORT || '5000')
console.log(`🚀 Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
EOF

# package.json の更新
cat > package.json << 'EOF'
{
  "name": "api",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
EOF

# TypeScript設定
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cd ../..
```

#### Step 3.3: 共有パッケージの作成
```bash
# 共有パッケージ
cd packages/shared
npm init -y
npm install zod drizzle-orm
npm install -D typescript

# 共通型定義
mkdir -p src/types src/schemas src/utils
cat > src/types/index.ts << 'EOF'
// 共通型定義
export interface User {
  id: string
  username: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
EOF

# package.json の更新
cat > package.json << 'EOF'
{
  "name": "shared",
  "private": true,
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
EOF

cd ../..
```

### Phase 4: 環境設定とセキュリティ

#### Step 4.1: 環境変数の設定
```bash
# ルート .env.example を作成
cat > .env.example << 'EOF'
# データベース
DATABASE_URL=postgres://username:password@localhost:5432/myproject

# API設定
JWT_SECRET=your-super-secret-jwt-key-here
WEB_ORIGIN=http://localhost:5173
PORT=5000

# MCP設定（任意）
GITHUB_TOKEN=ghp_your_github_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Web3設定（任意）
PRIVATE_KEY=your_private_key_for_contracts
ALCHEMY_API_KEY=your_alchemy_api_key
EOF

# 実際の .env ファイルを作成（.gitignore に追加）
cp .env.example .env
echo ".env" >> .gitignore
```

#### Step 4.2: セキュリティ設定
```bash
# JWT_SECRET を安全な値に設定
openssl rand -hex 64 | head -c 32 > temp_secret
echo "JWT_SECRET=$(cat temp_secret)" >> .env
rm temp_secret

# データベースURLを適切に設定
# PostgreSQL または Supabase の接続文字列を .env に記載
```

### Phase 5: 仕様書作成とプロジェクト定義

#### Step 5.1: プロジェクト仕様の初期化
```bash
# 仕様書雛形を作成
npm run spec:init

# プロジェクトの .kiro/specs フォルダが存在することを確認
ls -la .kiro/specs/
```

#### Step 5.2: 仕様書の段階的作成（AGENTS.md準拠）
```bash
# フェーズ1: 要件定義（必ずレビューを受ける）
@kairo-requirements
# → docs/specs/ に requirements.md が生成される
# → レビューして承認が得られるまで次に進まない

# フェーズ2: 設計書作成（要件定義承認後）
@kairo-design
# → docs/design/ に design.md が生成される
# → レビューして承認が得られるまで次に進まない

# フェーズ3: タスクリスト作成（設計書承認後）
@kairo-tasks
# → docs/tasks/ に tasks.md が生成される
# → レビューして承認が得られた後、正本に同期

# フェーズ4: 正本への同期
npm run specs:sync -- --project my-web3-project
# → .kiro/specs/my-web3-project/ に正本が作成される
```

### Phase 6: 開発環境の起動と初期テスト

#### Step 6.1: 開発サーバーの起動確認
```bash
# 全体のビルドテスト
npm run build:api
npm run build:web

# 開発サーバーの起動
npm run dev
# → API: http://localhost:5000 で起動
# → Web: http://localhost:5173 で起動
```

#### Step 6.2: AI設定の動作確認
```bash
# AI設定の同期確認
npm run ai:migrate
npm run agents:sync

# 差分がないことを確認（CI相当）
git status
# → 差分がある場合は設定に問題がある可能性
```

### Phase 7: TDD実装の開始

#### Step 7.1: TDDサイクルの実行
```bash
# TDD要件定義
@tdd-requirements
# → テスト要件が明確になる

# テストケース作成
@tdd-testcases
# → 具体的なテストケースが作成される

# Red-Green-Refactorサイクル
@tdd-red      # 失敗テスト作成
@tdd-green    # 最小実装
@tdd-refactor # リファクタリング
```

#### Step 7.2: 段階的な機能開発
```bash
# タスクリストに基づいて順次実装
# 1. 認証機能の実装
# 2. 基本CRUD機能の実装
# 3. Web3機能の実装（該当する場合）
# 4. フロントエンド機能の実装
# 5. 統合テストとE2Eテスト
```

### Phase 8: 品質管理とデプロイ準備

#### Step 8.1: 品質チェックの実行
```bash
# リント・フォーマット
npm run lint
npm run format
npm run typecheck

# テスト実行
npm run test
npm run test:coverage

# セキュリティ監査
npm audit
npm run audit:fix
```

#### Step 8.2: 継続的インテグレーションの確認
```bash
# CI設定の動作確認
# .github/workflows/ai-sync.yml が適切に動作することを確認

# コミット前の最終チェック
npm run ai:migrate && npm run agents:sync
git add .
git commit -m "feat: setup bypp AICoding Kit integration"
```

### Phase 9: プロジェクト固有のカスタマイズ

#### Step 9.1: 技術スタックの調整
```bash
# 必要に応じて技術スタックを変更
# - フロントエンド: React → Next.js, Vue, etc.
# - バックエンド: Hono → Express, Fastify, etc.
# - データベース: Drizzle → Prisma, TypeORM, etc.
# - スタイリング: TailwindCSS → Styled Components, etc.

# .ai/config.yaml を更新後
npm run ai:migrate
```

#### Step 9.2: プロジェクト固有コマンドの追加
```bash
# .ai/templates/commands/ にプロジェクト固有のコマンドを追加
# 例: NFT固有のコマンド、DeFi固有のコマンドなど

# 新しいコマンドを配布
npm run agents:sync
```

### Phase 10: チーム開発の準備

#### Step 10.1: ドキュメントの整備
```bash
# README.md の更新
cat > README.md << 'EOF'
# My Web3 Project

bypp AICoding Kit を使用したWeb3プロジェクトです。

## セットアップ

```bash
npm ci
npm run ai:migrate
npm run agents:sync
```

## 開発サーバー

```bash
npm run dev
```

## 仕様書作成

```bash
@kairo-requirements  # 要件定義
@kairo-design       # 設計書
@kairo-tasks        # タスクリスト
npm run specs:sync -- --project my-web3-project
```
EOF
```

#### Step 10.2: チーム用設定の共有
```bash
# 環境設定ガイドの作成
cat > SETUP.md << 'EOF'
# 開発環境セットアップガイド

## 必要な環境変数

```bash
cp .env.example .env
# .env ファイルを編集して適切な値を設定
```

## AI設定の初期化

```bash
npm run ai:migrate
npm run agents:sync
```

## 開発フロー

1. 仕様書作成: @kairo-requirements → @kairo-design → @kairo-tasks
2. レビューと承認
3. 正本同期: npm run specs:sync -- --project プロジェクト名
4. TDD実装: @tdd-requirements → @tdd-testcases → @tdd-red → @tdd-green → @tdd-refactor
EOF
```

### 完了チェックリスト

新規プロジェクトへの適用が完了したら、以下を確認してください：

- [ ] 基本的なディレクトリ構造が作成されている
- [ ] .ai/config.yaml がプロジェクトに合わせて設定されている
- [ ] npm run ai:migrate が正常に動作する
- [ ] npm run agents:sync が正常に動作する
- [ ] 開発サーバー（API/Web）が正常に起動する
- [ ] 仕様書作成コマンド（@kairo-*）が動作する
- [ ] TDDコマンド（@tdd-*）が動作する
- [ ] 環境変数が適切に設定されている
- [ ] CI/CDパイプラインが動作する
- [ ] チーム用ドキュメントが整備されている

### トラブルシューティング（新規適用時）

#### 設定エラー
```bash
# AI設定生成エラー
rm -rf .claude/CLAUDE.generated.md .gemini/settings.generated.json .codex/CODEX.generated.md
npm run ai:migrate

# コマンド配布エラー
rm -rf .claude/commands .codex/commands
npm run agents:sync
```

#### 依存関係エラー
```bash
# workspace依存関係の修復
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm ci

# TypeScript設定エラー
npx tsc --noEmit --skipLibCheck
```

この手順に従うことで、既存プロジェクトまたは新規プロジェクトにbypp AICoding Kitを適用し、効率的なAI協調開発環境を構築できます。

## 認証・セキュリティ

### JWT認証エンドポイント
- `POST /auth/register` { username, password }
- `POST /auth/login` { username, password } → { accessToken, refreshToken, user }
- `POST /auth/refresh` { refreshToken } → { accessToken }
- `GET /me` ヘッダ `Authorization: Bearer <accessToken>`

### 保護対象
- `POST /api/integrations`, `POST /api/integrations/:id/workflows` は要認証

### セキュリティベストプラクティス
- 機密情報は `.env` 管理、CI/環境変数で注入
- JWT ローテーション推奨
- 定期的な依存関係セキュリティ監査

### 環境変数
- `JWT_SECRET`（必須推奨）
- `WEB_ORIGIN`（CORS許可、未指定は http://localhost:5173）

## 品質保証・CI/CD

### 品質ゲート
- TDD サイクルの徹底
- カバレッジ目標: 80%
- Biome による統一的なリント・フォーマット

### CI/CD同期検知
`.github/workflows/ai-sync.yml`が設定の同期漏れを自動検知:
- `npm run ai:migrate && npm run agents:sync` 後の差分をチェック
- 残差があれば CI失敗で通知

## トラブルシューティング

### よくある問題と解決方法

#### AI設定の同期エラー
```bash
# 同期漏れ（CI Fail）
npm run ai:migrate && npm run agents:sync
git add . && git commit -m "sync: update AI configurations"

# 仕様書の同期エラー
npm run specs:sync -- --project <name> --force  # 強制同期
```

#### CORS/認証エラー
```bash
# WEB_ORIGIN と JWT_SECRET の確認
echo $WEB_ORIGIN
echo $JWT_SECRET

# Authorization ヘッダ確認（Bearer トークン）
```

#### データベース接続エラー
```bash
# DATABASE_URL 確認とマイグレーション
echo $DATABASE_URL
npm run db:push
npm run db:studio  # Drizzle Studio で確認
```

#### ポート衝突
```bash
# ポート変更
PORT=3001 npm run dev:api
npm run dev:web -- --port 4000

# パスエイリアス エラー
# @shared/* は packages/shared/src/* を参照（tsconfig.base.json）
```

#### MCP関連
```bash
# MCP接続エラー
npm run mcp:check  # 定義確認・疎通テスト

# 環境変数不足
# GitHub: GITHUB_TOKEN
# Supabase: SUPABASE_URL, SUPABASE_ANON_KEY
```

## 開発実例

### AMM DEX開発例（完全なワークフロー）

**Phase 1: 仕様作成**
```bash
@kairo-requirements  # → docs/specs/amm-dex-requirements.md
@kairo-design       # → docs/design/amm-dex-architecture.md
@kairo-tasks        # → docs/tasks/amm-dex-tasks.md
npm run specs:sync -- --project amm-dex
```

**Phase 2: TDD実装**
```bash
@tdd-requirements   # TDD要件明確化
@tdd-testcases     # テストケース作成
@tdd-red           # Solidityテスト作成
@tdd-green         # スマートコントラクト実装
@tdd-refactor      # ガス最適化・セキュリティ改善
```

**Phase 3: フロントエンド実装**
```bash
# 同様のTDDサイクルをフロントエンドに適用
@tdd-red           # コンポーネントテスト
@tdd-green         # UI実装
@tdd-refactor      # UX改善
```

### 実装上の重要ポイント

#### アーキテクチャ特徴
- **API**: Hono のみ
- **認証**: JWT（`jose`）とパスワードハッシュ（`bcryptjs`）で構成
- **共有スキーマ**: `packages/shared/src`（`zod`/`drizzle-orm`）
- **配信方式**: Option B（Web と API は別プロセス）
- **CORS制御**: API 側の `WEB_ORIGIN` で制御
- **パスエイリアス**: `@shared/*` は `packages/shared/src/*` を参照（`tsconfig.base.json`）

#### 設定同期の仕組み
1. **一貫性**: すべてのAIツールが同じ基本設定を共有
2. **カスタマイズ**: 各ツールの特性に応じた最適化
3. **保守性**: 設定変更は`.ai/`のみで管理
4. **自動化**: CI/CDによる同期チェック


## ベストプラクティス

### 開発プロセス
- **小さく反復**（Red → Green → Refactor）
- **仕様差分の可視化** → レビュー → 正本同期
- **段階的進行**（各ステップでフィードバック反映）
- **品質ゲート**による各段階検証

### セキュリティ・運用
- **機密情報管理**: `.env` + CI/環境変数で注入
- **JWT管理**: 定期ローテーション推奨
- **依存関係**: 定期的なセキュリティ監査
- **バックアップ**: 仕様書・設定の定期バックアップ

### 効率化
- **AI役割分担**: Claude（実装）/Gemini（仕様）/Codex（補完）/Kiro（統制）
- **自動化活用**: CI/CD、同期チェック、テスト実行
- **テンプレート活用**: 共通パターンの再利用

## リソース・ドキュメント

### ドキュメント
- **運用規範**: `AGENTS.md`（全体統括）
- **AI設定**: `docs/ai-configuration.md`
- **仕様同期**: `scripts/specs/sync-specs.js`
- **統合ドキュメント**: 本ファイル

### 関連ファイル
- **設定の正本**: `.ai/{config.yaml,quality-gates.yaml}`
- **仕様の正本**: `.kiro/specs/<project>/{requirements.md,design.md,tasks.md}`
- **生成ファイル**: `*.generated.*`（編集禁止）
- **設定ファイル**: `tsconfig.base.json`, `package.json`, `mcp.json`

### スクリプト
- **AI設定**: `scripts/ai-config-migrator.js`
- **コマンド配布**: `scripts/agents/sync-commands.ts`
- **仕様同期**: `scripts/specs/sync-specs.js`
- **MCP確認**: `scripts/mcp/check.sh`

## 貢献・フィードバック

このフレームワークは継続的に改善されています。以下の方法でご貢献ください：

- 🐛 **Issue報告**: [GitHub Issues](https://github.com/your-org/bypp-aicoding-kit/issues)
- 🔧 **プルリクエスト**: 機能改善・バグ修正
- 💡 **機能提案**: 新しいアイデアや改善案
- 📖 **ドキュメント改善**: より良い説明やガイド

## ライセンス

このプロジェクトは [MIT License](./LICENSE) のもとで公開されています。

---

**🚀 統合完了** - 仕様作成 → TDD実行 → 実装 → 品質保証 の全工程を、AI協調環境で効率的に実行可能

**💡 開発哲学**: *「品質は後付けではなく、最初から作り込むもの」*

---

