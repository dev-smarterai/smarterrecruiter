"use client";

import { Sidebar } from "@/components/ui/navigation/Sidebar"
import { useState, useEffect } from "react"
import AskAdamAdmin from "@/components/newUI/admin/dashboard/ask-adam-admin"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AIPageTransition } from "@/components/ui/ai-navigation/AIPageTransition"
import { useAINavigation } from "@/hooks/use-ai-navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname();
  const isHomePage = pathname === "/home";
  const [isAdamOpen, setIsAdamOpen] = useState(false);
  const { navigationState, completeTransition } = useAINavigation();

  // Close Adam when navigation starts
  useEffect(() => {
    if (navigationState.isTransitioning) {
      setIsAdamOpen(false);
    }
  }, [navigationState.isTransitioning]);

  return (
    <>
      <Sidebar />
      <main className="lg:pl-72">
        <div className="relative pb-20">
          <div className="p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7">
            {children}
          </div>
        </div>
        
        {/* AI Navigation Transition Overlay */}
        <AIPageTransition
          isActive={navigationState.isTransitioning}
          onComplete={completeTransition}
          targetRoute={navigationState.targetRoute || ''}
        />
        
        {/* Show Adam floating UI when open */}
        <AnimatePresence>
          {!isHomePage && isAdamOpen && (
            <motion.div 
              className="fixed bottom-16 right-4 sm:bottom-20 sm:right-6 lg:bottom-20 lg:left-[calc(72px+1rem)] lg:right-auto z-50 w-[320px] h-[500px] sm:w-[360px] sm:h-[550px] lg:w-[400px] lg:h-[600px]"
              initial={{ 
                opacity: 0, 
                scale: 0.1, 
                rotate: -180,
                x: -280, // Start from orb position (mobile)
                y: 420,  // Start from orb position (mobile)
                transformOrigin: "bottom left"
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                x: 0,
                y: 0,
                transformOrigin: "bottom left"
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.1, 
                rotate: 180,
                x: -280, // Return to orb position
                y: 420,
                transformOrigin: "bottom left"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 25,
                duration: 0.6,
                opacity: { duration: 0.3 },
                rotate: { 
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }
              }}
            >
              <AskAdamAdmin 
                onClose={() => setIsAdamOpen(false)} 
                onNavigate={() => setIsAdamOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Orb video button in the bottom left - only show when not transitioning */}
        {!isHomePage && !navigationState.isTransitioning && (
          <div 
            onClick={() => setIsAdamOpen(!isAdamOpen)}
            className="fixed bottom-6 left-2 lg:left-7 z-50 w-16 h-16 lg:w-24 lg:h-24 rounded-full overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-blue-300"
            aria-label={isAdamOpen ? "Close Adam" : "Open Adam"}
          >
            <video
              src="/orb.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </main>
    </>
  )
}
