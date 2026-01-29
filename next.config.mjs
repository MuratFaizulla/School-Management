/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost',
        '10.35.14.29',
        '10.35.14.29:3000',
        '10.35.14.29:80',
        '10.35.14.29:443',
      ],
    }
  },
};

export default nextConfig;
