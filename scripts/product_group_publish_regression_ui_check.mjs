import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright-core';

const OWNER_USER_ID = 10002;
const STORE_CODE = 'STR245027-NAE';
const GROUP_REF = 'GROUP-ALPHA';

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
  if (process.env.PRODUCT_GROUP_REGRESSION_BASE_URL) {
    return process.env.PRODUCT_GROUP_REGRESSION_BASE_URL.replace(/\/$/, '');
  }

  for (const candidate of ['http://127.0.0.1:9620', 'http://localhost:9620']) {
    try {
      const response = await fetch(`${candidate}/product/groups?devSession=1`, {
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

function groupItem(overrides) {
  return {
    skuParent: 'GROUP-MEMBER-001',
    referenceStoreCode: STORE_CODE,
    productSourceType: 'SELF_BUILT',
    partnerSku: 'GROUP-PARTNER-001',
    pskuCode: 'PSKU-GROUP-001',
    offerCode: 'OFFER-GROUP-001',
    title: 'Group Member 001',
    brand: 'Milkyway',
    imageUrl: 'https://img.example.com/group-001.jpg',
    galleryImages: ['https://img.example.com/group-001.jpg'],
    currency: 'AED',
    referencePrice: '48.00',
    salePrice: '39.90',
    productFulltype: 'home_decor-lighting-table_lamps',
    skuGroup: 'GROUP-A',
    groupRef: GROUP_REF,
    groupRefCanonical: GROUP_REF,
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
    visibleKeyContentHistoryCount: 0,
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

const groupedMemberOne = groupItem({
  skuParent: 'GROUP-MEMBER-001',
  partnerSku: 'GROUP-PARTNER-001',
  pskuCode: 'PSKU-GROUP-001',
  offerCode: 'OFFER-GROUP-001',
  title: 'Blue Table Lamp'
});

const groupedMemberTwo = groupItem({
  skuParent: 'GROUP-MEMBER-002',
  partnerSku: 'GROUP-PARTNER-002',
  pskuCode: 'PSKU-GROUP-002',
  offerCode: 'OFFER-GROUP-002',
  title: 'Green Table Lamp',
  imageUrl: 'https://img.example.com/group-002.jpg',
  galleryImages: ['https://img.example.com/group-002.jpg']
});

const ungroupedProduct = groupItem({
  skuParent: 'UNGROUPED-003',
  partnerSku: 'UNGROUPED-PARTNER-003',
  pskuCode: 'PSKU-UNGROUPED-003',
  offerCode: 'OFFER-UNGROUPED-003',
  title: 'Ungrouped Yellow Lamp',
  imageUrl: 'https://img.example.com/ungrouped-003.jpg',
  galleryImages: ['https://img.example.com/ungrouped-003.jpg'],
  skuGroup: '',
  groupRef: '',
  groupRefCanonical: ''
});

const listPayload = {
  ready: true,
  source: 'projection-primary',
  message: '商品摘要已就绪。',
  warnings: [],
  ownerUserId: OWNER_USER_ID,
  storeCode: STORE_CODE,
  initializationStatus: 'READY',
  totalItems: 3,
  syncedCount: 3,
  draftCount: 0,
  conflictCount: 0,
  failedCount: 0,
  liveCount: 3,
  groupedCount: 2,
  pendingPriceCount: 0,
  historyReadyCount: 0,
  items: [groupedMemberOne, groupedMemberTwo, ungroupedProduct]
};

function snapshotFor(item) {
  const groupMembers = [
    {
      skuParent: groupedMemberOne.skuParent,
      partnerSku: groupedMemberOne.partnerSku,
      pskuCode: groupedMemberOne.pskuCode,
      title: groupedMemberOne.title,
      imageUrl: groupedMemberOne.imageUrl,
      axisValues: { colour_name: 'Blue' }
    },
    {
      skuParent: groupedMemberTwo.skuParent,
      partnerSku: groupedMemberTwo.partnerSku,
      pskuCode: groupedMemberTwo.pskuCode,
      title: groupedMemberTwo.title,
      imageUrl: groupedMemberTwo.imageUrl,
      axisValues: { colour_name: 'Green' }
    }
  ];
  const snapshot = {
    mode: 'local-db',
    ready: true,
    message: '当前已载入商品。',
    warnings: [],
    missingCoreTables: [],
    storeContext: {
      ownerUserId: OWNER_USER_ID,
      projectName: 'xingyao',
      projectCode: 'PRJ245027',
      storeCode: STORE_CODE,
      site: 'AE',
      fetchedAt: '2026-05-20 09:30:00'
    },
    identity: {
      skuParent: item.skuParent,
      partnerSku: item.partnerSku,
      pskuCode: item.pskuCode,
      offerCode: item.offerCode,
      brand: item.brand,
      currency: item.currency
    },
    taxonomy: {
      family: 'HOME',
      productType: 'LIGHTING',
      productSubtype: 'TABLE_LAMPS',
      productFulltype: item.productFulltype
    },
    content: {
      titleEn: item.title,
      titleAr: 'مصباح طاولة',
      descriptionEn: 'Regression fixture product.',
      descriptionAr: 'منتج اختبار.',
      highlightsEn: ['Stable fixture'],
      highlightsAr: ['اختبار ثابت'],
      images: item.galleryImages
    },
    platformSignals: {
      qcState: 'approved',
      statusQc: 'Approved',
      isActiveLocalized: 'Active',
      imageCount: item.galleryImages.length,
      hiddenImageCount: 0,
      rejectionReasons: [],
      affectingAttributes: []
    },
    keyAttributes: [
      { code: 'material', commonValue: 'metal', enValue: 'Metal', arValue: 'معدن', required: true, visibleSeller: true }
    ],
    group: {
      skuGroup: 'GROUP-A',
      groupRef: GROUP_REF,
      groupRefCanonical: GROUP_REF,
      memberCount: 2,
      candidateGroupCount: 1,
      conditionsBrand: item.brand,
      conditionsFulltype: item.productFulltype,
      axes: [{ axisCode: 'colour_name', axisName: 'Colour Name' }],
      members: groupMembers,
      candidateGroups: [
        {
          skuGroup: 'GROUP-A',
          groupRef: GROUP_REF,
          groupRefCanonical: GROUP_REF,
          brand: item.brand,
          fulltype: item.productFulltype,
          memberCount: 2
        }
      ]
    },
    variants: [{ childSku: `${item.partnerSku}-CHILD`, sizeEn: 'OS', sizeAr: 'OS', variantIndex: 1 }],
    pricing: { currency: item.currency, price: item.referencePrice },
    stock: { fbnStock: 8, supermallStock: 1, fbpStock: 3 },
    siteOffers: [
      {
        storeCode: STORE_CODE,
        site: 'AE',
        reference: true,
        pskuCode: item.pskuCode,
        offerCode: item.offerCode,
        currency: item.currency,
        price: item.referencePrice,
        salePrice: item.salePrice,
        priceMin: '10.00',
        priceMax: '99.00',
        fbnStock: '8',
        supermallStock: '1',
        fbpStock: '3',
        isActive: true,
        liveStatus: 'LIVE',
        statusCode: 'LIVE',
        idWarranty: '12M'
      }
    ]
  };

  return {
    ...snapshot,
    baselineSnapshot: structuredClone(snapshot),
    draftSnapshot: structuredClone(snapshot),
    syncStatus: 'synced',
    lastSyncedAt: '2026-05-20 09:30:00',
    note: '当前商品已打开，可以继续维护 Group。'
  };
}

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

async function closeDrawer(page) {
  await page.keyboard.press('Escape');
  await page.locator('.ant-drawer').waitFor({ state: 'hidden', timeout: 10000 });
}

const baseUrl = await resolveBaseUrl();
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
page.setDefaultTimeout(15000);

let listCallCount = 0;
let actionCallCount = 0;

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
      uniqueProductCount: 3,
      siteOfferCount: 3,
      canEnterProductWorkbench: true,
      missingCoreTables: [],
      warnings: [],
      steps: [],
      siteSummaries: [],
      sampleProducts: [],
      productItems: []
    })
  );
  await page.route('**/api/product-master/list', (route) => {
    listCallCount += 1;
    return fulfillJson(route, listPayload);
  });
  await page.route('**/api/product-master/open', async (route) => {
    const request = route.request().postDataJSON();
    const item =
      listPayload.items.find((candidate) => candidate.skuParent === request.skuParent) ??
      groupedMemberOne;
    await fulfillJson(route, snapshotFor(item));
  });
  await page.route('**/api/product-master/action', async (route) => {
    actionCallCount += 1;
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'UI regression must not execute product-master/action' })
    });
  });

  await page.goto(`${baseUrl}/product/groups?devSession=1`, { waitUntil: 'domcontentloaded' });
  await page.getByText('分组列表').waitFor({ timeout: 20000 });
  await page.getByText(GROUP_REF).first().waitFor({ timeout: 20000 });
  await page.getByText('Colour Name', { exact: true }).first().waitFor({ timeout: 20000 });

  let text = await bodyText(page);
  assert(text.includes('已分组商品数：2，分组数量：1，未分组商品数：1'), 'Group 页面必须展示分组/未分组汇总');
  await page.getByPlaceholder('搜索 SKU / 品牌 / 标题').waitFor({ timeout: 10000 });
  assert(text.includes('待发布'), 'Group 页面必须展示待发布筛选');
  assert(text.includes('未分组'), 'Group 页面必须展示未分组入口');
  assert(text.includes('刷新'), 'Group 页面必须展示刷新入口');
  assert(!text.includes('Groups'), '商品详情 Groups tab 不能回到当前页面文案');

  await page.getByPlaceholder('搜索 Group').fill('NO-MATCH-GROUP');
  await page.getByText('暂无分组').waitFor({ timeout: 10000 });
  await page.getByPlaceholder('搜索 Group').fill('');
  await page.getByText(GROUP_REF).first().waitFor({ timeout: 10000 });

  await page.getByPlaceholder('搜索 SKU / 品牌 / 标题').fill('UNGROUPED');
  await page.getByRole('button', { name: '未分组' }).click();
  await page.getByText('Ungrouped Yellow Lamp').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: '未分组' }).click();
  await page.getByPlaceholder('搜索 SKU / 品牌 / 标题').fill('');

  const beforeRefreshCalls = listCallCount;
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/product-master/list') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /刷新/ }).click();
  await refreshResponse;
  assert(listCallCount > beforeRefreshCalls, 'Group 刷新按钮必须重拉商品列表投影');

  await page.getByLabel('编辑 Group 属性').first().click();
  const editModal = page.locator('.ant-modal').filter({ hasText: 'Edit Colour Name' });
  await editModal.waitFor({ timeout: 10000 });
  await editModal.locator('input').last().fill('Red');
  await editModal.locator('.ant-btn-primary').click();
  await page.getByText('发布修改').waitFor({ timeout: 10000 });
  text = await bodyText(page);
  assert(text.includes('待发布'), 'Group 轴属性修改后必须形成待发布状态');

  await page.getByRole('button', { name: '添加未分组商品' }).click();
  await page.getByText('添加未分组商品').last().waitFor({ timeout: 10000 });
  await page.getByText('UNGROUPED-003').waitFor({ timeout: 10000 });
  await page.locator('.ant-drawer input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: '加入分组' }).click();
  await page.getByText('Ungrouped Yellow Lamp').waitFor({ timeout: 10000 });

  await page.getByLabel('移除 Group 关联').nth(1).click();
  await page.getByText('确认移除该商品的 Group 关联？确认后会形成待发布修改。').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: '确认移除' }).click();
  await page.getByText('确认移除该商品的 Group 关联？确认后会形成待发布修改。').waitFor({ state: 'hidden', timeout: 10000 });

  assert.equal(actionCallCount, 0, '无人工确认时不能调用真实 publish-current/action');
} finally {
  await closeDrawer(page).catch(() => {});
  await browser.close();
}

console.log('product group publish regression UI check passed');
