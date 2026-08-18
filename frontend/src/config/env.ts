/**
 * Single place that touches `import.meta.env` (Vite-only syntax). Jest
 * cannot parse `import.meta`, so tests import `./env.jest.ts` instead via
 * a moduleNameMapper entry in jest.config.js — every other module should
 * import from here (or from `@/config/env`) and never read
 * `import.meta.env` directly.
 */
export const ENV = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  wompiSandboxUrl:
    import.meta.env.VITE_WOMPI_SANDBOX_URL ?? 'https://api-sandbox.co.uat.wompi.dev/v1',
  wompiPublicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY ?? '',
};
