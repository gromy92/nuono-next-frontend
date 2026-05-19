import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright-core';

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

const baseUrl = process.env.PRODUCT_WORKSPACE_BASE_URL ?? 'http://127.0.0.1:5173';
const artifactDir =
  process.env.PRODUCT_FIELD_DOMAIN_ARTIFACT_DIR ??
  path.resolve(process.cwd(), `../../tmp-product-field-domain-acceptance-${new Date().toISOString().replace(/[:]/g, '-')}`);

mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 960 }
});
page.setDefaultTimeout(60000);

const pageErrors = [];
const consoleErrors = [];

page.on('pageerror', (error) => {
  pageErrors.push(error.message);
});

page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push(message.text());
  }
});

const saveSample = {
  skuParent: 'ZBDECAEB5100C6E00F9ABZ',
  expectedBaseStatus: '已同步'
};

const pullSample = {
  skuParent: 'ZC14270C4B713BD8B27CAZ',
  expectedBaseStatus: '已同步'
};

function rowBySku(skuParent) {
  return page.locator('tbody tr').filter({ hasText: skuParent }).first();
}

async function loginToProductWorkspace() {
  await page.goto(`${baseUrl}/product/manage`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入用户名').waitFor();
  await page.getByPlaceholder('请输入用户名').fill('18521524250');
  await page.getByPlaceholder('请输入密码').fill('boss123');
  await page.locator('button.ant-btn-primary').first().click();
  await page.locator('.ant-card-head-title').filter({ hasText: '商品列表' }).first().waitFor();
  await page.getByText(/当前显示正式商品数据面|当前显示商品摘要|同步中，先看正式数据面/).first().waitFor();
}

async function openDetailFromRow(skuParent) {
  const row = rowBySku(skuParent);
  await row.waitFor();
  await row.getByRole('button', { name: '查看详情' }).click();
  const switchDialogTitle = page.getByText('当前商品还有未发布修改');
  if (await switchDialogTitle.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.getByRole('button', { name: '仍然切换' }).click();
  }
  await page.getByRole('button', { name: '返回商品列表' }).waitFor();
  await page.getByText('字段域工作区').waitFor();
  await page.getByText(/商品主档|图文内容|Group 与变体|关键属性|当前站点经营/).first().waitFor();
}

async function returnToList() {
  await page.getByRole('button', { name: '返回商品列表' }).click();
  await page.locator('.ant-card-head-title').filter({ hasText: '商品列表' }).first().waitFor();
}

async function fillInputAfterLabel(label, value) {
  const locator = page.locator(`xpath=//span[normalize-space()="${label}"]/following::input[1]`).first();
  await locator.waitFor();
  await locator.fill(value);
}

async function waitForRowStatus(skuParent, statusText) {
  const row = rowBySku(skuParent);
  await row.waitFor();
  await row.getByText(statusText).waitFor();
}

async function rowInnerText(skuParent) {
  const row = rowBySku(skuParent);
  await row.waitFor();
  return row.innerText();
}

async function expectFieldDomainsVisible() {
  await page.getByText('字段域工作区').waitFor();
  for (const label of ['商品主档', '图文内容', 'Group 与变体', '关键属性', '当前站点经营']) {
    await page.getByText(label).first().waitFor();
  }
}

try {
  console.log('step: login and load product workspace');
  await loginToProductWorkspace();

  console.log('step: verify detail field-domain workspace appears stably');
  await openDetailFromRow('ZAF42BC48A32F9B7E7FA2Z');
  await expectFieldDomainsVisible();
  await page.getByText(/当前修改范围：|历史入口：/).first().waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-open.png'), fullPage: true });
  await returnToList();

  console.log('step: verify save loop closes on detail first and list readback stays on summary semantics');
  const saveRowBefore = await rowInnerText(saveSample.skuParent);
  const originalListTitleVisible = saveRowBefore.includes('[FD-TEST-');
  assert.equal(originalListTitleVisible, false, '保存测试样本的列表标题已经带测试 marker，不能继续做本轮 save 验收。');

  await openDetailFromRow(saveSample.skuParent);
  const saveMarker = `[FD-TEST-SAVE-${Date.now()}]`;
  await fillInputAfterLabel('标题 EN', `Galaxy Projector ${saveMarker}`);
  await page.getByText(/当前修改范围：图文内容/).waitFor();
  await page.getByRole('button', { name: '保存草稿' }).first().click();
  await page.getByText(/工作台已就绪 · 诺诺有新稿|当前草稿已保存|已保存为诺诺草稿/).first().waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-save-detail.png'), fullPage: true });
  await returnToList();
  await waitForRowStatus(saveSample.skuParent, '诺诺有新稿');
  const saveRowAfter = await rowInnerText(saveSample.skuParent);
  assert.equal(saveRowAfter.includes(saveMarker), false, '保存草稿后列表提前预览了未发布标题。');
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-save-list.png'), fullPage: true });

  console.log('step: verify publish-current closes detail state and list readback on the same formal dataset');
  await openDetailFromRow(saveSample.skuParent);
  await page.getByText(/当前修改范围：图文内容/).waitFor();
  await page.getByRole('button', { name: '发布当前修改' }).first().click();
  await page.getByText(/工作台已就绪 · 已同步|已完成当前修改发布|已发布当前修改|Noon 最新快照已自动刷新/).first().waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-publish-detail.png'), fullPage: true });
  await returnToList();
  await waitForRowStatus(saveSample.skuParent, '已同步');
  const publishRowAfter = await rowInnerText(saveSample.skuParent);
  assert.equal(publishRowAfter.includes(saveMarker), true, '发布当前修改后列表没有回到已发布摘要。');
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-publish-list.png'), fullPage: true });

  console.log('step: cleanup published title back to original baseline');
  await openDetailFromRow(saveSample.skuParent);
  await fillInputAfterLabel(
    '标题 EN',
    'Galaxy Projector Portable Mini Humidifier Remote Control 7 Color Lamp Bedroom Decor USB Car Air Freshener'
  );
  await page.getByRole('button', { name: '发布当前修改' }).first().click();
  await page.getByText(/工作台已就绪 · 已同步|已完成当前修改发布|已发布当前修改|Noon 最新快照已自动刷新/).first().waitFor();
  await returnToList();
  await waitForRowStatus(saveSample.skuParent, '已同步');

  console.log('step: verify pull closes detail current state instead of only list readback');
  await waitForRowStatus(pullSample.skuParent, pullSample.expectedBaseStatus);
  await openDetailFromRow(pullSample.skuParent);
  await page.getByText(/当前没有新的字段域变更|已改字段域 0 个/).first().waitFor();
  await page.getByRole('button', { name: '从 Noon 同步' }).first().click();
  await page.getByText(/工作台已就绪 · 已同步|已同步 Noon 当前内容|已按 Noon 当前版本刷新基线。/).first().waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-pull-detail.png'), fullPage: true });
  await returnToList();
  await waitForRowStatus(pullSample.skuParent, '已同步');
  await page.screenshot({ path: path.join(artifactDir, 'field-domain-pull-list.png'), fullPage: true });

  assert(
    !pageErrors.some((message) => message.includes('Maximum update depth exceeded')),
    `页面仍存在白屏级 pageerror: ${pageErrors.join(' | ')}`
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        artifactDir,
        fieldDomainsStable: true,
        saveClosesOnDetail: true,
        pullClosesOnDetail: true,
        publishClosesOnDetail: true,
        listReadbackAligned: true,
        pageErrors,
        consoleErrors
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
