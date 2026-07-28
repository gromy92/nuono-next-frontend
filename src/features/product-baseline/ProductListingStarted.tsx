import { Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ProductSummarySurface } from '../product-domain/productSummaryTypes';
import { isProductNotListedSource, productListingStartedSourceLabel } from './productSummary';

const { Text } = Typography;

function listingDateTime(value?: string) {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid()
    ? { date: parsed.format('YYYY-MM-DD'), time: parsed.format('HH:mm:ss') }
    : { date: value, time: '' };
}

export function ProductListingStartedBadge({
  summary,
  compact = false
}: {
  summary: ProductSummarySurface;
  compact?: boolean;
}) {
  const parts = listingDateTime(summary.listingStartedAt);
  const sourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  if (isProductNotListedSource(summary.listingStartedSource)) {
    return <Tag color="warning" style={{ marginInlineEnd: 0, fontSize: compact ? 11 : undefined }}>未上架</Tag>;
  }
  if (parts) {
    return (
      <Tag color="default" style={{ marginInlineEnd: 0, fontSize: compact ? 11 : undefined }}>
        上架 {parts.date}{sourceLabel ? ` · ${sourceLabel}` : ''}
      </Tag>
    );
  }
  return sourceLabel ? <Tag color="warning" style={{ marginInlineEnd: 0 }}>{sourceLabel}</Tag> : null;
}

export function ProductListingStartedLine({ summary }: { summary: ProductSummarySurface }) {
  const parts = listingDateTime(summary.listingStartedAt);
  const sourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  const notListed = isProductNotListedSource(summary.listingStartedSource);
  if (!parts && !notListed && !sourceLabel) {
    return null;
  }
  return (
    <div style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px', marginTop: summary.barcode ? 0 : 2 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12 }}>上架: </Text>
      <Text style={{ color: notListed || !parts ? '#b45309' : '#6b7280', fontSize: 12 }}>
        {notListed ? '未上架' : parts ? `${parts.date}${parts.time ? ` ${parts.time}` : ''}` : sourceLabel}
      </Text>
      {sourceLabel && parts && !notListed ? (
        <Tag color="default" style={{ marginInlineStart: 6, marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
          {sourceLabel}
        </Tag>
      ) : null}
    </div>
  );
}
