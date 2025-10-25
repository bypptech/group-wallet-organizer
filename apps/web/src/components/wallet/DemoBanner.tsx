/**
 * Demo Banner Component
 *
 * Displays a banner when user is viewing demo data
 */

import { Info, Sparkles } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDemoMode } from '@/hooks/useDemoMode';

interface DemoBannerProps {
  vault: any | null;
  className?: string;
}

export function DemoBanner({ vault, className = '' }: DemoBannerProps) {
  const { isDemo, demoMessage } = useDemoMode(vault);

  if (!isDemo) return null;

  return (
    <div
      className={`bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white ${className}`}
      role="banner"
      aria-label="Demo mode notification"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Message Section */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{demoMessage}</span>
              </p>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                All actions are read-only in demo mode
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="inline-flex items-center px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
export function DemoBadge({ vault }: { vault: any | null }) {
  const { isDemo } = useDemoMode(vault);

  if (!isDemo) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
      <Sparkles className="w-3.5 h-3.5" />
      <span>Demo Mode</span>
    </div>
  );
}
