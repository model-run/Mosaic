/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  assetPrefix: './',
  basePath: '',
  // Ensure static assets are properly handled
  experimental: {
    optimizePackageImports: ['@/components', '@/lib']
  }
}

module.exports = nextConfig
