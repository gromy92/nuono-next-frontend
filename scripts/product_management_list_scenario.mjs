import assert from 'node:assert/strict'
import {
  CLEAN_BRAND_QUERY,
  CLEAN_PARTNER_SKU,
  CLEAN_SKU_PARENT,
  CLEAN_TITLE_QUERY,
  CURRENT_SITE_LIVE_PARTNER_SKU
} from './product_management_acceptance_config.mjs'
import { loadListPayload } from './product_management_acceptance_api.mjs'
import {
  assertBodyExcludes,
  assertBodyIncludes,
  cleanRow,
  closeModal,
  isBlockingIssue,
  listIssueTags,
  normalizeSpace,
  searchBy,
  waitForListReady
} from './product_management_acceptance_support.mjs'

export async function verifyProductManagementListScenario(page) {
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

  const row = await cleanRow(page, CLEAN_SKU_PARENT);
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
