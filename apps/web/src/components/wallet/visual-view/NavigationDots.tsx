import { motion } from 'framer-motion';

interface NavigationDotsProps {
  total: number;
  current: number;
  onNavigate?: (index: number) => void;
}

export function NavigationDots({ total, current, onNavigate }: NavigationDotsProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
      {Array.from({ length: total }, (_, i) => (
        <motion.button
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i === current
              ? 'bg-white w-2 h-8'
              : 'bg-white/40 hover:bg-white/60'
          }`}
          onClick={() => onNavigate?.(i)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      ))}
    </div>
  );
}
