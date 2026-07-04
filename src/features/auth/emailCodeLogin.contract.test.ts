import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const controllerSource = readFileSync('src/features/app-shell/useShellAccountController.tsx', 'utf8');
const loginPageSource = readFileSync('src/features/auth/ReplicaLoginPage.tsx', 'utf8');
const runtimePathsSource = readFileSync('src/runtimePaths.ts', 'utf8');

assert.match(controllerSource, /fetch\('\/api\/auth\/email-code\/login'/);
assert.match(controllerSource, /email:\s*values\.email/);
assert.match(controllerSource, /code:\s*values\.code/);
assert.doesNotMatch(controllerSource, /\/api\/auth\/login/);
assert.doesNotMatch(controllerSource, /password:\s*values\.password/);
assert.doesNotMatch(controllerSource, /change-password-button/);

assert.match(loginPageSource, /data-testid="login-email-input"/);
assert.match(loginPageSource, /data-testid="login-code-input"/);
assert.match(loginPageSource, /data-testid="login-code-request-button"/);
assert.doesNotMatch(loginPageSource, /data-testid="login-password-input"/);

assert.match(runtimePathsSource, /appPath !== '\/api\/auth\/email-code\/request'/);
assert.match(runtimePathsSource, /appPath !== '\/api\/auth\/email-code\/login'/);
