import { motion } from 'motion/react';
import { Heart, Zap, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

export function EmotionalStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Trust Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 opacity-5" />
          <motion.div
            className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-br from-pink-400 to-rose-600 rounded-full opacity-10 blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">Trust Score</h3>
            </div>
            <p className="text-3xl text-gray-900 mb-1">98%</p>
            <p className="text-gray-500 text-sm">Group harmony level</p>
          </div>
        </Card>
      </motion.div>
      
      {/* Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 opacity-5" />
          <motion.div
            className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full opacity-10 blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">Active Energy</h3>
            </div>
            <p className="text-3xl text-gray-900 mb-1">24</p>
            <p className="text-gray-500 text-sm">Transactions this week</p>
          </div>
        </Card>
      </motion.div>
      
      {/* Growth */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-5" />
          <motion.div
            className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full opacity-10 blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">Growth</h3>
            </div>
            <p className="text-3xl text-gray-900 mb-1">+23%</p>
            <p className="text-gray-500 text-sm">Portfolio growth</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
