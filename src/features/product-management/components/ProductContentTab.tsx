import { Space } from 'antd';
import { ProductAttributesPanel } from './ProductAttributesPanel';
import { ProductBasicContentPanel } from './ProductBasicContentPanel';
import { ProductClassificationEditor } from './ProductClassificationEditor';
import type { ProductDetailOfficialTabsProps } from './ProductDetailOfficialTabs.types';

export function ProductContentTab(props: ProductDetailOfficialTabsProps) {
  const {
    productContentDomain,
    productContentProgressDone,
    productContentProgressTotal,
    productAttributesDomain,
    productMainDomain,
    productSnapshotView,
    updateProductSectionField,
    updateProductMultilineField,
    updateProductAttributeField
  } = props;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProductClassificationEditor
        productMainDomain={productMainDomain}
        productSnapshotView={productSnapshotView}
        updateProductSectionField={updateProductSectionField}
      />

      <ProductBasicContentPanel
        productContentDomain={productContentDomain}
        productContentProgressDone={productContentProgressDone}
        productContentProgressTotal={productContentProgressTotal}
        productSnapshotView={productSnapshotView}
        updateProductSectionField={updateProductSectionField}
        updateProductMultilineField={updateProductMultilineField}
      />

      <ProductAttributesPanel
        productAttributesDomain={productAttributesDomain}
        productSnapshotView={productSnapshotView}
        updateProductAttributeField={updateProductAttributeField}
      />
    </Space>
  );
}
