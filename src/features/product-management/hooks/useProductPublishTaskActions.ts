import { useCallback, useState } from 'react';
import { message } from 'antd';
import { cancelProductPublishTask, retryProductPublishTask } from '../api';
import type {
  ProductPublishTaskPayload,
  ProductWorkbenchPayload,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceReadyState
} from '../types';

type ReadyProductWorkbenchSurfaceUpdater = (
  updater: (current: ProductWorkbenchSurfaceReadyState) => {
    workbench: ProductWorkbenchState;
    payloadOverrides?: Partial<ProductWorkbenchPayload>;
  } | null
) => void;

type UseProductPublishTaskActionsParams = {
  activeOwnerId?: number;
  applyProductWorkbenchResponse: (payload: ProductWorkbenchPayload) => ProductWorkbenchState;
  updateReadyProductWorkbenchSurface: ReadyProductWorkbenchSurfaceUpdater;
};

export function useProductPublishTaskActions({
  activeOwnerId,
  applyProductWorkbenchResponse,
  updateReadyProductWorkbenchSurface
}: UseProductPublishTaskActionsParams) {
  const [productPublishTaskActionSubmitting, setProductPublishTaskActionSubmitting] = useState(false);

  const applyPublishTask = useCallback(
    (task: ProductPublishTaskPayload) => {
      if (task.workbench) {
        applyProductWorkbenchResponse(task.workbench);
        return;
      }
      updateReadyProductWorkbenchSurface((currentValue) => ({
        workbench: currentValue.workbench,
        payloadOverrides: {
          publishTask: task
        }
      }));
    },
    [applyProductWorkbenchResponse, updateReadyProductWorkbenchSurface]
  );

  const retryProductPublishTaskAction = useCallback(
    async (taskId?: number) => {
      if (!taskId) {
        return;
      }
      if (!activeOwnerId) {
        message.warning('缺少老板上下文，暂时不能重试发布。');
        return;
      }
      setProductPublishTaskActionSubmitting(true);
      try {
        const task = await retryProductPublishTask(taskId, activeOwnerId);
        applyPublishTask(task);
        message.success(task.message || '已重新提交发布任务。');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '重试发布任务失败');
      } finally {
        setProductPublishTaskActionSubmitting(false);
      }
    },
    [activeOwnerId, applyPublishTask]
  );

  const cancelProductPublishTaskAction = useCallback(
    async (taskId?: number) => {
      if (!taskId) {
        return;
      }
      if (!activeOwnerId) {
        message.warning('缺少老板上下文，暂时不能取消发布。');
        return;
      }
      setProductPublishTaskActionSubmitting(true);
      try {
        const task = await cancelProductPublishTask(taskId, activeOwnerId);
        applyPublishTask(task);
        message.success(task.message || '已取消发布任务。');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '取消发布任务失败');
      } finally {
        setProductPublishTaskActionSubmitting(false);
      }
    },
    [activeOwnerId, applyPublishTask]
  );

  return {
    productPublishTaskActionSubmitting,
    retryProductPublishTask: retryProductPublishTaskAction,
    cancelProductPublishTask: cancelProductPublishTaskAction
  };
}
