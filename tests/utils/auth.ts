import { expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ShellPage } from '../pages/ShellPage';
import { e2eEnv, requiredEnv } from './env';

export async function loginByAdminUi(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(requiredEnv('E2E_ADMIN_USERNAME'), requiredEnv('E2E_ADMIN_PASSWORD'));
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('nuono-next-session'))).not.toBeNull();
}

export async function loginByUserUi(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(requiredEnv('E2E_USER_USERNAME'), requiredEnv('E2E_USER_PASSWORD'));
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('nuono-next-session'))).not.toBeNull();
}

export async function loginByDevSession(page: Page) {
  if (!e2eEnv.useDevSession) {
    throw new Error('E2E_USE_DEV_SESSION=false. Use loginByAdminUi instead.');
  }
  await page.goto('/?devSession=1&grantSystemRole=1');
  await new ShellPage(page).expectLoaded();
}

export async function ensureLoggedInAsAdmin(page: Page) {
  if (e2eEnv.useDevSession) {
    await loginByDevSession(page);
    return;
  }
  await loginByAdminUi(page);
}
