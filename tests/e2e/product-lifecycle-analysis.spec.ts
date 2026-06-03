import { expect, test } from '@playwright/test';

test('product lifecycle analysis opens from data menu with backend empty state', async ({ page }) => {
  let overviewRequestedUrl = '';

  await page.route('**/api/product-analysis/lifecycle/overview?**', async (route) => {
    overviewRequestedUrl = route.request().url();
    await route.fulfill({
      json: {
        summary: {
          storeCode: 'STR108065-NAE',
          siteCode: 'AE',
          totalProductCount: 0,
          readyProductCount: 0,
          missingParameterProductCount: 0
        },
        rows: []
      }
    });
  });

  await page.goto('/data/product-analysis/lifecycle?devSession=1&devRole=boss&grantProductAnalysis=1');

  const pageRoot = page.getByTestId('product-lifecycle-analysis-page');
  await expect(pageRoot).toBeVisible();
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '商品分析' })).toBeVisible();
  await expect(pageRoot.getByRole('heading', { name: '生命周期分析' })).toHaveCount(0);
  await expect(pageRoot).not.toContainText('数据 / 商品分析');
  await expect(pageRoot).toContainText('暂无商品生命周期分析结果');
  await expect(pageRoot).not.toContainText('SAMPLE-SKU');
  await expect(pageRoot.getByTestId('product-lifecycle-analysis-row')).toHaveCount(0);

  expect(overviewRequestedUrl).toContain('/api/product-analysis/lifecycle/overview?');
  expect(overviewRequestedUrl).toContain('storeCode=');
  expect(overviewRequestedUrl).toContain('siteCode=');
});

test('product lifecycle analysis dev account can target the local xingyao owner', async ({ page }) => {
  let devSessionUserId = '';
  let overviewRequestedUrl = '';

  await page.route('**/api/product-analysis/lifecycle/overview?**', async (route) => {
    overviewRequestedUrl = route.request().url();
    devSessionUserId = route.request().headers()['x-nuono-dev-session-user-id'] || '';
    await route.fulfill({
      json: {
        summary: {
          storeCode: 'STR245027-NAE',
          siteCode: 'AE',
          totalProductCount: 0,
          readyProductCount: 0,
          missingParameterProductCount: 0
        },
        rows: []
      }
    });
  });

  await page.goto('/data/product-analysis/lifecycle?devSession=1&devAccount=xingyaoqw&grantProductAnalysis=1');

  await expect(page.getByTestId('product-lifecycle-analysis-page')).toBeVisible();
  expect(devSessionUserId).toBe('10002');
  expect(overviewRequestedUrl).toContain('storeCode=STR245027-NAE');
  expect(overviewRequestedUrl).toContain('siteCode=AE');
});

test('product lifecycle analysis renders real lifecycle rows from api', async ({ page }) => {
  await page.route('**/api/product-analysis/lifecycle/overview?**', async (route) => {
    await route.fulfill({
      json: {
        summary: {
          storeCode: 'STR245027-NAE',
          siteCode: 'AE',
          totalProductCount: 3,
          readyProductCount: 2,
          missingParameterProductCount: 1,
          expectedLifecycleChangeProductCount: 1,
          forecastWindowDays: 90
        },
        rows: [
          {
            partnerSku: 'MILKYWAYA09',
            sku: 'z580978e7ed8f9491b50bz-1',
            productTitle: 'Galaxy Star Projector',
            imageUrl: 'https://f.nooncdn.com/pzsku/Z8615770F50CCD3CDC379Z/45/1752936344/8819be50-7ca7-436d-b9bc-a2cd0a4cf02a',
            brand: 'milkyway',
            productFulltype: 'home_decor-lighting-table_lamps',
            lifecycleCode: 'stable',
            lifecycleLabel: '稳定',
            analysisState: 'ready',
            analysisStateLabel: '可分析',
            analysisDate: '2026-05-21',
            listingDate: '2026-05-01',
            listingDateSource: 'official',
            ruleVersion: 'LIFECYCLE_CONFIG_88009',
            currentStock: 21,
            recent30DaySales: 15,
            earliestFactDate: '2025-06-23',
            latestFactDate: '2026-05-20',
            projectionState: 'ready',
            projectionMessage: '生命周期时间线已生成。',
            projectionMissingRequirements: [],
            currentStageStartDate: '2026-05-01',
            currentStageElapsedDays: 21,
            currentStageRemainingDays: 9,
            nextLifecycleCode: 'growth',
            nextLifecycleLabel: '成长期',
            nextTransitionDate: '2026-05-31',
            futureTimeline: [
              { date: '2026-05-22', lifecycleCode: 'new', lifecycleLabel: '新品期' },
              { date: '2026-05-31', lifecycleCode: 'growth', lifecycleLabel: '成长期' }
            ]
          },
          {
            partnerSku: 'MILKYWAYA10',
            sku: 'z580978e7ed8f9491b50bz-2',
            productTitle: 'Galaxy Star Projector Pro',
            imageUrl: 'https://f.nooncdn.com/pnsku/N13036202A/45/_/1767608204/990f8be8-6829-401e-ad3d-ddc34fecc6f0',
            brand: 'milkyway',
            productFulltype: 'home_decor-lighting-table_lamps',
            lifecycleCode: 'growth',
            lifecycleLabel: '成长期',
            analysisState: 'ready',
            analysisStateLabel: '可分析',
            analysisDate: '2026-05-21',
            listingDate: '2026-04-01',
            currentStageStartDate: '2026-05-01',
            listingDateSource: 'official',
            ruleVersion: 'DEFAULT_V1',
            currentStock: 18,
            recent30DaySales: 20,
            latestFactDate: '2026-05-20',
            projectionState: 'lifecycle_period_config_missing',
            projectionMessage: '生命周期周期参数缺失，无法计算。',
            projectionMissingRequirements: ['growth.durationDays'],
            futureTimeline: []
          },
          {
            partnerSku: 'MILKYWAYA01',
            sku: 'zbd2a2638dca8ecc9337bz-1',
            productTitle: 'Galaxy Projector',
            imageUrl: 'https://f.nooncdn.com/54aaafcfc1665b1dbf751298162896f6|pzsku/Z0F154F289E1563B85699Z/45/1769686316/2e4ceef9-b33b-46de-ad64-2aaf70d6d660',
            brand: 'milkyway',
            productFulltype: 'home_decor-lighting-table_lamps',
            lifecycleCode: 'data_insufficient',
            lifecycleLabel: '数据不足',
            analysisState: 'data_insufficient',
            analysisStateLabel: '数据不足',
            analysisDate: '2026-05-21',
            listingDate: '2026-05-13',
            currentStageStartDate: null,
            listingDateSource: 'official',
            ruleVersion: 'DEFAULT_V1',
            currentStock: 2,
            recent30DaySales: 0,
            latestFactDate: '2026-05-20',
            projectionState: 'lifecycle_data_insufficient',
            projectionMessage: '当前生命周期为数据不足，不能生成未来阶段时间线。',
            projectionMissingRequirements: ['currentLifecycle=data_insufficient'],
            futureTimeline: []
          }
        ]
      }
    });
  });

  await page.goto('/data/product-analysis/lifecycle?devSession=1&devAccount=xingyaoqw&grantProductAnalysis=1');

  const pageRoot = page.getByTestId('product-lifecycle-analysis-page');
  await expect(pageRoot.getByTestId('product-lifecycle-analysis-row')).toHaveCount(3);
  await expect(pageRoot).toContainText('共 3 个商品，直接判定 2 个，保持前态可预测 0 个，数据不足 1 个，未来3个月预计变化 1 个');
  await expect(pageRoot).toContainText('MILKYWAYA09');
  await expect(pageRoot).toContainText('Galaxy Star Projector');
  await expect(pageRoot).toContainText('稳定');
  await expect(pageRoot).toContainText('可分析');
  await expect(pageRoot).not.toContainText('LIFECYCLE_CONFIG_88009');
  await expect(pageRoot).not.toContainText('z580978e7ed8f9491b50bz-1');
  await expect(pageRoot).toContainText('库存 21');
  await expect(pageRoot).toContainText('近30天销量 15');
  await expect(pageRoot).toContainText('最新销量数据 2026-05-20');
  await expect(pageRoot).toContainText('历史销量跨度 2025-06-23 至 2026-05-20');
  await expect(pageRoot).not.toContainText('销量数据至');
  await expect(pageRoot).toContainText('已处 21 天');
  await expect(pageRoot).toContainText('剩余 9 天');
  await expect(pageRoot).toContainText('下阶段 成长期');
  await expect(pageRoot).toContainText('变更日 2026-05-31');
  await expect(pageRoot).toContainText('未来3个月');
  await expect(pageRoot).toContainText('生命周期预测参数缺失，无法计算。');
  await expect(pageRoot).toContainText('growth.durationDays');
  await expect(pageRoot).toContainText('当前生命周期为数据不足，暂不预测。');
  await expect(pageRoot.getByTestId('product-lifecycle-image').first()).toHaveAttribute(
    'src',
    'https://f.nooncdn.com/p/pzsku/Z8615770F50CCD3CDC379Z/45/1752936344/8819be50-7ca7-436d-b9bc-a2cd0a4cf02a.jpg'
  );
  await expect(pageRoot.getByTestId('product-lifecycle-image').nth(1)).toHaveAttribute(
    'src',
    'https://f.nooncdn.com/p/pnsku/N13036202A/45/_/1767608204/990f8be8-6829-401e-ad3d-ddc34fecc6f0.jpg'
  );
  await expect(pageRoot.getByTestId('product-lifecycle-image').nth(2)).toHaveAttribute(
    'src',
    'https://f.nooncdn.com/p/54aaafcfc1665b1dbf751298162896f6|pzsku/Z0F154F289E1563B85699Z/45/1769686316/2e4ceef9-b33b-46de-ad64-2aaf70d6d660.jpg'
  );
  const titleLineClamp = await pageRoot.getByTestId('product-lifecycle-title').first().evaluate((node) =>
    window.getComputedStyle(node).getPropertyValue('-webkit-line-clamp')
  );
  expect(titleLineClamp).toBe('2');
  const headers = await pageRoot.locator('thead th').allTextContents();
  expect(headers.indexOf('未来3个月')).toBeLessThan(headers.indexOf('生命周期/状态'));
  expect(headers).not.toContain('预测状态');
  expect(headers).not.toContain('当前生命周期');
  expect(headers).not.toContain('分析状态');

  await page.getByPlaceholder('搜索PSKU/标题/生命周期').fill('MILKYWAYA10');
  await expect(pageRoot.getByTestId('product-lifecycle-analysis-row')).toHaveCount(1);
  await expect(pageRoot).toContainText('MILKYWAYA10');
  await expect(pageRoot).not.toContainText('MILKYWAYA09');
});

test('product lifecycle analysis explains missing listing date', async ({ page }) => {
  await page.route('**/api/product-analysis/lifecycle/overview?**', async (route) => {
    await route.fulfill({
      json: {
        summary: {
          storeCode: 'STR245027-NAE',
          siteCode: 'AE',
          totalProductCount: 2,
          readyProductCount: 0,
          missingParameterProductCount: 2,
          expectedLifecycleChangeProductCount: 0,
          forecastWindowDays: 90
        },
        rows: [
          {
            partnerSku: 'MILKYWAYA06',
            sku: 'zb432f2cac4d3162612b8z-1',
            productTitle: 'Astronaut Star Space Projector',
            imageUrl: null,
            brand: 'milkyway',
            productFulltype: 'home_decor-lighting-table_lamps',
            lifecycleCode: 'data_insufficient',
            lifecycleLabel: '数据不足',
            analysisState: 'data_insufficient',
            analysisStateLabel: '数据不足',
            analysisDate: '2026-05-21',
            listingDate: null,
            currentStageStartDate: null,
            listingDateSource: 'missing',
            ruleVersion: 'DEFAULT_V1',
            currentStock: 0,
            recent30DaySales: 0,
            latestFactDate: null,
            projectionState: 'lifecycle_data_insufficient',
            projectionMessage: '当前生命周期为数据不足，不能生成未来阶段时间线。',
            projectionMissingRequirements: ['currentLifecycle=data_insufficient'],
            futureTimeline: []
          },
          {
            partnerSku: 'MILKYWAYA07',
            sku: 'z730634a7f9a2fa1ad551z-1',
            productTitle: 'Legacy Pulled Listing Projector',
            imageUrl: null,
            brand: 'milkyway',
            productFulltype: 'home_decor-lighting-table_lamps',
            lifecycleCode: 'data_insufficient',
            lifecycleLabel: '数据不足',
            analysisState: 'data_insufficient',
            analysisStateLabel: '数据不足',
            analysisDate: '2026-05-21',
            listingDate: '2026-05-13',
            currentStageStartDate: null,
            listingDateSource: 'pulled',
            ruleVersion: 'DEFAULT_V1',
            currentStock: 0,
            recent30DaySales: 0,
            latestFactDate: null,
            projectionState: 'lifecycle_data_insufficient',
            projectionMessage: '当前生命周期为数据不足，不能生成未来阶段时间线。',
            projectionMissingRequirements: ['currentLifecycle=data_insufficient'],
            futureTimeline: []
          }
        ]
      }
    });
  });

  await page.goto('/data/product-analysis/lifecycle?devSession=1&devAccount=xingyaoqw&grantProductAnalysis=1');

  const pageRoot = page.getByTestId('product-lifecycle-analysis-page');
  await expect(pageRoot.getByTestId('product-lifecycle-analysis-row')).toHaveCount(2);
  await expect(pageRoot).toContainText('缺失上架日/未上架');
  await expect(pageRoot).not.toContainText('上架日 -');
  await expect(pageRoot).not.toContainText('上架日 2026-05-13');
});

test('product lifecycle analysis can recalculate lifecycle and refresh overview', async ({ page }) => {
  let overviewCallCount = 0;
  let recalculateRequestedUrl = '';
  let recalculateMethod = '';

  await page.route('**/api/product-analysis/lifecycle/overview?**', async (route) => {
    overviewCallCount += 1;
    await route.fulfill({
      json: overviewCallCount === 1
        ? {
            summary: {
              storeCode: 'STR245027-NAE',
              siteCode: 'AE',
              totalProductCount: 0,
              readyProductCount: 0,
              missingParameterProductCount: 0,
              expectedLifecycleChangeProductCount: 0,
              forecastWindowDays: 90
            },
            rows: []
          }
        : {
            summary: {
              storeCode: 'STR245027-NAE',
              siteCode: 'AE',
              totalProductCount: 1,
              readyProductCount: 1,
              missingParameterProductCount: 0,
              expectedLifecycleChangeProductCount: 1,
              forecastWindowDays: 90
            },
            rows: [
              {
                partnerSku: 'MILKYWAYA09',
                sku: 'z580978e7ed8f9491b50bz-1',
                productTitle: 'Galaxy Star Projector',
                imageUrl: null,
                brand: 'milkyway',
                productFulltype: 'home_decor-lighting-table_lamps',
                lifecycleCode: 'stable',
                lifecycleLabel: '稳定',
                analysisState: 'ready',
                analysisStateLabel: '可分析',
                analysisDate: '2026-05-22',
                listingDate: '2026-03-01',
                currentStageStartDate: '2026-05-01',
                listingDateSource: 'official',
                ruleVersion: 'DEFAULT_V1',
                currentStock: 21,
                recent30DaySales: 15,
                latestFactDate: '2026-05-21',
                projectionState: 'ready',
                projectionMessage: '生命周期时间线已生成。',
                projectionMissingRequirements: [],
                currentStageElapsedDays: 22,
                currentStageRemainingDays: 158,
                nextLifecycleCode: 'decline',
                nextLifecycleLabel: '衰退期',
                nextTransitionDate: '2026-10-28',
                futureTimeline: [
                  { date: '2026-05-23', lifecycleCode: 'stable', lifecycleLabel: '稳定期' }
                ]
              }
            ]
          }
    });
  });

  await page.route('**/api/product-analysis/lifecycle/recalculate?**', async (route) => {
    recalculateRequestedUrl = route.request().url();
    recalculateMethod = route.request().method();
    await route.fulfill({
      json: {
        jobId: 72010,
        status: 'succeeded',
        message: '生命周期计算完成。',
        storeCode: 'STR245027-NAE',
        siteCode: 'AE',
        anchorDate: '2026-05-22',
        processedCount: 37,
        changedCount: 2,
        heldCount: 1,
        dataInsufficientCount: 12
      }
    });
  });

  await page.goto('/data/product-analysis/lifecycle?devSession=1&devAccount=xingyaoqw&grantProductAnalysis=1');

  const pageRoot = page.getByTestId('product-lifecycle-analysis-page');
  await expect(pageRoot).toContainText('暂无商品生命周期分析结果');

  await page.getByRole('button', { name: '同步生命周期' }).click();

  await expect(pageRoot).toContainText('生命周期计算完成。');
  await expect(pageRoot).toContainText('已处理 37');
  await expect(pageRoot).toContainText('变化 2');
  await expect(pageRoot).toContainText('MILKYWAYA09');
  expect(recalculateMethod).toBe('POST');
  expect(recalculateRequestedUrl).toContain('/api/product-analysis/lifecycle/recalculate?');
  expect(recalculateRequestedUrl).toContain('storeCode=STR245027-NAE');
  expect(recalculateRequestedUrl).toContain('siteCode=AE');
  expect(overviewCallCount).toBe(2);
});
