/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    // Strip console.* from the client bundle in production (keeps error/warn
    // server-side for ops visibility, hides debug chatter from the browser).
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
