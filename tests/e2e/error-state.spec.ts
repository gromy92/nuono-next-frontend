import { expect, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';

test.describe('异常状态', () => {
  test('账号列表接口失败时页面不应白屏', async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
    await page.route('**/api/master-data/users**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'E2E mocked failure' })
      });
    });
    await page.goto('/user/manage');
    await expect(page.locator('body')).not.toContainText(/undefined is not|Cannot read|白屏/i);
    await expect(page.getByTestId('master-data-board-user-account').or(page.getByRole('alert')).first()).toBeVisible();
  });

  test('角色列表接口超时时页面不应白屏', async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
    await page.route('**/api/master-data/roles**', async (route) => {
      await route.abort('timedout');
    });
    await page.goto('/system/role');
    await expect(page.locator('body')).not.toContainText(/undefined is not|Cannot read|白屏/i);
  });
});
