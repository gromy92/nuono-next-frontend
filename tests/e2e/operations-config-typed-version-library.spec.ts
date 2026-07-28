import { expect, test } from '@playwright/test';
import { setupOperationsConfigScope } from './operations-config-typed-version-library.setup';

test.beforeEach(async ({ page }) => setupOperationsConfigScope(page));

test('typed version library renders default calendar and lifecycle rows without default cards', async ({ page }) => {
  let typedListRequested = false;
  let legacyDefaultCardsRequested = false;

  await page.route('**/api/operations-config/versions', async (route) => {
    typedListRequested = true;
    await route.fulfill({
      json: [
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
            { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
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
            { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
            { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
            { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
            { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' }
          ]
        }
      ]
    });
  });
  await page.route('**/api/operations-config/bundles/default-versions', async (route) => {
    legacyDefaultCardsRequested = true;
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/operations-config/bundles/versions', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: true,
        roleName: '系统管理员',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [],
        emptyReason: null
      }
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');

  await expect.poll(() => typedListRequested).toBe(true);
  await expect.poll(() => legacyDefaultCardsRequested).toBe(false);
  await expect(page.getByTestId('operation-config-version-library-title')).toContainText('运营配置版本');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认日历配置');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('日历版本');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认生命周期配置');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('生命周期版本');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('DEFAULT_CALENDAR_CONFIG');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('查看详情');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('复制版本');
  await expect(page.getByText('版本只能对应日历配置或生命周期配置')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-version-action-edit-DEFAULT_CALENDAR_CONFIG')).toBeEnabled();
  await expect(page.getByTestId('operation-config-default-version-section')).toHaveCount(0);
});

test('business calendar and lifecycle entries own their filtered version lists', async ({ page }) => {
  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({
      json: [
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
            { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
            { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
            { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
            { action: 'PUBLISH', label: '发布', enabled: false, disabledReason: '系统默认版本不可发布' },
            { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '系统默认版本不可停用' }
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
            { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
            { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
            { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
            { action: 'PUBLISH', label: '发布', enabled: false, disabledReason: '系统默认版本不可发布' },
            { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '系统默认版本不可停用' }
          ]
        }
      ]
    });
  });

  await page.goto('/operations/config/business-calendar?devSession=1&devRole=admin&grantOperationsConfig=1');
  await expect(page.getByTestId('operation-config-version-library-title')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认日历配置');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('默认生命周期配置');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('来源');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('系统默认系统默认');
  await expect(page.getByTestId('operation-config-version-action-audit-DEFAULT_CALENDAR_CONFIG')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('审计');

  await page.goto('/operations/config/lifecycle-rules?devSession=1&devRole=admin&grantOperationsConfig=1');
  await expect(page.getByTestId('operation-config-version-library-title')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认生命周期配置');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('默认日历配置');
  await expect(page.getByTestId('operation-config-version-action-audit-DEFAULT_LIFECYCLE_CONFIG')).toHaveCount(0);
});

test('typed version library table fills the available content width', async ({ page }) => {
  await page.setViewportSize({ width: 1728, height: 1224 });
  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({
      json: [
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
            { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
            { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
            { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
            { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' },
            { action: 'PUBLISH', label: '发布', enabled: false, disabledReason: '系统默认版本不可发布' },
            { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '系统默认版本不可停用' }
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
            { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
            { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
            { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
            { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' },
            { action: 'PUBLISH', label: '发布', enabled: false, disabledReason: '系统默认版本不可发布' },
            { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '系统默认版本不可停用' }
          ]
        }
      ]
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认日历配置');

  const layoutMetrics = await page.evaluate(() => {
    const pageElement = document.querySelector('.operations-config-version-library-page');
    const tableElement = document.querySelector('[data-testid="operation-config-version-library-table"]');
    if (!pageElement || !tableElement) {
      return null;
    }
    const pageRect = pageElement.getBoundingClientRect();
    const tableRect = tableElement.getBoundingClientRect();
    return {
      pageWidth: pageRect.width,
      tableWidth: tableRect.width,
      rightGap: Math.abs(pageRect.right - tableRect.right)
    };
  });

  expect(layoutMetrics).not.toBeNull();
  expect(layoutMetrics!.tableWidth).toBeGreaterThanOrEqual(layoutMetrics!.pageWidth - 4);
  expect(layoutMetrics!.rightGap).toBeLessThanOrEqual(4);
});
