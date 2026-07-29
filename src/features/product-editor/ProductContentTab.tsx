import { Space } from 'antd';
import { ProductAttributesPanel } from './ProductAttributesPanel';
import { ProductBasicContentPanel } from './ProductBasicContentPanel';
import { ProductClassificationEditor } from './ProductClassificationEditor';
import type { ProductContentEditorProps } from './productDetailEditorTypes';
import { ProductImagesPanel } from './ProductImagesPanel';

export function ProductContentTab(props: ProductContentEditorProps) {
  const {
    productContentDomain,
    productContentProgressDone,
    productContentProgressTotal,
    contentHeaderExtra,
    offerPresentation,
    productCompetitorMaterials,
    productListingKeywordSuggestions,
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
  const listingCreatePresentation = offerPresentation === 'listing-create';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contentHeaderExtra}
      <ProductClassificationEditor
        productMainDomain={productMainDomain}
        productSnapshotView={productSnapshotView}
        productCompetitorMaterials={productCompetitorMaterials}
        horizontalLayout={offerPresentation === 'listing-create'}
        updateProductSectionField={updateProductSectionField}
      />

      <ProductBasicContentPanel
        productContentDomain={listingCreatePresentation ? undefined : productContentDomain}
        productContentProgressDone={productContentProgressDone}
        productContentProgressTotal={productContentProgressTotal}
        productCompetitorMaterials={productCompetitorMaterials}
        productListingKeywordSuggestions={productListingKeywordSuggestions}
        enableCompetitorContentMerge={enableCompetitorContentMerge}
        productSnapshotView={productSnapshotView}
        updateProductSectionField={updateProductSectionField}
        updateProductMultilineField={updateProductMultilineField}
      />

      <ProductImagesPanel
        productContentDomain={listingCreatePresentation ? undefined : productContentDomain}
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
        productAttributesDomain={listingCreatePresentation ? undefined : productAttributesDomain}
        productSnapshotView={productSnapshotView}
        updateProductAttributeField={updateProductAttributeField}
      />
    </Space>
  );
}
