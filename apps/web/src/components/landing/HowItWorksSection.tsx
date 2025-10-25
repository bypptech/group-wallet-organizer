import { motion } from 'framer-motion';
import { Link as LinkIcon, Users, Wallet } from 'lucide-react';
import { UsdcLogo } from './UsdcLogo';

const steps = [
  {
    number: '01',
    icon: LinkIcon,
    title: 'Connect',
    subtitle: 'Connect Wallet',
    description: 'Connect to Base Sepolia with MetaMask, Coinbase Wallet, Rainbow or other wallets',
    gradient: 'from-blue-500 to-cyan-500',
    details: [
      'Supported: MetaMask, Coinbase Wallet, Rainbow',
      'Auto-connect to Base Sepolia'
    ]
  },
  {
    number: '02',
    icon: Users,
    title: 'Create',
    subtitle: 'Create Team',
    description: 'Enter team name and description, invite members, and set approval rules to get started',
    gradient: 'from-purple-500 to-pink-500',
    details: [
      'Input name and description',
      'Invite members (QR code or link)',
      'Configure approval rules (threshold / timelock)'
    ]
  },
  {
    number: '03',
    icon: Wallet,
    title: 'Manage',
    subtitle: 'Fund Management',
    description: 'Deposit USDC to pool funds. Create withdrawal requests and release with member approval',
    gradient: 'from-amber-500 to-orange-500',
    details: [
      'Deposit USDC to pool',
      'Create withdrawal requests',
      'Release with member approval'
    ]
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-20 md:py-32 px-6 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f] overflow-hidden">
      {/* Floating USDC coins decoration */}
      <motion.div
        className="absolute top-20 right-10 w-20 h-20 flex items-center justify-center"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 360, 720],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <UsdcLogo size={80} />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-10 w-16 h-16 flex items-center justify-center"
        animate={{
          y: [0, 15, 0],
          rotate: [0, -360, -720],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <UsdcLogo size={64} />
      </motion.div>
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4 font-bold">
            How It Works
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Start your group wallet in 3 simple steps
          </p>
        </motion.div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block relative">
          {/* Timeline line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 opacity-30" />

          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {/* Circle on timeline */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border-4 border-[#0a0a0f] flex items-center justify-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center`}>
                    <step.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Content card */}
                <div className="mt-24 p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                  <div className={`text-6xl bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent opacity-20 mb-4`}>
                    {step.number}
                  </div>
                  
                  <h3 className={`text-2xl mb-2 bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent font-bold`}>
                    {step.title}
                  </h3>
                  
                  <p className="text-white/80 mb-4 font-semibold">
                    {step.subtitle}
                  </p>
                  
                  <p className="text-white/60 text-sm mb-6 font-light">
                    {step.description}
                  </p>

                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/50 text-xs">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative flex gap-6"
            >
              {/* Icon circle */}
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-16 bg-gradient-to-b from-white/20 to-transparent mx-auto mt-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className={`text-4xl bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent opacity-20 mb-2`}>
                  {step.number}
                </div>
                
                <h3 className={`text-xl mb-1 bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent font-bold`}>
                  {step.title}
                </h3>
                
                <p className="text-white/80 mb-3 text-sm font-semibold">
                  {step.subtitle}
                </p>
                
                <p className="text-white/60 text-sm mb-4 font-light">
                  {step.description}
                </p>

                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/50 text-xs">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
