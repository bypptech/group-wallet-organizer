/**
 * IoT Control API Routes
 * ESP32 device control endpoints (GPIO, LED, Camera)
 */

import { Hono } from 'hono'

const app = new Hono()

// Mock ESP32 WebSocket URL (would be replaced with actual ESP32 in production)
const ESP32_WS_URL = process.env.ESP32_WS_URL || 'ws://192.168.55.229:81'
const GPIO_PIN = parseInt(process.env.ESP32_GPIO_PIN || '24')

/**
 * GPIO Control
 * POST /api/gpio
 */
app.post('/gpio', async (c) => {
  try {
    const body = await c.req.json()
    const { state } = body

    if (state !== 'on' && state !== 'off') {
      return c.json({ error: 'Invalid state. Use "on" or "off"' }, 400)
    }

    // TODO: Implement actual ESP32 WebSocket communication
    // For now, return mock success response
    console.log(`[IoT] GPIO ${GPIO_PIN} ${state}`)

    return c.json({
      success: true,
      gpio: GPIO_PIN,
      state,
      message: `GPIO ${GPIO_PIN} set to ${state}`
    })
  } catch (error) {
    console.error('[IoT] GPIO control error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * LED Control (RGB)
 * POST /api/led
 */
app.post('/led', async (c) => {
  try {
    const body = await c.req.json()
    const { r, g, b } = body

    // RGB値の検証
    if (
      typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' ||
      r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255
    ) {
      return c.json({ error: 'Invalid RGB values. Must be numbers between 0-255' }, 400)
    }

    // TODO: Implement actual ESP32 WebSocket communication
    console.log(`[IoT] LED RGB(${r}, ${g}, ${b})`)

    return c.json({
      success: true,
      r,
      g,
      b,
      message: `LED set to RGB(${r}, ${g}, ${b})`
    })
  } catch (error) {
    console.error('[IoT] LED control error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * LED ON (White)
 * POST /api/led/on
 */
app.post('/led/on', async (c) => {
  try {
    // TODO: Implement actual ESP32 WebSocket communication
    console.log('[IoT] LED ON (white)')

    return c.json({
      success: true,
      r: 255,
      g: 255,
      b: 255,
      message: 'LED turned ON (white)'
    })
  } catch (error) {
    console.error('[IoT] LED ON error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * LED OFF
 * POST /api/led/off
 */
app.post('/led/off', async (c) => {
  try {
    // TODO: Implement actual ESP32 WebSocket communication
    console.log('[IoT] LED OFF')

    return c.json({
      success: true,
      r: 0,
      g: 0,
      b: 0,
      message: 'LED turned OFF'
    })
  } catch (error) {
    console.error('[IoT] LED OFF error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Camera Streaming Control
 * POST /api/camera/start
 */
app.post('/camera/start', async (c) => {
  try {
    const port = process.env.PORT || 3001
    return c.json({
      success: true,
      wsUrl: `ws://localhost:${port}/ws/camera`,
      message: 'Camera streaming available via WebSocket'
    })
  } catch (error) {
    console.error('[IoT] Camera start error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Camera Streaming Stop
 * POST /api/camera/stop
 */
app.post('/camera/stop', async (c) => {
  try {
    return c.json({
      success: true,
      message: 'Camera streaming stopped'
    })
  } catch (error) {
    console.error('[IoT] Camera stop error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Camera Status
 * GET /api/camera/status
 */
app.get('/camera/status', async (c) => {
  try {
    return c.json({
      clients: 0,
      active: false,
      message: 'Camera status'
    })
  } catch (error) {
    console.error('[IoT] Camera status error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app
