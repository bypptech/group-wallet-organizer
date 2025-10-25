# ESP32 HoloReal Test App

ESP32デバイスを制御するためのテスト用Webアプリケーションです。

## 技術スタック

- **Frontend**: Vite + TypeScript + React
- **Backend**: Hono (Node.js API Server)
- **通信**: WebSocket (ESP32との通信)

## 機能

### 1. GPIO制御
- GPIO24のON/OFF制御

### 2. LED制御
- LED ON/OFF (白色/消灯)
- RGB色変更 (0-255の範囲でR/G/B個別調整)
- 照度変更 (0-100%の範囲で明るさ調整)
- プリセットカラー (赤、緑、青、黄、紫、水、白)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ESP32設定

`server.ts`の`ESP32_WS_URL`をESP32のIPアドレスに合わせて変更してください:

```typescript
const ESP32_WS_URL = 'ws://192.168.55.229:81'
```

## 使い方

### 開発モード

2つのターミナルウィンドウで以下のコマンドを実行します:

#### ターミナル1: APIサーバー起動
```bash
npm run server
```
→ `http://localhost:3000` でAPIサーバーが起動します

#### ターミナル2: フロントエンド起動
```bash
npm run dev
```
→ `http://localhost:5173` でフロントエンドが起動します

### ブラウザでアクセス

`http://localhost:5173` をブラウザで開いてください。

## API仕様

### GPIO制御
**POST** `/api/gpio`
```json
{
  "state": "on" // or "off"
}
```

### LED制御 (RGB指定)
**POST** `/api/led`
```json
{
  "r": 255,
  "g": 0,
  "b": 0
}
```

### LED ON
**POST** `/api/led/on`

### LED OFF
**POST** `/api/led/off`

### ヘルスチェック
**GET** `/api/health`

## プロジェクト構成

```
test-app/
├── server.ts           # Hono APIサーバー
├── src/
│   ├── App.tsx        # メインReactコンポーネント
│   ├── App.css        # スタイル
│   └── ...
├── package.json
└── README.md
```

## 注意事項

- ESP32 WebSocketサーバーが`ws://192.168.55.229:81`で稼働している必要があります
- APIサーバーとフロントエンドは別々に起動する必要があります
- CORS設定済みなので、異なるポートからのアクセスも可能です
