import { expect, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { ShellPage } from '../pages/ShellPage';

test.describe('路由与权限控制', () => {
  test('未登录访问业务页会回到登录页', async ({ page }) => {
    await page.goto('/user/manage');
    await expect(page.getByTestId('auth-page-login')).toBeVisible();
  });

  test('管理员登录后可以看到系统壳和左侧菜单', async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
    await new ShellPage(page).expectLoaded();
  });

  test('直接访问无效路径时不应白屏', async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
    await page.goto('/not-exist-e2e-path');
    await expect(page.getByTestId('sidebar-menu')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Cannot GET|白屏|undefined is not/i);
  });
});
