import { expect, Page, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { e2eEnv } from '../utils/env';
import { appPath } from '../utils/navigation';

test.describe('系统文件管理解析中心', () => {
  test.beforeEach(async ({ page }) => {
    await mockParseCenterApis(page);
    await ensureLoggedInAsAdmin(page);
  });

  test('TC-FM-001 正式入口展示目标输出方案驱动的解析文档列表', async ({ page }) => {
    await gotoFileManagement(page);

    await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '文件管理' })).toBeVisible();
    await expect(page.getByTestId('file-parse-workbench')).toBeVisible();
    await expect(page.getByTestId('file-parse-task-list')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '文档名称' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '目标输出方案' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '输入项' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '解析状态' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '当前生效版本' })).toBeVisible();

    await expect(page.getByText('佣金-KSA 解析中心验收')).toBeVisible();
    await expect(page.getByRole('cell', { name: '佣金-KSA' }).first()).toBeVisible();
    await expect(page.getByText('解析中').first()).toBeVisible();
    await expect(page.getByText('失败').first()).toBeVisible();
    await expect(page.getByText('等待重试').first()).toBeVisible();
    await expect(page.getByText('待处理').first()).toBeVisible();
    await expect(page.getByRole('row', { name: /佣金-KSA 解析中心验收/ }).getByRole('link', { name: 'Noon佣金表.xlsx' })).toBeVisible();
    await expect(page.getByRole('row', { name: /已发布佣金文档/ }).getByRole('link', { name: '已发布佣金表.xlsx' })).toBeVisible();
    await expect(page.getByRole('row', { name: /已发布佣金文档/ }).getByText('待确认 0')).toHaveCount(0);
    await expect(page.getByRole('row', { name: /已发布佣金文档/ }).getByText('硬错误 0')).toHaveCount(0);
    await expect(page.getByRole('row', { name: /已发布佣金文档/ }).getByText('冲突 0')).toHaveCount(0);

    await expect(page.getByRole('columnheader', { name: '文件类型' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '原始文件' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '解析后文件' })).toHaveCount(0);
    await expect(page.getByText('生成规则')).toHaveCount(0);
    await expect(page.getByText('/api/system/file-management/files')).toHaveCount(0);
  });

  test('TC-FM-002 兼容 AI 文件解析入口进入同一个解析中心', async ({ page }) => {
    await page.goto(appPath(withDevSession('/system/ai-file-parse')));

    await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '文件管理' })).toBeVisible();
    await expect(page.getByTestId('file-parse-workbench')).toBeVisible();
    await expect(page.getByTestId('file-parse-task-list')).toBeVisible();
    await expect(page.getByText('佣金-KSA 解析中心验收')).toBeVisible();
    await expect(page.getByText('AI 文件解析')).toHaveCount(0);
  });

  test('TC-FM-003 新建解析文档使用目标输出方案和统一输入项', async ({ page }) => {
    await gotoFileManagement(page);

    await page.getByTestId('file-parse-create-button').click();

    await expect(page.getByText('新建解析文档').first()).toBeVisible();
    await expect(page.getByTestId('file-parse-create-target-plan-select')).toBeVisible();
    await expect(page.getByText('当前可用目标输出方案')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /佣金-KSA/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /物流-义特/ })).toHaveCount(0);
    await expect(page.getByText('上传文件、图片、PDF 或 Excel')).toBeVisible();
    await expect(page.getByLabel('OCR 文本')).toBeVisible();
    await expect(page.getByLabel('人工补充文案')).toBeVisible();

    await expect(page.getByText('原始文件')).toHaveCount(0);
    await expect(page.getByText('解析后文件')).toHaveCount(0);
    await expect(page.getByText('生成规则')).toHaveCount(0);
  });

  test('TC-FM-011 新建文档发起解析后允许再次打开创建弹窗', async ({ page }) => {
    await gotoFileManagement(page);

    await page.getByTestId('file-parse-create-button').click();
    await page.getByLabel('文档名称').fill('佣金二次创建样本');
    await page.getByTestId('file-parse-create-target-plan-select').click();
    await page.locator('.ant-select-item-option[title="佣金-KSA / 佣金规则"]').click();
    await page.getByLabel('人工补充文案').fill('Beauty / Colour Cosmetics Generic brand 15% effective 2026-05-20');

    const runRequest = page.waitForRequest((request) =>
      request.method() === 'POST' && request.url().includes('/api/file-management/parse/tasks/2010/run')
    );
    await page.locator('.ant-drawer').getByRole('button', { name: '创建解析文档' }).click();
    await runRequest;

    await page.getByRole('button', { name: '返回列表' }).click();
    await page.getByTestId('file-parse-create-button').click();
    const submitButton = page.locator('.ant-drawer').getByRole('button', { name: '创建解析文档' });
    await expect(submitButton).toBeEnabled();
    await expect(submitButton.locator('.ant-btn-loading-icon')).toHaveCount(0);
  });

  test('TC-FM-006 文件列表支持目标方案、状态和关键词筛选', async ({ page }) => {
    await gotoFileManagement(page);

    await expect(page.getByTestId('file-parse-task-filter-bar')).toBeVisible();

    await page.getByTestId('file-parse-target-plan-filter').click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('物流-义特等待重试样本')).toBeVisible();
    await expect(page.getByText('佣金-KSA 解析中心验收')).toHaveCount(0);

    await page.getByTestId('file-parse-status-filter').click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('搜索文档名或任务号').fill('等待');

    await expect(page.getByText('物流-义特等待重试样本')).toBeVisible();
    await expect(page.getByText('出仓费失败样本')).toHaveCount(0);

    await page.getByRole('button', { name: '重置筛选' }).click();
    await expect(page.getByText('佣金-KSA 解析中心验收')).toBeVisible();
    await expect(page.getByText('出仓费失败样本')).toBeVisible();
  });

  test('TC-FM-007 文件列表允许删除已发布解析文档并提示会删除生效结果', async ({ page }) => {
    await gotoFileManagement(page);

    const row = page.locator('tr', { hasText: '已发布佣金文档' });
    await row.getByRole('button', { name: '删除' }).click();

    await expect(page.getByText('删除解析文档')).toBeVisible();
    await expect(page.getByText('会删除该文档及其解析记录、已发布版本和当前生效业务结果，删除后不会自动恢复上一版。')).toBeVisible();

    const deleteRequest = page.waitForRequest((request) =>
      request.method() === 'DELETE' && request.url().includes('/api/file-management/parse/tasks/2005')
    );
    await page.getByRole('button', { name: '确认删除' }).click();
    await deleteRequest;

    await expect(page.getByText('已删除解析文档')).toBeVisible();
    await expect(page.getByText('已发布佣金文档')).toHaveCount(0);
  });

  test('TC-FM-008 取消删除不会发送删除请求也不会移除列表行', async ({ page }) => {
    const deleteRequests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'DELETE' && request.url().includes('/api/file-management/parse/tasks/2005')) {
        deleteRequests.push(request.url());
      }
    });
    await gotoFileManagement(page);

    const row = page.locator('tr', { hasText: '已发布佣金文档' });
    await row.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: /取\s*消/ }).click();

    await expect(page.getByText('删除解析文档')).toHaveCount(0);
    await expect(row).toBeVisible();
    expect(deleteRequests).toHaveLength(0);
  });

  test('TC-FM-009 文件列表支持批量删除多个解析文档', async ({ page }) => {
    await gotoFileManagement(page);

    await page.locator('tr', { hasText: '佣金-KSA 解析中心验收' }).getByRole('checkbox').check();
    await page.locator('tr', { hasText: '已发布佣金文档' }).getByRole('checkbox').check();

    await expect(page.getByText('已选择 2 个')).toBeVisible();
    await page.getByRole('button', { name: '批量删除' }).click();

    await expect(page.getByText('批量删除解析文档')).toBeVisible();
    await expect(page.getByText('会删除选中的 2 个文档及其解析记录、已发布版本和当前生效业务结果，删除后不会自动恢复上一版。')).toBeVisible();

    const deleteTask2001 = page.waitForRequest((request) =>
      request.method() === 'DELETE' && request.url().includes('/api/file-management/parse/tasks/2001')
    );
    const deleteTask2005 = page.waitForRequest((request) =>
      request.method() === 'DELETE' && request.url().includes('/api/file-management/parse/tasks/2005')
    );
    await page.getByRole('button', { name: '确认批量删除' }).click();
    await Promise.all([deleteTask2001, deleteTask2005]);

    await expect(page.getByText('删除成功 2 个，失败 0 个')).toBeVisible();
    await expect(page.getByText('佣金-KSA 解析中心验收')).toHaveCount(0);
    await expect(page.getByText('已发布佣金文档')).toHaveCount(0);
  });

  test('TC-FM-010 批量删除部分失败时继续删除成功项并保留失败项', async ({ page }) => {
    await gotoFileManagement(page);

    await page.locator('tr', { hasText: '出仓费失败样本' }).getByRole('checkbox').check();
    await page.locator('tr', { hasText: '已发布佣金文档' }).getByRole('checkbox').check();

    await page.getByRole('button', { name: '批量删除' }).click();

    const deleteTask2003 = page.waitForRequest((request) =>
      request.method() === 'DELETE' && request.url().includes('/api/file-management/parse/tasks/2003')
    );
    const deleteTask2005 = page.waitForRequest((request) =>
      request.method() === 'DELETE' && request.url().includes('/api/file-management/parse/tasks/2005')
    );
    await page.getByRole('button', { name: '确认批量删除' }).click();
    await Promise.all([deleteTask2003, deleteTask2005]);

    await expect(page.getByText('删除成功 1 个，失败 1 个')).toBeVisible();
    await expect(page.getByText('已发布佣金文档')).toHaveCount(0);
    await expect(page.getByText('出仓费失败样本')).toBeVisible();
  });

  test('TC-FM-004 详情页展示结果处理和版本数据，不展示解析过程', async ({ page }) => {
    await gotoFileManagement(page);

    const row = page.locator('tr', { hasText: '佣金-KSA 解析中心验收' });
    await row.getByRole('button', { name: '详情' }).click();

    await expect(page.getByTestId('file-parse-detail')).toBeVisible();
    await expect(page.getByRole('tab', { name: '结果处理' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '解析处理' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: '解析总览' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '解析过程' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: '版本对比' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '版本历史' })).toBeVisible();
    await expect(page.getByText('来源证据')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Noon佣金表.xlsx / Sheet1 / 第 12 行' }).first()).toBeVisible();

    await page.getByRole('tab', { name: '解析总览' }).click();
    await expect(page.getByRole('columnheader', { name: '结果类型' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '佣金规则' }).first()).toBeVisible();

    await expect(page.getByText('SOURCE_ROW_ID=8001')).toHaveCount(0);

    await expect(page.getByText('原始文件更新时间')).toHaveCount(0);
    await expect(page.getByText('解析文件更新时间')).toHaveCount(0);
    await expect(page.getByText('生成规则')).toHaveCount(0);
  });

  test('TC-FM-005 物流版本页按服务线展示生效选择和关联报价包', async ({ page }) => {
    await gotoFileManagement(page);

    const row = page.locator('tr', { hasText: '物流-义特等待重试样本' });
    await row.getByRole('button', { name: '详情' }).click();
    await expect(page.getByTestId('file-parse-detail')).toBeVisible();

    await page.getByRole('tab', { name: '版本历史' }).click();

    await expect(page.getByText('物流服务线生效')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '服务线标识' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '目的节点' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '关联报价包' })).toBeVisible();
    await expect(page.getByText('ET KSA cargo air')).toBeVisible();
    await expect(page.getByText('Riyadh FBN warehouse')).toBeVisible();
    await expect(page.getByText('分类 1')).toBeVisible();
    await expect(page.getByText('基础价 1')).toBeVisible();
    await expect(page.getByText('附加费 1')).toBeVisible();
    await expect(page.getByText('计费 1')).toBeVisible();
    await expect(page.getByText('仓费 1')).toBeVisible();
    await expect(page.getByText('限制 1')).toBeVisible();

    await page.getByRole('button', { name: '保存生效服务线' }).click();
    await expect(page.getByText('已保存物流服务线生效选择')).toBeVisible();
  });
});

async function gotoFileManagement(page: Page) {
  await page.goto(appPath(withDevSession('/system/file-management')));
  await expect(page.getByTestId('file-parse-workbench')).toBeVisible();
}

function withDevSession(path: string): string {
  if (!e2eEnv.useDevSession) {
    return path;
  }
  return `${path}${path.includes('?') ? '&' : '?'}devSession=1`;
}

async function mockParseCenterApis(page: Page) {
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

function logisticsActivationFixture() {
  return {
    targetPlanId: 4005,
    targetPlanCode: 'logistics_yite',
    targetPlanLabel: '物流-义特',
    versionId: 5005,
    versionNo: 'ET-KSA-FBN-2026-05',
    ownerUserId: 1,
    selectedChannelKeys: ['ET KSA cargo air'],
    channels: [
      {
        versionItemId: 5101,
        naturalKey: 'ET|KSA|FBN|cargo_air|warehouse_to_fbn|Riyadh FBN warehouse',
        channelKey: 'ET KSA cargo air',
        country: 'KSA',
        city: 'Riyadh FBN warehouse',
        shippingMethod: 'cargo_air',
        feeItem: 'warehouse_to_fbn',
        billingRule: 'weekly',
        leadTime: '3-5 days',
        selected: true,
        fields: {
          itemType: 'logistics_service_line',
          relatedItemCounts: {
            logistics_cargo_category: 1,
            logistics_base_price: 1,
            logistics_surcharge: 1,
            logistics_billing_rule: 1,
            logistics_warehouse_service_fee: 1,
            logistics_restriction: 1
          }
        }
      }
    ]
  };
}

function buildTask(options: {
  id: number;
  title: string;
  status: string;
  resultId?: number;
  totalCount?: number;
  pendingCount?: number;
  failureMessage?: string;
  nextRunAt?: string;
}) {
  return {
    id: options.id,
    taskNo: `TASK-${options.id}`,
    documentTitle: options.title,
    targetPlanId: options.title.includes('物流') ? 4005 : 4001,
    targetPlanCode: options.title.includes('物流') ? 'logistics_yite' : 'commission_ksa',
    targetPlanLabel: options.title.includes('物流') ? '物流-义特' : '佣金-KSA',
    documentType: options.title.includes('物流') ? 'logistics_rule' : 'official_fee',
    documentName: options.title.includes('物流') ? '物流渠道规则' : '佣金规则',
    standardVersion: options.title.includes('物流') ? 'STD-LOGISTICS-2026-05' : 'STD-COMMISSION-2026-05',
    currentVersion: 'V2026.05',
    status: options.status,
    dataScopeType: 'global',
    dataScopeKey: 'global',
    documentGroupId: options.id,
    iterationNo: 1,
    resultId: options.resultId ?? null,
    failureMessage: options.failureMessage ?? null,
    nextRunAt: options.nextRunAt ?? null,
    totalCount: options.totalCount ?? 0,
    pendingCount: options.pendingCount ?? 0,
    needsFixCount: 0,
    hardErrorCount: 0,
    conflictCount: 0,
    deleteSuspectedCount: 0,
    confirmedCount: options.totalCount ? Math.max(options.totalCount - (options.pendingCount ?? 0), 0) : 0,
    rejectedCount: 0,
    keepOldCount: 0,
    createdAt: '2026-05-20T10:00:00',
    updatedAt: '2026-05-20T10:30:00',
    availableActions: {
      canCreateTask: true,
      canProcess: true,
      canPublish: true,
      canManageStandard: true,
      canActivateLogisticsChannels: true
    }
  };
}

function taskFixtures() {
  return [
    withInputItems(buildTask({ id: 2001, title: '佣金-KSA 解析中心验收', status: 'review_required', resultId: 9001, totalCount: 2, pendingCount: 1 }), 'Noon佣金表.xlsx'),
    withInputItems(buildTask({ id: 2002, title: '佣金-UAE 解析中样本', status: 'parsing' }), 'Noon UAE 佣金表.pdf'),
    buildTask({ id: 2003, title: '出仓费失败样本', status: 'failed', failureMessage: 'AI provider timeout' }),
    withInputItems(buildTask({ id: 2004, title: '物流-义特等待重试样本', status: 'failed', nextRunAt: '2026-05-20T18:30:00' }), 'ET物流报价-20260414入仓生效.pdf'),
    withInputItems(buildTask({ id: 2005, title: '已发布佣金文档', status: 'published', resultId: 9005, totalCount: 1, pendingCount: 0 }), '已发布佣金表.xlsx')
  ];
}

function withInputItems(task: ReturnType<typeof buildTask>, displayName: string) {
  return {
    ...task,
    inputItems: [
      {
        id: Number(task.id) + 5000,
        inputType: displayName.endsWith('.pdf') ? 'pdf' : 'excel',
        inputRole: 'primary_source',
        fileAssetId: Number(task.id) + 6000,
        displayName,
        downloadUrl: `/api/file-management/parse/files/${Number(task.id) + 6000}/download`,
        sortNo: 1
      }
    ]
  };
}

function commissionColumns() {
  return [
    { key: 'country', label: '国家', type: 'text', tableVisible: true, width: 100 },
    { key: 'categoryPath', label: '类目路径', type: 'text', tableVisible: true, width: 220 },
    { key: 'brandRestriction', label: '品牌限制', type: 'text', tableVisible: true, width: 160 },
    { key: 'commissionRate', label: '佣金率', type: 'text', tableVisible: true, width: 100 },
    { key: 'effectiveDate', label: '生效日期', type: 'date', tableVisible: true, width: 140 }
  ];
}
