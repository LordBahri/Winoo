/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.petid.app' },
      { protocol: 'http', hostname: 'minio' },
    ],
  },
};

module.exports = nextConfig;
