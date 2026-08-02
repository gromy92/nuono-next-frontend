import { strict as assert } from 'node:assert';
import { productDeleteActionState } from './utils/productDeleteActionState';
import {
  isProductPublishTaskActive,
  productPublishTaskAttentionLabel
} from './utils/productPublishTask';
import type { ProductListRowPayload } from './types';

function row(overrides: Partial<ProductListRowPayload> = {}): ProductListRowPayload {
  return {
    skuParent: 'ZTEST',
    partnerSku: 'PTEST',
    productSourceType: 'SELF_BUILT',
    siteLabels: ['AE'],
    liveStatuses: ['live'],
    issueTags: [],
    ...overrides
  };
}

assert.deepEqual(productDeleteActionState(row()), {
  label: '删除',
  disabled: false,
  continuing: false
});

assert.deepEqual(productDeleteActionState(row({
  lastPublishTask: {
    taskId: 64027,
    taskType: 'product-delete',
    status: 'product_delete_running',
    statusLabel: '删除中'
  }
})), {
  label: '删除中',
  disabled: true,
  continuing: false,
  tooltip: '商品删除正在后台处理，无需重复提交'
});

assert.deepEqual(productDeleteActionState(row({
  lastPublishTask: {
    taskId: 64027,
    taskType: 'product-delete',
    status: 'pending_manual_check',
    statusLabel: '删除待核对'
  }
})), {
  label: '继续删除',
  disabled: false,
  continuing: true,
  tooltip: '从原删除任务的安全检查点继续'
});

assert.deepEqual(productDeleteActionState(row({
  lastPublishTask: {
    taskId: 64027,
    taskType: 'product-delete',
    status: 'pending_manual_check',
    statusLabel: '删除待核对',
    retryAllowed: false,
    resultText: '删除结果不确定，请先核对'
  }
})), {
  label: '删除待核对',
  disabled: true,
  continuing: false,
  tooltip: '删除结果不确定，请先核对'
});

assert.equal(isProductPublishTaskActive({
  taskId: 64027,
  taskType: 'product-delete',
  status: 'product_delete_write_retry_scheduled'
}), true, 'prefixed delete statuses must remain active in every product surface');
assert.equal(productPublishTaskAttentionLabel({
  taskType: 'product-delete',
  status: 'pending_manual_check',
  retryAllowed: true
}), '继续删除');
assert.equal(productPublishTaskAttentionLabel({
  taskType: 'product-delete',
  status: 'pending_manual_check',
  retryAllowed: false
}), '删除待核对');
assert.equal(productPublishTaskAttentionLabel({
  taskType: 'publish-current',
  status: 'failed'
}), '重试发布');
