import type { ProductLastPublishTaskPayload, ProductListRowPayload } from '../types';
import { isProductNotListedSource } from './common';
import { normalizeProductSourceType } from './productSourceType';

export type ProductRebuildActionState = {
  disabled: boolean;
  tooltip: string;
};

const ACTIVE_PUBLISH_TASK_STATUSES = new Set([
  'queued',
  'running',
  'submitted',
  'verifying',
  'pending_effective',
  'write_unknown',
  'verify_timeout',
  'write_retry_scheduled',
  'product_delete_queued',
  'product_delete_running',
  'product_delete_submitted',
  'product_delete_verifying',
  'product_delete_pending_effective',
  'product_delete_verify_timeout',
  'product_delete_write_retry_scheduled'
]);

const ACTIVE_PUBLISH_TASK_LABELS = new Set([
  '发布中',
  '待人工核对',
  '删除中',
  '删除待核对',
  '重建中',
  '重建待核对'
]);

export function productRebuildActionState(record: ProductListRowPayload): ProductRebuildActionState {
  if (normalizeProductSourceType(record.productSourceType) !== 'SELF_BUILT') {
    return {
      disabled: true,
      tooltip: '商品重建当前只支持自建品'
    };
  }

  if (isActivePublishTask(record.lastPublishTask)) {
    return {
      disabled: true,
      tooltip: '当前商品已有后台任务正在执行，请等待完成后再重建'
    };
  }

  if (normalizeText(record.detailBaselineStatus).toLowerCase() !== 'ready') {
    return {
      disabled: true,
      tooltip: rebuildBaselineTooltip(record)
    };
  }

  if (!normalizeText(record.listingStartedAt) || isProductNotListedSource(record.listingStartedSource)) {
    return {
      disabled: true,
      tooltip: '当前商品缺少旧 PSKU 上架时间，暂时不能重建'
    };
  }

  return {
    disabled: false,
    tooltip: '重建商品'
  };
}

function isActivePublishTask(task?: ProductLastPublishTaskPayload) {
  const status = normalizeText(task?.status).toLowerCase();
  if (status && ACTIVE_PUBLISH_TASK_STATUSES.has(status)) {
    return true;
  }
  const statusLabel = normalizeText(task?.statusLabel);
  return Boolean(statusLabel && ACTIVE_PUBLISH_TASK_LABELS.has(statusLabel));
}

function rebuildBaselineTooltip(record: ProductListRowPayload) {
  const status = normalizeText(record.detailBaselineStatus).toLowerCase();
  if (status === 'preparing') {
    return '详情基线准备中，完成后才能重建';
  }
  if (status === 'failed') {
    return normalizeText(record.detailBaselineMessage) || '详情基线加载失败，暂时不能重建';
  }
  return '缺详情基线，暂时不能重建';
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}
