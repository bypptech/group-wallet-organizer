import { serve } from '@hono/node-server'
import { createHonoApp } from './honoApp'
import { initializeDatabaseFromEnv } from './db/client.js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from root .env first, then local .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config() // Override with local .env if exists

// Initialize database connection
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

if (!USE_MOCK_DATA) {
  try {
    initializeDatabaseFromEnv(process.env)
    console.log('[database] Connected to Neon PostgreSQL')
  } catch (error) {
    console.error('[database] Failed to connect:', error)
    console.log('[database] Falling back to MOCK mode')
    process.env.USE_MOCK_DATA = 'true'
  }
} else {
  console.log('[database] Using MOCK mode (USE_MOCK_DATA=true)')
}

const app = createHonoApp()

const port = parseInt(process.env.PORT || '3001', 10)
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' })
console.log(`[hono] API serving on port ${port}`)

