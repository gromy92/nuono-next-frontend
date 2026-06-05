import { Button, List, Space, Tag, Typography } from 'antd';
import type { ProductSummarySurface } from '../types';
import {
  formatDateTimeParts,
  isProductNotListedSource,
  isLiveStatusActive,
  productListingStartedSourceLabel,
  productLiveStatusLabel,
  productSummaryIdentityLine,
  productSummaryPriceLine,
  productSummaryPrimaryLiveStatus,
  productSummaryPrimarySite,
  productSummaryTitle,
  productSyncStatusMeta
} from '../utils';

const { Text } = Typography;

export function ProductSummaryPrimaryTags({
  summary,
  includeSync = true,
  includeBrand = true,
  includeFulltype = true,
  includeGroup = true,
  includeLive = true,
  includeSite = false
}: {
  summary: ProductSummarySurface;
  includeSync?: boolean;
  includeBrand?: boolean;
  includeFulltype?: boolean;
  includeGroup?: boolean;
  includeLive?: boolean;
  includeSite?: boolean;
}) {
  const syncMeta = summary.syncStatus ? productSyncStatusMeta(summary.syncStatus) : null;
  const primaryLiveStatus = productSummaryPrimaryLiveStatus(summary);
  const primarySite = productSummaryPrimarySite(summary);

  return (
    <Space wrap size={[8, 8]}>
      {includeSync && syncMeta ? (
        <Tag color={syncMeta.color} style={{ marginInlineEnd: 0 }}>
          {syncMeta.label}
        </Tag>
      ) : null}
      {includeBrand && summary.brand ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          {summary.brand}
        </Tag>
      ) : null}
      {includeFulltype && summary.productFulltype ? (
        <Tag color="processing" style={{ marginInlineEnd: 0 }}>
          {summary.productFulltype}
        </Tag>
      ) : null}
      {includeGroup && summary.groupRef ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          Group {summary.groupRef}
        </Tag>
      ) : null}
      {includeLive && primaryLiveStatus ? (
        <Tag color={isLiveStatusActive(primaryLiveStatus) ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
          {productLiveStatusLabel(primaryLiveStatus)}
        </Tag>
      ) : null}
      {includeSite && primarySite !== '-' ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          {primarySite}
        </Tag>
      ) : null}
    </Space>
  );
}

export function ProductSummaryMetricTags({
  summary,
  includeLastSynced = true
}: {
  summary: ProductSummarySurface;
  includeLastSynced?: boolean;
}) {
  const listingStartedParts = formatDateTimeParts(summary.listingStartedAt);
  const listingStartedSourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  const productNotListed = isProductNotListedSource(summary.listingStartedSource);

  return (
    <Space wrap size={[8, 8]}>
      <Tag color="success" style={{ marginInlineEnd: 0 }}>
        参考价 {productSummaryPriceLine(summary)}
      </Tag>
      {summary.originalPrice ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          原价 {summary.currency || ''} {summary.originalPrice}
        </Tag>
      ) : null}
      {summary.salePrice ? (
        <Tag color="magenta" style={{ marginInlineEnd: 0 }}>
          活动价 {summary.currency || ''} {summary.salePrice}
        </Tag>
      ) : null}
      {summary.variantCount !== undefined ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          变体 {summary.variantCount}
        </Tag>
      ) : null}
      {summary.siteOfferCount !== undefined ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          站点 {summary.siteOfferCount}
        </Tag>
      ) : null}
      {productNotListed ? (
        <Tag color="warning" style={{ marginInlineEnd: 0 }}>
          未上架
        </Tag>
      ) : listingStartedParts ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          上架 {listingStartedParts.date}
          {listingStartedSourceLabel ? ` · ${listingStartedSourceLabel}` : ''}
        </Tag>
      ) : listingStartedSourceLabel ? (
        <Tag color="warning" style={{ marginInlineEnd: 0 }}>
          {listingStartedSourceLabel}
        </Tag>
      ) : null}
      {includeLastSynced && summary.lastSyncedAt ? (
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          最近同步 {summary.lastSyncedAt}
        </Tag>
      ) : null}
    </Space>
  );
}

export function ProductSummaryEntry(props: {
  summary: ProductSummarySurface;
  actionLabel: string;
  actionKey: string;
  onAction: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { summary, actionLabel, actionKey, onAction, disabled, compact } = props;

  return (
    <List.Item
      style={{ paddingInline: 0 }}
      actions={[
        <Button
          key={actionKey}
          type="link"
          style={{ paddingInline: 0 }}
          disabled={disabled}
          onClick={() => void onAction()}
        >
          {actionLabel}
        </Button>
      ]}
    >
      <Space size={compact ? 12 : 14} align="start" style={{ width: '100%' }}>
        <div
          style={{
            width: compact ? 48 : 56,
            height: compact ? 48 : 56,
            borderRadius: 8,
            border: '1px solid #dbe4ea',
            background: '#f8fafc',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {summary.imageUrl ? (
            <img
              src={summary.imageUrl}
              alt={summary.title || summary.skuParent}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <ProductSummaryPrimaryTags summary={summary} />
          </div>

          <Text strong style={{ color: '#0f172a' }}>
            {productSummaryTitle(summary)}
          </Text>
          <div
            style={{
              marginTop: 4,
              color: '#64748b',
              display: '-webkit-box',
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {productSummaryIdentityLine(summary)}
          </div>

          <div style={{ marginTop: 8 }}>
            <ProductSummaryMetricTags summary={summary} />
          </div>
        </div>
      </Space>
    </List.Item>
  );
}
