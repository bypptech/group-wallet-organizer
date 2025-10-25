import { motion } from 'motion/react';
import { TrendingUp, Users, Shield } from 'lucide-react';

interface CardActionsProps {
  members: number;
  weight: number;
  totalValueUSDC: string;
}

export function CardActions({ members, weight, totalValueUSDC }: CardActionsProps) {
  return (
    <div className="fixed right-3 md:right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
      {/* Info Panel - 2/3 size */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 shadow-lg"
      >
        <div className="flex flex-col gap-2.5">
          {/* Members */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-white text-sm">{members}</p>
            <p className="text-white/60 text-[10px]">Members</p>
          </div>

          <div className="w-full h-px bg-white/20" />

          {/* Weight */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-white text-sm">{weight}</p>
            <p className="text-white/60 text-[10px]">Weight</p>
          </div>

          <div className="w-full h-px bg-white/20" />

          {/* Total Value */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-xs">{totalValueUSDC}</p>
            <p className="text-white/60 text-[10px]">Value</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
