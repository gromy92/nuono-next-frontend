import { ExportOutlined } from '@ant-design/icons';
import { Button, Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { ProductMasterSnapshotPayload, ProductSummarySurface } from '../types';
import {
  buildNoonCatalogProductUrl,
  buildNoonProductUrl,
  formatDateTimeParts,
  formatSnapshotValue,
  isProductNotListedSource,
  productListingStartedSourceLabel,
  productSourceTypeMeta
} from '../utils';

const { Text } = Typography;

type ProductDetailSummaryBarProps = {
  currentProductSummarySurface: ProductSummarySurface | null;
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>;
  productLeadImage?: string;
  openCurrentProductGallery: (index: number) => void;
  syncAlert?: ReactNode;
  actions?: ReactNode;
  showExternalLinks?: boolean;
};

export function ProductDetailSummaryBar({
  currentProductSummarySurface,
  productSnapshotView,
  activeProductSiteOffer,
  productLeadImage,
  openCurrentProductGallery,
  syncAlert,
  actions,
  showExternalLinks = true
}: ProductDetailSummaryBarProps) {
  const partnerSku = formatSnapshotValue(
    currentProductSummarySurface?.partnerSku ?? productSnapshotView?.identity.partnerSku
  );
  const sourceTypeMeta = productSourceTypeMeta(
    currentProductSummarySurface?.productSourceType ?? productSnapshotView?.identity.productSourceType
  );
  const listingStartedParts = formatDateTimeParts(currentProductSummarySurface?.listingStartedAt);
  const listingStartedSourceLabel = productListingStartedSourceLabel(currentProductSummarySurface?.listingStartedSource);
  const productNotListed = isProductNotListedSource(currentProductSummarySurface?.listingStartedSource);
  const productUrl =
    showExternalLinks && currentProductSummarySurface ? buildNoonProductUrl(currentProductSummarySurface) : undefined;
  const catalogUrl = showExternalLinks ? buildNoonCatalogProductUrl(productSnapshotView, activeProductSiteOffer) : undefined;

  return (
    <div className="pm-detail-section pm-detail-section--subtle">
      <Row gutter={[12, 12]} align="middle" wrap={false}>
        <Col flex="72px">
          <button
            type="button"
            disabled={!productLeadImage}
            style={{
              width: 64,
              height: 64,
              padding: 0,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid var(--pm-subtle-border)',
              background: 'var(--pm-section-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: productLeadImage ? 'pointer' : 'default'
            }}
            onClick={() => openCurrentProductGallery(0)}
          >
            {productLeadImage ? (
              <img
                src={productLeadImage}
                alt="商品首图"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Text style={{ color: 'var(--pm-text-faint)' }}>暂无图片</Text>
            )}
          </button>
        </Col>

        <Col flex="auto" style={{ minWidth: 0 }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space size={12} wrap>
              <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>
                Partner SKU：<Text copyable>{partnerSku}</Text>
              </Text>
              <Tooltip title={sourceTypeMeta.description}>
                <Tag color={sourceTypeMeta.color} style={{ marginInlineEnd: 0 }}>
                  {sourceTypeMeta.label}
                </Tag>
              </Tooltip>
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
              {productUrl ? (
                <Button size="small" href={productUrl} target="_blank" rel="noreferrer" icon={<ExportOutlined />}>
                  打开前台详情
                </Button>
              ) : null}
              {catalogUrl ? (
                <Button size="small" href={catalogUrl} target="_blank" rel="noreferrer" icon={<ExportOutlined />}>
                  打开后台详情
                </Button>
              ) : null}
            </Space>
            {syncAlert}
          </Space>
        </Col>

        {actions ? <Col flex="none">{actions}</Col> : null}
      </Row>
    </div>
  );
}
