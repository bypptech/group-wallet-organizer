import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer } from 'http'
import { spawn } from 'child_process'
import * as dotenv from 'dotenv'

// .envファイルから環境変数を読み込む（VITE_BACKEND_API_PORTを取得するため）
dotenv.config({ path: '.env' })
// .env.serverファイルから環境変数を読み込む（その他の設定用）
dotenv.config({ path: '.env.server' })

const app = new Hono()

// CORS設定
app.use('/*', cors())

// 静的ファイル配信（distフォルダ）
app.use('/*', serveStatic({ root: './dist' }))

// ESP32 WebSocketサーバーの設定
const ESP32_WS_URL = process.env.ESP32_WS_URL || 'ws://192.168.55.229:81'
const GPIO_PIN = parseInt(process.env.ESP32_GPIO_PIN || '24')

// カメラ設定
const CAMERA_DEVICE = process.env.CAMERA_DEVICE || '/dev/video0'
const CAMERA_WIDTH = parseInt(process.env.CAMERA_WIDTH || '640')
const CAMERA_HEIGHT = parseInt(process.env.CAMERA_HEIGHT || '480')
const CAMERA_FPS = parseInt(process.env.CAMERA_FPS || '30')

// WebSocketメッセージ送信用のヘルパー関数
async function sendToESP32(data: object): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(ESP32_WS_URL)

      ws.on('open', () => {
        ws.send(JSON.stringify(data))
        ws.close()
        resolve({ success: true })
      })

      ws.on('error', (error) => {
        resolve({ success: false, error: error.message })
      })

      // タイムアウト設定
      setTimeout(() => {
        ws.close()
        resolve({ success: false, error: 'Connection timeout' })
      }, 5000)
    } catch (error) {
      resolve({ success: false, error: String(error) })
    }
  })
}

// GPIO ON/OFF API
app.post('/api/gpio', async (c) => {
  const body = await c.req.json()
  const { state } = body // "on" or "off"

  if (state !== 'on' && state !== 'off') {
    return c.json({ error: 'Invalid state. Use "on" or "off"' }, 400)
  }

  const result = await sendToESP32({
    gpio: GPIO_PIN,
    state: state
  })

  if (result.success) {
    return c.json({ success: true, gpio: GPIO_PIN, state })
  } else {
    return c.json({ success: false, error: result.error }, 500)
  }
})

// LED制御API (RGB指定)
app.post('/api/led', async (c) => {
  const body = await c.req.json()
  const { r, g, b } = body

  // RGB値の検証
  if (
    typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' ||
    r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255
  ) {
    return c.json({ error: 'Invalid RGB values. Must be numbers between 0-255' }, 400)
  }

  const result = await sendToESP32({ r, g, b })

  if (result.success) {
    return c.json({ success: true, r, g, b })
  } else {
    return c.json({ success: false, error: result.error }, 500)
  }
})

// LED ON (白色)
app.post('/api/led/on', async (c) => {
  const result = await sendToESP32({ r: 255, g: 255, b: 255 })

  if (result.success) {
    return c.json({ success: true, r: 255, g: 255, b: 255 })
  } else {
    return c.json({ success: false, error: result.error }, 500)
  }
})

// LED OFF
app.post('/api/led/off', async (c) => {
  const result = await sendToESP32({ r: 0, g: 0, b: 0 })

  if (result.success) {
    return c.json({ success: true, r: 0, g: 0, b: 0 })
  } else {
    return c.json({ success: false, error: result.error }, 500)
  }
})

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})

// ポート設定: VITE_BACKEND_API_PORT (.env) > PORT (.env.server) > デフォルト3000
const port = parseInt(process.env.VITE_BACKEND_API_PORT || process.env.PORT || '3000')

// HTTPサーバーを作成
const server = createServer(async (req, res) => {
  try {
    // リクエストボディを読み取る
    let body: string | undefined = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      body = Buffer.concat(chunks).toString()
    }

    // Honoアプリケーションにリクエストを転送
    const url = `http://localhost:${port}${req.url}`
    const requestInit: RequestInit & { duplex?: string } = {
      method: req.method,
      headers: req.headers as HeadersInit,
    }

    if (body) {
      requestInit.body = body
      requestInit.duplex = 'half'
    }

    const response = await app.fetch(new Request(url, requestInit))

    // レスポンスを返す
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
    const buffer = await response.arrayBuffer()
    res.end(Buffer.from(buffer))
  } catch (error) {
    console.error('リクエスト処理エラー:', error)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

// WebSocketサーバーを作成（カメラストリーミング用）
const wss = new WebSocketServer({ server, path: '/ws/camera' })

// カメラストリーミング用のWebSocket接続管理
const cameraClients = new Set<WebSocket>()
let cameraProcess: any = null
let frameBuffer: Buffer[] = []
let isProcessingFrame = false

// カメラストリーミングを開始
function startCameraStreaming() {
  if (cameraProcess) {
    console.log('カメラストリーミングは既に実行中です')
    return
  }

  console.log('カメラストリーミングを開始します')

  try {
    // ffmpegを使用して継続的にカメラキャプチャ（ハードウェアアクセラレーション有効）
    cameraProcess = spawn('ffmpeg', [
      '-hwaccel', 'drm',                    // DRMハードウェアアクセラレーション
      '-f', 'v4l2',
      '-input_format', 'mjpeg',
      '-video_size', `${CAMERA_WIDTH}x${CAMERA_HEIGHT}`,
      '-framerate', String(CAMERA_FPS),
      '-i', CAMERA_DEVICE,
      '-vf', 'eq=brightness=0.15:contrast=1.2:saturation=1.1',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-q:v', '5',
      '-threads', '4',                      // マルチスレッド
      '-'
    ])

    let imageBuffer = Buffer.alloc(0)
    const SOI = Buffer.from([0xFF, 0xD8]) // JPEG Start of Image
    const EOI = Buffer.from([0xFF, 0xD9]) // JPEG End of Image

    cameraProcess.stdout.on('data', (chunk: Buffer) => {
      imageBuffer = Buffer.concat([imageBuffer, chunk])

      // JPEG画像の終端を検索
      let eoiIndex = imageBuffer.indexOf(EOI)

      while (eoiIndex !== -1) {
        // 完全なJPEG画像を抽出
        const jpegImage = imageBuffer.slice(0, eoiIndex + 2)
        imageBuffer = imageBuffer.slice(eoiIndex + 2)

        // フレームをクライアントに送信
        if (cameraClients.size > 0 && jpegImage.length > 0) {
          const base64Image = `data:image/jpeg;base64,${jpegImage.toString('base64')}`
          const frame = JSON.stringify({
            type: 'frame',
            data: base64Image
          })

          cameraClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              try {
                client.send(frame)
              } catch (err) {
                console.error('フレーム送信エラー:', err)
              }
            }
          })
        }

        // 次のJPEG画像を検索
        eoiIndex = imageBuffer.indexOf(EOI)
      }
    })

    cameraProcess.stderr.on('data', (data: Buffer) => {
      // ffmpegのログは無視（詳細なログが多いため）
    })

    cameraProcess.on('error', (error: Error) => {
      console.error('カメラプロセスエラー:', error)
      cameraProcess = null
    })

    cameraProcess.on('close', (code: number) => {
      console.log(`カメラプロセス終了: ${code}`)
      cameraProcess = null
    })

  } catch (error) {
    console.error('カメラ起動エラー:', error)
  }
}

// カメラストリーミングを停止
function stopCameraStreaming() {
  console.log('カメラストリーミングを停止します')

  if (cameraProcess) {
    cameraProcess.kill('SIGTERM')
    cameraProcess = null
  }
}

wss.on('connection', (ws) => {
  console.log('新しいカメラストリーミングクライアントが接続しました')
  cameraClients.add(ws)

  // 最初のクライアント接続時にカメラストリーミング開始
  if (cameraClients.size === 1) {
    startCameraStreaming()
  }

  ws.on('close', () => {
    console.log('カメラストリーミングクライアントが切断しました')
    cameraClients.delete(ws)

    // 全クライアント切断時にカメラストリーミング停止
    if (cameraClients.size === 0) {
      stopCameraStreaming()
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocketエラー:', error)
    cameraClients.delete(ws)

    if (cameraClients.size === 0) {
      stopCameraStreaming()
    }
  })
})

// カメラストリーミング開始API
app.post('/api/camera/start', (c) => {
  return c.json({
    success: true,
    wsUrl: `ws://localhost:${port}/ws/camera`,
    message: 'WebSocket経由でフレームを送信してください'
  })
})

// カメラストリーミング停止API
app.post('/api/camera/stop', (c) => {
  return c.json({ success: true })
})

// カメラストリーミング状態取得API
app.get('/api/camera/status', (c) => {
  return c.json({
    clients: cameraClients.size,
    active: cameraClients.size > 0
  })
})

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
  console.log(`WebSocket camera streaming on ws://localhost:${port}/ws/camera`)
})
