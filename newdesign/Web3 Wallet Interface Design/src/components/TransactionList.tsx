import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'group';
  amount: string;
  title: string;
  subtitle: string;
  time: string;
  avatar: string;
}

const transactions: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    amount: '+2.5 ETH',
    title: 'Received from Sarah',
    subtitle: 'Team Wallet',
    time: '2 hours ago',
    avatar: 'sarah'
  },
  {
    id: '2',
    type: 'send',
    amount: '-0.8 ETH',
    title: 'Sent to Design Team',
    subtitle: 'Project funding',
    time: '5 hours ago',
    avatar: 'design'
  },
  {
    id: '3',
    type: 'group',
    amount: '+5.2 ETH',
    title: 'Group contribution',
    subtitle: 'Monthly pool',
    time: '1 day ago',
    avatar: 'group'
  },
  {
    id: '4',
    type: 'receive',
    amount: '+1.2 ETH',
    title: 'Received from Alex',
    subtitle: 'Personal',
    time: '2 days ago',
    avatar: 'alex'
  },
];

export function TransactionList() {
  return (
    <Card className="p-6 border-0 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900">Recent Activity</h2>
        <button className="text-purple-600 text-sm hover:underline">View all</button>
      </div>
      
      <div className="space-y-4">
        {transactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 5 }}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Icon */}
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tx.avatar}`} />
                <AvatarFallback>{tx.title[0]}</AvatarFallback>
              </Avatar>
              
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
                tx.type === 'send' ? 'bg-pink-500' : 
                tx.type === 'receive' ? 'bg-green-500' : 
                'bg-purple-500'
              }`}>
                {tx.type === 'send' && <ArrowUpRight className="w-3 h-3 text-white" />}
                {tx.type === 'receive' && <ArrowDownLeft className="w-3 h-3 text-white" />}
                {tx.type === 'group' && <Users className="w-3 h-3 text-white" />}
              </div>
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-900">{tx.title}</p>
              <p className="text-gray-500 text-sm">{tx.subtitle}</p>
            </div>
            
            {/* Amount and time */}
            <div className="text-right">
              <p className={`${
                tx.type === 'send' ? 'text-pink-600' : 'text-green-600'
              }`}>
                {tx.amount}
              </p>
              <p className="text-gray-400 text-sm">{tx.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
