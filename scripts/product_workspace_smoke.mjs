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
  process.env.PRODUCT_WORKSPACE_ARTIFACT_DIR ??
  path.resolve(process.cwd(), `../../tmp-product-workspace-smoke-${new Date().toISOString().replace(/[:]/g, '-')}`);

mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 960 }
});
page.setDefaultTimeout(45000);

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

try {
  console.log('step: open direct product workspace entry');
  await page.goto(`${baseUrl}/product/manage`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入用户名').waitFor();

  console.log('step: submit product-management login');
  await page.getByPlaceholder('请输入用户名').fill('18521524250');
  await page.getByPlaceholder('请输入密码').fill('boss123');
  await page.locator('button.ant-btn-primary').first().click();

  await page.locator('.ant-card-head-title').filter({ hasText: '商品列表' }).first().waitFor();
  await page.getByText(/当前显示正式商品数据面|同步中，先看正式数据面|当前显示商品摘要/).first().waitFor();
  await page.getByText('快捷打开常用商品').waitFor();
  await page.getByText('初始化后的商品').waitFor();
  await page.locator('.ant-card-head-title').filter({ hasText: '接入与排错' }).first().waitFor();
  await page.getByText('商品工作台已接管主展示').waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'product-workspace-list.png'), fullPage: true });

  assert.equal(new URL(page.url()).pathname, '/product/manage', `登录后没有停在商品工作台入口: ${page.url()}`);

  console.log('step: open independent history detail');
  await page.getByRole('button', { name: '关键内容历史' }).first().click();
  const historyDialog = page.getByRole('dialog');
  await historyDialog.waitFor();
  await historyDialog.getByText(/关键内容历史/).waitFor();
  await historyDialog.getByText(/正式历史|待转正式|暂无正式历史/).first().waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'product-workspace-history.png'), fullPage: true });
  await historyDialog.locator('.ant-modal-close').click();
  await historyDialog.waitFor({ state: 'hidden' });

  console.log('step: open product detail context in workspace');
  await page.getByRole('button', { name: '查看详情' }).first().click();
  await page.getByText(/商品详情/).first().waitFor();
  await page.getByRole('button', { name: '返回商品列表' }).waitFor();
  await page.getByText(/正在读取 Noon 商品主档快照|最近同步|商品信息/).first().waitFor();
  await page.getByText('字段域工作区').waitFor();
  await page.getByText(/商品主档|图文内容|Group 与变体|关键属性|当前站点经营/).first().waitFor();
  await page.screenshot({ path: path.join(artifactDir, 'product-workspace-detail.png'), fullPage: true });

  assert(
    !pageErrors.some((message) => message.includes('Maximum update depth exceeded')),
    `商品工作台仍然存在白屏级 pageerror: ${pageErrors.join(' | ')}`
  );
  assert(
    !consoleErrors.some((message) => message.includes('Maximum update depth exceeded')),
    `商品工作台仍然存在白屏级 console error: ${consoleErrors.join(' | ')}`
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        entryPath: '/product/manage',
        datasetPrimary: true,
        historyReadable: true,
        detailContextReadable: true,
        detailFieldDomainsReadable: true,
        artifactDir,
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
