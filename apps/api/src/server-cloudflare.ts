import { createHonoApp } from './honoApp'

// Cloudflare Workers entry point
const app = createHonoApp()

export default {
  async fetch(request: Request, env: any, ctx: any) {
    // Initialize database from environment variables (Cloudflare Workers Secrets)
    if (env.DATABASE_URL) {
      try {
        const { initializeDatabase } = await import('./db/client.js')
        initializeDatabase({ connectionString: env.DATABASE_URL })
      } catch (error) {
        console.error('[database] Failed to connect:', error)
      }
    }

    return app.fetch(request, env, ctx)
  },
}
