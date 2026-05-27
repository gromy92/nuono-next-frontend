import { expect, test } from '@playwright/test';

test('business calendar page presents one rule workbench with filters batch actions and audit', async ({ page }) => {
  let copyRequested = false;
  let batchRequested = false;
  let publishedDisabled = false;

  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: false,
        roleName: 'boss',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [
          {
            ownerUserId: 501,
            logicalStoreId: 701,
            projectCode: 'PRJ-X',
            projectName: 'Xingyao',
            storeCode: 'STR-X-NAE',
            siteCode: 'AE'
          },
          {
            ownerUserId: 501,
            logicalStoreId: 702,
            projectCode: 'PRJ-X',
            projectName: 'Xingyao',
            storeCode: 'STR-X-NSA',
            siteCode: 'SA'
          },
          {
            ownerUserId: 501,
            logicalStoreId: 703,
            projectCode: 'PRJ-Y',
            projectName: 'Chenwu',
            storeCode: 'STR-Y-NAE',
            siteCode: 'AE'
          }
        ],
        defaultOwnerUserId: 501,
        defaultStoreCode: 'STR-X-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/active?**', async (route) => {
    await route.fulfill({
      json: publishedDisabled
        ? []
        : [
            {
              id: 82001,
              ownerUserId: 501,
              storeCode: 'STR-X-NAE',
              siteCode: 'AE',
              ruleName: 'Ramadan 2026',
              activityType: 'holiday',
              dateFrom: '2026-02-18',
              dateTo: '2026-03-19',
              targetScopeType: 'all_products',
              factorValue: 1.35,
              factorPurpose: 'demand_uplift',
              enabled: true,
              publishStatus: 'PUBLISHED'
            }
          ]
    });
  });
  await page.route('**/api/operations-config/calendar-rules/history?**', async (route) => {
    await route.fulfill({
      json: [
        {
          id: 82002,
          ownerUserId: 501,
          storeCode: 'STR-X-NAE',
          siteCode: 'AE',
          ruleName: 'White Friday 2026 draft',
          activityType: 'marketplace_event',
          dateFrom: '2026-11-20',
          dateTo: '2026-11-30',
          targetScopeType: 'all_products',
          factorValue: 1.2,
          factorPurpose: 'demand_uplift',
          enabled: true,
          publishStatus: 'DRAFT'
        },
        {
          id: 82003,
          ownerUserId: 501,
          storeCode: 'STR-X-NAE',
          siteCode: 'AE',
          ruleName: 'Old disabled rule',
          activityType: 'custom',
          dateFrom: '2026-01-01',
          dateTo: '2026-01-02',
          targetScopeType: 'all_products',
          factorValue: 1.1,
          factorPurpose: 'demand_uplift',
          enabled: false,
          publishStatus: 'DISABLED'
        }
      ]
    });
  });
  await page.route('**/api/operations-config/calendar-rules/copy-previous-year', async (route) => {
    copyRequested = true;
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/operations-config/calendar-rules/batch', async (route) => {
    batchRequested = true;
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/operations-config/product-dimensions/options?**', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        source: 'product_management',
        brands: [{ value: 'Acme', label: 'Acme', usageCount: 3 }],
        productFulltypes: [{ value: 'home-bedding-duvet', label: 'home-bedding-duvet', usageCount: 2 }]
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/82001/disable', async (route) => {
    publishedDisabled = true;
    await route.fulfill({
      json: {
        id: 82001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleName: 'Ramadan 2026',
        activityType: 'holiday',
        dateFrom: '2026-02-18',
        dateTo: '2026-03-19',
        targetScopeType: 'all_products',
        factorValue: 1.35,
        factorPurpose: 'demand_uplift',
        enabled: false,
        publishStatus: 'DISABLED'
      }
    });
  });

  await page.goto('/operations/config/business-calendar?devSession=1&devRole=boss&grantOperationsConfig=1');

  await expect(page.getByTestId('operations-config-store-select')).toHaveCount(0);
  await expect(page.getByTestId('operations-config-scope-summary')).toContainText('作用店铺在运营配置版本中设置');
  await expect(page.getByTestId('operations-config-scope-table')).toHaveCount(0);
  await expect(page.getByTestId('operation-calendar-year-filter')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-status-filter')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-activity-type-filter')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-target-scope-filter')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-workbench-toolbar')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-batch-action-bar')).toBeHidden();
  await expect(page.getByTestId('operation-calendar-active-rules-table')).toHaveCount(0);
  await expect(page.getByTestId('operation-calendar-history-table')).toHaveCount(0);
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('Ramadan 2026');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('White Friday 2026 draft');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('Old disabled rule');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('当前生效');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('草稿');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('已停用');

  await page.getByRole('button', { name: '复制上一年' }).click();
  await expect.poll(() => copyRequested).toBe(true);

  await page.getByTestId('operation-calendar-status-filter').click();
  await page.getByTitle('草稿').click();
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('White Friday 2026 draft');
  await expect(page.getByTestId('operation-calendar-rules-table')).not.toContainText('Ramadan 2026');

  await page.getByTestId('operation-calendar-rules-table').getByRole('checkbox').nth(1).check();
  await expect(page.getByTestId('operation-calendar-batch-action-bar')).toContainText('已选 1 条');
  await page.getByRole('spinbutton', { name: '批量因子' }).fill('1.45');
  await page.getByRole('button', { name: '批量调整因子' }).click();
  await expect.poll(() => batchRequested).toBe(true);

  await page.getByTestId('operation-calendar-status-filter').click();
  await page.getByTitle('全部状态').click();
  await page.getByTestId('operation-calendar-disable-82001').click();
  await expect.poll(() => publishedDisabled).toBe(true);
  await expect(page.getByRole('button', { name: '删除' })).toHaveCount(0);
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('停用');

  await page.getByTestId('operation-calendar-audit-button').click();
  await expect(page.getByTestId('operation-calendar-audit-drawer')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-audit-drawer')).toContainText('历史审计');
  await expect(page.getByTestId('operation-calendar-audit-drawer')).toContainText('White Friday 2026 draft');
  await page.getByTestId('operation-calendar-audit-close').click();
  await expect(page.getByTestId('operation-calendar-audit-drawer')).toBeHidden();

  await expect(page.getByRole('button', { name: '展开范围明细' })).toHaveCount(0);
});

test('business calendar editor uses a side panel template helper and publish confirmation', async ({ page }) => {
  let draftSaved = false;
  let draftPublished = false;

  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: false,
        roleName: 'boss',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [
          {
            ownerUserId: 501,
            logicalStoreId: 701,
            projectCode: 'PRJ-X',
            projectName: 'Xingyao',
            storeCode: 'STR-X-NAE',
            siteCode: 'AE'
          }
        ],
        defaultOwnerUserId: 501,
        defaultStoreCode: 'STR-X-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/active?**', async (route) => {
    await route.fulfill({
      json: draftPublished
        ? [
            {
              id: 90001,
              ownerUserId: 501,
              storeCode: 'STR-X-NAE',
              siteCode: 'AE',
              ruleName: 'White Friday UAE 2026',
              activityType: 'marketplace_event',
              dateFrom: '2026-11-20',
              dateTo: '2026-11-30',
              targetScopeType: 'brand',
              targetScopeValue: 'Acme',
              factorValue: 1.25,
              factorPurpose: 'demand_uplift',
              enabled: true,
              publishStatus: 'PUBLISHED'
            }
          ]
        : []
    });
  });
  await page.route('**/api/operations-config/calendar-rules/history?**', async (route) => {
    await route.fulfill({
      json: draftSaved
        ? [
            {
              id: 90001,
              ownerUserId: 501,
              storeCode: 'STR-X-NAE',
              siteCode: 'AE',
              ruleName: 'White Friday UAE 2026',
              activityType: 'marketplace_event',
              dateFrom: '2026-11-20',
              dateTo: '2026-11-30',
              targetScopeType: 'brand',
              targetScopeValue: 'Acme',
              factorValue: 1.25,
              factorPurpose: 'demand_uplift',
              enabled: true,
              publishStatus: draftPublished ? 'PUBLISHED' : 'DRAFT'
            }
          ]
        : []
    });
  });
  await page.route('**/api/operations-config/product-dimensions/options?**', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        source: 'product_management',
        brands: [{ value: 'Acme', label: 'Acme', usageCount: 3 }],
        productFulltypes: []
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/drafts', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.ownerUserId).toBe(501);
    expect(body.storeCode).toBe('STR-X-NAE');
    expect(body.siteCode).toBe('AE');
    expect(body.ruleName).toBe('White Friday UAE 2026');
    expect(body.activityType).toBe('marketplace_event');
    expect(body.dateFrom).toBe('2026-11-20');
    expect(body.dateTo).toBe('2026-11-30');
    expect(body.targetScopeType).toBe('brand');
    expect(body.targetScopeValue).toBe('Acme');
    expect(body.factorValue).toBe(1.25);
    expect(body.factorPurpose).toBe('demand_uplift');
    draftSaved = true;
    await route.fulfill({
      json: {
        id: 90001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleName: 'White Friday UAE 2026',
        activityType: 'marketplace_event',
        dateFrom: '2026-11-20',
        dateTo: '2026-11-30',
        targetScopeType: 'brand',
        targetScopeValue: 'Acme',
        factorValue: 1.25,
        factorPurpose: 'demand_uplift',
        enabled: true,
        publishStatus: 'DRAFT'
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/90001/publish', async (route) => {
    draftPublished = true;
    await route.fulfill({
      json: {
        id: 90001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleName: 'White Friday UAE 2026',
        activityType: 'marketplace_event',
        dateFrom: '2026-11-20',
        dateTo: '2026-11-30',
        targetScopeType: 'brand',
        targetScopeValue: 'Acme',
        factorValue: 1.25,
        factorPurpose: 'demand_uplift',
        enabled: true,
        publishStatus: 'PUBLISHED'
      }
    });
  });

  await page.goto('/operations/config/business-calendar?devSession=1&devRole=boss&grantOperationsConfig=1');

  await expect(page.getByTestId('operation-calendar-editor-drawer')).toBeHidden();
  await page.getByRole('button', { name: '增加一条' }).click();
  await expect(page.getByTestId('operation-calendar-editor-drawer')).toBeVisible();
  await expect(page.getByRole('dialog', { name: '增加一条' })).toBeVisible();
  await expect(page.getByTestId('operation-calendar-template-helper')).toBeVisible();
  await page.getByTestId('operation-calendar-template-helper').click();
  await page.getByTitle('斋月 (Ramadan)').click();
  await expect(page.getByLabel('活动名称')).toHaveValue('斋月 (Ramadan)');
  await page.getByLabel('活动名称').fill('White Friday UAE 2026');
  await page.getByTestId('operation-calendar-activity-type-select').click();
  await page.getByTitle('平台大促').click();
  await page.getByLabel('开始日期').fill('2026-11-20');
  await page.getByLabel('结束日期').fill('2026-11-30');
  await page.getByTestId('operation-calendar-target-type-select').click();
  await page.getByTitle('品牌').click();
  await page.getByTestId('operation-calendar-target-option-select').click();
  await page.getByTitle('Acme').click();
  await page.getByRole('spinbutton', { name: '活动因子' }).fill('1.25');

  await page.getByRole('button', { name: '保存为草稿' }).click();
  await expect.poll(() => draftSaved).toBe(true);
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('White Friday UAE 2026');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('草稿');
  await page.getByRole('button', { name: '发布版本' }).click();
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toBeVisible();
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toContainText('Xingyao / STR-X-NAE / AE');
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toContainText('2026');
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toContainText('品牌：Acme');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect.poll(() => draftPublished).toBe(true);
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('当前生效');
});

test('business calendar suite context saves activity factors under the bundle without rule-level publish', async ({ page }) => {
  let activeQueryBundleId: string | null = null;
  let historyQueryBundleId: string | null = null;
  let savedPayload: Record<string, unknown> | null = null;

  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: false,
        roleName: 'boss',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [
          {
            ownerUserId: 501,
            logicalStoreId: 701,
            projectCode: 'PRJ-X',
            projectName: 'Xingyao',
            storeCode: 'STR-X-NAE',
            siteCode: 'AE'
          }
        ],
        defaultOwnerUserId: 501,
        defaultStoreCode: 'STR-X-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/active?**', async (route) => {
    const url = new URL(route.request().url());
    activeQueryBundleId = url.searchParams.get('bundleVersionId');
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/operations-config/calendar-rules/history?**', async (route) => {
    const url = new URL(route.request().url());
    historyQueryBundleId = url.searchParams.get('bundleVersionId');
    await route.fulfill({
      json: savedPayload
        ? [
            {
              id: 92001,
              bundleVersionId: 86000,
              ownerUserId: 501,
              storeCode: 'STR-X-NAE',
              siteCode: 'AE',
              ruleName: 'Bundle White Friday 2026',
              activityType: 'marketplace_event',
              dateFrom: '2026-11-20',
              dateTo: '2026-11-30',
              targetScopeType: 'all_products',
              factorValue: 1.2,
              factorPurpose: 'demand_uplift',
              enabled: true,
              publishStatus: 'DRAFT'
            }
          ]
        : []
    });
  });
  await page.route('**/api/operations-config/product-dimensions/options?**', async (route) => {
    await route.fulfill({ json: { ready: true, source: 'product_management', brands: [], productFulltypes: [] } });
  });
  await page.route('**/api/operations-config/calendar-rules/drafts', async (route) => {
    savedPayload = route.request().postDataJSON();
    expect(savedPayload.bundleVersionId).toBe(86000);
    expect(savedPayload.ownerUserId).toBe(501);
    expect(savedPayload.storeCode).toBe('STR-X-NAE');
    expect(savedPayload.siteCode).toBe('AE');
    expect(savedPayload.ruleName).toBe('Bundle White Friday 2026');
    await route.fulfill({
      json: {
        id: 92001,
        bundleVersionId: 86000,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleName: 'Bundle White Friday 2026',
        activityType: 'marketplace_event',
        dateFrom: '2026-11-20',
        dateTo: '2026-11-30',
        targetScopeType: 'all_products',
        factorValue: 1.2,
        factorPurpose: 'demand_uplift',
        enabled: true,
        publishStatus: 'DRAFT'
      }
    });
  });

  await page.goto('/operations/config/business-calendar?bundleVersionId=86000&devSession=1&devRole=boss&grantOperationsConfig=1');

  await expect(page.getByTestId('operation-calendar-bundle-context')).toContainText('运营配置版本 #86000');
  await expect(page.getByTestId('operation-calendar-work-context')).toContainText('发布入口在版本详情页');
  await expect.poll(() => activeQueryBundleId).toBe('86000');
  await expect.poll(() => historyQueryBundleId).toBe('86000');
  await page.getByRole('button', { name: '增加一条' }).click();
  await page.getByLabel('活动名称').fill('Bundle White Friday 2026');
  await page.getByTestId('operation-calendar-activity-type-select').click();
  await page.getByTitle('平台大促').click();
  await page.getByLabel('开始日期').fill('2026-11-20');
  await page.getByLabel('结束日期').fill('2026-11-30');
  await page.getByRole('spinbutton', { name: '活动因子' }).fill('1.20');
  await page.getByRole('button', { name: '保存为草稿' }).click();

  await expect.poll(() => savedPayload?.bundleVersionId).toBe(86000);
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('Bundle White Friday 2026');
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('套装内 #92001');
  await expect(page.getByRole('button', { name: '发布版本' })).toHaveCount(0);
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toBeHidden();
});

test('lifecycle rules page supports default fallback draft diff and publish', async ({ page }) => {
  let draftCreated = false;
  let draftSaved = false;
  let published = false;
  let recalculated = false;

  const defaultThresholds = {
    newMaxAgeDays: 60,
    newMinAgeDays: 7,
    highPriceThreshold: 200,
    growthMinSalesGrowthRate: 0.5,
    growthMinPvGrowthRate: 0.2,
    growthMinMonthlySales: 10,
    growthMinActiveSalesDays: 5,
    growthMaxVolatility: 0.9,
    stableMinPvGrowthRate: -0.1,
    stableVolatilityMin: 0.3,
    stableVolatilityMax: 0.5,
    declineMaxVolatility: 1,
    declineMaxSalesGrowthRate: -0.1,
    longTailMaxVolatility: 0.6,
    longTailMaxMonthlySales: 10
  };
  const draftThresholds = () => ({
    ...defaultThresholds,
    growthMinSalesGrowthRate: draftSaved ? 0.65 : 0.5
  });

  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: false,
        roleName: 'boss',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [
          {
            ownerUserId: 501,
            logicalStoreId: 701,
            projectCode: 'PRJ-X',
            projectName: 'Xingyao',
            storeCode: 'STR-X-NAE',
            siteCode: 'AE'
          },
          {
            ownerUserId: 501,
            logicalStoreId: 702,
            projectCode: 'PRJ-X',
            projectName: 'Xingyao',
            storeCode: 'STR-X-NSA',
            siteCode: 'SA'
          }
        ],
        defaultOwnerUserId: 501,
        defaultStoreCode: 'STR-X-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/state?**', async (route) => {
    await route.fulfill({
      json: {
        current: published
          ? {
              id: 83001,
              ownerUserId: 501,
              storeCode: 'STR-X-NAE',
              siteCode: 'AE',
              ruleVersion: 'LIFECYCLE_CONFIG_v1',
              sourceRuleVersion: 'DEFAULT_V1',
              thresholds: draftThresholds(),
              publishStatus: 'PUBLISHED',
              fallback: false
            }
          : {
              id: null,
              ownerUserId: 501,
              storeCode: 'STR-X-NAE',
              siteCode: 'AE',
              ruleVersion: 'DEFAULT_V1',
              sourceRuleVersion: null,
              thresholds: defaultThresholds,
              publishStatus: 'PUBLISHED',
              fallback: true
            },
        draft:
          draftCreated && !published
            ? {
                id: 83001,
                ownerUserId: 501,
                storeCode: 'STR-X-NAE',
                siteCode: 'AE',
                ruleVersion: 'LIFECYCLE_CONFIG_v1',
                sourceRuleVersion: 'DEFAULT_V1',
                thresholds: draftThresholds(),
                publishStatus: 'DRAFT',
                fallback: false
              }
            : null,
        diffs:
          draftCreated && draftSaved && !published
            ? [
                {
                  field: 'growthMinSalesGrowthRate',
                  label: '成长期最小销量环比增长率',
                  beforeValue: '0.5000',
                  afterValue: '0.6500'
                }
              ]
            : [],
        history: draftCreated
          ? [
              {
                id: 83001,
                ownerUserId: 501,
                storeCode: 'STR-X-NAE',
                siteCode: 'AE',
                ruleVersion: 'LIFECYCLE_CONFIG_v1',
                sourceRuleVersion: 'DEFAULT_V1',
                thresholds: draftThresholds(),
                publishStatus: published ? 'PUBLISHED' : 'DRAFT',
                fallback: false
              }
            ]
          : [],
        impactScope: '501/STR-X-NAE/AE'
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/drafts/from-current', async (route) => {
    draftCreated = true;
    await route.fulfill({
      json: {
        id: 83001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleVersion: 'LIFECYCLE_CONFIG_v1',
        sourceRuleVersion: 'DEFAULT_V1',
        thresholds: defaultThresholds,
        publishStatus: 'DRAFT'
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/drafts', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.thresholds.growthMinSalesGrowthRate).toBe(0.65);
    draftSaved = true;
    await route.fulfill({
      json: {
        id: 83001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleVersion: 'LIFECYCLE_CONFIG_v1',
        sourceRuleVersion: 'DEFAULT_V1',
        thresholds: draftThresholds(),
        publishStatus: 'DRAFT'
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/83001/publish', async (route) => {
    published = true;
    await route.fulfill({
      json: {
        id: 83001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        ruleVersion: 'LIFECYCLE_CONFIG_v1',
        sourceRuleVersion: 'DEFAULT_V1',
        thresholds: draftThresholds(),
        publishStatus: 'PUBLISHED'
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/recalculate', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.ownerUserId).toBe(501);
    expect(body.storeCode).toBe('STR-X-NAE');
    expect(body.siteCode).toBe('AE');
    expect(body.selectedRuleVersion).toBe('LIFECYCLE_CONFIG_v1');
    expect(body.anchorDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    recalculated = true;
    await route.fulfill({
      json: {
        id: 84001,
        ownerUserId: 501,
        storeCode: 'STR-X-NAE',
        siteCode: 'AE',
        anchorDate: body.anchorDate,
        ruleVersion: 'LIFECYCLE_CONFIG_v1',
        status: 'succeeded',
        processedCount: 12,
        changedCount: 3,
        heldCount: 1,
        dataInsufficientCount: 2,
        triggeredByUserId: 501,
        triggerSource: 'operations_config'
      }
    });
  });

  await page.goto('/operations/config/lifecycle-rules?devSession=1&devRole=boss&grantOperationsConfig=1');

  await expect(page.getByTestId('operations-config-store-select')).toHaveCount(0);
  await expect(page.getByTestId('operations-config-scope-summary')).toContainText('作用店铺在运营配置版本中设置');
  await expect(page.getByTestId('operations-config-scope-table')).toHaveCount(0);
  await expect(page.getByTestId('operation-lifecycle-version-panel')).toBeVisible();
  await expect(page.getByTestId('operation-lifecycle-stage-sections')).toBeVisible();
  await expect(page.getByTestId('operation-lifecycle-stage-new-products')).toContainText('新品期');
  await expect(page.getByTestId('operation-lifecycle-current-version')).toContainText('DEFAULT_V1');
  await expect(page.getByTestId('operation-lifecycle-fallback-alert')).toBeVisible();

  await page.getByRole('button', { name: '从当前版本创建草稿' }).click();
  const growthInput = page.getByRole('spinbutton', { name: '成长期最小销量环比增长率' });
  await expect(growthInput).toBeEnabled();
  await growthInput.fill('0.65');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByTestId('operation-lifecycle-diff-table')).toContainText('0.6500');

  await page.getByRole('button', { name: '发布版本' }).click();
  await expect(page.getByTestId('operation-lifecycle-publish-confirm')).toContainText('Xingyao / STR-X-NAE / AE');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByTestId('operation-lifecycle-current-version')).toContainText('LIFECYCLE_CONFIG_v1');

  await page.getByRole('button', { name: '重算生命周期' }).click();
  await expect.poll(() => recalculated).toBe(true);
  await expect(page.getByTestId('operation-lifecycle-recalculation-result')).toContainText('succeeded');
  await expect(page.getByTestId('operation-lifecycle-recalculation-result')).toContainText('LIFECYCLE_CONFIG_v1');
  await expect(page.getByTestId('operation-lifecycle-recalculation-result')).toContainText('12');
});

test('system administrator publishes at boss scope with version source visible on both operations config pages', async ({ page }) => {
  let calendarDraftSaved = false;
  let calendarPublished = false;
  let lifecyclePublished = false;
  const defaultThresholds = {
    newMaxAgeDays: 60,
    newMinAgeDays: 7,
    highPriceThreshold: 200,
    growthMinSalesGrowthRate: 0.5,
    growthMinPvGrowthRate: 0.2,
    growthMinMonthlySales: 10,
    growthMinActiveSalesDays: 5,
    growthMaxVolatility: 0.9,
    stableMinPvGrowthRate: -0.1,
    stableVolatilityMin: 0.3,
    stableVolatilityMax: 0.5,
    declineMaxVolatility: 1,
    declineMaxSalesGrowthRate: -0.1,
    longTailMaxVolatility: 0.6,
    longTailMaxMonthlySales: 10
  };

  await page.route('**/api/operations-config/scope**', async (route) => {
    const url = new URL(route.request().url());
    const selected = url.searchParams.getAll('bossUserIds').map(Number).filter(Boolean);
    await route.fulfill({
      json: {
        systemAdmin: true,
        roleName: '系统管理员',
        bossOptions: [{ ownerUserId: 501, displayName: 'Boss A', accountNo: 'boss-a' }],
        selectedBossUserIds: selected,
        stores: selected.length
          ? [
              {
                ownerUserId: 501,
                logicalStoreId: null,
                projectCode: null,
                projectName: 'Boss A',
                storeCode: '*',
                siteCode: '*'
              }
            ]
          : [],
        defaultOwnerUserId: selected.length ? 501 : null,
        defaultStoreCode: selected.length ? '*' : null,
        defaultSiteCode: selected.length ? '*' : null,
        emptyReason: selected.length ? null : 'SELECT_BOSS'
      }
    });
  });
  await page.route('**/api/operations-config/product-dimensions/options?**', async (route) => {
    await route.fulfill({ json: { ready: true, source: 'product_management', brands: [], productFulltypes: [] } });
  });
  await page.route('**/api/operations-config/calendar-rules/active?**', async (route) => {
    await route.fulfill({
      json: calendarPublished
        ? [
            {
              id: 91001,
              ownerUserId: 501,
              storeCode: '*',
              siteCode: '*',
              ruleName: 'System Ramadan 2026',
              activityType: 'holiday',
              dateFrom: '2026-02-18',
              dateTo: '2026-03-19',
              targetScopeType: 'all_products',
              factorValue: 1.3,
              factorPurpose: 'demand_uplift',
              enabled: true,
              publishStatus: 'PUBLISHED',
              publishSourceLabel: '系统发布'
            }
          ]
        : []
    });
  });
  await page.route('**/api/operations-config/calendar-rules/history?**', async (route) => {
    await route.fulfill({
      json: calendarDraftSaved
        ? [
            {
              id: 91001,
              ownerUserId: 501,
              storeCode: '*',
              siteCode: '*',
              ruleName: 'System Ramadan 2026',
              activityType: 'holiday',
              dateFrom: '2026-02-18',
              dateTo: '2026-03-19',
              targetScopeType: 'all_products',
              factorValue: 1.3,
              factorPurpose: 'demand_uplift',
              enabled: true,
              publishStatus: calendarPublished ? 'PUBLISHED' : 'DRAFT',
              publishSourceLabel: '系统发布'
            }
          ]
        : []
    });
  });
  await page.route('**/api/operations-config/calendar-rules/drafts', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.bossUserIds).toEqual([501]);
    expect(body.ownerUserId).toBe(501);
    expect(body.storeCode).toBe('*');
    expect(body.siteCode).toBe('*');
    calendarDraftSaved = true;
    await route.fulfill({
      json: {
        id: 91001,
        ownerUserId: 501,
        storeCode: '*',
        siteCode: '*',
        ruleName: body.ruleName,
        activityType: body.activityType,
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        targetScopeType: body.targetScopeType,
        targetScopeValue: body.targetScopeValue,
        factorValue: body.factorValue,
        factorPurpose: body.factorPurpose,
        enabled: true,
        publishStatus: 'DRAFT',
        publishSourceLabel: '系统发布'
      }
    });
  });
  await page.route('**/api/operations-config/calendar-rules/91001/publish', async (route) => {
    expect(route.request().postDataJSON().bossUserIds).toEqual([501]);
    calendarPublished = true;
    await route.fulfill({
      json: {
        id: 91001,
        ownerUserId: 501,
        storeCode: '*',
        siteCode: '*',
        ruleName: 'System Ramadan 2026',
        activityType: 'holiday',
        dateFrom: '2026-02-18',
        dateTo: '2026-03-19',
        targetScopeType: 'all_products',
        factorValue: 1.3,
        factorPurpose: 'demand_uplift',
        enabled: true,
        publishStatus: 'PUBLISHED',
        publishSourceLabel: '系统发布'
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/state?**', async (route) => {
    await route.fulfill({
      json: {
        current: {
          id: lifecyclePublished ? 92001 : null,
          ownerUserId: 501,
          storeCode: '*',
          siteCode: '*',
          ruleVersion: lifecyclePublished ? 'LIFECYCLE_CONFIG_v1' : 'DEFAULT_V1',
          sourceRuleVersion: lifecyclePublished ? 'DEFAULT_V1' : null,
          thresholds: defaultThresholds,
          publishStatus: 'PUBLISHED',
          publishSourceLabel: lifecyclePublished ? '系统发布' : '系统默认',
          fallback: !lifecyclePublished
        },
        draft: lifecyclePublished
          ? null
          : {
              id: 92001,
              ownerUserId: 501,
              storeCode: '*',
              siteCode: '*',
              ruleVersion: 'LIFECYCLE_CONFIG_v1',
              sourceRuleVersion: 'DEFAULT_V1',
              thresholds: defaultThresholds,
              publishStatus: 'DRAFT',
              publishSourceLabel: '系统发布',
              fallback: false
            },
        diffs: [],
        history: [
          {
            id: 92001,
            ownerUserId: 501,
            storeCode: '*',
            siteCode: '*',
            ruleVersion: 'LIFECYCLE_CONFIG_v1',
            sourceRuleVersion: 'DEFAULT_V1',
            thresholds: defaultThresholds,
            publishStatus: lifecyclePublished ? 'PUBLISHED' : 'DRAFT',
            publishSourceLabel: '系统发布',
            fallback: false
          }
        ],
        impactScope: 'Boss A / 全部店铺'
      }
    });
  });
  await page.route('**/api/operations-config/lifecycle-rules/92001/publish', async (route) => {
    expect(route.request().postDataJSON().bossUserIds).toEqual([501]);
    lifecyclePublished = true;
    await route.fulfill({
      json: {
        id: 92001,
        ownerUserId: 501,
        storeCode: '*',
        siteCode: '*',
        ruleVersion: 'LIFECYCLE_CONFIG_v1',
        sourceRuleVersion: 'DEFAULT_V1',
        thresholds: defaultThresholds,
        publishStatus: 'PUBLISHED',
        publishSourceLabel: '系统发布'
      }
    });
  });

  await page.goto('/operations/config/business-calendar?devSession=1&devRole=admin&grantOperationsConfig=1');
  await page.getByTestId('operations-config-boss-select').click();
  await page.getByTitle('Boss A').click();
  await expect(page.getByTestId('operations-config-store-select')).toHaveCount(0);
  await expect(page.getByTestId('operations-config-scope-summary')).toContainText('老板范围');
  await expect(page.getByTestId('operations-config-scope-summary')).toContainText('全部店铺');

  await page.getByRole('button', { name: '增加一条' }).click();
  await page.getByLabel('活动名称').fill('System Ramadan 2026');
  await page.getByLabel('开始日期').fill('2026-02-18');
  await page.getByLabel('结束日期').fill('2026-03-19');
  await page.getByRole('spinbutton', { name: '活动因子' }).fill('1.30');
  await page.getByRole('button', { name: '保存为草稿' }).click();
  await expect.poll(() => calendarDraftSaved).toBe(true);
  await page.getByRole('button', { name: '发布版本' }).click();
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toContainText('Boss A / 全部店铺');
  await expect(page.getByTestId('operation-calendar-publish-confirm')).toContainText('系统发布');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect.poll(() => calendarPublished).toBe(true);
  await expect(page.getByTestId('operation-calendar-rules-table')).toContainText('系统发布');

  await page.goto('/operations/config/lifecycle-rules?devSession=1&devRole=admin&grantOperationsConfig=1');
  await page.getByTestId('operations-config-boss-select').click();
  await page.getByTitle('Boss A').click();
  await expect(page.getByTestId('operations-config-store-select')).toHaveCount(0);
  await expect(page.getByTestId('operation-lifecycle-version-panel')).toContainText('系统默认');
  await page.getByRole('button', { name: '发布版本' }).click();
  await expect(page.getByTestId('operation-lifecycle-publish-confirm')).toContainText('Boss A / 全部店铺');
  await expect(page.getByTestId('operation-lifecycle-publish-confirm')).toContainText('生命周期重算需单独触发');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect.poll(() => lifecyclePublished).toBe(true);
  await expect(page.getByTestId('operation-lifecycle-version-panel')).toContainText('系统发布');
});
