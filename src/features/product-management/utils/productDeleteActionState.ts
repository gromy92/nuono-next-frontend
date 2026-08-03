import type { ProductListRowPayload } from '../types';
import { isProductPublishTaskActive, isProductPublishTaskNeedsAttention } from './productPublishTask';

export type ProductDeleteActionState = {
  label: '删除' | '删除中' | '继续删除' | '删除待核对';
  disabled: boolean;
  continuing: boolean;
  tooltip?: string;
};

export function productDeleteActionState(record: ProductListRowPayload): ProductDeleteActionState {
  const task = record.lastPublishTask;
  if (task?.taskType === 'product-delete') {
    if (isProductPublishTaskActive(task)) {
      return {
        label: '删除中',
        disabled: true,
        continuing: false,
        tooltip: '商品删除正在后台处理，无需重复提交'
      };
    }
    if (isProductPublishTaskNeedsAttention(task)) {
      if (task.retryAllowed === false) {
        return {
          label: '删除待核对',
          disabled: true,
          continuing: false,
          tooltip: task.resultText || '删除结果不确定，请先在 Noon 后台核对'
        };
      }
      return {
        label: '继续删除',
        disabled: false,
        continuing: true,
        tooltip: '从原删除任务的安全检查点继续'
      };
    }
  }
  if (task?.taskType === 'product-rebuild'
      && (isProductPublishTaskActive(task) || isProductPublishTaskNeedsAttention(task))) {
    return {
      label: '删除',
      disabled: true,
      continuing: false,
      tooltip: '当前商品已有重建任务待处理，不能同时删除'
    };
  }
  if (isProductPublishTaskActive(task)) {
    return {
      label: '删除',
      disabled: true,
      continuing: false,
      tooltip: '当前商品已有后台任务正在执行，请等待完成后再删除'
    };
  }
  return { label: '删除', disabled: false, continuing: false };
}
