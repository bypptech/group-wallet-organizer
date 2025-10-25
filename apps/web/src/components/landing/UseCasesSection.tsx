import { motion } from 'framer-motion';
import { ImageWithFallback } from './figma/ImageWithFallback';

const useCases = [
  {
    title: 'Team Project Budget Management',
    description: 'Collaboratively manage project budgets with USDC. Execute payments with approver consensus when expenses occur.',
    image: 'https://images.unsplash.com/photo-1758518727929-4506fc031e1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMGRpZ2l0YWx8ZW58MXx8fHwxNzYxMzM4MjE4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Event & Community Fee Management',
    description: 'Pool USDC funds with all members. Approve expenses transparently through majority voting.',
    image: 'https://images.unsplash.com/photo-1654868537177-86c35bb6b226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBldmVudCUyMHBlb3BsZXxlbnwxfHx8fDE3NjEzMjk3OTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Small-Scale DAO Treasury',
    description: 'Fully transparent community fund management in USDC. Automatic distribution of member rewards and donations.',
    image: 'https://images.unsplash.com/photo-1695548111374-e9743266cd6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWNlbnRyYWxpemVkJTIwb3JnYW5pemF0aW9ufGVufDF8fHx8MTc2MTMzOTM1Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Shared Office & Facility Access',
    description: 'Share smart lock access for limited periods. Grant IoT device permissions and record usage history.',
    image: 'https://images.unsplash.com/photo-1667430806405-70ef5bc4970f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMG9mZmljZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYxMjcxNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-amber-500 to-orange-500'
  }
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-20 md:py-32 px-6 bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4 font-bold">
            Use Cases
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Safely manage group funds and permissions in various scenarios
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${useCase.gradient} opacity-40 group-hover:opacity-50 transition-opacity duration-300`} />
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className={`text-2xl mb-3 bg-gradient-to-r ${useCase.gradient} bg-clip-text text-transparent font-bold`}>
                  {useCase.title}
                </h3>
                <p className="text-white/70 font-light">
                  {useCase.description}
                </p>
              </div>

              {/* Hover effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
