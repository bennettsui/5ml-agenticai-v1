/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  transpilePackages: ['pdfjs-dist'],
  webpack: (config) => {
    // pdfjs-dist v5 uses ES modules; tell webpack to handle .mjs files
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.js', '.mjs'],
    };
    return config;
  },
};

module.exports = nextConfig;
