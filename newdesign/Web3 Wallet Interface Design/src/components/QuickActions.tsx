import { motion } from 'motion/react';
import { Send, Download, RefreshCw, PlusCircle } from 'lucide-react';

const actions = [
  { icon: Send, label: 'Send', color: 'from-purple-500 to-pink-500' },
  { icon: Download, label: 'Receive', color: 'from-blue-500 to-cyan-500' },
  { icon: RefreshCw, label: 'Swap', color: 'from-green-500 to-emerald-500' },
  { icon: PlusCircle, label: 'Add Group', color: 'from-orange-500 to-red-500' },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          <div className="relative p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Gradient background on hover */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}
            />
            
            {/* Icon with gradient */}
            <div className="relative flex flex-col items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color}`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-700 text-sm">{action.label}</span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
