import { expect, test } from '@playwright/test';
import { skuPurchaseHistory, storeSyncOverview } from './ali1688-sku-purchase-history.fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
});

test('SKU purchase history keeps the switched store data when the previous store request finishes late', async ({ page }) => {
  const aeHistory = {
    ...skuPurchaseHistory,
    items: [
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-AE-STALE-SKU',
        partnerSku: 'CANMAN-AE-STALE',
        productTitle: 'AE 慢请求商品'
      },
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-AE-STALE-SKU-2',
        partnerSku: 'CANMAN-AE-STALE-2',
        productTitle: 'AE 慢请求商品 2'
      }
    ]
  };
  const saHistory = {
    ...skuPurchaseHistory,
    items: [
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'SA',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-SA-CURRENT-SKU',
        partnerSku: 'CANMAN-SA-CURRENT',
        productTitle: 'SA 当前店铺商品'
      },
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'SA',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-SA-CURRENT-SKU-2',
        partnerSku: 'CANMAN-SA-CURRENT-2',
        productTitle: 'SA 当前店铺商品 2'
      }
    ]
  };
  const requestedSites: string[] = [];
  let releaseAeRequest: (() => void) | undefined;

  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const requestSite = requestUrl.searchParams.get('siteCode') || '';
    requestedSites.push(requestSite);
    if (requestSite === 'AE') {
      await new Promise<void>((resolve) => {
        releaseAeRequest = resolve;
      });
      await route.fulfill({ json: aeHistory });
      return;
    }
    await route.fulfill({ json: saHistory });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('ali1688-sku-purchase-history-page')).toBeVisible();
  await page.getByTestId('global-site-select').click();
  await page.locator('.ant-select-dropdown').getByText('SA', { exact: true }).click();
  await expect.poll(() => requestedSites).toContain('SA');
  await expect(page.getByText('SA 当前店铺商品', { exact: true })).toBeVisible();

  releaseAeRequest?.();

  await expect(page.getByText('SA 当前店铺商品', { exact: true })).toBeVisible();
  await expect(page.getByText('AE 慢请求商品', { exact: true })).toHaveCount(0);
});

test('SKU purchase history replaces previously rendered unlinked rows after switching store', async ({ page }) => {
  const aeHistory = {
    ...skuPurchaseHistory,
    items: [
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-AE-STALE-SKU',
        partnerSku: 'CANMAN-AE-STALE',
        productTitle: 'AE 已渲染商品'
      },
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-AE-STALE-SKU-2',
        partnerSku: 'CANMAN-AE-STALE-2',
        productTitle: 'AE 已渲染商品 2'
      }
    ]
  };
  const saHistory = {
    ...skuPurchaseHistory,
    items: [
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'SA',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-SA-CURRENT-SKU',
        partnerSku: 'CANMAN-SA-CURRENT',
        productTitle: 'SA 切换后商品'
      },
      {
        ...skuPurchaseHistory.items[0],
        storeCode: 'PRJ108065',
        siteCode: 'SA',
        linkStatus: 'unlinked',
        assignmentId: undefined,
        itemId: undefined,
        orderNo: undefined,
        skuParent: 'CANMAN-SA-CURRENT-SKU-2',
        partnerSku: 'CANMAN-SA-CURRENT-2',
        productTitle: 'SA 切换后商品 2'
      }
    ]
  };

  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    const requestUrl = new URL(route.request().url());
    await route.fulfill({ json: requestUrl.searchParams.get('siteCode') === 'SA' ? saHistory : aeHistory });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  await expect(page.getByText('AE 已渲染商品', { exact: true })).toBeVisible();
  await page.getByTestId('global-site-select').click();
  await page.locator('.ant-select-dropdown').getByText('SA', { exact: true }).click();

  await expect(page.getByText('SA 切换后商品', { exact: true })).toBeVisible();
  await expect(page.getByText('SA 切换后商品 2', { exact: true })).toBeVisible();
  await expect(page.getByText('AE 已渲染商品', { exact: true })).toHaveCount(0);
  await expect(page.getByText('AE 已渲染商品 2', { exact: true })).toHaveCount(0);
});
