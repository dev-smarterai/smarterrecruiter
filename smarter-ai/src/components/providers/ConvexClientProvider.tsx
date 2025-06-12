"use client";

import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import { convex } from "@/lib/convex";
import { AuthProvider } from "@/lib/auth";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexProvider>
  );
} 