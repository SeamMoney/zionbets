import withPWA from "next-pwa";

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


// Configuration object tells the next-pwa plugin 
/** @type {import('next-pwa').NextPWAConfig} */
const nextPWAConfig = {
  dest: "public", // Destination directory for the PWA files
  // disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
  register: true, // Register the PWA service worker
  skipWaiting: true, // Skip waiting for service worker activation,
  env: {
    API_URL: process.env.API_URL,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ]
  },
};

const withPWAConfig = withPWA(nextPWAConfig);

export default withPWAConfig;
