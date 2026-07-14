import { useCallback } from 'react';
import { message } from 'antd';
import type { FormInstance } from 'antd';
import { executeProductWorkbenchAction } from '../api';
import {
  buildLocalProductRecentAction,
  cloneSnapshotPayload,
  isPublicDetailReadonlyWorkbench,
  isProductPublishTaskActive,
  prependRecentAction,
  siteOfferCode
} from '../utils';
import type {
  ProductListUiState,
  ProductMasterSnapshotPayload,
  ProductWorkbenchAction,
  ProductWorkbenchActionOptions,
  ProductWorkbenchPayload,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceState
} from '../types';
import type { ReadyProductWorkbenchSurfaceUpdater } from './useProductWorkbenchSurfaceActions';

type UseProductWorkbenchActionSubmitterParams = {
  activeOwnerId?: number;
  activeProductSiteOffer?: Record<string, unknown>;
  applyMockProductAction: (action: ProductWorkbenchAction) => void;
  applyProductWorkbenchResponse: (payload: ProductWorkbenchPayload) => ProductWorkbenchState;
  currentProductIdentityKey?: string;
  currentProductSkuParent?: string;
  productDraftDirty: boolean;
  productSnapshotForm: FormInstance;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productWorkbenchState: ProductWorkbenchState | null;
  selectedInitializationStoreCode?: string;
  setProductActionSubmitting: (submitting: boolean) => void;
  updateProductListUiState: (skuParent: string | undefined, nextState: ProductListUiState) => void;
  updateReadyProductWorkbenchSurface: ReadyProductWorkbenchSurfaceUpdater;
};

export function useProductWorkbenchActionSubmitter({
  activeOwnerId,
  activeProductSiteOffer,
  applyMockProductAction,
  applyProductWorkbenchResponse,
  currentProductIdentityKey,
  currentProductSkuParent,
  productDraftDirty,
  productSnapshotForm,
  productSnapshotView,
  productWorkbenchState,
  selectedInitializationStoreCode,
  setProductActionSubmitting,
  updateProductListUiState,
  updateReadyProductWorkbenchSurface
}: UseProductWorkbenchActionSubmitterParams) {
  return useCallback(
    async (action: ProductWorkbenchAction, options?: ProductWorkbenchActionOptions) => {
      if (!productWorkbenchState || !productSnapshotView) {
        message.info('先读取一条真实商品快照，再确认后续交互。');
        return;
      }
      if (isPublicDetailReadonlyWorkbench(productWorkbenchState)) {
        message.warning('当前详情来自 Noon 前台公开快照，只读可查看；保存、发布和同步已禁用。');
        return;
      }
      if (action === 'save' && !productDraftDirty) {
        message.info('当前没有新的修改需要保存。');
        return;
      }
      if (action === 'rollback-draft' && !productDraftDirty) {
        message.info('当前没有需要回滚的本地草稿。');
        return;
      }

      const currentSiteCode = action === 'publish-current' && activeProductSiteOffer
        ? siteOfferCode(activeProductSiteOffer)
        : undefined;

      if (productSnapshotView.mode === 'mock') {
        applyMockProductAction(action);
        return;
      }
      if (!activeOwnerId) {
        message.error('缺少老板上下文，暂时不能执行真实商品动作。');
        return;
      }

      const formValues = productSnapshotForm.getFieldsValue();
      const requestValues = {
        storeCode:
          formValues.storeCode ??
          (typeof productSnapshotView.storeContext.storeCode === 'string' ? productSnapshotView.storeContext.storeCode : undefined) ??
          selectedInitializationStoreCode,
        noonUser:
          formValues.noonUser ??
          (typeof productSnapshotView.storeContext.noonUser === 'string' ? productSnapshotView.storeContext.noonUser : undefined),
        noonPassword: formValues.noonPassword,
        skuParent:
          formValues.skuParent ??
          (typeof productSnapshotView.identity.skuParent === 'string' ? productSnapshotView.identity.skuParent : undefined),
        currentZCode:
          formValues.currentZCode ??
          (typeof productSnapshotView.identity.currentZCode === 'string' ? productSnapshotView.identity.currentZCode : undefined) ??
          formValues.skuParent ??
          (typeof productSnapshotView.identity.skuParent === 'string' ? productSnapshotView.identity.skuParent : undefined),
        partnerSku:
          formValues.partnerSku ??
          (typeof productSnapshotView.identity.partnerSku === 'string' ? productSnapshotView.identity.partnerSku : undefined),
        pskuCode:
          formValues.pskuCode ??
          (typeof productSnapshotView.identity.pskuCode === 'string' ? productSnapshotView.identity.pskuCode : undefined)
      };
      if (!requestValues.storeCode || !(requestValues.partnerSku || requestValues.currentZCode || requestValues.skuParent)) {
        message.error('当前商品缺少最小定位信息，暂时不能执行详情动作。');
        return;
      }

      try {
        setProductActionSubmitting(true);
        const payload = await executeProductWorkbenchAction({
          ownerUserId: activeOwnerId,
          storeCode: requestValues.storeCode,
          noonUser: requestValues.noonUser,
          noonPassword: requestValues.noonPassword,
          skuParent: requestValues.skuParent,
          currentZCode: requestValues.currentZCode,
          partnerSku: requestValues.partnerSku,
          pskuCode: requestValues.pskuCode,
          action,
          currentSiteCode,
          syncMergePolicy: options?.syncMergePolicy,
          publishConflictResolution: options?.publishConflictResolution,
          snapshot: cloneSnapshotPayload(productWorkbenchState.draft)
        });
        const nextWorkbenchState = applyProductWorkbenchResponse(payload);
        if (action === 'publish-current' && payload.publishConflict?.fields?.length) {
          message.warning(payload.publishConflict.message || '发布前发现 Noon 当前内容与本地草稿存在冲突。');
          return;
        }
        if (action === 'publish-current' && isProductPublishTaskActive(payload.publishTask)) {
          message.info(payload.publishTask?.message || payload.message || '发布已提交，后台正在处理。');
          return;
        }
        const successMessage = payload.message || {
          save: '已保存为诺诺草稿',
          pull: '已同步 Noon 当前内容',
          'rollback-draft': '已回滚草稿',
          'publish-current': '已发布当前修改'
        }[action];
        if (successMessage) {
          if (nextWorkbenchState.syncStatus === 'failed') {
            message.warning(successMessage);
          } else if (
            action === 'publish-current' &&
            (successMessage.includes('没有待发布改动') || successMessage.includes('没有可写回 Noon 的改动'))
          ) {
            message.info(successMessage);
          } else if (action === 'publish-current' && nextWorkbenchState.syncStatus !== 'synced') {
            message.warning(successMessage);
          } else {
            message.success(successMessage);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '商品详情动作执行失败';
        updateReadyProductWorkbenchSurface((currentValue) => {
          const nextWorkbench: ProductWorkbenchState = {
            ...currentValue.workbench,
            syncStatus: 'failed',
            note: errorMessage
          };
          const nextRecentActions = prependRecentAction(
            currentValue.recentActions,
            buildLocalProductRecentAction({
              actionType: action,
              resultStatus: 'failed',
              message: errorMessage,
              targetSiteCode: currentSiteCode,
              workbench: nextWorkbench
            })
          );
          return {
            workbench: nextWorkbench,
            recentActions: nextRecentActions,
            payloadOverrides: {
              recentActions: nextRecentActions
            }
          };
        });
        updateProductListUiState(currentProductIdentityKey, {
          syncStatus: 'failed',
          lastSyncedAt: productWorkbenchState.lastSyncedAt,
          note: errorMessage
        });
        message.error(errorMessage);
      } finally {
        setProductActionSubmitting(false);
      }
    },
    [
      activeOwnerId,
      activeProductSiteOffer,
      applyMockProductAction,
      applyProductWorkbenchResponse,
      currentProductSkuParent,
      currentProductIdentityKey,
      productDraftDirty,
      productSnapshotForm,
      productSnapshotView,
      productWorkbenchState,
      selectedInitializationStoreCode,
      setProductActionSubmitting,
      updateProductListUiState,
      updateReadyProductWorkbenchSurface
    ]
  );
}
