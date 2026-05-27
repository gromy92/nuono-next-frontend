import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright-core';

const OWNER_USER_ID = 10002;
const STORE_CODE = 'STR245027-NAE';

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean);

const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  throw new Error('未找到可用浏览器，请设置 PLAYWRIGHT_CHROMIUM_PATH。');
}

async function resolveBaseUrl() {
  if (process.env.PRODUCT_PUBLISH_STATUS_BASE_URL) {
    return process.env.PRODUCT_PUBLISH_STATUS_BASE_URL.replace(/\/$/, '');
  }

  for (const candidate of ['http://127.0.0.1:9620', 'http://localhost:9620']) {
    try {
      const response = await fetch(`${candidate}/product/manage?devSession=1`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(1500)
      });
      if (response.ok) {
        return candidate;
      }
    } catch {
      // Try the next known local dev URL.
    }
  }
  throw new Error('商品管理前端服务未启动，请先运行 pnpm dev --host 127.0.0.1 --port 9620。');
}

function productItem(overrides) {
  return {
    skuParent: 'ZPUBLISH001',
    referenceStoreCode: STORE_CODE,
    productSourceType: 'SELF_BUILT',
    partnerSku: 'PUBLISH-HISTORY-001',
    pskuCode: 'PSKU-PUBLISH-001',
    offerCode: 'OFFER-PUBLISH-001',
    title: '历史校验商品',
    brand: 'milkyway',
    imageUrl: 'https://img.example.com/product.jpg',
    galleryImages: ['https://img.example.com/product.jpg'],
    currency: 'AED',
    referencePrice: '48.00',
    salePrice: '39.90',
    productFulltype: 'home_decor-lighting-table_lamps',
    liveStatus: 'LIVE',
    statusCode: 'LIVE',
    isActive: true,
    syncStatus: 'synced',
    lastSyncedAt: '2026-05-20 09:30:00',
    detailBaselineStatus: 'ready',
    detailBaselineMessage: '详情基线已准备。',
    detailBaselineSyncedAt: '2026-05-20 09:30:00',
    variantCount: 1,
    siteOfferCount: 1,
    historyMetaReady: true,
    visibleKeyContentHistoryCount: 1,
    pendingKeyContentHistoryCount: 0,
    siteLabels: ['AE'],
    liveStatuses: ['LIVE'],
    issueTags: [],
    totalFbnStock: 8,
    totalSupermallStock: 1,
    totalFbpStock: 3,
    ...overrides
  };
}

const changedSize = {
  domain: 'sizes',
  field: 'sellerSize',
  label: 'Seller Size',
  before: 'M',
  after: 'L'
};

const listPayload = {
  ready: true,
  source: 'projection-primary',
  message: '商品摘要已就绪。',
  warnings: [],
  ownerUserId: OWNER_USER_ID,
  storeCode: STORE_CODE,
  initializationStatus: 'READY',
  totalItems: 2,
  syncedCount: 2,
  draftCount: 0,
  conflictCount: 0,
  failedCount: 0,
  liveCount: 2,
  groupedCount: 0,
  pendingPriceCount: 0,
  historyReadyCount: 1,
  items: [
    productItem({
      skuParent: 'ZPUBLISH001',
      title: '历史校验商品',
      lastPublishTask: {
        taskId: 64001,
        status: 'pending_manual_check',
        statusLabel: '待人工核对',
        resultText: 'Noon 多轮回读仍未确认【尺码】已生效。诺诺草稿已保留，请在官方后台核对。',
        submittedAt: '2026-05-20 10:10:00',
        finishedAt: '2026-05-20 10:15:00',
        targetSiteCode: STORE_CODE,
        pskuCode: 'PSKU-PUBLISH-001',
        partnerSku: 'PUBLISH-HISTORY-001',
        changes: [changedSize]
      }
    }),
    productItem({
      skuParent: 'ZEMPTY001',
      title: '无发布任务商品',
      partnerSku: 'NO-PUBLISH-001',
      pskuCode: 'PSKU-EMPTY-001',
      offerCode: 'OFFER-EMPTY-001',
      visibleKeyContentHistoryCount: 0,
      lastPublishTask: undefined
    })
  ]
};

const historyPayload = {
  ready: true,
  source: 'history-projection',
  message: '已读取商品修改历史明细。',
  warnings: [],
  listSummary: listPayload.items[0],
  visibleKeyContentHistoryCount: 1,
  pendingKeyContentHistoryCount: 0,
  historyItems: [
    {
      historyKind: 'modification',
      source: 'publish_task',
      taskId: 64001,
      actionType: 'publish-current',
      resultStatus: 'pending_manual_check',
      statusLabel: '待人工核对',
      message: 'Noon 多轮回读仍未确认【尺码】已生效。诺诺草稿已保留，请在官方后台核对。',
      targetSiteCode: STORE_CODE,
      pskuCode: 'PSKU-PUBLISH-001',
      partnerSku: 'PUBLISH-HISTORY-001',
      publishedAt: '2026-05-20 10:15:00',
      visibilityStatus: 'modification',
      changes: [changedSize],
      changeTypes: ['sizes']
    }
  ]
};

async function fulfillJson(route, payload) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload)
  });
}

async function bodyText(page) {
  return (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
}

const baseUrl = await resolveBaseUrl();
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });

try {
  await page.route('**/api/store-sync/overview**', (route) =>
    fulfillJson(route, {
      mode: 'local-db',
      ready: true,
      selectedOwnerId: OWNER_USER_ID,
      summary: {
        totalStores: 1,
        connectedStores: 1,
        pendingStores: 0,
        totalSiteStores: 1,
        connectedSiteStores: 1,
        managerLinks: 0
      },
      ownerOptions: [],
      stores: [
        {
          id: 1,
          projectName: 'xingyao',
          projectCode: 'PRJ245027',
          storeCode: STORE_CODE,
          siteCount: 1,
          connectedSiteCount: 1,
          isAuthorized: true,
          connectionStatus: 'CONNECTED',
          siteStores: [{ id: 1, storeCode: STORE_CODE, site: 'AE', isAuthorized: true }],
          managers: []
        }
      ],
      syncedRules: [],
      missingCoreTables: []
    })
  );
  await page.route('**/api/store-sync/init-status**', (route) =>
    fulfillJson(route, {
      mode: 'local-db',
      ready: true,
      status: 'READY',
      message: '商品摘要已准备。',
      ownerUserId: OWNER_USER_ID,
      projectName: 'xingyao',
      projectCode: 'PRJ245027',
      storeCode: STORE_CODE,
      siteCount: 1,
      uniqueProductCount: 2,
      siteOfferCount: 2,
      canEnterProductWorkbench: true,
      missingCoreTables: [],
      warnings: [],
      steps: [],
      siteSummaries: [],
      sampleProducts: [],
      productItems: []
    })
  );
  await page.route('**/api/product-master/list', (route) => fulfillJson(route, listPayload));
  await page.route('**/api/product-master/history', (route) => fulfillJson(route, historyPayload));

  await page.goto(`${baseUrl}/product/manage?devSession=1`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('搜索 PSKU / SKU / 商品编码').waitFor({ timeout: 20000 });
  const publishRow = page.locator('.ant-table-row').filter({ hasText: '历史校验商品' });
  const emptyRow = page.locator('.ant-table-row').filter({ hasText: '无发布任务商品' });
  await publishRow.waitFor({ timeout: 20000 });
  await emptyRow.waitFor({ timeout: 20000 });

  let text = await bodyText(page);
  assert(text.includes('发布状态'), '商品列表必须展示发布状态列');
  assert(text.includes('待人工核对'), '列表必须展示最近一次待人工核对状态');
  assert(text.includes('2026-05-20 10:15:00'), '列表必须展示最近一次发布任务时间');
  assert(!text.includes('未发布'), '没有发布任务的商品不能展示“未发布”文案');

  await publishRow.getByText('待人工核对').click();
  await page.getByText('上次发布').waitFor({ timeout: 10000 });
  text = await bodyText(page);
  assert(text.includes('Noon 多轮回读仍未确认【尺码】已生效'), '发布状态弹层必须展示本次结果');
  assert(text.includes('Seller Size'), '发布状态弹层必须展示字段变更');
  assert(text.includes('M -> L'), '发布状态弹层必须展示修改前后');

  await page.keyboard.press('Escape');
  await publishRow.getByRole('button', { name: 'history 历史' }).click();
  await page.getByText('商品修改历史').waitFor({ timeout: 10000 });
  const historyModal = page.locator('.ant-modal').filter({ hasText: '商品修改历史' });
  await historyModal.getByText('Seller Size', { exact: true }).waitFor({ timeout: 10000 });
  text = (await historyModal.innerText()).replace(/\s+/g, ' ').trim();
  assert(text.includes('修改前'), '历史弹层必须展示修改前列');
  assert(text.includes('修改后'), '历史弹层必须展示修改后列');
  assert(text.includes('待人工核对'), '历史弹层必须展示保存/发布状态');
  assert(text.includes('尺码'), '历史弹层必须展示实际变更域');
  assert(!text.includes('同步记录'), '历史弹层不能混入纯同步记录');
} finally {
  await browser.close();
}

console.log('product publish status/history UI check passed');
