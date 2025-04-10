/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable experimental features that might cause issues
    webpackBuildWorker: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend-project-pemuda.onrender.com',
        pathname: '/**',
      },
    ],
    // Always use unoptimized images for Netlify
    unoptimized: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Use static export for Netlify
  output: 'export',
  // Disable trailing slash
  trailingSlash: false,
};

module.exports = nextConfig;
