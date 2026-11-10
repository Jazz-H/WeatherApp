const withPWAInit = require("@ducanh2912/next-pwa").default;

const withPWA = withPWAInit({
  dest: "public",
  // Only run the service worker in production builds.
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    // The plugin's defaults, plus Next.js 16's dynamic-css-manifest.json: it's
    // a build file the server never serves, so precaching it 404s and the
    // service worker fails to install.
    exclude: [
      /\/_next\/static\/.*(?<!\.p)\.woff2/,
      /\.map$/,
      /^manifest.*\.js$/,
      /dynamic-css-manifest\.json$/,
    ],
  },
  // Default runtime caching includes a NetworkFirst rule for all cross-origin
  // GETs, so the last Open-Meteo forecast is served when offline.
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
