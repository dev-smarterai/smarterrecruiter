/** @type {import('next').NextConfig} */

const nextConfig = {
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: true,
      },
    ];
  },
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
  },
  // Disable strict mode
  reactStrictMode: false,
  // Configure output for deployment
  output: "standalone",
  // Set swcMinify to true for smaller builds
  swcMinify: true,
  // Disable source maps in production
  productionBrowserSourceMaps: false
};

export default nextConfig; 