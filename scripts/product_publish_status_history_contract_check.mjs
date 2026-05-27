import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readSource(relativePath) {
  return readFileSync(path.resolve(root, relativePath), 'utf8');
}

function assertIncludes(source, expected, context) {
  assert(source.includes(expected), `${context} must include ${expected}`);
}

function assertExcludes(source, unexpected, context) {
  assert(!source.includes(unexpected), `${context} must not include ${unexpected}`);
}

function methodBody(source, signature, context) {
  const start = source.indexOf(signature);
  assert(start >= 0, `${context} must define ${signature}`);
  const next = source.indexOf('\n    private ', start + signature.length);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

const operationalCells = readSource('src/features/product-management/components/ProductListOperationalCells.tsx');
const historyModalHelpers = readSource('src/features/product-management/components/ProductHistoryModal.helpers.tsx');
const detailSyncAlert = readSource('src/features/product-management/components/ProductDetailSyncAlert.tsx');
const historyActions = readSource('src/features/product-management/hooks/useProductHistoryModalActions.ts');
const projectionService = readSource('../backend/src/main/java/com/nuono/next/product/ProductProjectionPersistenceService.java');
const publishHistoryAssembler = readSource('../backend/src/main/java/com/nuono/next/product/ProductPublishHistoryAssembler.java');
const productMapper = readSource('../backend/src/main/java/com/nuono/next/infrastructure/mapper/ProductManagementMapper.java');
const publishTaskListStatusLabelMethod = methodBody(
  publishHistoryAssembler,
  'public String publishTaskListStatusLabel(String status)',
  'Publish task list status label'
);
const publishTaskHistoryMessageMethod = methodBody(
  publishHistoryAssembler,
  'public String publishTaskHistoryMessage(ProductPublishTaskRecord task)',
  'Publish task history message'
);

assertIncludes(operationalCells, 'if (!task?.statusLabel)', 'Empty publish status cell');
assertExcludes(operationalCells, '未发布', 'Empty publish status copy');
assertIncludes(operationalCells, 'ProductPublishPopoverContent', 'Publish status popover');
assertIncludes(operationalCells, 'task.resultText', 'Publish status result text');
assertIncludes(operationalCells, 'task.finishedAt ?? task.submittedAt', 'Publish status time');
assertIncludes(operationalCells, 'change.before', 'Publish status change before value');
assertIncludes(operationalCells, 'change.after', 'Publish status change after value');

assertIncludes(historyActions, "historyKind === 'modification'", 'History fetch modification-only filter');
assertIncludes(historyModalHelpers, 'ProductHistoryDiffTable', 'History field diff table');
assertIncludes(historyModalHelpers, '修改前', 'History before column');
assertIncludes(historyModalHelpers, '修改后', 'History after column');
assertIncludes(historyModalHelpers, 'historyStatusMeta(item)', 'History status display');

assertIncludes(detailSyncAlert, 'CompactDetailNotice', 'Compact detail publish notice');
assertIncludes(detailSyncAlert, "display: 'inline-flex'", 'One-line detail publish notice');
assertExcludes(detailSyncAlert, '<Alert', 'Detail publish notice large block');

assertIncludes(publishTaskListStatusLabelMethod, '"cancelled".equalsIgnoreCase(normalized)', 'Cancelled publish task list label');
assertIncludes(publishTaskListStatusLabelMethod, 'return "已取消"', 'Cancelled publish task list label');
assertIncludes(publishTaskListStatusLabelMethod, '"write_unknown".equalsIgnoreCase(normalized)', 'Write-unknown publish task list label');
assertIncludes(publishTaskListStatusLabelMethod, 'return "发布中"', 'Write-unknown publish task list label');
assertIncludes(publishTaskHistoryMessageMethod, 'publishTaskChangedDomainText(task)', 'Pending manual check domain message');
assertIncludes(publishTaskHistoryMessageMethod, 'Noon 多轮回读仍未确认', 'Pending manual check detailed message');
assertIncludes(publishTaskHistoryMessageMethod, '"write_unknown".equalsIgnoreCase(status)', 'Write-unknown readback-only message');
assertIncludes(publishTaskHistoryMessageMethod, '系统只回读校验', 'Write-unknown readback-only message');
assertIncludes(projectionService, 'productPublishHistoryAssembler.buildLastPublishTaskSummary', 'Projection service delegates last publish task summary');
assertIncludes(projectionService, 'productPublishHistoryAssembler.buildPublishTaskHistoryItems', 'Projection service delegates publish history items');
assertIncludes(publishHistoryAssembler, 'buildProductModificationChanges(baseline, draft, task.getCurrentSiteCode())', 'Publish history field changes');
assertIncludes(publishHistoryAssembler, 'if (changes.isEmpty())', 'No-op publish history filter');

assertIncludes(productMapper, "SET status = 'write_unknown'", 'Stale running recovery status');
assertIncludes(productMapper, "status IN ('queued', 'submitted', 'verifying', 'pending_effective', 'write_unknown', 'verify_timeout')", 'Runnable task excludes running writes');
assertIncludes(productMapper, "发布任务执行中断，系统将只回读校验 Noon 当前结果。", 'Stale running recovery message');

console.log('product publish status/history contract check passed');
