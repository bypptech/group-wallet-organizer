import { motion } from 'framer-motion';
import { Users, Crown, Key } from 'lucide-react';

const screenshots = [
  {
    title: 'Team Pay - Group Overview',
    description: 'View all teams at a glance. Instantly track USDC balances and member counts',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Card View', 'Real-time Balance', 'Member Management']
  },
  {
    title: 'Team Pay - Member Invitation',
    description: 'Easily invite members via QR code or link',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
    features: ['QR Code', 'Invite Link', 'Permission Setup']
  },
  {
    title: 'Pay First - Dashboard',
    description: 'Unified management of all collections. Visualize USDC payment status',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    features: ['Unified View', 'Payment Status', 'Reporting']
  },
  {
    title: 'Pay First - Payment History',
    description: 'Timeline of payment records with complete transparency',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    features: ['Timeline View', 'Detailed Records', 'Search & Filter']
  },
  {
    title: 'Share Keys - Key List',
    description: 'Display all access permissions with status indicators',
    icon: Key,
    gradient: 'from-amber-500 to-orange-500',
    features: ['Status Display', 'Expiry Management', 'Access Logs']
  },
  {
    title: 'Share Keys - IoT Control Panel',
    description: 'Access control and monitoring for IoT devices',
    icon: Key,
    gradient: 'from-amber-500 to-orange-500',
    features: ['Device Control', 'Live Monitoring', 'History Logs']
  }
];

export function ScreenshotsSection() {
  return (
    <section className="relative py-20 md:py-32 px-6 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4 font-bold">
            Feature Showcase
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Intuitive UI makes complex operations simple
          </p>
        </motion.div>

        {/* Scrollable carousel on mobile, grid on desktop */}
        <div className="overflow-x-auto pb-8 -mx-6 px-6 md:overflow-visible">
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-w-max md:min-w-0">
            {screenshots.map((screenshot, index) => (
              <motion.div
                key={screenshot.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative w-80 md:w-auto flex-shrink-0 md:flex-shrink"
              >
                {/* Card */}
                <div className="h-full p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                  {/* Mock screenshot */}
                  <div className="relative mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5 aspect-video flex items-center justify-center">
                    {/* Browser chrome */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/10 flex items-center px-3 gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      </div>
                    </div>

                    {/* Icon placeholder */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${screenshot.gradient} flex items-center justify-center opacity-30`}>
                      <screenshot.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>

                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${screenshot.gradient} opacity-10`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg text-white mb-2 font-bold">
                    {screenshot.title}
                  </h3>
                  
                  <p className="text-white/60 text-sm mb-4 font-light">
                    {screenshot.description}
                  </p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2">
                    {screenshot.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover glow */}
                <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${screenshot.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300 -z-10`} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll hint for mobile */}
        <div className="md:hidden text-center mt-6">
          <p className="text-white/40 text-sm font-light">← Swipe to see more features →</p>
        </div>
      </div>
    </section>
  );
}
