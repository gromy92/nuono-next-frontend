import { expect, test } from '@playwright/test';
import { setupOperationsConfigScope } from './operations-config-typed-version-library.setup';

test.beforeEach(async ({ page }) => setupOperationsConfigScope(page));

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
