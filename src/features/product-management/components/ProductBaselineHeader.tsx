import { Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { ProductSummarySurface } from '../types';
import {
  ProductImageThumb,
  ProductListingStartedBadge,
  productSourceTypeMeta,
  productSummaryTitle
} from '../../product-baseline';

const { Text } = Typography;

export type ProductBaselineHeaderProps = {
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
  const partnerSku = summary?.partnerSku || '-';
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
            onClick={onImageClick ? (event) => { event.stopPropagation(); onImageClick(); } : undefined}
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
                <Tag color={sourceTypeMeta.color} style={{ marginInlineEnd: 0 }}>{sourceTypeMeta.label}</Tag>
              </Tooltip>
              {summary ? <ProductListingStartedBadge summary={summary} /> : null}
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
