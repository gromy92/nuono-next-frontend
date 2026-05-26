import { expect, test } from '@playwright/test';

test('noon data completeness reports expose ledger filters, status chips and drilldown', async ({ page }) => {
  const overviewRequests: string[] = [];
  let retryCalled = false;
  await page.route('**/api/system-reports/noon-data-completeness/overview**', async (route) => {
    overviewRequests.push(route.request().url());
    await route.fulfill({
      json: {
        title: '数据完整度',
        generatedAt: '2026-05-25T10:30:00',
        metrics: [
          { key: 'total_categories', title: '数据类别', value: 4, unit: '类', state: 'ready' },
          { key: 'latest_ready', title: '最新数据就绪', value: 0, unit: '类', state: 'warning' },
          { key: 'history_incomplete', title: '历史待补全', value: 0, unit: '类', state: 'ready' },
          { key: 'active_patrol', title: '巡检缺口', value: 0, unit: '个', state: 'ready' }
        ],
        rows: [
          {
            id: 900001,
            ownerUserId: 307,
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            category: 'SALES_PRODUCT_VIEWS',
            latestStatus: 'PENDING_CONFIRMATION',
            historyStatus: 'INCOMPLETE',
            latestDataDate: null,
            historyCoveredFrom: '2026-04-25',
            historyCoveredTo: '2026-05-24',
            patrolEnabled: true,
            activeGapCount: 2,
            nextPatrolAt: '2026-05-25T12:30:00'
          }
        ],
        categoryDistribution: [
          { key: 'PRODUCT_LIST', label: '商品列表', value: 1 },
          { key: 'PRODUCT_DETAIL', label: '商品详情', value: 1 },
          { key: 'SALES_ORDER', label: '销售订单', value: 1 },
          { key: 'SALES_PRODUCT_VIEWS', label: 'Product Views 销量/PV', value: 1 }
        ],
        latestStatusDistribution: [{ key: 'missing', label: '缺失', value: 4 }],
        historyStatusDistribution: [{ key: 'not_required', label: '无需补全', value: 4 }]
      }
    });
  });
  await page.route('**/api/system-reports/noon-data-completeness/gaps**', async (route) => {
    await route.fulfill({
      json: {
        title: '数据缺口巡检',
        generatedAt: '2026-05-25T10:30:00',
        metrics: [
          { key: 'total_gaps', title: '缺口窗口', value: 0, unit: '个', state: 'ready' },
          { key: 'retryable_gaps', title: '可自动重试', value: 0, unit: '个', state: 'ready' },
          { key: 'manual_action_gaps', title: '需人工介入', value: 0, unit: '个', state: 'ready' }
        ],
        rows: [
          {
            id: 910001,
            completenessId: 900001,
            ownerUserId: 307,
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            category: 'SALES_PRODUCT_VIEWS',
            windowType: 'LATEST_DAILY',
            dateFrom: '2026-05-24',
            dateTo: '2026-05-24',
            status: 'PENDING_CONFIRMATION',
            attempts: 1,
            nextRetryAt: '2026-05-25T12:30:00',
            linkedPullTaskId: 130001,
            linkedSourceBatchId: 'batch-empty-latest',
            rowOrItemCount: 0,
            failureType: 'empty_report_pending_confirmation',
            retryable: true,
            requiresManualAction: false,
            diagnosticSummary: 'cookie=[REDACTED] url=[REDACTED_URL]'
          },
          {
            id: 910002,
            completenessId: 900001,
            ownerUserId: 307,
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            category: 'SALES_PRODUCT_VIEWS',
            windowType: 'HISTORY_BACKFILL',
            dateFrom: '2026-04-25',
            dateTo: '2026-05-04',
            status: 'PROVIDER_RETENTION_LIMIT',
            attempts: 0,
            nextRetryAt: null,
            linkedPullTaskId: null,
            linkedSourceBatchId: null,
            rowOrItemCount: 0,
            failureType: 'provider_retention_limit',
            retryable: false,
            requiresManualAction: false,
            diagnosticSummary: 'history outside provider retention window'
          }
        ],
        statusDistribution: [
          { key: 'pending_confirmation', label: '待确认', value: 1 },
          { key: 'provider_retention_limit', label: 'PROVIDER_RETENTION_LIMIT', value: 1 }
        ],
        failureDistribution: [{ key: 'provider_retention_limit', label: 'provider_retention_limit', value: 1 }]
      }
    });
  });
  await page.route('**/api/system-reports/noon-data-completeness/gaps/910001/retry', async (route) => {
    retryCalled = true;
    await route.fulfill({
      json: {
        gapId: 910001,
        status: 'PENDING',
        plannedTaskCount: 1,
        message: '已提交安全巡检任务。'
      }
    });
  });

  await page.goto('/system-reports/noon-data-completeness?devSession=1&devRole=boss&grantSystemReports=1');

  await expect(page.getByTestId('noon-data-completeness-workbench')).toBeVisible();
  await expect(page.getByTestId('noon-data-completeness-workbench')).toContainText('数据完整度');
  await expect(page.getByTestId('noon-data-completeness-overview')).toContainText('数据类别');
  await expect(page.getByTestId('noon-data-completeness-category-chart')).toBeVisible();
  await expect(page.getByTestId('noon-data-completeness-latest-status-chart')).toBeVisible();
  await expect(page.getByTestId('noon-data-completeness-history-status-chart')).toBeVisible();
  await expect(page.getByTestId('noon-data-completeness-ledger')).toContainText('STR108065-NAE');
  await expect(page.getByTestId('noon-data-completeness-ledger')).toContainText('待确认');
  await expect(page.getByTestId('noon-data-completeness-ledger')).toContainText('未完成');

  await page.getByTestId('noon-data-filter-store').fill('STR108065-NAE');
  await page.getByTestId('noon-data-filter-submit').click();
  await expect.poll(() => overviewRequests.some((url) => url.includes('storeCode=STR108065-NAE'))).toBeTruthy();

  await page.getByRole('button', { name: '查看缺口' }).click();
  await expect(page.getByTestId('noon-data-gap-drilldown')).toBeVisible();
  await expect(page.getByTestId('noon-data-gap-drilldown')).toContainText('LATEST_DAILY');
  await expect(page.getByTestId('noon-data-gap-drilldown')).toContainText('empty_report_pending_confirmation');
  await expect(page.getByTestId('noon-data-gap-drilldown')).toContainText('[REDACTED]');

  await page.goto('/system-reports/noon-data-gaps?devSession=1&devRole=boss&grantSystemReports=1');

  await expect(page.getByTestId('noon-data-gap-patrol-workbench')).toBeVisible();
  await expect(page.getByTestId('noon-data-gap-patrol-workbench').getByRole('heading', { name: '数据缺口巡检' })).toHaveCount(0);
  await expect(page.getByTestId('noon-data-gap-patrol-workbench')).not.toContainText('系统报表 / 数据缺口巡检');
  await expect(page.getByTestId('noon-data-gap-status-chart')).toBeVisible();
  await expect(page.getByTestId('noon-data-gap-failure-chart')).toBeVisible();
  await expect(page.getByTestId('noon-data-gap-patrol-workbench')).toContainText('空报表待确认');
  await expect(page.getByTestId('noon-data-gap-patrol-workbench')).toContainText('超出保留期');
  await expect(page.getByTestId('noon-data-gap-patrol-workbench')).not.toContainText('provider_retention_limit');
  await expect(page.getByTestId('noon-data-gap-patrol-workbench')).not.toContainText('PROVIDER_RETENTION_LIMIT');
  await page.getByRole('button', { name: /重\s*试/ }).first().click();
  await expect.poll(() => retryCalled).toBeTruthy();
});

test('noon data gap patrol hides backend default empty error messages', async ({ page }) => {
  await page.route('**/api/system-reports/noon-data-completeness/gaps**', async (route) => {
    await route.fulfill({
      status: 500,
      json: {
        timestamp: '2026-05-25T10:30:00',
        status: 500,
        error: 'Internal Server Error',
        message: 'No message available',
        path: '/api/system-reports/noon-data-completeness/gaps'
      }
    });
  });

  await page.goto('/system-reports/noon-data-gaps?devSession=1&devRole=boss&grantSystemReports=1');

  const workbench = page.getByTestId('noon-data-gap-patrol-workbench');
  await expect(workbench).toBeVisible();
  await expect(workbench).not.toContainText('No message available');
  await expect(workbench).toContainText('数据缺口巡检加载失败');
  await expect(workbench).toContainText('后端返回 500');
});
