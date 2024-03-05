/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ]
  },
  env: {
    API_URL: process.env.API_URL,
  },
};

import withPWA from "next-pwa";

// Configuration object tells the next-pwa plugin 
const nextPWAConfig = {
  dest: "public", // Destination directory for the PWA files
  // disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
  register: true, // Register the PWA service worker
  skipWaiting: true, // Skip waiting for service worker activation
};

const withPWAConfig = withPWA(nextPWAConfig);

export default withPWAConfig;
