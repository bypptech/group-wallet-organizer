# ESP32 IoT Control - Production Deployment Guide

## 概要

このガイドでは、ビルド済みのIoTコントロールUIを`base-batches-iot-api-server.kwhppscv.dev`サーバーにデプロイする手順を説明します。

## アーキテクチャ

```
ユーザーのブラウザ
    ↓
https://base-batches-iot-api-server.kwhppscv.dev/
    ↓
[静的ファイル配信 (index.html, JS, CSS)]
    ↓
https://base-batches-iot-api-server.kwhppscv.dev/api/
    ↓
[APIエンドポイント (GPIO, LED制御)]
    ↓
ESP32デバイス (WebSocket接続)
```

## デプロイ手順

### 1. ビルド（既に完了）

```bash
cd apps/iot-control
npm run build
```

ビルドファイルは `dist/` フォルダに生成されます。

### 2. プロダクションサーバーへのデプロイ

本番サーバーにSSH接続してファイルをコピーします：

```bash
# プロダクションサーバーのディレクトリに移動
cd /path/to/production/server

# distフォルダをプロダクションサーバーにコピー
scp -r apps/iot-control/dist/* user@production-server:/path/to/server/dist/

# または、rsyncを使用
rsync -avz --delete apps/iot-control/dist/ user@production-server:/path/to/server/dist/
```

### 3. サーバー再起動

プロダクションサーバーでアプリケーションを再起動します：

```bash
# プロダクションサーバーにSSH接続
ssh user@production-server

# サーバープロセスを再起動
pm2 restart iot-api-server
# または
systemctl restart iot-api-server
```

### 4. Cloudflare Tunnel設定確認

`base-batches-iot-api-server.kwhppscv.dev`のCloudflare Tunnel設定を確認：

```yaml
# cloudflared config.yml
ingress:
  - hostname: base-batches-iot-api-server.kwhppscv.dev
    service: http://localhost:3009
```

サーバーが3009ポートで起動していることを確認してください。

## アクセスURL

デプロイ後、以下のURLでアクセスできます：

- **フロントエンド**: https://base-batches-iot-api-server.kwhppscv.dev/
- **APIエンドポイント**: https://base-batches-iot-api-server.kwhppscv.dev/api/
- **WebSocketカメラ**: wss://base-batches-iot-api-server.kwhppscv.dev/ws/camera

## 環境変数設定

プロダクションサーバーの`.env`ファイル：

```bash
# ESP32 WebSocket Server
ESP32_WS_URL=ws://192.168.55.229:81
ESP32_GPIO_PIN=24

# Camera Configuration
CAMERA_DEVICE=/dev/video0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30

# Server Port
VITE_BACKEND_API_PORT=3009
PORT=3009
```

## 確認事項

デプロイ後、以下を確認してください：

- [ ] `https://base-batches-iot-api-server.kwhppscv.dev/` にアクセスしてUIが表示される
- [ ] ブラウザのDevToolsでAPIリクエストが正しく送信されている
- [ ] GPIO制御ボタンが動作する
- [ ] LED制御ボタンが動作する
- [ ] カメラストリームが表示される（カメラ接続時）
- [ ] 多言語切り替えが動作する

## トラブルシューティング

### 静的ファイルが404エラー

- `dist/` フォルダがサーバーの正しい場所にあるか確認
- `server.ts` の `serveStatic({ root: './dist' })` パスが正しいか確認

### APIエンドポイントが動作しない

- サーバーログを確認: `pm2 logs iot-api-server`
- ポート3009が使用されているか確認: `lsof -i :3009`

### ESP32に接続できない

- ESP32のIPアドレスが正しいか確認
- ESP32 WebSocketサーバーが起動しているか確認
- ネットワーク接続を確認

## 自動デプロイ（オプション）

GitHub Actionsを使用した自動デプロイ設定：

```yaml
# .github/workflows/deploy-iot-control.yml
name: Deploy IoT Control

on:
  push:
    branches: [main]
    paths:
      - 'apps/iot-control/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Build
        run: |
          cd apps/iot-control
          npm ci
          npm run build

      - name: Deploy to Production
        run: |
          rsync -avz --delete apps/iot-control/dist/ \
            ${{ secrets.PRODUCTION_USER }}@${{ secrets.PRODUCTION_HOST }}:/path/to/server/dist/

      - name: Restart Server
        run: |
          ssh ${{ secrets.PRODUCTION_USER }}@${{ secrets.PRODUCTION_HOST }} \
            "pm2 restart iot-api-server"
```

## 参考情報

- **Hono Documentation**: https://hono.dev/
- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **ESP32 Arduino**: https://docs.espressif.com/projects/arduino-esp32/
