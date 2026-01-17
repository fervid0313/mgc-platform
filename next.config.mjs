/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
}

export default nextConfig
