import { Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import type { ProductSummarySurface } from '../types';
import {
  formatDateTimeParts,
  isProductNotListedSource,
  productListingStartedSourceLabel,
  productSourceTypeMeta,
  productSummaryTitle
} from '../utils';

const { Text } = Typography;

type ProductImageThumbProps = {
  src?: string;
  alt: string;
  imageCount?: number;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  fit?: CSSProperties['objectFit'];
  fallback?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export function ProductImageThumb({
  src,
  alt,
  imageCount = 0,
  width = 84,
  height = 84,
  fit = 'contain',
  fallback = '无图',
  onClick,
  disabled
}: ProductImageThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const visibleSrc = src && failedSrc !== src ? src : undefined;
  const clickable = Boolean(onClick && visibleSrc && !disabled);
  const content = visibleSrc ? (
    <span style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}>
      <img
        src={visibleSrc}
        alt={alt}
        onError={() => setFailedSrc(visibleSrc)}
        style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
      />
      {imageCount > 1 ? (
        <span
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            padding: '1px 5px',
            borderRadius: 4,
            color: '#ffffff',
            background: 'rgba(15, 23, 42, 0.72)',
            fontSize: 11,
            lineHeight: '16px'
          }}
        >
          {imageCount}
        </span>
      ) : null}
    </span>
  ) : (
    <span
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: 11,
        background: '#f8fafc'
      }}
    >
      {fallback}
    </span>
  );

  if (!onClick) {
    return (
      <span
        style={{
          display: 'inline-flex',
          width,
          height,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          background: '#ffffff'
        }}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      style={{
        width,
        height,
        padding: 0,
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default'
      }}
    >
      {content}
    </button>
  );
}

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
      {title}
    </span>
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
      <ProductImageThumb
        src={imageUrl}
        alt={imageAlt || title}
        imageCount={imageCount}
        disabled={imageDisabled}
        onClick={(event) => {
          event.stopPropagation();
          onImageClick?.();
        }}
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
        <Tooltip title={title}>
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
        <Col flex="72px">
          <ProductImageThumb
            src={imageUrl || summary?.imageUrl}
            alt={title}
            imageCount={imageCount}
            width={64}
            height={64}
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
