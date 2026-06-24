import { expect, Page, test } from '@playwright/test';
import { appPath } from '../utils/navigation';

test.describe('选品池 API 交互', () => {
  test.beforeEach(async ({ page }) => {
    await installSelectionProfitSession(page);
    await installPreOrderProfitApiRoutes(page);
    await page.route('**/api/store-sync/overview**', async (route) => {
      await route.fulfill({
        json: {
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
        }
      });
    });
  });

  test('shows four-column product pool, filters candidates, and recalculates selected product profit', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/pre-order-profit/candidates')) {
        apiRequests.push(request.url());
      }
    });

    await page.goto(appPath('/purchase/pre-order-profit'));

    await expect.poll(() => apiRequests.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: '选品池' })).toBeVisible();
    await expect(page.getByTestId('pre-order-profit-product-pool')).toContainText('SGGRB360');
    await expect(page.getByTestId('pre-order-profit-product-card')).toHaveCount(5);
    await expect.poll(async () => {
      return page.getByTestId('pre-order-profit-product-grid').evaluate((element) => {
        return window.getComputedStyle(element).gridTemplateColumns.split(' ').length;
      });
    }).toBe(4);
    await expect.poll(async () => {
      return page.getByTestId('pre-order-profit-product-card').evaluateAll((cards) => {
        const firstTop = cards[0]?.getBoundingClientRect().top;
        return cards.filter((card) => card.getBoundingClientRect().top === firstTop).length;
      });
    }).toBe(4);
    await page.getByTestId('pre-order-profit-keyword-filter').locator('input').fill('厨房');
    await expect(page.getByTestId('pre-order-profit-product-card')).toHaveCount(2);
    await expect(page.getByTestId('pre-order-profit-product-pool')).toContainText('厨房收纳沥水架');
    await expect(page.getByTestId('pre-order-profit-product-pool')).toContainText('免打孔厨房挂钩');

    await page.getByTestId('pre-order-profit-reset-filters').click();
    await expect(page.getByTestId('pre-order-profit-product-card')).toHaveCount(5);

    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('沙特');
    await expect(page.getByTestId('pre-order-profit-estimated-profit')).toContainText('10.17 SAR');
    await expect(page.getByTestId('pre-order-profit-estimated-margin')).toContainText('18.48%');
    await expect(page.getByTestId('pre-order-profit-target-price')).toContainText('66.75 SAR');

    await page.getByTestId('pre-order-profit-sale-price-input').locator('input').fill('70');

    await expect(page.getByTestId('pre-order-profit-estimated-profit')).toContainText('22.75 SAR');
    await expect(page.getByTestId('pre-order-profit-estimated-margin')).toContainText('32.50%');

    await page.getByTestId('pre-order-profit-target-margin-input').locator('input').fill('35');

    await expect(page.getByTestId('pre-order-profit-target-price')).toContainText('73.58 SAR');
    await expect(page.locator('body')).not.toContainText('是否可选品');
    await expect(page.locator('body')).not.toContainText('通过');
    await expect(page.locator('body')).not.toContainText('不通过');
  });

  test('opens product listing draft from selected candidate', async ({ page }) => {
    await page.goto(appPath('/purchase/pre-order-profit'));

    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('吃饭碗四个勺子四个');
    await page.getByTestId('pre-order-profit-listing-button').click();

    await expect(page).toHaveURL(/\/purchase\/listing\?listingSource=pre-order-profit&sourceCandidateId=260001/);
    await expect(page.getByText('来源：选品池')).toBeVisible();
    await expect(page.getByText('260001')).toBeVisible();
    await expect(page.getByText('吃饭碗四个勺子四个')).toBeVisible();
    await expect(page.getByLabel('新增 PSKU')).toHaveValue('SGGRB360');
  });

  test('creates, edits, and deletes product candidates through API state', async ({ page }) => {
    await page.goto(appPath('/purchase/pre-order-profit'));

    await page.getByTestId('pre-order-profit-create-button').click();
    await expect(page.getByRole('dialog', { name: '新增商品' })).toBeVisible();

    await page.getByTestId('pre-order-profit-modal-title').locator('input').fill('测试厨房漏勺');
    await page.getByTestId('pre-order-profit-modal-sku').locator('input').fill('TEST-LADLE-001');
    await page.getByTestId('pre-order-profit-modal-purchase-url').locator('input').fill('https://detail.1688.com/offer/test.html');
    await page.getByTestId('pre-order-profit-modal-purchase-price').locator('input').fill('12.50');
    await page.getByTestId('pre-order-profit-modal-length').locator('input').fill('18');
    await page.getByTestId('pre-order-profit-modal-width').locator('input').fill('7');
    await page.getByTestId('pre-order-profit-modal-height').locator('input').fill('5');
    await page.getByTestId('pre-order-profit-modal-weight').locator('input').fill('0.18');
    await page.getByTestId('pre-order-profit-modal-sale-price').locator('input').fill('35');
    await page.getByTestId('pre-order-profit-modal-save').click();

    await expect(page.getByTestId('pre-order-profit-product-card')).toHaveCount(6);
    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('测试厨房漏勺');

    await page
      .getByTestId('pre-order-profit-product-card')
      .filter({ hasText: '测试厨房漏勺' })
      .getByTestId('pre-order-profit-edit-product')
      .click();
    await expect(page.getByRole('dialog', { name: '编辑商品' })).toBeVisible();
    await page.getByTestId('pre-order-profit-modal-title').locator('input').fill('测试厨房漏勺改');
    await page.getByTestId('pre-order-profit-modal-sale-price').locator('input').fill('42');
    await page.getByTestId('pre-order-profit-modal-save').click();

    await expect(page.getByTestId('pre-order-profit-product-pool')).toContainText('测试厨房漏勺改');
    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('测试厨房漏勺改');
    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('42.00 SAR');

    await page
      .getByTestId('pre-order-profit-product-card')
      .filter({ hasText: '测试厨房漏勺改' })
      .getByTestId('pre-order-profit-delete-product')
      .click();
    await page.getByRole('button', { name: '确认删除' }).click();

    await expect(page.getByTestId('pre-order-profit-product-card')).toHaveCount(5);
    await expect(page.getByTestId('pre-order-profit-product-pool')).not.toContainText('测试厨房漏勺改');
  });

  test('stores multiple competitors for a candidate through API state', async ({ page }) => {
    await page.goto(appPath('/purchase/pre-order-profit'));

    await expect(page.getByTestId('pre-order-profit-competitor-section')).toContainText('竞品 1');
    await page.getByTestId('pre-order-profit-add-competitor').click();
    await expect(page.getByRole('dialog', { name: '新增竞品' })).toBeVisible();

    await page.getByTestId('pre-order-profit-competitor-title').locator('input').fill('竞品厨房套装');
    await page.getByTestId('pre-order-profit-competitor-url').locator('input').fill('https://www.noon.com/saudi-ar/competitor.html');
    await page.getByTestId('pre-order-profit-competitor-platform').locator('input').fill('Noon');
    await page.getByTestId('pre-order-profit-competitor-price').locator('input').fill('59.90');
    await page.getByTestId('pre-order-profit-competitor-seller').locator('input').fill('Top seller');
    await page.getByTestId('pre-order-profit-competitor-notes').locator('textarea').fill('套装数量接近');
    await page.getByTestId('pre-order-profit-competitor-save').click();

    await expect(page.getByTestId('pre-order-profit-competitor-section')).toContainText('竞品 2');
    await expect(page.getByTestId('pre-order-profit-competitor-section')).toContainText('竞品厨房套装');
    await expect(page.getByTestId('pre-order-profit-product-card').filter({ hasText: 'SGGRB360' })).toContainText('竞品 2');

    await page
      .getByTestId('pre-order-profit-competitor-item')
      .filter({ hasText: '竞品厨房套装' })
      .getByTestId('pre-order-profit-edit-competitor')
      .click();
    await expect(page.getByRole('dialog', { name: '编辑竞品' })).toBeVisible();
    await page.getByTestId('pre-order-profit-competitor-title').locator('input').fill('竞品厨房套装改');
    await page.getByTestId('pre-order-profit-competitor-save').click();

    await expect(page.getByTestId('pre-order-profit-competitor-section')).toContainText('竞品厨房套装改');

    await page
      .getByTestId('pre-order-profit-competitor-item')
      .filter({ hasText: '竞品厨房套装改' })
      .getByTestId('pre-order-profit-delete-competitor')
      .click();
    await page.getByRole('button', { name: '确认删除' }).click();

    await expect(page.getByTestId('pre-order-profit-competitor-section')).toContainText('竞品 1');
    await expect(page.getByTestId('pre-order-profit-competitor-section')).not.toContainText('竞品厨房套装改');
  });

  test('adds candidates to existing or newly created purchase orders', async ({ page }) => {
    await page.goto(appPath('/purchase/pre-order-profit'));

    await page.getByTestId('pre-order-profit-add-to-purchase-order').click();
    await expect(page.getByRole('dialog', { name: '加入采购单' })).toBeVisible();
    await page.getByTestId('pre-order-profit-purchase-order-select').click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('SGGR-0618 备货单').click();
    await page.getByTestId('pre-order-profit-purchase-order-save').click();

    await expect(page.getByTestId('pre-order-profit-purchase-order-section')).toContainText('SGGR-0618 备货单');
    await expect(page.getByTestId('pre-order-profit-product-card').filter({ hasText: 'SGGRB360' })).toContainText(
      '采购单 1'
    );

    await page.getByTestId('pre-order-profit-add-to-purchase-order').click();
    await page.getByTestId('pre-order-profit-purchase-order-select').click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('SGGR-0618 备货单').click();
    await page.getByTestId('pre-order-profit-purchase-order-save').click();
    await expect(page.getByText('已在该采购单中')).toBeVisible();
    await page.locator('.ant-modal-close').click();

    await page.getByTestId('pre-order-profit-product-card').filter({ hasText: '厨房收纳沥水架' }).click();
    await page.getByTestId('pre-order-profit-add-to-purchase-order').click();
    await page.getByTestId('pre-order-profit-new-purchase-order-name').locator('input').fill('AE厨房新品采购单');
    await page.getByTestId('pre-order-profit-new-purchase-order-notes').locator('textarea').fill('从选品池创建');
    await page.getByTestId('pre-order-profit-create-purchase-order').click();

    await expect(page.getByTestId('pre-order-profit-purchase-order-section')).toContainText('AE厨房新品采购单');
    await expect(page.getByTestId('pre-order-profit-product-card').filter({ hasText: '厨房收纳沥水架' })).toContainText(
      '采购单 1'
    );
  });

  test('shows AI mock actions for link parsing, competitor recommendation, analysis, and purchase order suggestion', async ({
    page
  }) => {
    await page.goto(appPath('/purchase/pre-order-profit'));

    await expect(page.getByTestId('pre-order-profit-ai-panel')).toContainText('AI 辅助');
    await page.getByTestId('pre-order-profit-ai-parse-link').click();
    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('AI解析商品');
    await expect(page.getByTestId('pre-order-profit-product-card').filter({ hasText: 'SGGRB360' })).toContainText(
      '采购 ¥15.80'
    );

    await page.getByTestId('pre-order-profit-ai-recommend-competitor').click();
    await expect(page.getByTestId('pre-order-profit-competitor-section')).toContainText('AI推荐竞品');
    await expect(page.getByTestId('pre-order-profit-product-card').filter({ hasText: 'SGGRB360' })).toContainText('竞品 2');

    await page.getByTestId('pre-order-profit-ai-generate-summary').click();
    await expect(page.getByTestId('pre-order-profit-ai-summary')).toContainText('AI 分析');
    await expect(page.getByTestId('pre-order-profit-ai-summary')).toContainText('预估毛利率');

    await page.getByTestId('pre-order-profit-ai-suggest-purchase-order').click();
    await expect(page.getByTestId('pre-order-profit-ai-purchase-order-suggestion')).toContainText('建议加入');
    await expect(page.getByTestId('pre-order-profit-ai-purchase-order-suggestion')).toContainText('SGGR-0618 备货单');
  });

  test('shows missing rules without a complete profit value', async ({ page }) => {
    await page.goto(appPath('/purchase/pre-order-profit'));

    await page.getByTestId('pre-order-profit-product-card').filter({ hasText: '带电宠物互动球' }).click();

    await expect(page.getByTestId('pre-order-profit-analysis')).toContainText('缺规则');
    await expect(page.getByText('缺失项：类目佣金/出舱规则')).toBeVisible();
    await expect(page.getByTestId('pre-order-profit-estimated-profit')).toContainText('-');
    await expect(page.getByTestId('pre-order-profit-target-price')).toContainText('-');
  });
});

async function installSelectionProfitSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nuono-next-session',
      JSON.stringify({
        userId: 307,
        accountNo: 'boss',
        realName: '毕翠红',
        roleId: 2,
        roleName: '老板',
        companyName: 'Nuono',
        status: 1,
        level: 1,
        storeCount: 1,
        authorizedStoreCount: 1,
        bindingStatus: 'PROJECT_BOUND',
        defaultOwnerUserId: 307,
        activeRoleView: 'operator',
        currentStore: {
          id: 108065,
          orgCode: 'ORG-CANMAN',
          orgName: 'canman',
          projectCode: 'PRJ108065',
          projectName: 'canman',
          storeCode: 'STR108065-NSA',
          site: 'SA',
          authorized: true
        },
        userStores: [
          {
            id: 108065,
            orgCode: 'ORG-CANMAN',
            orgName: 'canman',
            projectCode: 'PRJ108065',
            projectName: 'canman',
            storeCode: 'STR108065-NSA',
            site: 'SA',
            authorized: true
          }
        ],
        grantedMenus: [
          { menuId: 2401, menuName: '商品上架', urlPath: '/purchase/listing' },
          { menuId: 9300, menuName: '利润计算与上架', urlPath: '/api/sku/cost' }
        ]
      })
    );
  });
}

type ApiSite = 'SA' | 'AE';

type ApiCompetitor = {
  id: number;
  candidateId: number;
  storeCode: string;
  title: string;
  url: string;
  platform: string;
  siteCode: ApiSite;
  price: number;
  currency: 'SAR' | 'AED';
  sellerName: string;
  notes: string;
};

type ApiPurchaseOrder = {
  id: number;
  storeCode: string;
  siteCode: ApiSite;
  name: string;
  notes: string;
  itemCount: number;
};

type ApiCandidate = {
  id: number;
  storeCode: string;
  siteCode: ApiSite;
  title: string;
  skuHint: string;
  purchaseUrl: string;
  purchasePriceRmb: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  categoryId: string;
  categoryLabel?: string;
  logisticsCarrierId: string;
  logisticsCarrierLabel?: string;
  salePrice: number;
  targetMarginRate: number;
  candidateStatus: string;
  notes: string;
  competitorCount: number;
  purchaseOrderCount: number;
  competitors: ApiCompetitor[];
  purchaseOrders: ApiPurchaseOrder[];
  latestCalculationStatus: string;
  latestCalculation: ReturnType<typeof calculateApiProfit>;
};

async function installPreOrderProfitApiRoutes(page: Page) {
  let nextCandidateId = 260010;
  let nextCompetitorId = 270010;
  let nextPurchaseOrderId = 280010;
  let nextItemId = 290010;
  const purchaseOrders: ApiPurchaseOrder[] = [
    {
      id: 280001,
      storeCode: 'CANMAN',
      siteCode: 'SA',
      name: 'SGGR-0618 备货单',
      notes: '选品池 API 采购单',
      itemCount: 0
    }
  ];
  const orderItems: Array<{ id: number; purchaseOrderId: number; candidateId: number }> = [];
  const candidates: ApiCandidate[] = [
    candidate({
      id: 260001,
      title: '吃饭碗四个勺子四个',
      skuHint: 'SGGRB360',
      purchaseUrl: 'https://detail.1688.com/offer/773237202172.html',
      purchasePriceRmb: 16.5,
      lengthCm: 18,
      widthCm: 16,
      heightCm: 16,
      actualWeightKg: 0.8,
      categoryId: 'home-kitchen-sa',
      siteCode: 'SA',
      logisticsCarrierId: 'et-sa-air-standard',
      salePrice: 55,
      competitors: [
        {
          id: 270001,
          candidateId: 260001,
          storeCode: 'CANMAN',
          title: '陶瓷碗勺组合套装',
          url: 'https://www.noon.com/saudi-ar/kitchen-bowl-set.html',
          platform: 'Noon',
          siteCode: 'SA',
          price: 58,
          currency: 'SAR',
          sellerName: 'Home Store',
          notes: '同类目套装，售价接近'
        }
      ]
    }),
    candidate({
      id: 260002,
      title: '厨房收纳沥水架',
      skuHint: 'CANMAN-AE-042',
      purchaseUrl: 'https://detail.1688.com/offer/761234567890.html',
      purchasePriceRmb: 21.8,
      lengthCm: 28,
      widthCm: 12,
      heightCm: 9,
      actualWeightKg: 0.62,
      categoryId: 'home-storage-ae',
      siteCode: 'AE',
      logisticsCarrierId: 'et-ae-air-standard',
      salePrice: 49,
      competitors: []
    }),
    candidate({
      id: 260003,
      title: '带电宠物互动球',
      skuHint: 'PETS-POWER-001',
      purchaseUrl: 'https://detail.1688.com/offer/709876543210.html',
      purchasePriceRmb: 18.9,
      lengthCm: 9,
      widthCm: 9,
      heightCm: 9,
      actualWeightKg: 0.35,
      categoryId: 'battery-pets-sa',
      siteCode: 'SA',
      logisticsCarrierId: 'et-sa-air-standard',
      salePrice: 39.9,
      competitors: []
    }),
    candidate({
      id: 260004,
      title: '折叠收纳箱三件套',
      skuHint: 'SGGR-STORAGE-118',
      purchaseUrl: 'https://detail.1688.com/offer/741122334455.html',
      purchasePriceRmb: 24.6,
      lengthCm: 34,
      widthCm: 24,
      heightCm: 12,
      actualWeightKg: 1.1,
      categoryId: 'home-kitchen-sa',
      siteCode: 'SA',
      logisticsCarrierId: 'et-sa-sea-standard',
      salePrice: 69,
      competitors: []
    }),
    candidate({
      id: 260005,
      title: '免打孔厨房挂钩',
      skuHint: 'CANMAN-HOOK-009',
      purchaseUrl: 'https://detail.1688.com/offer/752233445566.html',
      purchasePriceRmb: 8.9,
      lengthCm: 16,
      widthCm: 10,
      heightCm: 4,
      actualWeightKg: 0.24,
      categoryId: 'home-storage-ae',
      siteCode: 'AE',
      logisticsCarrierId: 'et-ae-air-standard',
      salePrice: 29,
      competitors: []
    })
  ];

  await page.route('**/api/pre-order-profit/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const parts = url.pathname.split('/').filter(Boolean);
    const tail = parts.slice(parts.indexOf('pre-order-profit') + 1);

    if (tail[0] === 'calculate' && method === 'POST') {
      const body = request.postDataJSON() as Partial<ApiCandidate>;
      await route.fulfill({ json: calculateApiProfit(candidateFromBody(body, nextCandidateId)) });
      return;
    }

    if (tail[0] === 'candidates' && tail.length === 1 && method === 'GET') {
      await route.fulfill({ json: candidates.map((item) => refreshCandidate(item, purchaseOrders, orderItems, false)) });
      return;
    }

    if (tail[0] === 'candidates' && tail.length === 1 && method === 'POST') {
      const body = request.postDataJSON() as Partial<ApiCandidate>;
      const created = candidateFromBody(body, nextCandidateId++);
      candidates.push(refreshCandidate(created, purchaseOrders, orderItems, true));
      await route.fulfill({ json: refreshCandidate(created, purchaseOrders, orderItems, true) });
      return;
    }

    if (tail[0] === 'candidates' && tail.length === 2 && method === 'GET') {
      const found = findCandidate(candidates, tail[1]);
      await route.fulfill({ status: found ? 200 : 404, json: found ? refreshCandidate(found, purchaseOrders, orderItems, true) : {} });
      return;
    }

    if (tail[0] === 'candidates' && tail.length === 2 && method === 'PUT') {
      const found = findCandidate(candidates, tail[1]);
      if (!found) {
        await route.fulfill({ status: 404, json: { message: 'not found' } });
        return;
      }
      const updated = candidateFromBody(request.postDataJSON() as Partial<ApiCandidate>, found.id);
      updated.competitors = found.competitors;
      updated.purchaseOrders = found.purchaseOrders;
      Object.assign(found, updated);
      await route.fulfill({ json: refreshCandidate(found, purchaseOrders, orderItems, true) });
      return;
    }

    if (tail[0] === 'candidates' && tail.length === 2 && method === 'DELETE') {
      const index = candidates.findIndex((item) => String(item.id) === tail[1]);
      if (index >= 0) {
        candidates.splice(index, 1);
      }
      for (let index = orderItems.length - 1; index >= 0; index -= 1) {
        if (String(orderItems[index].candidateId) === tail[1]) {
          orderItems.splice(index, 1);
        }
      }
      await route.fulfill({ json: {} });
      return;
    }

    if (tail[0] === 'candidates' && tail[2] === 'competitors' && tail.length === 3 && method === 'POST') {
      const found = findCandidate(candidates, tail[1]);
      if (!found) {
        await route.fulfill({ status: 404, json: { message: 'not found' } });
        return;
      }
      const body = request.postDataJSON() as Partial<ApiCompetitor>;
      const competitor = competitorFromBody(body, found.id, nextCompetitorId++, found.siteCode);
      found.competitors.push(competitor);
      await route.fulfill({ json: competitor });
      return;
    }

    if (tail[0] === 'candidates' && tail[2] === 'competitors' && tail.length === 4 && method === 'PUT') {
      const found = findCandidate(candidates, tail[1]);
      const competitor = found?.competitors.find((item) => String(item.id) === tail[3]);
      if (!competitor) {
        await route.fulfill({ status: 404, json: { message: 'not found' } });
        return;
      }
      Object.assign(competitor, competitorFromBody(request.postDataJSON() as Partial<ApiCompetitor>, found!.id, competitor.id, found!.siteCode));
      await route.fulfill({ json: competitor });
      return;
    }

    if (tail[0] === 'candidates' && tail[2] === 'competitors' && tail.length === 4 && method === 'DELETE') {
      const found = findCandidate(candidates, tail[1]);
      if (found) {
        found.competitors = found.competitors.filter((item) => String(item.id) !== tail[3]);
      }
      await route.fulfill({ json: {} });
      return;
    }

    if (tail[0] === 'purchase-orders' && tail.length === 1 && method === 'GET') {
      await route.fulfill({ json: purchaseOrders.map((order) => refreshOrder(order, orderItems)) });
      return;
    }

    if (tail[0] === 'purchase-orders' && tail.length === 1 && method === 'POST') {
      const body = request.postDataJSON() as Partial<ApiPurchaseOrder>;
      const order: ApiPurchaseOrder = {
        id: nextPurchaseOrderId++,
        storeCode: body.storeCode || 'CANMAN',
        siteCode: (body.siteCode as ApiSite) || 'SA',
        name: body.name || '未命名采购单',
        notes: body.notes || '',
        itemCount: 0
      };
      purchaseOrders.push(order);
      await route.fulfill({ json: order });
      return;
    }

    if (tail[0] === 'candidates' && tail[2] === 'purchase-orders' && tail.length === 4 && method === 'POST') {
      const candidateId = Number(tail[1]);
      const purchaseOrderId = Number(tail[3]);
      const existing = orderItems.find((item) => item.candidateId === candidateId && item.purchaseOrderId === purchaseOrderId);
      if (existing) {
        await route.fulfill({ json: { itemId: existing.id, candidateId, purchaseOrderId, alreadyLinked: true } });
        return;
      }
      const item = { id: nextItemId++, candidateId, purchaseOrderId };
      orderItems.push(item);
      await route.fulfill({ json: { itemId: item.id, candidateId, purchaseOrderId, alreadyLinked: false } });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Unhandled ${method} ${url.pathname}` } });
  });
}

function candidate(input: Omit<Partial<ApiCandidate>, 'latestCalculation'> & Pick<ApiCandidate, 'id' | 'title' | 'skuHint' | 'purchaseUrl' | 'purchasePriceRmb' | 'lengthCm' | 'widthCm' | 'heightCm' | 'actualWeightKg' | 'categoryId' | 'siteCode' | 'logisticsCarrierId' | 'salePrice' | 'competitors'>): ApiCandidate {
  const item = candidateFromBody(input, input.id);
  item.competitors = input.competitors;
  return refreshCandidate(item, [], [], true);
}

function candidateFromBody(input: Partial<ApiCandidate>, id: number): ApiCandidate {
  const item = {
    id,
    storeCode: input.storeCode || 'CANMAN',
    siteCode: (input.siteCode as ApiSite) || 'SA',
    title: input.title || '未命名商品',
    skuHint: input.skuHint || 'NO-SKU',
    purchaseUrl: input.purchaseUrl || '',
    purchasePriceRmb: Number(input.purchasePriceRmb || 0),
    lengthCm: Number(input.lengthCm || 0),
    widthCm: Number(input.widthCm || 0),
    heightCm: Number(input.heightCm || 0),
    actualWeightKg: Number(input.actualWeightKg || 0),
    categoryId: input.categoryId || 'home-kitchen-sa',
    categoryLabel: input.categoryLabel,
    logisticsCarrierId: input.logisticsCarrierId || 'et-sa-air-standard',
    logisticsCarrierLabel: input.logisticsCarrierLabel,
    salePrice: Number(input.salePrice || 0),
    targetMarginRate: Number(input.targetMarginRate || 0.3),
    candidateStatus: input.candidateStatus || 'DRAFT',
    notes: input.notes || '',
    competitorCount: 0,
    purchaseOrderCount: 0,
    competitors: input.competitors || [],
    purchaseOrders: input.purchaseOrders || [],
    latestCalculationStatus: 'INCOMPLETE_INPUT',
    latestCalculation: calculateApiProfit(input)
  };
  return refreshCandidate(item, [], [], true);
}

function competitorFromBody(input: Partial<ApiCompetitor>, candidateId: number, id: number, siteCode: ApiSite): ApiCompetitor {
  return {
    id,
    candidateId,
    storeCode: input.storeCode || 'CANMAN',
    title: input.title || '未命名竞品',
    url: input.url || '',
    platform: input.platform || 'Noon',
    siteCode: (input.siteCode as ApiSite) || siteCode,
    price: Number(input.price || 0),
    currency: (input.currency as 'SAR' | 'AED') || (siteCode === 'SA' ? 'SAR' : 'AED'),
    sellerName: input.sellerName || '',
    notes: input.notes || ''
  };
}

function refreshCandidate(
  item: ApiCandidate,
  purchaseOrders: ApiPurchaseOrder[],
  orderItems: Array<{ id: number; purchaseOrderId: number; candidateId: number }>,
  includeRelations: boolean
): ApiCandidate {
  const linkedOrderIds = new Set(orderItems.filter((orderItem) => orderItem.candidateId === item.id).map((orderItem) => orderItem.purchaseOrderId));
  const latestCalculation = calculateApiProfit(item);
  return {
    ...item,
    competitorCount: item.competitors.length,
    purchaseOrderCount: linkedOrderIds.size,
    purchaseOrders: includeRelations ? purchaseOrders.filter((order) => linkedOrderIds.has(order.id)).map((order) => refreshOrder(order, orderItems)) : [],
    latestCalculationStatus: latestCalculation.status,
    latestCalculation
  };
}

function refreshOrder(
  order: ApiPurchaseOrder,
  orderItems: Array<{ id: number; purchaseOrderId: number; candidateId: number }>
): ApiPurchaseOrder {
  return {
    ...order,
    itemCount: orderItems.filter((item) => item.purchaseOrderId === order.id).length
  };
}

function findCandidate(candidates: ApiCandidate[], id: string) {
  return candidates.find((item) => String(item.id) === id);
}

function calculateApiProfit(input: Partial<ApiCandidate>) {
  const site = input.siteCode === 'AE' ? { currency: 'AED', taxRate: 0.05, exchangeRate: 1.95 } : { currency: 'SAR', taxRate: 0.15, exchangeRate: 1.8833 };
  const categoryRules = {
    'home-kitchen-sa': { siteCode: 'SA', commissionRate: 0.14, fulfillmentFee: 10 },
    'pets-toys-sa': { siteCode: 'SA', commissionRate: 0.15, fulfillmentFee: 8.5 },
    'home-storage-ae': { siteCode: 'AE', commissionRate: 0.13, fulfillmentFee: 9.8 }
  } as const;
  const logisticsRules = {
    'et-sa-air-standard': { siteCode: 'SA', unitPriceRmbPerKg: 35, divisor: 6000 },
    'et-ae-air-standard': { siteCode: 'AE', unitPriceRmbPerKg: 32, divisor: 6000 },
    'et-sa-sea-standard': { siteCode: 'SA', unitPriceRmbPerKg: 12, divisor: 5000 }
  } as const;
  const categoryRule = categoryRules[input.categoryId as keyof typeof categoryRules];
  const logisticsRule = logisticsRules[input.logisticsCarrierId as keyof typeof logisticsRules];
  const missingFields: string[] = [];
  const missingRules: string[] = [];
  if (!input.purchaseUrl) missingFields.push('PURCHASE_URL');
  if (!input.purchasePriceRmb) missingFields.push('PURCHASE_PRICE_RMB');
  if (!input.lengthCm) missingFields.push('LENGTH_CM');
  if (!input.widthCm) missingFields.push('WIDTH_CM');
  if (!input.heightCm) missingFields.push('HEIGHT_CM');
  if (!input.actualWeightKg) missingFields.push('ACTUAL_WEIGHT_KG');
  if (!input.salePrice) missingFields.push('SALE_PRICE');
  if (!input.categoryId) missingFields.push('CATEGORY_ID');
  if (!input.logisticsCarrierId) missingFields.push('LOGISTICS_CARRIER_ID');
  if (missingFields.length) {
    return baseApiCalculation('INCOMPLETE_INPUT', site.currency, site.taxRate, site.exchangeRate, missingFields, missingRules);
  }
  if (!categoryRule || categoryRule.siteCode !== input.siteCode) missingRules.push('CATEGORY_RULE');
  if (!logisticsRule || logisticsRule.siteCode !== input.siteCode) missingRules.push('LOGISTICS_RULE');
  if (missingRules.length) {
    return baseApiCalculation('MISSING_RULE', site.currency, site.taxRate, site.exchangeRate, missingFields, missingRules);
  }
  const volumeWeightKg = (input.lengthCm! * input.widthCm! * input.heightCm!) / logisticsRule.divisor;
  const billingWeightKg = Math.max(input.actualWeightKg!, volumeWeightKg);
  const purchaseCost = input.purchasePriceRmb! / site.exchangeRate;
  const domesticLogisticsFeeRmb = input.actualWeightKg! * 2;
  const domesticLogisticsFee = domesticLogisticsFeeRmb / site.exchangeRate;
  const firstLegLogisticsFeeRmb = billingWeightKg * logisticsRule.unitPriceRmbPerKg;
  const firstLegLogisticsFee = firstLegLogisticsFeeRmb / site.exchangeRate;
  const taxMultiplier = 1 + site.taxRate;
  const commissionBase = input.salePrice! * categoryRule.commissionRate;
  const commissionFeeTaxIncluded = commissionBase * taxMultiplier;
  const fulfillmentFeeTaxIncluded = categoryRule.fulfillmentFee * taxMultiplier;
  const fixedCost = purchaseCost + domesticLogisticsFee + firstLegLogisticsFee + fulfillmentFeeTaxIncluded;
  const totalCost = fixedCost + commissionFeeTaxIncluded;
  const estimatedProfit = input.salePrice! - totalCost;
  const saleVariableRate = categoryRule.commissionRate * taxMultiplier;
  const breakEvenDenominator = 1 - saleVariableRate;
  const targetDenominator = breakEvenDenominator - Number(input.targetMarginRate || 0.3);
  const formulaIssues = targetDenominator <= 0 ? ['TARGET_MARGIN_DENOMINATOR'] : [];
  return {
    ...baseApiCalculation(formulaIssues.length ? 'INVALID_FORMULA' : 'READY', site.currency, site.taxRate, site.exchangeRate, missingFields, missingRules),
    formulaIssues,
    purchaseCost: round(purchaseCost),
    domesticLogisticsFeeRmb: round(domesticLogisticsFeeRmb, 4),
    domesticLogisticsFee: round(domesticLogisticsFee),
    volumeWeightKg: round(volumeWeightKg, 3),
    billingWeightKg: round(billingWeightKg, 3),
    firstLegLogisticsFeeRmb: round(firstLegLogisticsFeeRmb),
    firstLegLogisticsFee: round(firstLegLogisticsFee),
    commissionBase: round(commissionBase),
    commissionFeeTaxIncluded: round(commissionFeeTaxIncluded),
    fulfillmentFeeBase: round(categoryRule.fulfillmentFee),
    fulfillmentFeeTaxIncluded: round(fulfillmentFeeTaxIncluded),
    totalCost: round(totalCost),
    estimatedProfit: round(estimatedProfit),
    estimatedMarginRatePct: round((estimatedProfit / input.salePrice!) * 100),
    breakEvenSalePrice: breakEvenDenominator > 0 ? round(fixedCost / breakEvenDenominator) : null,
    targetMarginSalePrice: targetDenominator > 0 ? round(fixedCost / targetDenominator) : null,
    costLines: [
      { key: 'procurement', label: '采购成本', amount: round(purchaseCost), currency: site.currency, note: '采购单价 RMB / 固定汇率' },
      { key: 'domestic-logistics', label: '国内物流费', amount: round(domesticLogisticsFee), currency: site.currency, note: '实际重量 kg * 2 RMB/kg' },
      { key: 'first-leg', label: '头程物流成本', amount: round(firstLegLogisticsFee), currency: site.currency, note: '物流商规则' },
      { key: 'commission', label: '平台佣金含税', amount: round(commissionFeeTaxIncluded), currency: site.currency, note: '类目规则' },
      { key: 'fulfillment', label: '出舱/履约费含税', amount: round(fulfillmentFeeTaxIncluded), currency: site.currency, note: '类目规则' }
    ]
  };
}

function baseApiCalculation(
  status: string,
  currency: string,
  taxRate: number,
  exchangeRate: number,
  missingFields: string[],
  missingRules: string[]
) {
  return {
    status,
    currency,
    taxRate,
    exchangeRate,
    missingFields,
    missingRules,
    formulaIssues: [],
    purchaseCost: null,
    domesticLogisticsFeeRmb: null,
    domesticLogisticsFee: null,
    volumeWeightKg: null,
    billingWeightKg: null,
    firstLegLogisticsFeeRmb: null,
    firstLegLogisticsFee: null,
    commissionBase: null,
    commissionFeeTaxIncluded: null,
    fulfillmentFeeBase: null,
    fulfillmentFeeTaxIncluded: null,
    totalCost: null,
    estimatedProfit: null,
    estimatedMarginRatePct: null,
    breakEvenSalePrice: null,
    targetMarginSalePrice: null,
    costLines: []
  };
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
