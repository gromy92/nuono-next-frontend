import type { Page } from '@playwright/test';
import { allProductRows, formatDate, productImage } from './sales-analytics.fixtures';

export async function mockSalesAnalyticsWorkbench(page: Page) {
  let exportRequested = false;
  let lastExportDataQualityCode: string | null = null;
  let classificationOptionsRequested = false;
  let productsRequestDevUserId: string | undefined;
  const detailRequestRanges: Array<{ dateFrom: string | null; dateTo: string | null }> = [];

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
    productsRequestDevUserId = route.request().headers()['x-nuono-dev-session-user-id'];
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
        }
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
  return {
    detailRequestRanges,
    get classificationOptionsRequested() { return classificationOptionsRequested; },
    get exportRequested() { return exportRequested; },
    get lastExportDataQualityCode() { return lastExportDataQualityCode; },
    get productsRequestDevUserId() { return productsRequestDevUserId; }
  };
}
