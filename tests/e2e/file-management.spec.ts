import { expect, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { gotoFileManagement } from './file-management.driver';
import { mockParseCenterApis } from './file-management.mock';

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
