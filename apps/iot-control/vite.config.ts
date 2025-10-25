import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_FRONTEND_APP_PORT || '5173'),
      strictPort: false, // ポートが使用中の場合は別のポートを試す
      host: true, // すべてのホストからのアクセスを許可
      allowedHosts: [
        'base-batches-iot-frontend.kwhppscv.dev', // Cloudflare tunnel
        'localhost',
        '127.0.0.1'
      ]
    }
  }
})
