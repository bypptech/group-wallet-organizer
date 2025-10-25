import { useState } from 'react'
import './App.css'
import { WebcamStream } from './WebcamStream'
import { useShareableKeyAPI_Use } from '@/hooks/useShareableKeysAPI'
import type { Address } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

// APIエンドポイントを本番サーバーに固定
const API_BASE = 'https://base-batches-iot-api-server.kwhppscv.dev/api'

interface IotControlPanelProps {
  keyId?: string;
  userAddress?: Address;
  deviceId?: string;
  onBack?: () => void;
}

export function IotControlPanel({ keyId, userAddress, deviceId = 'device01', onBack }: IotControlPanelProps = {}) {
  const [gpioState, setGpioState] = useState<'on' | 'off'>('off')
  const [status, setStatus] = useState<string>('')

  // Usage tracking mutation
  const recordUsage = useShareableKeyAPI_Use()

  // Record usage to shareable key
  const trackUsage = async (action: string) => {
    if (!keyId || !userAddress) {
      console.log('[IotControlPanel] Usage tracking skipped - no keyId or userAddress')
      return
    }

    try {
      await recordUsage.mutateAsync({
        keyId,
        userAddress,
        action,
      })
      console.log(`[IotControlPanel] Usage tracked: ${action}`)
    } catch (error) {
      console.error('[IotControlPanel] Failed to track usage:', error)
      // Don't block the operation if usage tracking fails
    }
  }

  // Key (GPIO) Control
  const handleGpio = async (state: 'on' | 'off') => {
    try {
      const response = await fetch(`${API_BASE}/gpio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      })
      const data = await response.json()
      if (data.success) {
        setGpioState(state)
        setStatus(`Key ${state.toUpperCase()} successful`)

        // Track usage
        await trackUsage(`device_key_${state}`)
      } else {
        setStatus(`Error: ${data.error}`)
      }
    } catch (error) {
      setStatus(`Error: ${String(error)}`)
    }
  }

  // Assist Light ON/OFF
  const handleLedOnOff = async (turnOn: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/led/${turnOn ? 'on' : 'off'}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        setStatus(`Assist Light ${turnOn ? 'ON' : 'OFF'} successful`)

        // Track usage
        await trackUsage(`device_light_${turnOn ? 'on' : 'off'}`)
      } else {
        setStatus(`Error: ${data.error}`)
      }
    } catch (error) {
      setStatus(`Error: ${String(error)}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Display */}
      {status && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-4 text-cyan-300 text-sm"
        >
          {status}
        </motion.div>
      )}

      {/* Key Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Key</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex gap-3">
              <button
                onClick={() => handleGpio('on')}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  gpioState === 'on'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                OPEN
              </button>
              <button
                onClick={() => handleGpio('off')}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  gpioState === 'off'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                CLOSE
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Assist Light Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Assist Light</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex gap-3">
              <button
                onClick={() => handleLedOnOff(false)}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all bg-white/10 text-white/70 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/50"
              >
                OFF
              </button>
              <button
                onClick={() => handleLedOnOff(true)}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all bg-white/10 text-white/70 hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/50"
              >
                ON
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Camera Stream */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Camera Stream</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <WebcamStream />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
