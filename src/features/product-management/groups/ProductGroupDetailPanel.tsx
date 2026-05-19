import { Alert, Button, Empty, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { ProductGroupOfficialPanel } from './ProductGroupOfficialPanel';
import {
  formatSnapshotValue,
  isProductPublishTaskActive,
  isProductPublishTaskNeedsAttention,
  productPublishTaskStatusLabel
} from '../utils';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import type { ProductGroupRow } from './productGroupRows';
import type { ProductGroupMemberListItem } from './ProductGroupMemberList';
import { useProductGroupCurrentMemberUnlink } from './useProductGroupCurrentMemberUnlink';

const { Text } = Typography;

type ProductGroupDetailPanelProps = {
  group: ProductGroupRow | null;
  activeOwnerId?: number;
  workspace: ProductManagementWorkspace;
};

export function ProductGroupDetailPanel(props: ProductGroupDetailPanelProps) {
  const { group, activeOwnerId, workspace } = props;
  const [refreshedPublishTaskId, setRefreshedPublishTaskId] = useState<number | undefined>();
  const shouldRefreshAfterLocalPublishRef = useRef(false);
  const publishTask =
    workspace.productWorkbenchSurfaceState.status === 'ready'
      ? workspace.productWorkbenchSurfaceState.payload.publishTask
      : undefined;
  const publishTaskId = typeof publishTask?.taskId === 'number' ? publishTask.taskId : undefined;
  const publishTaskActive = isProductPublishTaskActive(publishTask);
  const publishTaskNeedsAttention = isProductPublishTaskNeedsAttention(publishTask);
  const workbenchReady = workspace.productWorkbenchSurfaceState.status === 'ready' && Boolean(workspace.productWorkbenchState);
  const actionDisabled = !workbenchReady || workspace.productActionSubmitting || publishTaskActive;
  const { productActionSubmitting, productDraftDirty } = workspace;
  const showPublishRetry = productDraftDirty || productActionSubmitting || publishTaskActive || publishTaskNeedsAttention;
  const publishStatusLabel = publishTask?.taskId
    ? productPublishTaskStatusLabel(publishTask)
    : workspace.productActionSubmitting || publishTaskActive
      ? '发布中'
      : '待发布';
  const publishStatusColor =
    publishTask?.status === 'failed'
      ? 'error'
      : publishTaskNeedsAttention
        ? 'warning'
        : workspace.productActionSubmitting || publishTaskActive
          ? 'processing'
          : 'warning';
  const { requestCurrentMemberUnlink } = useProductGroupCurrentMemberUnlink({
    workspace
  });

  const openMemberDetail = (member: ProductGroupMemberListItem) => {
    if (!member.skuParent) {
      return;
    }
    void workspace.openProductWorkbenchInPageTab({
      skuParent: member.skuParent,
      partnerSku: member.partnerSku,
      pskuCode: member.pskuCode,
      storeCode: workspace.selectedInitializationStoreCode
    });
  };

  const submitGroupPublish = () => {
    if (publishTaskNeedsAttention && publishTaskId) {
      void workspace.retryProductPublishTask(publishTaskId);
      return;
    }
    void workspace.previewProductAction('publish-current');
  };

  useEffect(() => {
    if (!publishTaskId || publishTaskActive || refreshedPublishTaskId === publishTaskId) {
      return;
    }
    if (!activeOwnerId || !workspace.selectedInitializationStoreCode) {
      return;
    }
    setRefreshedPublishTaskId(publishTaskId);
    void workspace.loadProductListDataset(workspace.selectedInitializationStoreCode, activeOwnerId);
  }, [
    activeOwnerId,
    publishTaskActive,
    publishTaskId,
    refreshedPublishTaskId,
    workspace
  ]);

  useEffect(() => {
    const hasLocalPendingChange = productDraftDirty || productActionSubmitting || publishTaskActive;
    if (hasLocalPendingChange) {
      shouldRefreshAfterLocalPublishRef.current = true;
      return;
    }
    if (!shouldRefreshAfterLocalPublishRef.current || publishTaskId) {
      return;
    }
    shouldRefreshAfterLocalPublishRef.current = false;
    if (!activeOwnerId || !workspace.selectedInitializationStoreCode) {
      return;
    }
    void workspace.loadProductListDataset(workspace.selectedInitializationStoreCode, activeOwnerId);
  }, [
    activeOwnerId,
    productActionSubmitting,
    productDraftDirty,
    publishTaskActive,
    publishTaskId,
    workspace
  ]);

  if (!group) {
    return (
      <div
        style={{
          minHeight: 520,
          border: '1px solid var(--pm-subtle-border)',
          borderRadius: 8,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择左侧分组" />
      </div>
    );
  }

  return (
    <div
      style={{
        minWidth: 0,
        border: '1px solid var(--pm-subtle-border)',
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--pm-subtle-border)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center'
        }}
      >
        <Space direction="vertical" size={5} style={{ minWidth: 0 }}>
          <Text strong style={{ fontSize: 18, lineHeight: 1.2 }}>
            {formatSnapshotValue(group.groupRef)}
          </Text>
          <Space wrap size={[6, 6]}>
            {group.brand ? <Tag>{group.brand}</Tag> : null}
            {group.productFulltype ? <Tag>{group.productFulltype}</Tag> : null}
          </Space>
        </Space>
        {showPublishRetry ? (
          <Space wrap style={{ justifyContent: 'flex-end' }}>
            <Tag color={publishStatusColor} style={{ marginInlineEnd: 0 }}>
              {publishStatusLabel}
            </Tag>
            {publishTaskNeedsAttention && publishTask?.message ? (
              <Text type="secondary" style={{ maxWidth: 360 }} ellipsis>
                {publishTask.message}
              </Text>
            ) : null}
            <Button
              size="small"
              type="primary"
              loading={workspace.productActionSubmitting || workspace.productPublishTaskActionSubmitting}
              disabled={
                actionDisabled ||
                workspace.productPublishTaskActionSubmitting ||
                (!workspace.productDraftDirty && !publishTaskNeedsAttention)
              }
              onClick={submitGroupPublish}
            >
              {publishTaskNeedsAttention ? '重试发布' : '发布修改'}
            </Button>
          </Space>
        ) : null}
      </div>

      <Space direction="vertical" size={10} style={{ width: '100%', padding: 12 }}>
        {workspace.productWorkbenchSurfaceState.status === 'loading' ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <Space direction="vertical" size={8} align="center">
              <Spin />
              <Text type="secondary">
                {workspace.productWorkbenchSurfaceState.message || '正在载入 Group 工作台...'}
              </Text>
            </Space>
          </div>
        ) : workspace.productWorkbenchSurfaceState.status === 'error' ? (
          <Alert
            type="error"
            showIcon
            message="Group 工作台打开失败"
            description={workspace.productWorkbenchSurfaceState.message}
          />
        ) : workspace.productWorkbenchSurfaceState.status === 'ready' && workspace.productSnapshotView ? (
          <ProductGroupOfficialPanel
            productSnapshotView={workspace.productSnapshotView}
            productGroupMembers={workspace.productGroupMembers}
            productListSourceItems={workspace.productListSourceItems}
            updateProductSectionField={workspace.updateProductSectionField}
            memberDisplayLimit={null}
            compact
            actionDisabled={actionDisabled}
            onCurrentMemberUnlinkRequested={requestCurrentMemberUnlink}
            onMemberDetailOpen={openMemberDetail}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="正在等待 Group 工作台载入" />
        )}
      </Space>
    </div>
  );
}
