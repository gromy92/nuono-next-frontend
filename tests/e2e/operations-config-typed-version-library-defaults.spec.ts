import { expect, test } from '@playwright/test';
import {
  expectRemovedCalendarItemOptionsHidden,
  setupOperationsConfigScope
} from './operations-config-typed-version-library.setup';

test.beforeEach(async ({ page }) => setupOperationsConfigScope(page));

test('default version details open from row detail actions', async ({ page }) => {
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
      ]
    });
  });
  await page.route('**/api/operations-config/versions/DEFAULT_CALENDAR_CONFIG', async (route) => {
    await route.fulfill({
      json: {
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
        actions: [{ action: 'COPY', label: '复制版本', enabled: true, disabledReason: null }],
        items: [
          {
            groupName: '业务日历',
            itemName: '斋月 (Ramadan)',
            cadence: '提前一年',
            valueType: '日期范围',
            defaultValue: null,
            resultShape: null,
            note: null
          },
          {
            groupName: '历史数据推算',
            itemName: '月度薪酬爆发系数',
            cadence: '每月5日',
            valueType: null,
            defaultValue: null,
            resultShape: '类目/系数/日期',
            note: null
          }
        ]
      }
    });
  });
  await page.route('**/api/operations-config/versions/DEFAULT_LIFECYCLE_CONFIG', async (route) => {
    await route.fulfill({
      json: {
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
        actions: [{ action: 'COPY', label: '复制版本', enabled: true, disabledReason: null }],
        items: [
          {
            groupName: '稳定期',
            itemName: '稳定期波动率范围',
            cadence: '随时',
            valueType: '数组',
            defaultValue: '[0.3, 0.5]',
            resultShape: null,
            note: null
          }
        ]
      }
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');

  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('斋月 (Ramadan)');
  await page.getByTestId('operation-config-version-action-detail-DEFAULT_CALENDAR_CONFIG').click();
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('默认日历配置');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('系统默认');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('斋月 (Ramadan)');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('月度薪酬爆发系数');
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByTestId('operation-config-version-action-detail-DEFAULT_LIFECYCLE_CONFIG').click();
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('默认生命周期配置');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('稳定期波动率范围');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('[0.3, 0.5]');
});

test('admin can edit a system default calendar version from version library', async ({ page }) => {
  const row = {
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
  };
  let detailItems = [
    {
      groupName: '业务日历',
      itemName: '斋月 (Ramadan)',
      cadence: '提前一年',
      valueType: '日期范围',
      defaultValue: null,
      resultShape: null,
      note: null
    }
  ];
  let savePayload: unknown;
  let dimensionOptionsRequestUrl = '';

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: [row] });
  });
  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: true,
        roleName: '系统管理员',
        bossOptions: [{ ownerUserId: 307, displayName: 'xingyao', accountNo: 'xingyao' }],
        selectedBossUserIds: [],
        stores: [],
        defaultOwnerUserId: null,
        defaultStoreCode: null,
        defaultSiteCode: null,
        emptyReason: 'SELECT_BOSS'
      }
    });
  });
  await page.route('**/api/operations-config/product-dimensions/options?**', async (route) => {
    dimensionOptionsRequestUrl = route.request().url();
    await route.fulfill({
      json: {
        ready: true,
        source: 'product_management',
        brands: [{ value: 'Acme', label: 'Acme', usageCount: 3 }],
        productFulltypes: [{ value: 'home-bedding-duvet', label: 'home-bedding-duvet', usageCount: 2 }],
        categories: [{ value: 'stationery-labels_imported-office-labels-long-category', label: 'stationery-labels_imported-office-labels-long-category', usageCount: 2 }]
      }
    });
  });
  await page.route('**/api/operations-config/versions/DEFAULT_CALENDAR_CONFIG', async (route) => {
    if (route.request().method() === 'PUT') {
      savePayload = route.request().postDataJSON();
      detailItems = (savePayload as { items: typeof detailItems }).items;
      await route.fulfill({
        json: {
          ...row,
          summary: '1 条日历配置',
          itemCount: 1,
          updatedBy: 1,
          updatedAt: '2026-05-25T10:30:00',
          items: detailItems
        }
      });
      return;
    }
    await route.fulfill({
      json: {
        ...row,
        items: detailItems
      }
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');
  await page.getByTestId('operation-config-version-action-edit-DEFAULT_CALENDAR_CONFIG').click();

  await expect(page.getByTestId('operation-config-calendar-editor')).not.toContainText('日历版本编辑');
  await expect(page.getByTestId('operation-config-calendar-editor')).toContainText('系统默认');
  await expect(page.getByTestId('operation-config-calendar-display-name')).toHaveValue('默认日历配置');
  await expect(page.getByTestId('operation-config-calendar-summary')).toHaveValue('13 条默认配置');
  await expect(page.getByTestId('operation-config-calendar-add')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-item-group-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-calendar-item-cadence-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-calendar-item-date-range-0')).toBeVisible();
  await page.getByTestId('operation-config-calendar-item-name-0').fill('开斋节 (Eid al-Fitr)');
  await expectRemovedCalendarItemOptionsHidden(page);
  await expect.poll(() => dimensionOptionsRequestUrl).toContain('ownerUserId=307');
  await expect.poll(() => dimensionOptionsRequestUrl).toContain('storeCode=*');
  await page.getByTestId('operation-config-calendar-item-scope-type-0').locator('.ant-select-selector').click();
  await page.locator('.ant-select-item-option').filter({ hasText: '品牌' }).click();
  await page.getByTestId('operation-config-calendar-item-scope-value-0').click();
  await expect(page.getByTestId('operation-config-calendar-scope-picker-modal')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-scope-picker-modal')).toContainText('Acme');
  await page.getByTestId('operation-config-calendar-scope-picker-option-Acme').click();
  await expect(page.getByTestId('operation-config-calendar-item-scope-value-0')).toContainText('Acme');
  await page.getByTestId('operation-config-calendar-item-scope-type-0').locator('.ant-select-selector').click();
  await page.locator('.ant-select-item-option').filter({ hasText: '类目' }).click();
  await page.getByTestId('operation-config-calendar-item-scope-value-0').click();
  await expect(page.getByTestId('operation-config-calendar-scope-picker-modal')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-scope-picker-modal')).toContainText('stationery-labels_imported-office-labels-long-category');
  await page.getByTestId('operation-config-calendar-scope-picker-search').fill('imported-office');
  await page.getByTestId('operation-config-calendar-scope-picker-option-stationery-labels_imported-office-labels-long-category').click();
  await page.getByTestId('operation-config-calendar-save').click();

  await expect.poll(() => (savePayload as { configType?: string } | undefined)?.configType).toBe('BUSINESS_CALENDAR');
  await expect
    .poll(() => (savePayload as { items?: Array<{ itemName?: string; groupName?: string | null; cadence?: string | null; resultShape?: string | null }> } | undefined)?.items?.[0])
    .toMatchObject({
      itemName: '开斋节 (Eid al-Fitr)',
      groupName: '业务日历',
      cadence: null,
      resultShape: 'category:stationery-labels_imported-office-labels-long-category'
    });
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('1 条日历配置');
});
