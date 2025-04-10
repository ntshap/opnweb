/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend-project-pemuda.onrender.com',
        pathname: '/**',
      },
    ],
    // Enable unoptimized images for Netlify deployment
    unoptimized: process.env.NETLIFY === 'true',
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
  // Output standalone build for better Netlify compatibility
  output: 'standalone',
};

module.exports = nextConfig;
