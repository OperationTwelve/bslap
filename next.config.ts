import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['bslapnft.app'], // Add your domain here
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
