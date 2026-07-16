import type { ProductLastPublishTaskPayload, ProductListRowPayload, ProductListingPublishTaskPayload } from '../types';

export type ProductPublishStatusColor = {
  tag: 'success' | 'error' | 'warning' | 'processing' | 'default';
  border: string;
  background: string;
  text: string;
};

export type ProductPublishStatusDisplay = {
  kind: 'listing' | 'product-detail';
  title: string;
  label: string;
  timeText?: string;
  resultText?: string;
  color: ProductPublishStatusColor;
};

export function productListingPublishStatusMeta(status?: string, statusLabel?: string): ProductPublishStatusColor & { label: string } {
  const normalizedStatus = text(status).toLowerCase();
  const label = text(statusLabel) || listingStatusLabel(normalizedStatus);
  if (label === '上架成功') {
    return {
      label,
      tag: 'success',
      border: '#bbf7d0',
      background: '#f0fdf4',
      text: '#166534'
    };
  }
  if (label === '上架失败') {
    return {
      label,
      tag: 'error',
      border: '#fecaca',
      background: '#fef2f2',
      text: '#991b1b'
    };
  }
  if (label === '已写入，回读异常') {
    return {
      label,
      tag: 'warning',
      border: '#fde68a',
      background: '#fffbeb',
      text: '#92400e'
    };
  }
  return {
    label: label || '上架中',
    tag: 'processing',
    border: '#bfdbfe',
    background: '#eff6ff',
    text: '#1d4ed8'
  };
}

export function productDetailPublishStatusColor(statusLabel?: string): ProductPublishStatusColor {
  if (statusLabel === '发布成功' || statusLabel === '删除成功' || statusLabel === '重建成功') {
    return {
      tag: 'success',
      border: '#bbf7d0',
      background: '#f0fdf4',
      text: '#166534'
    };
  }
  if (statusLabel === '发布失败' || statusLabel === '删除失败' || statusLabel === '重建失败') {
    return {
      tag: 'error',
      border: '#fecaca',
      background: '#fef2f2',
      text: '#991b1b'
    };
  }
  if (statusLabel === '待人工核对' || statusLabel === '删除待核对' || statusLabel === '重建待核对') {
    return {
      tag: 'warning',
      border: '#fde68a',
      background: '#fffbeb',
      text: '#92400e'
    };
  }
  return {
    tag: 'processing',
    border: '#bfdbfe',
    background: '#eff6ff',
    text: '#1d4ed8'
  };
}

export function buildProductPublishStatusDisplay(record: ProductListRowPayload): ProductPublishStatusDisplay | null {
  const detailTask = record.lastPublishTask;
  const listingTask = record.listingPublishTask;
  if (isProductLifecycleTask(detailTask) && detailTask?.statusLabel && shouldPreferProductLifecycleTask(detailTask, listingTask)) {
    return buildProductDetailPublishStatusDisplay(detailTask);
  }
  if (listingTask) {
    return buildListingPublishStatusDisplay(listingTask);
  }
  if (detailTask?.statusLabel) {
    return buildProductDetailPublishStatusDisplay(detailTask);
  }
  return null;
}

function buildProductDetailPublishStatusDisplay(
  task: ProductLastPublishTaskPayload
): ProductPublishStatusDisplay {
  return {
    kind: 'product-detail',
    title: task.taskType === 'product-rebuild'
      ? '重建任务'
      : task.taskType === 'product-delete'
        ? '删除任务'
        : '上次发布',
    label: task.statusLabel || '',
    timeText: task.finishedAt ?? task.submittedAt,
    resultText: task.resultText,
    color: productDetailPublishStatusColor(task.statusLabel)
  };
}

function isProductLifecycleTask(task?: ProductLastPublishTaskPayload) {
  return task?.taskType === 'product-rebuild' || task?.taskType === 'product-delete';
}

function shouldPreferProductLifecycleTask(
  detailTask: ProductLastPublishTaskPayload,
  listingTask?: ProductListingPublishTaskPayload
) {
  if (!listingTask) {
    return true;
  }
  if (isActiveProductLifecycleTask(detailTask)) {
    return true;
  }
  const detailTime = taskComparableTime(detailTask);
  const listingTime = taskComparableTime(listingTask);
  if (!detailTime || !listingTime) {
    return false;
  }
  return detailTime >= listingTime;
}

function isActiveProductLifecycleTask(task: ProductLastPublishTaskPayload) {
  const status = text(task.status).toLowerCase();
  const label = text(task.statusLabel);
  if (status === 'queued' || status === 'running' || status === 'submitted' || status === 'pending_manual_check') {
    return true;
  }
  return label === '删除中' || label === '重建中' || label === '删除待核对' || label === '重建待核对';
}

function taskComparableTime(task: ProductLastPublishTaskPayload | ProductListingPublishTaskPayload) {
  return text(task.finishedAt) || text(task.submittedAt);
}

function buildListingPublishStatusDisplay(task: ProductListingPublishTaskPayload): ProductPublishStatusDisplay {
  const meta = productListingPublishStatusMeta(task.status, task.statusLabel);
  return {
    kind: 'listing',
    title: '真实上架任务',
    label: meta.label,
    timeText: task.finishedAt ?? task.submittedAt,
    resultText: task.taskNo || (typeof task.taskId === 'number' ? `#${task.taskId}` : task.failureMessage),
    color: {
      tag: meta.tag,
      border: meta.border,
      background: meta.background,
      text: meta.text
    }
  };
}

function listingStatusLabel(status?: string) {
  if (status === 'succeeded') {
    return '上架成功';
  }
  if (status === 'failed' || status === 'rejected') {
    return '上架失败';
  }
  if (status === 'written_verify_failed') {
    return '已写入，回读异常';
  }
  if (status === 'submitted' || status === 'running') {
    return '上架中';
  }
  return '';
}

function text(value: unknown) {
  return String(value ?? '').trim();
}
