import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { WalletCard } from './components/WalletCard';
import { CardActions } from './components/CardActions';
import { NavigationDots } from './components/NavigationDots';
import { ChevronDown } from 'lucide-react';

// Generate random USDC value around 100
const generateRandomUSDC = () => {
  const baseValue = 100;
  const variation = Math.random() * 40 - 20; // -20 to +20
  return (baseValue + variation).toFixed(2);
};

// Generate random wallet type
const generateRandomType = (): 'team' | 'leader' => {
  return Math.random() > 0.5 ? 'team' : 'leader';
};

const walletCards = [
  {
    name: 'Leader02',
    walletId: '02',
    address: '0x157e...ff84',
    totalValueUSDC: generateRandomUSDC(),
    members: 1,
    pendingMembers: 0,
    weight: 3,
    lastActivity: '18h ago',
    image: 'https://images.unsplash.com/photo-1648817860770-dacc62d8cb18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwZmxvd3xlbnwxfHx8fDE3NjA4MzQ5NzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-purple-900/60 via-pink-900/40 to-transparent',
    memberSeeds: ['leader02-1'],
    description: 'Just deposited for our upcoming trip! So excited to finally make this happen together. Can\'t wait to create amazing memories! 🌟✨',
    transactions: 234,
    role: 'Viewer',
    type: generateRandomType(),
  },
  {
    name: 'Leader01',
    walletId: '01',
    address: '0xd749...9dbc',
    totalValueUSDC: generateRandomUSDC(),
    members: 1,
    pendingMembers: 0,
    weight: 3,
    lastActivity: '18h ago',
    image: 'https://images.unsplash.com/photo-1728597579511-6c5609554fa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwZ3JhZGllbnQlMjBsaXF1aWR8ZW58MXx8fHwxNzYwODM0OTczfDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-blue-900/60 via-cyan-900/40 to-transparent',
    memberSeeds: ['leader01-1'],
    description: 'Our creative fund is growing! Thanks everyone for contributing. Let\'s keep building something amazing together 🚀💫',
    transactions: 567,
    role: 'Viewer',
    type: generateRandomType(),
  },
  {
    name: 'Leader 01',
    walletId: '01',
    address: '0x4370...b26c',
    totalValueUSDC: generateRandomUSDC(),
    members: 1,
    pendingMembers: 0,
    weight: 8,
    lastActivity: '18h ago',
    image: 'https://images.unsplash.com/photo-1737505599278-4266307e7190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWJyYW50JTIwaG9sb2dyYXBoaWMlMjB0ZXh0dXJlfGVufDF8fHx8MTc2MDgzNDk3NHww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-emerald-900/60 via-teal-900/40 to-transparent',
    memberSeeds: ['leader01v2-1'],
    description: 'Governance decisions made! We\'re moving forward with the new investment strategy. Love how everyone participated in this vote 🗳️💚',
    transactions: 892,
    role: 'Viewer',
    type: generateRandomType(),
  },
  {
    name: '1018_3',
    walletId: '1018_3',
    address: '0x4c94...f8a6',
    totalValueUSDC: generateRandomUSDC(),
    members: 2,
    pendingMembers: 6,
    weight: 3,
    lastActivity: '23h ago',
    image: 'https://images.unsplash.com/photo-1706466614826-761c08aaae2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG9yZ2FuaWMlMjBncmFkaWVudHxlbnwxfHx8fDE3NjA4MzQ1NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-orange-900/60 via-red-900/40 to-transparent',
    memberSeeds: ['1018_3-1', '1018_3-2'],
    description: 'Weekend adventure fund is ready! Who\'s ready for some epic memories? Can\'t believe we\'re actually doing this! 🎉🏔️',
    transactions: 156,
    role: 'Viewer',
    type: generateRandomType(),
  },
  {
    name: '1018_01',
    walletId: '1018_01 de',
    address: '0x0cc9...62c4',
    totalValueUSDC: generateRandomUSDC(),
    members: 1,
    pendingMembers: 2,
    weight: 3,
    lastActivity: '1 day ago',
    image: 'https://images.unsplash.com/photo-1630432198429-e5bebf02a377?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xvZ3JhcGhpYyUyMGJ1YmJsZXxlbnwxfHx8fDE3NjA4MzQ1NTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-indigo-900/60 via-violet-900/40 to-transparent',
    memberSeeds: ['1018_01-1'],
    description: 'Supporting local community projects feels so good. Every contribution matters and makes a real difference! 🌱💜',
    transactions: 89,
    role: 'Viewer',
    type: generateRandomType(),
  },
];

export default function App() {
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

  const currentWallet = walletCards[currentCard];

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
        {walletCards.map((wallet) => (
          <WalletCard
            key={wallet.address}
            {...wallet}
          />
        ))}
      </div>

      {/* Navigation dots */}
      <NavigationDots total={walletCards.length} current={currentCard} />

      {/* Action buttons with current wallet info */}
      <CardActions 
        members={currentWallet.members}
        weight={currentWallet.weight}
        totalValueUSDC={currentWallet.totalValueUSDC}
      />

      {/* Scroll indicator (only on first card) */}
      {currentCard === 0 && (
        <motion.div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
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
