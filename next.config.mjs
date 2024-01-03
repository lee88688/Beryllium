/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  // void reader effect triggered twice
  reactStrictMode: false,

  output: "standalone",

  transpilePackages: ["ahooks"],

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    instrumentationHook: true,
  },

  // eslint-disable-next-line @typescript-eslint/require-await
  async redirects() {
    return [
      {
        source: "/",
        destination: "/bookshelf",
        permanent: true,
      },
    ];
  },
};

export default config;
