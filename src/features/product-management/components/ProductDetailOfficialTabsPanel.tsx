import { ProductDetailOfficialTabs } from './ProductDetailOfficialTabs';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductDetailOfficialTabsPanelProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductDetailOfficialTabsPanel({ workspace }: ProductDetailOfficialTabsPanelProps) {
  const {
    productSiteDomain,
    productSharedDomainDirtyCount,
    productActionSubmitting,
    currentProductSummarySurface,
    productSnapshotView,
    activeProductSiteOffer,
    activeSiteDirty,
    activeSiteOfferCode,
    productWarehouseStockRows,
    siteOfferColumns,
    productPlatformSignals,
    productPlatformRejectionReasons,
    productPlatformAffectingAttributes,
    productContentDomain,
    productContentProgressDone,
    productContentProgressTotal,
    productMainDomain,
    productImageUrls,
    productAttributesDomain,
    productRequiredAttributeCount,
    productFilledRequiredAttributeCount,
    productGroupingDomain,
    productGroupMembers,
    productCandidateGroups,
    productListSourceItems,
    productInsightMetrics,
    productLeadImage,
    previewProductAction,
    updateSiteOfferField,
    setActiveSiteOfferCode,
    updateProductSectionField,
    updateProductMultilineField,
    openCurrentProductGallery,
    addProductVariant,
    updateProductVariant,
    removeProductVariant,
    updateProductAxes,
    updateProductAttributeField
  } = workspace;

  return (
    <ProductDetailOfficialTabs
      productSiteDomain={productSiteDomain}
      productSharedDomainDirtyCount={productSharedDomainDirtyCount}
      productActionSubmitting={productActionSubmitting}
      currentProductSummarySurface={currentProductSummarySurface}
      productSnapshotView={productSnapshotView}
      activeProductSiteOffer={activeProductSiteOffer}
      activeSiteDirty={activeSiteDirty}
      activeSiteOfferCode={activeSiteOfferCode}
      productWarehouseStockRows={productWarehouseStockRows}
      siteOfferColumns={siteOfferColumns}
      productPlatformSignals={productPlatformSignals}
      productPlatformRejectionReasons={productPlatformRejectionReasons}
      productPlatformAffectingAttributes={productPlatformAffectingAttributes}
      productContentDomain={productContentDomain}
      productContentProgressDone={productContentProgressDone}
      productContentProgressTotal={productContentProgressTotal}
      productMainDomain={productMainDomain}
      productImageUrls={productImageUrls}
      productAttributesDomain={productAttributesDomain}
      productRequiredAttributeCount={productRequiredAttributeCount}
      productFilledRequiredAttributeCount={productFilledRequiredAttributeCount}
      productGroupingDomain={productGroupingDomain}
      productGroupMembers={productGroupMembers}
      productCandidateGroups={productCandidateGroups}
      productListSourceItems={productListSourceItems}
      productInsightMetrics={productInsightMetrics}
      productLeadImage={productLeadImage}
      previewProductAction={previewProductAction}
      updateSiteOfferField={updateSiteOfferField}
      setActiveSiteOfferCode={setActiveSiteOfferCode}
      updateProductSectionField={updateProductSectionField}
      updateProductMultilineField={updateProductMultilineField}
      openCurrentProductGallery={openCurrentProductGallery}
      addProductVariant={addProductVariant}
      updateProductVariant={updateProductVariant}
      removeProductVariant={removeProductVariant}
      updateProductAxes={updateProductAxes}
      updateProductAttributeField={updateProductAttributeField}
    />
  );
}
