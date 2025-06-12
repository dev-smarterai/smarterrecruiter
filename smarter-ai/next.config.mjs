/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ['ui-avatars.com', 'images.unsplash.com'],
  },
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // Disable ESLint for all directories
  },
  // Disable strict mode
  reactStrictMode: false,
  experimental: {
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
  },
  // Add PostHog rewrites
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Disable all Webpack checks
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Add fallbacks for PDF.js dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false, // Ignore canvas dependency
      fs: false,
      path: false,
    };
    
    return config;
  },
  // Turn off production source maps
  productionBrowserSourceMaps: false,
  // Use standard output configuration for Vercel compatibility
  outputFileTracing: true,
  output: "standalone"
};

export default nextConfig;
