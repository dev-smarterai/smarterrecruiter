import React, { useEffect, useState } from 'react';
import { motion, useAnimation, stagger } from 'motion/react';

interface AIContentBuilderProps {
  isActive: boolean;
  children: React.ReactNode;
  onComplete?: () => void;
}

export const AIContentBuilder: React.FC<AIContentBuilderProps> = ({
  isActive,
  children,
  onComplete
}) => {
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsBuilding(true);
      // Complete building after animations
      const timer = setTimeout(() => {
        setIsBuilding(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Hook for individual content blocks
export const useAIContentBlock = (delay: number = 0) => {
  return {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1 
    },
    transition: { 
      duration: 0.5, 
      delay: delay * 0.1,
      ease: "easeOut" 
    }
  };
};

// Enhanced wrapper component with construction effects
interface AIContentBlockProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  blockType?: 'card' | 'header' | 'list' | 'grid' | 'table';
}

export const AIContentBlock: React.FC<AIContentBlockProps> = ({
  children,
  delay = 0,
  className = '',
  blockType = 'card'
}) => {
  const [isConstructing, setIsConstructing] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowParticles(true);
    }, delay * 100 + 200);

    const timer2 = setTimeout(() => {
      setShowWireframe(false);
      setIsConstructing(false);
    }, delay * 100 + 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [delay]);

  const getConstructionVariants = () => {
    const baseVariants = {
      card: {
        initial: { 
          opacity: 0, 
          y: 30, 
          scale: 0.9,
          rotateX: -15,
        },
        wireframe: {
          opacity: 0.3,
          y: 15,
          scale: 0.95,
          rotateX: -8,
        },
        building: {
          opacity: 0.7,
          y: 5,
          scale: 0.98,
          rotateX: -2,
        },
        complete: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotateX: 0,
        }
      },
      header: {
        initial: { 
          opacity: 0, 
          x: -50,
          skewX: -5,
        },
        wireframe: {
          opacity: 0.3,
          x: -25,
          skewX: -2,
        },
        building: {
          opacity: 0.7,
          x: -10,
          skewX: -1,
        },
        complete: { 
          opacity: 1, 
          x: 0,
          skewX: 0,
        }
      },
      table: {
        initial: { 
          opacity: 0, 
          y: 40, 
          scale: 0.85,
          rotateY: 10,
        },
        wireframe: {
          opacity: 0.2,
          y: 20,
          scale: 0.92,
          rotateY: 5,
        },
        building: {
          opacity: 0.6,
          y: 8,
          scale: 0.96,
          rotateY: 2,
        },
        complete: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotateY: 0,
        }
      },
      list: {
        initial: { 
          opacity: 0, 
          x: -30,
          scale: 0.9,
        },
        wireframe: {
          opacity: 0.3,
          x: -15,
          scale: 0.95,
        },
        building: {
          opacity: 0.7,
          x: -5,
          scale: 0.98,
        },
        complete: { 
          opacity: 1, 
          x: 0,
          scale: 1,
        }
      },
      grid: {
        initial: { 
          opacity: 0, 
          scale: 0.7,
          rotate: -5,
        },
        wireframe: {
          opacity: 0.3,
          scale: 0.85,
          rotate: -2,
        },
        building: {
          opacity: 0.7,
          scale: 0.95,
          rotate: -1,
        },
        complete: { 
          opacity: 1, 
          scale: 1,
          rotate: 0,
        }
      }
    };

    return baseVariants[blockType] || baseVariants.card;
  };

  const variants = getConstructionVariants();

  const getCurrentState = () => {
    if (isConstructing && showWireframe) return 'wireframe';
    if (isConstructing && showParticles) return 'building';
    return 'complete';
  };

  return (
    <div className="relative">
      {/* Construction particles */}
      {showParticles && isConstructing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                opacity: 0,
                scale: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: [
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%'
                ],
                y: [
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%'
                ],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Wireframe overlay */}
      {showWireframe && isConstructing && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          style={{
            background: `
              linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%),
              linear-gradient(0deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)
            `,
            backgroundSize: '20px 20px',
            border: '1px dashed rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
          }}
        />
      )}

      {/* Scanning line effect */}
      {isConstructing && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            initial={{ y: '-100%' }}
            animate={{ y: '100vh' }}
            transition={{
              duration: 1.5,
              delay: delay * 0.1,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}

      {/* Main content with construction animation */}
      <motion.div
        className={className}
        variants={variants}
        initial="initial"
        animate={getCurrentState()}
        transition={{
          duration: 0.8,
          delay: delay * 0.1,
          ease: "easeOut"
        }}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glitch effect during construction */}
        {isConstructing && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: [0, 0.1, 0],
              x: [0, 2, -2, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: 3,
              delay: delay * 0.1 + 0.3,
            }}
            style={{
              background: 'linear-gradient(90deg, rgba(255,0,0,0.1), rgba(0,255,0,0.1), rgba(0,0,255,0.1))',
              mixBlendMode: 'multiply',
            }}
          />
        )}
        
        {children}
      </motion.div>

      {/* Assembly completion flash */}
      {!isConstructing && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 0.5,
            delay: delay * 0.1 + 0.8,
          }}
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
};

// Enhanced grid container with spectacular staggered construction
interface AIGridProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const AIGrid: React.FC<AIGridProps> = ({
  children,
  className = '',
  staggerDelay = 0.1
}) => {
  const [isConstructing, setIsConstructing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConstructing(false);
    }, React.Children.count(children) * staggerDelay * 1000 + 1000);

    return () => clearTimeout(timer);
  }, [children, staggerDelay]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30, 
      scale: 0.8,
      rotateX: -20,
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative">
      {/* Grid construction overlay */}
      {isConstructing && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(59, 130, 246, 0.1) 20px,
                rgba(59, 130, 246, 0.1) 21px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 20px,
                rgba(59, 130, 246, 0.1) 20px,
                rgba(59, 130, 246, 0.1) 21px
              )
            `,
          }}
        />
      )}

      <motion.div
        className={className}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          perspective: '1000px',
        }}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div 
            key={index} 
            variants={itemVariants}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}; 