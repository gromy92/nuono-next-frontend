import { expect, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { e2eEnv, optionalEnv } from '../utils/env';
import { LoginPage } from '../pages/LoginPage';
import { ShellPage } from '../pages/ShellPage';

function hasAdminCredentials() {
  const username = optionalEnv('E2E_ADMIN_USERNAME');
  const password = optionalEnv('E2E_ADMIN_PASSWORD');
  return Boolean(username && password && !username.startsWith('<') && !password.startsWith('<'));
}

test.describe('登录与退出', () => {
  test('未登录访问 /login 时展示登录表单', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(page.getByTestId('login-username-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeEnabled();
  });

  test('空账号或空密码不应成功登录', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await page.getByTestId('login-submit-button').click();
    await expect(page.getByTestId('auth-page-login')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('nuono-next-session'))).toBeNull();
  });

  test('错误密码登录失败时展示错误提示', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('E2E_WRONG_USER', 'E2E_WRONG_PASSWORD');
    await login.expectError(/错误|失败|不存在|密码|账号|登录/i);
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('nuono-next-session'))).toBeNull();
  });

  test('管理员账号可以登录并进入业务壳', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Fill E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD in .env.e2e first.');
    const login = new LoginPage(page);
    await login.goto();
    await login.login(optionalEnv('E2E_ADMIN_USERNAME'), optionalEnv('E2E_ADMIN_PASSWORD'));
    await new ShellPage(page).expectLoaded();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('nuono-next-session'))).not.toBeNull();
    if (e2eEnv.expectedLandingPath) {
      await expect(page).toHaveURL(new RegExp(e2eEnv.expectedLandingPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('退出登录会清除本地会话并回到登录页', async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
    await new ShellPage(page).logout();
  });
});
