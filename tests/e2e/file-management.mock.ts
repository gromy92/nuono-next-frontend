import type { Page } from '@playwright/test';
import { buildTask, taskFixtures } from './file-management.fixtures';
import { registerFileManagementDetailMocks } from './file-management-detail.mock';

export async function mockParseCenterApis(page: Page) {
  const deletedTaskIds = new Set<number>();
  const createdTasks: Array<ReturnType<typeof buildTask>> = [];

  await page.route('**/api/system/file-management**', async (route) => {
    throw new Error(`Unexpected legacy file-management API request: ${route.request().url()}`);
  });

  await page.route('**/api/store-sync/overview?**', async (route) => {
    await route.fulfill({
      json: {
        summary: { totalStores: 0, connectedStores: 0, disconnectedStores: 0 },
        stores: []
      }
    });
  });

  await page.route('**/api/file-management/parse/target-plans', async (route) => {
    await route.fulfill({
      json: [
        {
          id: 4001,
          code: 'commission_ksa',
          label: '佣金-KSA',
          documentType: 'official_fee',
          documentName: '佣金规则',
          standardVersion: 'STD-COMMISSION-2026-05',
          currentVersion: 'V2026.05',
          description: 'Noon KSA Referral Fees',
          availableActions: {
            canCreateTask: true,
            canProcess: true,
            canPublish: true,
            canManageStandard: true
          }
        },
        {
          id: 4005,
          code: 'logistics_yite',
          label: '物流-义特',
          documentType: 'logistics_rule',
          documentName: '物流渠道规则',
          standardVersion: 'STD-LOGISTICS-2026-05',
          currentVersion: 'V2026.05',
          description: '义特物流渠道方案',
          availableActions: {
            canCreateTask: true,
            canProcess: true,
            canPublish: true,
            canActivateLogisticsChannels: true
          }
        }
      ]
    });
  });

  await page.route('**/api/file-management/parse/tasks?**', async (route) => {
    const url = new URL(route.request().url());
    const targetPlanId = url.searchParams.get('targetPlanId');
    const status = url.searchParams.get('status');
    const keyword = url.searchParams.get('keyword')?.trim();
    const items = [...createdTasks, ...taskFixtures()].filter((task) => !deletedTaskIds.has(Number(task.id))).filter((task) => {
      if (targetPlanId && String(task.targetPlanId) !== targetPlanId) {
        return false;
      }
      if (status && task.status !== status) {
        return false;
      }
      if (keyword && !`${task.documentTitle} ${task.taskNo}`.includes(keyword)) {
        return false;
      }
      return true;
    });
    await route.fulfill({
      json: {
        total: items.length,
        page: 1,
        pageSize: 50,
        items
      }
    });
  });

  await page.route('**/api/file-management/parse/tasks', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as { documentTitle: string; targetPlanId: number };
    const created = buildTask({
      id: 2010 + createdTasks.length,
      title: body.documentTitle || '新建解析文档',
      status: 'reading'
    });
    created.targetPlanId = body.targetPlanId;
    createdTasks.unshift(created);
    await route.fulfill({ json: created });
  });

  await page.route('**/api/file-management/parse/tasks/2010/run', async () => {
    await new Promise(() => undefined);
  });

  await page.route('**/api/file-management/parse/tasks/2010', async (route) => {
    const created = createdTasks.find((task) => Number(task.id) === 2010);
    await route.fulfill({ json: created ?? buildTask({ id: 2010, title: '新建解析文档', status: 'reading' }) });
  });

  await page.route('**/api/file-management/parse/tasks/2001', async (route) => {
    if (route.request().method() === 'DELETE') {
      deletedTaskIds.add(2001);
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({
      json: {
        ...buildTask({ id: 2001, title: '佣金-KSA 解析中心验收', status: 'review_required', resultId: 9001, totalCount: 2, pendingCount: 1 }),
        inputItems: [
          {
            id: 7001,
            inputType: 'excel',
            inputRole: 'primary_source',
            fileAssetId: 6001,
            displayName: 'Noon佣金表.xlsx',
            downloadUrl: '/api/file-management/parse/tasks/2001/inputs/7001/download',
            sortNo: 1
          }
        ],
        remark: 'Parse center acceptance fixture'
      }
    });
  });
  await registerFileManagementDetailMocks(page, { deletedTaskIds });
}
