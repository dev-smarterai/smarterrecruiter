import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationState {
  isTransitioning: boolean;
  targetRoute: string | null;
  phase: 'idle' | 'thinking' | 'building' | 'complete';
}

export const useAINavigation = () => {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isTransitioning: false,
    targetRoute: null,
    phase: 'idle'
  });

  const navigateWithAI = useCallback(async (route: string) => {
    if (navigationState.isTransitioning) return;

    // Start transition
    setNavigationState({
      isTransitioning: true,
      targetRoute: route,
      phase: 'thinking'
    });

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Move to building phase
    setNavigationState(prev => ({
      ...prev,
      phase: 'building'
    }));

    // Perform actual navigation
    router.push(route);

    // Wait for page to load and animations to complete
    await new Promise(resolve => setTimeout(resolve, 800));

    // Complete transition
    setNavigationState({
      isTransitioning: false,
      targetRoute: null,
      phase: 'complete'
    });

    // Reset to idle after a brief moment
    setTimeout(() => {
      setNavigationState(prev => ({
        ...prev,
        phase: 'idle'
      }));
    }, 500);
  }, [router, navigationState.isTransitioning]);

  const completeTransition = useCallback(() => {
    setNavigationState({
      isTransitioning: false,
      targetRoute: null,
      phase: 'idle'
    });
  }, []);

  return {
    navigationState,
    navigateWithAI,
    completeTransition,
    isTransitioning: navigationState.isTransitioning
  };
}; 