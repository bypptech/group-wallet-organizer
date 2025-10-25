import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { WalletVisualCard } from './WalletVisualCard';
import { CardActions } from './CardActions';
import { NavigationDots } from './NavigationDots';

interface Vault {
  id: string;
  name: string;
  address: string;
  metadata?: {
    totalValueUSDC?: string;
    description?: string;
  };
  members?: Array<{ address: string }>;
  createdAt?: string;
  updatedAt?: string;
}

interface VisualViewContainerProps {
  vaults: Vault[];
  type: 'my-team' | 'managed-team';
  onCardAction?: (action: string, vaultId: string) => void;
}

// Helper functions for generating visual data
const generateImageUrl = (vault: Vault): string => {
  const keywords = vault.name.toLowerCase().split(' ').filter(w => w.length > 2);
  const query = keywords.length > 0 ? keywords.join('+') : 'abstract+colorful';
  const randomId = Math.floor(Math.random() * 1000);
  return `https://images.unsplash.com/photo-${randomId}?w=1080&h=1920&fit=crop&q=80`;
};

const generateGradient = (vaultId: string): string => {
  const gradients = [
    'from-purple-900/60 via-pink-900/40 to-transparent',
    'from-blue-900/60 via-cyan-900/40 to-transparent',
    'from-emerald-900/60 via-teal-900/40 to-transparent',
    'from-orange-900/60 via-red-900/40 to-transparent',
    'from-indigo-900/60 via-violet-900/40 to-transparent',
  ];
  const hash = vaultId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[Math.abs(hash) % gradients.length];
};

const getLastActivity = (updatedAt?: string): string => {
  if (!updatedAt) return 'Recently';
  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function VisualViewContainer({
  vaults,
  type,
  onCardAction
}: VisualViewContainerProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const scrollPosition = container.scrollTop;
        const cardHeight = window.innerHeight;
        const newIndex = Math.round(scrollPosition / cardHeight);
        setCurrentCard(newIndex);
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const handleNavigate = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const cardHeight = window.innerHeight;
    container.scrollTo({
      top: index * cardHeight,
      behavior: 'smooth'
    });
  };

  const currentVault = vaults[currentCard];

  if (!vaults || vaults.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <p className="text-white/60 text-lg">No wallets found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {vaults.map((vault, index) => {
          const memberCount = vault.members?.length || 0;
          const memberSeeds = vault.members?.map(m => `${vault.id}-${m.address}`) || [`${vault.id}-default`];
          const totalValue = vault.metadata?.totalValueUSDC || '0.00';
          const description = vault.metadata?.description || undefined;

          return (
            <WalletVisualCard
              key={vault.id}
              id={vault.id}
              name={vault.name}
              address={vault.address}
              totalValueUSDC={totalValue}
              members={memberCount}
              lastActivity={getLastActivity(vault.updatedAt)}
              image={generateImageUrl(vault)}
              gradient={generateGradient(vault.id)}
              memberSeeds={memberSeeds}
              description={description}
              transactions={0}
              role="Viewer"
              type={type === 'my-team' ? 'team' : 'leader'}
            />
          );
        })}
      </div>

      {/* Navigation dots */}
      <NavigationDots
        total={vaults.length}
        current={currentCard}
        onNavigate={handleNavigate}
      />

      {/* Action buttons with current vault info */}
      {currentVault && (
        <CardActions
          vaultId={currentVault.id}
          members={currentVault.members?.length || 0}
          totalValueUSDC={currentVault.metadata?.totalValueUSDC || '0.00'}
          onDeposit={() => onCardAction?.('deposit', currentVault.id)}
          onWithdraw={() => onCardAction?.('withdraw', currentVault.id)}
          onInvite={() => onCardAction?.('invite', currentVault.id)}
        />
      )}

      {/* Scroll indicator (only on first card) */}
      {currentCard === 0 && (
        <motion.div
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <span className="text-white/60 text-sm">Scroll to explore</span>
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ChevronDown className="w-6 h-6 text-white/60" />
          </motion.div>
        </motion.div>
      )}

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
