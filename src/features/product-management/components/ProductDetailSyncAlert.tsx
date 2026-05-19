import type { ReactNode } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { isProductPublishTaskActive, isProductPublishTaskNeedsAttention } from '../utils';

const { Text } = Typography;

type ProductDetailSyncAlertProps = {
  workspace: ProductManagementWorkspace;
};

function buildDraftDescription(
  changedDomainLabels: string[] | undefined,
  dirtySiteOfferCodes: string[]
) {
  const changedText = changedDomainLabels?.length ? changedDomainLabels.join(' / ') : '暂无';
  const siteDraftText = dirtySiteOfferCodes.length
    ? `；站点经营草稿：${dirtySiteOfferCodes.join('、')}`
    : '';
  return `已修改内容：${changedText}${siteDraftText}。`;
}

export function ProductDetailSyncAlert({ workspace }: ProductDetailSyncAlertProps) {
  const {
    productWorkbenchState,
    productDraftDirty,
    productWorkbenchFieldSurface,
    dirtySiteOfferCodes,
    productWorkbenchSurfaceState
  } = workspace;
  const syncStatus = productWorkbenchState?.syncStatus;
  const publishTask =
    productWorkbenchSurfaceState.status === 'ready' ? productWorkbenchSurfaceState.payload.publishTask : undefined;
  const changedDomainKeys = productWorkbenchFieldSurface?.changedDomainKeys ?? [];
  const onlyGroupDraft =
    changedDomainKeys.length > 0 &&
    changedDomainKeys.every((key) => key === 'grouping') &&
    dirtySiteOfferCodes.length === 0;

  if (
    publishTask?.taskId &&
    (isProductPublishTaskActive(publishTask) || publishTask.status === 'failed' || publishTask.status === 'pending_manual_check')
  ) {
    const publishTaskMessage = publishTask.message || '发布任务状态已更新。';
    const taskNeedsAttention = isProductPublishTaskNeedsAttention(publishTask);
    const warning = taskNeedsAttention;
    const taskAction = taskNeedsAttention ? (
      <Button
        size="small"
        type="primary"
        loading={workspace.productPublishTaskActionSubmitting}
        disabled={workspace.productPublishTaskActionSubmitting}
        onClick={() => void workspace.retryProductPublishTask(publishTask.taskId)}
      >
        重试发布
      </Button>
    ) : publishTask.status === 'queued' ? (
      <Button
        size="small"
        loading={workspace.productPublishTaskActionSubmitting}
        disabled={workspace.productPublishTaskActionSubmitting}
        onClick={() => void workspace.cancelProductPublishTask(publishTask.taskId)}
      >
        取消发布
      </Button>
    ) : undefined;
    return (
      <CompactDetailNotice
        tone={warning ? 'warning' : 'info'}
        title="商品发布任务"
        description={publishTaskMessage}
        action={taskAction}
      />
    );
  }

  if (!productDraftDirty && syncStatus !== 'failed') {
    return null;
  }

  const note = productWorkbenchState?.note;
  const groupDraftPublishNote = syncStatus === 'draft' && Boolean(note) && note?.includes('Group 草稿');

  return (
    <CompactDetailNotice
      tone={syncStatus === 'failed' ? 'warning' : 'info'}
      title={
        syncStatus === 'failed'
          ? '当前修改暂未发布'
          : groupDraftPublishNote || onlyGroupDraft
            ? '当前有 Group 轴修改'
            : '当前有本地修改，可保存草稿或发布当前修改'
      }
      description={
        syncStatus === 'failed'
          ? productWorkbenchState?.note
          : groupDraftPublishNote
            ? note
            : onlyGroupDraft
              ? '已有成员的 Group 轴属性值、新增未分组商品和 Unlink 会写回 Noon；换组和轴定义仍会阻断。'
          : buildDraftDescription(productWorkbenchFieldSurface?.changedDomainLabels, dirtySiteOfferCodes)
      }
    />
  );
}

function CompactDetailNotice(props: { tone: 'info' | 'warning'; title: string; description?: string; action?: ReactNode }) {
  const { tone, title, description, action } = props;
  const warning = tone === 'warning';
  return (
    <div
      style={{
        display: 'inline-flex',
        maxWidth: '100%',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 6,
        border: warning ? '1px solid #ffd591' : '1px solid #91caff',
        background: warning ? '#fff7e6' : '#e6f4ff'
      }}
    >
      <InfoCircleOutlined style={{ color: warning ? '#fa8c16' : '#1677ff', flex: '0 0 auto' }} />
      <Space size={6} wrap style={{ minWidth: 0 }}>
        <Text strong style={{ color: 'var(--pm-text-primary)' }}>
          {title}
        </Text>
        {description ? (
          <Text style={{ color: 'var(--pm-text-secondary)' }}>
            {description}
          </Text>
        ) : null}
      </Space>
      {action}
    </div>
  );
}
