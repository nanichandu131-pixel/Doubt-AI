import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['localhost', '192.168.1.3', '192.168.11.183', '192.168.62.117', '*.run.app'],
};

export default nextConfig;
