/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Changed to false to catch build errors
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    domains: [
      'localhost',
      'mgstrades.com',
      'www.mgstrades.com',
      'supabase.co',
      'images.unsplash.com',
      'via.placeholder.com',
    ],
  },
  // Force production build settings
  output: 'standalone',
  // Disable trailing slash handling to prevent deployment issues
  trailingSlash: false,
  // Ensure consistent builds
  experimental: {
    swcMinification: true,
  },
}

export default nextConfig
