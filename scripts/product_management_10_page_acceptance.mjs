import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright-core';

const CLEAN_SKU_PARENT = process.env.PRODUCT_10_SKU_PARENT ?? 'ZF116A45C167EB04BD58CZ';
const CLEAN_PARTNER_SKU = process.env.PRODUCT_10_PARTNER_SKU ?? 'MILKYWAYA15';
const CURRENT_SITE_LIVE_PARTNER_SKU = process.env.PRODUCT_10_CURRENT_SITE_LIVE_PARTNER_SKU ?? 'MILKYWAYA02';
const CLEAN_TITLE_QUERY = process.env.PRODUCT_10_TITLE_QUERY ?? 'Astronaut';
const CLEAN_BRAND_QUERY = process.env.PRODUCT_10_BRAND_QUERY ?? 'milkyway';
const OWNER_USER_ID = Number(process.env.PRODUCT_10_OWNER_USER_ID ?? 10002);
const STORE_CODE = process.env.PRODUCT_10_STORE_CODE ?? 'STR245027-NAE';
const SCREENSHOT_DIR = process.env.PRODUCT_10_SCREENSHOT_DIR
  ?? path.resolve(process.cwd(), '../../output_images/product-management-10');
let aiTranslationAvailable = false;

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
  if (process.env.PRODUCT_10_BASE_URL) {
    return process.env.PRODUCT_10_BASE_URL.replace(/\/$/, '');
  }

  const candidates = ['http://127.0.0.1:9620', 'http://localhost:9620', 'http://127.0.0.1:4173'];
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/product/manage?devSession=1`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(1500)
      });
      if (response.ok) {
        return candidate;
      }
    } catch {
      // Try the next known frontend port.
    }
  }
  return candidates[0];
}

function normalizeSpace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

async function bodyText(page) {
  return normalizeSpace(await page.locator('body').innerText());
}

async function assertBodyIncludes(page, expectedText, context) {
  const text = await bodyText(page);
  assert(text.includes(expectedText), `${context} 缺少：${expectedText}`);
}

async function assertBodyExcludes(page, unexpectedText, context) {
  const text = await bodyText(page);
  assert(!text.includes(unexpectedText), `${context} 不应展示：${unexpectedText}`);
}

async function expectTextAreaValue(page, label, pattern) {
  const locator = page.getByRole('textbox', { name: label, exact: true }).first();
  await locator.waitFor({ timeout: 10000 });
  await page.waitForFunction(
    ({ selectorLabel, source }) => {
      const input = [...document.querySelectorAll('textarea, input')].find(
        (item) => item.getAttribute('aria-label') === selectorLabel
      );
      return input && new RegExp(source).test(input.value);
    },
    { selectorLabel: label, source: pattern.source },
    { timeout: 15000 }
  );
}

async function expectVisibleSelectOption(page, text) {
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dropdown.waitFor({ timeout: 10000 });
  const dropdownText = normalizeSpace(await dropdown.innerText());
  assert(dropdownText.includes(text), `下拉候选缺少：${text}，实际：${dropdownText}`);
}

function isBlockingIssue(issue) {
  const normalized = String(issue ?? '').trim().toLowerCase();
  return Boolean(
    normalized &&
      (
        normalized.includes('fatal') ||
        normalized.includes('reject') ||
        normalized.includes('rejection') ||
        normalized.includes('blocked') ||
        normalized.includes('qc_failed') ||
        normalized.includes('not_approved') ||
        normalized.includes('不通过') ||
        normalized.includes('驳回')
      )
  );
}

function addIssueTag(target, issueTag) {
  if (issueTag && !target.includes(issueTag)) {
    target.push(issueTag);
  }
}

function numericValue(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function listIssueTags(item) {
  const issues = [];
  for (const issue of item.issueTags ?? []) {
    addIssueTag(issues, String(issue ?? '').trim());
  }
  if (!String(item.offerCode ?? '').trim()) {
    addIssueTag(issues, 'no_offer');
  }
  if (!String(item.referencePrice ?? '').trim() || numericValue(item.referencePrice) <= 0) {
    addIssueTag(issues, 'valid_price');
  }
  if (numericValue(item.totalFbnStock) + numericValue(item.totalFbpStock) <= 0) {
    addIssueTag(issues, 'stock_check');
  }
  if (!String(item.title ?? '').trim()) {
    addIssueTag(issues, 'title_missing');
  }
  if (!String(item.productFulltype ?? '').trim()) {
    addIssueTag(issues, '类目待复核');
  }
  return issues;
}

async function loadListPayload() {
  const response = await fetch(`${baseUrl}/api/product-master/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerUserId: OWNER_USER_ID, storeCode: STORE_CODE }),
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  assert.equal(response.status, 200, `商品列表接口返回 ${response.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function restoreCleanProductBaseline() {
  const command = { ownerUserId: OWNER_USER_ID, storeCode: STORE_CODE, skuParent: CLEAN_SKU_PARENT };
  const openResponse = await fetch(`${baseUrl}/api/product-master/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(15000)
  });
  const openText = await openResponse.text();
  assert.equal(openResponse.status, 200, `清理商品草稿打开详情失败 ${openResponse.status}: ${openText.slice(0, 300)}`);
  const openPayload = JSON.parse(openText);
  const baselineSnapshot = openPayload.baselineSnapshot ?? openPayload;
  const saveResponse = await fetch(`${baseUrl}/api/product-master/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...command,
      action: 'save',
      currentSiteCode: STORE_CODE,
      snapshot: baselineSnapshot
    }),
    signal: AbortSignal.timeout(15000)
  });
  const saveText = await saveResponse.text();
  assert.equal(saveResponse.status, 200, `清理商品草稿保存基线失败 ${saveResponse.status}: ${saveText.slice(0, 300)}`);
}

async function verifyTranslateApi() {
  const response = await fetch(`${baseUrl}/api/product-master/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operatorUserId: 10002,
      text: 'Astronaut Galaxy Projector',
      targetLang: 'ZH'
    }),
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  assert.equal(response.status, 200, `翻译接口返回 ${response.status}: ${text.slice(0, 300)}`);
  const payload = JSON.parse(text);
  assert.equal(payload.source, 'ai', '翻译接口必须走 AI 通道');
  if (payload.ready === false) {
    aiTranslationAvailable = false;
    assert(String(payload.message ?? '').includes('AI 翻译暂时不可用'), `AI 不可用时必须明确返回原因: ${text.slice(0, 300)}`);
    return;
  }
  aiTranslationAvailable = true;
  assert.equal(payload.ready, true, `翻译接口未 ready: ${payload.message ?? ''}`);
  assert(String(payload.data?.translation?.text ?? '').trim(), 'AI 翻译成功时必须返回非空 translation.text');
}

async function verifyClassificationOptionsApi() {
  const response = await fetch(`${baseUrl}/api/product-master/classification-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerUserId: OWNER_USER_ID,
      storeCode: STORE_CODE,
      limit: 20
    }),
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  assert.equal(response.status, 200, `品牌/类目字典接口返回 ${response.status}: ${text.slice(0, 300)}`);
  const payload = JSON.parse(text);
  assert.equal(payload.ready, true, `品牌/类目字典接口未 ready: ${payload.message ?? ''}`);
  assert.equal(payload.source, 'dictionary', `品牌/类目候选必须来自数据库字典，实际 source=${payload.source}`);
  const brands = (payload.brands ?? []).map((item) => String(item.value ?? '').toLowerCase());
  const fulltypes = (payload.fulltypes ?? []).map((item) => String(item.value ?? ''));
  assert((payload.fulltypes ?? []).length >= 20, `类目候选必须使用系统全量字典搜索，不能只返回当前店铺少量类目: ${text.slice(0, 300)}`);
  assert(brands.includes('milkyway'), `品牌字典缺少 milkyway: ${text.slice(0, 300)}`);
  assert(
    fulltypes.includes('home_decor-kids_room_decor-lamps_lighting') ||
      fulltypes.includes('home_decor-lighting-table_lamps'),
    `类目字典缺少当前验收商品类目: ${text.slice(0, 300)}`
  );

  const sportsResponse = await fetch(`${baseUrl}/api/product-master/classification-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerUserId: OWNER_USER_ID,
      storeCode: STORE_CODE,
      fulltypeQuery: 'sports_outdoor',
      limit: 20
    }),
    signal: AbortSignal.timeout(15000)
  });
  const sportsText = await sportsResponse.text();
  assert.equal(sportsResponse.status, 200, `系统类目搜索返回 ${sportsResponse.status}: ${sportsText.slice(0, 300)}`);
  const sportsPayload = JSON.parse(sportsText);
  const sportsFulltypes = (sportsPayload.fulltypes ?? []).map((item) => String(item.value ?? ''));
  assert(
    sportsFulltypes.some((item) => item.startsWith('sports_outdoor-')),
    `系统全量类目搜索没有返回其它店铺类目: ${sportsText.slice(0, 300)}`
  );
}

async function waitForListReady(page) {
  await page.getByPlaceholder('搜索 PSKU / SKU / 商品编码').waitFor({ timeout: 20000 });
  await page.locator('.ant-table-row').first().waitFor({ timeout: 20000 });
}

async function clickButton(page, name, options = {}) {
  await page.getByRole('button', { name }).first().click(options);
}

async function closeModal(page) {
  const modal = page.locator('.ant-modal-wrap:visible').last();
  if (!(await modal.count())) {
    return;
  }
  const close = modal.locator('.ant-modal-close').first();
  if (await close.count()) {
    await close.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await modal.waitFor({ state: 'hidden', timeout: 15000 });
}

async function closeDrawer(page) {
  const drawer = page.locator('.ant-drawer-content-wrapper:visible').last();
  if (!(await drawer.count())) {
    return;
  }
  const close = drawer.locator('.ant-drawer-close').first();
  if (await close.count()) {
    await close.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await drawer.waitFor({ state: 'hidden', timeout: 15000 });
}

async function searchBy(page, placeholder, value) {
  await page.getByRole('button', { name: '重置' }).first().click();
  await waitForListReady(page);
  await page.getByPlaceholder(placeholder).fill(value);
  await clickButton(page, '搜索');
  await page.locator('.ant-table-row').first().waitFor({ timeout: 20000 });
}

async function cleanRow(page) {
  const row = page.locator('.ant-table-row', { hasText: CLEAN_SKU_PARENT }).first();
  await row.waitFor({ timeout: 20000 });
  return row;
}

async function openCleanDetail(page) {
  await searchBy(page, '搜索 PSKU / SKU / 商品编码', CLEAN_SKU_PARENT);
  const row = await cleanRow(page);
  await row.getByRole('button', { name: '查看详情' }).first().click();
  await page.getByRole('button', { name: '发布当前修改' }).waitFor({ timeout: 25000 });
  await page.getByRole('tab', { name: /Offer/ }).waitFor({ timeout: 15000 });
}

async function verifyListPage(page) {
  await waitForListReady(page);
  const listPayload = await loadListPayload();

  for (const text of ['My Catalog', 'Estimated Fees', 'Performance', '接入状态看板', 'noon supermall Global']) {
    await assertBodyExcludes(page, text, '商品列表');
  }
  await assertBodyExcludes(page, '两边都有变化', '商品列表');

  for (const text of ['商品', '价格', '可售库存', '同步状态', '在架状态', '发布状态', '站点对比']) {
    await assertBodyIncludes(page, text, '商品列表');
  }
  for (const placeholder of ['搜索 PSKU / SKU / 商品编码', '按标题关键字搜索', '按品牌搜索']) {
    await page.getByPlaceholder(placeholder).waitFor({ timeout: 10000 });
  }

  for (const name of ['刷新', '同步商品', '搜索', '重置', '导出']) {
    await page.getByRole('button', { name }).first().waitFor({ timeout: 10000 });
  }

  await page.locator('.ant-select', { hasText: '全部状态' }).first().click();
  const statusOptions = normalizeSpace(await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last().innerText());
  assert(statusOptions.includes('在线'), '上架状态应展示在线');
  assert(statusOptions.includes('不在线'), '上架状态应展示不在线');
  assert(!statusOptions.toLowerCase().includes('active'), '上架状态不应展示 active');
  await page.keyboard.press('Escape');

  await page.locator('.ant-select', { hasText: '全部库存' }).first().click();
  const stockOptions = normalizeSpace(await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last().innerText());
  for (const text of ['FBN', 'Supermall', 'FBP']) {
    assert(stockOptions.includes(text), `库存筛选缺少：${text}`);
  }
  await page.keyboard.press('Escape');

  const currentSiteLiveItem = (listPayload.items ?? []).find(
    (item) => item.partnerSku === CURRENT_SITE_LIVE_PARTNER_SKU || item.sku === CURRENT_SITE_LIVE_PARTNER_SKU
  );
  assert(currentSiteLiveItem, `商品列表缺少当前站点在线样本：${CURRENT_SITE_LIVE_PARTNER_SKU}`);
  assert.equal(
    String(currentSiteLiveItem.liveStatus),
    'true',
    `${CURRENT_SITE_LIVE_PARTNER_SKU} 当前站点应为在线，不能用跨站点聚合状态覆盖`
  );
  await searchBy(page, '搜索 PSKU / SKU / 商品编码', CURRENT_SITE_LIVE_PARTNER_SKU);
  const currentSiteLiveRow = page.locator('.ant-table-row', { hasText: CURRENT_SITE_LIVE_PARTNER_SKU }).first();
  await currentSiteLiveRow.waitFor({ timeout: 20000 });
  const currentSiteLiveSwitch = currentSiteLiveRow.getByRole('switch').first();
  await currentSiteLiveSwitch.waitFor({ timeout: 10000 });
  assert.equal(
    await currentSiteLiveSwitch.getAttribute('aria-checked'),
    'true',
    `${CURRENT_SITE_LIVE_PARTNER_SKU} 当前站点在线时列表开关必须打开`
  );

  await searchBy(page, '搜索 PSKU / SKU / 商品编码', CLEAN_PARTNER_SKU);
  await assertBodyIncludes(page, CLEAN_SKU_PARENT, 'PSKU/SKU 搜索');

  await searchBy(page, '按标题关键字搜索', CLEAN_TITLE_QUERY);
  await assertBodyIncludes(page, CLEAN_SKU_PARENT, '标题搜索');

  await searchBy(page, '按品牌搜索', CLEAN_BRAND_QUERY);
  await assertBodyIncludes(page, CLEAN_SKU_PARENT, '品牌搜索');

  const row = await cleanRow(page);
  await row.click({ position: { x: 700, y: 12 } });
  await page.waitForTimeout(300);
  assert.equal(await page.getByRole('button', { name: '发布当前修改' }).count(), 0, '点击列表行不应进入详情页');

  const liveSwitch = row.getByRole('switch').first();
  await liveSwitch.waitFor({ timeout: 10000 });
  if ((await liveSwitch.getAttribute('aria-checked')) === 'true') {
    await liveSwitch.click();
    await page.getByText('确认下架当前商品？').waitFor({ timeout: 10000 });
    await page.getByText(/取\s*消/).last().click();
  }

  const productLink = row.locator('a[href*="noon.com"]').first();
  await productLink.waitFor({ timeout: 10000 });
  const href = await productLink.getAttribute('href');
  const target = await productLink.getAttribute('target');
  assert(href?.includes(CLEAN_SKU_PARENT), `商品标题前台链接应包含 SKU：${href}`);
  assert.equal(target, '_blank', '商品标题前台链接应新窗口打开');

  const thumbnailButton = row.locator('button').first();
  await thumbnailButton.click();
  await page.getByRole('dialog').last().waitFor({ timeout: 15000 });
  await page.getByLabel('上一张').waitFor({ timeout: 10000 });
  await page.getByLabel('下一张').waitFor({ timeout: 10000 });
  await closeModal(page);

  await row.getByRole('button', { name: '历史' }).first().click();
  await page.getByText('商品修改历史').first().waitFor({ timeout: 15000 });
  await closeModal(page);

  await row.getByRole('button', { name: '站点对比' }).first().click();
  await page.getByText('站点对比').first().waitFor({ timeout: 15000 });
  await page.getByText('价格').first().waitFor({ timeout: 15000 });
  await page.getByText('经营状态').first().waitFor({ timeout: 15000 });
  await closeModal(page);

  await page.getByRole('button', { name: '刷新' }).first().click();
  await waitForListReady(page);

  const hasBlockingIssues = (listPayload.items ?? []).some((item) => listIssueTags(item).some(isBlockingIssue));
  const itemWithIssues = (listPayload.items ?? []).find((item) => listIssueTags(item).length);
  if (itemWithIssues) {
    const issueTags = listIssueTags(itemWithIssues);
    await searchBy(page, '搜索 PSKU / SKU / 商品编码', itemWithIssues.skuParent);
    const issueRow = page.locator('.ant-table-row', { hasText: itemWithIssues.skuParent }).first();
    await issueRow.waitFor({ timeout: 20000 });
    const issueButton = issueRow.getByRole('button', { name: '查看问题' }).first();
    await issueButton.click();
    await page.getByText('商品问题').waitFor({ timeout: 10000 });
    await assertBodyIncludes(page, issueTags[0], '列表问题弹层');
    if (!hasBlockingIssues) {
      const className = await issueButton.getAttribute('class');
      assert(!className?.includes('danger'), '当前没有 fatal/QC rejected 问题时，查看问题按钮不应显示红色危险态');
    }
    await page.keyboard.press('Escape');
  }

  return { listSearches: ['sku', 'title', 'brand'], gallery: 'passed', history: 'passed' };
}

async function verifyOfferTab(page) {
  await page.getByRole('tab', { name: /Offer/ }).click();
  await assertBodyIncludes(page, '在架状态', 'Offer');
  await assertBodyIncludes(page, 'Live', 'Offer');
  await assertBodyIncludes(page, '价格', 'Offer');
  await assertBodyIncludes(page, 'Price Min / Max', 'Offer');
  await assertBodyIncludes(page, 'Sale Price / Sale Start / Sale End', 'Offer');
  await assertBodyIncludes(page, '最终价格', 'Offer');
  await assertBodyIncludes(page, '价格来源', 'Offer');
  await assertBodyIncludes(page, '具体活动', 'Offer');
  await assertBodyIncludes(page, '库存信息', 'Offer');
  await assertBodyIncludes(page, 'FBN', 'Offer');
  await assertBodyIncludes(page, 'FBP', 'Offer');
  await assertBodyIncludes(page, 'Barcode', 'Offer');
  await assertBodyIncludes(page, 'Warranty', 'Offer');

  for (const text of [
    'express',
    '价格范围',
    'FBP Fees',
    'FBN Fees',
    '当前站点已同步',
    '当前站点已修改',
    'Pricing Method',
    'Common across marketplaces',
    'Product Visibility'
  ]) {
    await assertBodyExcludes(page, text, 'Offer');
  }

  const fbnLink = page.locator('a[href*="fbn.noon.partners"][href*="project=PRJ245027"]').first();
  await fbnLink.waitFor({ timeout: 10000 });

  const storefrontLink = page.getByRole('link', { name: '打开前台详情' }).first();
  await storefrontLink.waitFor({ timeout: 10000 });
  const storefrontHref = await storefrontLink.getAttribute('href');
  assert(storefrontHref?.includes(CLEAN_SKU_PARENT), `前台详情链接应包含 SKU：${storefrontHref}`);

  const catalogLink = page.getByRole('link', { name: '打开后台详情' }).first();
  await catalogLink.waitFor({ timeout: 10000 });
  const catalogHref = await catalogLink.getAttribute('href');
  assert(catalogHref?.includes('noon-catalog.noon.partners'), `后台详情链接应跳转 Noon catalog：${catalogHref}`);
  assert(catalogHref?.includes('code='), `后台详情链接必须包含 child SKU / offer code 参数：${catalogHref}`);
}

async function verifyContentTab(page) {
  await page.getByRole('tab', { name: /Content/ }).click();
  await assertBodyIncludes(page, 'Basic Content', 'Content');
  await assertBodyIncludes(page, '标题', 'Content');
  await assertBodyIncludes(page, '卖点', 'Content');
  await assertBodyIncludes(page, '长描述', 'Content');
  await assertBodyIncludes(page, '中文', 'Content');
  await assertBodyIncludes(page, 'Long Description English', 'Content');
  await assertBodyIncludes(page, '阿语只读', 'Content');
  await assertBodyIncludes(page, '品牌与类目', 'Content');
  await assertBodyIncludes(page, 'Product Fulltype（官方类目）', 'Content');
  await assertBodyIncludes(page, 'Detailed Content', 'Content');
  await assertBodyIncludes(page, 'Base Material（基础材质）', 'Content');
  await assertBodyIncludes(page, 'Identifiers Attributes（标识属性）', 'Content');
  await assertBodyIncludes(page, 'Set Includes（包含物）', 'Content');

  for (const text of [
    'QC 状态(只读)',
    'product_title',
    'feature_bullet',
    'Other Information',
    'id_partner',
    'external_qc_rejection_reason_fatal',
    'pending_virtual_attributes',
    'grade',
    'Product Images',
    'Arabic (Optional)',
    "Add this content to enhance your product's discoverability on noon."
  ]) {
    await assertBodyExcludes(page, text, 'Content');
  }

  for (const name of ['Bold', 'Italic', 'Underline', 'Ordered list', 'Bullet list', 'HTML source']) {
    await page.getByLabel(name).first().waitFor({ timeout: 10000 });
  }

  await page.getByLabel('品牌').first().click();
  await expectVisibleSelectOption(page, 'Cuken');
  await page.keyboard.press('Escape');
  await page.getByLabel('Product Fulltype').first().click();
  await expectVisibleSelectOption(page, 'sports_outdoor-swimming-goggles');
  await page.keyboard.press('Escape');

  await page.getByRole('textbox', { name: '标题英语', exact: true }).fill('Astronaut Galaxy Projector');
  await page.getByLabel('翻译标题英语到中文').click();
  if (aiTranslationAvailable) {
    await expectTextAreaValue(page, '标题中文', /宇航员|银河|投影灯/);
  } else {
    await page.waitForTimeout(500);
  }
}

async function verifySizesTab(page) {
  await page.getByRole('tab', { name: /Sizes/ }).click();
  await assertBodyIncludes(page, 'Sizes', 'Sizes');
  await assertBodyIncludes(page, CLEAN_SKU_PARENT, 'Sizes');
  const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
  await deleteButton.waitFor({ timeout: 10000 });
  assert.equal(await deleteButton.isDisabled(), true, 'Sizes Delete 当前应禁用，避免误删不可写回结构');
}

async function verifyGroupsTab(page) {
  await page.getByRole('tab', { name: /Groups/ }).click();
  await assertBodyIncludes(page, 'Axes', 'Groups');
  await assertBodyIncludes(page, 'Colour Name', 'Groups');
  assert(/products?\b/.test(await bodyText(page)), 'Groups 缺少 product/products 数量标签');
  await assertBodyIncludes(page, 'Add More SKUs to the Group', 'Groups');
  await assertBodyExcludes(page, 'How groups work', 'Groups');

  await page.getByLabel('Expand title').first().click();
  await page.getByLabel('Collapse title').first().waitFor({ timeout: 10000 });

  await page.getByLabel('Edit SKU details').first().click();
  await page.getByText('Colour Name').last().waitFor({ timeout: 10000 });
  await assertBodyExcludes(page, 'SKU 不可修改', 'Groups 编辑弹窗');
  await closeModal(page);

  await page.getByLabel('Unlink from group').first().click();
  await page.getByText(/Unlink product from/).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cancel' }).last().click();
  await page.getByText(/Unlink product from/).first().waitFor({ state: 'hidden', timeout: 10000 });

  await clickButton(page, 'Add More SKUs to the Group');
  await page.getByText('Add products to the group').first().waitFor({ timeout: 15000 });
  await page.getByText('Select products to add').first().waitFor({ timeout: 10000 });
  await page.getByPlaceholder('Search PSKU').waitFor({ timeout: 10000 });
  await assertBodyExcludes(page, 'No matching products', 'Groups 添加同类目商品');
  await closeDrawer(page);

  await page.getByLabel('More group actions').click();
  const menuText = normalizeSpace(await page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').last().innerText());
  for (const text of ['Change Group', 'Unlink group from this SKU', 'Delete Group']) {
    assert(menuText.includes(text), `Groups 更多菜单缺少：${text}`);
  }
  await page.keyboard.press('Escape');
}

async function verifyProductInsightsTab(page) {
  await page.getByRole('tab', { name: /Product Insights/ }).click();
  await assertBodyIncludes(page, 'Performance', 'Product Insights');
  const text = await bodyText(page);
  assert(
    text.includes('暂无官方经营数据') || (text.includes('Units Sold') && text.includes('Sales')),
    'Product Insights 必须展示真实指标，或在未接真实数据时展示空态'
  );
}

async function verifySwitchConfirm(page) {
  await page.getByRole('tab', { name: /Offer/ }).click();
  await page.getByLabel('Sale Price').fill('88.8');
  await clickButton(page, '返回商品列表');
  await page.getByText('当前商品还有未发布修改').first().waitFor({ timeout: 10000 });
  await clickButton(page, '继续编辑');
  await page.getByRole('button', { name: '返回商品列表' }).waitFor({ timeout: 10000 });
}

async function verifyPublishBoundary(page) {
  await page.getByRole('tab', { name: /Groups/ }).click();
  await page.getByLabel('Unlink from group').first().click();
  await page.getByText(/Unlink product from/).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Unlink' }).last().click();
  await page.getByText(/Unlink product from/).first().waitFor({ state: 'hidden', timeout: 10000 });
  await assertBodyIncludes(page, '1 product', 'Groups unlink');
  await clickButton(page, '发布当前修改');
  await page.getByText(/Group 关联、候选组和 Group 轴当前没有 Noon 写回适配/).first().waitFor({ timeout: 10000 });
}

let currentStep = 'bootstrap';

async function step(name, action) {
  currentStep = name;
  return action();
}

const baseUrl = await resolveBaseUrl();
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
page.setDefaultTimeout(15000);

const pageErrors = [];
const apiFailures = [];
page.on('pageerror', (error) => pageErrors.push(`[${currentStep}] ${error.stack || error.message}`));
page.on('response', (response) => {
  const url = response.url();
  if (url.includes('/api/product-master') && response.status() >= 400) {
    apiFailures.push(`${response.status()} ${url}`);
  }
});

try {
  await step('translation-api', () => verifyTranslateApi());
  await step('classification-options-api', () => verifyClassificationOptionsApi());
  await step('restore-clean-baseline-before', () => restoreCleanProductBaseline());
  await page.goto(`${baseUrl}/product/manage?devSession=1`, { waitUntil: 'domcontentloaded' });
  const listResult = await step('list', () => verifyListPage(page));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-list.png') });

  await step('open-detail', () => openCleanDetail(page));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-detail-offer.png') });

  await step('offer', () => verifyOfferTab(page));
  await step('content', () => verifyContentTab(page));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-detail-content.png') });
  await step('sizes', () => verifySizesTab(page));
  await step('groups', () => verifyGroupsTab(page));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-detail-groups.png') });
  await step('product-insights', () => verifyProductInsightsTab(page));
  await step('unsaved-switch-confirm', () => verifySwitchConfirm(page));
  await step('publish-boundary', () => verifyPublishBoundary(page));

  assert.deepEqual(pageErrors, [], `页面运行时异常：${pageErrors.join('\n')}`);
  assert.deepEqual(apiFailures, [], `商品接口失败：${apiFailures.join('\n')}`);

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    skuParent: CLEAN_SKU_PARENT,
    screenshotDir: SCREENSHOT_DIR,
    listResult,
    checks: [
      'list-layout',
      'list-search',
      'gallery',
      'history',
      'offer',
      'content',
      'classification-options-api',
      'image-manager',
      'sizes',
      'groups',
      'product-insights',
      'unsaved-switch-confirm',
      'publish-boundary'
    ]
  }, null, 2));
} finally {
  try {
    await restoreCleanProductBaseline();
  } catch (error) {
    console.warn(`清理商品草稿失败：${error instanceof Error ? error.message : String(error)}`);
  }
  await browser.close();
}
