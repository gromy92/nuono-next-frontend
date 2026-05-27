import { expect, test } from '@playwright/test';

const typedRows = [
  {
    versionNo: 'DEFAULT_CALENDAR_CONFIG',
    displayName: '默认日历配置',
    configType: 'BUSINESS_CALENDAR',
    configTypeLabel: '日历版本',
    status: 'SYSTEM_DEFAULT',
    statusLabel: '系统默认',
    sourceLabel: '系统默认',
    summary: '13 条默认配置',
    itemCount: 13,
    scopeSummary: '全局默认',
    updatedBy: null,
    updatedAt: '2026-05-25T00:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '系统默认版本不可编辑' },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' }
    ]
  },
  {
    versionNo: 'DEFAULT_LIFECYCLE_CONFIG',
    displayName: '默认生命周期配置',
    configType: 'PRODUCT_LIFECYCLE',
    configTypeLabel: '生命周期版本',
    status: 'SYSTEM_DEFAULT',
    statusLabel: '系统默认',
    sourceLabel: '系统默认',
    summary: '14 条 DEFAULT_V1 配置',
    itemCount: 14,
    scopeSummary: '全局默认',
    updatedBy: null,
    updatedAt: '2026-05-25T00:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '系统默认版本不可编辑' },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' }
    ]
  }
];

test('version route is typed library even when legacy suite data exists', async ({ page }) => {
  let typedRequested = false;
  let legacyRequested = false;

  await page.route('**/api/operations-config/versions', async (route) => {
    typedRequested = true;
    await route.fulfill({ json: typedRows });
  });
  await page.route('**/api/operations-config/bundles/**', async (route) => {
    legacyRequested = true;
    await route.fulfill({
      json: [
        {
          id: 86000,
          publishRecordId: 80000,
          versionNo: 'OPS_CONFIG_86000',
          displayName: '2026 Ramadan suite',
          status: 'PUBLISHED',
          publishSourceRole: 'boss',
          publishSourceLabel: '老板发布',
          scopeSummary: '已选择 2 个店铺',
          affectedStoreCount: 2,
          activityRuleCount: 5,
          lifecycleRuleSummary: 'DEFAULT_V1'
        }
      ]
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=boss&grantOperationsConfig=1');

  await expect.poll(() => typedRequested).toBe(true);
  await expect.poll(() => legacyRequested).toBe(false);
  await expect(page.getByTestId('operation-config-version-library-title')).toContainText('运营配置版本');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('DEFAULT_CALENDAR_CONFIG');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('DEFAULT_LIFECYCLE_CONFIG');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('OPS_CONFIG_86000');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('2026 Ramadan suite');
});

test('legacy suite controls and default-card entry are absent from version route', async ({ page }) => {
  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: typedRows });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');

  await expect(page.getByTestId('operation-config-version-library-table')).toBeVisible();
  await expect(page.getByTestId('operation-config-suite-version-table')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-suite-create-draft')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-default-version-card')).toHaveCount(0);
});
