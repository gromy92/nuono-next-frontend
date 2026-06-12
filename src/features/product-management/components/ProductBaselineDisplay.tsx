import { Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { ProductSummarySurface } from '../types';
import {
  formatDateTimeParts,
  isProductNotListedSource,
  productListingStartedSourceLabel,
  productSourceTypeMeta,
  productSummaryTitle
} from '../utils';
import { ProductImageThumb } from '../../product-baseline';
export { ProductImageThumb } from '../../product-baseline';

const { Text } = Typography;

function ListingStartedBadge({ summary, compact = false }: { summary: ProductSummarySurface; compact?: boolean }) {
  const listingStartedParts = formatDateTimeParts(summary.listingStartedAt);
  const listingStartedSourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  const productNotListed = isProductNotListedSource(summary.listingStartedSource);

  if (productNotListed) {
    return (
      <Tag color="warning" style={{ marginInlineEnd: 0, fontSize: compact ? 11 : undefined }}>
        未上架
      </Tag>
    );
  }
  if (listingStartedParts) {
    return (
      <Tag color="default" style={{ marginInlineEnd: 0, fontSize: compact ? 11 : undefined }}>
        上架 {listingStartedParts.date}
        {listingStartedSourceLabel ? ` · ${listingStartedSourceLabel}` : ''}
      </Tag>
    );
  }
  if (listingStartedSourceLabel) {
    return (
      <Tag color="warning" style={{ marginInlineEnd: 0, fontSize: compact ? 11 : undefined }}>
        {listingStartedSourceLabel}
      </Tag>
    );
  }
  return null;
}

function ListingStartedLine({ summary }: { summary: ProductSummarySurface }) {
  const listingStartedParts = formatDateTimeParts(summary.listingStartedAt);
  const listingStartedSourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  const productNotListed = isProductNotListedSource(summary.listingStartedSource);

  if (!listingStartedParts && !productNotListed && !listingStartedSourceLabel) {
    return null;
  }

  return (
    <div style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px', marginTop: summary.barcode ? 0 : 2 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12 }}>上架: </Text>
      <Text style={{ color: productNotListed || !listingStartedParts ? '#b45309' : '#6b7280', fontSize: 12 }}>
        {productNotListed
          ? '未上架'
          : listingStartedParts
            ? `${listingStartedParts.date}${listingStartedParts.time ? ` ${listingStartedParts.time}` : ''}`
            : listingStartedSourceLabel}
      </Text>
      {listingStartedSourceLabel && listingStartedParts && !productNotListed ? (
        <Tag color="default" style={{ marginInlineStart: 6, marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
          {listingStartedSourceLabel}
        </Tag>
      ) : null}
    </div>
  );
}

type ProductBaselineListCellProps = {
  summary: ProductSummarySurface;
  imageUrl?: string;
  imageCount?: number;
  imageAlt?: string;
  imageDisabled?: boolean;
  titleHref?: string;
  onImageClick?: () => void;
  actions?: ReactNode;
};

export function ProductBaselineListCell({
  summary,
  imageUrl,
  imageCount = 0,
  imageAlt,
  imageDisabled,
  titleHref,
  onImageClick,
  actions
}: ProductBaselineListCellProps) {
  const title = productSummaryTitle(summary);
  const titleCn = summary.titleCn?.trim();
  const displayTitle = titleCn || title;
  const showEnglishTitle = Boolean(titleCn && title && titleCn !== title);
  const visiblePsku = summary.partnerSku || summary.pskuCode || '-';
  const sourceTypeMeta = productSourceTypeMeta(summary.productSourceType);
  const titleContent = (
    <span
      style={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {displayTitle}
    </span>
  );
  const titleTooltip = showEnglishTitle ? (
    <Space direction="vertical" size={2}>
      <span>{displayTitle}</span>
      <span>{title}</span>
    </Space>
  ) : (
    displayTitle
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
      <ProductImageThumb
        src={imageUrl}
        alt={imageAlt || displayTitle}
        imageCount={imageCount}
        width={72}
        disabled={imageDisabled}
        onClick={
          onImageClick
            ? (event) => {
              event.stopPropagation();
              onImageClick();
            }
            : undefined
        }
      />
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <Space size={6} wrap style={{ minHeight: 18 }}>
          <Text style={{ display: 'block', color: '#6b7280', fontSize: 12, lineHeight: '18px' }}>
            {summary.brand || '-'}
          </Text>
          <Tooltip title={sourceTypeMeta.description}>
            <Tag color={sourceTypeMeta.color} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
              {sourceTypeMeta.label}
            </Tag>
          </Tooltip>
        </Space>
        <Tooltip title={titleTooltip}>
          {titleHref ? (
            <a
              href={titleHref}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                event.stopPropagation();
              }}
              style={{
                display: 'block',
                width: '100%',
                height: 20,
                maxWidth: 360,
                padding: 0,
                color: '#111827',
                fontWeight: 600,
                textAlign: 'left',
                lineHeight: '20px',
                textDecoration: 'none'
              }}
            >
              {titleContent}
            </a>
          ) : (
            <span
              style={{
                display: 'block',
                width: '100%',
                height: 20,
                maxWidth: 360,
                color: '#111827',
                fontWeight: 600,
                lineHeight: '20px'
              }}
            >
              {titleContent}
            </span>
          )}
        </Tooltip>
        {showEnglishTitle ? (
          <Tooltip title={title}>
            <Text
              style={{
                display: 'block',
                maxWidth: 360,
                color: '#6b7280',
                fontSize: 12,
                lineHeight: '18px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Text>
          </Tooltip>
        ) : null}
        <Space
          wrap
          size={[10, 2]}
          style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px', marginTop: 4 }}
          onClick={(event) => event.stopPropagation()}
        >
          <span>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>PSKU: </Text>
            <Text copyable={visiblePsku !== '-' ? { text: visiblePsku, tooltips: ['复制 PSKU', '已复制'] } : false} style={{ fontSize: 12 }}>
              {visiblePsku}
            </Text>
          </span>
          <span>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>SKU: </Text>
            <Text
              copyable={summary.skuParent ? { text: summary.skuParent, tooltips: ['复制 SKU', '已复制'] } : false}
              style={{ color: '#9ca3af', fontSize: 12 }}
            >
              {summary.skuParent || '-'}
            </Text>
          </span>
        </Space>
        {summary.barcode ? (
          <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: '18px' }}>
            Barcode: {summary.barcode}
          </div>
        ) : null}
        <ListingStartedLine summary={summary} />
        {actions ? (
          <div style={{ marginTop: 5 }} onClick={(event) => event.stopPropagation()}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ProductBaselineHeaderProps = {
  summary?: ProductSummarySurface | null;
  imageUrl?: string;
  imageCount?: number;
  onImageClick?: () => void;
  syncAlert?: ReactNode;
  metaActions?: ReactNode;
  actions?: ReactNode;
};

export function ProductBaselineHeader({
  summary,
  imageUrl,
  imageCount = 0,
  onImageClick,
  syncAlert,
  metaActions,
  actions
}: ProductBaselineHeaderProps) {
  const title = summary ? productSummaryTitle(summary) : '当前商品';
  const partnerSku = summary?.partnerSku || summary?.pskuCode || '-';
  const sourceTypeMeta = productSourceTypeMeta(summary?.productSourceType);

  return (
    <div className="pm-detail-section pm-detail-section--subtle">
      <Row gutter={[12, 12]} align="middle" wrap={false}>
        <Col flex="88px">
          <ProductImageThumb
            src={imageUrl || summary?.imageUrl}
            alt={title}
            imageCount={imageCount}
            width={80}
            fallback="暂无图片"
            disabled={!onImageClick}
            onClick={
              onImageClick
                ? (event) => {
                    event.stopPropagation();
                    onImageClick();
                  }
                : undefined
            }
          />
        </Col>

        <Col flex="auto" style={{ minWidth: 0 }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space size={12} wrap>
              <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>
                Partner SKU：
                <Text copyable={partnerSku !== '-' ? { text: partnerSku } : false}>{partnerSku}</Text>
              </Text>
              <Tooltip title={sourceTypeMeta.description}>
                <Tag color={sourceTypeMeta.color} style={{ marginInlineEnd: 0 }}>
                  {sourceTypeMeta.label}
                </Tag>
              </Tooltip>
              {summary ? <ListingStartedBadge summary={summary} /> : null}
              {metaActions}
            </Space>
            {syncAlert}
          </Space>
        </Col>

        {actions ? <Col flex="none">{actions}</Col> : null}
      </Row>
    </div>
  );
}
