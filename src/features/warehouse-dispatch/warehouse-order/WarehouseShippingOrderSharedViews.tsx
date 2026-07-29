import { Select, Spin, Tag, Typography } from 'antd';
import type {
  OrderLogisticsQuoteChannelOption,
  OrderLogisticsQuoteForwarderOption,
  OrderLogisticsQuoteImportResult,
  OrderLogisticsQuoteOptions
} from '../../logistics-quote/types';
import type {
  ShippingOrder,
  ShippingOrderSegment
} from './warehouseShippingOrderTypes';
import {
  formatQuantity,
  shippingOrderQuoteIssueSummary
} from './warehouseShippingOrderDomain';
import type { QuoteExportSelection } from './warehouseShippingOrderModels';
import { WarehouseShippingOrderPublishedPriceCard } from './WarehouseShippingOrderPublishedPriceCard';
import {
  findQuoteChannelOption,
  findQuoteForwarderOption,
  quoteChannelDisplayName,
  quoteForwarderLabel,
  shippingOrderSegmentTabLabel
} from './warehouseShippingQuoteDomain';

const { Text } = Typography;

export function WarehouseOrderIssueTags({ order }: { order: ShippingOrder }) {
  const quoteIssue = shippingOrderQuoteIssueSummary(order);
  if (!quoteIssue.totalCount) {
    return <Text type="secondary">无</Text>;
  }
  return (
    <div className="warehouse-shipping-order-issue-tags">
      <Tag color="red" title={[
        quoteIssue.pendingQuoteCount > 0 ? `缺单价或待确认 ${formatQuantity(quoteIssue.pendingQuoteCount)}` : '',
        quoteIssue.missingMaterialCount > 0 ? `缺义特材质 ${formatQuantity(quoteIssue.missingMaterialCount)}` : ''
      ].filter(Boolean).join('；')}>
        报价缺失 {formatQuantity(quoteIssue.totalCount)}
      </Tag>
    </div>
  );
}

export function DetailSegmentChips({
  segments,
  activeSegment,
  onSelect
}: {
  segments: ShippingOrderSegment[];
  activeSegment?: ShippingOrderSegment;
  onSelect: (segmentId: string) => void;
}) {
  return (
    <div className="warehouse-shipping-order-chip-group warehouse-shipping-order-chip-group--route">
      <span className="warehouse-shipping-order-chip-label">站点/运输方式</span>
      <div className="warehouse-shipping-order-chip-row">
        {segments.length ? segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            className={[
              'warehouse-shipping-order-chip',
              activeSegment?.id === segment.id ? 'warehouse-shipping-order-chip--active' : ''
            ].filter(Boolean).join(' ')}
            onClick={() => onSelect(String(segment.id))}
          >
            {shippingOrderSegmentTabLabel(segment)}
          </button>
        )) : (
          <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted">暂无子仓库单</span>
        )}
      </div>
    </div>
  );
}

export function ActiveSegmentQuoteControls({
  options,
  loading,
  selectedOption,
  onSelect
}: {
  options: OrderLogisticsQuoteOptions | null;
  loading: boolean;
  selectedOption: QuoteExportSelection;
  onSelect: (
    forwarder: OrderLogisticsQuoteForwarderOption,
    channel: OrderLogisticsQuoteChannelOption
  ) => void;
}) {
  const forwarders = options?.forwarders || [];
  const selectedForwarder = findQuoteForwarderOption(options, selectedOption.forwarderCode);
  const selectedChannel = findQuoteChannelOption(selectedForwarder, selectedOption.routeCode);
  return (
    <>
      <QuoteChipGroup label="货代" loading={loading} emptyText="暂无货代">
        {forwarders.map((forwarder) => {
          const channel = forwarder.channels?.[0];
          return (
            <QuoteChip
              key={forwarder.forwarderCode}
              active={selectedForwarder?.forwarderCode === forwarder.forwarderCode}
              disabled={!channel}
              onClick={() => channel && onSelect(forwarder, channel)}
            >
              {quoteForwarderLabel(forwarder)}
            </QuoteChip>
          );
        })}
      </QuoteChipGroup>
      {(selectedForwarder?.channels || []).length > 1 ? (
        <div className="warehouse-shipping-order-compact-channel-selector">
          <span className="warehouse-shipping-order-chip-label">渠道</span>
          <Select
            size="small"
            value={selectedChannel?.routeCode}
            placeholder="选择渠道"
            options={(selectedForwarder?.channels || []).map((channel) => ({
              value: channel.routeCode,
              label: quoteChannelDisplayName(selectedForwarder, channel)
            }))}
            onChange={(routeCode) => {
              const channel = findQuoteChannelOption(selectedForwarder, routeCode);
              if (selectedForwarder && channel) onSelect(selectedForwarder, channel);
            }}
          />
        </div>
      ) : null}
      <WarehouseShippingOrderPublishedPriceCard channel={selectedChannel} />
    </>
  );
}

function QuoteChipGroup({
  label,
  loading,
  emptyText,
  channel,
  children
}: React.PropsWithChildren<{
  label: string;
  loading: boolean;
  emptyText: string;
  channel?: boolean;
}>) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className={`warehouse-shipping-order-chip-group${channel ? ' warehouse-shipping-order-chip-group--channel' : ''}`}>
      <span className="warehouse-shipping-order-chip-label">{label}</span>
      <div className="warehouse-shipping-order-chip-row">
        {loading ? (
          <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted"><Spin size="small" /></span>
        ) : hasChildren ? children : (
          <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function QuoteChip({
  active,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        'warehouse-shipping-order-chip',
        active ? 'warehouse-shipping-order-chip--active' : ''
      ].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}

export function DetailLineFilterLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className={count > 0 ? 'warehouse-shipping-order-detail-filter-danger' : undefined}>
      {label} {formatQuantity(count)}
    </span>
  );
}

export function QuoteImportResultContent({ result }: { result: OrderLogisticsQuoteImportResult }) {
  const summary = `识别 ${formatQuantity(Number(result.totalRows || 0))} 行，更新 ${formatQuantity(Number(result.updatedRows || 0))} 行，跳过 ${formatQuantity(Number(result.skippedRows || 0))} 行。`;
  const errors = (result.errors || []).slice(0, 6)
    .map((error) => `第 ${error.rowNumber || '-'} 行：${error.message || '未更新'}`);
  if (!errors.length) return <Text>{summary}</Text>;
  return (
    <div className="warehouse-shipping-order-import-result">
      <Text>{summary}</Text>
      <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
      {(result.errors || []).length > errors.length ? (
        <Text type="secondary">其余 {(result.errors || []).length - errors.length} 条请检查文件。</Text>
      ) : null}
    </div>
  );
}
