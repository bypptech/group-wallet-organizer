# Deployment Guide

## Production URLs

- **Frontend**: https://group-wallet-organizer.bypp.tech/
- **API Server**: https://group-wallet-organizer-api.bypp.tech/

## Environment Variables

### Frontend (apps/web)

Create `.env.production` with:

```bash
VITE_API_URL=https://group-wallet-organizer-api.bypp.tech/api
VITE_WEB_ORIGIN=https://group-wallet-organizer.bypp.tech
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
VITE_ALCHEMY_API_KEY=your-alchemy-api-key
```

### API Server (apps/api)

Create `.env.production` with:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3001
NODE_ENV=production
WEB_ORIGIN=https://group-wallet-organizer.bypp.tech
API_BASE_URL=https://group-wallet-organizer-api.bypp.tech
```

## Build Commands

### Frontend

```bash
cd apps/web
pnpm build
```

The built files will be in `apps/web/dist/`

### API Server

```bash
cd apps/api
pnpm build
```

## Deployment Steps

### 1. Frontend Deployment

1. Build the frontend: `cd apps/web && pnpm build`
2. Upload the `dist/` folder to your hosting service
3. Configure the hosting to:
   - Serve `index.html` for all routes (SPA mode)
   - Set environment variables

### 2. API Server Deployment

1. Build the API: `cd apps/api && pnpm build`
2. Upload the built files to your server
3. Set environment variables
4. Run database migrations: `pnpm db:migrate`
5. Start the server: `pnpm start`

## Server Configuration

### Vite Configuration

The Vite config already allows all hosts:

```typescript
server: {
  allowedHosts: ["all"],
  host: "0.0.0.0",
}
```

This allows access from:
- `localhost:5000`
- `group-wallet-organizer.bypp.tech`
- Any other domain

### CORS Configuration

Ensure your API server allows requests from the production frontend URL.

## Health Checks

- Frontend: `https://group-wallet-organizer.bypp.tech/`
- API: `https://group-wallet-organizer-api.bypp.tech/api/health` (if implemented)

## Troubleshooting

### "Blocked request. This host is not allowed"

This should not occur as we've set `allowedHosts: ["all"]` in Vite config.

### API Connection Issues

1. Check `VITE_API_URL` is set correctly
2. Verify CORS is configured on API server
3. Check network connectivity

### Environment Variables Not Working

1. Ensure `.env.production` exists
2. Rebuild the application after changing env vars
3. Vite only injects vars prefixed with `VITE_`
