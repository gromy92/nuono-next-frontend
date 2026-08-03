import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('boss sees historical order page no-auth empty state from real API', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: noAuthorizationWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '1688 历史订单' })).toBeVisible();
  await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: '1688 历史订单' })).not.toBeVisible();
  await expect(page.getByRole('alert').getByText('老板授权后系统会每日自动拉取 1688 历史订单')).toBeVisible();
  await expect(page.getByRole('button', { name: '授权 1688' })).toBeVisible();
  await expect(page.getByText('暂无 1688 历史订单')).toBeVisible();
  await expect(page.getByText('PO-DEMO')).not.toBeVisible();
});
test('boss dev session is forwarded to historical order API requests', async ({ page }) => {
  let requestHeaders: Record<string, string> | undefined;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    requestHeaders = route.request().headers();
    await route.fulfill({ json: noAuthorizationWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();

  expect(requestHeaders?.['x-nuono-dev-session-user-id']).toBe('307');
  expect(requestHeaders?.['x-nuono-dev-session-role-id']).toBe('2');
  expect(requestHeaders?.['x-nuono-dev-session-level']).toBe('1');
});

test('non-boss local acceptance roles can open historical order page with real dev users', async ({ page }) => {
  const roles = [
    { role: 'ops-manager', userId: '90005', roleId: '3', level: '2' },
    { role: 'operator', userId: '90003', roleId: '4', level: '3' },
    { role: 'procurement', userId: '90001', roleId: '5', level: '3' },
    { role: 'warehouse', userId: '90004', roleId: '6', level: '3' }
  ];

  for (const role of roles) {
    let requestHeaders: Record<string, string> | undefined;
    await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
      requestHeaders = route.request().headers();
      await route.fulfill({
        json: {
          ...syncedWorkbench,
          roleCapabilities: {
            canAuthorize: false,
            canViewOrders: true
          }
        }
      });
    });

    await page.goto(`/purchase/ali1688-orders?devSession=1&devRole=${role.role}&grantAli1688HistoricalOrders=1`);
    await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();
    await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '授权 1688' })).not.toBeVisible();

    expect(requestHeaders?.['x-nuono-dev-session-user-id']).toBe(role.userId);
    expect(requestHeaders?.['x-nuono-dev-session-role-id']).toBe(role.roleId);
    expect(requestHeaders?.['x-nuono-dev-session-level']).toBe(role.level);

    await page.unroute('**/api/procurement/ali1688-orders/workbench');
  }
});
