import { motion } from 'motion/react';
import { Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface GroupWalletCardProps {
  name: string;
  balance: string;
  members: number;
  change: number;
  color: string;
  index: number;
}

export function GroupWalletCard({ name, balance, members, change, color, index }: GroupWalletCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
        
        {/* Organic shape decoration */}
        <motion.div
          className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color} rounded-full opacity-20 blur-2xl`}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${color}`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">{name}</h3>
                <p className="text-gray-500 text-sm">{members} members</p>
              </div>
            </div>
            
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {change > 0 ? '+' : ''}{change}%
            </Badge>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-1">Group Balance</p>
            <p className="text-2xl text-gray-900">{balance}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-white">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}-${i}`} />
                  <AvatarFallback>M{i}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 text-gray-700" />
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
