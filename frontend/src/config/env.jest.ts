/**
 * Jest substitute for env.ts (see the comment there). Mapped in
 * jest.config.js so test code never has to parse `import.meta`.
 */
export const ENV = {
  apiBaseUrl: 'http://localhost:3000',
  wompiSandboxUrl: 'https://api-sandbox.co.uat.wompi.dev/v1',
  wompiPublicKey: 'pub_test_key',
};
