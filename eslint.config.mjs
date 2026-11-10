import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  // Next's recommended + core-web-vitals rules (replaces .eslintrc.json now
  // that `next lint` is gone in Next.js 16).
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "out/**",
      "coverage/**",
      "node_modules/**",
      "public/sw.js",
      "public/workbox-*.js",
      "public/swe-worker-*.js",
      "next-env.d.ts",
    ],
  },
];

export default config;
