import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, partialSuccessWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('user can link an assigned 1688 product line to a store SKU', async ({ page }) => {
  let linked = false;
  let linkPayload: any;
  const candidateRequests: string[] = [];
  let unlinkRequested = false;
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [{
    ...workbench.orders[0].items[2],
    assignmentId: 99001,
    assignmentTargetType: 'STORE_SITE',
    assignmentTargetStoreCode: 'PRJ108065',
    assignmentTargetSiteCode: 'AE',
    assignmentBreakdownText: 'PRJ108065 AE 8',
    productLink: undefined
  }];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    const response = JSON.parse(JSON.stringify(workbench));
    if (linked) {
      response.orders[0].items[0].productLink = {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'CM-AE-PARTNER-001',
        pskuCode: 'PSKU-CM-AE-001',
        productTitle: 'canman AE 抽纸盒',
        displayText: '已关联: Z6F6FB9180C80122C7EA5Z'
      };
    }
    await route.fulfill({ json: response });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    const url = new URL(route.request().url());
    candidateRequests.push(url.search);
    const linkStatus = url.searchParams.get('linkStatus') || 'all';
    const linkedCandidate = linkStatus === 'linked';
    await route.fulfill({
      json: [{
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        skuParent: linkedCandidate ? 'CANMAN-AE-SKU-001' : 'CANMAN-AE-SKU-002',
        partnerSku: linkedCandidate ? 'CM-AE-PARTNER-001' : 'CM-AE-PARTNER-002',
        pskuCode: linkedCandidate ? 'PSKU-CM-AE-001' : 'PSKU-CM-AE-002',
        productTitle: linkedCandidate ? '已关联 canman 商品' : '未关联 canman 商品',
        productImageUrl: linkedCandidate ? 'https://example.com/canman-ae-linked.jpg' : 'https://example.com/canman-ae-unlinked.jpg',
        linkStatus: linkedCandidate ? 'linked' : 'unlinked',
        linkedAssignmentCount: linkedCandidate ? 1 : 0
      }]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links', async (route) => {
    linkPayload = route.request().postDataJSON();
    linked = true;
    await route.fulfill({
      json: {
        status: 'linked',
        assignmentId: 99001,
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'CM-AE-PARTNER-001',
        pskuCode: 'PSKU-CM-AE-001',
        productTitle: 'canman AE 抽纸盒',
        displayText: '已关联: CANMAN-AE-SKU-001'
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links/99001/unlink', async (route) => {
    unlinkRequested = true;
    linked = false;
    await route.fulfill({
      json: {
        status: 'unlinked',
        assignmentId: 99001,
        displayText: '未关联'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  const row = page.getByText('已分配样品货品').locator('xpath=ancestor::tr');
  const productCell = row.locator('.ali1688-product-line-main');
  await expect(productCell.getByText('分配信息 canman AE')).toBeVisible();
  await expect(productCell.getByRole('button', { name: '商品关联' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  await expect(row.locator('td').last().getByRole('button', { name: '分配/关联' })).toHaveCount(0);
  await productCell.getByRole('button', { name: '分配/关联' }).click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('已分配样品货品')).toBeVisible();
  await expect.poll(() => candidateRequests[0] || '').toContain('assignmentId=99001');
  await expect.poll(() => new URLSearchParams(candidateRequests[0] || '').get('linkStatus')).toBeNull();
  await expect(dialog.locator('.ali1688-product-link-filter').getByText('全部')).toBeVisible();
  await expect(dialog.getByText('未关联 canman 商品')).toBeVisible();
  await expect(dialog.getByText('PSKU PSKU-CM-AE-002')).toBeVisible();
  await expect(dialog.locator('.ant-avatar-image')).toBeVisible();

  await dialog.locator('.ali1688-product-link-filter').getByText('已关联').click();
  await expect.poll(() => candidateRequests.some((query) => query.includes('linkStatus=linked'))).toBeTruthy();
  await expect(dialog.getByText('已关联 canman 商品')).toBeVisible();

  await dialog.locator('.ali1688-product-link-filter').getByText('未关联').click();
  await expect.poll(() => candidateRequests.filter((query) => query.includes('linkStatus=unlinked')).length).toBeGreaterThan(0);
  await dialog.getByRole('searchbox', { name: '搜索商品' }).fill('CANMAN-AE-SKU-002');
  await dialog.getByText('CANMAN-AE-SKU-002').click();
  await dialog.getByRole('button', { name: '确认关联' }).click();

  await expect.poll(() => linkPayload).toMatchObject({
    assignmentId: 99001,
    skuParent: 'CANMAN-AE-SKU-002',
    partnerSku: 'CM-AE-PARTNER-002',
    pskuCode: 'PSKU-CM-AE-002',
    productTitle: '未关联 canman 商品'
  });
  await expect(page.getByText('已关联: CM-AE-PARTNER-001')).toBeVisible();
  await expect(page.getByText('已关联: Z6F6FB9180C80122C7EA5Z')).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '改关联' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '分配/关联' })).toBeVisible();
  await expect(productCell.getByRole('button', { name: '解除关联' })).toHaveCount(0);
  await productCell.getByRole('button', { name: '分配/关联' }).click();
  await expect(dialog.getByText('当前关联')).toBeVisible();
  await expect(dialog.getByText('已关联: CM-AE-PARTNER-001')).toBeVisible();
  await dialog.getByRole('button', { name: '解除关联' }).click();
  await expect.poll(() => unlinkRequested).toBeTruthy();
  await expect(page.getByText('已关联: CM-AE-PARTNER-001')).toHaveCount(0);
});

test('product link search queries backend instead of filtering only the first candidate page', async ({ page }) => {
  const candidateRequests: string[] = [];
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [{
    ...workbench.orders[0].items[2],
    assignmentId: 99001,
    assignmentTargetType: 'STORE_SITE',
    assignmentTargetStoreCode: 'PRJ108065',
    assignmentTargetSiteCode: 'AE',
    assignmentBreakdownText: 'PRJ108065 AE 8',
    productLink: undefined
  }];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    const url = new URL(route.request().url());
    candidateRequests.push(url.search);
    const keyword = url.searchParams.get('keyword') || '';
    await route.fulfill({
      json: keyword === 'DEEP-SKU-999'
        ? [{
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          skuParent: 'DEEP-SKU-999',
          partnerSku: 'DEEP-PARTNER-999',
          pskuCode: 'PSKU-DEEP-999',
          productTitle: '分页后面的目标商品',
          productImageUrl: 'https://example.com/deep-sku-999.jpg',
          linkStatus: 'unlinked',
          linkedAssignmentCount: 0
        }]
        : [{
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          skuParent: 'FIRST-PAGE-SKU-001',
          partnerSku: 'FIRST-PARTNER-001',
          pskuCode: 'PSKU-FIRST-001',
          productTitle: '默认第一页商品',
          productImageUrl: 'https://example.com/first-page-sku-001.jpg',
          linkStatus: 'unlinked',
          linkedAssignmentCount: 0
        }]
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByText('已分配样品货品').locator('xpath=ancestor::tr').locator('.ali1688-product-line-main')
    .getByRole('button', { name: '分配/关联' })
    .click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('默认第一页商品')).toBeVisible();
  await dialog.getByRole('searchbox', { name: '搜索商品' }).fill('DEEP-SKU-999');

  await expect.poll(() => candidateRequests.some((query) => new URLSearchParams(query).get('keyword') === 'DEEP-SKU-999'))
    .toBeTruthy();
  await expect(dialog.getByText('分页后面的目标商品')).toBeVisible();
  await expect(dialog.getByText('默认第一页商品')).toHaveCount(0);
});

test('boss can link multiple assigned product lines to the same store SKU', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [
    {
      ...workbench.orders[0].items[2],
      id: '94003-A',
      title: '金属油画书签 向日葵',
      assignmentId: 99001,
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 20',
      productLink: undefined
    },
    {
      ...workbench.orders[0].items[2],
      id: '94003-B',
      title: '金属油画书签 睡莲',
      assignmentId: 99002,
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 20',
      productLink: undefined
    }
  ];
  const candidateRequests: string[] = [];
  const linkPayloads: any[] = [];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    const url = new URL(route.request().url());
    candidateRequests.push(url.search);
    await route.fulfill({
      json: [{
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        pskuCode: 'PSKU-PAPER-291',
        productTitle: 'PAPERSAYSB291 书签套装',
        productImageUrl: 'https://example.com/papersaysb291.jpg',
        linkStatus: 'linked',
        linkedAssignmentCount: 1
      }]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links/batch', async (route) => {
    linkPayloads.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        status: 'linked',
        linkedLineCount: 2,
        skuParent: 'CANMAN-AE-SKU-001'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await page.getByLabel('选择 金属油画书签 向日葵').check();
  await page.getByLabel('选择 金属油画书签 睡莲').check();
  await expect(page.getByRole('button', { name: '批量商品关联' })).toHaveCount(0);
  await page.getByRole('button', { name: '批量分配/关联' }).click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('已选 2 条货品行')).toBeVisible();
  await expect.poll(() => candidateRequests[0] || '').toContain('assignmentId=99001');
  await expect.poll(() => new URLSearchParams(candidateRequests[0] || '').get('linkStatus')).toBeNull();
  await expect(dialog.getByText('PAPERSAYSB291 书签套装')).toBeVisible();
  await dialog.getByText('CANMAN-AE-SKU-001').click();
  await dialog.getByRole('button', { name: '确认关联' }).click();

  await expect.poll(() => linkPayloads).toHaveLength(1);
  expect(linkPayloads[0]).toEqual({
    links: [
      expect.objectContaining({
        assignmentId: 99001,
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        pskuCode: 'PSKU-PAPER-291'
      }),
      expect.objectContaining({
        assignmentId: 99002,
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        pskuCode: 'PSKU-PAPER-291'
      })
    ]
  });
});

