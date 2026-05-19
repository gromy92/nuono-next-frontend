import { DisconnectOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ProductGroupMemberCardView } from './productGroupMemberTypes';
import { formatSnapshotValue, isLiveStatusActive, productLiveStatusLabel } from '../utils';

const { Text } = Typography;

export type ProductGroupMemberListItem = ProductGroupMemberCardView & {
  partnerSku?: string;
  pskuCode?: string;
  offerCode?: string;
  liveStatus?: string;
  statusCode?: string;
  isActive?: boolean;
  liveStatuses?: string[];
  siteLabels?: string[];
  totalFbnStock?: number;
  totalSupermallStock?: number;
  totalFbpStock?: number;
};

type ProductGroupMemberListProps = {
  members: ProductGroupMemberListItem[];
  onEdit?: (member: ProductGroupMemberListItem) => void;
  onOpenDetail?: (member: ProductGroupMemberListItem) => void;
  onUnlink?: (member: ProductGroupMemberListItem) => void;
  actionDisabled?: boolean;
  compact?: boolean;
};

function firstText(...values: Array<unknown>) {
  return values.map((value) => String(value ?? '').trim()).find(Boolean);
}

function memberLiveStatus(member: ProductGroupMemberListItem) {
  const explicitStatus = firstText(member.liveStatus, member.statusCode);
  if (explicitStatus) {
    return explicitStatus;
  }
  if (typeof member.isActive === 'boolean') {
    return member.isActive ? 'true' : 'false';
  }
  return member.liveStatuses?.find((status) => firstText(status));
}

function stockValue(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function productCode(member: ProductGroupMemberListItem) {
  return firstText(member.partnerSku, member.childSku, member.skuParent);
}

function StockCell({ member }: { member: ProductGroupMemberListItem }) {
  const fbnStock = stockValue(member.totalFbnStock);
  const fbpStock = stockValue(member.totalFbpStock);

  return (
    <Text style={{ color: 'var(--pm-text-primary)' }}>
      FBN {fbnStock} / FBP {fbpStock}
    </Text>
  );
}

function ProductImage({ member, compact }: { member: ProductGroupMemberListItem; compact: boolean }) {
  const imageSize = compact ? 46 : 52;

  return (
    <div
      style={{
        width: imageSize,
        height: imageSize,
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--pm-subtle-bg)',
        border: '1px solid var(--pm-subtle-border)',
        flex: '0 0 auto'
      }}
    >
      {member.imageUrl ? (
        <img
          src={member.imageUrl}
          alt={member.title || member.skuParent}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Text
          style={{
            color: 'var(--pm-text-faint)',
            lineHeight: `${imageSize - 2}px`,
            display: 'block',
            textAlign: 'center',
            fontSize: 12
          }}
        >
          无图
        </Text>
      )}
    </div>
  );
}

function AxisTags({ member }: { member: ProductGroupMemberListItem }) {
  const axisRows = member.axisRows?.filter((item) => item.label) ?? [];
  if (!axisRows.length && !member.axisLabel) {
    return null;
  }

  const rows = axisRows.length
    ? axisRows
    : [{ label: member.axisLabel ?? '', value: member.axisValue }];

  return (
    <Space wrap size={[4, 4]}>
      {rows.map((axis) => (
        <Tag key={axis.label} style={{ marginInlineEnd: 0, fontSize: 11 }}>
          {axis.label}: {formatSnapshotValue(axis.value)}
        </Tag>
      ))}
    </Space>
  );
}

function StatusCell({ member }: { member: ProductGroupMemberListItem }) {
  const status = memberLiveStatus(member);
  const online = isLiveStatusActive(status);

  return (
    <Space direction="vertical" size={3}>
      <Tag color={online ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
        {productLiveStatusLabel(status)}
      </Tag>
      {member.siteLabels?.length ? (
        <Text type="secondary" style={{ fontSize: 11, lineHeight: '14px' }}>
          {member.siteLabels.join(' / ')}
        </Text>
      ) : null}
    </Space>
  );
}

export function ProductGroupMemberList({
  members,
  onEdit,
  onOpenDetail,
  onUnlink,
  actionDisabled = false,
  compact = false
}: ProductGroupMemberListProps) {
  const showActions = Boolean(onEdit || onOpenDetail || onUnlink);
  const gridTemplateColumns = showActions
    ? 'minmax(300px, 1.7fr) minmax(150px, 0.8fr) 116px 130px 112px'
    : 'minmax(300px, 1.7fr) minmax(150px, 0.8fr) 116px 130px';

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 760 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns,
            gap: 12,
            alignItems: 'center',
            padding: compact ? '8px 10px' : '10px 12px',
            background: '#f8fafc',
            borderBottom: '1px solid var(--pm-subtle-border)'
          }}
        >
          <Text type="secondary">商品</Text>
          <Text type="secondary">PSKU</Text>
          <Text type="secondary">在线状态</Text>
          <Text type="secondary">剩余库存</Text>
          {showActions ? (
            <Text type="secondary" style={{ textAlign: 'right' }}>
              操作
            </Text>
          ) : null}
        </div>

        {members.map((member, index) => {
          const code = productCode(member);
          return (
            <div
              key={`${member.key || member.skuParent}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns,
                gap: 12,
                alignItems: 'center',
                minHeight: compact ? 76 : 84,
                padding: compact ? '9px 10px' : '10px 12px',
                borderBottom: index === members.length - 1 ? 'none' : '1px solid var(--pm-subtle-border)',
                borderLeft: member.current ? '2px solid #1677ff' : '2px solid transparent',
                background: member.current ? '#f6fbff' : '#fff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <ProductImage member={member} compact={compact} />
                <Space direction="vertical" size={4} style={{ minWidth: 0, width: '100%' }}>
                  <Text
                    strong
                    ellipsis={{ tooltip: member.title || member.skuParent }}
                    style={{ maxWidth: '100%', fontSize: compact ? 13 : 14 }}
                  >
                    {formatSnapshotValue(member.title || member.skuParent)}
                  </Text>
                  <Text type="secondary" ellipsis style={{ maxWidth: '100%', fontSize: 12 }}>
                    {formatSnapshotValue(member.skuParent)}
                  </Text>
                  <AxisTags member={member} />
                </Space>
              </div>

              <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
                <Text ellipsis={{ tooltip: code }} style={{ maxWidth: '100%' }}>
                  {formatSnapshotValue(code)}
                </Text>
              </Space>

              <StatusCell member={member} />
              <StockCell member={member} />

              {showActions ? (
                <Space size={4} style={{ justifyContent: 'flex-end', display: 'flex' }}>
                  {onOpenDetail ? (
                    <Tooltip title="查看详情">
                      <Button
                        aria-label="查看商品详情"
                        size="small"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => onOpenDetail(member)}
                      />
                    </Tooltip>
                  ) : null}
                  {onUnlink ? (
                    <Tooltip title={actionDisabled ? '发布中，暂不能修改' : '移除关联'}>
                      <Button
                        aria-label="移除 Group 关联"
                        size="small"
                        type="text"
                        icon={<DisconnectOutlined />}
                        disabled={actionDisabled}
                        onClick={() => onUnlink(member)}
                      />
                    </Tooltip>
                  ) : null}
                  {onEdit ? (
                    <Tooltip title={actionDisabled ? '发布中，暂不能修改' : '编辑属性'}>
                      <Button
                        aria-label="编辑 Group 属性"
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        disabled={actionDisabled}
                        onClick={() => onEdit(member)}
                      />
                    </Tooltip>
                  ) : null}
                </Space>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
