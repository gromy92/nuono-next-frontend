import { Col, Empty, Row, Select, Space, Tag, Typography } from 'antd';
import { formatSnapshotValue, productSummaryTitle } from '../utils';
import type { ProductDetailOfficialTabsProps } from './ProductDetailOfficialTabs.types';
import { ProductBaselineIdentity } from '../../product-baseline';

const { Text } = Typography;

function hasMetricValue(value: string | number) {
  const normalized = String(value ?? '').trim();
  return Boolean(normalized && normalized !== '-' && normalized.toLowerCase() !== 'n/a');
}

export function ProductInsightsTab(props: ProductDetailOfficialTabsProps) {
  const {
    currentProductSummarySurface,
    productSnapshotView,
    productInsightMetrics,
    productLeadImage
  } = props;
  const visibleMetrics = productInsightMetrics.filter((item) => hasMetricValue(item.value));
  const imageUrl =
    productLeadImage || currentProductSummarySurface?.imageUrl || currentProductSummarySurface?.galleryImages[0];
  const imageAlt = currentProductSummarySurface ? productSummaryTitle(currentProductSummarySurface) : '当前商品';
  const visiblePartnerSku = formatSnapshotValue(currentProductSummarySurface?.partnerSku ?? productSnapshotView?.identity.partnerSku);
  const visibleSku = formatSnapshotValue(productSnapshotView?.identity.childSku ?? productSnapshotView?.identity.skuParent);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap size={[8, 8]}>
          <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
            Performance
          </Text>
          <Tag color="default" style={{ marginInlineEnd: 0 }}>
            1 Product
          </Tag>
        </Space>
        <Select
          value="noon"
          style={{ width: 220 }}
          options={[{ label: 'noon', value: 'noon' }]}
        />
      </Space>

      <div
        style={{
          padding: 16,
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          background: '#ffffff'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <ProductBaselineIdentity
              title={visiblePartnerSku}
              imageUrl={imageUrl}
              imageCount={currentProductSummarySurface?.galleryImages.length}
              imageAlt={imageAlt}
              imageWidth={80}
              titleMaxWidth={260}
              codes={[
                {
                  label: 'SKU',
                  value: visibleSku,
                  copyText: visibleSku !== '-' ? visibleSku : undefined
                }
              ]}
            />
          </Col>
          {visibleMetrics.length ? (
            visibleMetrics.map((item) => (
              <Col xs={24} sm={8} md={4} key={item.label}>
                <div
                  style={{
                    padding: 14,
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: '#fafafa',
                    minHeight: 86
                  }}
                >
                  <Text style={{ display: 'block', color: '#64748b', marginBottom: 8 }}>
                    {item.label}
                  </Text>
                  <Text strong style={{ color: '#0f172a', fontSize: 22 }}>
                    {item.value}
                  </Text>
                </div>
              </Col>
            ))
          ) : (
            <Col xs={24} md={14}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无官方经营数据" />
            </Col>
          )}
        </Row>
      </div>
    </Space>
  );
}
