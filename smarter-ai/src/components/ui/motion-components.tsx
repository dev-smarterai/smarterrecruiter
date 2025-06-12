"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { createMotionVariants, createStaggeredVariants, BlockAnimationConfig } from '@/lib/ai-animations';

/**
 * Motion wrapper component for spectacular entrance animations
 */
export const MotionWrapper: React.FC<{
  children: React.ReactNode;
  config?: BlockAnimationConfig;
}> = ({ children, config = {} }) => {
  const variants = createMotionVariants(config);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

/**
 * Staggered grid animation component
 */
export const StaggeredGrid: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
}> = ({ children, staggerDelay = 0.1 }) => {
  const variants = createStaggeredVariants(staggerDelay);

  return (
    <motion.div
      variants={variants.container}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={variants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Holographic card component with 3D hover effects
 */
export const HolographicCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        rotateX: 5,
        boxShadow: [
          "0 0 30px rgba(0, 255, 255, 0.3)",
          "0 0 60px rgba(0, 128, 255, 0.2)",
          "0 0 90px rgba(128, 0, 255, 0.1)"
        ].join(", ")
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Particle entrance animation component
 */
export const ParticleEntrance: React.FC<{
  children: React.ReactNode;
  particleCount?: number;
}> = ({ children, particleCount = 20 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1]
      }}
      style={{ position: 'relative' }}
    >
      {/* Particle effects would be handled by the animation system */}
      {children}
    </motion.div>
  );
};

/**
 * Neural network background component
 */
export const NeuralBackground: React.FC<{
  children: React.ReactNode;
  nodeCount?: number;
}> = ({ children, nodeCount = 15 }) => {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Neural network canvas would be added by the hook */}
      {children}
    </motion.div>
  );
};

/**
 * Typewriter text component with particle effects
 */
export const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  className?: string;
}> = ({ text, speed = 50, className = "" }) => {
  const [displayText, setDisplayText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        textShadow: currentIndex < text.length ? '0 0 10px rgba(0, 255, 255, 0.8)' : 'none',
        color: currentIndex < text.length ? '#00ffff' : 'inherit'
      }}
    >
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </motion.div>
  );
};

/**
 * Floating orb component with energy effects
 */
export const FloatingOrb: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 80, className = "" }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 360]
      }}
      transition={{
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 20, repeat: Infinity, ease: "linear" }
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #00ffff 0%, #0080ff 50%, #8000ff 100%)',
        boxShadow: [
          '0 0 40px rgba(0, 255, 255, 0.8)',
          '0 0 80px rgba(0, 128, 255, 0.6)',
          '0 0 120px rgba(128, 0, 255, 0.4)'
        ].join(', ')
      }}
    >
      {/* Energy rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute border-2 rounded-full"
          style={{
            top: '50%',
            left: '50%',
            width: size + (ring * 40),
            height: size + (ring * 40),
            borderColor: `rgba(0, 255, 255, ${0.6 - ring * 0.1})`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [0.8, 1.5],
            opacity: [1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: ring * 1,
            ease: "linear"
          }}
        />
      ))}
    </motion.div>
  );
}; 