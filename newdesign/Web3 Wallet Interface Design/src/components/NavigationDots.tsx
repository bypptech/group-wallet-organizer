import { motion } from 'motion/react';

interface NavigationDotsProps {
  total: number;
  current: number;
}

export function NavigationDots({ total, current }: NavigationDotsProps) {
  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
      {Array.from({ length: total }).map((_, index) => (
        <motion.div
          key={index}
          className={`rounded-full transition-all ${
            index === current
              ? 'w-2 h-8 bg-white'
              : 'w-2 h-2 bg-white/40'
          }`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        />
      ))}
    </div>
  );
}
