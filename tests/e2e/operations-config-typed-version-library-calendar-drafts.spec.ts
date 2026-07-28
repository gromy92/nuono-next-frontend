import { expect, test } from '@playwright/test';
import {
  expectRemovedCalendarItemOptionsHidden,
  setupOperationsConfigScope
} from './operations-config-typed-version-library.setup';

test.beforeEach(async ({ page }) => setupOperationsConfigScope(page));

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
