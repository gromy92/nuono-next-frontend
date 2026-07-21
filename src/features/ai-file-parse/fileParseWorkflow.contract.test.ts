import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mapProcessingItem } from './fileParseResultModel';
import { mapTargetPlan, mapTaskFromList } from './fileParseTaskModel';
import { buildVersionCompareRows } from './fileParseVersionModel';

const plan = mapTargetPlan({
  id: 7,
  code: 'logistics_quote',
  label: '物流报价',
  documentType: 'logistics',
  documentName: '物流报价表',
  standardVersion: 'V3',
  currentVersion: null,
  availableActions: { canCreateTask: true, canProcess: true, canPublish: false }
});
assert.equal(plan.id, '7');
assert.equal(plan.standardId, 'standard-7');
assert.equal(plan.currentVersion, '未发布');
assert.deepEqual(plan.availableActions, { canCreateTask: true, canProcess: true, canPublish: false });

const task = mapTaskFromList({
  id: 11,
  taskNo: 'TASK-11',
  documentTitle: '报价 7 月',
  targetPlanId: 7,
  targetPlanCode: 'logistics_quote',
  targetPlanLabel: '物流报价',
  documentType: 'logistics',
  documentName: '物流报价表',
  standardVersion: 'V3',
  currentVersion: null,
  status: 'failed',
  nextRunAt: '2026-07-20T11:12:13',
  dataScopeType: 'owner',
  dataScopeKey: '307',
  confirmedCount: 2,
  keepOldCount: 3,
  inputItems: [{
    id: 2,
    inputType: 'excel',
    inputRole: 'primary_source',
    fileAssetId: 99,
    displayName: '报价.xlsx',
    downloadUrl: '/api/files/99'
  }]
});
assert.equal(task.status, 'retry_waiting');
assert.equal(task.stats.confirmed, 5);
assert.equal(task.inputItems[0].inputType, 'EXCEL');
assert.equal(task.inputItems[0].downloadUrl, '/api/files/99');

const result = mapProcessingItem({
  itemId: 5,
  taskId: 11,
  resultId: 13,
  itemType: 'logistics_service_line',
  naturalKey: 'SA/AIR',
  changeType: 'changed',
  reviewStatus: 'needs_fix',
  confidence: 'low',
  validationStatus: 'hard_error',
  fields: { price: 12, rules: { unit: 'KG' } },
  oldFields: { price: 10 },
  changedFieldKeys: ['price'],
  evidence: { source: '报价.xlsx', sheet: 'SA', quote: '12/KG' },
  validationError: { message: '币种缺失' }
});
assert.equal(result.itemTypeLabel, '物流服务线路');
assert.equal(result.summary, 'price: 12');
assert.equal(result.fields.rules, '{"unit":"KG"}');
assert.equal(result.validationMessage, '币种缺失');
assert.equal(result.evidence, '报价.xlsx / SA / 12/KG');

const baseVersion = {
  id: '1', versionNo: 'V1', targetPlanId: '7', documentType: '', documentName: '', standardVersion: '',
  storeLabel: '全局', businessScopeText: '物流报价', publishedAt: '2026-07-19', publisherName: '-',
  sourceTaskId: '10', status: 'history' as const, inputSummary: '-', itemCount: 1
};
const targetVersion = { ...baseVersion, id: '2', versionNo: 'V2', status: 'active' as const };
const rows = buildVersionCompareRows([
  { id: 'a', versionId: '1', itemTypeLabel: '线路', naturalKey: 'SA/AIR', fields: { price: 10 } },
  { id: 'b', versionId: '2', itemTypeLabel: '线路', naturalKey: 'SA/AIR', fields: { price: 12 } },
  { id: 'c', versionId: '2', itemTypeLabel: '线路', naturalKey: 'AE/AIR', fields: { price: 8 } }
], ['price'], baseVersion, targetVersion);
assert.deepEqual(rows.map((row) => [row.naturalKey, row.changeType]), [
  ['SA/AIR', 'changed'],
  ['AE/AIR', 'added']
]);

const featureDir = dirname(fileURLToPath(import.meta.url));
const boardSource = readFileSync(join(featureDir, 'AiFileParseBoard.tsx'), 'utf8');
const sourceWorkflow = readFileSync(join(featureDir, 'useFileParseSourceWorkflow.ts'), 'utf8');
const reviewWorkflow = readFileSync(join(featureDir, 'useFileParseReviewWorkflow.ts'), 'utf8');
const snapshotWorkflow = readFileSync(join(featureDir, 'useFileParseSnapshot.ts'), 'utf8');
const apiSource = readFileSync(join(featureDir, 'api.ts'), 'utf8');
assert.ok(boardSource.split(/\r?\n/).length <= 300);
assert.doesNotMatch(boardSource, /AiFileParseBoardView/);
assert.match(sourceWorkflow, /void showRunResult\(String\(created\.id\), 'file-parse-create-run'\)/);
assert.match(reviewWorkflow, /\[detailLoadRevision, selectedTask\?\.id\]/);
assert.match(snapshotWorkflow, /setDetailLoadRevision\(\(current\) => current \+ 1\)/);
assert.match(snapshotWorkflow, /Promise\.all\(\[\s*fetchFileParseProcessingItems\(taskId\),\s*fetchFileParseOverviewItems\(taskId\),\s*fetchFileParseVersions\(detailTask\.targetPlanId\)/);
assert.match(apiSource, /from '\.\.\/\.\.\/shared\/api'/);
assert.doesNotMatch(apiSource, /\/workflow|\/source-rows|\/ai-chunks|\/validation-issues/);
for (const deletedFile of [
  'AiFileParseBoardView.tsx',
  'boardTransforms.tsx',
  'mockData.ts',
  'mockCatalog.ts',
  'mockLogs.ts'
]) {
  assert.equal(existsSync(join(featureDir, deletedFile)), false);
}
