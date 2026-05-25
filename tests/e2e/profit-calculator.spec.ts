import { expect, Page, test } from '@playwright/test';
import { appPath } from '../utils/navigation';

test.describe('利润计算官方出仓费回显', () => {
  test.beforeEach(async ({ page }) => {
    await mockProfitApis(page);
  });

  test('TC-PROFIT-001 展示官方 FBN 出仓费命中证据', async ({ page }) => {
    await installProfitSession(page);
    await page.goto(appPath('/purchase/profit'));

    await expect(page.getByRole('heading', { name: '利润计算' })).toBeVisible();
    await page.getByRole('button', { name: '计算利润' }).click();

    await expect(page.getByText('官方 FBN 出仓费：6.50 SAR')).toBeVisible();
    await expect(page.getByText(/命中分类：Small Envelope/)).toBeVisible();
    await expect(page.getByText(/来源版本：9001/)).toBeVisible();
    await expect(page.getByText(/计费重量：300 g/)).toBeVisible();
    await expect(page.getByRole('cell', { name: 'FBN 空运利润' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'FBN 海运利润' })).toBeVisible();
  });
});

async function installProfitSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nuono-next-session',
      JSON.stringify({
        userId: 10003,
        accountNo: 'adminBI',
        realName: 'adminBI',
        roleId: 1,
        roleName: '管理员',
        companyName: 'Nuono',
        status: 1,
        level: 0,
        storeCount: 1,
        authorizedStoreCount: 1,
        bindingStatus: 'PROJECT_BOUND',
        defaultOwnerUserId: 10002,
        currentStore: {
          id: 101,
          orgCode: 'ORG-XY',
          orgName: '星耀运营中心',
          projectCode: 'PRJ245027',
          projectName: 'xingyao',
          storeCode: 'STR245027-NAE',
          site: 'AE',
          authorized: true
        },
        userStores: [
          {
            id: 101,
            orgCode: 'ORG-XY',
            orgName: '星耀运营中心',
            projectCode: 'PRJ245027',
            projectName: 'xingyao',
            storeCode: 'STR245027-NAE',
            site: 'AE',
            authorized: true
          }
        ],
        grantedMenus: [
          { menuId: 9300, menuName: '利润计算与上架', urlPath: '/api/sku/cost' }
        ]
      })
    );
  });
}

async function mockProfitApis(page: Page) {
  await page.route('**/api/store-sync/overview?**', async (route) => {
    await route.fulfill({
      json: {
        summary: { totalStores: 0, connectedStores: 0, disconnectedStores: 0 },
        stores: []
      }
    });
  });

  await page.route('**/api/profit/calculate', async (route) => {
    await route.fulfill({
      json: {
        ready: true,
        message: '已按共享利润口径完成测算。',
        title: 'Portable Electric Bakhoor Burner',
        site: 'SA',
        marketCurrency: 'SAR',
        salePrice: 49,
        purchasePrice: 12.5,
        exchangeRate: 1.8833,
        lengthCm: 18,
        widthCm: 8,
        heightCm: 8,
        weightGrams: 280,
        cubeVolumeCbm: 0.0012,
        dimensionalWeightGrams: 230.4,
        warehouseDeliveryFeeRmb: 0.7,
        airFirstLegFeeRmb: 18.2,
        oceanFirstLegFeeRmb: 1.5,
        officialOutboundFee: {
          status: 'CALCULATED',
          message: '已命中官方 FBN 出仓费规则。',
          feeAmount: 6.5,
          currency: 'SAR',
          matchedClassificationName: 'Small Envelope',
          matchedSlabNaturalKey: 'KSA|NOON|FBN|Small Envelope|MIN:0|MAX:500|CUR:SAR|2026-05-01',
          sourceVersionId: 9001,
          evidence: {
            shippingWeightGrams: 300
          }
        },
        notes: ['FBN 出仓费已按已发布官方规则自动计算。'],
        scenarios: [
          {
            code: 'FBN_AIR',
            label: 'FBN 空运利润',
            grossRevenueRmb: 92.28,
            commissionRatePct: 15,
            commissionAmountMarket: 7.35,
            platformFeeAmountMarket: 6.5,
            vatAmountMarket: 2.08,
            platformDeductionRmb: 30,
            settlementRevenueRmb: 62.28,
            purchasePriceRmb: 12.5,
            firstLegFeeRmb: 18.2,
            warehouseDeliveryFeeRmb: 0.7,
            domesticShippingFeeRmb: 2.2,
            fulfillmentFeeRmb: 0,
            totalCostRmb: 63.6,
            profitRmb: 28.68,
            marginRatePct: 31.08
          },
          {
            code: 'FBN_OCEAN',
            label: 'FBN 海运利润',
            grossRevenueRmb: 92.28,
            commissionRatePct: 15,
            commissionAmountMarket: 7.35,
            platformFeeAmountMarket: 6.5,
            vatAmountMarket: 2.08,
            platformDeductionRmb: 30,
            settlementRevenueRmb: 62.28,
            purchasePriceRmb: 12.5,
            firstLegFeeRmb: 1.5,
            warehouseDeliveryFeeRmb: 0.7,
            domesticShippingFeeRmb: 2.2,
            fulfillmentFeeRmb: 0,
            totalCostRmb: 46.9,
            profitRmb: 45.38,
            marginRatePct: 49.18
          }
        ]
      }
    });
  });
}
