/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Removed basePath to allow all routes (dashboard, use-cases, etc.)
  // Static export - API calls will go to same domain
};

module.exports = nextConfig;
