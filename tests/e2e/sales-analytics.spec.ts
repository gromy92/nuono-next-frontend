import { expect, test } from '@playwright/test';

import { mockSalesAnalyticsWorkbench } from './sales-analytics.mock';

test('sales analytics opens as a product-list-first workbench with comparison detail tabs and safe missing-data wording', async ({ page }) => {
  const mockState = await mockSalesAnalyticsWorkbench(page);

  await page.goto('/data/sales-analysis?devSession=1&devRole=boss&grantSalesAnalytics=1');

  const workbench = page.getByTestId('sales-analytics-workbench');
  await expect(workbench).toBeVisible();
  await expect.poll(() => mockState.productsRequestDevUserId).toBe('307');
  await expect(workbench.getByRole('heading', { name: '商品销量列表' })).toBeVisible();
  await expect(workbench.getByTestId('sales-product-list-heading')).toContainText('6 个商品');
  await expect(workbench.getByTestId('sales-fact-summary')).toContainText('真实销量最新日 2026-05-19');
  await expect(workbench.getByTestId('sales-fact-summary')).not.toContainText(/ready|就绪|完整|可用/);
  await expect(workbench).not.toContainText('Buy Box');
  await expect(workbench).not.toContainText('高退货率待接入');
  await expect(workbench).not.toContainText('日销量趋势');
  await expect(workbench).not.toContainText('原型');
  await expect(workbench).not.toContainText('按旧需求图');

  await expect(workbench.getByPlaceholder('PSKU / SKU，逗号或换行')).toBeVisible();
  await expect(workbench.getByPlaceholder('中英文标题关键词')).toBeVisible();
  await expect(workbench.getByPlaceholder('类目链接 / 关键词')).toBeVisible();
  await expect(workbench.getByTestId('sales-product-field-filter')).toBeVisible();
  await expect.poll(() => mockState.classificationOptionsRequested).toBe(true);

  const productTable = workbench.getByTestId('sales-analytics-products');
  await expect(productTable).toContainText('商品信息');
  await expect(productTable).toContainText('商品字段');
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
    'sales-column-help-product-fields',
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
  await expect(productTable).not.toContainText(/经营正常|销量就绪/);
  await expect(productTable).toContainText('品牌缺失');
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

  await workbench.getByTestId('sales-product-field-filter').click();
  await page.getByTitle('品牌缺失').click();
  await workbench.getByRole('button', { name: '刷新' }).click();
  await workbench.getByRole('button', { name: '批量导出' }).click();
  await expect.poll(() => mockState.exportRequested).toBe(true);
  await expect.poll(() => mockState.lastExportDataQualityCode).toBe('brand_missing');

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
  const initialDetailRequestCount = mockState.detailRequestRanges.length;
  await detailDialog.getByTestId('sales-detail-range-preset').getByText('最近半年').click();
  await expect.poll(() => mockState.detailRequestRanges.length).toBeGreaterThan(initialDetailRequestCount);
  await expect(detailDialog.getByTestId('sales-trend-data-range')).toContainText('2026-03-25 至 2026-05-23');
  await expect(detailDialog.getByRole('button', { name: '补拉当前范围' })).toHaveCount(0);
  await expect(detailDialog).not.toContainText(/需要历史补全|历史补全已排队|数据完整度/);
  await detailDialog.getByRole('tab', { name: '销量预测' }).click();
  await detailDialog.getByRole('tab', { name: '销量分析' }).click();
  await detailDialog.getByTestId('sales-detail-range-preset').getByText('最近一周').click();
  await expect.poll(() => {
    const latest = mockState.detailRequestRanges.at(-1);
    if (!latest?.dateFrom || !latest.dateTo) return 999;
    const from = new Date(`${latest.dateFrom}T00:00:00Z`).getTime();
    const to = new Date(`${latest.dateTo}T00:00:00Z`).getTime();
    return Math.round((to - from) / 86400000) + 1;
  }).toBeLessThanOrEqual(7);
  await detailDialog.getByTestId('sales-detail-range-preset').getByText('自定义').click();
  await detailDialog.getByTestId('sales-detail-custom-range').locator('input').first().fill('2026-05-19');
  await detailDialog.getByTestId('sales-detail-custom-range').locator('input').nth(1).fill('2026-05-25');
  await page.keyboard.press('Enter');
  await expect.poll(() => mockState.detailRequestRanges.at(-1)?.dateFrom).toBe('2026-05-19');
  await expect.poll(() => mockState.detailRequestRanges.at(-1)?.dateTo).toBe('2026-05-25');
  await detailDialog.getByRole('tab', { name: '销量预测' }).click();
  await expect(detailDialog).toContainText('30天预测');
  await expect(detailDialog).toContainText('筛选范围预测');
  await expect(detailDialog).toContainText('筛选范围实际');
  await expect(detailDialog.getByTestId('sales-analytics-forecast-range-units')).toContainText('5 件');
  await expect(detailDialog.getByTestId('sales-analytics-forecast-range-actual-units')).toContainText('5 件');
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
});
