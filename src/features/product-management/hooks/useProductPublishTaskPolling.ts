import { useEffect } from 'react';
import { message } from 'antd';
import { fetchProductPublishTask } from '../api';
import type {
  ProductWorkbenchPayload,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceState
} from '../types';
import { isProductPublishTaskActive } from '../utils/workbench';
import type { ReadyProductWorkbenchSurfaceUpdater } from './useProductWorkbenchSurfaceActions';

export function useProductPublishTaskPolling({
  activeOwnerId,
  applyProductWorkbenchResponse,
  enabled,
  productWorkbenchSurfaceState,
  updateReadyProductWorkbenchSurface
}: {
  activeOwnerId?: number;
  applyProductWorkbenchResponse: (response: ProductWorkbenchPayload) => ProductWorkbenchState;
  enabled: boolean;
  productWorkbenchSurfaceState: ProductWorkbenchSurfaceState;
  updateReadyProductWorkbenchSurface: ReadyProductWorkbenchSurfaceUpdater;
}) {
  useEffect(() => {
    if (!enabled || productWorkbenchSurfaceState.status !== 'ready') {
      return undefined;
    }
    const publishTask = productWorkbenchSurfaceState.payload.publishTask;
    const taskId = publishTask?.taskId;
    if (!taskId || !activeOwnerId || !isProductPublishTaskActive(publishTask)) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchProductPublishTask(taskId, activeOwnerId)
        .then((nextTask) => {
          if (cancelled) return;
          if (nextTask.workbench) {
            applyProductWorkbenchResponse(nextTask.workbench);
            if (!isProductPublishTaskActive(nextTask)) {
              message.info(nextTask.message || '发布任务状态已更新。');
            }
            return;
          }
          updateReadyProductWorkbenchSurface((currentValue) => ({
            workbench: currentValue.workbench,
            payloadOverrides: { publishTask: nextTask }
          }));
        })
        .catch((error) => {
          if (!cancelled) {
            message.warning(error instanceof Error ? error.message : '发布任务状态读取失败。');
          }
        });
    }, Math.max(1500, publishTask.pollAfterMillis ?? 2000));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeOwnerId, applyProductWorkbenchResponse, enabled, productWorkbenchSurfaceState, updateReadyProductWorkbenchSurface]);
}
