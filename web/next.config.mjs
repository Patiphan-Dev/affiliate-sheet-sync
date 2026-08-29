/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // no eslint config in the project — don't let that block `next build`
  eslint: { ignoreDuringBuilds: true },
  images: {
    // product images are served from the platform CDNs
    remotePatterns: [
      { protocol: 'https', hostname: '**.shopee.co.th' },
      { protocol: 'https', hostname: '**.susercontent.com' },
      { protocol: 'https', hostname: '**.slatic.net' },
      { protocol: 'https', hostname: '**.lazcdn.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
