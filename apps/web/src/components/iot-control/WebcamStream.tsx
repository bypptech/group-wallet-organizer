import { useEffect, useRef, useState, useCallback } from 'react'
import './WebcamStream.css'

interface WebcamStreamProps {
  width?: number
  height?: number
}

// WebSocket URLを本番サーバーに固定
const WS_URL = 'wss://base-batches-iot-api-server.kwhppscv.dev/ws/camera'

export function WebcamStream({ width = 640, height = 480 }: WebcamStreamProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const [error, setError] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [frameCount, setFrameCount] = useState(0)

  // WebSocket接続してサーバーからストリーミングを受信
  const startStreaming = useCallback(() => {
    try {
      setError('')

      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('WebSocket接続成功')
        setWsConnected(true)
        setIsStreaming(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'frame' && data.data && imgRef.current) {
            // Base64画像データを表示
            imgRef.current.src = data.data
            setFrameCount(prev => prev + 1)
          }
        } catch (err) {
          console.error('フレーム処理エラー:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error)
        setError('WebSocket connection failed')
      }

      ws.onclose = () => {
        console.log('WebSocket切断')
        setWsConnected(false)
        setIsStreaming(false)
        wsRef.current = null
      }

      wsRef.current = ws

    } catch (err) {
      setError(`Failed to start streaming: ${String(err)}`)
      console.error('Streaming Error:', err)
    }
  }, [])

  // ストリーミング停止
  const stopStreaming = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    if (imgRef.current) {
      imgRef.current.src = ''
    }

    setIsStreaming(false)
    setWsConnected(false)
    setFrameCount(0)
  }, [])

  // コンポーネントのアンマウント時にストリーミングを停止
  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {!isStreaming ? (
          <button
            onClick={startStreaming}
            className="flex-1 px-6 py-3 rounded-lg font-medium transition-all bg-white/10 text-white/70 hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/50"
          >
            Start Streaming
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="flex-1 px-6 py-3 rounded-lg font-medium transition-all bg-white/10 text-white/70 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/50"
          >
            Stop Streaming
          </button>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden bg-black/50 border border-white/10 max-w-[480px] mx-auto">
        <img
          ref={imgRef}
          width={Math.round(width * 0.75)}
          height={Math.round(height * 0.75)}
          alt="Camera stream"
          className={isStreaming ? 'w-full h-auto' : 'hidden'}
        />
        {!isStreaming && (
          <div className="flex items-center justify-center h-48 text-white/40">
            Camera Stopped
          </div>
        )}
      </div>
    </div>
  )
}
