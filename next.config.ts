import type {NextConfig} from 'next';
import {config} from 'dotenv';

config();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: false
  },
  experimental: {
    allowedDevOrigins: [
        "https://*.google.com",
        "https://*.cloud.google.com",
        "https://*.corp.google.com",
        "https://*.cloud.goog",
        "https://*.corp.goog",
        "https://*.googleprod.com",
        "https://*.prod.google.com",
    ]
  }
};

export default nextConfig;
