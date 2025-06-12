import React from 'react';
import { motion } from 'motion/react';

// Route mappings for natural language navigation
export const ROUTE_MAPPINGS = {
  // Admin routes
  dashboard: "/dashboard",
  jobs: "/jobs",
  "create job": "/jobs/new",
  "new job": "/jobs/new",
  "job creation": "/jobs/new",
  "add job": "/jobs/new",
  candidates: "/candidates",
  pipeline: "/pipeline",
  "interview schedule": "/interview-schedule",
  "schedule interview": "/interview-schedule",
  interviews: "/interview-schedule",
  analytics: "/analytics",
  reports: "/analytics",
  overview: "/overview",
  settings: "/settings",
  agencies: "/agencies",
  
  // User routes (for reference)
  "user dashboard": "/mydashboard",
  "ai chatbot": "/ai-chatbot",
  "ai meeting": "/ai-meeting",
  "application form": "/application-form",
  
  // Common navigation terms
  home: "/home",
  "home page": "/home",
  "go home": "/home",
  main: "/dashboard",
  "main dashboard": "/dashboard",
  "admin dashboard": "/dashboard",
  "job listings": "/jobs",
  "job management": "/jobs",
  "job board": "/jobs",
  "view jobs": "/jobs",
  "see jobs": "/jobs",
  "show jobs": "/jobs",
  "candidate management": "/candidates",
  "candidate list": "/candidates",
  "view candidates": "/candidates",
  "see candidates": "/candidates",
  "show candidates": "/candidates",
  "recruitment pipeline": "/pipeline",
  "hiring pipeline": "/pipeline",
  "view pipeline": "/pipeline",
  "see pipeline": "/pipeline",
  "show pipeline": "/pipeline",
  "interview scheduling": "/interview-schedule",
  "view interviews": "/interview-schedule",
  "see interviews": "/interview-schedule",
  "show interviews": "/interview-schedule",
  "view analytics": "/analytics",
  "see analytics": "/analytics",
  "show analytics": "/analytics",
  "view reports": "/analytics",
  "see reports": "/analytics",
  "show reports": "/analytics",
};

/**
 * Find the best matching route for a given query
 */
export function findRouteFromQuery(query: string): string | null {
  const searchText = query.toLowerCase();
  
  // Navigation trigger words that indicate intent to navigate
  const navigationTriggers = [
    'show me', 'take me to', 'go to', 'navigate to', 'open', 'view', 'see', 
    'display', 'bring up', 'switch to', 'move to', 'access', 'visit',
    'show', 'get', 'pull up', 'load', 'bring me to'
  ];
  
  // Check if this is likely a navigation request
  const hasNavigationTrigger = navigationTriggers.some(trigger => 
    searchText.includes(trigger)
  );
  
  // If it has navigation triggers, be more aggressive in matching
  if (hasNavigationTrigger) {
    // Find exact matches first
    for (const [key, value] of Object.entries(ROUTE_MAPPINGS)) {
      if (searchText.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Try partial matches with navigation context
    for (const [key, value] of Object.entries(ROUTE_MAPPINGS)) {
      const keywords = key.toLowerCase().split(' ');
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return value;
      }
    }
  }
  
  // Standard matching for non-navigation queries
  // Find exact matches first
  for (const [key, value] of Object.entries(ROUTE_MAPPINGS)) {
    if (searchText.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // If no exact match, try partial matches
  for (const [key, value] of Object.entries(ROUTE_MAPPINGS)) {
    const keywords = key.toLowerCase().split(' ');
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return value;
    }
  }
  
  return null;
}

/**
 * Animation variants for different content types
 */
export const contentVariants = {
  page: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  },
  
  staggerContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  },
  
  card: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  },
  
  header: {
    initial: { opacity: 0, x: -30 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }
};

/**
 * Higher-order component to add AI entrance animations to any component
 */
export function withAIAnimation<T extends object>(
  Component: React.ComponentType<T>,
  variant: keyof typeof contentVariants = 'card',
  delay: number = 0
) {
  return function AnimatedComponent(props: T) {
    return (
      <motion.div
        variants={contentVariants[variant]}
        initial="initial"
        animate="animate"
        transition={{ delay }}
      >
        <Component {...props} />
      </motion.div>
    );
  };
}

/**
 * Utility component for wrapping content with AI animations
 */
interface AIAnimatedProps {
  children: React.ReactNode;
  variant?: keyof typeof contentVariants;
  delay?: number;
  className?: string;
}

export const AIAnimated: React.FC<AIAnimatedProps> = ({
  children,
  variant = 'card',
  delay = 0,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      variants={contentVariants[variant]}
      initial="initial"
      animate="animate"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Page wrapper that provides consistent AI-style page transitions
 */
interface AIPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const AIPageWrapper: React.FC<AIPageWrapperProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      variants={contentVariants.page}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}; 