import { expect, type Page } from '@playwright/test';
import {
  buildTask,
  commissionColumns,
  logisticsActivationFixture
} from './file-management.fixtures';
export async function registerFileManagementDetailMocks(
  page: Page,
  state: { deletedTaskIds: Set<number> }
) {
  const { deletedTaskIds } = state;
  await page.route('**/api/file-management/parse/tasks/2004', async (route) => {
    await route.fulfill({
      json: {
        ...buildTask({ id: 2004, title: '物流-义特等待重试样本', status: 'failed', nextRunAt: '2026-05-20T18:30:00' }),
        inputItems: [
          {
            id: 7041,
            inputType: 'pdf',
            inputRole: 'primary_source',
            fileAssetId: 6041,
            displayName: 'ET物流报价-20260414入仓生效.pdf',
            downloadUrl: '/api/file-management/parse/tasks/2004/inputs/7041/download',
            sortNo: 1
          }
        ],
        remark: 'Logistics activation fixture'
      }
    });
  });
  await page.route('**/api/file-management/parse/tasks/2003', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 500,
      json: { message: '删除解析文档失败' }
    });
  });
  await page.route('**/api/file-management/parse/tasks/2004/workflow', async (route) => {
    await route.fulfill({
      json: {
        taskId: 2004,
        status: 'failed',
        steps: [
          { key: 'source_extract', label: '源内容抽取', status: 'succeeded', count: 1 },
          { key: 'ai_parse', label: 'AI解析', status: 'failed', count: 1 }
        ],
        coverage: {
          sourceRows: 1,
          processedSourceRows: 0,
          unprocessedSourceRows: 1,
          resultItems: 0,
          hardErrors: 0
        }
      }
    });
  });
  await page.route('**/api/file-management/parse/tasks/2004/source-rows?**', async (route) => {
    throw new Error(`Unexpected parse process API request: ${route.request().url()}`);
  });
  await page.route('**/api/file-management/parse/tasks/2004/ai-chunks?**', async (route) => {
    throw new Error(`Unexpected parse process API request: ${route.request().url()}`);
  });
  await page.route('**/api/file-management/parse/tasks/2004/validation-issues?**', async (route) => {
    throw new Error(`Unexpected parse process API request: ${route.request().url()}`);
  });
  await page.route('**/api/file-management/parse/tasks/2001/workflow', async (route) => {
    await route.fulfill({
      json: {
        taskId: 2001,
        status: 'review_required',
        steps: [
          { key: 'source_extract', label: '源内容抽取', status: 'succeeded', count: 1 },
          { key: 'ai_parse', label: 'AI解析', status: 'succeeded', count: 1 },
          { key: 'validation', label: '结构化校验', status: 'succeeded', count: 1 }
        ],
        coverage: {
          sourceRows: 1,
          processedSourceRows: 1,
          unprocessedSourceRows: 0,
          resultItems: 2,
          hardErrors: 0
        }
      }
    });
  });
  await page.route('**/api/file-management/parse/tasks/2001/source-rows?**', async (route) => {
    throw new Error(`Unexpected parse process API request: ${route.request().url()}`);
  });
  await page.route('**/api/file-management/parse/tasks/2001/ai-chunks?**', async (route) => {
    throw new Error(`Unexpected parse process API request: ${route.request().url()}`);
  });
  await page.route('**/api/file-management/parse/tasks/2001/validation-issues?**', async (route) => {
    throw new Error(`Unexpected parse process API request: ${route.request().url()}`);
  });
  await page.route('**/api/file-management/parse/tasks/2001/processing-items?**', async (route) => {
    await route.fulfill({
      json: {
        taskId: 2001,
        resultId: 9001,
        revisionNo: 1,
        total: 2,
        page: 1,
        pageSize: 100,
        columns: commissionColumns(),
        items: [
          {
            itemId: 9101,
            taskId: 2001,
            resultId: 9001,
            itemType: 'commission_rule',
            naturalKey: 'KSA|Colour Cosmetics|Generic brand|ALL|2026-05-20',
            changeType: 'added',
            reviewStatus: 'confirmed',
            confidence: 'high',
            validationStatus: 'pass',
            fields: {
              country: 'KSA',
              categoryPath: 'Beauty / Colour Cosmetics',
              brandRestriction: 'Generic brand',
              commissionRate: '15%',
              effectiveDate: '2026-05-20'
            },
            changedFieldKeys: ['commissionRate'],
            evidence: { source: 'Noon佣金表.xlsx', sheet: 'Sheet1', quote: '第 12 行' },
            validationError: null,
            sortNo: 1
          },
          {
            itemId: 9102,
            taskId: 2001,
            resultId: 9001,
            itemType: 'commission_rule',
            naturalKey: 'KSA|Colour Cosmetics|All other brands|ALL|2026-05-20',
            changeType: 'added',
            reviewStatus: 'pending',
            confidence: 'medium',
            validationStatus: 'warning',
            fields: {
              country: 'KSA',
              categoryPath: 'Beauty / Colour Cosmetics',
              brandRestriction: 'All other brands',
              commissionRate: '10%',
              effectiveDate: '2026-05-20'
            },
            changedFieldKeys: ['commissionRate'],
            evidence: { source: 'Noon佣金表.xlsx', sheet: 'Sheet1', quote: '第 12 行' },
            validationError: { message: '品牌限制需要人工确认' },
            sortNo: 2
          }
        ]
      }
    });
  });
  await page.route('**/api/file-management/parse/tasks/2001/overview-items?**', async (route) => {
    await route.fulfill({
      json: {
        taskId: 2001,
        resultId: 9001,
        total: 1,
        page: 1,
        pageSize: 100,
        columns: commissionColumns(),
        items: [
          {
            itemId: 9101,
            taskId: 2001,
            resultId: 9001,
            itemType: 'commission_rule',
            naturalKey: 'KSA|Colour Cosmetics|Generic brand|ALL|2026-05-20',
            fields: {
              country: 'KSA',
              categoryPath: 'Beauty / Colour Cosmetics',
              brandRestriction: 'Generic brand',
              commissionRate: '15%',
              effectiveDate: '2026-05-20'
            },
            sourceResultItemId: 9101,
            sortNo: 1
          }
        ]
      }
    });
  });
  await page.route('**/api/file-management/parse/target-plans/4001/versions?**', async (route) => {
    await route.fulfill({
      json: {
        targetPlanId: 4001,
        total: 1,
        page: 1,
        pageSize: 100,
        items: [
          {
            versionId: 3001,
            versionNo: 'V2026.05',
            targetPlanId: 4001,
            sourceTaskId: 2001,
            sourceResultId: 9001,
            status: 'active',
            publishedAt: '2026-05-20T12:00:00',
            publishedBy: 1,
            summary: { itemCount: 1, inputSummary: 'Noon佣金表.xlsx' }
          }
        ]
      }
    });
  });
  await page.route('**/api/file-management/parse/target-plans/4005/versions?**', async (route) => {
    await route.fulfill({
      json: {
        targetPlanId: 4005,
        total: 1,
        page: 1,
        pageSize: 100,
        items: [
          {
            versionId: 5005,
            versionNo: 'ET-KSA-FBN-2026-05',
            targetPlanId: 4005,
            sourceTaskId: 2004,
            sourceResultId: 9401,
            status: 'active',
            publishedAt: '2026-05-20T12:30:00',
            publishedBy: 1,
            summary: { itemCount: 5, inputSummary: 'ET物流报价-20260414入仓生效.pdf' }
          }
        ]
      }
    });
  });
  await page.route('**/api/file-management/parse/versions/3001/items?**', async (route) => {
    await route.fulfill({
      json: {
        versionId: 3001,
        versionNo: 'V2026.05',
        targetPlanId: 4001,
        total: 1,
        page: 1,
        pageSize: 100,
        columns: commissionColumns(),
        items: [
          {
            versionItemId: 3101,
            versionId: 3001,
            itemType: 'commission_rule',
            naturalKey: 'KSA|Colour Cosmetics|Generic brand|ALL|2026-05-20',
            fields: {
              country: 'KSA',
              categoryPath: 'Beauty / Colour Cosmetics',
              brandRestriction: 'Generic brand',
              commissionRate: '15%',
              effectiveDate: '2026-05-20'
            },
            sourceResultItemId: 9101,
            sortNo: 1
          }
        ]
      }
    });
  });
  await page.route('**/api/file-management/parse/logistics-channel-activations?**', async (route) => {
    await route.fulfill({
      json: logisticsActivationFixture()
    });
  });
  await page.route('**/api/file-management/parse/logistics-channel-activations', async (route) => {
    expect(route.request().method()).toBe('POST');
    const body = route.request().postDataJSON() as { targetPlanId: number; versionId: number; selectedChannelKeys: string[] };
    expect(body).toEqual({
      targetPlanId: 4005,
      versionId: 5005,
      selectedChannelKeys: ['ET KSA cargo air']
    });
    await route.fulfill({
      json: logisticsActivationFixture()
    });
  });
  await page.route('**/api/file-management/parse/tasks/2005', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }
    deletedTaskIds.add(2005);
    await route.fulfill({ status: 204 });
  });
}
