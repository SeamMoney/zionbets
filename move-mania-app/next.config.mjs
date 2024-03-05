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

export default nextConfig;
