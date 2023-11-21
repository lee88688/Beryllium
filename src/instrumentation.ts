export async function register() {
  // https://github.com/vercel/next.js/issues/49565
  // https://nextjs.org/docs/pages/building-your-application/optimizing/instrumentation
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./firstStartup");
  }
}
