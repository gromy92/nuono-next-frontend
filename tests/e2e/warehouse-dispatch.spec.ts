import { expect, test } from '@playwright/test';

test.describe('仓库发运', () => {
  test('可发运商品编辑规格会跳转到商品规格并按当前 PSKU 搜索', async ({ page }) => {
    const productSpecKeywords: Array<string | null> = [];

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'nuono-next-session',
        JSON.stringify({
          userId: 91004,
          accountNo: 'warehouse-spec-editor',
          realName: '仓库规格维护员',
          roleId: 7,
          roleName: '仓管',
          level: 2,
          bindingStatus: 'PROJECT_BOUND',
          currentStore: {
            id: 303,
            projectCode: 'PRJ108065',
            projectName: 'canman',
            storeCode: 'STR108065-NSA',
            site: 'SA',
            authorized: true
          },
          userStores: [
            {
              id: 303,
              projectCode: 'PRJ108065',
              projectName: 'canman',
              storeCode: 'STR108065-NSA',
              site: 'SA',
              authorized: true
            }
          ],
          grantedMenus: [
            { menuId: 9251, menuName: '仓库发运', urlPath: '/warehouse/dispatch' }
          ]
        })
      );
    });

    await page.route('**/api/warehouse/dispatch/receipt-orders**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    await page.route('**/api/warehouse/dispatch/ready-items**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            productVariantId: 1001,
            partnerSku: 'EDIT-SPEC-PSKU',
            skuParent: 'ZEDIT1001',
            productTitle: '待维护规格商品',
            siteCode: 'SA',
            fulfillmentType: 'WAREHOUSE_RECEIPT',
            specStatus: 'SPEC_MISSING',
            availableQuantity: 12,
            sources: [
              {
                fulfillmentBalanceId: 9001,
                sourceStoreCode: 'STR108065-NSA',
                sourceStoreName: 'canman SA',
                purchaseOrderId: 2001,
                purchaseOrderNo: 'PO-EDIT-SPEC',
                purchaseOrderTitle: '编辑规格验收单',
                purchaseOrderItemId: 3001,
                purchaseOrderItemSiteId: 4001,
                plannedTransportMode: 'AIR',
                availableQuantity: 12
              }
            ]
          }
        ])
      });
    });
    await page.route('**/api/warehouse/dispatch/dispatch-plans**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    await page.route('**/api/product-list**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    });
    await page.route('**/api/product-specs?**', async (route) => {
      const url = new URL(route.request().url());
      productSpecKeywords.push(url.searchParams.get('keyword'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          storeCode: 'STR108065-NAE',
          warnings: [],
          items: [
            {
              storeCode: 'STR108065-NAE',
              variantId: 1001,
              title: '待维护规格商品',
              partnerSku: 'EDIT-SPEC-PSKU',
              effectiveSourceId: 10011,
              effectiveSourceType: 'ali1688',
              productLengthCm: 10,
              productWidthCm: 20,
              productHeightCm: 3,
              productWeightG: 120,
              sources: [],
              logisticsProfile: {
                batteryType: 'none',
                electricType: 'none',
                magneticType: 'none',
                liquidType: 'none',
                powderType: 'none',
                woodenMaterialType: 'none',
                bladeWeaponType: 'none',
                manualConfirmRequired: false
              }
            }
          ]
        })
      });
    });

    await page.goto('/warehouse/dispatch?devSession=1&devRole=warehouse&grantWarehouse=1');
    await page.getByRole('tab', { name: /可发运商品/ }).click();
    await page.getByRole('row', { name: /EDIT-SPEC-PSKU/ }).getByRole('button', { name: /编辑.*规格/ }).click();

    await expect(page).toHaveURL(/\/product\/specs/);
    await expect(page.getByPlaceholder('SKU / 标题')).toHaveValue('EDIT-SPEC-PSKU');
    await expect(page.getByText('PSKU EDIT-SPEC-PSKU', { exact: true })).toBeVisible();
    expect(productSpecKeywords.at(-1)).toBe('EDIT-SPEC-PSKU');
  });
});
