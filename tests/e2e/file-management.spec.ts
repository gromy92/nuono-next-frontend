import { expect, Page, test } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { e2eEnv } from '../utils/env';

const TEST_PREFIX = `${e2eEnv.dataPrefix}文件管理`;
const TEMPLATE_PATH = path.resolve(process.cwd(), 'public/templates/file-parse-template.xlsx');
const ORIGINAL_DOWNLOAD_PATTERN = /\/api\/system\/file-management\/files\/\d+\/original/;
const PARSED_DOWNLOAD_PATTERN = /\/api\/system\/file-management\/files\/\d+\/parsed/;
const OFFICIAL_STORAGE_UAE_URL =
  'https://support.noon.partners/portal/en/kb/articles/fulfilled-by-noon-fbn-fees-in-uae-11-3-2024#3_Monthly_Storage_Fees';
const STATIC_PARSE_TEMPLATES = [
  '/templates/file-parse-template.xlsx',
  '/templates/official-commission-fee-parse-template.xlsx',
  '/templates/official-fbn-outbound-fee-parse-template.xlsx',
  '/templates/official-storage-fee-parse-template.xlsx',
  '/templates/forwarder-document-parse-template.xlsx'
];

type CreatedFile = {
  name: string;
  originalPath?: string;
  parsedPath?: string;
};

test.describe.configure({ mode: 'serial' });

test.describe('系统文件管理', () => {
  let tempDir: string;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuono-file-management-e2e-'));
    cleanupTestRecords();
  });

  test.afterAll(() => {
    cleanupTestRecords();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!e2eEnv.allowWriteTests, 'Set E2E_ALLOW_WRITE_TESTS=true to run file-management write tests.');
    await ensureLoggedInAsAdmin(page);
  });

  test('TC-FM-001 列表页加载并展示指定列', async ({ page }) => {
    await gotoFileManagement(page);

    await expect(page.getByTestId('workspace-tabs-bar')).toBeVisible();
    await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '文件管理' })).toBeVisible();
    await expect(page.locator('h3', { hasText: '文件管理' })).toHaveCount(0);
    await expect(page.locator('h4', { hasText: '文件列表' })).toHaveCount(0);
    await expect(page.getByText('维护官方与货代文件的原始件、解析件和生效状态。')).toHaveCount(0);
    await expect(page.getByText(/上传、下载和规则生成在详情页操作。/)).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '文件类型' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '名称 / 版本' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '文件', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '官方发布时间' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '原始文件' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '解析模板' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '解析后文件' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '文件状态' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '文件更新时间' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '上传日期' })).toHaveCount(0);
    await expect(page.getByTestId('file-management-create-button')).toBeVisible();
    await expect(page.getByTestId('file-management-type-filter')).toBeVisible();
    await expect(page.getByTestId('file-management-status-filter')).toBeVisible();

    const yiteRow = page.locator('tr', { hasText: '义特' }).first();
    await expect(yiteRow.locator('td').nth(0)).toHaveText('货代文档');
  });

  test('TC-FM-002 新建页必填校验阻止空表单提交', async ({ page }) => {
    await gotoFileManagement(page);
    await page.getByTestId('file-management-create-button').click();
    await expect(page.getByTestId('file-management-create')).toBeVisible();

    await page.getByTestId('file-management-create-submit').click();

    await expect(page.getByText('请输入名称')).toBeVisible();
    await expect(page.getByText('请输入版本')).toBeVisible();
    await expect(page.getByText('请输入范围')).toBeVisible();
    await expect(page.getByTestId('file-management-create')).toBeVisible();
  });

  test('TC-FM-003 可只创建元信息，详情页保持待补状态且不能生成规则', async ({ page }) => {
    const fileName = `${TEST_PREFIX} 只建元信息`;

    await gotoFileManagement(page);
    await createFileMetadata(page, {
      name: fileName,
      fileType: '货代文档',
      version: 'meta-only',
      scope: '空运 / 附加费'
    });

    await expect(page.getByTestId('file-management-detail')).toBeVisible();
    await expect(page.locator('h3', { hasText: '文件详情' })).toHaveCount(0);
    await expect(
      page.getByText('解析由人工完成。系统在这里保留原始文件和解析后文件的上传、下载入口，并由管理员确认后生成规则。')
    ).toHaveCount(0);
    await expect(page.getByText(fileName)).toBeVisible();
    await page.getByTestId('file-management-detail-official-published-at-input').fill('2026-01-02');
    await page.getByTestId('file-management-detail-official-published-at-save').click();
    await expect(page.getByTestId('file-management-detail-official-published-at-input')).toHaveValue('2026-01-02');
    await expect(page.getByText('官方更新时间')).toHaveCount(0);
    await expect(page.getByText('原始文件更新时间')).toBeVisible();
    await expect(page.getByText('解析文件更新时间')).toBeVisible();
    await expect(page.getByTestId('file-management-parsed-section').getByText('待上传解析文件')).toBeVisible();
    await expect(page.getByTestId('file-management-generate-rules-button')).toBeDisabled();
    await expect(page.getByTestId('file-management-original-section-download-button')).toBeDisabled();
    await expect(page.getByTestId('file-management-parsed-section-download-button')).toBeDisabled();
  });

  test('TC-FM-004 新建时上传原始文件，详情页保留系统下载地址', async ({ page }) => {
    const originalPath = copyTemplate('tc004-original.xlsx');
    const fileName = `${TEST_PREFIX} 新建带原始文件`;

    await gotoFileManagement(page);
    await createFileMetadata(page, {
      name: fileName,
      fileType: '货代文档',
      version: 'create-original',
      scope: '空运 / 附加费',
      originalPath
    });

    await expect(page.getByTestId('file-management-detail')).toBeVisible();
    await expect(page.getByTestId('file-management-original-section')).toContainText('tc004-original.xlsx');
    const originalDownload = page.getByTestId('file-management-original-section-download-button');
    await expect(originalDownload).toHaveAttribute('href', ORIGINAL_DOWNLOAD_PATTERN);
    await expect(originalDownload).toHaveText('点击下载');
    await expect(page.getByTestId('file-management-generate-rules-button')).toBeDisabled();

    await page.getByTestId('file-management-back-to-list').click();
    await expect(page.getByTestId('file-management-list')).toBeVisible();
    const row = page.locator('tr', { hasText: fileName });
    await expect(row).toHaveCount(1);
    await expect(row.locator('a[href*="/original"]')).toHaveAttribute('href', ORIGINAL_DOWNLOAD_PATTERN);
    await expect(row.locator('a[href*="/original"]')).toHaveText('原始文件');
    await expect(row.locator('a[href="/templates/forwarder-document-parse-template.xlsx"]')).toHaveText('解析模板');
    await expect(row.getByText('解析后文件')).toBeVisible();
    await expect(row).not.toContainText('/api/system/file-management/files/');
  });

  test('TC-FM-005 详情页上传解析后文件后可生成规则并显示生效中', async ({ page }) => {
    const originalPath = copyTemplate('tc005-original.xlsx');
    const parsedPath = copyTemplate('tc005-parsed.xlsx');
    const fileName = `${TEST_PREFIX} 生成规则`;

    await gotoFileManagement(page);
    await createFileMetadata(page, {
      name: fileName,
      fileType: '货代文档',
      version: 'generate-ready',
      scope: '空运 / 附加费',
      originalPath
    });
    await uploadParsedFile(page, parsedPath);
    await page.getByTestId('file-management-generate-rules-button').click();

    await expect(page.getByText('生效中').first()).toBeVisible();
    await expect(page.getByText('规则已生成')).toBeVisible();
    await expect(page.getByTestId('file-management-parsed-section-download-button')).toHaveAttribute(
      'href',
      PARSED_DOWNLOAD_PATTERN
    );
    await expect(page.getByTestId('file-management-parsed-section-download-button')).toHaveText('点击下载');
  });

  test('TC-FM-006 同类型同范围新版本生效后，旧生效版本自动失效', async ({ page, request }) => {
    const listResponse = await request.get('/api/system/file-management/files');
    const listPayload = await listResponse.json();
    const activeForwarderFiles = (listPayload.files ?? []).filter(
      (file: { fileType: string; fileScope: string; status: string; name: string }) =>
        file.fileType === '货代文档' &&
        file.fileScope === '空运 / 附加费' &&
        file.status === 'active' &&
        !file.name.startsWith(TEST_PREFIX)
    );
    test.skip(activeForwarderFiles.length > 0, '当前已有非测试同范围货代文档生效中，跳过互斥生效测试以避免影响用户数据。');

    const oldFile: CreatedFile = {
      name: `${TEST_PREFIX} 旧版本`,
      originalPath: copyTemplate('tc006-old-original.xlsx'),
      parsedPath: copyTemplate('tc006-old-parsed.xlsx')
    };
    const newFile: CreatedFile = {
      name: `${TEST_PREFIX} 新版本`,
      originalPath: copyTemplate('tc006-new-original.xlsx'),
      parsedPath: copyTemplate('tc006-new-parsed.xlsx')
    };

    await gotoFileManagement(page);
    await createAndGenerateForwarderFile(page, oldFile);
    await page.getByTestId('file-management-back-to-list').click();
    await expect(page.getByTestId('file-management-list')).toBeVisible();

    await createAndGenerateForwarderFile(page, newFile);
    await page.getByTestId('file-management-back-to-list').click();
    await openRowDetail(page, oldFile.name);

    await expect(page.getByText('失效').first()).toBeVisible();
    await expect(page.getByText('历史规则')).toBeVisible();
  });

  test('TC-FM-007 同类型不同范围可以同时生效', async ({ page }) => {
    const commissionFile: CreatedFile = {
      name: `${TEST_PREFIX} 佣金费率`,
      originalPath: copyTemplate('tc007-commission-original.xlsx'),
      parsedPath: copyTemplate('tc007-commission-parsed.xlsx')
    };
    const outboundFile: CreatedFile = {
      name: `${TEST_PREFIX} 出仓费率`,
      originalPath: copyTemplate('tc007-outbound-original.xlsx'),
      parsedPath: copyTemplate('tc007-outbound-parsed.xlsx')
    };

    await gotoFileManagement(page);
    await createAndGenerateFile(page, {
      file: commissionFile,
      fileType: '货代文档',
      version: 'commission-active',
      scope: 'E2E 佣金费率'
    });
    await page.getByTestId('file-management-back-to-list').click();
    await expect(page.getByTestId('file-management-list')).toBeVisible();

    await createAndGenerateFile(page, {
      file: outboundFile,
      fileType: '货代文档',
      version: 'outbound-active',
      scope: 'E2E FBN 出仓费'
    });
    await page.getByTestId('file-management-back-to-list').click();

    await openRowDetail(page, commissionFile.name);
    await expect(page.getByText('生效中').first()).toBeVisible();
    await expect(page.getByText('规则已生成')).toBeVisible();
    await page.getByTestId('file-management-back-to-list').click();

    await openRowDetail(page, outboundFile.name);
    await expect(page.getByText('生效中').first()).toBeVisible();
    await expect(page.getByText('规则已生成')).toBeVisible();
  });

  test('TC-FM-008 不支持的文件类型上传失败并给出错误提示', async ({ page }) => {
    const badPath = path.join(tempDir, 'tc007-bad.exe');
    fs.writeFileSync(badPath, 'bad file');
    const fileName = `${TEST_PREFIX} 非法文件`;

    await gotoFileManagement(page);
    await createFileMetadata(page, {
      name: fileName,
      fileType: '货代文档',
      version: 'bad-extension',
      scope: '空运 / 附加费'
    });

    await page.locator('input[type="file"]').nth(0).setInputFiles(badPath);

    await expect(page.getByText('文件类型不支持')).toBeVisible();
    await expect(page.getByTestId('file-management-original-section-download-button')).toBeDisabled();
  });

  test('TC-FM-009 下载解析模板指向前端静态模板且是真实 xlsx', async ({ page, request }) => {
    await gotoFileManagement(page);
    await page.getByTestId('file-management-create-button').click();

    const templateLink = page.getByTestId('file-management-template-download');
    await expect(templateLink).toHaveAttribute('href', '/templates/file-parse-template.xlsx');
    await expect(templateLink).toHaveText('下载通用解析模板');
    for (const templateUrl of STATIC_PARSE_TEMPLATES) {
      const response = await request.get(templateUrl);
      expect(response.status(), templateUrl).toBe(200);
      const body = await response.body();
      expect(body.subarray(0, 4).toString('hex'), templateUrl).toBe('504b0304');
    }
  });

  test('TC-FM-010 列表和详情按官方费用类型提供解析模板下载', async ({ page }) => {
    await gotoFileManagement(page);

    const commissionRow = page.locator('tr', { hasText: '佣金费率 / EGY' }).first();
    await expect(
      commissionRow.locator('a[href="/templates/official-commission-fee-parse-template.xlsx"]')
    ).toHaveText('解析模板');

    const fbnRow = page.locator('tr', { hasText: 'FBN 出仓费 / EGY' }).first();
    await expect(
      fbnRow.locator('a[href="/templates/official-fbn-outbound-fee-parse-template.xlsx"]')
    ).toHaveText('解析模板');

    const storageRow = page.locator('tr', { hasText: '仓储费 / EGY' }).first();
    await expect(
      storageRow.locator('a[href="/templates/official-storage-fee-parse-template.xlsx"]')
    ).toHaveText('解析模板');
    await expect(storageRow.getByText('原始文件')).toBeVisible();
    await expect(storageRow.getByText('解析后文件')).toBeVisible();

    const storageUaeRow = page.locator('tr', { hasText: '仓储费 / UAE' }).first();
    await storageUaeRow.locator('button').first().click();
    await expect(page.getByTestId('file-management-detail')).toBeVisible();
    await expect(page.locator(`a[href="${OFFICIAL_STORAGE_UAE_URL}"]`)).toBeVisible();
    await page.getByTestId('file-management-back-to-list').click();
    await expect(page.getByTestId('file-management-list')).toBeVisible();

    await storageRow.locator('button').first().click();
    await expect(page.getByTestId('file-management-detail')).toBeVisible();
    await expect(page.getByTestId('file-management-parsed-section-template-download')).toHaveAttribute(
      'href',
      '/templates/official-storage-fee-parse-template.xlsx'
    );

    await page.getByTestId('file-management-back-to-list').click();
    await expect(page.getByTestId('file-management-list')).toBeVisible();
    await fbnRow.locator('button').first().click();
    await expect(page.getByTestId('file-management-detail')).toBeVisible();
    await expect(page.getByTestId('file-management-parsed-section-template-download')).toHaveAttribute(
      'href',
      '/templates/official-fbn-outbound-fee-parse-template.xlsx'
    );
  });

  test('TC-FM-011 删除文件记录后列表不再展示', async ({ page, request }) => {
    const fileName = `${TEST_PREFIX} 删除记录`;

    await gotoFileManagement(page);
    await createFileMetadata(page, {
      name: fileName,
      fileType: '货代文档',
      version: 'delete-case',
      scope: '空运 / 附加费'
    });

    await page.getByTestId('file-management-back-to-list').click();
    await expect(page.getByTestId('file-management-list')).toBeVisible();
    const row = page.locator('tr', { hasText: fileName });
    await expect(row).toHaveCount(1);
    await row.locator('button').nth(1).click();
    await expect(page.getByText('确认删除这条文件记录？')).toBeVisible();
    await page.locator('.ant-modal-confirm-btns button').last().click();
    await expect(row).toHaveCount(0);

    const listResponse = await request.get('/api/system/file-management/files');
    const listPayload = await listResponse.json();
    expect((listPayload.files ?? []).some((file: { name: string }) => file.name === fileName)).toBe(false);
  });
});

async function gotoFileManagement(page: Page) {
  await page.goto('/system/file-management?devSession=1');
  await expect(page.getByTestId('file-management-list')).toBeVisible();
}

async function createFileMetadata(
  page: Page,
  options: {
    name: string;
    fileType: '官方文档' | '货代文档';
    version: string;
    scope: string;
    officialPublishedAt?: string;
    originalPath?: string;
  }
) {
  await page.getByTestId('file-management-create-button').click();
  await expect(page.getByTestId('file-management-create')).toBeVisible();
  await selectFileType(page, options.fileType);
  await page.getByTestId('file-management-name-input').fill(options.name);
  await page.getByTestId('file-management-version-input').fill(options.version);
  await page.getByTestId('file-management-scope-input').fill(options.scope);
  if (options.officialPublishedAt) {
    await page.getByTestId('file-management-official-published-at-input').fill(options.officialPublishedAt);
  }
  await page.getByTestId('file-management-remark-input').fill('Playwright 自动测试，结束后清理');
  if (options.originalPath) {
    await page.locator('input[type="file"]').setInputFiles(options.originalPath);
    await expect(page.getByText(`已选择：${path.basename(options.originalPath)}`)).toBeVisible();
  }
  await page.getByTestId('file-management-create-submit').click();
  await expect(page.getByTestId('file-management-detail')).toBeVisible();
  await expect(page.getByText(options.name)).toBeVisible();
}

async function selectFileType(page: Page, fileType: '官方文档' | '货代文档') {
  if (fileType === '官方文档') {
    return;
  }
  await page.getByTestId('file-management-type-select').locator('.ant-select-selector').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
}

async function uploadParsedFile(page: Page, parsedPath: string) {
  await page.locator('input[type="file"]').nth(1).setInputFiles(parsedPath);
  await expect(page.getByTestId('file-management-parsed-section')).toContainText(path.basename(parsedPath));
}

async function createAndGenerateForwarderFile(page: Page, file: CreatedFile) {
  await createAndGenerateFile(page, {
    file,
    fileType: '货代文档',
    version: file.name.includes('旧') ? 'old-version' : 'new-version',
    scope: '空运 / 附加费'
  });
}

async function createAndGenerateFile(
  page: Page,
  options: {
    file: CreatedFile;
    fileType: '官方文档' | '货代文档';
    version: string;
    scope: string;
  }
) {
  await createFileMetadata(page, {
    name: options.file.name,
    fileType: options.fileType,
    version: options.version,
    scope: options.scope,
    originalPath: options.file.originalPath
  });
  await uploadParsedFile(page, options.file.parsedPath!);
  await page.getByTestId('file-management-generate-rules-button').click();
  await expect(page.getByText('生效中').first()).toBeVisible();
  await expect(page.getByText('规则已生成')).toBeVisible();
}

async function openRowDetail(page: Page, rowText: string) {
  const row = page.locator('tr', { hasText: rowText });
  await expect(row).toHaveCount(1);
  await row.locator('button').first().click();
  await expect(page.getByTestId('file-management-detail')).toBeVisible();
  await expect(page.getByText(rowText)).toBeVisible();
}

function copyTemplate(fileName: string) {
  const target = path.join(os.tmpdir(), fileName);
  fs.copyFileSync(TEMPLATE_PATH, target);
  return target;
}

function cleanupTestRecords() {
  const idsOutput = execFileSync('mysql', [
    '-uroot',
    '-proot',
    '-N',
    '-e',
    `SELECT id FROM nuono_new_dev.system_managed_file WHERE name LIKE '${TEST_PREFIX}%';`
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const ids = idsOutput.split('\n').map((id) => id.trim()).filter(Boolean);

  execFileSync('mysql', [
    '-uroot',
    '-proot',
    '-e',
    `DELETE FROM nuono_new_dev.system_managed_file WHERE name LIKE '${TEST_PREFIX}%';`
  ], { stdio: 'ignore' });

  for (const id of ids) {
    fs.rmSync(path.join(os.tmpdir(), 'nuono-next-system-files', id), { recursive: true, force: true });
  }
}
