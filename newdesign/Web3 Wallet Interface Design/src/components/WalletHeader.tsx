import { motion } from 'motion/react';
import { Wallet, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function WalletHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-8 mb-6">
      {/* Organic background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-90" />
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full blur-3xl opacity-50"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-400 to-purple-600 rounded-full blur-3xl opacity-40"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Balance</p>
              <h1 className="text-white text-3xl">42.5 ETH</h1>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl cursor-pointer"
          >
            <Users className="w-6 h-6 text-white" />
          </motion.div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Avatar className="w-10 h-10 border-2 border-white/50">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                  <AvatarFallback>M{i}</AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
          </div>
          <p className="text-white/90 text-sm ml-2">4 active members</p>
        </div>
      </div>
    </div>
  );
}
