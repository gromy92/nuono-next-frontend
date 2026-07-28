import { Space, Table } from 'antd';
import { createProductSizeColumns } from './productSizeColumns';
import { ProductDetailSection } from './ProductDetailSection';
import type { ProductSizesEditorProps } from './productDetailEditorTypes';

export function ProductSizesTab(props: ProductSizesEditorProps) {
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
    </Space>
  );
}
