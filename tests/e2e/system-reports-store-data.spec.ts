import { expect, test } from '@playwright/test';

test('store data report renders seven vertical chart-first report blocks without store detail tables', async ({ page }) => {
  await page.route('**/api/system-reports/store-data/overview**', async (route) => {
    await route.fulfill({
      json: {
        title: '店铺数据',
        generatedAt: '2026-05-22T17:30:00',
        metrics: [
          { key: 'store_sites', title: '店铺站点', value: 4, unit: '个', state: 'ready' },
          { key: 'site_offers', title: '商品经营面', value: 74, unit: '个', state: 'ready' },
          { key: 'missing_detail_baseline', title: '详情基线缺失', value: 0, unit: '个', state: 'ready' },
          { key: 'missing_sales_facts', title: '销量事实缺失', value: 63, unit: '个', state: 'warning' },
          { key: 'sales_mapping_anomalies', title: '销量映射异常', value: 371, unit: '个', state: 'warning' },
          { key: 'lifecycle_missing', title: '生命周期缺失', value: 58, unit: '个', state: 'warning' }
        ],
        rows: [
          {
            ownerUserId: 10002,
            logicalStoreId: 245027,
            projectCode: 'PRJ245027',
            projectName: 'xingyao',
            storeCode: 'STR245027-NAE',
            siteCode: 'AE',
            siteStatus: 'active',
            siteOfferCount: 37,
            crossStoreOfferCount: 0,
            missingDetailBaselineCount: 0,
            missingTitleEnCount: 13,
            missingDescriptionEnCount: 20,
            missingBrandCount: 13,
            missingProductFulltypeCount: 12,
            missingImageCount: 13,
            offersWithSalesFacts: 11,
            offersWithoutSalesFacts: 26,
            salesProductKeyCount: 14,
            salesKeysWithoutOfferCount: 3,
            salesFactRows: 129,
            latestFactDate: '2026-05-19',
            salesImportBatchCount: 4,
            latestSalesImportStatus: 'imported',
            latestSalesImportedAt: '2026-05-20T08:30:00',
            lifecycleCurrentCount: 16,
            lifecycleMissingCount: 21,
            lifecycleDataInsufficientCount: 12,
            detailState: 'warning',
            salesState: 'warning',
            lifecycleState: 'warning',
            overallState: 'anomaly'
          },
          {
            ownerUserId: 10002,
            logicalStoreId: 245027,
            projectCode: 'PRJ245027',
            projectName: 'xingyao',
            storeCode: 'STR245027-NSA',
            siteCode: 'SA',
            siteStatus: 'active',
            siteOfferCount: 37,
            crossStoreOfferCount: 0,
            missingDetailBaselineCount: 0,
            missingTitleEnCount: 0,
            missingDescriptionEnCount: 0,
            missingBrandCount: 0,
            missingProductFulltypeCount: 0,
            missingImageCount: 0,
            offersWithSalesFacts: 0,
            offersWithoutSalesFacts: 37,
            salesProductKeyCount: 0,
            salesKeysWithoutOfferCount: 0,
            salesFactRows: 0,
            latestFactDate: null,
            salesImportBatchCount: 1,
            latestSalesImportStatus: 'empty',
            latestSalesImportedAt: '2026-05-20T08:30:00',
            lifecycleCurrentCount: 0,
            lifecycleMissingCount: 37,
            lifecycleDataInsufficientCount: 0,
            detailState: 'ready',
            salesState: 'empty',
            lifecycleState: 'incomplete',
            overallState: 'incomplete'
          },
          {
            ownerUserId: 307,
            logicalStoreId: 108065,
            projectCode: 'PRJ108065',
            projectName: 'canman',
            storeCode: 'STR108065-NSA',
            siteCode: 'SA',
            siteStatus: 'active',
            siteOfferCount: 0,
            crossStoreOfferCount: 0,
            missingDetailBaselineCount: 0,
            missingTitleEnCount: 0,
            missingDescriptionEnCount: 0,
            missingBrandCount: 0,
            missingProductFulltypeCount: 0,
            missingImageCount: 0,
            offersWithSalesFacts: 0,
            offersWithoutSalesFacts: 0,
            salesProductKeyCount: 368,
            salesKeysWithoutOfferCount: 368,
            salesFactRows: 7262,
            latestFactDate: '2026-05-19',
            salesImportBatchCount: 2,
            latestSalesImportStatus: 'imported',
            latestSalesImportedAt: '2026-05-20T08:30:00',
            lifecycleCurrentCount: 0,
            lifecycleMissingCount: 0,
            lifecycleDataInsufficientCount: 0,
            detailState: 'empty_store',
            salesState: 'mapping_missing',
            lifecycleState: 'empty_store',
            overallState: 'anomaly'
          },
          {
            ownerUserId: 307,
            logicalStoreId: 244978,
            projectCode: 'PRJ244978',
            projectName: 'chenwu',
            storeCode: 'STR244978-NAE',
            siteCode: 'AE',
            siteStatus: 'active',
            siteOfferCount: 0,
            crossStoreOfferCount: 0,
            missingDetailBaselineCount: 0,
            missingTitleEnCount: 0,
            missingDescriptionEnCount: 0,
            missingBrandCount: 0,
            missingProductFulltypeCount: 0,
            missingImageCount: 0,
            offersWithSalesFacts: 0,
            offersWithoutSalesFacts: 0,
            salesProductKeyCount: 0,
            salesKeysWithoutOfferCount: 0,
            salesFactRows: 0,
            latestFactDate: null,
            salesImportBatchCount: 0,
            latestSalesImportStatus: null,
            latestSalesImportedAt: null,
            lifecycleCurrentCount: 0,
            lifecycleMissingCount: 0,
            lifecycleDataInsufficientCount: 0,
            detailState: 'empty_store',
            salesState: 'empty_store',
            lifecycleState: 'empty_store',
            overallState: 'empty'
          }
        ]
      }
    });
  });

  await page.goto('/system-reports/store-data?devSession=1&devRole=boss&devOwner=xingyao&grantSystemReports=1');

  await expect(page.getByTestId('store-data-report-workbench')).toBeVisible();
  await expect(page.getByTestId('store-data-report-workbench').getByRole('heading', { name: '店铺数据' })).toHaveCount(0);
  await expect(page.getByTestId('store-data-report-workbench')).not.toContainText('系统报表 / 店铺数据');
  await expect(page.getByTestId('store-data-report-overview-section')).not.toContainText('系统店铺数据总览');
  await expect(page.getByTestId('store-data-report-overview-section')).not.toContainText('从系统维度汇总所有店铺站点的数据完整度，账号只控制菜单入口，不裁剪统计范围。');
  await expect(page.getByTestId('store-data-report-overview-section')).toContainText('店铺站点');
  await expect(page.getByTestId('store-data-report-ranking-section')).toContainText('店铺数据健康排行');
  await expect(page.getByTestId('store-data-report-ranking-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-ranking-dimension')).toContainText('销量缺失');
  await expect(page.getByTestId('store-data-report-ranking-limit')).toContainText('Top 10');
  await expect(page.getByTestId('store-data-report-detail-completeness-section')).toContainText('商品详情完整度报表');
  await expect(page.getByTestId('store-data-report-detail-field-mix-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-detail-top-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-sales-coverage-section')).toContainText('销量数据覆盖报表');
  await expect(page.getByTestId('store-data-report-sales-coverage-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-sales-top-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-mapping-anomaly-section')).toContainText('销量映射异常报表');
  await expect(page.getByTestId('store-data-report-mapping-mix-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-mapping-top-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-lifecycle-coverage-section')).toContainText('生命周期计算覆盖报表');
  await expect(page.getByTestId('store-data-report-lifecycle-coverage-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-lifecycle-top-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-empty-store-section')).toContainText('空数据店铺报表');
  await expect(page.getByTestId('store-data-report-empty-store-section')).toContainText('有销量无商品');
  await expect(page.getByTestId('store-data-report-empty-store-chart')).toBeVisible();
  await expect(page.getByTestId('store-data-report-table')).toHaveCount(0);
  await expect(page.getByTestId('store-data-report-workbench').locator('.ant-table')).toHaveCount(0);

  await page.getByTestId('store-data-report-store-filter').click();
  await expect(page.getByTitle('xingyao / AE / STR245027-NAE')).toBeVisible();
  await expect(page.getByTitle('xingyao / SA / STR245027-NSA')).toBeVisible();
  await expect(page.getByTitle('canman / SA / STR108065-NSA')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('store-data-report-ranking-dimension').getByText('生命周期缺失').click();
  await expect(page.getByTestId('store-data-report-ranking-section')).toContainText('生命周期缺失');
});
