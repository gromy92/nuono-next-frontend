export function optionalEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith('<')) {
    throw new Error(`Missing required env: ${name}. Please fill .env.e2e first.`);
  }
  return value;
}

export function flagEnv(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
}

export const e2eEnv = {
  baseURL: optionalEnv('E2E_BASE_URL', 'http://127.0.0.1:9620'),
  apiBaseURL: optionalEnv('E2E_API_BASE_URL', 'http://127.0.0.1:18080'),
  expectedLandingPath: optionalEnv('E2E_EXPECTED_LANDING_PATH'),
  useDevSession: flagEnv('E2E_USE_DEV_SESSION', true),
  allowWriteTests: flagEnv('E2E_ALLOW_WRITE_TESTS', false),
  allowDirtyWriteTests: flagEnv('E2E_ALLOW_DIRTY_WRITE_TESTS', false),
  dataPrefix: optionalEnv('E2E_DATA_PREFIX', 'E2E_')
};
