import { expect, test } from '@playwright/test';

test('sales forecast workbench opens with real empty state and no mock rows', async ({ page }) => {
  let overviewRequestedUrl = '';

  await page.route('**/api/sales-forecast/overview?**', async (route) => {
    overviewRequestedUrl = route.request().url();
    await route.fulfill({
      json: {
        state: 'empty',
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        emptyState: {
          code: 'no_forecast_run',
          title: '暂无销量预测结果',
          description: '当前店铺还没有预测运行结果。后续可在完成预测计算后查看 30/60/90 天预测。'
        },
        rows: []
      }
    });
  });

  await page.goto('/data/sales-forecast?devSession=1&devRole=boss&grantSalesForecast=1');

  const workbench = page.getByTestId('sales-forecast-workbench');
  await expect(workbench).toBeVisible();
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '销量预测' })).toBeVisible();
  await expect(workbench).toContainText('暂无销量预测结果');
  await expect(workbench).toContainText('30/60/90 天预测');
  await expect(workbench).not.toContainText('SAMPLE-SKU');
  await expect(workbench.getByTestId('sales-forecast-row')).toHaveCount(0);

  expect(overviewRequestedUrl).toContain('storeCode=STR108065-NSA');
  expect(overviewRequestedUrl).toContain('siteCode=SA');
});

test('sales forecast workbench renders persisted forecast rows from api', async ({ page }) => {
  await page.route('**/api/sales-forecast/overview?**', async (route) => {
    await route.fulfill({
      json: {
        state: 'ready',
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        sourceDataDate: '2026-05-20',
        calculatedAt: '2026-05-21T09:30:00',
        calculationVersion: 'DEFAULT_V1',
        configVersion: 'DEFAULT_V1',
        emptyState: null,
        rows: [
          {
            partnerSku: 'PAPERSAYSB359',
            sku: 'Z02AD5F198C0C2E813C30Z-1',
            productTitle: 'Paper notebook',
            latestFactDate: '2026-05-20',
            historyUnits7: 21,
            historyUnits30: 60,
            historyUnits60: 90,
            historyUnits90: 90,
            forecastUnits30: 106,
            forecastUnits60: 211,
            forecastUnits90: 316,
            currentStock: 12,
            stockCoverDays: 6.0,
            lifecycleCode: 'growth',
            lifecycleLabel: '增长',
            confidenceLevel: 'high',
            confidenceLabel: '高',
            confidenceExplanation: '销量样本和库存投影满足 P0 预测要求，置信度高。',
            dataQualityWarnings: [],
            riskLabels: [
              {
                code: 'replenishment_risk',
                label: '补货风险',
                severity: 'danger',
                explanation: '库存覆盖天数偏低，需要优先复核补货。'
              }
            ],
            calculationVersion: 'DEFAULT_V1',
            configVersion: 'DEFAULT_V1',
            shortReason: '近7日 21 件，近30日 60 件，近90日 90 件；生命周期：增长；预测未来30/60/90天约 106 / 211 / 316 件。',
            detail: {
              featureValues: {
                latestFactDate: '2026-05-20',
                historyUnits7: 21,
                historyUnits30: 60,
                historyUnits60: 90,
                historyUnits90: 90,
                observedDays: 90,
                currentStock: 12,
                stockCoverDays: 6.0
              },
              factorBreakdown: {
                baseDailySales: 2.3,
                recentDailyTrendRate: 0.5,
                trendFactor: 1.25,
                lifecycleFactor: 1.22,
                futureFactor: 1,
                forecastUnits30: 106,
                forecastUnits60: 211,
                forecastUnits90: 316
              },
              lifecycleExplanation: '增长商品：近期销量高于基线，使用增长因子 1.22。',
              calculationVersion: 'DEFAULT_V1',
              configVersion: 'DEFAULT_V1'
            }
          }
        ]
      }
    });
  });

  await page.goto('/data/sales-forecast?devSession=1&devRole=boss&grantSalesForecast=1');

  const workbench = page.getByTestId('sales-forecast-workbench');
  await expect(workbench.getByTestId('sales-forecast-row')).toHaveCount(1);
  await expect(workbench).toContainText('PAPERSAYSB359');
  await expect(workbench).toContainText('Paper notebook');
  await expect(workbench).toContainText('21 / 60 / 90 / 90');
  await expect(workbench).toContainText('106');
  await expect(workbench).toContainText('库存 12');
  await expect(workbench).toContainText('覆盖 6.0 天');
  await expect(workbench).toContainText('置信度 高');
  await expect(workbench).toContainText('补货风险');
  await expect(workbench).toContainText('增长');
  await expect(workbench).toContainText('近7日 21 件');
  await expect(workbench).toContainText('数据日 2026-05-20');
  await expect(workbench).toContainText('DEFAULT_V1');
});

test('sales forecast workbench switches forecast windows and opens detail drawer without recalculating', async ({ page }) => {
  let overviewRequestCount = 0;

  await page.route('**/api/sales-forecast/overview?**', async (route) => {
    overviewRequestCount += 1;
    await route.fulfill({
      json: {
        state: 'ready',
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        sourceDataDate: '2026-05-20',
        calculatedAt: '2026-05-21T09:30:00',
        calculationVersion: 'DEFAULT_V1',
        configVersion: 'DEFAULT_V1-ACTIVITY-v2',
        emptyState: null,
        rows: [
          {
            partnerSku: 'PAPERSAYSB359',
            sku: 'Z02AD5F198C0C2E813C30Z-1',
            productTitle: 'Paper notebook',
            latestFactDate: '2026-05-20',
            historyUnits7: 21,
            historyUnits30: 60,
            historyUnits60: 90,
            historyUnits90: 90,
            forecastUnits30: 127,
            forecastUnits60: 253,
            forecastUnits90: 379,
            currentStock: 0,
            stockCoverDays: 0.0,
            lifecycleCode: 'growth',
            lifecycleLabel: '增长',
            confidenceLevel: 'low',
            confidenceLabel: '低',
            confidenceExplanation: '当前库存为 0 且近 30 天有销量，预测可能被断货压低，置信度低。',
            dataQualityWarnings: ['possible_stockout_distortion'],
            riskLabels: [
              {
                code: 'possible_stockout_distortion',
                label: '断货失真',
                severity: 'warning',
                explanation: '当前库存为 0 且近 30 天仍有销量，近期销量可能被断货压低。'
              },
              {
                code: 'low_confidence',
                label: '低置信度',
                severity: 'warning',
                explanation: '样本不足或存在数据质量问题，预测需人工复核。'
              }
            ],
            calculationVersion: 'DEFAULT_V1',
            configVersion: 'DEFAULT_V1-ACTIVITY-v2',
            activityWindowSummary: '40001:Ramadan Peak(1.2000)',
            activityExplanation: '活动因子 1.2000，命中活动：40001:Ramadan Peak(1.2000)',
            shortReason: '近7日 21 件，近30日 60 件，近90日 90 件；生命周期：增长；预测未来30/60/90天约 127 / 253 / 379 件。',
            detail: {
              featureValues: {
                latestFactDate: '2026-05-20',
                historyUnits7: 21,
                historyUnits30: 60,
                historyUnits60: 90,
                historyUnits90: 90,
                observedDays: 90,
                currentStock: 0,
                stockCoverDays: 0.0
              },
              factorBreakdown: {
                baseDailySales: 2.3,
                recentDailyTrendRate: 0.5,
                trendFactor: 1.25,
                lifecycleFactor: 1.22,
                futureFactor: 1.2,
                forecastUnits30: 127,
                forecastUnits60: 253,
                forecastUnits90: 379
              },
              lifecycleExplanation: '增长商品：近期销量高于基线，使用增长因子 1.22。',
              calculationVersion: 'DEFAULT_V1',
              configVersion: 'DEFAULT_V1-ACTIVITY-v2'
            }
          }
        ]
      }
    });
  });

  await page.goto('/data/sales-forecast?devSession=1&devRole=boss&grantSalesForecast=1');

  const workbench = page.getByTestId('sales-forecast-workbench');
  await expect(workbench).toContainText('30天预测');
  await expect(workbench).toContainText('127');

  await page.getByTestId('sales-forecast-window-switch').getByText('60天').click();
  await expect(workbench).toContainText('60天预测');
  await expect(workbench).toContainText('253');
  expect(overviewRequestCount).toBe(1);

  await page.getByRole('button', { name: '详情' }).click();

  const drawer = page.getByTestId('sales-forecast-detail-drawer');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Paper notebook');
  await expect(drawer).toContainText('21 / 60 / 90 / 90');
  await expect(drawer).toContainText('当前库存');
  await expect(drawer).toContainText('0');
  await expect(drawer).toContainText('库存覆盖');
  await expect(drawer).toContainText('断货失真');
  await expect(drawer).toContainText('低置信度');
  await expect(drawer).toContainText('活动影响');
  await expect(drawer).toContainText('Ramadan Peak');
  await expect(drawer).toContainText('趋势因子');
  await expect(drawer).toContainText('1.2500');
  await expect(drawer).toContainText('增长商品');
  await expect(drawer).toContainText('DEFAULT_V1');
});

test('sales forecast workbench filters summary cards view and follow-up marks', async ({ page }) => {
  const rows = [
    {
      partnerSku: 'GROWTH-PSKU',
      sku: 'SKU-GROWTH',
      productTitle: 'Growth notebook',
      latestFactDate: '2026-05-20',
      historyUnits7: 28,
      historyUnits30: 90,
      historyUnits60: 120,
      historyUnits90: 150,
      forecastUnits30: 110,
      forecastUnits60: 220,
      forecastUnits90: 330,
      currentStock: 80,
      stockCoverDays: 26.7,
      lifecycleCode: 'growth',
      lifecycleLabel: '增长',
      confidenceLevel: 'high',
      confidenceLabel: '高',
      confidenceExplanation: '销量样本和库存投影满足 P0 预测要求，置信度高。',
      dataQualityWarnings: [],
      riskLabels: [],
      followUpMarked: false,
      calculationVersion: 'DEFAULT_V1',
      configVersion: 'DEFAULT_V1',
      shortReason: '增长商品预测稳定。',
      detail: null
    },
    {
      partnerSku: 'OVERSTOCK-PSKU',
      sku: 'SKU-OVER',
      productTitle: 'Overstock toy',
      latestFactDate: '2026-05-20',
      historyUnits7: 0,
      historyUnits30: 20,
      historyUnits60: 80,
      historyUnits90: 140,
      forecastUnits30: 20,
      forecastUnits60: 40,
      forecastUnits90: 60,
      currentStock: 260,
      stockCoverDays: 390,
      lifecycleCode: 'decline',
      lifecycleLabel: '衰退',
      confidenceLevel: 'low',
      confidenceLabel: '低',
      confidenceExplanation: '样本不足或存在数据质量问题，预测需人工复核。',
      dataQualityWarnings: ['stale_sales_data'],
      riskLabels: [
        {
          code: 'overstock_risk',
          label: '积压风险',
          severity: 'warning',
          explanation: '库存覆盖偏深且商品处于衰退或长尾期。'
        }
      ],
      followUpMarked: true,
      calculationVersion: 'DEFAULT_V1',
      configVersion: 'DEFAULT_V1',
      shortReason: '衰退且库存覆盖偏深。',
      detail: null
    },
    {
      partnerSku: 'STABLE-PSKU',
      sku: 'SKU-STABLE',
      productTitle: 'Stable pen',
      latestFactDate: '2026-05-20',
      historyUnits7: 7,
      historyUnits30: 30,
      historyUnits60: 60,
      historyUnits90: 90,
      forecastUnits30: 30,
      forecastUnits60: 60,
      forecastUnits90: 90,
      currentStock: 90,
      stockCoverDays: 90,
      lifecycleCode: 'stable',
      lifecycleLabel: '稳定',
      confidenceLevel: 'medium',
      confidenceLabel: '中',
      confidenceExplanation: '缺少当前库存投影，预测置信度降为中。',
      dataQualityWarnings: [],
      riskLabels: [],
      followUpMarked: false,
      calculationVersion: 'DEFAULT_V1',
      configVersion: 'DEFAULT_V1',
      shortReason: '稳定商品保守预测。',
      detail: null
    }
  ];
  let followUpPayload: unknown = null;

  await page.route('**/api/sales-forecast/overview?**', async (route) => {
    await route.fulfill({
      json: {
        state: 'ready',
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        sourceDataDate: '2026-05-20',
        calculatedAt: '2026-05-21T09:30:00',
        calculationVersion: 'DEFAULT_V1',
        configVersion: 'DEFAULT_V1',
        emptyState: null,
        rows
      }
    });
  });
  await page.route('**/api/sales-forecast/follow-ups', async (route) => {
    followUpPayload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        partnerSku: 'OVERSTOCK-PSKU',
        sku: 'SKU-OVER',
        marked: false
      }
    });
  });

  await page.goto('/data/sales-forecast?devSession=1&devRole=boss&grantSalesForecast=1');

  const workbench = page.getByTestId('sales-forecast-workbench');
  await expect(workbench.getByTestId('sales-forecast-row')).toHaveCount(3);
  await expect(page.getByTestId('sales-forecast-summary-total')).toContainText('160');
  await expect(page.getByTestId('sales-forecast-summary-growth')).toContainText('1');
  await expect(page.getByTestId('sales-forecast-summary-risk')).toContainText('1');
  await expect(page.getByTestId('sales-forecast-summary-low-confidence')).toContainText('1');

  await page.getByPlaceholder('搜索标题 / PSKU / SKU').fill('overstock');
  await expect(workbench.getByTestId('sales-forecast-row')).toHaveCount(1);
  await expect(page.getByTestId('sales-forecast-summary-total')).toContainText('20');
  await expect(workbench).toContainText('Overstock toy');

  await page.getByTestId('sales-forecast-risk-filter').click();
  await page.getByTitle('有风险').click();
  await page.getByTestId('sales-forecast-view-switch').getByText('卡片').click();
  await expect(workbench.getByTestId('sales-forecast-card')).toHaveCount(1);
  await expect(workbench.getByTestId('sales-forecast-card')).toContainText('积压风险');

  await page.getByRole('button', { name: '取消重点跟进' }).click();
  expect(followUpPayload).toMatchObject({
    storeCode: 'STR108065-NSA',
    siteCode: 'SA',
    partnerSku: 'OVERSTOCK-PSKU',
    sku: 'SKU-OVER',
    marked: false
  });
  await expect(page.getByRole('button', { name: '标记重点跟进' })).toBeVisible();
});

test('sales forecast workbench recalculates and exports with current filters', async ({ page }) => {
  let recalculateRequestedUrl = '';
  let exportRequestedUrl = '';

  await page.route('**/api/sales-forecast/overview?**', async (route) => {
    await route.fulfill({
      json: {
        state: 'ready',
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        sourceDataDate: '2026-05-20',
        calculatedAt: '2026-05-21T09:30:00',
        calculationVersion: 'DEFAULT_V1',
        configVersion: 'DEFAULT_V1',
        emptyState: null,
        rows: [
          {
            partnerSku: 'PAPER-EXPORT',
            sku: 'SKU-EXPORT',
            productTitle: 'Paper export item',
            latestFactDate: '2026-05-20',
            historyUnits7: 21,
            historyUnits30: 60,
            historyUnits60: 90,
            historyUnits90: 90,
            forecastUnits30: 106,
            forecastUnits60: 211,
            forecastUnits90: 316,
            currentStock: 12,
            stockCoverDays: 6.0,
            lifecycleCode: 'growth',
            lifecycleLabel: '增长',
            confidenceLevel: 'low',
            confidenceLabel: '低',
            confidenceExplanation: '样本不足或存在数据质量问题，预测需人工复核。',
            dataQualityWarnings: [],
            riskLabels: [
              {
                code: 'replenishment_risk',
                label: '补货风险',
                severity: 'danger',
                explanation: '库存覆盖天数偏低，需要优先复核补货。'
              }
            ],
            followUpMarked: false,
            calculationVersion: 'DEFAULT_V1',
            configVersion: 'DEFAULT_V1',
            shortReason: '导出测试行。',
            detail: null
          }
        ]
      }
    });
  });
  await page.route('**/api/sales-forecast/recalculate?**', async (route) => {
    recalculateRequestedUrl = route.request().url();
    await route.fulfill({
      json: {
        runId: 50002,
        status: 'succeeded',
        failureReason: null,
        sourceDataDate: '2026-05-20',
        calculatedAt: '2026-05-21T10:00:00',
        resultCount: 1
      }
    });
  });
  await page.route('**/api/sales-forecast/export?**', async (route) => {
    exportRequestedUrl = route.request().url();
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=UTF-8',
        'Content-Disposition': 'attachment; filename="sales-forecast.csv"'
      },
      body: 'partnerSku,sku\nPAPER-EXPORT,SKU-EXPORT\n'
    });
  });

  await page.goto('/data/sales-forecast?devSession=1&devRole=boss&grantSalesForecast=1');
  await page.getByTestId('sales-forecast-window-switch').getByText('60天').click();
  await page.getByPlaceholder('搜索标题 / PSKU / SKU').fill('paper');
  await page.getByTestId('sales-forecast-risk-filter').click();
  await page.getByTitle('有风险').click();
  await page.getByTestId('sales-forecast-confidence-filter').click();
  await page.getByTitle('低').click();

  await page.getByRole('button', { name: /重\s*算/ }).click();
  await expect(page.getByTestId('sales-forecast-run-status')).toContainText('重算成功');
  expect(recalculateRequestedUrl).toContain('storeCode=STR108065-NSA');
  expect(recalculateRequestedUrl).toContain('siteCode=SA');

  await page.getByRole('button', { name: /导\s*出/ }).click();
  expect(exportRequestedUrl).toContain('forecastWindow=60');
  expect(exportRequestedUrl).toContain('searchKeyword=paper');
  expect(exportRequestedUrl).toContain('riskFilter=risk');
  expect(exportRequestedUrl).toContain('confidenceFilter=low');
});
