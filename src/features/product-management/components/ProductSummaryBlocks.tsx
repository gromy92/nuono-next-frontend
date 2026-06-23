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
import { ProductBaselineIdentity } from '../../product-baseline';

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
        当前价 {productSummaryPriceLine(summary)}
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
      <ProductBaselineIdentity
        title={productSummaryTitle(summary)}
        imageUrl={summary.imageUrl || summary.galleryImages[0]}
        imageCount={summary.galleryImages.length}
        imageAlt={summary.title || summary.skuParent}
        imageWidth={compact ? 56 : 72}
        compact={compact}
        titleMaxWidth="100%"
        codes={[
          {
            value: productSummaryIdentityLine(summary),
            copyText: summary.skuParent
          }
        ]}
        tags={<ProductSummaryPrimaryTags summary={summary} />}
        extra={<ProductSummaryMetricTags summary={summary} />}
      />
    </List.Item>
  );
}
