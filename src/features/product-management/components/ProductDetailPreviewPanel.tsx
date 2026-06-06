import { Alert, Col, Descriptions, Row, Space, Spin, Tag, Typography } from 'antd';
import type { ProductSummarySurface } from '../types';
import {
  isProductNotListedSource,
  productListingStartedSourceLabel,
  formatSnapshotValue,
  productSummaryIdentityLine,
  productSummaryPriceLine,
  productSummaryTitle
} from '../utils';
import { ProductImageThumb } from './ProductBaselineDisplay';
import { ProductSummaryPrimaryTags } from './ProductSummaryBlocks';

const { Paragraph, Text, Title } = Typography;

type ProductDetailPreviewPanelProps = {
  message?: string;
  summary: ProductSummarySurface;
  status?: 'loading' | 'error';
};

export function ProductDetailPreviewPanel({ message, summary, status = 'loading' }: ProductDetailPreviewPanelProps) {
  const loading = status === 'loading';
  const listingStartedSourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  const productNotListed = isProductNotListedSource(summary.listingStartedSource);
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type={loading ? 'info' : 'warning'}
        showIcon
        icon={loading ? <Spin size="small" /> : undefined}
        message={message || (loading ? '正在载入完整商品字段...' : '完整商品字段暂时不可用')}
        description={
          loading
            ? '已先使用列表数据打开详情框架，完整 Offer / Content / Sizes 数据会自动补齐。'
            : '当前保留列表预览。请先同步商品列表，或在详情操作中手动从 Noon 同步当前内容。'
        }
      />

      <div style={{ border: '1px solid #dbe4ea', borderRadius: 8, background: '#f8fafc', padding: 20 }}>
        <Row gutter={[20, 20]} align="top">
          <Col xs={24} xl={18}>
            <Space align="start" size={16} style={{ width: '100%' }}>
              <span style={{ flex: '0 0 auto' }}>
                <ProductImageThumb
                  src={summary.imageUrl || summary.galleryImages[0]}
                  alt={productSummaryTitle(summary)}
                  imageCount={summary.galleryImages.length}
                  width={112}
                  height={112}
                  fallback="暂无图片"
                />
              </span>

              <Space direction="vertical" size={10} style={{ flex: 1, minWidth: 260 }}>
                <ProductSummaryPrimaryTags summary={summary} includeSite />

                <div>
                  <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                    {productSummaryTitle(summary)}
                  </Title>
                  <Paragraph style={{ margin: '6px 0 0', color: '#64748b' }}>
                    {productSummaryIdentityLine(summary)}
                  </Paragraph>
                </div>

                <Descriptions column={{ xs: 1, sm: 2, xl: 3 }} size="small" colon={false}>
                  <Descriptions.Item label="SKU Parent">{formatSnapshotValue(summary.skuParent)}</Descriptions.Item>
                  <Descriptions.Item label="PSKU">{formatSnapshotValue(summary.partnerSku)}</Descriptions.Item>
                  <Descriptions.Item label="PSKU Code">{formatSnapshotValue(summary.pskuCode)}</Descriptions.Item>
                  <Descriptions.Item label="品牌">{formatSnapshotValue(summary.brand)}</Descriptions.Item>
                  <Descriptions.Item label="类目">{formatSnapshotValue(summary.productFulltype)}</Descriptions.Item>
                  <Descriptions.Item label="参考价">{productSummaryPriceLine(summary)}</Descriptions.Item>
                  <Descriptions.Item label="经营站点">{summary.siteOfferCount ?? summary.siteLabels.length}</Descriptions.Item>
                  <Descriptions.Item label="变体/尺码">{summary.variantCount ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="上架时间">
                    {productNotListed
                      ? '未上架'
                      : summary.listingStartedAt
                        ? `${formatSnapshotValue(summary.listingStartedAt)}${listingStartedSourceLabel ? ` · ${listingStartedSourceLabel}` : ''}`
                        : listingStartedSourceLabel || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最近同步">{formatSnapshotValue(summary.lastSyncedAt)}</Descriptions.Item>
                </Descriptions>
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={6}>
            <div style={{ height: '100%', padding: 16, borderRadius: 8, border: '1px solid #dbe4ea', background: '#ffffff' }}>
              <Text strong style={{ display: 'block', marginBottom: 12, color: '#0f172a' }}>
                库存快照
              </Text>
              <Space wrap size={[8, 8]}>
                <Tag color="success" style={{ marginInlineEnd: 0 }}>
                  FBN {summary.totalFbnStock ?? 0}
                </Tag>
                <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                  Supermall {summary.totalSupermallStock ?? 0}
                </Tag>
                <Tag color="default" style={{ marginInlineEnd: 0 }}>
                  FBP {summary.totalFbpStock ?? 0}
                </Tag>
              </Space>
            </div>
          </Col>
        </Row>
      </div>
    </Space>
  );
}
