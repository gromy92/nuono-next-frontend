import { expect, test } from '@playwright/test';
import { buildInitializationPayload, buildStoreOverviewPayload } from './product-management-initialization.fixtures';

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
