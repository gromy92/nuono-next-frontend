import { Space, Tag, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { ProductSummarySurface } from '../product-domain/productSummaryTypes';
import { getProductCurrentZCode } from '../product-domain/productIdentity';
import { ProductImageThumb } from './ProductBaselineDisplay';
import { ProductListingStartedLine } from './ProductListingStarted';
import { productSourceTypeMeta, productSummaryTitle } from './productSummary';

const { Text } = Typography;

export type ProductBaselineListCellProps = {
  summary: ProductSummarySurface;
  imageUrl?: string;
  imageCount?: number;
  imageAlt?: string;
  imageDisabled?: boolean;
  titleHref?: string;
  onImageClick?: () => void;
  metaActions?: ReactNode;
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
  metaActions,
  actions
}: ProductBaselineListCellProps) {
  const title = productSummaryTitle(summary);
  const titleCn = summary.titleCn?.trim();
  const displayTitle = titleCn || title;
  const showEnglishTitle = Boolean(titleCn && title && titleCn !== title);
  const visiblePsku = summary.partnerSku || '-';
  const currentZCode = getProductCurrentZCode(summary);
  const sourceTypeMeta = productSourceTypeMeta(summary.productSourceType);
  const titleContent = (
    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {displayTitle}
    </span>
  );
  const titleTooltip = showEnglishTitle ? (
    <Space direction="vertical" size={2}><span>{displayTitle}</span><span>{title}</span></Space>
  ) : displayTitle;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
      <ProductImageThumb
        src={imageUrl}
        alt={imageAlt || displayTitle}
        imageCount={imageCount}
        width={72}
        disabled={imageDisabled}
        onClick={onImageClick ? (event) => { event.stopPropagation(); onImageClick(); } : undefined}
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
          {metaActions}
        </Space>
        <Tooltip title={titleTooltip}>
          {titleHref ? (
            <a
              href={titleHref}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
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
            <span style={{ display: 'block', width: '100%', height: 20, maxWidth: 360, color: '#111827', fontWeight: 600, lineHeight: '20px' }}>
              {titleContent}
            </span>
          )}
        </Tooltip>
        {showEnglishTitle ? (
          <Tooltip title={title}>
            <Text style={{ display: 'block', maxWidth: 360, color: '#6b7280', fontSize: 12, lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </Text>
          </Tooltip>
        ) : null}
        <Space wrap size={[10, 2]} style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px', marginTop: 4 }} onClick={(event) => event.stopPropagation()}>
          <span>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>PSKU: </Text>
            <Text copyable={visiblePsku !== '-' ? { text: visiblePsku, tooltips: ['复制 PSKU', '已复制'] } : false} style={{ fontSize: 12 }}>{visiblePsku}</Text>
          </span>
          <span>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>当前Z码: </Text>
            <Text copyable={currentZCode ? { text: currentZCode, tooltips: ['复制 Z 码', '已复制'] } : false} style={{ color: '#9ca3af', fontSize: 12 }}>{currentZCode || '-'}</Text>
          </span>
        </Space>
        {summary.barcode ? <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: '18px' }}>Barcode: {summary.barcode}</div> : null}
        <ProductListingStartedLine summary={summary} />
        {actions ? <div style={{ marginTop: 5 }} onClick={(event) => event.stopPropagation()}>{actions}</div> : null}
      </div>
    </div>
  );
}
