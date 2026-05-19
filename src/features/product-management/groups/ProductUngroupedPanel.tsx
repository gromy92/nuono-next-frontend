import { Empty, Space, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import { formatSnapshotValue, normalizeNoonImageUrl } from '../utils';
import { ProductGroupMemberList, type ProductGroupMemberListItem } from './ProductGroupMemberList';

const { Text } = Typography;

type ProductUngroupedPanelProps = {
  products: ProductListRowPayload[];
  onOpenDetail?: (product: ProductGroupMemberListItem) => void;
};

function productLeadImage(item: ProductListRowPayload) {
  return normalizeNoonImageUrl(item.imageUrl || item.galleryImages?.[0]);
}

function toUngroupedListItem(item: ProductListRowPayload): ProductGroupMemberListItem {
  return {
    key: item.skuParent,
    skuParent: item.skuParent,
    childSku: item.offerCode || item.skuParent,
    partnerSku: item.partnerSku,
    title: item.title,
    brand: item.brand,
    imageUrl: productLeadImage(item),
    liveStatus: item.liveStatus,
    statusCode: item.statusCode,
    isActive: item.isActive,
    liveStatuses: item.liveStatuses,
    siteLabels: item.siteLabels,
    totalFbnStock: item.totalFbnStock,
    totalFbpStock: item.totalFbpStock
  };
}

function UngroupedSummaryPane({ products }: ProductUngroupedPanelProps) {
  return (
    <div
      style={{
        border: '1px solid var(--pm-subtle-border)',
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--pm-subtle-border)' }}>
        <Space direction="vertical" size={4}>
          <Text strong>未分组商品</Text>
          <Text type="secondary">{products.length} 个</Text>
        </Space>
      </div>
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 38px))', gap: 6 }}>
        {products.map((item) => {
          const imageUrl = productLeadImage(item);
          return (
            <div
              key={item.skuParent}
              title={item.title || item.skuParent}
              style={{
                width: 38,
                height: 38,
                borderRadius: 6,
                border: '1px solid var(--pm-subtle-border)',
                overflow: 'hidden',
                background: 'var(--pm-subtle-bg)'
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.title || item.skuParent}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Text
                  style={{
                    display: 'block',
                    lineHeight: '36px',
                    textAlign: 'center',
                    color: 'var(--pm-text-faint)',
                    fontSize: 10
                  }}
                >
                  无图
                </Text>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UngroupedDetailPane({ products, onOpenDetail }: ProductUngroupedPanelProps) {
  return (
    <div
      style={{
        minWidth: 0,
        border: '1px solid var(--pm-subtle-border)',
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--pm-subtle-border)' }}>
        <Space direction="vertical" size={4}>
          <Text strong style={{ fontSize: 18 }}>
            未分组商品
          </Text>
          <Text type="secondary">当前筛选下 {products.length} 个商品未关联 Group</Text>
        </Space>
      </div>
      {products.length ? (
        <div style={{ padding: 12 }}>
          <ProductGroupMemberList members={products.map(toUngroupedListItem)} onOpenDetail={onOpenDetail} compact />
        </div>
      ) : (
        <div style={{ padding: 48 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有未分组商品" />
        </div>
      )}
    </div>
  );
}

export function ProductUngroupedPanel(props: ProductUngroupedPanelProps) {
  return (
    <>
      <UngroupedSummaryPane products={props.products} />
      <UngroupedDetailPane products={props.products} onOpenDetail={props.onOpenDetail} />
    </>
  );
}
