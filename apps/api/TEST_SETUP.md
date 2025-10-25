# テスト環境セットアップ

## 必要な設定

### 1. テスト用Neon Databaseの準備

テスト用に別のNeonデータベースを用意することを推奨します。

1. [Neon Console](https://console.neon.tech/)にアクセス
2. 新しいプロジェクトを作成（例: `family-wallet-test`）
3. 接続文字列をコピー

### 2. 環境変数ファイルの作成

```bash
cp .env.test.example .env.test
```

`.env.test`を編集してテスト用DATABASE_URLを設定:

```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. テーブルのマイグレーション

テスト用DBにスキーマを適用:

```bash
# .env.testのDATABASE_URLを一時的に使用
DATABASE_URL=$(grep DATABASE_URL .env.test | cut -d '=' -f2-) pnpm db:push
```

## テスト実行

```bash
# 全テスト実行
pnpm test

# UIモードで実行
pnpm test:ui

# カバレッジ付き実行
pnpm test:coverage
```

## 注意事項

- **テスト実行時、テスト用DBの全テーブルがクリアされます**
- 本番DBのURLは絶対に`.env.test`に設定しないでください
- `.env.test`は`.gitignore`に含まれているため、コミットされません

## CI/CD環境での設定

GitHub ActionsなどのCI環境では、環境変数として`DATABASE_URL`を設定:

```yaml
env:
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```
