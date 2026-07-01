import { useCallback } from 'react';
import { message } from 'antd';
import { buildMockPublishState, validateProductDraft } from '../workspaceHelpers';
import {
  areSnapshotPartsEqual,
  buildLocalProductRecentAction,
  cloneSnapshotPayload,
  getProductStableIdentityKey,
  nowSyncTime,
  prependRecentAction,
  siteOfferCode
} from '../utils';
import type { ProductListUiState, ProductWorkbenchState } from '../types';
import type { ReadyProductWorkbenchSurfaceUpdater } from './useProductWorkbenchSurfaceActions';

type UseMockProductActionsParams = {
  activeSiteOfferCode?: string;
  productWorkbenchState: ProductWorkbenchState | null;
  updateProductListUiState: (skuParent: string | undefined, nextState: ProductListUiState) => void;
  updateReadyProductWorkbenchSurface: ReadyProductWorkbenchSurfaceUpdater;
};

export function useMockProductActions({
  activeSiteOfferCode,
  productWorkbenchState,
  updateProductListUiState,
  updateReadyProductWorkbenchSurface
}: UseMockProductActionsParams) {
  const applyMockProductAction = useCallback(
    (action: 'save' | 'publish-current' | 'pull' | 'rollback-draft') => {
      if (!productWorkbenchState) {
        return;
      }

      const draftView = productWorkbenchState.draft;
      const currentSkuParent =
        typeof draftView.identity.skuParent === 'string' ? draftView.identity.skuParent : undefined;
      const currentProductIdentityKey = getProductStableIdentityKey({
        storeCode: typeof draftView.storeContext.storeCode === 'string' ? draftView.storeContext.storeCode : undefined,
        partnerSku: typeof draftView.identity.partnerSku === 'string' ? draftView.identity.partnerSku : undefined,
        currentZCode: typeof draftView.identity.currentZCode === 'string' ? draftView.identity.currentZCode : undefined,
        skuParent: currentSkuParent
      });
      const currentSiteOffer =
        draftView.siteOffers.find((item) => siteOfferCode(item) === activeSiteOfferCode) ?? draftView.siteOffers[0];
      const fetchedAt = nowSyncTime();

      if (action === 'save') {
        const nextSyncStatus = areSnapshotPartsEqual(productWorkbenchState.draft, productWorkbenchState.baseline)
          ? 'synced'
          : 'draft';
        const nextState: ProductWorkbenchState = {
          ...productWorkbenchState,
          syncStatus: nextSyncStatus,
          lastSyncedAt: nextSyncStatus === 'synced' ? productWorkbenchState.lastSyncedAt : productWorkbenchState.lastSyncedAt,
          note: nextSyncStatus === 'synced' ? '当前草稿与最近同步基线一致。' : '当前草稿已保存。'
        };
        updateReadyProductWorkbenchSurface((currentValue) => {
          const nextRecentActions = prependRecentAction(
            currentValue.recentActions,
            buildLocalProductRecentAction({
              actionType: 'save',
              resultStatus: nextState.syncStatus,
              message: nextState.note,
              workbench: nextState
            })
          );
          return {
            workbench: nextState,
            recentActions: nextRecentActions,
            payloadOverrides: {
              recentActions: nextRecentActions
            }
          };
        });
        updateProductListUiState(currentProductIdentityKey, {
          syncStatus: nextState.syncStatus,
          lastSyncedAt: nextState.lastSyncedAt,
          note: nextState.note
        });
        message.success(nextState.note || '已保存草稿');
        return;
      }

      if (action === 'pull') {
        const refreshedBaseline = cloneSnapshotPayload(productWorkbenchState.baseline);
        refreshedBaseline.storeContext = {
          ...refreshedBaseline.storeContext,
          fetchedAt
        };
        const nextState: ProductWorkbenchState = {
          baseline: refreshedBaseline,
          draft: cloneSnapshotPayload(refreshedBaseline),
          syncStatus: 'synced',
          lastSyncedAt: fetchedAt,
          note: '已按 Noon 当前版本刷新基线。',
          keyContentHistory: productWorkbenchState.keyContentHistory,
          pendingKeyContentHistoryCount: productWorkbenchState.pendingKeyContentHistoryCount,
          pendingKeyContentHistoryVisibleAfter: productWorkbenchState.pendingKeyContentHistoryVisibleAfter
        };
        updateReadyProductWorkbenchSurface((currentValue) => {
          const nextRecentActions = prependRecentAction(
            currentValue.recentActions,
            buildLocalProductRecentAction({
              actionType: 'pull',
              resultStatus: nextState.syncStatus,
              message: nextState.note,
              workbench: nextState
            })
          );
          return {
            workbench: nextState,
            recentActions: nextRecentActions,
            payloadOverrides: {
              recentActions: nextRecentActions
            }
          };
        });
        updateProductListUiState(currentProductIdentityKey, {
          syncStatus: nextState.syncStatus,
          lastSyncedAt: nextState.lastSyncedAt,
          note: nextState.note
        });
        message.success('已同步 Noon 当前内容。');
        return;
      }

      if (action === 'rollback-draft') {
        const nextState: ProductWorkbenchState = {
          ...productWorkbenchState,
          draft: cloneSnapshotPayload(productWorkbenchState.baseline),
          syncStatus: 'synced',
          note: '已回滚本地草稿，当前工作台恢复到最近本地商品基线。'
        };
        updateReadyProductWorkbenchSurface((currentValue) => {
          const nextRecentActions = prependRecentAction(
            currentValue.recentActions,
            buildLocalProductRecentAction({
              actionType: 'rollback-draft',
              resultStatus: nextState.syncStatus,
              message: nextState.note,
              workbench: nextState
            })
          );
          return {
            workbench: nextState,
            recentActions: nextRecentActions,
            payloadOverrides: {
              recentActions: nextRecentActions
            }
          };
        });
        updateProductListUiState(currentProductIdentityKey, {
          syncStatus: nextState.syncStatus,
          lastSyncedAt: nextState.lastSyncedAt,
          note: nextState.note
        });
        message.success('已回滚草稿。');
        return;
      }

      const currentSiteCode =
        action === 'publish-current' && currentSiteOffer ? siteOfferCode(currentSiteOffer) : undefined;
      const errors =
        action === 'publish-current'
          ? validateProductDraft(draftView, 'current', currentSiteCode, productWorkbenchState.baseline)
          : validateProductDraft(draftView, 'all', undefined, productWorkbenchState.baseline);
      if (errors.length) {
        const nextState: ProductWorkbenchState = {
          ...productWorkbenchState,
          syncStatus: 'failed',
          note: errors[0]
        };
        updateReadyProductWorkbenchSurface((currentValue) => {
          const nextRecentActions = prependRecentAction(
            currentValue.recentActions,
            buildLocalProductRecentAction({
              actionType: 'publish-current',
              resultStatus: nextState.syncStatus,
              message: nextState.note,
              targetSiteCode: currentSiteCode,
              workbench: nextState
            })
          );
          return {
            workbench: nextState,
            recentActions: nextRecentActions,
            payloadOverrides: {
              recentActions: nextRecentActions
            }
          };
        });
        updateProductListUiState(currentProductIdentityKey, {
          syncStatus: nextState.syncStatus,
          lastSyncedAt: nextState.lastSyncedAt,
          note: nextState.note
        });
        message.error(errors[0]);
        return;
      }

      const nextState = buildMockPublishState(productWorkbenchState, currentSiteCode);
      updateReadyProductWorkbenchSurface((currentValue) => {
        const nextRecentActions = prependRecentAction(
          currentValue.recentActions,
          buildLocalProductRecentAction({
            actionType: 'publish-current',
            resultStatus: nextState.syncStatus,
            message: nextState.note,
            targetSiteCode: currentSiteCode,
            workbench: nextState
          })
        );
        return {
          workbench: nextState,
          recentActions: nextRecentActions,
          payloadOverrides: {
            recentActions: nextRecentActions
          }
        };
      });
      updateProductListUiState(currentProductIdentityKey, {
        syncStatus: nextState.syncStatus,
        lastSyncedAt: nextState.lastSyncedAt,
        note: nextState.note
      });
      message.success('已完成当前修改发布。');
    },
    [activeSiteOfferCode, productWorkbenchState, updateProductListUiState, updateReadyProductWorkbenchSurface]
  );

  return {
    applyMockProductAction
  };
}
