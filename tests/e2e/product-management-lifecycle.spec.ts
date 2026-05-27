import { expect, test } from '@playwright/test';

test('product management list shows lifecycle column with evidence popover', async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({
      json: {
        mode: 'local-db',
        ready: true,
        selectedOwnerId: 307,
        summary: {
          totalStores: 1,
          connectedStores: 1,
          pendingStores: 0,
          totalSiteStores: 1,
          connectedSiteStores: 1,
          managerLinks: 1
        },
        ownerOptions: [
          {
            id: 307,
            accountNo: 'boss',
            realName: '毕翠红',
            roleName: '老板',
            companyName: 'canman',
            storeCount: 1,
            authorizedStoreCount: 1,
            bindingStatus: 'PROJECT_BOUND'
          }
        ],
        stores: [
          {
            id: 301,
            projectName: 'canman',
            projectCode: 'PRJ108065',
            storeCode: 'STR108065-NAE',
            siteCount: 1,
            connectedSiteCount: 1,
            isAuthorized: true,
            connectionStatus: '正常',
            siteStores: [{ id: 302, storeCode: 'STR108065-NAE', site: 'AE', isAuthorized: true }],
            managers: [{ id: 307, name: '毕翠红', role: '老板' }]
          }
        ],
        syncedRules: [],
        missingCoreTables: []
      }
    });
  });

  await page.route('**/api/store-sync/init-status?**', async (route) => {
    await route.fulfill({
      json: {
        mode: 'local-db',
        ready: true,
        status: 'READY',
        message: 'ready',
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NAE',
        siteCount: 1,
        uniqueProductCount: 1,
        siteOfferCount: 1,
        progressPercent: 100,
        phaseLabel: 'ready',
        canEnterProductWorkbench: true,
        missingCoreTables: [],
        warnings: [],
        steps: [],
        siteSummaries: [],
        sampleProducts: [],
        productItems: []
      }
    });
  });

  await page.route('**/api/product-master/list', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        source: 'projection-primary',
        warnings: [],
        ownerUserId: 307,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'STR108065-NAE',
        initializationStatus: 'READY',
        totalItems: 1,
        syncedCount: 1,
        draftCount: 0,
        conflictCount: 0,
        failedCount: 0,
        liveCount: 1,
        groupedCount: 0,
        pendingPriceCount: 0,
        historyReadyCount: 0,
        items: [
          {
            skuParent: 'PAPERSAYS065',
            productSourceType: 'SELF_BUILT',
            partnerSku: 'PAPERSAYS065',
            pskuCode: 'ZEA2BC495A97B0328CF53Z-1',
            offerCode: 'OFFER-001',
            referenceStoreCode: 'STR108065-NAE',
            title: 'Glossy White Sticker Paper',
            brand: 'Papersays',
            imageUrl: '',
            galleryImages: [],
            referencePrice: '12.90',
            productFulltype: 'stationery-paper',
            liveStatus: 'LIVE',
            statusCode: 'LIVE',
            isActive: true,
            syncStatus: 'synced',
            lastSyncedAt: '2026-05-19 10:00:00',
            detailBaselineStatus: 'ready',
            detailBaselineSyncedAt: '2026-05-19 10:00:00',
            variantCount: 1,
            siteOfferCount: 1,
            siteLabels: ['AE'],
            liveStatuses: ['LIVE'],
            issueTags: [],
            totalFbnStock: 10,
            totalSupermallStock: 0,
            totalFbpStock: 0,
            viewsCount: 503,
            unitsSold: 102,
            lifecycleState: {
              code: 'stable',
              label: '稳定',
              ruleVersion: 'DEFAULT_V1',
              analysisDate: '2026-05-19',
              listingDate: '2026-04-20',
              listingDateSource: 'sales',
              qualityState: 'ready',
              explanation: '销量/PV 窗口充足，订正后趋势未达到增长、衰退或长尾阈值。',
              evidenceJson:
                '{"reason":"stable_default_v1","correctedRecent30Sales":102,"qualityReasons":["left_truncated_historical_window"]}'
            }
          }
        ]
      }
    });
  });

  await page.goto('/product-manage?devSession=1&devRole=boss');

  await expect(page.getByRole('columnheader', { name: /生命周期/ })).toBeVisible();
  const lifecycleCell = page.getByTestId('product-lifecycle-cell-PAPERSAYS065');
  await expect(lifecycleCell).toContainText('稳定');

  await lifecycleCell.hover();
  await expect(page.getByText('规则版本：DEFAULT_V1')).toBeVisible();
  await expect(page.getByText('上架来源：sales')).toBeVisible();
  await expect(page.getByText('stable_default_v1')).toBeVisible();
});

test('product management local boss dev session defaults to xingyao and sends matching backend session headers', async ({
  page
}) => {
  const requestHeaders: Record<string, string | undefined> = {};

  await page.route('**/api/store-sync/overview**', async (route) => {
    requestHeaders.overviewUserId = route.request().headers()['x-nuono-dev-session-user-id'];
    await route.fulfill({
      json: {
        mode: 'local-db',
        ready: true,
        selectedOwnerId: 10002,
        summary: {
          totalStores: 1,
          connectedStores: 1,
          pendingStores: 0,
          totalSiteStores: 1,
          connectedSiteStores: 1,
          managerLinks: 0
        },
        ownerOptions: [
          {
            id: 10002,
            accountNo: 'xingyaoqw',
            realName: 'xingyao测试店',
            roleName: '老板',
            companyName: 'xingyao',
            storeCount: 1,
            authorizedStoreCount: 1,
            bindingStatus: 'PROJECT_BOUND'
          }
        ],
        stores: [
          {
            id: 28,
            projectName: 'xingyao',
            projectCode: 'PRJ245027',
            storeCode: 'PRJ245027',
            siteCount: 1,
            connectedSiteCount: 1,
            isAuthorized: true,
            connectionStatus: '正常',
            siteStores: [{ id: 30001, storeCode: 'STR245027-NAE', site: 'AE', isAuthorized: true }],
            managers: []
          }
        ],
        syncedRules: [],
        missingCoreTables: []
      }
    });
  });

  await page.route('**/api/store-sync/init-status?**', async (route) => {
    requestHeaders.initStatusUserId = route.request().headers()['x-nuono-dev-session-user-id'];
    await route.fulfill({
      json: {
        mode: 'local-db',
        ready: true,
        status: 'READY',
        message: 'ready',
        ownerUserId: 10002,
        projectName: 'xingyao',
        projectCode: 'PRJ245027',
        storeCode: 'STR245027-NAE',
        siteCount: 1,
        uniqueProductCount: 1,
        siteOfferCount: 1,
        progressPercent: 100,
        phaseLabel: 'ready',
        canEnterProductWorkbench: true,
        missingCoreTables: [],
        warnings: [],
        steps: [],
        siteSummaries: [],
        sampleProducts: [],
        productItems: []
      }
    });
  });

  await page.route('**/api/product-master/list', async (route) => {
    requestHeaders.productListUserId = route.request().headers()['x-nuono-dev-session-user-id'];
    await route.fulfill({
      json: {
        ready: true,
        source: 'projection-primary',
        warnings: [],
        ownerUserId: 10002,
        projectName: 'xingyao',
        projectCode: 'PRJ245027',
        storeCode: 'STR245027-NAE',
        initializationStatus: 'READY',
        totalItems: 1,
        syncedCount: 1,
        draftCount: 0,
        conflictCount: 0,
        failedCount: 0,
        liveCount: 1,
        groupedCount: 0,
        pendingPriceCount: 0,
        historyReadyCount: 0,
        items: [
          {
            skuParent: 'MILKYWAYA05',
            productSourceType: 'SELF_BUILT',
            partnerSku: 'MILKYWAYA05',
            pskuCode: 'SKU-MILKYWAYA05',
            referenceStoreCode: 'STR245027-NAE',
            title: 'Galaxy Projector',
            brand: 'milkyway',
            imageUrl: '',
            galleryImages: [],
            referencePrice: '95.00',
            liveStatus: 'LIVE',
            statusCode: 'LIVE',
            isActive: true,
            syncStatus: 'synced',
            detailBaselineStatus: 'ready',
            variantCount: 1,
            siteOfferCount: 1,
            siteLabels: ['AE'],
            liveStatuses: ['LIVE'],
            issueTags: [],
            lifecycleState: {
              code: 'pending',
              label: '待计算',
              ruleVersion: 'DEFAULT_V1',
              qualityState: 'pending',
              evidenceJson: '{"reason":"lifecycle_not_calculated"}'
            }
          }
        ]
      }
    });
  });

  await page.goto('/product/manage?devSession=1&devRole=boss');

  await expect(page.getByTestId('global-store-select')).toContainText('xingyao');
  await expect(page.getByTestId('product-lifecycle-cell-MILKYWAYA05')).toContainText('待计算');
  expect(requestHeaders.overviewUserId).toBe('10002');
  expect(requestHeaders.initStatusUserId).toBe('10002');
  expect(requestHeaders.productListUserId).toBe('10002');
});
