/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', //  allows ALL domains
      },
      {
        protocol: 'http',
        hostname: '**', // allows HTTP fallback if needed
      },
    ],
  },
};

export default nextConfig;