import { expect, test } from '@playwright/test';

function buildStoreOverviewPayload() {
  return {
    mode: 'local-db',
    ready: true,
    selectedOwnerId: 307,
    summary: {
      totalStores: 1,
      connectedStores: 1,
      pendingStores: 0,
      totalSiteStores: 2,
      connectedSiteStores: 2,
      managerLinks: 0
    },
    ownerOptions: [],
    stores: [
      {
        id: 301,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'PRJ108065',
        siteCount: 2,
        connectedSiteCount: 2,
        isAuthorized: true,
        noonUser: 'canman',
        noonPartnerId: 'PRJ108065',
        connectionStatus: 'CONNECTED',
        siteStores: [
          {
            id: 301,
            storeCode: 'STR108065-NAE',
            site: 'AE',
            isAuthorized: true,
            connectionStatus: 'CONNECTED'
          },
          {
            id: 305,
            storeCode: 'STR108065-NSA',
            site: 'SA',
            isAuthorized: true,
            connectionStatus: 'CONNECTED'
          }
        ],
        managers: []
      }
    ],
    syncedRules: [],
    missingCoreTables: []
  };
}

function buildInitializationPayload(storeCode: string, status: 'FAILED' | 'IDLE' | 'RUNNING' | 'READY') {
  return {
    mode: 'local-db',
    ready: status === 'READY',
    status,
    message:
      status === 'FAILED'
        ? '当前 Noon 账号未授权 canman / PRJ108065：project.list 未返回目标项目；本次不会写入商品正式数据面。'
        : '正在准备当前店铺商品摘要。',
    ownerUserId: 307,
    projectName: 'canman',
    projectCode: 'PRJ108065',
    storeCode,
    siteCount: 2,
    uniqueProductCount: 0,
    siteOfferCount: 0,
    progressPercent: status === 'READY' ? 100 : 50,
    phaseLabel: status === 'READY' ? '已完成' : '准备中',
    canEnterProductWorkbench: status === 'READY',
    missingCoreTables: [],
    warnings: [],
    steps: [],
    siteSummaries: [],
    sampleProducts: [],
    productItems: []
  };
}

test('product list ignores stale failed initialization status after switching site', async ({ page }) => {
  let releaseOldSiteInitialization!: () => void;
  let releaseCurrentSiteInitialization!: () => void;
  let releaseProductListRequests!: () => void;
  const oldSiteInitializationGate = new Promise<void>((resolve) => {
    releaseOldSiteInitialization = resolve;
  });
  const currentSiteInitializationGate = new Promise<void>((resolve) => {
    releaseCurrentSiteInitialization = resolve;
  });
  const productListGate = new Promise<void>((resolve) => {
    releaseProductListRequests = resolve;
  });

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: buildStoreOverviewPayload() });
  });

  await page.route('**/api/store-sync/init-status**', async (route) => {
    const url = new URL(route.request().url());
    const storeCode = url.searchParams.get('storeCode') || '';
    if (storeCode === 'STR108065-NAE') {
      await oldSiteInitializationGate;
      await route.fulfill({ json: buildInitializationPayload(storeCode, 'FAILED') });
      return;
    }

    await currentSiteInitializationGate;
    await route.fulfill({ json: buildInitializationPayload(storeCode, 'RUNNING') });
  });

  await page.route('**/api/product-master/list', async (route) => {
    await productListGate;
    await route.fulfill({
      json: {
        ready: false,
        source: 'workspace-empty',
        message: '商品摘要仍在准备中。',
        warnings: [],
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NSA',
        initializationStatus: 'RUNNING',
        items: []
      }
    });
  });

  await page.goto('/product/manage?devSession=1&devRole=boss');

  await page.getByTestId('global-site-select').click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('SA', { exact: true }).click();

  releaseOldSiteInitialization();

  await expect(page.getByTestId('global-site-select')).toContainText('SA');
  await expect(page.getByText('当前店铺初始化失败')).toHaveCount(0);

  releaseCurrentSiteInitialization();
  releaseProductListRequests();
});

test('dev session keeps the previously selected canman SA site on reload', async ({ page }) => {
  const requestedInitializationStores: string[] = [];

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nuono-next-session',
      JSON.stringify({
        userId: 307,
        accountNo: '毕翠红',
        roleId: 2,
        roleName: '老板',
        bindingStatus: 'PROJECT_BOUND',
        currentStore: {
          storeCode: 'STR108065-NSA',
          site: 'SA'
        }
      })
    );
  });

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: buildStoreOverviewPayload() });
  });

  await page.route('**/api/store-sync/init-status**', async (route) => {
    const url = new URL(route.request().url());
    const storeCode = url.searchParams.get('storeCode') || '';
    requestedInitializationStores.push(storeCode);
    await route.fulfill({ json: buildInitializationPayload(storeCode, storeCode === 'STR108065-NAE' ? 'FAILED' : 'RUNNING') });
  });

  await page.route('**/api/product-master/list', async (route) => {
    await route.fulfill({
      json: {
        ready: false,
        source: 'workspace-empty',
        message: '商品摘要仍在准备中。',
        warnings: [],
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NSA',
        initializationStatus: 'RUNNING',
        items: []
      }
    });
  });

  await page.goto('/product/manage?devSession=1&devRole=boss');

  await expect(page.getByTestId('global-site-select')).toContainText('SA');
  await expect(page.getByText('当前店铺初始化失败')).toHaveCount(0);
  expect(requestedInitializationStores).not.toContain('STR108065-NAE');
});

test('product page does not auto-start initialization when status is idle', async ({ page }) => {
  let initStartRequests = 0;

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nuono-next-session',
      JSON.stringify({
        userId: 307,
        accountNo: '毕翠红',
        roleId: 2,
        roleName: '老板',
        bindingStatus: 'PROJECT_BOUND',
        currentStore: {
          storeCode: 'STR108065-NSA',
          site: 'SA'
        }
      })
    );
  });

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: buildStoreOverviewPayload() });
  });

  await page.route('**/api/store-sync/init-status**', async (route) => {
    await route.fulfill({ json: buildInitializationPayload('STR108065-NSA', 'IDLE') });
  });

  await page.route('**/api/store-sync/init-start', async (route) => {
    initStartRequests += 1;
    await route.fulfill({ status: 500, json: { message: 'init-start should not be called automatically' } });
  });

  await page.route('**/api/product-master/list', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        source: 'projection-primary',
        message: '商品摘要已就绪。',
        warnings: [],
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NSA',
        initializationStatus: 'IDLE',
        totalItems: 1,
        items: [
          {
            skuParent: 'Z6F7379B11ED69CBE6194Z',
            partnerSku: 'PAPERSAYSB132',
            pskuCode: 'a4f5ccf83f4a190ae4c026bfa2831f9a',
            offerCode: 'f448e6c4ca32609c',
            referenceStoreCode: 'STR108065-NSA',
            title: '9-Layer Large Capacity Pencil Case Organizer',
            brand: 'PAPERSAY',
            productFulltype: 'stationery-stationery-pencil_cases',
            referencePrice: '24.90',
            currency: 'SAR',
            liveStatus: 'true',
            isActive: true,
            totalFbnStock: 3,
            totalSupermallStock: 0,
            totalFbpStock: 0,
            siteLabels: ['SA'],
            liveStatuses: ['true'],
            issueTags: []
          }
        ]
      }
    });
  });

  await page.goto('/product/manage?devSession=1&devRole=boss');

  await expect(page.getByText('PAPERSAYSB132')).toBeVisible();
  await page.waitForTimeout(500);
  expect(initStartRequests).toBe(0);
});

test('product list current issues only show official issue tags', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nuono-next-session',
      JSON.stringify({
        userId: 307,
        accountNo: '毕翠红',
        roleId: 2,
        roleName: '老板',
        bindingStatus: 'PROJECT_BOUND',
        currentStore: {
          storeCode: 'STR108065-NSA',
          site: 'SA'
        }
      })
    );
  });

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: buildStoreOverviewPayload() });
  });

  await page.route('**/api/store-sync/init-status**', async (route) => {
    await route.fulfill({ json: buildInitializationPayload('STR108065-NSA', 'READY') });
  });

  await page.route('**/api/product-master/list', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        source: 'projection-primary',
        message: '商品摘要已就绪。',
        warnings: [],
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NSA',
        initializationStatus: 'READY',
        totalItems: 1,
        items: [
          {
            skuParent: 'Z6F7379B11ED69CBE6194Z',
            partnerSku: 'PAPERSAYSB132',
            pskuCode: 'a4f5ccf83f4a190ae4c026bfa2831f9a',
            offerCode: 'f448e6c4ca32609c',
            referenceStoreCode: 'STR108065-NSA',
            title: '9-Layer Large Capacity Pencil Case Organizer',
            brand: 'PAPERSAY',
            productFulltype: '',
            referencePrice: '24.90',
            currency: 'SAR',
            liveStatus: 'true',
            isActive: true,
            totalFbnStock: 3,
            totalSupermallStock: 0,
            totalFbpStock: 0,
            siteLabels: ['SA'],
            liveStatuses: ['true'],
            issueTags: []
          }
        ]
      }
    });
  });

  await page.goto('/product/manage?devSession=1&devRole=boss');

  await expect(page.getByText('PAPERSAYSB132')).toBeVisible();
  await expect(page.getByRole('button', { name: '查看问题' })).toHaveCount(0);
});

test('product catalog toolbar omits search and sync actions while applying filters immediately', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nuono-next-session',
      JSON.stringify({
        userId: 307,
        accountNo: '毕翠红',
        roleId: 2,
        roleName: '老板',
        bindingStatus: 'PROJECT_BOUND',
        currentStore: {
          storeCode: 'STR108065-NSA',
          site: 'SA'
        }
      })
    );
  });

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: buildStoreOverviewPayload() });
  });

  await page.route('**/api/store-sync/init-status**', async (route) => {
    await route.fulfill({ json: buildInitializationPayload('STR108065-NSA', 'READY') });
  });

  await page.route('**/api/product-master/list', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        source: 'projection-primary',
        message: '商品摘要已就绪。',
        warnings: [],
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NSA',
        initializationStatus: 'READY',
        totalItems: 2,
        items: [
          {
            skuParent: 'Z6F7379B11ED69CBE6194Z',
            partnerSku: 'PAPERSAYSB132',
            pskuCode: 'a4f5ccf83f4a190ae4c026bfa2831f9a',
            offerCode: 'f448e6c4ca32609c',
            referenceStoreCode: 'STR108065-NSA',
            title: '9-Layer Large Capacity Pencil Case Organizer',
            brand: 'PAPERSAY',
            productFulltype: 'stationery-stationery-pencil_cases',
            referencePrice: '24.90',
            currency: 'SAR',
            liveStatus: 'true',
            isActive: true,
            totalFbnStock: 3,
            totalSupermallStock: 0,
            totalFbpStock: 0,
            siteLabels: ['SA'],
            liveStatuses: ['true'],
            issueTags: []
          },
          {
            skuParent: 'Z2OTHER',
            partnerSku: 'OTHER123',
            pskuCode: 'other-psku',
            offerCode: 'other-offer',
            referenceStoreCode: 'STR108065-NSA',
            title: 'Kitchen Storage Box',
            brand: 'CANMAN',
            productFulltype: 'home-home-storage',
            referencePrice: '12.90',
            currency: 'SAR',
            liveStatus: 'true',
            isActive: true,
            totalFbnStock: 1,
            totalSupermallStock: 0,
            totalFbpStock: 0,
            siteLabels: ['SA'],
            liveStatuses: ['true'],
            issueTags: []
          }
        ]
      }
    });
  });

  await page.goto('/product/manage?devSession=1&devRole=boss');

  await expect(page.getByText('PAPERSAYSB132')).toBeVisible();
  await expect(page.getByText('OTHER123')).toBeVisible();
  await expect(page.getByRole('button', { name: /搜索/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /同步商品/ })).toHaveCount(0);

  await page.getByPlaceholder('品牌关键词').fill('PAPERSAY');

  await expect(page.getByText('PAPERSAYSB132')).toBeVisible();
  await expect(page.getByText('OTHER123')).toHaveCount(0);
  await expect(page.getByText('共 2 个商品 · 当前显示 1')).toBeVisible();
});
