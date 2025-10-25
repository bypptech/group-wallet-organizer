import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, UserPlus, Users } from 'lucide-react';

interface CardActionsProps {
  vaultId: string;
  members: number;
  totalValueUSDC: string;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onInvite?: () => void;
}

export function CardActions({
  vaultId,
  members,
  totalValueUSDC,
  onDeposit,
  onWithdraw,
  onInvite
}: CardActionsProps) {
  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl">
        {/* Quick Stats */}
        <div className="flex items-center gap-6 mb-4 px-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-white/80 text-sm">{members} members</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-white/80 text-sm font-semibold">
            {totalValueUSDC} USDC
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="default"
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl gap-2 shadow-lg"
              onClick={onDeposit}
            >
              <ArrowDownCircle className="w-5 h-5" />
              Deposit
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="default"
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl gap-2 shadow-lg"
              onClick={onWithdraw}
            >
              <ArrowUpCircle className="w-5 h-5" />
              Withdraw
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl gap-2 shadow-lg backdrop-blur-sm"
              onClick={onInvite}
            >
              <UserPlus className="w-5 h-5" />
              Invite
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
