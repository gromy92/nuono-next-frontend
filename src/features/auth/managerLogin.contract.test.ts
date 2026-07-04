import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const controllerSource = readFileSync('src/features/app-shell/useShellAccountController.tsx', 'utf8');
const loginPageSource = readFileSync('src/features/auth/ReplicaLoginPage.tsx', 'utf8');
const shellFrameSource = readFileSync('src/features/app-shell/ShellFrame.tsx', 'utf8');
const appRuntimeSource = readFileSync('src/features/app-shell/AppShellRuntime.tsx', 'utf8');
const runtimePathsSource = readFileSync('src/runtimePaths.ts', 'utf8');

assert.match(controllerSource, /fetch\('\/api\/auth\/login'/);
assert.match(controllerSource, /accountNo:\s*values\.accountNo/);
assert.match(controllerSource, /password:\s*values\.password/);
assert.doesNotMatch(controllerSource, /\/api\/auth\/email-code\/login/);
assert.doesNotMatch(controllerSource, /\/api\/auth\/email-code\/request/);
assert.doesNotMatch(controllerSource, /requestLoginCode/);

assert.match(loginPageSource, /data-testid="login-username-input"/);
assert.match(loginPageSource, /data-testid="login-password-input"/);
assert.doesNotMatch(loginPageSource, /data-testid="login-email-input"/);
assert.doesNotMatch(loginPageSource, /data-testid="login-code-input"/);
assert.doesNotMatch(loginPageSource, /data-testid="login-code-request-button"/);

assert.doesNotMatch(shellFrameSource, /loginCodeCooldownSeconds/);
assert.doesNotMatch(shellFrameSource, /requestLoginCode/);
assert.doesNotMatch(appRuntimeSource, /loginCodeCooldownSeconds/);
assert.doesNotMatch(appRuntimeSource, /requestLoginCode/);

assert.match(runtimePathsSource, /appPath !== '\/api\/auth\/login'/);
assert.match(runtimePathsSource, /appPath !== '\/api\/auth\/logout'/);
assert.doesNotMatch(runtimePathsSource, /\/api\/auth\/email-code\/request/);
assert.doesNotMatch(runtimePathsSource, /\/api\/auth\/email-code\/login/);
