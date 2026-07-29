import { ProductDetailOfficialTabs } from '../../product-editor/ProductDetailOfficialTabs';
import { ProductOfferStockSection } from './ProductOfferStockSection';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductDetailOfficialTabsPanelProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductDetailOfficialTabsPanel({ workspace }: ProductDetailOfficialTabsPanelProps) {
  const {
    productSiteDomain,
    productSharedDomainDirtyCount,
    currentProductSummarySurface,
    productSnapshotView,
    activeProductSiteOffer,
    productWarehouseStockRows,
    productContentDomain,
    productContentProgressDone,
    productContentProgressTotal,
    productMainDomain,
    productImageUrls,
    productAttributesDomain,
    productGroupingDomain,
    productInsightMetrics,
    productLeadImage,
    updateSiteOfferField,
    updateProductSectionField,
    updateProductMultilineField,
    openCurrentProductGallery,
    updateProductVariant,
    removeProductVariant,
    updateProductAttributeField
  } = workspace;

  return (
    <ProductDetailOfficialTabs
      productSiteDomain={productSiteDomain}
      productSharedDomainDirtyCount={productSharedDomainDirtyCount}
      currentProductSummarySurface={currentProductSummarySurface}
      productSnapshotView={productSnapshotView}
      activeProductSiteOffer={activeProductSiteOffer}
      offerStockSection={
        <ProductOfferStockSection
          productSnapshotView={productSnapshotView}
          activeProductSiteOffer={activeProductSiteOffer}
          productWarehouseStockRows={productWarehouseStockRows}
        />
      }
      productContentDomain={productContentDomain}
      productContentProgressDone={productContentProgressDone}
      productContentProgressTotal={productContentProgressTotal}
      productMainDomain={productMainDomain}
      productImageUrls={productImageUrls}
      productAttributesDomain={productAttributesDomain}
      productGroupingDomain={productGroupingDomain}
      productInsightMetrics={productInsightMetrics}
      productLeadImage={productLeadImage}
      updateSiteOfferField={updateSiteOfferField}
      updateProductSectionField={updateProductSectionField}
      updateProductMultilineField={updateProductMultilineField}
      openCurrentProductGallery={openCurrentProductGallery}
      updateProductVariant={updateProductVariant}
      removeProductVariant={removeProductVariant}
      updateProductAttributeField={updateProductAttributeField}
    />
  );
}
