import { strict as assert } from 'node:assert';
import * as fileParseApi from './api';

type FetchCall = { input: RequestInfo | URL; init?: RequestInit };
const previousFetch = globalThis.fetch;
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const calls: FetchCall[] = [];

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: { hostname: 'localhost' },
    localStorage: { getItem: () => JSON.stringify({ userId: 307, roleId: 8, level: 1 }) }
  }
});

globalThis.fetch = async (input, init) => {
  const index = calls.length;
  calls.push({ input, init });
  if (index === 3) return new Response(null, { status: 204 });
  if (index === 9) {
    return new Response(new Blob(['xlsx']), {
      headers: { 'Content-Disposition': "attachment; filename*=UTF-8''%E8%A7%A3%E6%9E%90.xlsx" }
    });
  }
  return Response.json({ requestIndex: index, items: [] });
};

try {
  assert.deepEqual(Object.keys(fileParseApi).sort(), [
    'batchAcceptFileParseItems',
    'buildFileParseOverviewExportUrl',
    'createFileParseIdempotencyKey',
    'createFileParseTask',
    'deleteFileParseTask',
    'downloadFileParseOverview',
    'fetchFileParseLogisticsActivations',
    'fetchFileParseOverviewItems',
    'fetchFileParseProcessingItems',
    'fetchFileParseTargetPlans',
    'fetchFileParseTaskDetail',
    'fetchFileParseTasks',
    'fetchFileParseVersionItems',
    'fetchFileParseVersions',
    'publishFileParseTask',
    'reviewFileParseItem',
    'runFileParseTask',
    'saveFileParseLogisticsActivations',
    'uploadFileParseInput'
  ]);

  await fileParseApi.fetchFileParseTargetPlans();
  await fileParseApi.fetchFileParseTasks({ keyword: '物流 / SA', targetPlanId: 7, status: 'failed', page: 2, pageSize: 50 });
  await fileParseApi.fetchFileParseTaskDetail('task/一');
  await fileParseApi.deleteFileParseTask('task/一');
  const uploadFile = new File(['content'], '报价.xlsx', { type: 'application/vnd.ms-excel' });
  await fileParseApi.uploadFileParseInput('plan/一', uploadFile);
  await fileParseApi.createFileParseTask({
    documentTitle: '物流报价',
    targetPlanId: 7,
    inputItems: [{ inputType: 'file', inputRole: 'primary_source', fileAssetId: 9 }]
  }, 'create-key');
  await fileParseApi.runFileParseTask('task/一');
  await fileParseApi.fetchFileParseProcessingItems('task/一', 321);
  await fileParseApi.fetchFileParseOverviewItems('task/一', 654);
  const download = await fileParseApi.downloadFileParseOverview('task/一');
  assert.equal(download.fileName, '解析.xlsx');
  assert.equal(await download.blob.text(), 'xlsx');
  await fileParseApi.fetchFileParseVersions('plan/一', 12);
  await fileParseApi.fetchFileParseVersionItems('version/一', 34);
  await fileParseApi.reviewFileParseItem(
    'task/一', 'item/一', 'keep-old', { expectedResultId: 3, reason: '保留' }, 'review-key'
  );
  await fileParseApi.batchAcceptFileParseItems(
    'task/一', { expectedResultId: 3, itemIds: [1, 2], remark: '批量确认' }, 'batch-key'
  );
  await fileParseApi.publishFileParseTask(
    'task/一', { expectedResultId: 3, confirmMessage: '确认发布' }, 'publish-key'
  );
  await fileParseApi.fetchFileParseLogisticsActivations('plan/一', 'version/一');
  await fileParseApi.saveFileParseLogisticsActivations({
    targetPlanId: 7,
    versionId: 8,
    selectedChannelKeys: ['SA/AIR']
  });

  assert.deepEqual(calls.map((call) => String(call.input)), [
    '/api/file-management/parse/target-plans',
    '/api/file-management/parse/tasks?keyword=%E7%89%A9%E6%B5%81+%2F+SA&targetPlanId=7&status=failed&page=2&pageSize=50',
    '/api/file-management/parse/tasks/task/一',
    '/api/file-management/parse/tasks/task/一',
    '/api/file-management/parse/uploads',
    '/api/file-management/parse/tasks',
    '/api/file-management/parse/tasks/task/一/run',
    '/api/file-management/parse/tasks/task/一/processing-items?page=1&pageSize=321',
    '/api/file-management/parse/tasks/task/一/overview-items?page=1&pageSize=654',
    '/api/file-management/parse/tasks/task/一/overview-items/export',
    '/api/file-management/parse/target-plans/plan/一/versions?page=1&pageSize=12',
    '/api/file-management/parse/versions/version/一/items?page=1&pageSize=34',
    '/api/file-management/parse/tasks/task/一/items/item/一/keep-old',
    '/api/file-management/parse/tasks/task/一/items/batch-accept',
    '/api/file-management/parse/tasks/task/一/publish',
    '/api/file-management/parse/logistics-channel-activations?targetPlanId=plan%2F%E4%B8%80&versionId=version%2F%E4%B8%80',
    '/api/file-management/parse/logistics-channel-activations'
  ]);
  assert.deepEqual(calls.map((call) => call.init?.method), [
    undefined, undefined, undefined, 'DELETE', 'POST', 'POST', 'POST', undefined, undefined,
    undefined, undefined, undefined, 'POST', 'POST', 'POST', undefined, 'POST'
  ]);
  assert.ok(calls[4].init?.body instanceof FormData);
  assert.equal((calls[4].init?.body as FormData).get('targetPlanId'), 'plan/一');
  assert.equal((calls[4].init?.body as FormData).get('file'), uploadFile);
  assert.equal(new Headers(calls[4].init?.headers).get('Content-Type'), null);
  assert.equal(new Headers(calls[5].init?.headers).get('Idempotency-Key'), 'create-key');
  assert.equal(new Headers(calls[12].init?.headers).get('Idempotency-Key'), 'review-key');
  assert.equal(new Headers(calls[13].init?.headers).get('Idempotency-Key'), 'batch-key');
  assert.equal(new Headers(calls[14].init?.headers).get('Idempotency-Key'), 'publish-key');
  calls.forEach((call) => {
    assert.equal(new Headers(call.init?.headers).get('X-Nuono-Dev-Session-User-Id'), '307');
  });

  globalThis.fetch = async () => new Response(new Blob(['fallback']));
  assert.equal((await fileParseApi.downloadFileParseOverview(1)).fileName, '解析总览.xlsx');

  globalThis.fetch = async () => Response.json({ message: '后端拒绝' }, { status: 409 });
  await assert.rejects(
    fileParseApi.fetchFileParseTasks(),
    (error) => error instanceof Error && error.message === '后端拒绝'
  );
} finally {
  globalThis.fetch = previousFetch;
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
  else delete (globalThis as { window?: unknown }).window;
}
