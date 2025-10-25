import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import './WebcamStream.css'

interface WebcamStreamProps {
  width?: number
  height?: number
}

// WebSocket URLを環境変数から動的に構築
const API_PORT = import.meta.env.VITE_BACKEND_API_PORT || '3000'
const WS_URL = import.meta.env.VITE_WS_CAMERA_URL || `ws://localhost:${API_PORT}/ws/camera`

export function WebcamStream({ width = 640, height = 480 }: WebcamStreamProps) {
  const { t } = useTranslation()
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
        console.error('WebSocketエラー:', error)
        setError(t('camera.errors.wsConnection'))
      }

      ws.onclose = () => {
        console.log('WebSocket切断')
        setWsConnected(false)
        setIsStreaming(false)
        wsRef.current = null
      }

      wsRef.current = ws

    } catch (err) {
      setError(t('camera.errors.streamStart', { message: String(err) }))
      console.error('ストリーミングエラー:', err)
    }
  }, [t])

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
    <div className="webcam-container">
      <h2>{t('camera.title')}</h2>

      {error && <div className="webcam-error">{error}</div>}

      <div className="webcam-controls">
        <div className="button-group">
          {!isStreaming ? (
            <button onClick={startStreaming} className="start-btn">
              {t('camera.startStreaming')}
            </button>
          ) : (
            <button onClick={stopStreaming} className="stop-btn">
              {t('camera.stopStreaming')}
            </button>
          )}
        </div>
      </div>

      <div className="video-wrapper">
        <img
          ref={imgRef}
          width={width}
          height={height}
          alt="Camera stream"
          className={isStreaming ? 'active' : ''}
          style={{
            display: isStreaming ? 'block' : 'none',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        {!isStreaming && (
          <div className="video-placeholder" style={{ width, height }}>
            {t('camera.stopped')}
          </div>
        )}
      </div>

      <div className="webcam-info">
        <p>{t('camera.resolution')}: {width} × {height}</p>
        <p>{t('camera.state')}: {isStreaming ? t('camera.streaming') : t('camera.notStreaming')}</p>
        <p>{t('camera.websocket')}: {wsConnected ? t('camera.connected') : t('camera.disconnected')}</p>
        {isStreaming && <p>{t('camera.framesReceived')}: {frameCount}</p>}
      </div>
    </div>
  )
}
