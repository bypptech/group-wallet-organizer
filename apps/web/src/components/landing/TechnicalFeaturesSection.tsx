import { motion } from 'framer-motion';
import { Shield, Zap, Globe } from 'lucide-react';
import { UsdcLogo } from './UsdcLogo';

const techFeatures = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'USDC security prioritized',
    features: [
      'Merkle Proof-based approval system',
      'Timelock protection',
      'Role-based access control'
    ],
    gradient: 'from-blue-500 to-cyan-500',
    iconColor: 'text-blue-400'
  },
  {
    icon: Zap,
    title: 'Account Abstraction',
    description: 'Smart account technology',
    features: [
      'Gas sponsorship (Paymaster)',
      'Batch transactions',
      'Seamless UX'
    ],
    gradient: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-400'
  },
  {
    icon: Globe,
    title: 'Base Network',
    description: 'Built on Base Network',
    features: [
      'Fast & low-cost transactions',
      'Ethereum compatible',
      'Enterprise ready'
    ],
    gradient: 'from-amber-500 to-orange-500',
    iconColor: 'text-amber-400'
  }
];

export function TechnicalFeaturesSection() {
  return (
    <section className="relative py-20 md:py-32 px-6 bg-[#1a1a2e]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20">
            <UsdcLogo size={24} />
            <span className="text-blue-300 font-semibold">USDC Powered</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4 font-bold">
            Technical Features
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Security and convenience powered by cutting-edge blockchain technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {techFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:bg-white/15 hover:border-white/20">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl text-white mb-2 font-bold">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-white/60 mb-6 text-sm font-medium">
                  {feature.description}
                </p>

                {/* Features list */}
                <ul className="space-y-3">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                      <span className={`${feature.iconColor} mt-1`}>●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Glow effect */}
              <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
