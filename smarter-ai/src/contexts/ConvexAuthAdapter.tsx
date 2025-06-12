"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

/**
 * This component bridges the existing AuthContext with Convex Auth
 * It synchronizes authentication state between the two systems
 */
export function ConvexAuthAdapter({ children }: { children: React.ReactNode }) {
  const { user, login, logout } = useAuth();
  const { signIn, signOut } = useAuthActions();
  const authToken = useAuthToken();
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Get user data from Convex
  const convexUser = useQuery(api.users.me);

  // Effect to sync from Convex Auth to existing AuthContext
  useEffect(() => {
    // Only run this once on initialization
    if (isInitializing && convexUser !== undefined) {
      setIsInitializing(false);

      // If Convex has a user but local auth doesn't, update local auth
      if (convexUser && !user) {
        // The login function normally would redirect, but we'll handle that separately
        // This is just to update the AuthContext state
        login(convexUser.email || "", "").catch(console.error);
      }

      // If local auth has a user but Convex doesn't, sign in with Convex
      if (user && !convexUser && !authToken) {
        // Sign in anonymously for now - you might want to use email instead
        signIn("anonymous").catch(console.error);
      }
    }
  }, [convexUser, user, login, signIn, authToken, isInitializing]);

  // Effect to handle local logout
  useEffect(() => {
    if (!user && authToken && !isInitializing) {
      // If local auth logged out but Convex is still logged in, sign out from Convex
      signOut().catch(console.error);
    }
  }, [user, authToken, signOut, isInitializing]);

  return <>{children}</>;
} 