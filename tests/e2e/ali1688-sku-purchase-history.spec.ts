import { expect, test } from '@playwright/test';

const storeSyncOverview = {
  mode: 'mock',
  ready: true,
  selectedOwnerId: 307,
  summary: {
    totalStores: 1,
    connectedStores: 1,
    pendingStores: 0,
    managerLinks: 0
  },
  ownerOptions: [],
  stores: [],
  syncedRules: [],
  missingCoreTables: []
};

const skuPurchaseHistory = {
  items: [
    {
      storeCode: 'PRJ108065',
      siteCode: 'AE',
      skuParent: 'CANMAN-AE-SKU-001',
      partnerSku: 'CANMAN-FLOWER-AE',
      pskuCode: 'N123456789A',
      productTitle: '仿真罂粟花束 6 支装 家居装饰',
      productTitleCn: '商品详情中文名：仿真花束套装',
      productImageUrl: 'https://f.nooncdn.com/p/pzsku/Z005EB950196204061C8AZ/45/_/1774429486/canman-flower',
      purchaseCount: 2,
      totalQuantity: '9',
      totalCost: '244.00',
      averageUnitPrice: '27.11',
      recentUnitPrice: '40.00',
      recentPurchaseTime: '2026-05-27 11:20:00',
      lowestUnitPrice: '11.00',
      highestUnitPrice: '40.00',
      amountBasis: 'paid_amount_allocated',
      dataQualityFlags: [],
      history: [
        {
          orderId: 93002,
          assignmentId: 99002,
          orderNo: 'ALI-ORDER-20260527-002',
          orderTime: '2026-05-27 11:20:00',
          supplierName: '义乌诚信通源头工厂',
          assignedQuantity: '5',
          allocatedCost: '200.00',
          unitPrice: '40.00',
          amountBasis: 'paid_amount_allocated',
          priceQuality: 'ok'
        },
        {
          orderId: 93001,
          assignmentId: 99001,
          orderNo: 'ALI-ORDER-20260525-001',
          orderTime: '2026-05-25 10:30:00',
          supplierName: '任丘市溪潼针织机加工厂',
          assignedQuantity: '4',
          allocatedCost: '44.00',
          unitPrice: '11.00',
          amountBasis: 'paid_amount_allocated',
          priceQuality: 'ok'
        },
        {
          orderId: 93003,
          assignmentId: 99003,
          orderNo: 'ALI-ORDER-20260524-003',
          orderTime: '2026-05-24 08:15:00',
          supplierName: '缺失金额样品供应商',
          assignedQuantity: '1',
          allocatedCost: null,
          unitPrice: null,
          amountBasis: null,
          priceQuality: 'missing_price_basis'
        }
      ]
    }
  ],
  unlinkedAssignedLineCount: 1,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 1
  }
};

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l4P0kAAAAABJRU5ErkJggg==',
  'base64'
);

test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
});

test('procurement can inspect SKU purchase history with summary columns and hover history', async ({ page }) => {
  let requestedUrl = '';
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({ json: skuPurchaseHistory });
  });
  await page.route('https://f.nooncdn.com/p/pzsku/**', async (route) => {
    if (route.request().url().endsWith('.jpg')) {
      await route.fulfill({ body: tinyPng, contentType: 'image/png' });
      return;
    }
    await route.fulfill({ status: 404, body: '' });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: 'SKU 采购历史' })).toBeVisible();
  await expect(page.getByTestId('ali1688-sku-purchase-history-page')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '商品信息' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '采购历史' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '采购单价趋势' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '采购总结' })).toBeVisible();

  const keywordBox = page.getByLabel('名称搜索');
  const filterBox = page.locator('.ali1688-sku-purchase-history-query');
  await expect(keywordBox).toBeVisible();
  await expect(page.getByPlaceholder('名称 / SKU')).toBeVisible();
  await expect(page.getByPlaceholder('搜索商品标题 / SKU Parent / Partner SKU / PSKU')).toHaveCount(0);
  await expect(page.getByTestId('sku-purchase-link-status-filter')).toBeVisible();
  await expect(page.getByRole('combobox', { name: '关联' })).toBeVisible();
  await expect(page.getByTestId('sku-purchase-link-status-filter').locator('.ant-segmented')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: '店铺' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: '站点' })).toHaveCount(0);
  const keywordBounds = await keywordBox.boundingBox();
  const dateRangeBounds = await page.getByPlaceholder('采购开始').boundingBox();
  expect(keywordBounds).not.toBeNull();
  expect(await filterBox.boundingBox()).not.toBeNull();
  expect(dateRangeBounds).not.toBeNull();
  expect(keywordBounds!.x).toBeLessThan(dateRangeBounds!.x);

  const productImage = page.getByRole('img', { name: '仿真罂粟花束 6 支装 家居装饰' });
  await expect(productImage).toBeVisible();
  await expect(productImage).toHaveAttribute('src', /canman-flower\.jpg$/);
  await expect(page.getByText('CANMAN-AE-SKU-001')).toBeVisible();
  await expect(page.getByText('PSKU: CANMAN-FLOWER-AE')).toBeVisible();
  await expect(page.getByText('SKU: CANMAN-AE-SKU-001')).toBeVisible();
  await expect(page.getByText('Partner SKU: CANMAN-FLOWER-AE')).toHaveCount(0);
  await expect(page.getByText('店铺: PRJ108065 · AE', { exact: true })).toBeVisible();
  await page.getByText('仿真罂粟花束 6 支装 家居装饰', { exact: true }).hover();
  const titleTooltip = page.locator('.ant-tooltip').filter({ hasText: '商品详情中文名：仿真花束套装' });
  await expect(titleTooltip.getByText('中文名', { exact: true })).toBeVisible();
  await expect(titleTooltip.getByText('商品详情中文名：仿真花束套装', { exact: true })).toBeVisible();
  await expect(page.getByText('采购次数: 2')).toBeVisible();
  await expect(page.getByText('采购总费用: ¥244.00')).toBeVisible();
  await expect(page.getByText('采购总件数: 9')).toBeVisible();
  await expect(page.getByText('平均采购单价: ¥27.11')).toBeVisible();
  await expect(page.getByText('最近采购单价: ¥40.00')).toBeVisible();
  await expect(page.getByTestId('sku-purchase-sparkline-CANMAN-AE-SKU-001')).toBeVisible();
  await expect(page.getByText('1688 未关联纸巾盒')).toHaveCount(0);

  await page.getByTestId('sku-purchase-history-summary-CANMAN-AE-SKU-001').hover();
  const popover = page.locator('.ant-popover');
  await expect(popover.getByText('采购历史摘要')).toBeVisible();
  await expect(popover.getByText('ALI-ORDER-20260527-002', { exact: true })).toBeVisible();
  await expect(popover.getByText('任丘市溪潼针织机加工厂')).toBeVisible();

  expect(new URL(requestedUrl).searchParams.get('storeCode')).toBe('PRJ108065');
  expect(new URL(requestedUrl).searchParams.get('siteCode')).toBe('AE');
  expect(new URL(requestedUrl).searchParams.get('linkStatus')).toBeNull();
});

test('SKU purchase history filters by name and association status', async ({ page }) => {
  const requestedUrls: string[] = [];
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    const requestUrl = route.request().url();
    requestedUrls.push(requestUrl);
    const keyword = new URL(requestUrl).searchParams.get('keyword');
    await route.fulfill({
      json: keyword === 'NO-LINK-SKU'
        ? {
          items: [],
          unlinkedAssignedLineCount: 3,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0
          }
        }
        : skuPurchaseHistory
    });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=operator&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('ali1688-sku-purchase-history-page')).toBeVisible();
  await expect(page.getByPlaceholder('采购开始')).toBeVisible();
  await expect(page.getByPlaceholder('采购结束')).toBeVisible();
  await page.getByLabel('名称搜索').fill('NO-LINK-SKU');
  await page.getByRole('combobox', { name: '关联' }).click();
  await page.getByRole('option', { name: '未关联' }).click();
  await page.getByRole('button', { name: '查询' }).click();

  await expect(page.getByText('当前筛选下没有已关联 SKU 采购历史')).toBeVisible();
  await expect(page.getByText('有 3 条已分配货品行尚未商品关联')).toBeVisible();
  const lastRequestUrl = new URL(requestedUrls[requestedUrls.length - 1]);
  expect(lastRequestUrl.searchParams.get('keyword')).toBe('NO-LINK-SKU');
  expect(lastRequestUrl.searchParams.get('storeCode')).toBe('PRJ108065');
  expect(lastRequestUrl.searchParams.get('siteCode')).toBe('AE');
  expect(lastRequestUrl.searchParams.get('linkStatus')).toBe('unlinked');

  await page.getByRole('combobox', { name: '关联' }).click();
  await page.getByRole('option', { name: '已关联' }).click();
  await page.getByRole('button', { name: '查询' }).click();
  const linkedRequestUrl = new URL(requestedUrls[requestedUrls.length - 1]);
  expect(linkedRequestUrl.searchParams.get('linkStatus')).toBe('linked');

  await page.getByRole('combobox', { name: '关联' }).click();
  await page.getByRole('option', { name: '全部' }).click();
  await page.getByRole('button', { name: '查询' }).click();
  const allRequestUrl = new URL(requestedUrls[requestedUrls.length - 1]);
  expect(allRequestUrl.searchParams.get('linkStatus')).toBeNull();
});

test('user can open the full price trend and return to source order evidence', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    await route.fulfill({ json: skuPurchaseHistory });
  });
  await page.route('**/api/procurement/ali1688-orders/93002**', async (route) => {
    await route.fulfill({
      json: {
        id: '93002',
        orderNo: 'ALI-ORDER-20260527-002',
        orderTime: '2026-05-27 11:20:00',
        supplierName: '义乌诚信通源头工厂',
        paidAmountText: '¥200.00',
        orderStatus: '交易成功',
        items: [
          {
            id: '94002',
            title: '仿真罂粟花束 6 支装 家居装饰',
            quantity: 5,
            amountText: '¥200.00'
          }
        ]
      }
    });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  await page.getByTestId('sku-purchase-sparkline-CANMAN-AE-SKU-001').click();
  const trendDrawer = page.locator('.ant-drawer').filter({ hasText: '采购单价趋势 · CANMAN-AE-SKU-001' });
  await expect(trendDrawer).toBeVisible();
  await expect(trendDrawer.getByText('最高采购单价: ¥40.00')).toBeVisible();
  await expect(trendDrawer.getByText('最低采购单价: ¥11.00')).toBeVisible();
  await expect(trendDrawer.getByRole('cell', { name: 'ALI-ORDER-20260527-002', exact: true })).toBeVisible();
  await expect(trendDrawer.getByRole('cell', { name: 'ALI-ORDER-20260524-003', exact: true })).toBeVisible();
  await expect(trendDrawer.getByText('缺失价格基础')).toBeVisible();

  await trendDrawer.getByRole('button', { name: '查看订单' }).first().click();
  const orderDrawer = page.locator('.ant-drawer').filter({ hasText: '1688 历史订单详情' });
  await expect(orderDrawer).toBeVisible();
  await expect(orderDrawer.getByText('ALI-ORDER-20260527-002')).toBeVisible();
  await expect(orderDrawer.getByText('义乌诚信通源头工厂')).toBeVisible();
});
