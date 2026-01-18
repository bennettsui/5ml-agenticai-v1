/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  basePath: '/dashboard',
  // Static export - API calls will go to same domain
};

module.exports = nextConfig;
