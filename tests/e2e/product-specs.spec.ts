import { expect, test } from '@playwright/test';

type DomesticSpecPatch = {
  ali1688?: Record<string, number | undefined>;
  warehouse?: Record<string, number | undefined>;
  noonOfficial?: Record<string, number | undefined>;
};

const completeValues = {
  productLengthCm: 10,
  productWidthCm: 20,
  productHeightCm: 3,
  productWeightG: 120
};

function createSpecRow(
  variantId: number,
  partnerSku: string,
  title: string,
  patch: DomesticSpecPatch = {}
) {
  const ali1688 = { ...completeValues, ...(patch.ali1688 || {}) };
  const warehouse = { ...completeValues, ...(patch.warehouse || {}) };
  const noonOfficial = { ...completeValues, ...(patch.noonOfficial || {}) };
  return {
    storeCode: 'STR108065-NAE',
    variantId,
    title,
    partnerSku,
    effectiveSourceId: variantId * 10 + 1,
    effectiveSourceType: 'ali1688',
    ...ali1688,
    sources: [
      {
        sourceId: variantId * 10 + 1,
        variantId,
        sourceType: 'ali1688',
        ...ali1688
      },
      {
        sourceId: variantId * 10 + 2,
        variantId,
        sourceType: 'warehouse',
        ...warehouse
      },
      {
        sourceId: variantId * 10 + 3,
        variantId,
        sourceType: 'noon_official',
        ...noonOfficial
      }
    ]
  };
}

async function selectCompletenessFilter(page: import('@playwright/test').Page, label: string) {
  await page.getByTestId('product-specs-completeness-filter').locator('.ant-select-selector').click();
  await page.locator('.ant-select-item-option').filter({ hasText: label }).click();
}

test.describe('商品规格', () => {
  test('真实授权店铺账号访问时不把操作人当成 ownerUserId', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'nuono-next-session',
        JSON.stringify({
          userId: 90003,
          accountNo: 'operator-real-store',
          realName: '真实店铺运营',
          roleId: 5,
          roleName: '运营',
          level: 2,
          bindingStatus: 'PROJECT_BOUND',
          currentStore: {
            id: 301,
            projectCode: 'PRJ108065',
            projectName: 'canman',
            storeCode: 'STR108065-NAE',
            site: 'AE',
            authorized: true
          },
          userStores: [
            {
              id: 301,
              projectCode: 'PRJ108065',
              projectName: 'canman',
              storeCode: 'STR108065-NAE',
              site: 'AE',
              authorized: true
            },
            {
              id: 302,
              projectCode: 'PRJ999999',
              projectName: '未授权店铺',
              storeCode: 'STR999999-NAE',
              site: 'AE',
              authorized: false
            }
          ],
          grantedMenus: [
            {
              menuId: 9104,
              menuName: '商品规格',
              urlPath: '/product/specs'
            }
          ]
        })
      );
    });
    const requestedOwnerUserIds: Array<string | null> = [];
    await page.route('**/api/product-specs?**', async (route) => {
      const url = new URL(route.request().url());
      requestedOwnerUserIds.push(url.searchParams.get('ownerUserId'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          ownerUserId: 307,
          storeCode: 'STR108065-NAE',
          warnings: [],
          items: [createSpecRow(1101, 'REAL-STORE-PSKU', 'Real Store Product')]
        })
      });
    });

    await page.goto('/product/specs');

    await expect(page.getByText('PSKU REAL-STORE-PSKU', { exact: true })).toBeVisible();
    await page.getByRole('main').locator('.ant-select-selector').filter({ hasText: 'canman' }).click();
    await expect(page.locator('.ant-select-item-option').filter({ hasText: '未授权店铺' })).toHaveCount(0);
    expect(requestedOwnerUserIds).toEqual([null]);
  });

  test('支持按国内规格缺失和官方尺寸缺失筛选', async ({ page }) => {
    await page.route('**/api/product-specs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          ownerUserId: 307,
          storeCode: 'STR108065-NAE',
          warnings: [],
          items: [
            createSpecRow(1001, 'COMPLETE-PSKU', 'Complete Spec Product'),
            createSpecRow(1002, 'DOMESTIC-MISSING-PSKU', 'Domestic Missing Product', {
              warehouse: { productWeightG: undefined }
            }),
            createSpecRow(1003, 'OFFICIAL-MISSING-PSKU', 'Official Missing Product', {
              noonOfficial: { productHeightCm: undefined }
            }),
            createSpecRow(1004, 'BOTH-MISSING-PSKU', 'Both Missing Product', {
              ali1688: { productWidthCm: undefined },
              noonOfficial: { productLengthCm: undefined }
            })
          ]
        })
      });
    });

    await page.goto('/product/specs?devSession=1&devRole=boss');

    await expect(page.getByText('共 4 条数据')).toBeVisible();
    await expect(page.getByText('PSKU COMPLETE-PSKU', { exact: true })).toBeVisible();

    await selectCompletenessFilter(page, '国内规格缺失');
    await expect(page.getByText('共 2 条数据')).toBeVisible();
    await expect(page.getByText('PSKU DOMESTIC-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU BOTH-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU COMPLETE-PSKU', { exact: true })).toBeHidden();
    await expect(page.getByText('PSKU OFFICIAL-MISSING-PSKU', { exact: true })).toBeHidden();

    await selectCompletenessFilter(page, '官方尺寸缺失');
    await expect(page.getByText('共 2 条数据')).toBeVisible();
    await expect(page.getByText('PSKU OFFICIAL-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU BOTH-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU COMPLETE-PSKU', { exact: true })).toBeHidden();
    await expect(page.getByText('PSKU DOMESTIC-MISSING-PSKU', { exact: true })).toBeHidden();
  });
});
