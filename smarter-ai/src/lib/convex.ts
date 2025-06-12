'use client'
import { ConvexReactClient } from "convex/react";

// Create a Convex client using the Convex URL from environment variables
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
); 