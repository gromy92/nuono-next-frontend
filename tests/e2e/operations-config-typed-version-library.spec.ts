import { expect, test, type Page } from '@playwright/test';

const REMOVED_CALENDAR_ITEM_OPTION_LABELS = ['节日爆发系数', '月度薪酬爆发系数', '流行产品衰退系数', '流行产品关键词', '季节产品'];

async function expectRemovedCalendarItemOptionsHidden(page: Page) {
  for (const label of REMOVED_CALENDAR_ITEM_OPTION_LABELS) {
    await expect(page.locator('.ant-select-dropdown').filter({ hasText: label })).toHaveCount(0);
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: false,
        roleName: '运营',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [{ ownerUserId: 307, storeCode: 'STR108065-NAE', siteCode: 'AE' }],
        defaultOwnerUserId: 307,
        defaultStoreCode: 'STR108065-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });
});

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
          summary: '25 条 DEFAULT_V1 配置',
          itemCount: 25,
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
          summary: '25 条 DEFAULT_V1 配置',
          itemCount: 25,
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
          summary: '25 条 DEFAULT_V1 配置',
          itemCount: 25,
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
          summary: '25 条 DEFAULT_V1 配置',
          itemCount: 25,
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
        summary: '25 条 DEFAULT_V1 配置',
        itemCount: 25,
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

test('copying a default version creates a same-type draft row', async ({ page }) => {
  const versions = [
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
    }
  ];
  let copyRequested = false;
  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: versions });
  });
  await page.route('**/api/operations-config/versions/DEFAULT_CALENDAR_CONFIG/copies', async (route) => {
    copyRequested = true;
    versions.unshift({
      versionNo: 'CALENDAR_CONFIG_88000',
      displayName: '默认日历配置 副本',
      configType: 'BUSINESS_CALENDAR',
      configTypeLabel: '日历版本',
      status: 'DRAFT',
      statusLabel: '草稿',
      sourceLabel: '系统管理员',
      summary: '13 条默认配置',
      itemCount: 13,
      scopeSummary: '未设置范围',
      updatedBy: 1,
      updatedAt: '2026-05-25T10:00:00',
      actions: [
        { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
        { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
        { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
        { action: 'DELETE', label: '删除', enabled: true, disabledReason: null }
      ]
    });
    await route.fulfill({ json: versions[0] });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');
  await page.getByTestId('operation-config-version-action-copy-DEFAULT_CALENDAR_CONFIG').click();

  await expect.poll(() => copyRequested).toBe(true);
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认日历配置 副本');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('草稿');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('日历版本');
});

test('calendar draft edit action opens calendar editor and saves updated rows', async ({ page }) => {
  const row = {
    versionNo: 'CALENDAR_CONFIG_88000',
    displayName: '默认日历配置 副本',
    configType: 'BUSINESS_CALENDAR',
    configTypeLabel: '日历版本',
    status: 'DRAFT',
    statusLabel: '草稿',
    sourceLabel: '系统管理员',
    summary: '2 条日历配置',
    itemCount: 2,
    scopeSummary: '未设置范围',
    updatedBy: 1,
    updatedAt: '2026-05-25T10:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: true, disabledReason: null }
    ]
  };
  let savePayload: unknown;
  let detailItems: Array<{
    groupName: string;
    itemName: string;
    cadence: string | null;
    valueType: string | null;
    defaultValue: string | null;
    resultShape: string | null;
    note: string | null;
  }> = [
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
      itemName: '节日爆发系数',
      cadence: '每周1',
      valueType: null,
      defaultValue: null,
      resultShape: '类目/系数',
      note: null
    }
  ];
  let dimensionOptionsRequested = false;

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: [row] });
  });
  await page.route('**/api/operations-config/product-dimensions/options?**', async (route) => {
    dimensionOptionsRequested = true;
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
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88000', async (route) => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON() as {
        displayName?: string | null;
        summary?: string | null;
        items: typeof detailItems;
      };
      savePayload = payload;
      row.displayName = payload.displayName || row.displayName;
      row.summary = payload.summary || '1 条日历配置';
      row.itemCount = payload.items.length;
      detailItems = payload.items;
      await route.fulfill({
        json: {
          ...row,
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
  await page.getByTestId('operation-config-version-action-edit-CALENDAR_CONFIG_88000').click();

  await expect.poll(() => dimensionOptionsRequested).toBe(true);
  await expect(page.getByTestId('operation-config-calendar-editor')).not.toContainText('日历版本编辑');
  await expect(page.getByTestId('operation-config-calendar-editor')).not.toContainText('稳定期波动率范围');
  await expect(page.getByTestId('operation-config-lifecycle-threshold-editor')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-calendar-add')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-display-name')).toHaveValue('默认日历配置 副本');
  await expect(page.getByTestId('operation-config-calendar-summary')).toHaveValue('2 条日历配置');
  const calendarEditorHeaderBox = await page.getByTestId('operation-config-calendar-editor-header').boundingBox();
  const addCalendarItemButtonBox = await page.getByTestId('operation-config-calendar-add').boundingBox();
  const firstCalendarItemBox = await page.getByTestId('operation-config-calendar-item-name-0').boundingBox();
  expect(calendarEditorHeaderBox).not.toBeNull();
  expect(addCalendarItemButtonBox).not.toBeNull();
  expect(firstCalendarItemBox).not.toBeNull();
  expect(addCalendarItemButtonBox!.x).toBeGreaterThan(calendarEditorHeaderBox!.x + calendarEditorHeaderBox!.width / 2);
  expect(addCalendarItemButtonBox!.y).toBeLessThan(firstCalendarItemBox!.y);
  await expect(page.getByTestId('operation-config-calendar-item-group-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-calendar-item-cadence-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-calendar-item-date-range-0')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-item-factor-0')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-item-scope-type-0')).toContainText('全品');
  await expect(page.getByTestId('operation-config-calendar-item-scope-value-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-calendar-item-delete-1')).toBeVisible();

  await page.getByTestId('operation-config-calendar-display-name').fill('2027 斋月日历配置');
  await page.getByTestId('operation-config-calendar-summary').fill('斋月类目重点配置');
  await page.getByTestId('operation-config-calendar-item-name-0').fill('开斋节 (Eid al-Fitr)');
  await expectRemovedCalendarItemOptionsHidden(page);
  await page.getByTestId('operation-config-calendar-item-date-range-0').locator('input').first().fill('2027-02-08');
  await page.getByTestId('operation-config-calendar-item-date-range-0').locator('input').nth(1).fill('2027-03-09');
  await page.keyboard.press('Enter');
  await page.getByTestId('operation-config-calendar-item-factor-0').locator('input').fill('1.33');
  await page.getByTestId('operation-config-calendar-item-scope-type-0').locator('.ant-select-selector').click();
  await page.locator('.ant-select-item-option').filter({ hasText: '类目' }).click();
  await page.getByTestId('operation-config-calendar-item-scope-value-0').click();
  await expect(page.getByTestId('operation-config-calendar-scope-picker-modal')).toBeVisible();
  await expect(page.getByTestId('operation-config-calendar-scope-picker-modal')).toContainText('stationery-labels_imported-office-labels-long-category');
  await page.getByTestId('operation-config-calendar-scope-picker-search').fill('imported-office');
  await page.getByTestId('operation-config-calendar-scope-picker-option-stationery-labels_imported-office-labels-long-category').click();
  await page.getByTestId('operation-config-calendar-item-delete-1').click();
  await page.getByTestId('operation-config-calendar-save').click();

  await expect.poll(() => (savePayload as { configType?: string } | undefined)?.configType).toBe('BUSINESS_CALENDAR');
  await expect.poll(() => (savePayload as { displayName?: string } | undefined)?.displayName).toBe('2027 斋月日历配置');
  await expect.poll(() => (savePayload as { summary?: string } | undefined)?.summary).toBe('斋月类目重点配置');
  await expect
    .poll(() => (savePayload as { items?: Array<{ itemName?: string; cadence?: string | null; defaultValue?: string | null; resultShape?: string | null }> } | undefined)?.items?.[0])
    .toMatchObject({
      itemName: '开斋节 (Eid al-Fitr)',
      cadence: null,
      defaultValue: '2027-02-08 ~ 2027-03-09 / 1.33',
      resultShape: 'category:stationery-labels_imported-office-labels-long-category'
    });
  await expect.poll(() => (savePayload as { items?: unknown[] } | undefined)?.items?.length).toBe(1);
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('2027 斋月日历配置');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('斋月类目重点配置');
  await page.getByTestId('operation-config-version-action-detail-CALENDAR_CONFIG_88000').click();
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('开斋节');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('1.33');
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('类目：stationery-labels_imported-office-labels-long-category');
  await expect(page.getByTestId('operation-config-version-detail')).not.toContainText('提前一年');
});

test('lifecycle draft edit action opens lifecycle editor and saves updated thresholds', async ({ page }) => {
  const row = {
    versionNo: 'LIFECYCLE_CONFIG_88001',
    displayName: '默认生命周期配置 副本',
    configType: 'PRODUCT_LIFECYCLE',
    configTypeLabel: '生命周期版本',
    status: 'DRAFT',
    statusLabel: '草稿',
    sourceLabel: '系统管理员',
    summary: '2 条生命周期配置',
    itemCount: 2,
    scopeSummary: '未设置范围',
    updatedBy: 1,
    updatedAt: '2026-05-25T10:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: true, disabledReason: null }
    ]
  };
  let savePayload: unknown;
  let detailItems: Array<{
    groupName: string;
    itemName: string;
    cadence: string | null;
    valueType: string | null;
    defaultValue: string | null;
    resultShape: string | null;
    note: string | null;
  }> = [
    {
      groupName: '新品期',
      itemName: '新品期最长周期',
      cadence: '随时',
      valueType: '数组',
      defaultValue: '[60]',
      resultShape: null,
      note: null
    },
    {
      groupName: '成长期',
      itemName: '成长期最小月销量',
      cadence: '随时',
      valueType: '数值',
      defaultValue: '10',
      resultShape: null,
      note: null
    }
  ];

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: [row] });
  });
  await page.route('**/api/operations-config/versions/LIFECYCLE_CONFIG_88001', async (route) => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON() as {
        displayName?: string | null;
        summary?: string | null;
        items: typeof detailItems;
      };
      savePayload = payload;
      row.displayName = payload.displayName || row.displayName;
      row.summary = payload.summary || row.summary;
      detailItems = payload.items;
      await route.fulfill({
        json: {
          ...row,
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
  await page.getByTestId('operation-config-version-action-edit-LIFECYCLE_CONFIG_88001').click();

  await expect(page.getByTestId('operation-config-lifecycle-threshold-editor')).not.toContainText('生命周期版本编辑');
  await expect(page.getByTestId('operation-config-lifecycle-add')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-lifecycle-display-name')).toHaveValue('默认生命周期配置 副本');
  await expect(page.getByTestId('operation-config-lifecycle-summary')).toHaveValue('2 条生命周期配置');
  const lifecycleEditorHeaderBox = await page.getByTestId('operation-config-lifecycle-editor-header').boundingBox();
  const firstLifecycleValueBox = await page.getByTestId('operation-config-lifecycle-item-default-value-0').boundingBox();
  expect(lifecycleEditorHeaderBox).not.toBeNull();
  expect(firstLifecycleValueBox).not.toBeNull();
  await expect(page.getByTestId('operation-config-lifecycle-item-group-0')).toContainText('[新品期]');
  await expect(page.getByTestId('operation-config-lifecycle-item-group-1')).toContainText('[成长期]');
  await expect(page.getByTestId('operation-config-lifecycle-item-name-0')).toContainText('新品期最长周期(数组)');
  await expect(page.getByTestId('operation-config-lifecycle-item-name-1')).toContainText('成长期最小月销量(数值)');
  const lifecycleTagColors = await page.getByTestId('operation-config-lifecycle-item-group-0').evaluate((firstGroupElement) => {
    const firstTag = firstGroupElement.querySelector('.ant-tag') as HTMLElement;
    const secondTag = document.querySelector('[data-testid="operation-config-lifecycle-item-group-1"] .ant-tag') as HTMLElement;
    const firstStyle = window.getComputedStyle(firstTag);
    const secondStyle = window.getComputedStyle(secondTag);
    return {
      firstBackground: firstStyle.backgroundColor,
      secondBackground: secondStyle.backgroundColor,
      firstColor: firstStyle.color,
      secondColor: secondStyle.color
    };
  });
  expect(lifecycleTagColors.firstBackground).not.toBe(lifecycleTagColors.secondBackground);
  expect(lifecycleTagColors.firstColor).not.toBe(lifecycleTagColors.secondColor);
  const lifecycleCellStyles = await page.getByTestId('operation-config-lifecycle-item-group-0').evaluate((element) => {
    const groupStyle = window.getComputedStyle(element);
    const rowStyle = window.getComputedStyle(element.parentElement as Element);
    return {
      backgroundColor: groupStyle.backgroundColor,
      borderStyle: groupStyle.borderStyle,
      rowBorderBottomStyle: rowStyle.borderBottomStyle
    };
  });
  expect(lifecycleCellStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(lifecycleCellStyles.borderStyle).toBe('none');
  expect(lifecycleCellStyles.rowBorderBottomStyle).toBe('solid');
  await expect(page.getByTestId('operation-config-lifecycle-item-name-0').locator('input')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-lifecycle-item-group-0').locator('input')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-lifecycle-item-cadence-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-lifecycle-item-value-type-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-lifecycle-item-note-0')).toHaveCount(0);
  await expect(page.getByTestId('operation-config-lifecycle-threshold-editor')).not.toContainText('随时');
  await expect(page.getByTestId('operation-config-calendar-editor')).toHaveCount(0);

  await page.getByTestId('operation-config-lifecycle-display-name').fill('生命周期 DEFAULT_V2');
  await page.getByTestId('operation-config-lifecycle-summary').fill('核心生命周期阈值');
  await page.getByTestId('operation-config-lifecycle-item-default-value-0').fill('[45]');
  await page.getByTestId('operation-config-lifecycle-save').click();

  await expect.poll(() => (savePayload as { configType?: string } | undefined)?.configType).toBe('PRODUCT_LIFECYCLE');
  await expect.poll(() => (savePayload as { displayName?: string } | undefined)?.displayName).toBe('生命周期 DEFAULT_V2');
  await expect.poll(() => (savePayload as { summary?: string } | undefined)?.summary).toBe('核心生命周期阈值');
  await expect
    .poll(() => (savePayload as { items?: Array<{ itemName?: string; defaultValue?: string | null; cadence?: string | null }> } | undefined)?.items?.[0])
    .toMatchObject({ itemName: '新品期最长周期', defaultValue: '[45]', cadence: null });
  await expect
    .poll(() => (savePayload as { items?: Array<{ itemName?: string; defaultValue?: string | null; cadence?: string | null }> } | undefined)?.items?.[1])
    .toMatchObject({ itemName: '成长期最小月销量', defaultValue: '10', cadence: null });
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('生命周期 DEFAULT_V2');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('核心生命周期阈值');
  await page.getByTestId('operation-config-version-action-detail-LIFECYCLE_CONFIG_88001').click();
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('[45]');
});

test('draft and disabled delete actions remove rows while protected rows stay disabled', async ({ page }) => {
  let rows = [
    {
      versionNo: 'CALENDAR_CONFIG_88000',
      displayName: '默认日历配置 副本',
      configType: 'BUSINESS_CALENDAR',
      configTypeLabel: '日历版本',
      status: 'DRAFT',
      statusLabel: '草稿',
      sourceLabel: '系统管理员',
      summary: '13 条日历配置',
      itemCount: 13,
      scopeSummary: '未设置范围',
      updatedBy: 1,
      updatedAt: '2026-05-25T10:00:00',
      actions: [
        { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
        { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
        { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
        { action: 'DELETE', label: '删除', enabled: true, disabledReason: null },
        { action: 'PUBLISH', label: '发布', enabled: true, disabledReason: null }
      ]
    },
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
        { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' },
        { action: 'PUBLISH', label: '发布', enabled: false, disabledReason: '系统默认版本不可发布' }
      ]
    },
    {
      versionNo: 'CALENDAR_CONFIG_88002',
      displayName: '已发布日历配置',
      configType: 'BUSINESS_CALENDAR',
      configTypeLabel: '日历版本',
      status: 'PUBLISHED',
      statusLabel: '已发布',
      sourceLabel: '运营主管',
      summary: '13 条日历配置',
      itemCount: 13,
      scopeSummary: '3 个店铺',
      updatedBy: 2,
      updatedAt: '2026-05-25T10:00:00',
      actions: [
        { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '只有草稿版本可编辑' },
        { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
        { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
        { action: 'DELETE', label: '删除', enabled: false, disabledReason: '只有草稿版本可删除' },
        { action: 'DISABLE', label: '停用', enabled: true, disabledReason: null }
      ]
    },
    {
      versionNo: 'CALENDAR_CONFIG_88003',
      displayName: '已停用日历配置',
      configType: 'BUSINESS_CALENDAR',
      configTypeLabel: '日历版本',
      status: 'DISABLED',
      statusLabel: '已停用',
      sourceLabel: '运营主管',
      summary: '13 条日历配置',
      itemCount: 13,
      scopeSummary: '3 个店铺',
      updatedBy: 2,
      updatedAt: '2026-05-25T10:00:00',
      actions: [
        { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '只有草稿版本可编辑' },
        { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
        { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
        { action: 'DELETE', label: '删除', enabled: true, disabledReason: null },
        { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '只有已发布版本可停用' }
      ]
    }
  ];
  const deletedVersionNos: string[] = [];

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: rows });
  });
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88000', async (route) => {
    if (route.request().method() === 'DELETE') {
      deletedVersionNos.push('CALENDAR_CONFIG_88000');
      rows = rows.filter((row) => row.versionNo !== 'CALENDAR_CONFIG_88000');
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ status: 404, json: { message: 'not found' } });
  });
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88003', async (route) => {
    if (route.request().method() === 'DELETE') {
      deletedVersionNos.push('CALENDAR_CONFIG_88003');
      rows = rows.filter((row) => row.versionNo !== 'CALENDAR_CONFIG_88003');
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ status: 404, json: { message: 'not found' } });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');

  await expect(page.getByTestId('operation-config-version-action-delete-DEFAULT_CALENDAR_CONFIG')).toBeDisabled();
  await expect(page.getByTestId('operation-config-version-action-delete-CALENDAR_CONFIG_88002')).toBeDisabled();
  await expect(page.getByTestId('operation-config-version-action-delete-CALENDAR_CONFIG_88003')).toBeEnabled();
  await page.getByTestId('operation-config-version-action-delete-CALENDAR_CONFIG_88000').click();
  await page.getByTestId('operation-config-version-action-delete-CALENDAR_CONFIG_88003').click();

  await expect.poll(() => deletedVersionNos.sort()).toEqual(['CALENDAR_CONFIG_88000', 'CALENDAR_CONFIG_88003']);
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('默认日历配置 副本');
  await expect(page.getByTestId('operation-config-version-library-table')).not.toContainText('已停用日历配置');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认日历配置');
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('已发布日历配置');
});

test('publishing a typed draft shows confirmation and marks it current', async ({ page }) => {
  const row = {
    versionNo: 'CALENDAR_CONFIG_88000',
    displayName: '默认日历配置 副本',
    configType: 'BUSINESS_CALENDAR',
    configTypeLabel: '日历版本',
    status: 'DRAFT',
    statusLabel: '草稿',
    sourceLabel: '系统管理员',
    summary: '13 条日历配置',
    itemCount: 13,
    scopeSummary: '未设置范围',
    updatedBy: 1,
    updatedAt: '2026-05-25T10:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: true, disabledReason: null },
      { action: 'PUBLISH', label: '发布', enabled: true, disabledReason: null }
    ]
  };
  let publishRequested = false;

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: [row] });
  });
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88000/publish', async (route) => {
    publishRequested = true;
    await route.fulfill({
      json: {
        ...row,
        status: 'CURRENT',
        statusLabel: '当前生效',
        scopeSummary: '全局当前',
        actions: [
          { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '只有草稿版本可编辑' },
          { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
          { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
          { action: 'DELETE', label: '删除', enabled: false, disabledReason: '只有草稿版本可删除' },
          { action: 'DISABLE', label: '停用', enabled: true, disabledReason: null }
        ],
        items: []
      }
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');
  await page.getByTestId('operation-config-version-action-publish-CALENDAR_CONFIG_88000').click();

  await expect(page.getByTestId('operation-config-publish-confirm')).toContainText('日历版本');
  await expect(page.getByTestId('operation-config-publish-confirm')).toContainText('默认日历配置 副本');
  await expect(page.getByTestId('operation-config-publish-confirm')).toContainText('未设置范围');
  await expect(page.getByTestId('operation-config-publish-confirm')).toContainText('13 条日历配置');
  await expect(page.getByTestId('operation-config-publish-confirm')).toContainText('发布后将成为当前版本');

  await page.getByTestId('operation-config-publish-confirm-submit').click();

  await expect.poll(() => publishRequested).toBe(true);
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('当前生效');
  await expect(page.getByTestId('operation-config-version-action-edit-CALENDAR_CONFIG_88000')).toBeDisabled();
});

test('business user publish submits default authorized scope', async ({ page }) => {
  const row = {
    versionNo: 'CALENDAR_CONFIG_88000',
    displayName: '默认日历配置 副本',
    configType: 'BUSINESS_CALENDAR',
    configTypeLabel: '日历版本',
    status: 'DRAFT',
    statusLabel: '草稿',
    sourceLabel: '运营',
    summary: '13 条日历配置',
    itemCount: 13,
    scopeSummary: '未设置范围',
    updatedBy: 401,
    updatedAt: '2026-05-25T10:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: true, disabledReason: null },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: true, disabledReason: null },
      { action: 'PUBLISH', label: '发布', enabled: true, disabledReason: null }
    ]
  };
  let publishPayload: unknown;

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: [row] });
  });
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88000/publish', async (route) => {
    publishPayload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        ...row,
        status: 'CURRENT',
        statusLabel: '当前生效',
        scopeSummary: '307/STR108065-NAE/AE',
        actions: [
          { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '只有草稿版本可编辑' },
          { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
          { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
          { action: 'DELETE', label: '删除', enabled: false, disabledReason: '只有草稿版本可删除' },
          { action: 'DISABLE', label: '停用', enabled: true, disabledReason: null }
        ],
        items: []
      }
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=operator&grantOperationsConfig=1');
  await page.getByTestId('operation-config-version-action-publish-CALENDAR_CONFIG_88000').click();
  await page.getByTestId('operation-config-publish-confirm-submit').click();

  await expect
    .poll(() => publishPayload as { ownerUserId?: number; storeCode?: string; siteCode?: string } | undefined)
    .toMatchObject({ ownerUserId: 307, storeCode: 'STR108065-NAE', siteCode: 'AE' });
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('307/STR108065-NAE/AE');
});

test('disabling a current version keeps detail readable without audit UI', async ({ page }) => {
  const row = {
    versionNo: 'CALENDAR_CONFIG_88000',
    displayName: '默认日历配置 副本',
    configType: 'BUSINESS_CALENDAR',
    configTypeLabel: '日历版本',
    status: 'CURRENT',
    statusLabel: '当前生效',
    sourceLabel: '系统管理员',
    summary: '13 条日历配置',
    itemCount: 13,
    scopeSummary: '全局当前',
    updatedBy: 1,
    updatedAt: '2026-05-25T10:00:00',
    actions: [
      { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '只有草稿版本可编辑' },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: false, disabledReason: '只有草稿版本可删除' },
      { action: 'DISABLE', label: '停用', enabled: true, disabledReason: null }
    ]
  };
  let disabled = false;

  await page.route('**/api/operations-config/versions', async (route) => {
    await route.fulfill({ json: [row] });
  });
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88000/disable', async (route) => {
    disabled = true;
    row.status = 'DISABLED';
    row.statusLabel = '已停用';
    row.actions = [
      { action: 'EDIT', label: '编辑', enabled: false, disabledReason: '只有草稿版本可编辑' },
      { action: 'DETAIL', label: '查看详情', enabled: true, disabledReason: null },
      { action: 'COPY', label: '复制版本', enabled: true, disabledReason: null },
      { action: 'DELETE', label: '删除', enabled: false, disabledReason: '只有草稿版本可删除' },
      { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '只有已发布版本可停用' }
    ];
    await route.fulfill({
      json: {
        ...row,
        items: [
          {
            groupName: '业务日历',
            itemName: '斋月 (Ramadan)',
            cadence: '提前一年',
            valueType: '日期范围',
            defaultValue: null,
            resultShape: null,
            note: null
          }
        ],
        auditTrail: [
          {
            operatorUserId: 1,
            operatorLabel: '系统管理员',
            operation: 'DISABLE',
            fromStatus: 'CURRENT',
            toStatus: 'DISABLED',
            reason: '验收停用',
            operatedAt: '2026-05-25T11:30:00'
          }
        ]
      }
    });
  });
  await page.route('**/api/operations-config/versions/CALENDAR_CONFIG_88000', async (route) => {
    await route.fulfill({
      json: {
        ...row,
        items: [
          {
            groupName: '业务日历',
            itemName: '斋月 (Ramadan)',
            cadence: '提前一年',
            valueType: '日期范围',
            defaultValue: null,
            resultShape: null,
            note: null
          }
        ],
        auditTrail: disabled
          ? [
              {
                operatorUserId: 1,
                operatorLabel: '系统管理员',
                operation: 'DISABLE',
                fromStatus: 'CURRENT',
                toStatus: 'DISABLED',
                reason: '验收停用',
                operatedAt: '2026-05-25T11:30:00'
              }
            ]
          : []
      }
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=admin&grantOperationsConfig=1');
  await page.getByTestId('operation-config-version-action-disable-CALENDAR_CONFIG_88000').click();

  await expect.poll(() => disabled).toBe(true);
  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('已停用');
  await page.getByTestId('operation-config-version-action-detail-CALENDAR_CONFIG_88000').click();
  await expect(page.getByTestId('operation-config-version-detail')).toContainText('斋月 (Ramadan)');
  await expect(page.getByTestId('operation-config-version-detail')).not.toContainText('审计记录');
  await expect(page.getByTestId('operation-config-version-detail')).not.toContainText('CURRENT -> DISABLED');
  await expect(page.getByTestId('operation-config-version-detail')).not.toContainText('验收停用');
});

test('operator dev session keeps default version read-only affordances', async ({ page }) => {
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
            { action: 'DELETE', label: '删除', enabled: false, disabledReason: '系统默认版本不可删除' },
            { action: 'PUBLISH', label: '发布', enabled: false, disabledReason: '系统默认版本不可发布' },
            { action: 'DISABLE', label: '停用', enabled: false, disabledReason: '系统默认版本不可停用' }
          ]
        }
      ]
    });
  });

  await page.goto('/operations/config/versions?devSession=1&devRole=operator&grantOperationsConfig=1');

  await expect(page.getByTestId('operation-config-version-library-table')).toContainText('默认日历配置');
  await expect(page.getByTestId('operation-config-version-action-edit-DEFAULT_CALENDAR_CONFIG')).toBeDisabled();
  await expect(page.getByTestId('operation-config-version-action-delete-DEFAULT_CALENDAR_CONFIG')).toBeDisabled();
  await expect(page.getByTestId('operation-config-version-action-detail-DEFAULT_CALENDAR_CONFIG')).toBeEnabled();
});
