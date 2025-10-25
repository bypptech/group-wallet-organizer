import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      title: 'ESP32 HoloReal Control',
      status: 'Status',
      gpio: {
        title: 'GPIO Control (GPIO24)',
        label: 'GPIO',
        on: 'ON',
        off: 'OFF'
      },
      led: {
        onoff: 'LED ON/OFF',
        label: 'LED',
        color: 'LED Color Control',
        red: 'Red (R)',
        green: 'Green (G)',
        blue: 'Blue (B)',
        brightness: 'LED Brightness',
        brightnessLabel: 'Brightness',
        preset: 'Preset Colors',
        presetTitle: 'Preset Colors',
        apply: 'Apply Color',
        applyBrightness: 'Apply Brightness',
        presetColors: {
          red: 'Red',
          green: 'Green',
          blue: 'Blue',
          yellow: 'Yellow',
          purple: 'Purple',
          cyan: 'Cyan',
          white: 'White'
        }
      },
      camera: {
        title: 'Camera Streaming (via API Server)',
        startStreaming: 'Start Streaming',
        stopStreaming: 'Stop Streaming',
        stopped: 'Streaming stopped',
        resolution: 'Resolution',
        state: 'State',
        streaming: 'Streaming',
        notStreaming: 'Stopped',
        websocket: 'WebSocket',
        connected: 'Connected',
        disconnected: 'Disconnected',
        framesReceived: 'Frames Received',
        errors: {
          wsConnection: 'WebSocket connection failed',
          streamStart: 'Failed to start streaming: {{message}}'
        }
      },
      messages: {
        gpioSuccess: 'GPIO {{state}} succeeded',
        ledSuccess: 'LED {{state}} succeeded',
        ledColorSuccess: 'LED color changed: RGB({{r}}, {{g}}, {{b}})',
        presetSuccess: 'Preset color applied',
        error: 'Error: {{message}}'
      }
    }
  },
  ja: {
    translation: {
      title: 'ESP32 HoloReal コントロール',
      status: 'ステータス',
      gpio: {
        title: 'GPIO制御 (GPIO24)',
        label: 'GPIO',
        on: 'ON',
        off: 'OFF'
      },
      led: {
        onoff: 'LED ON/OFF',
        label: 'LED',
        color: 'LED色変更',
        red: '赤 (R)',
        green: '緑 (G)',
        blue: '青 (B)',
        brightness: 'LED照度変更',
        brightnessLabel: '照度',
        preset: 'プリセットカラー',
        presetTitle: 'プリセットカラー',
        apply: '色を適用',
        applyBrightness: '照度を適用',
        presetColors: {
          red: '赤',
          green: '緑',
          blue: '青',
          yellow: '黄',
          purple: '紫',
          cyan: '水',
          white: '白'
        }
      },
      camera: {
        title: 'Webカメラストリーミング (APIサーバー経由)',
        startStreaming: 'ストリーミング開始',
        stopStreaming: 'ストリーミング停止',
        stopped: 'ストリーミングが停止中です',
        resolution: '解像度',
        state: '状態',
        streaming: '配信中',
        notStreaming: '停止中',
        websocket: 'WebSocket',
        connected: '接続中',
        disconnected: '切断',
        framesReceived: '受信フレーム数',
        errors: {
          wsConnection: 'WebSocket接続に失敗しました',
          streamStart: 'ストリーミング開始に失敗しました: {{message}}'
        }
      },
      messages: {
        gpioSuccess: 'GPIO {{state}} 成功',
        ledSuccess: 'LED {{state}} 成功',
        ledColorSuccess: 'LED色変更成功: RGB({{r}}, {{g}}, {{b}})',
        presetSuccess: 'プリセット色適用成功',
        error: 'エラー: {{message}}'
      }
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
