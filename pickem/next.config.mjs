/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Team logos use plain <img>; don't let lint warnings fail the Vercel build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
