import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bslapnft.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // Ignore fs module in the frontend
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
