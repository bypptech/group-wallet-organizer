/**
 * Demo Mode Middleware
 *
 * Checks if a vault is in demo mode and restricts certain actions
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { vaults } from '../db/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      isDemoMode?: boolean;
      demoConfig?: {
        allowedActions: string[];
        restrictedActions: string[];
        displayNames?: Record<string, string>;
      };
      demoVault?: any;
    }
  }
}

/**
 * Map HTTP method and route to action name
 */
function getActionFromRoute(path: string, method: string): string {
  // Escrow actions
  if (path.includes('/escrows') && method === 'POST') return 'create_escrow';
  if (path.includes('/escrows') && path.includes('/approve') && method === 'POST') return 'approve_escrow';
  if (path.includes('/escrows') && method === 'DELETE') return 'delete_escrow';

  // Member actions
  if (path.includes('/members') && method === 'POST') return 'add_member';
  if (path.includes('/members') && method === 'DELETE') return 'remove_member';

  // Shareable Key actions
  if (path.includes('/shareable-keys') && method === 'POST') return 'create_shareable_key';
  if (path.includes('/shareable-keys') && path.includes('/revoke') && method === 'POST') return 'revoke_shareable_key';

  // Comment actions
  if (path.includes('/comments') && method === 'POST') return 'add_comment';
  if (path.includes('/comments') && method === 'DELETE') return 'delete_comment';

  // Payment actions
  if (path.includes('/pay') && method === 'POST') return 'send_payment';

  // Generic write actions
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return 'write_action';

  return 'read_action';
}

/**
 * Demo Mode Middleware
 */
export async function demoModeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract vault ID from various sources
    const vaultId =
      req.params.vaultId ||
      req.body?.vaultId ||
      req.query.vaultId as string;

    if (!vaultId) {
      // No vault ID, skip demo mode check
      return next();
    }

    // Query vault
    const vault = await db.query.vaults.findFirst({
      where: eq(vaults.id, vaultId)
    });

    if (!vault) {
      return res.status(404).json({
        error: 'Vault not found'
      });
    }

    // Check if vault is in demo mode
    if (vault.isDemo) {
      req.isDemoMode = true;
      req.demoVault = vault;
      req.demoConfig = vault.metadata?.demoConfig || {
        allowedActions: ['view_vault', 'view_escrows', 'view_members'],
        restrictedActions: ['create_escrow', 'approve_escrow', 'add_member']
      };

      // Check if current action is restricted
      if (vault.demoReadOnly && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const action = getActionFromRoute(req.path, req.method);

        if (req.demoConfig.restrictedActions?.includes(action)) {
          return res.status(403).json({
            error: 'Demo mode restriction',
            message: 'This action is restricted in demo mode. Connect your wallet to access full features.',
            action,
            isDemoMode: true,
            hint: 'Click "Connect Wallet" to create your own vault with full access'
          });
        }
      }
    } else {
      req.isDemoMode = false;
    }

    next();
  } catch (error) {
    console.error('Demo mode middleware error:', error);
    // Don't fail the request, just skip demo mode check
    next();
  }
}

/**
 * Get demo vault helper function
 */
export async function getDemoVault() {
  const DEMO_VAULT_ADDRESS = '0xDEMO000000000000000000000000000000000001';

  const vault = await db.query.vaults.findFirst({
    where: eq(vaults.address, DEMO_VAULT_ADDRESS),
    with: {
      members: true,
      // Note: Relations need to be properly defined in schema for this to work
    }
  });

  return vault;
}

/**
 * Middleware to inject demo banner info
 */
export function demoBannerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Add demo mode info to response headers for frontend
  if (req.isDemoMode) {
    res.setHeader('X-Demo-Mode', 'true');
    res.setHeader('X-Demo-Message', 'You are viewing demo data. Connect your wallet for full access.');
  }
  next();
}
