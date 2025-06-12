import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';

interface AIPageTransitionProps {
  isActive: boolean;
  onComplete: () => void;
  targetRoute: string;
}

export const AIPageTransition: React.FC<AIPageTransitionProps> = ({
  isActive,
  onComplete,
  targetRoute
}) => {
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'building' | 'complete'>('idle');
  const orbControls = useAnimation();
  const particleControls = useAnimation();

  useEffect(() => {
    if (isActive) {
      startTransition();
    }
  }, [isActive]);

  const startTransition = async () => {
    setPhase('thinking');
    
    // Thinking phase - orb expansion and gentle rotation
    await orbControls.start({
      scale: [1, 1.4, 1.2],
      rotate: [0, 360],
      transition: { duration: 1.5, ease: "easeInOut" }
    });

    setPhase('building');
    
    // Building phase - particle burst and energy effects
    await Promise.all([
      particleControls.start({
        scale: [0, 1.5, 0],
        opacity: [0, 1, 0],
        transition: { duration: 1.0, ease: "easeOut" }
      }),
      orbControls.start({
        scale: [1.2, 1.6, 1.3],
        filter: [
          'brightness(1) saturate(1)',
          'brightness(1.3) saturate(1.5)',
          'brightness(1.1) saturate(1.2)'
        ],
        transition: { duration: 1.0, ease: "easeInOut" }
      })
    ]);

    setPhase('complete');
    
    setTimeout(() => {
      onComplete();
      setPhase('idle');
    }, 300);
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Subtle AI grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative flex flex-col items-center gap-8 z-10">
          {/* Main AI Orb */}
          <motion.div
            animate={orbControls}
            className="relative"
          >
            {/* Orb video */}
            <video
              src="/orb.webm"
              width={120}
              height={120}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            
            {/* Pulsing energy rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-purple-400/40"
                animate={{
                  scale: [1, 2.5, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Particle effects during building */}
            {phase === 'building' && (
              <motion.div
                animate={particleControls}
                className="absolute inset-0"
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                      background: `linear-gradient(45deg, #8b5cf6, #a855f7, #c084fc)`,
                    }}
                    animate={{
                      x: [0, Math.cos(i * 30 * Math.PI / 180) * 60],
                      y: [0, Math.sin(i * 30 * Math.PI / 180) * 60],
                      opacity: [1, 0.3, 0],
                      scale: [1, 1.2, 0],
                    }}
                    transition={{
                      duration: 1.0,
                      ease: "easeOut",
                      delay: i * 0.05
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Status display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.h3
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-xl font-semibold text-gray-800"
            >
              {phase === 'thinking' && '🤔 Understanding your request...'}
              {phase === 'building' && '✨ Building your page...'}
              {phase === 'complete' && '🎉 Ready!'}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-purple-600 mt-2 font-medium"
            >
              Navigating to <span className="font-mono bg-purple-100 px-2 py-1 rounded text-purple-800">{targetRoute}</span>
            </motion.p>
          </motion.div>

          {/* Progress indicator */}
          <motion.div className="w-64 h-1.5 bg-purple-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ 
                width: phase === 'thinking' ? '40%' : 
                       phase === 'building' ? '85%' : '100%'
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </motion.div>

          {/* Completion sparkles */}
          {phase === 'complete' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(i * 45 * Math.PI / 180) * 120],
                    y: [0, Math.sin(i * 45 * Math.PI / 180) * 120],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    delay: i * 0.05
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 