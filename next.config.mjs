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
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'mgstrades.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mgstrades.com',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  // Force production build settings
  output: 'standalone',
  // Disable trailing slash handling to prevent deployment issues
  trailingSlash: false,
  // Ensure consistent builds
}

export default nextConfig
