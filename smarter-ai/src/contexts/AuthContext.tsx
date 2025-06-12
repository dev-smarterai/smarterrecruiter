"use client";

import { deleteCookie, setCookie } from "@/utils/cookies";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

type UserRole = "admin" | "user";

interface User {
    email: string;
    name: string;
    role: UserRole;
    completedOnboarding?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check if user is already logged in on mount
    useEffect(() => {
        // Client-side only code
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    // Ensure cookie is also set
                    setCookie('user', storedUser);
                } catch (e) {
                    console.error("Failed to parse stored user data:", e);
                    localStorage.removeItem("user");
                }
            }
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        let userData: User | null = null;

        if (email === "admin@example.com") {
            userData = {
                email: "admin@example.com",
                name: "Jawad",
                role: "admin",
                completedOnboarding: false
            };

            // Redirect admin to home page if onboarding is completed, otherwise to onboarding
            if (userData.completedOnboarding) {
                router.push("/home");
            } else {
                router.push("/onboarding/products");
            }
        } else if (email === "user@example.com") {
            userData = {
                email: "user@example.com",
                name: "John Doe",
                role: "user",
                completedOnboarding: true
            };

            // Redirect regular user directly to application form
            router.push("/application-form");
        } else {
            // For demo purposes, let's treat any other email as a regular user
            userData = {
                email: email,
                name: "Guest User",
                role: "user",
                completedOnboarding: true
            };

            router.push("/application-form");
        }

        setUser(userData);

        // Store in both localStorage and cookies
        const userDataStr = JSON.stringify(userData);
        localStorage.setItem("user", userDataStr);
        setCookie('user', userDataStr);

        setLoading(false);
    };

    const completeOnboarding = () => {
        if (user) {
            const updatedUser = {
                ...user,
                completedOnboarding: true
            };
            setUser(updatedUser);

            // Update in localStorage and cookies
            const userDataStr = JSON.stringify(updatedUser);
            localStorage.setItem("user", userDataStr);
            setCookie('user', userDataStr);

            // Redirect to home page after completing onboarding (for admin users)
            router.push("/home");
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        deleteCookie('user');
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
            completeOnboarding
        }}>
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