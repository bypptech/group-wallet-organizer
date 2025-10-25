import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Copy, ExternalLink, TrendingUp, Clock, Wallet, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface WalletVisualCardProps {
  id: string;
  name: string;
  address: string;
  totalValueUSDC: string;
  members: number;
  pendingMembers?: number;
  lastActivity: string;
  image: string;
  gradient: string;
  memberSeeds: string[];
  description?: string;
  transactions?: number;
  role: string;
  type: 'team' | 'leader';
}

export function WalletVisualCard({
  id,
  name,
  address,
  totalValueUSDC,
  members,
  pendingMembers,
  lastActivity,
  image,
  gradient,
  memberSeeds,
  description,
  transactions = 0,
  role,
  type
}: WalletVisualCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(transactions);

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <motion.div
      className="relative w-full h-screen snap-start snap-always flex items-center justify-center overflow-hidden"
      onDoubleClick={handleDoubleTap}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-blue-500/30"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Double tap heart animation */}
      {liked && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.5, 1.2], opacity: [1, 1, 0] }}
          transition={{ duration: 0.6 }}
          onAnimationComplete={() => setLiked(false)}
        >
          <Heart className="w-32 h-32 text-white fill-white" />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-8">
        {/* Top Section - Wallet ID and Role */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-white text-2xl font-bold">{name}</h1>
              <Badge className="bg-indigo-500/80 text-white border-0">
                {role}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-white/60 text-sm">{id.slice(0, 8)}</p>
              {/* Wallet Type Badge */}
              <Badge
                className={`${
                  type === 'team'
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-amber-500/80 text-white'
                } border-0 flex items-center gap-1`}
              >
                {type === 'team' ? (
                  <>
                    <Users className="w-3 h-3" />
                    Team Pay
                  </>
                ) : (
                  <>
                    <Wallet className="w-3 h-3" />
                    Pay First
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* BeReal-style photo window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="w-20 h-28 rounded-2xl overflow-hidden border-3 border-white/30 shadow-2xl bg-white/10 backdrop-blur-md">
              {/* Main photo area */}
              <div className="w-full h-full relative">
                <img
                  src={image}
                  alt="Wallet snapshot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                {/* Small selfie-style overlay in corner */}
                <div className="absolute top-1.5 right-1.5 w-8 h-8 rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberSeeds[0]}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Center - Balance Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <p className="text-white/70 text-lg mb-3">Total Value</p>
              <h1 className="text-white text-7xl font-bold mb-2">{totalValueUSDC}</h1>
              <div className="flex items-center justify-center gap-2 mb-6">
                <p className="text-white/60 text-xl">USDC</p>
              </div>
            </motion.div>

            {/* Member Avatars */}
            <div className="flex justify-center -space-x-3 mb-4">
              {memberSeeds.slice(0, 5).map((seed, i) => (
                <motion.div
                  key={seed}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Avatar className="w-14 h-14 border-3 border-white/50 shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} />
                    <AvatarFallback>M</AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {members > 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="w-14 h-14 rounded-full border-3 border-white/50 bg-white/20 backdrop-blur-md flex items-center justify-center"
                >
                  <span className="text-white font-semibold">+{members - 5}</span>
                </motion.div>
              )}
            </div>

            <motion.div
              className="inline-block px-6 py-3 rounded-full bg-white/20 backdrop-blur-md"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-white text-sm">Double tap to appreciate</p>
            </motion.div>

            {/* Comment section */}
            {description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 max-w-md mx-auto"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                  <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                    {description}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Bottom Section - Detailed Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Wallet Address */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-white/10">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-sm">Wallet Address</p>
                  <p className="text-white truncate">{address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={copyAddress}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Copy className="w-4 h-4 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Value */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-white/60" />
                <p className="text-white/60 text-sm">Total Value</p>
              </div>
              <p className="text-emerald-400 text-xl font-semibold">{totalValueUSDC} USDC</p>
            </div>

            {/* Last Activity */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-white/60" />
                <p className="text-white/60 text-sm">Last Activity</p>
              </div>
              <p className="text-white text-xl font-semibold">{lastActivity}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
