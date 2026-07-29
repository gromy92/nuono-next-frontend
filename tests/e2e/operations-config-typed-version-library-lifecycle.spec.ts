import { expect, test } from '@playwright/test';
import { setupOperationsConfigScope } from './operations-config-typed-version-library.setup';

test.beforeEach(async ({ page }) => setupOperationsConfigScope(page));

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
