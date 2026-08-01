import { useState } from 'react';
import { Button, message, Modal, Space, Tooltip, Typography } from 'antd';
import { navigateProductListingTargetInCurrentTab } from '../../product-listing/listingTabNavigation';
import {
  isPublicDetailReadonlyWorkbench,
  isProductPublishTaskActive,
  isProductPublishTaskNeedsAttention
} from '../utils/workbench';
import { getProductCurrentZCode, isLocalDraftNoonCode } from '../../product-domain/productIdentity';
import { textInputValue } from '../utils/common';
import { isProductNotListedSource } from '../../product-baseline';
import type {
  ProductDetailPublishSyncWorkspace,
  ProductDetailSummaryWorkspace
} from '../workspaceTypes';
import { buildProductDetailListingTarget } from '../utils/productDetailListingNavigation';
import { ProductDetailSummaryBar } from './ProductDetailSummaryBar';
import { ProductDetailSyncAlert } from './ProductDetailSyncAlert';

const { Text } = Typography;

const LISTING_DRAFT_MISSING_REASON =
  '当前商品没有关联到原上架草稿，暂时无法继续上架。';

type ProductDetailSummaryPanelProps = {
  workspace: ProductDetailSummaryWorkspace;
  publishSyncWorkspace: ProductDetailPublishSyncWorkspace;
};

export function ProductDetailSummaryPanel({
  workspace,
  publishSyncWorkspace
}: ProductDetailSummaryPanelProps) {
  const {
    productSnapshotView,
    productDetailSummarySurface,
    activeProductSiteOffer,
    productLeadImage,
    openCurrentProductGallery,
    productActionSubmitting,
    productDraftDirty,
    productWorkbenchState,
    productWorkbenchSurfaceState,
    previewProductAction,
    productPublishTaskActionSubmitting,
    retryProductPublishTask
  } = workspace;
  const [pullChoiceOpen, setPullChoiceOpen] = useState(false);
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);

  const workbenchReady = Boolean(productWorkbenchState);
  const publishTask =
    productWorkbenchSurfaceState.status === 'ready' ? productWorkbenchSurfaceState.payload.publishTask : undefined;
  const publishTaskId = typeof publishTask?.taskId === 'number' ? publishTask.taskId : undefined;
  const publishTaskActive = isProductPublishTaskActive(publishTask);
  const publishTaskNeedsAttention = isProductPublishTaskNeedsAttention(publishTask);
  const productLifecycleTaskNeedsAttention = publishTaskNeedsAttention
    && (publishTask?.taskType === 'product-delete' || publishTask?.taskType === 'product-rebuild');
  const productLifecycleRetryBlocked = productLifecycleTaskNeedsAttention && publishTask?.retryAllowed === false;
  const productLifecycleTaskBlocking = publishTaskActive || productLifecycleTaskNeedsAttention;
  const publicDetailReadonly = isPublicDetailReadonlyWorkbench(productWorkbenchState);
  const currentNoonCode =
    getProductCurrentZCode(productDetailSummarySurface ?? undefined) ||
    textInputValue(productSnapshotView?.identity.currentZCode || productSnapshotView?.identity.skuParent) ||
    textInputValue(activeProductSiteOffer?.currentZCode || activeProductSiteOffer?.skuParent);
  const productNotReadyForCurrentPublish =
    isProductNotListedSource(productDetailSummarySurface?.listingStartedSource) ||
    isProductNotListedSource(textInputValue(activeProductSiteOffer?.listingStartedSource)) ||
    isLocalDraftNoonCode(currentNoonCode) ||
    isLocalDraftNoonCode(productSnapshotView?.identity.currentZCode) ||
    isLocalDraftNoonCode(productSnapshotView?.identity.skuParent) ||
    isLocalDraftNoonCode(activeProductSiteOffer?.currentZCode) ||
    isLocalDraftNoonCode(activeProductSiteOffer?.skuParent);
  const listingDraftTarget = productNotReadyForCurrentPublish
    ? buildProductDetailListingTarget(productSnapshotView)
    : undefined;
  const publishButtonDisabled =
    !workbenchReady ||
    publicDetailReadonly ||
    publishTaskActive ||
    productLifecycleRetryBlocked ||
    productPublishTaskActionSubmitting ||
    (productNotReadyForCurrentPublish &&
      (productActionSubmitting || !listingDraftTarget));
  const requestPullFromNoon = () => {
    if (publicDetailReadonly) {
      return;
    }
    if (!productDraftDirty) {
      void previewProductAction('pull', { syncMergePolicy: 'use_noon' });
      return;
    }

    setPullChoiceOpen(true);
  };

  const submitPullFromNoon = (syncMergePolicy: 'keep_draft' | 'use_noon') => {
    setPullChoiceOpen(false);
    void previewProductAction('pull', { syncMergePolicy });
  };

  const submitRollbackDraft = () => {
    setRollbackConfirmOpen(false);
    void previewProductAction('rollback-draft');
  };

  const submitPublish = () => {
    if (productNotReadyForCurrentPublish) {
      if (!listingDraftTarget) {
        message.warning(LISTING_DRAFT_MISSING_REASON);
        return;
      }
      navigateProductListingTargetInCurrentTab(listingDraftTarget);
      return;
    }
    if (publishTaskNeedsAttention && publishTaskId) {
      void retryProductPublishTask(publishTaskId);
      return;
    }
    void previewProductAction('publish-current');
  };

  return (
    <>
      <Modal
        title="从 Noon 同步当前内容"
        open={pullChoiceOpen}
        onCancel={() => setPullChoiceOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setPullChoiceOpen(false)}>
            取消
          </Button>,
          <Button key="keep-draft" onClick={() => submitPullFromNoon('keep_draft')}>
            保留本地草稿
          </Button>,
          <Button key="use-noon" type="primary" onClick={() => submitPullFromNoon('use_noon')}>
            使用 Noon 覆盖草稿
          </Button>
        ]}
      >
        <Space direction="vertical" size={8}>
          <Text>当前商品存在未发布草稿，请选择同步后的草稿处理方式。</Text>
          <Text style={{ color: 'var(--pm-text-muted)' }}>
            保留本地草稿会只刷新 Noon 基线；使用 Noon 覆盖草稿会放弃当前未发布修改。
          </Text>
        </Space>
      </Modal>
      <Modal
        title="回滚本地草稿"
        open={rollbackConfirmOpen}
        onCancel={() => setRollbackConfirmOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRollbackConfirmOpen(false)}>
            取消
          </Button>,
          <Button key="rollback" danger type="primary" onClick={submitRollbackDraft}>
            回滚草稿
          </Button>
        ]}
      >
        <Text>确认放弃当前未发布草稿，并恢复到最近本地商品基线？</Text>
      </Modal>
      <ProductDetailSummaryBar
        summary={productDetailSummarySurface}
        productSnapshotView={productSnapshotView}
        activeProductSiteOffer={activeProductSiteOffer}
        productLeadImage={productLeadImage}
        openCurrentProductGallery={openCurrentProductGallery}
        syncAlert={<ProductDetailSyncAlert workspace={publishSyncWorkspace} />}
        actions={
          <Space wrap size={[8, 8]} style={{ justifyContent: 'flex-end' }}>
            <Button
              size="small"
              loading={productActionSubmitting}
              disabled={!workbenchReady || publicDetailReadonly || productLifecycleTaskBlocking}
              onClick={() => void previewProductAction('save')}
            >
              保存草稿
            </Button>
            <Button
              size="small"
              danger
              disabled={!workbenchReady || publicDetailReadonly || !productDraftDirty || productActionSubmitting || productLifecycleTaskBlocking}
              onClick={() => setRollbackConfirmOpen(true)}
            >
              回滚草稿
            </Button>
            <Tooltip title={productNotReadyForCurrentPublish && !listingDraftTarget ? LISTING_DRAFT_MISSING_REASON : undefined}>
              <span>
                <Button
                  size="small"
                  type="primary"
                  loading={productActionSubmitting || productPublishTaskActionSubmitting}
                  disabled={publishButtonDisabled}
                  onClick={submitPublish}
                >
                  {productNotReadyForCurrentPublish
                    ? '上架'
                    : publishTaskNeedsAttention
                      ? publishTask?.taskType === 'product-delete'
                        ? productLifecycleRetryBlocked ? '删除待核对' : '继续删除'
                        : publishTask?.taskType === 'product-rebuild'
                          ? productLifecycleRetryBlocked ? '重建待核对' : '继续重建'
                          : '重试发布'
                      : '发布当前修改'}
                </Button>
              </span>
            </Tooltip>
            <Button
              size="small"
              disabled={!workbenchReady || publicDetailReadonly || productActionSubmitting || productLifecycleTaskBlocking}
              onClick={requestPullFromNoon}
            >
              从 Noon 同步
            </Button>
          </Space>
        }
      />
    </>
  );
}
