import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { UsdcLogo } from './UsdcLogo';

const benefits = [
  'Start with just a wallet connection',
  'No gas fees required (Paymaster support)',
  'Safely test on Base Sepolia testnet with USDC'
];

export function GetStartedSection() {
  return (
    <section className="relative py-20 md:py-32 px-6 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-90">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(168, 85, 247, 0.8), rgba(236, 72, 153, 0.8))',
            backgroundSize: '200% 200%'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold">
            Get Started Now!
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 font-light">
            Create your team wallet in 3 minutes
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 px-12 py-6 text-lg shadow-[0_8px_24px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.6)] transition-all hover:-translate-y-0.5 font-semibold"
              asChild
            >
              <a href="/wallet-demo">View Demo</a>
            </Button>
          </div>

          {/* Benefits checklist */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-8 space-y-4"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-white text-lg font-light">
                  {benefit}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional info */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-white/70 text-sm pt-4 font-light"
          >
            No credit card required • No personal information needed • Start using immediately
          </motion.p>
        </motion.div>
      </div>

      {/* Decorative USDC coins */}
      <motion.div
        className="absolute top-20 left-10"
        animate={{
          scale: [1, 1.2, 1],
          y: [0, -20, 0],
          rotate: [0, 360, 720],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <UsdcLogo size={96} />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-10"
        animate={{
          scale: [1, 1.3, 1],
          y: [0, 20, 0],
          rotate: [720, 360, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative">
          <UsdcLogo size={128} />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-xs font-bold tracking-wider whitespace-nowrap">
            USDC
          </div>
        </div>
      </motion.div>
      <motion.div
        className="absolute top-1/2 right-1/4"
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, -360, -720],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <UsdcLogo size={64} />
      </motion.div>
    </section>
  );
}
