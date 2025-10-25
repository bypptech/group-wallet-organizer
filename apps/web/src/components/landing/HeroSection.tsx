import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UsdcLogo } from './UsdcLogo';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[#0a0a0f]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]" />

      {/* Header */}
      <motion.header 
        className="absolute top-0 left-0 right-0 z-50 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <UsdcLogo size={32} />
            </div>
            <span className="text-white text-xl">Group Wallet Organizer</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#use-cases" className="text-white/60 hover:text-white transition-colors">Use Cases</a>
            <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors">How It Works</a>
          </nav>

          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 px-12 py-6 text-lg shadow-[0_8px_24px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.6)] transition-all hover:-translate-y-0.5 font-semibold"
            asChild
          >
            <a href="/wallet-demo">View Demo</a>
          </Button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-bold tracking-tight">
            Simple & Secure: Share Keys, Manage Funds with USDC
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto font-light">
            Easy collaborative wallet management for teams and families<br />
            Powered by multi-signature & escrow technology
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center items-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 px-12 py-6 text-lg shadow-[0_8px_24px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.6)] transition-all hover:-translate-y-0.5 font-semibold"
            asChild
          >
            <a href="/wallet-demo">View Demo</a>
          </Button>
        </motion.div>

        {/* Main Visual - 3D Wallet Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative mt-16"
        >
          <div className="relative w-full max-w-2xl mx-auto aspect-video">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* USDC Visualization */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Large USDC coin with proper logo */}
                <motion.div
                  className="absolute inset-0 rounded-full shadow-2xl flex items-center justify-center"
                  animate={{
                    rotateY: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  <UsdcLogo size={256} />
                </motion.div>
                
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/20" />
                <div className="absolute inset-4 rounded-full border-2 border-blue-400/30" />
                
                {/* USDC text overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-blue-300 font-bold tracking-widest text-lg">
                  USDC
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute top-1/4 -left-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl opacity-60 blur-sm"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 -right-8 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-60 blur-sm"
              animate={{
                y: [0, 20, 0],
                rotate: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/40 text-sm"
        >
          ↓
        </motion.div>
      </motion.div>
    </section>
  );
}
