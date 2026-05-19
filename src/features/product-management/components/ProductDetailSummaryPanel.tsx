import { useState } from 'react';
import { ExportOutlined } from '@ant-design/icons';
import { Button, Col, Modal, Row, Space, Tag, Tooltip, Typography } from 'antd';
import {
  buildNoonCatalogProductUrl,
  buildNoonProductUrl,
  formatSnapshotValue,
  isProductPublishTaskActive,
  isProductPublishTaskNeedsAttention,
  productSourceTypeMeta
} from '../utils';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { ProductDetailSyncAlert } from './ProductDetailSyncAlert';

const { Text } = Typography;

type ProductDetailSummaryPanelProps = {
  workspace: ProductManagementWorkspace;
  isProductDetailTab: boolean;
};

export function ProductDetailSummaryPanel({ workspace, isProductDetailTab }: ProductDetailSummaryPanelProps) {
  const {
    productSnapshotView,
    currentProductSummarySurface,
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
  const partnerSku = formatSnapshotValue(
    currentProductSummarySurface?.partnerSku ?? productSnapshotView?.identity.partnerSku
  );
  const sourceTypeMeta = productSourceTypeMeta(
    currentProductSummarySurface?.productSourceType ?? productSnapshotView?.identity.productSourceType
  );
  const productUrl = currentProductSummarySurface ? buildNoonProductUrl(currentProductSummarySurface) : undefined;
  const catalogUrl = buildNoonCatalogProductUrl(productSnapshotView, activeProductSiteOffer);
  const requestPullFromNoon = () => {
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
      <div className="pm-detail-section pm-detail-section--subtle">
        <Row gutter={[12, 12]} align="middle" wrap={false}>
          <Col flex="72px">
            <button
              type="button"
              disabled={!productLeadImage}
              style={{
                width: 64,
                height: 64,
                padding: 0,
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid var(--pm-subtle-border)',
                background: 'var(--pm-section-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: productLeadImage ? 'pointer' : 'default'
              }}
              onClick={() => openCurrentProductGallery(0)}
            >
              {productLeadImage ? (
                <img
                  src={productLeadImage}
                  alt="商品首图"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Text style={{ color: 'var(--pm-text-faint)' }}>暂无图片</Text>
              )}
            </button>
          </Col>

          <Col flex="auto" style={{ minWidth: 0 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={12} wrap>
                <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>
                  Partner SKU：<Text copyable>{partnerSku}</Text>
                </Text>
                <Tooltip title={sourceTypeMeta.description}>
                  <Tag color={sourceTypeMeta.color} style={{ marginInlineEnd: 0 }}>
                    {sourceTypeMeta.label}
                  </Tag>
                </Tooltip>
                {productUrl ? (
                  <Button
                    size="small"
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    icon={<ExportOutlined />}
                  >
                    打开前台详情
                  </Button>
                ) : null}
                {catalogUrl ? (
                  <Button
                    size="small"
                    href={catalogUrl}
                    target="_blank"
                    rel="noreferrer"
                    icon={<ExportOutlined />}
                  >
                    打开后台详情
                  </Button>
                ) : null}
              </Space>
              <ProductDetailSyncAlert workspace={workspace} />
            </Space>
          </Col>

          <Col flex="none">
            <Space wrap size={[8, 8]} style={{ justifyContent: 'flex-end' }}>
              <Button
                size="small"
                loading={productActionSubmitting}
                disabled={!workbenchReady || publishTaskActive}
                onClick={() => void previewProductAction('save')}
              >
                保存草稿
              </Button>
              <Button
                size="small"
                danger
                disabled={!workbenchReady || !productDraftDirty || productActionSubmitting || publishTaskActive}
                onClick={() => setRollbackConfirmOpen(true)}
              >
                回滚草稿
              </Button>
              <Button
                size="small"
                type="primary"
                loading={productActionSubmitting || productPublishTaskActionSubmitting}
                disabled={!workbenchReady || publishTaskActive || productPublishTaskActionSubmitting}
                onClick={submitPublish}
              >
                {publishTaskNeedsAttention ? '重试发布' : '发布当前修改'}
              </Button>
              <Button
                size="small"
                disabled={!workbenchReady || productActionSubmitting || publishTaskActive}
                onClick={requestPullFromNoon}
              >
                从 Noon 同步
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
    </>
  );
}
