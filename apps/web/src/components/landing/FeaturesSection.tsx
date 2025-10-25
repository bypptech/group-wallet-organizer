import { motion } from 'framer-motion';
import { Users, Crown, Key } from 'lucide-react';
import { UsdcLogo } from './UsdcLogo';

const features = [
  {
    icon: Users,
    title: 'Team Pay',
    subtitle: 'Flexible fund management for teams',
    gradient: 'from-blue-500 via-cyan-500 to-blue-500',
    description: [
      'Create and manage USDC vaults',
      'Invite members via QR code',
      'Approval-based withdrawals',
      'Real-time balance tracking'
    ]
  },
  {
    icon: Crown,
    title: 'Pay First',
    subtitle: 'Prepaid collection management',
    gradient: 'from-purple-500 via-pink-500 to-purple-500',
    description: [
      'Unified multi-team management',
      'Prepayment setup for participants',
      'Complete payment transparency',
      'Automated approval workflows'
    ]
  },
  {
    icon: Key,
    title: 'Share Keys',
    subtitle: 'Secure key sharing & device control',
    gradient: 'from-amber-500 via-orange-500 to-amber-500',
    description: [
      'Temporary access permissions',
      'IoT device integration (ESP32)',
      'Time-limited invite links',
      'Complete access logging'
    ]
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 md:py-32 px-6 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4 font-bold">
            Three Core Values
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Powerful features for all your group fund management needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              {/* Glass morphism card */}
              <div className="relative h-full p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:bg-white/8 hover:border-white/20">
                {/* USDC Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center gap-1.5">
                  <UsdcLogo size={16} />
                  <span className="text-blue-300 text-xs font-semibold">USDC</span>
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className={`text-2xl mb-2 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent font-bold`}>
                  {feature.title}
                </h3>
                
                {/* Subtitle */}
                <p className="text-white/80 mb-6 font-medium">
                  {feature.subtitle}
                </p>

                {/* Description list */}
                <ul className="space-y-3">
                  {feature.description.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10 blur-xl`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
