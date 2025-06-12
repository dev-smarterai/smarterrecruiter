"use client";

import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookies";
import { useRouter } from "next/navigation";

type User = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: 'admin' | 'user';
  completedOnboarding: boolean;
  sessionToken?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  register: (name: string, email: string, password: string) => Promise<{
    success: boolean;
    message: string;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  const router = useRouter();

  const currentUser = useQuery(
    api.users.getCurrentUser, 
    sessionToken ? { sessionToken } : "skip",
  );
  
  const login = useMutation(api.users.login);
  const logout = useMutation(api.users.logout);
  const registerUser = useMutation(api.users.registerUser);

  useEffect(() => {
    let isMounted = true;
    
    const token = getCookie('session');
    if (token && isMounted) {
      setSessionToken(token);
    } else if (isMounted) {
      setIsLoading(false);
    }
    
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (currentUser !== undefined && isMounted) {
      if (currentUser) {
        const userData = {
          ...currentUser,
          role: currentUser.role as 'admin' | 'user',
          sessionToken
        };
        setUser(userData);
        
        const cookieData = {
          email: userData.email,
          role: userData.role,
          completedOnboarding: userData.completedOnboarding
        };
        setCookie('user', JSON.stringify(cookieData));
      } else {
        setUser(null);
        deleteCookie('user');
      }
      setIsLoading(false);
    }
    
    return () => { isMounted = false; };
  }, [currentUser, sessionToken]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const loginResult = await login({ email, password });
      
      let success = false;
      let serverSessionToken = undefined;
      
      if (typeof loginResult === 'boolean') {
        success = loginResult;
      } else {
        success = loginResult.success;
        serverSessionToken = loginResult.sessionToken;
      }
      
      if (success) {
        const newToken = serverSessionToken || 
          `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        console.log("Setting cookie with session token:", newToken);
        setCookie('session', newToken);
        setSessionToken(newToken);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await registerUser({
        name,
        email,
        password,
        role: "user",
      });
      
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        message: "Registration failed. Please try again."
      };
    }
  };

  const signOut = async () => {
    try {
      await logout({ sessionToken });
      
      deleteCookie('session');
      deleteCookie('user');
      
      setSessionToken(undefined);
      setUser(null);
      
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        signIn, 
        signOut,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 