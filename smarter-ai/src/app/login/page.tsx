"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { Logo } from "@/components/ui/Logo"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { setCookie } from "@/utils/cookies";

export default function Login() {
  const { signIn, user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already authenticated, redirect based on user role
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log("Auth state detected, redirecting:", user);

      // Store user data in cookie for middleware
      const userData = {
        email: user.email,
        role: user.role,
        completedOnboarding: user.completedOnboarding
      };

      setCookie('user', JSON.stringify(userData));
      // The session cookie should already be set by the auth context

      if (user.role === "admin") {
        if (!user.completedOnboarding) {
          router.push("/onboarding/products");
        } else {
          router.push("/dashboard");
        }
      } else {
        // Regular users
        router.push("/application-form");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await signIn(email.toLowerCase(), password);
      if (!success) {
        setError("Invalid email or password");
        setLoading(false);
      }
      // Auth state will be updated and useEffect will handle redirect
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="flex w-full flex-col items-start sm:max-w-sm">
        <div className="relative flex items-center justify-center rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5 dark:bg-gray-900">
          <Logo
            className="size-8 text-indigo-500 dark:text-indigo-400"
            aria-label="Dashboard logo"
          />
        </div>
        <div className="mt-6 flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Log in to Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Don&rsquo;t have an account?{" "}
            <a
              className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:dark:text-indigo-300"
              href="/register"
            >
              Sign up
            </a>
          </p>
        </div>
        <div className="mt-10 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-y-6"
          >
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="email-form-item" className="font-medium">
                  Email
                </Label>
                <Input
                  type="email"
                  autoComplete="email"
                  name="email"
                  id="email-form-item"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="password-form-item" className="font-medium">
                  Password
                </Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  name="password"
                  id="password-form-item"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              isLoading={loading || isLoading}
            >
              {loading || isLoading ? "" : "Login"}
            </Button>
          </form>
        </div>
        <Divider />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Forgot your password?{" "}
          <a
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:dark:text-indigo-300"
            href="#"
          >
            Reset password
          </a>
        </p>
      </div>
    </div>
  )
}

