import { InfoCircleOutlined } from '@ant-design/icons';
import { Dropdown, Space, Tag, Tooltip, Typography } from 'antd';
import { MOCK_PRODUCT_LIST_UI_STATES } from '../mockData';
import type { ProductListRowPayload, ProductListUiState, ProductOperationStageCode } from '../types';
import { formatDateTimeParts } from '../utils/common';
import { getProductListRowIdentityKey } from '../../product-domain/productIdentity';
import { productDetailBaselineStatusMeta } from '../utils/status';
import { productSyncStatusMeta } from '../../product-baseline';
import {
  PRODUCT_OPERATION_STAGE_SELECT_OPTIONS,
  normalizeProductOperationStageCode,
  productOperationStageMeta
} from '../utils/operationStage';

const { Text } = Typography;

export { LiveStatusCell } from './ProductListLiveStatusCell';
export { PublishStatusCell } from './ProductListPublishStatusCell';

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
