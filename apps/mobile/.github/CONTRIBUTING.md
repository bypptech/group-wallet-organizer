# Contributing to Family Wallet

Family Walletへの貢献に興味を持っていただきありがとうございます！

## 行動規範

このプロジェクトは、すべての貢献者に対してオープンで歓迎的な環境を提供することを目指しています。

## 開発プロセス

### 1. 環境セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/your-org/family-wallet.git
cd family-wallet

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .env ファイルを編集

# 開発サーバーの起動
pnpm dev
```

### 2. ブランチ戦略

- `main`: 本番環境用の安定版
- `develop`: 開発版（デフォルトブランチ）
- `feature/*`: 新機能開発用
- `fix/*`: バグ修正用
- `docs/*`: ドキュメント更新用

### 3. コミットメッセージ

Conventional Commits形式を使用してください：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

**例:**
```bash
feat(mobile): add biometric authentication support

- Implement expo-local-authentication integration
- Add biometric toggle in settings
- Support Face ID, Fingerprint, and Iris

Closes #123
```

### 4. Pull Requestプロセス

1. **Issueの作成**: まず関連するIssueを作成または確認
2. **ブランチの作成**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **開発**: 
   - コードを書く
   - テストを追加
   - ドキュメントを更新
4. **テスト実行**: 
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```
5. **コミット**: 
   ```bash
   git add .
   git commit -m "feat(scope): your message"
   ```
6. **Push**: 
   ```bash
   git push origin feature/your-feature-name
   ```
7. **PR作成**: GitHubでPull Requestを作成
8. **レビュー**: レビューアーからのフィードバックに対応
9. **マージ**: 承認後、maintainerがマージ

### 5. コーディング規約

#### TypeScript

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  // implementation
};

// Bad
const getUser = async (id) => {
  // implementation
};
```

#### React Components

```tsx
// Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
}) => {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
};

// Bad
export const Button = (props) => {
  return <button onClick={props.onClick}>{props.children}</button>;
};
```

#### Solidity

```solidity
// Good
contract EscrowRegistry {
    mapping(bytes32 => Escrow) private escrows;
    
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed requester,
        uint256 amount
    );
    
    function createEscrow(
        address recipient,
        uint256 amount
    ) external returns (bytes32) {
        // implementation
    }
}

// Bad
contract EscrowRegistry {
    mapping(bytes32 => Escrow) public e;
    
    function create(address a, uint256 b) external returns (bytes32) {
        // implementation
    }
}
```

### 6. テスト

すべての新機能にはテストを含める必要があります：

```typescript
// Web/API Tests
describe('useWalletConnect', () => {
  it('should initialize WalletConnect', async () => {
    const { result } = renderHook(() => useWalletConnect());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
  });
});

// Contract Tests
describe('EscrowRegistry', () => {
  it('should create escrow correctly', async () => {
    const { escrowRegistry } = await loadFixture(deployFixture);
    
    await expect(
      escrowRegistry.createEscrow(recipient.address, ethers.parseEther('1'))
    )
      .to.emit(escrowRegistry, 'EscrowCreated')
      .withArgs(anyValue, requester.address, ethers.parseEther('1'));
  });
});
```

### 7. ドキュメント

コードの変更には対応するドキュメントの更新も含めてください：

- README.md: 主要な機能変更
- コードコメント: 複雑なロジックの説明
- JSDoc: 公開API関数
- Changelog: バージョン管理

### 8. レビュープロセス

Pull Requestは以下の観点でレビューされます：

- **機能性**: 意図した通りに動作するか
- **テスト**: 十分なテストカバレッジがあるか
- **コード品質**: 読みやすく保守可能なコードか
- **セキュリティ**: セキュリティ上の問題がないか
- **パフォーマンス**: パフォーマンスへの影響は適切か
- **ドキュメント**: 適切にドキュメント化されているか

## バグ報告

バグを見つけた場合は、以下の情報を含めてIssueを作成してください：

- **説明**: バグの簡潔な説明
- **再現手順**: ステップバイステップの手順
- **期待される動作**: 本来どうあるべきか
- **実際の動作**: 実際に何が起こったか
- **環境**: OS、ブラウザ、バージョンなど
- **スクリーンショット**: 可能であれば

## 機能提案

新機能の提案は大歓迎です。Feature Request Issueを作成してください：

- **概要**: 機能の説明
- **動機**: なぜ必要か
- **提案内容**: 具体的な実装案
- **代替案**: 検討した代替案

## 質問・サポート

質問がある場合は：

- **GitHub Discussions**: 一般的な質問や議論
- **GitHub Issues**: バグ報告や機能提案
- **Discord**: リアルタイムチャット（リンク）

## ライセンス

貢献したコードは、プロジェクトと同じライセンス（MIT）の下で公開されます。
