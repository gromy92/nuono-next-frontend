import { Space, Table } from 'antd';
import { createProductSizeColumns } from '../productDetailColumns';
import { ProductDetailSection } from './ProductDetailSection';
import type { ProductDetailOfficialTabsProps } from './ProductDetailOfficialTabs.types';
import { ProductVariantSpecTable } from './ProductVariantSpecTable';

export function ProductSizesTab(props: ProductDetailOfficialTabsProps) {
  const {
    productSnapshotView,
    productGroupingDomain,
    updateProductVariant,
    removeProductVariant
  } = props;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProductDetailSection title="Sizes" domain={productGroupingDomain}>
        <Table
          size="small"
          pagination={false}
          rowKey={(record) => String(record.childSku ?? record.partnerSku ?? record.sizeEn ?? record.sizeAr ?? 'size-row')}
          dataSource={productSnapshotView?.variants ?? []}
          scroll={{ x: 900 }}
          columns={createProductSizeColumns({
            productSnapshotView,
            updateProductVariant,
            removeProductVariant
          })}
        />
      </ProductDetailSection>
      <ProductDetailSection title="规格 / 箱规">
        <ProductVariantSpecTable productSnapshotView={productSnapshotView} />
      </ProductDetailSection>
    </Space>
  );
}
