import { useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, message, Popconfirm, Popover, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import { MOCK_PRODUCT_LIST_UI_STATES } from '../mockData';
import type { ProductListRowPayload, ProductListUiState, ProductOperationStageCode } from '../types';
import {
  buildProductSummarySurfaceFromListItem,
  formatDateTimeParts,
  getProductListRowIdentityKey,
  hasProductBlockingIssues,
  isLiveStatusActive,
  isProductIssueBlocking,
  productDetailBaselineStatusMeta,
  productListIssueTags,
  productIssueTagLabel,
  productSummaryPrimaryLiveStatus,
  productSyncStatusMeta
} from '../utils';
import {
  PRODUCT_OPERATION_STAGE_SELECT_OPTIONS,
  normalizeProductOperationStageCode,
  productOperationStageMeta
} from '../utils/operationStage';

const { Text } = Typography;

export function ProductListColumnInfoTitle({ label }: { label: string }) {
  return (
    <Space size={4}>
      {label}
      <InfoCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
    </Space>
  );
}

export function EstimatedFeesCell() {
  return (
    <Space direction="vertical" size={5}>
      <Space size={6}>
        <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 11 }}>
          FBN
        </Tag>
        <Text style={{ color: '#111827' }}>-</Text>
        <InfoCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
      </Space>
      <Space size={6}>
        <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 11 }}>
          FBP
        </Tag>
        <Text style={{ color: '#111827' }}>-</Text>
        <InfoCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
      </Space>
    </Space>
  );
}

export function InventoryCell({ record }: { record: ProductListRowPayload }) {
  const supermallStock = Number(record.totalSupermallStock ?? 0);

  return (
    <Space direction="vertical" size={5}>
      <Space size={6}>
        <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 11 }}>
          FBN
        </Tag>
        <Text strong style={{ color: '#111827' }}>
          {record.totalFbnStock ?? 0}
        </Text>
      </Space>
      <Text style={{ color: '#64748b', fontSize: 11, lineHeight: '14px' }}>
        Supermall {supermallStock}
      </Text>
      <Space size={6}>
        <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 11 }}>
          FBP
        </Tag>
        <Text strong style={{ color: '#111827' }}>
          {record.totalFbpStock ?? 0}
        </Text>
      </Space>
    </Space>
  );
}

export function PerformanceCell() {
  return (
    <Space direction="vertical" size={3}>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>
        Views <Text strong>-</Text>
      </Text>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>
        Units Sold <Text strong>-</Text>
      </Text>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>
        Sales <Text strong>-</Text>
      </Text>
    </Space>
  );
}

export function SellerStatusCell(props: {
  record: ProductListRowPayload;
  usingMockProductList: boolean;
  productListUiStates: Record<string, ProductListUiState>;
}) {
  const { record, usingMockProductList, productListUiStates } = props;
  const rowUiState = usingMockProductList
    ? productListUiStates[getProductListRowIdentityKey(record)] ??
      productListUiStates[record.skuParent] ??
      MOCK_PRODUCT_LIST_UI_STATES[record.skuParent]
    : undefined;
  const syncStatus = rowUiState?.syncStatus ?? record.syncStatus ?? 'synced';
  const rowSyncMeta = productSyncStatusMeta(syncStatus);
  const statusTime = syncStatus === 'draft' || syncStatus === 'conflict'
    ? record.lastDraftSavedAt ?? rowUiState?.lastSyncedAt ?? record.lastSyncedAt
    : rowUiState?.lastSyncedAt ?? record.lastSyncedAt;
  const timeParts = formatDateTimeParts(statusTime);
  const timePrefix = syncStatus === 'draft' || syncStatus === 'conflict' ? '草稿' : '同步';
  const detailBaselineStatus = record.detailBaselineStatus ?? 'missing';
  const detailMeta = productDetailBaselineStatusMeta(detailBaselineStatus);
  const detailTimeParts = formatDateTimeParts(record.detailBaselineSyncedAt);
  const detailTitle = record.detailBaselineMessage || (detailTimeParts ? `详情基线 ${detailTimeParts.date} ${detailTimeParts.time}` : undefined);

  return (
    <Space direction="vertical" size={6} align="center" style={{ width: '100%' }}>
      <Tag color={rowSyncMeta.color} style={{ marginInlineEnd: 0, fontSize: 11 }}>
        {rowSyncMeta.label}
      </Tag>
      <Tooltip title={detailTitle}>
        <Tag color={detailMeta.color} style={{ marginInlineEnd: 0, fontSize: 11 }}>
          {detailMeta.label}
        </Tag>
      </Tooltip>
      {timeParts ? (
        <Text type="secondary" style={{ fontSize: 11, lineHeight: '14px', textAlign: 'center' }}>
          {timePrefix} {timeParts.date}
          <br />
          {timeParts.time}
        </Text>
      ) : null}
    </Space>
  );
}

export function OperationStageCell(props: {
  record: ProductListRowPayload;
  updating?: boolean;
  requestUpdateProductOperationStage: (
    record: ProductListRowPayload,
    nextStageCode?: ProductOperationStageCode | string
  ) => void | Promise<void>;
}) {
  const { record, updating, requestUpdateProductOperationStage } = props;
  const operationStageCode = normalizeProductOperationStageCode(record.operationStageCode);
  const meta = productOperationStageMeta(operationStageCode);
  const updatedAtParts = formatDateTimeParts(record.operationStageUpdatedAt);
  const disabledTip = !record.partnerSku ? '缺少商品 PSKU，暂时不能修改运营阶段。' : undefined;
  const menuItems = PRODUCT_OPERATION_STAGE_SELECT_OPTIONS.map((option) => ({
    key: option.value || '__unset',
    label: option.label
  }));
  const title = disabledTip || (updatedAtParts ? `更新于 ${updatedAtParts.date} ${updatedAtParts.time}` : '点击修改运营阶段');

  return (
    <Dropdown
      trigger={['click']}
      disabled={Boolean(disabledTip) || updating}
      menu={{
        items: menuItems,
        selectedKeys: [operationStageCode || '__unset'],
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          const nextStageCode = key === '__unset' ? '' : key;
          void requestUpdateProductOperationStage(record, nextStageCode);
        }
      }}
    >
      <Tag
        color={meta.color}
        title={title}
        onClick={(event) => {
          event.stopPropagation();
        }}
        style={{
          marginInlineEnd: 0,
          fontSize: 11,
          lineHeight: '16px',
          cursor: disabledTip ? 'not-allowed' : 'pointer',
          opacity: updating ? 0.68 : 1
        }}
      >
        {meta.label}
      </Tag>
    </Dropdown>
  );
}

function publishStatusColor(statusLabel?: string) {
  if (statusLabel === '发布成功' || statusLabel === '删除成功' || statusLabel === '重建成功') {
    return {
      tag: 'success' as const,
      border: '#bbf7d0',
      background: '#f0fdf4',
      text: '#166534'
    };
  }
  if (statusLabel === '发布失败' || statusLabel === '删除失败' || statusLabel === '重建失败') {
    return {
      tag: 'error' as const,
      border: '#fecaca',
      background: '#fef2f2',
      text: '#991b1b'
    };
  }
  if (statusLabel === '待人工核对' || statusLabel === '删除待核对' || statusLabel === '重建待核对') {
    return {
      tag: 'warning' as const,
      border: '#fde68a',
      background: '#fffbeb',
      text: '#92400e'
    };
  }
  return {
    tag: 'processing' as const,
    border: '#bfdbfe',
    background: '#eff6ff',
    text: '#1d4ed8'
  };
}

function publishText(value: unknown) {
  return String(value ?? '').trim();
}

function ProductPublishPopoverContent({ task }: { task: NonNullable<ProductListRowPayload['lastPublishTask']> }) {
  const isDeleteTask = task.taskType === 'product-delete';
  const isRebuildTask = task.taskType === 'product-rebuild';
  const changes = Array.isArray(task.changes)
    ? task.changes.filter((change): change is Record<string, unknown> => Boolean(change) && typeof change === 'object')
    : [];

  return (
    <Space direction="vertical" size={10} style={{ minWidth: 320, maxWidth: 460 }}>
      <Space wrap size={[8, 6]}>
        <Tag color={publishStatusColor(task.statusLabel).tag} style={{ marginInlineEnd: 0 }}>
          {task.statusLabel}
        </Tag>
        {task.targetSiteCode ? <Tag style={{ marginInlineEnd: 0 }}>{task.targetSiteCode}</Tag> : null}
      </Space>
      <Space direction="vertical" size={4}>
        {task.submittedAt ? <Text style={{ fontSize: 12 }}>提交时间：{task.submittedAt}</Text> : null}
        {task.finishedAt ? <Text style={{ fontSize: 12 }}>结果时间：{task.finishedAt}</Text> : null}
        {task.resultText ? <Text style={{ fontSize: 12 }}>结果：{task.resultText}</Text> : null}
      </Space>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
        {changes.length ? (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {changes.map((change, index) => {
              const label = publishText(change.label) || publishText(change.field) || '字段';
              return (
                <div key={`${label}-${index}`} style={{ fontSize: 12, lineHeight: '18px' }}>
                  <Text strong>{label}：</Text>
                  <Text>{publishText(change.before) || '空'}</Text>
                  <Text style={{ color: '#64748b' }}> -&gt; </Text>
                  <Text>{publishText(change.after) || '空'}</Text>
                </div>
              );
            })}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isRebuildTask
              ? '本次重建任务不记录字段变更。'
              : isDeleteTask
                ? '本次删除任务不记录字段变更。'
                : '本次发布内容明细暂未记录。'}
          </Text>
        )}
      </div>
      {task.taskId ? (
        <Text type="secondary" style={{ fontSize: 11 }}>
          Task ID：{task.taskId}
        </Text>
      ) : null}
    </Space>
  );
}

export function PublishStatusCell({ record }: { record: ProductListRowPayload }) {
  const task = record.lastPublishTask;
  if (!task?.statusLabel) {
    return <span style={{ display: 'block', minHeight: 38 }} />;
  }
  const colors = publishStatusColor(task.statusLabel);
  const timeParts = formatDateTimeParts(task.finishedAt ?? task.submittedAt);
  const popoverTitle =
    task.taskType === 'product-rebuild' ? '重建任务' : task.taskType === 'product-delete' ? '删除任务' : '上次发布';

  return (
    <Popover trigger={['click']} title={popoverTitle} content={<ProductPublishPopoverContent task={task} />}>
      <button
        type="button"
        style={{
          width: '100%',
          minHeight: 58,
          padding: '8px 10px',
          borderRadius: 6,
          border: `1px solid ${colors.border}`,
          background: colors.background,
          textAlign: 'left',
          cursor: 'pointer'
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Tag color={colors.tag} style={{ marginInlineEnd: 0, marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
          {task.statusLabel}
        </Tag>
        <Text style={{ display: 'block', color: colors.text, fontSize: 11, lineHeight: '15px' }}>
          {timeParts ? `${timeParts.date} ${timeParts.time}` : task.resultText || ''}
        </Text>
      </button>
    </Popover>
  );
}

function ProductIssuePopoverContent({ issues }: { issues: string[] }) {
  const hasBlockingIssues = hasProductBlockingIssues(issues);

  return (
    <Space direction="vertical" size={8} style={{ minWidth: 260, maxWidth: 360 }}>
      <Text strong style={{ color: hasBlockingIssues ? '#b91c1c' : '#92400e' }}>
        {hasBlockingIssues ? '当前问题会阻断上架' : '当前问题需要核对'}
      </Text>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        {issues.map((issue, index) => {
          const blocking = isProductIssueBlocking(issue);
          const label = productIssueTagLabel(issue);
          return (
            <Space key={`${issue}-${index}`} direction="vertical" size={2} style={{ width: '100%' }}>
              <Space size={6} wrap>
                <Tag color={blocking ? 'error' : 'warning'} style={{ marginInlineEnd: 0 }}>
                  {blocking ? '阻断' : '待核对'}
                </Tag>
                <Text strong>{label}</Text>
              </Space>
              {label !== issue ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {issue}
                </Text>
              ) : null}
            </Space>
          );
        })}
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        处理完成后刷新或重新同步商品状态。
      </Text>
    </Space>
  );
}

export function LiveStatusCell(props: {
  record: ProductListRowPayload;
  usingMockProductList: boolean;
  productListUiStates: Record<string, ProductListUiState>;
  updateProductListLiveStatus: (skuParent: string | undefined, liveActive: boolean) => void;
}) {
  const {
    record,
    usingMockProductList,
    productListUiStates,
    updateProductListLiveStatus
  } = props;
  const [downConfirmOpen, setDownConfirmOpen] = useState(false);
  const summary = buildProductSummarySurfaceFromListItem(record);
  const primaryLiveStatus = productSummaryPrimaryLiveStatus(summary);
  const rowUiState = usingMockProductList
    ? productListUiStates[getProductListRowIdentityKey(record)] ??
      productListUiStates[record.skuParent] ??
      MOCK_PRODUCT_LIST_UI_STATES[record.skuParent]
    : undefined;
  const liveActive = isLiveStatusActive(primaryLiveStatus);
  const issueTags = productListIssueTags(record);
  const hasIssues = issueTags.length > 0;
  const hasBlockingIssues = hasProductBlockingIssues(issueTags);
  const canTurnOn = usingMockProductList && (liveActive || !hasBlockingIssues);
  const disabledTip = !usingMockProductList
    ? '请进入商品详情的 Offer 区修改在架状态，并点击发布当前修改。'
    : !canTurnOn
      ? '商品存在阻断问题，处理后才能上架'
      : undefined;

  const commitLiveStatus = (nextLiveActive: boolean) => {
    updateProductListLiveStatus(getProductListRowIdentityKey(record), nextLiveActive);
    message.success(nextLiveActive ? '已标记为上架' : '已标记为下架');
  };

  const liveSwitch = (
    <Switch
      size="small"
      checked={liveActive}
      disabled={!canTurnOn}
      checkedChildren="在线"
      unCheckedChildren="下架"
      onChange={(nextLiveActive, event) => {
        event.stopPropagation();
        if (nextLiveActive) {
          commitLiveStatus(true);
          return;
        }
        setDownConfirmOpen(true);
      }}
    />
  );

  return (
    <Space direction="vertical" size={6} align="start">
      <Popconfirm
        open={downConfirmOpen}
        title="确认下架当前商品？"
        description="下架后该商品将标记为不在线。"
        okText="确认下架"
        cancelText="取消"
        onConfirm={(event) => {
          event?.stopPropagation();
          setDownConfirmOpen(false);
          commitLiveStatus(false);
        }}
        onCancel={(event) => {
          event?.stopPropagation();
          setDownConfirmOpen(false);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDownConfirmOpen(false);
          }
        }}
      >
        <Tooltip title={disabledTip}>
          <span onClick={(event) => event.stopPropagation()}>{liveSwitch}</span>
        </Tooltip>
      </Popconfirm>
      {hasIssues ? (
        <Popover
          trigger={['click', 'hover']}
          title="商品问题"
          content={<ProductIssuePopoverContent issues={issueTags} />}
        >
          <Button
            type="link"
            danger={hasBlockingIssues}
            style={{
              height: 20,
              padding: 0,
              fontSize: 12,
              color: hasBlockingIssues ? undefined : '#d97706'
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            查看问题
          </Button>
        </Popover>
      ) : null}
    </Space>
  );
}
