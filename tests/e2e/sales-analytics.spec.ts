import { expect, test } from '@playwright/test';

const productImage =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function latestCompleteDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 2);
  return date;
}

function halfYearPresetStart() {
  const start = latestCompleteDay();
  start.setMonth(start.getMonth() - 6);
  start.setDate(start.getDate() + 1);
  return start;
}

const productRows = [
  {
    partnerSku: 'MILKYWAYA09',
    sku: 'Z580978E7ED8F9491B50BZ-1',
    productTitle: 'Galaxy Star Projector, Nebula LED Night Light for Room Decor',
    imageUrl: productImage,
    latestFactDate: '2026-05-19',
    sourceSystems: ['noon_productviewsandsalesdata'],
    lifecycleCode: 'stable',
    lifecycleLabel: '稳定',
    lifecycleQualityState: 'ready',
    brand: 'milkyway',
    productFulltype: 'home_decor-lighting-table_lamps',
    dimensionMatched: true,
    dataQualityCodes: ['sales_fact_ready', 'product_dimension_matched'],
    netUnits: 7,
    grossUnits: 7,
    shippedUnits: 7,
    cancelledUnits: 0,
    revenueShipped: 339.99,
    yourVisitors: 77,
    totalVisitors: 224,
    conversionVisitorsPercentage: 34.35,
    currentStock: 21,
    fbnStock: 12,
    supermallStock: 5,
    fbpStock: 4,
    stockCoverDays: 90.0,
    latestNetUnits: 2,
    latestRevenueShipped: 98.5,
    latestYourVisitors: 9,
    latestConversionVisitorsPercentage: 22.63
  },
  {
    partnerSku: 'MILKYWAYA11',
    sku: 'Z3C1F905FC960B005CEF9Z-1',
    productTitle: 'Astronaut Nebula Projector Night Light with Remote Timer',
    imageUrl: productImage,
    latestFactDate: '2026-05-19',
    sourceSystems: ['noon_productviewsandsalesdata'],
    lifecycleCode: 'new',
    lifecycleLabel: '新品',
    lifecycleQualityState: 'ready',
    brand: 'milkyway',
    productFulltype: 'home_decor-lighting-table_lamps',
    dimensionMatched: true,
    dataQualityCodes: ['sales_fact_ready', 'product_dimension_matched'],
    netUnits: 7,
    grossUnits: 7,
    shippedUnits: 7,
    cancelledUnits: 0,
    revenueShipped: 294.6,
    yourVisitors: 102,
    totalVisitors: 486,
    conversionVisitorsPercentage: 20.99,
    currentStock: 20,
    fbnStock: 10,
    supermallStock: 6,
    fbpStock: 4,
    stockCoverDays: 85.7,
    latestNetUnits: 1,
    latestRevenueShipped: 42.09,
    latestYourVisitors: 10,
    latestConversionVisitorsPercentage: 18.2
  },
  {
    partnerSku: 'PAPERSAYB158',
    sku: 'Z6AFDD6F3C5357ACA4590Z-1',
    productTitle: 'Notebook sample product',
    latestFactDate: '2026-05-19',
    sourceSystems: ['noon_productviewsandsalesdata'],
    lifecycleCode: 'data_insufficient',
    lifecycleLabel: '数据不足',
    lifecycleQualityState: 'pv_unresolvable',
    brand: null,
    productFulltype: null,
    dimensionMatched: true,
    dataQualityCodes: ['sales_fact_ready', 'product_dimension_matched', 'brand_missing', 'backend_fulltype_missing'],
    netUnits: 3,
    grossUnits: 4,
    shippedUnits: 3,
    cancelledUnits: 1,
    revenueShipped: 128.12,
    yourVisitors: 65,
    totalVisitors: 160,
    conversionVisitorsPercentage: 18.25,
    latestNetUnits: 1,
    latestRevenueShipped: 41.5,
    latestYourVisitors: 8,
    latestConversionVisitorsPercentage: 11.1
  }
];

const allProductRows = [
  ...productRows,
  ...Array.from({ length: 3 }, (_, index) => ({
    ...productRows[index % productRows.length],
    partnerSku: `EXTRA-PSKU-${index + 1}`,
    sku: `ZEXTRA${index + 1}-1`,
    productTitle: `Extra comparison sample ${index + 1}`,
    netUnits: index + 1,
    yourVisitors: 20 + index
  }))
];

test('sales analytics opens as a product-list-first workbench with comparison detail tabs and safe missing-data wording', async ({ page }) => {
  let exportRequested = false;
  let lastProductsLifecycleCode: string | null = null;
  let lastExportLifecycleCode: string | null = null;
  let lastExportDataQualityCode: string | null = null;
  let classificationOptionsRequested = false;
  let summaryRequestDevUserId: string | undefined;
  let historyBackfillRequested = false;
  let historyBackfillPayload: any = null;
  const detailRequestRanges: Array<{ dateFrom: string | null; dateTo: string | null }> = [];

  await page.route('**/api/sales-data/analytics/summary?**', async (route) => {
    summaryRequestDevUserId = route.request().headers()['x-nuono-dev-session-user-id'];
    await route.fulfill({
      json: {
        netUnits: 17,
        grossUnits: 18,
        shippedUnits: 17,
        cancelledUnits: 1,
        revenueShipped: 762.71,
        yourVisitors: 244,
        totalVisitors: 870,
        conversionVisitorsPercentage: 28.11,
        buyBoxVisitorPercentage: 99.83,
        businessMetricsAvailable: true,
        syncStatus: {
          state: 'ready',
          label: 'ready',
          latestAvailableSalesDate: '2026-05-19',
          businessMetricsAllowed: true
        }
      }
    });
  });
  await page.route('**/api/sales-data/analytics/trends?**', async (route) => {
    await route.fulfill({
      json: [
        { bucketStart: '2026-04-27', bucketLabel: '2026-W18', netUnits: 4, revenueShipped: 120, yourVisitors: 68, conversionVisitorsPercentage: 18.1 },
        { bucketStart: '2026-05-04', bucketLabel: '2026-W19', netUnits: 8, revenueShipped: 340, yourVisitors: 86, conversionVisitorsPercentage: 29.7 },
        { bucketStart: '2026-05-11', bucketLabel: '2026-W20', netUnits: 4, revenueShipped: 204, yourVisitors: 61, conversionVisitorsPercentage: 21.4 }
      ]
    });
  });
  await page.route('**/api/sales-data/analytics/products?**', async (route) => {
    const searchParams = new URL(route.request().url()).searchParams;
    lastProductsLifecycleCode = searchParams.get('lifecycleCode');
    await route.fulfill({ json: allProductRows });
  });
  await page.route('**/api/sales-data/analytics/product-detail?**', async (route) => {
    const searchParams = new URL(route.request().url()).searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    detailRequestRanges.push({
      dateFrom,
      dateTo
    });
    const wantsHistoryBackfill = Boolean(dateFrom && dateFrom < '2026-04-01');
    await route.fulfill({
      json: {
        partnerSku: 'MILKYWAYA09',
        sku: 'Z580978E7ED8F9491B50BZ-1',
        productTitle: 'Galaxy Star Projector, Nebula LED Night Light for Room Decor',
        imageUrl: productImage,
        latestFactDate: '2026-05-19',
        sourceSystems: ['noon_productviewsandsalesdata'],
        currentStock: 21,
        fbnStock: 12,
        supermallStock: 5,
        fbpStock: 4,
        stockCoverDays: 90.0,
        summary: {
          netUnits: 7,
          grossUnits: 7,
          shippedUnits: 7,
          cancelledUnits: 0,
          revenueShipped: 339.99,
          yourVisitors: 77,
          totalVisitors: 224,
          conversionVisitorsPercentage: 34.35
        },
        facts: [
          { factDate: '2026-03-25', sourceSystem: 'noon_productviewsandsalesdata', partnerSku: 'MILKYWAYA09', sku: 'Z580978E7ED8F9491B50BZ-1', netUnits: 0, revenueShipped: 0, yourVisitors: 0, conversionVisitorsPercentage: null },
          { factDate: '2026-05-12', sourceSystem: 'noon_productviewsandsalesdata', partnerSku: 'MILKYWAYA09', sku: 'Z580978E7ED8F9491B50BZ-1', netUnits: 2, revenueShipped: 98.5, yourVisitors: 9, conversionVisitorsPercentage: 22.63 },
          { factDate: '2026-05-19', sourceSystem: 'noon_productviewsandsalesdata', partnerSku: 'MILKYWAYA09', sku: 'Z580978E7ED8F9491B50BZ-1', netUnits: 5, revenueShipped: 241.49, yourVisitors: 68, conversionVisitorsPercentage: 40.11 }
        ],
        priceTrend: [
          { bucketStart: '2026-04-28', bucketLabel: '04-28', avgOfferPrice: 42, minOfferPrice: 42, maxOfferPrice: 42, orderLineCount: 1, currencyCode: 'AED' },
          { bucketStart: '2026-05-06', bucketLabel: '05-06', avgOfferPrice: 51, minOfferPrice: 51, maxOfferPrice: 51, orderLineCount: 2, currencyCode: 'AED' },
          { bucketStart: '2026-05-23', bucketLabel: '05-23', avgOfferPrice: 50, minOfferPrice: 50, maxOfferPrice: 50, orderLineCount: 1, currencyCode: 'AED' }
        ],
        priceTrendState: {
          state: 'ready',
          label: '订单价格已接入',
          message: '当前范围已使用真实订单行生成价格趋势。'
        },
        historyCoverage: wantsHistoryBackfill
          ? {
              requestedDateFrom: dateFrom,
              requestedDateTo: dateTo,
              salesFactDateFrom: '2026-05-01',
              salesFactDateTo: '2026-05-19',
              priceDateFrom: '2026-04-28',
              priceDateTo: '2026-05-23',
              salesFactsFullyCovered: false,
              priceFactsFullyCovered: false,
              backfill: historyBackfillRequested
                ? {
                    state: 'backfill_queued',
                    label: '历史补全已排队',
                    message: '历史补全任务已创建，等待调度执行。',
                    actionAvailable: false,
                    gapIds: [910001, 910002],
                    taskIds: [10001, 10002],
                    categories: ['SALES_PRODUCT_VIEWS', 'SALES_ORDER']
                  }
                : {
                    state: 'needs_backfill',
                    label: '需要历史补全',
                    message: '当前选择范围早于已接入的真实数据，可提交历史补全任务。',
                    actionAvailable: true,
                    gapIds: [],
                    taskIds: [],
                    categories: []
                  }
            }
          : null
      }
    });
  });
  await page.route('**/api/sales-data/analytics/history-backfill', async (route) => {
    historyBackfillPayload = await route.request().postDataJSON();
    historyBackfillRequested = true;
    await route.fulfill({
      json: {
        plannedTaskCount: 2,
        plannedTaskIds: [10001, 10002],
        gapIds: [910001, 910002],
        categories: ['SALES_PRODUCT_VIEWS', 'SALES_ORDER'],
        message: '已提交历史补全任务。'
      }
    });
  });
  await page.route('**/api/sales-forecast/overview?**', async (route) => {
    await route.fulfill({
      json: {
        state: 'ready',
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        sourceDataDate: '2026-05-20',
        calculatedAt: '2026-05-21T09:30:00',
        calculationVersion: 'SALES_FORECAST_V1_4',
        configVersion: 'CALENDAR_FACTOR_CURRENT',
        emptyState: null,
        rows: [
          {
            partnerSku: 'MILKYWAYA09',
            sku: 'Z580978E7ED8F9491B50BZ-1',
            productTitle: 'Galaxy Star Projector, Nebula LED Night Light for Room Decor',
            latestFactDate: '2026-05-20',
            historyUnits7: 7,
            historyUnits30: 21,
            historyUnits60: 45,
            historyUnits90: 72,
            forecastUnits30: 30,
            forecastUnits60: 61,
            forecastUnits90: 93,
            currentStock: 21,
            stockCoverDays: 90.0,
            confidenceLevel: 'medium',
            confidenceLabel: '中',
            confidenceExplanation: '可用自身销量样本少于 60 天，60 天平滑窗口尚未完整。',
            dataQualityWarnings: [],
            riskLabels: [
              {
                code: 'partial_history_window',
                label: '样本窗口不完整',
                severity: 'info',
                explanation: '可用自身销量样本少于 60 天，60 天平滑窗口尚未完整。'
              }
            ],
            calculationVersion: 'SALES_FORECAST_V1_4',
            configVersion: 'CALENDAR_FACTOR_CURRENT',
            shortReason: '按未来120天逐日预测，30/60/90天统计约 30 / 61 / 93 件。'
          }
        ]
      }
    });
  });
  await page.route('**/api/sales-forecast/detail?**', async (route) => {
    const forecastStart = new Date('2026-05-21T00:00:00Z');
    await route.fulfill({
      json: {
        featureValues: {
          latestFactDate: '2026-05-20',
          historyUnits7: 7,
          historyUnits30: 21,
          historyUnits60: 45,
          historyUnits90: 72,
          observedDays: 45,
          currentStock: 21,
          stockCoverDays: 90.0
        },
        factorBreakdown: {
          baseDailySales: 1.0,
          recentDailyTrendRate: 1.0,
          trendFactor: 1.0,
          futureFactor30: 1.0,
          futureFactor60: 1.02,
          futureFactor90: 1.03,
          forecastUnits30: 30,
          forecastUnits60: 61,
          forecastUnits90: 93,
          dailyForecasts: Array.from({ length: 120 }, (_, index) => {
            const forecastDate = new Date(forecastStart);
            forecastDate.setUTCDate(forecastDate.getUTCDate() + index);
            return {
              dayIndex: index + 1,
              forecastDate: formatDate(forecastDate),
              calendarFactor: '1.0000',
              forecastUnits: '1.00000000'
            };
          })
        },
        calculationVersion: 'SALES_FORECAST_V1_4',
        configVersion: 'CALENDAR_FACTOR_CURRENT'
      }
    });
  });
  await page.route('**/api/product-master/classification-options', async (route) => {
    classificationOptionsRequested = true;
    await route.fulfill({
      json: {
        ready: true,
        source: 'product_management',
        warnings: [],
        brands: [{ value: 'milkyway', label: 'milkyway', usageCount: 2 }],
        fulltypes: [{ value: 'home_decor-lighting-table_lamps', label: 'home_decor-lighting-table_lamps', usageCount: 2 }]
      }
    });
  });
  await page.route('**/api/sales-data/analytics/export?**', async (route) => {
    const searchParams = new URL(route.request().url()).searchParams;
    lastExportLifecycleCode = searchParams.get('lifecycleCode');
    lastExportDataQualityCode = searchParams.get('dataQualityCode');
    exportRequested = true;
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/csv;charset=UTF-8',
        'content-disposition': 'attachment; filename="sales-analytics.csv"'
      },
      body: 'factDate,partnerSku,netUnits\n2026-05-19,MILKYWAYA09,7'
    });
  });
  await page.route('**/api/sales-data/activity-windows/active?**', async (route) => {
    await route.fulfill({ json: { windows: [] } });
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
            ownerUserId: 10002,
            logicalStoreId: 245027,
            projectCode: 'PRJ245027',
            projectName: '毕翠红',
            storeCode: 'STR245027-NAE',
            siteCode: 'AE'
          }
        ],
        defaultOwnerUserId: 10002,
        defaultStoreCode: 'STR245027-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });

  await page.goto('/data/sales-analysis?devSession=1&devRole=boss&grantSalesAnalytics=1');

  const workbench = page.getByTestId('sales-analytics-workbench');
  await expect(workbench).toBeVisible();
  await expect.poll(() => summaryRequestDevUserId).toBe('307');
  await expect(workbench.getByRole('heading', { name: '商品销量列表' })).toBeVisible();
  await expect(workbench.getByTestId('sales-product-list-heading')).toContainText('6 个商品');
  await expect(workbench.getByTestId('sales-data-status')).toContainText('真实销量最新日 2026-05-19');
  await expect(workbench.getByTestId('sales-data-status')).not.toContainText('商品图片');
  await expect(workbench.getByTestId('sales-data-status')).toContainText('在途');
  await expect(workbench.getByTestId('sales-data-status')).toContainText('退货率');
  await expect(workbench).not.toContainText('Buy Box');
  await expect(workbench).not.toContainText('高退货率待接入');
  await expect(workbench).not.toContainText('日销量趋势');
  await expect(workbench).not.toContainText('原型');
  await expect(workbench).not.toContainText('按旧需求图');

  await expect(workbench.getByPlaceholder('PSKU / SKU，逗号或换行')).toBeVisible();
  await expect(workbench.getByPlaceholder('中英文标题关键词')).toBeVisible();
  await expect(workbench.getByPlaceholder('类目链接 / 关键词')).toBeVisible();
  await expect(workbench.getByTestId('sales-lifecycle-filter')).toBeVisible();
  await expect(workbench.getByTestId('sales-health-filter')).toBeVisible();
  await expect.poll(() => classificationOptionsRequested).toBe(true);

  const productTable = workbench.getByTestId('sales-analytics-products');
  await expect(productTable).toContainText('商品信息');
  await expect(productTable).toContainText('健康度');
  await expect(productTable).toContainText('访客与转化');
  await expect(productTable).toContainText('销量表现');
  await expect(productTable).toContainText('收入');
  await expect(productTable).toContainText('库存');
  await expect(productTable).toContainText('在途');
  await expect(productTable).toContainText('趋势快照');
  await expect(productTable).toContainText('未来预测');
  await expect(productTable).toContainText('操作');
  for (const helpId of [
    'sales-column-help-product',
    'sales-column-help-health',
    'sales-column-help-traffic',
    'sales-column-help-sales',
    'sales-column-help-revenue',
    'sales-column-help-inventory',
    'sales-column-help-in-transit',
    'sales-column-help-trend-snapshot',
    'sales-column-help-forecast'
  ]) {
    await expect(productTable.getByTestId(helpId).first()).toBeVisible();
  }
  await productTable.getByTestId('sales-column-help-traffic').first().hover();
  await expect(page.getByText('访客为商品详情页访问人数，转化率为订单转化表现。最新日表示该商品最新销量事实日的单日指标；当前范围表示当前筛选日期范围内的汇总指标。')).toBeVisible();
  await productTable.getByText('Galaxy Star Projector, Nebula LED Night Light for Room Decor').first().hover();
  await expect(page.getByText('PSKU MILKYWAYA09')).toBeVisible();
  await expect(page.getByText('SKU Z580978E7ED8F9491B50BZ-1')).toBeVisible();
  await expect(productTable.getByRole('img', { name: /Galaxy Star Projector/ })).toBeVisible();
  await expect(productTable).toContainText('table_lamps');
  await expect(productTable).not.toContainText('home_decor-lighting-table_lamps');
  await expect(productTable).toContainText('访客 9 / 转化 22.63%');
  await expect(productTable).toContainText('访客 77 / 转化 34.35%');
  await expect(productTable).not.toContainText('最新日访客');
  await expect(productTable).not.toContainText('当前范围访客');
  await expect(productTable).toContainText('可售 21');
  await expect(productTable).toContainText('覆盖 90.0天');
  await expect(productTable).toContainText('经营正常');
  await expect(productTable).toContainText('—');
  await expect(productTable.getByRole('button', { name: '详情' }).first()).toBeVisible();
  await expect(productTable.getByRole('button', { name: '调价' })).toHaveCount(0);
  await expect(productTable.getByRole('button', { name: '补货' })).toHaveCount(0);
  await expect(workbench.getByRole('button', { name: '生成补货建议' })).toHaveCount(0);

  const compareButton = workbench.getByRole('button', { name: '对比分析' });
  await expect(compareButton).toBeDisabled();
  await productTable.locator('.ant-table-tbody .ant-checkbox-input').nth(0).check({ force: true });
  await expect(compareButton).toBeDisabled();
  await productTable.locator('.ant-table-tbody .ant-checkbox-input').nth(1).check({ force: true });
  await expect(compareButton).toBeEnabled();
  await compareButton.click();
  const compareDialog = page.getByRole('dialog', { name: '商品横向对比' });
  await expect(compareDialog).toContainText('指标对比');
  await expect(compareDialog).toContainText('趋势对比');
  await expect(compareDialog).toContainText('MILKYWAYA09');
  await expect(compareDialog).toContainText('PV 77');
  await compareDialog.getByRole('tab', { name: '趋势对比' }).click();
  await expect(compareDialog).toContainText('使用当前范围真实销量事实');
  await compareDialog.getByRole('button', { name: 'Close' }).click();
  await expect(compareDialog).toBeHidden();
  await productTable.locator('.ant-table-tbody .ant-checkbox-input').nth(2).click({ force: true });
  await productTable.locator('.ant-table-tbody .ant-checkbox-input').nth(3).click({ force: true });
  await productTable.locator('.ant-table-tbody .ant-checkbox-input').nth(4).click({ force: true });
  await expect(productTable.locator('.ant-table-tbody .ant-checkbox-input').nth(5)).toBeDisabled();

  await workbench.getByTestId('sales-lifecycle-filter').click();
  await page.getByTitle('稳定').click();
  await workbench.getByTestId('sales-health-filter').click();
  await page.getByTitle('品牌缺失').click();
  await workbench.getByRole('button', { name: '刷新' }).click();
  await expect.poll(() => lastProductsLifecycleCode).toBe('stable');
  await workbench.getByRole('button', { name: '批量导出' }).click();
  await expect.poll(() => exportRequested).toBe(true);
  await expect.poll(() => lastExportLifecycleCode).toBe('stable');
  await expect.poll(() => lastExportDataQualityCode).toBe('brand_missing');

  await productTable.getByRole('button', { name: '详情' }).first().click();
  const detailDialog = page.getByRole('dialog', { name: '商品详情' });
  await expect(detailDialog).toContainText('MILKYWAYA09');
  await expect(detailDialog.getByRole('img', { name: /Galaxy Star Projector/ })).toBeVisible();
  await expect(detailDialog).toContainText('milkyway');
  await expect(detailDialog.getByRole('tab', { name: '销量分析' })).toHaveAttribute('aria-selected', 'true');
  await expect(detailDialog).toContainText('销量趋势');
  await expect(detailDialog).toContainText('当前粒度为周');
  await expect(detailDialog.getByTestId('sales-detail-range-preset')).toBeVisible();
  await expect(detailDialog.getByTestId('sales-detail-range-preset')).toContainText('最近一周');
  await expect(detailDialog.getByTestId('sales-detail-range-preset')).toContainText('最近一个月');
  await expect(detailDialog.getByTestId('sales-detail-range-preset')).toContainText('最近半年');
  await expect(detailDialog.getByTestId('sales-detail-range-preset')).toContainText('最近一年');
  await expect(detailDialog.getByTestId('sales-detail-range-preset')).toContainText('自定义');
  await expect(detailDialog.getByTestId('sales-price-trend-state')).toHaveCount(0);
  await expect(detailDialog.getByRole('tab', { name: '价格趋势' })).toHaveCount(0);
  await expect(detailDialog.getByTestId('sales-trend-data-range')).toContainText('2026-03-25 至 2026-05-23');
  const initialDetailRequestCount = detailRequestRanges.length;
  await detailDialog.getByTestId('sales-detail-range-preset').getByText('最近半年').click();
  await expect.poll(() => detailRequestRanges.length).toBeGreaterThan(initialDetailRequestCount);
  const halfYearRequestRange = detailRequestRanges[detailRequestRanges.length - 1];
  await expect(detailDialog.getByTestId('sales-history-coverage-status')).toContainText('需要历史补全');
  await expect(detailDialog.getByTestId('sales-history-coverage-status')).toContainText('销量 2026-05-01 至 2026-05-19');
  await expect(detailDialog.getByTestId('sales-trend-data-range')).toContainText('2026-03-25 至 2026-05-23');
  await expect(detailDialog.getByTestId('sales-trend-data-range')).not.toContainText(formatDate(halfYearPresetStart()));
  await detailDialog.getByRole('button', { name: '触发历史补全' }).click();
  await expect.poll(() => historyBackfillPayload?.dateFrom).toBe(halfYearRequestRange.dateFrom);
  await expect.poll(() => historyBackfillPayload?.dateTo).toBe(halfYearRequestRange.dateTo);
  await expect(detailDialog.getByTestId('sales-history-coverage-status')).toContainText('历史补全已排队');
  await detailDialog.getByTestId('sales-detail-range-preset').getByText('最近一周').click();
  await expect.poll(() => {
    const latest = detailRequestRanges.at(-1);
    if (!latest?.dateFrom || !latest.dateTo) return 999;
    const from = new Date(`${latest.dateFrom}T00:00:00Z`).getTime();
    const to = new Date(`${latest.dateTo}T00:00:00Z`).getTime();
    return Math.round((to - from) / 86400000) + 1;
  }).toBeLessThanOrEqual(7);
  await detailDialog.getByRole('tab', { name: '销量预测' }).click();
  await expect(detailDialog).toContainText('30天预测');
  await expect(detailDialog).toContainText('筛选范围预测');
  await expect(detailDialog).toContainText('筛选范围实际');
  await expect(detailDialog).toContainText('当前库存');
  await expect(detailDialog).toContainText('21 件');
  await expect(detailDialog).toContainText('60天预测');
  await expect(detailDialog).toContainText('90天预测');
  await expect(detailDialog).toContainText('93 件');
  await expect(detailDialog).toContainText('置信度');
  await expect(detailDialog).toContainText('样本窗口不完整');
  await expect(detailDialog.getByTestId('sales-analytics-forecast-daily-chart')).toBeVisible();
  await expect(detailDialog).toContainText('SALES_FORECAST_V1_4');
  await expect(detailDialog).toContainText('预测依据');
  await expect(detailDialog).toContainText('未来120天逐日预测');
  await expect(detailDialog).not.toContainText('置信区间');
  await page.keyboard.press('Escape');
  await expect(detailDialog).toBeHidden();

  await workbench.getByRole('button', { name: '清空筛选' }).click();
  await expect(workbench.getByTestId('sales-lifecycle-filter')).toContainText('商品生命周期');
});

test('sales analytics explains empty selected range when it is newer than the latest available sales fact', async ({ page }) => {
  await page.route('**/api/sales-data/analytics/summary?**', async (route) => {
    await route.fulfill({
      json: {
        netUnits: 0,
        grossUnits: 0,
        shippedUnits: 0,
        cancelledUnits: 0,
        revenueShipped: 0,
        yourVisitors: 0,
        totalVisitors: 0,
        conversionVisitorsPercentage: null,
        businessMetricsAvailable: false,
        syncStatus: {
          state: 'stale',
          label: '数据过期',
          latestAvailableSalesDate: '2026-05-19',
          businessMetricsAllowed: false
        }
      }
    });
  });
  await page.route('**/api/sales-data/analytics/trends?**', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/sales-data/analytics/products?**', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/product-master/classification-options', async (route) => {
    await route.fulfill({
      json: { ready: true, source: 'product_management', warnings: [], brands: [], fulltypes: [] }
    });
  });
  await page.route('**/api/sales-data/activity-windows/active?**', async (route) => {
    await route.fulfill({ json: { windows: [] } });
  });
  await page.route('**/api/sales-data/activity-windows/history?**', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/data/sales-analysis?devSession=1&devRole=boss&grantSalesAnalytics=1');

  const workbench = page.getByTestId('sales-analytics-workbench');
  await expect(workbench.getByTestId('sales-empty-date-range-warning')).toContainText('本地最新销量日是 2026-05-19');
  await expect(workbench.getByTestId('sales-analytics-products')).toContainText('暂无商品销量数据');
});
