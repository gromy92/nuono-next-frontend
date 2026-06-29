import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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

const baseUrl = process.env.NUONO_LAYOUT_SMOKE_BASE_URL ?? 'http://127.0.0.1:9620';
const viewports = [
  { width: 1158, height: 900 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 }
];

const pages = [
  { label: '竞品分析', path: '/operations/competitor-analysis?devSession=1' },
  { label: '商品管理', path: '/product/manage?devSession=1' },
  { label: '采购单', path: '/purchase/order?devSession=1' },
  { label: '销量分析', path: '/data/sales-analysis?devSession=1' },
  { label: '运营配置', path: '/operations/config/versions?devSession=1' }
];

function buildUrl(path) {
  return new URL(path, baseUrl).toString();
}

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(12000);

const failures = [];

try {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const target of pages) {
      await page.goto(buildUrl(target.path), { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => Boolean(document.body));
      await page.locator('.nuono-shell-sidebar-rail').waitFor();
      await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => undefined);

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const bodyText = document.body.innerText;
        const shell = document.querySelector('.nuono-shell-layout');
        const main = document.querySelector('.nuono-shell-main');
        const content = document.querySelector('.nuono-shell-content');
        const inner = document.querySelector('.nuono-shell-content-inner');
        const competitorTableContent = document.querySelector('.competitor-analysis-table .ant-table-content');
        const rowActionTexts = Array.from(document.querySelectorAll('.competitor-analysis-row-actions button')).map(
          (button) => button.getAttribute('aria-label') || button.textContent?.trim() || ''
        );
        const tableWrapperRects = Array.from(document.querySelectorAll('.ant-table-wrapper')).map((table, index) => {
          const rect = table.getBoundingClientRect();
          return {
            index,
            left: rect.left,
            right: rect.right,
            width: rect.width
          };
        });
        const fixedRightCellRects = Array.from(document.querySelectorAll('.ant-table-cell-fix-right')).map((cell, index) => {
          const rect = cell.getBoundingClientRect();
          return {
            index,
            text: cell.textContent?.trim().slice(0, 40) || '',
            left: rect.left,
            right: rect.right,
            width: rect.width
          };
        });

        if (inner instanceof HTMLElement) {
          inner.scrollLeft = 240;
        }

        const shellRect = shell?.getBoundingClientRect();
        const mainRect = main?.getBoundingClientRect();
        const contentRect = content?.getBoundingClientRect();
        const innerRect = inner?.getBoundingClientRect();

        return {
          clientWidth: doc.clientWidth,
          scrollWidth: doc.scrollWidth,
          shellRight: shellRect?.right ?? null,
          mainRight: mainRect?.right ?? null,
          contentRight: contentRect?.right ?? null,
          innerRight: innerRect?.right ?? null,
          innerScrollLeft: inner instanceof HTMLElement ? inner.scrollLeft : null,
          competitorTableScrollWidth: competitorTableContent instanceof HTMLElement ? competitorTableContent.scrollWidth : null,
          competitorTableClientWidth: competitorTableContent instanceof HTMLElement ? competitorTableContent.clientWidth : null,
          competitorRowActions: rowActionTexts.slice(0, 4),
          competitorHasCanman: bodyText.includes('canman'),
          competitorHasZeroFilterInSearch: Boolean(
            document.querySelector('.competitor-analysis-search-card .competitor-analysis-zero-filter-select')
          ),
          competitorHasCreateButton: Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.includes('新增监控商品')),
          tableWrapperRects,
          fixedRightCellRects,
          hasShell: Boolean(shell),
          hasMain: Boolean(main),
          hasContent: Boolean(content),
          hasInner: Boolean(inner)
        };
      });

      try {
        assert.equal(metrics.hasShell, true, 'missing .nuono-shell-layout');
        assert.equal(metrics.hasMain, true, 'missing .nuono-shell-main');
        assert.equal(metrics.hasContent, true, 'missing .nuono-shell-content');
        assert.equal(metrics.hasInner, true, 'missing .nuono-shell-content-inner');
        assert(
          metrics.scrollWidth <= metrics.clientWidth + 1,
          `document overflow: scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth}`
        );
        assert(
          metrics.innerScrollLeft !== null && metrics.innerScrollLeft <= 1,
          `workspace content scrolled horizontally: scrollLeft=${metrics.innerScrollLeft}`
        );
        for (const [name, value] of [
          ['shellRight', metrics.shellRight],
          ['mainRight', metrics.mainRight],
          ['contentRight', metrics.contentRight],
          ['innerRight', metrics.innerRight]
        ]) {
          assert(value !== null && value <= viewport.width + 1, `${name} exceeds viewport: ${value} > ${viewport.width}`);
        }
        for (const rect of metrics.tableWrapperRects) {
          assert(rect.left >= -1, `table wrapper ${rect.index} is clipped left: ${rect.left}`);
          assert(rect.right <= viewport.width + 1, `table wrapper ${rect.index} exceeds viewport: ${rect.right} > ${viewport.width}`);
        }
        for (const rect of metrics.fixedRightCellRects) {
          assert(rect.right <= viewport.width + 1, `fixed right table cell ${rect.index} exceeds viewport: ${rect.right} > ${viewport.width}`);
          assert(rect.left >= -1, `fixed right table cell ${rect.index} is clipped left: ${rect.left}`);
        }
        if (target.label === '竞品分析') {
          assert.equal(metrics.competitorHasCanman, true, 'competitor page is not using canman dev session');
          assert.equal(metrics.competitorHasZeroFilterInSearch, true, 'competitor zero filter should stay with search controls');
          assert.deepEqual(metrics.competitorRowActions, ['抓取', '添加竞品', '查看详情', '报表']);
          assert.equal(metrics.competitorHasCreateButton, false, 'top create watch product button should stay removed');
          if (viewport.width >= 1280) {
            assert(
              metrics.competitorTableScrollWidth !== null &&
                metrics.competitorTableClientWidth !== null &&
                metrics.competitorTableScrollWidth <= metrics.competitorTableClientWidth + 1,
              `competitor table overflow: scrollWidth=${metrics.competitorTableScrollWidth}, clientWidth=${metrics.competitorTableClientWidth}`
            );
          }
        }
      } catch (error) {
        failures.push({
          page: target.label,
          path: target.path,
          viewport,
          metrics,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, baseUrl, checkedPages: pages.length, checkedViewports: viewports.length }, null, 2));
