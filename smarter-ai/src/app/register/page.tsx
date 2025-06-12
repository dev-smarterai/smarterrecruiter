"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { Logo } from "@/components/ui/Logo"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Register() {
  const { signIn, user, isLoading, isAuthenticated, register } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // If already authenticated, redirect based on user role
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      if (user.role === "admin") {
        if (!user.completedOnboarding) {
          router.push("/onboarding/products");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/application-form");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Register the user with lowercase email
      const result = await register(name, email.toLowerCase(), password);

      if (result.success) {
        // If registration successful, automatically sign them in with lowercase email
        const loginSuccess = await signIn(email.toLowerCase(), password);
        if (!loginSuccess) {
          setError("Registration successful but login failed. Please try logging in.");
          router.push("/login");
        }
        // Auth state will be updated and useEffect will handle redirect
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setError("Registration failed. Please try again.");
    } finally {
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Already have an account?{" "}
            <a
              className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:dark:text-indigo-300"
              href="/login"
            >
              Log in
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
                <Label htmlFor="name-form-item" className="font-medium">
                  Full Name
                </Label>
                <Input
                  type="text"
                  autoComplete="name"
                  name="name"
                  id="name-form-item"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                  autoComplete="new-password"
                  name="password"
                  id="password-form-item"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="confirm-password-form-item" className="font-medium">
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  name="confirmPassword"
                  id="confirm-password-form-item"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading || isLoading ? "" : "Create Account"}
            </Button>
          </form>
        </div>
        <Divider />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          By creating an account, you agree to our{" "}
          <a
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:dark:text-indigo-300"
            href="#"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:dark:text-indigo-300"
            href="#"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
} 