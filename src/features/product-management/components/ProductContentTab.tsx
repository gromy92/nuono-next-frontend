import { Space } from 'antd';
import { ProductAttributesPanel } from './ProductAttributesPanel';
import { ProductBasicContentPanel } from './ProductBasicContentPanel';
import { ProductClassificationEditor } from './ProductClassificationEditor';
import type { ProductDetailOfficialTabsProps } from './ProductDetailOfficialTabs.types';
import { ProductImagesPanel } from './ProductImagesPanel';

export function ProductContentTab(props: ProductDetailOfficialTabsProps) {
  const {
    productContentDomain,
    productContentProgressDone,
    productContentProgressTotal,
    productCompetitorMaterials,
    enableCompetitorContentMerge,
    productImageUrls,
    allowEmptyImages,
    productAttributesDomain,
    productMainDomain,
    productImageRoleAssignments,
    productImageAssetMetadata,
    productSnapshotView,
    updateProductSectionField,
    updateProductMultilineField,
    updateProductAttributeField,
    openCurrentProductGallery
  } = props;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProductClassificationEditor
        productMainDomain={productMainDomain}
        productSnapshotView={productSnapshotView}
        productCompetitorMaterials={productCompetitorMaterials}
        updateProductSectionField={updateProductSectionField}
      />

      <ProductBasicContentPanel
        productContentDomain={productContentDomain}
        productContentProgressDone={productContentProgressDone}
        productContentProgressTotal={productContentProgressTotal}
        productCompetitorMaterials={productCompetitorMaterials}
        enableCompetitorContentMerge={enableCompetitorContentMerge}
        productSnapshotView={productSnapshotView}
        updateProductSectionField={updateProductSectionField}
        updateProductMultilineField={updateProductMultilineField}
      />

      <ProductImagesPanel
        productContentDomain={productContentDomain}
        productSnapshotView={productSnapshotView}
        productImageUrls={productImageUrls}
        productImageRoleAssignments={productImageRoleAssignments}
        productImageAssetMetadata={productImageAssetMetadata}
        allowEmptyImages={allowEmptyImages}
        openCurrentProductGallery={openCurrentProductGallery}
        onImagesChange={(images, imageRoleAssignments, imageAssetMetadata) => {
          updateProductSectionField('content', 'images', images);
          if (imageRoleAssignments) {
            updateProductSectionField('content', 'imageRoleAssignments', imageRoleAssignments);
          }
          if (imageAssetMetadata) {
            updateProductSectionField('content', 'imageAssetMetadata', imageAssetMetadata);
          }
        }}
      />

      <ProductAttributesPanel
        productAttributesDomain={productAttributesDomain}
        productSnapshotView={productSnapshotView}
        updateProductAttributeField={updateProductAttributeField}
      />
    </Space>
  );
}
