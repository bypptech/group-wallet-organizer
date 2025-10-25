# Wallet Setup Guide

## Coinbase Wallet が接続できない場合の対処方法

### 問題の原因

Coinbase Wallet を含む WalletConnect ベースのウォレットは、**WalletConnect Project ID** が必要です。このIDが設定されていないと、Coinbase Wallet の接続ができません。

### 解決方法

#### 1. WalletConnect Project ID を取得

1. [WalletConnect Cloud](https://cloud.walletconnect.com/) にアクセス
2. GitHub または Email でサインアップ（無料）
3. 新しいプロジェクトを作成
4. Project ID をコピー

**注意**: Project ID の取得は完全無料で、数分で完了します。

#### 2. 環境変数を設定

`apps/web/.env.local` ファイルを作成または編集して、以下を追加:

```bash
# API Base URL
VITE_API_URL=http://localhost:3001/api

# WalletConnect Project ID (required for Coinbase Wallet)
VITE_WALLETCONNECT_PROJECT_ID=your-actual-project-id-here

# Alchemy API Key (optional)
VITE_ALCHEMY_API_KEY=your-alchemy-api-key-here
```

`your-actual-project-id-here` を、先ほど取得した実際の Project ID に置き換えてください。

#### 3. 開発サーバーを再起動

```bash
cd apps/web
pnpm run dev
```

### 動作確認

1. ブラウザで `http://localhost:5001/` にアクセス
2. "Connect Wallet" ボタンをクリック
3. ウォレット一覧に以下が表示されることを確認:
   - MetaMask
   - Coinbase Wallet
   - WalletConnect
   - Rainbow Wallet

4. Coinbase Wallet を選択して接続

### サポートされているウォレット

現在の設定では、以下のウォレットが利用可能です:

- **MetaMask**: ブラウザ拡張機能またはモバイルアプリ
- **Coinbase Wallet**: ブラウザ拡張機能またはモバイルアプリ
- **WalletConnect**: QRコードで任意の WalletConnect 対応ウォレットを接続
- **Rainbow Wallet**: モバイルウォレット

### トラブルシューティング

#### Coinbase Wallet が表示されない

- `.env.local` に `VITE_WALLETCONNECT_PROJECT_ID` が正しく設定されているか確認
- 開発サーバーを再起動したか確認
- ブラウザのコンソールでエラーがないか確認

#### "demo-project-id" エラーが表示される

- これは Project ID が未設定の状態です
- 上記の手順で Project ID を取得して設定してください

#### 接続後にエラーが発生する

- ウォレットが Base または Base Sepolia ネットワークに対応しているか確認
- ウォレットのネットワーク設定で Base チェーンを追加してください

### 参考リンク

- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/installation)
- [Coinbase Wallet](https://www.coinbase.com/wallet)
