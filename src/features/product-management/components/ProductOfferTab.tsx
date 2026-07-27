import { Divider, Space } from 'antd';
import { ProductDetailSection } from './ProductDetailSection';
import type { ProductDetailOfficialTabsProps } from './ProductDetailOfficialTabs.types';
import { ProductOfferMetaSection } from './ProductOfferMetaSection';
import { ProductOfferPricingSection } from './ProductOfferPricingSection';
import { ProductOfferStockSection } from './ProductOfferStockSection';
import { ProductOfferVisibilitySection } from './ProductOfferVisibilitySection';

export function ProductOfferTab(props: ProductDetailOfficialTabsProps) {
  const {
    productSnapshotView,
    activeProductSiteOffer,
    currentProductSummarySurface,
    productWarehouseStockRows,
    offerHeaderExtra,
    offerPresentation,
    hideOfferStockSection,
    barcodeValidationIssue,
    onBarcodeDraftChange,
    updateSiteOfferField,
    updateProductSectionField,
    updateProductAttributeField,
  } = props;
  const compactListingOffer = offerPresentation === 'listing-create';
  const showVisibilitySection = !compactListingOffer;
  const visibilitySection = (
    <ProductOfferVisibilitySection
      activeProductSiteOffer={activeProductSiteOffer}
      currentProductSummarySurface={currentProductSummarySurface}
      productSnapshotView={productSnapshotView}
      hideLiveStatusText={compactListingOffer}
      updateSiteOfferField={updateSiteOfferField}
    />
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProductDetailSection>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {offerHeaderExtra && compactListingOffer ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 32px' }}>
              <div style={{ flex: '0 1 620px', minWidth: 'min(100%, 320px)' }}>{offerHeaderExtra}</div>
            </div>
          ) : (
            <>
              {offerHeaderExtra ? (
                <>
                  {offerHeaderExtra}
                  <Divider style={{ margin: 0 }} />
                </>
              ) : null}
              {showVisibilitySection ? visibilitySection : null}
            </>
          )}
          <Divider style={{ margin: 0 }} />
          <ProductOfferPricingSection
            productSnapshotView={productSnapshotView}
            activeProductSiteOffer={activeProductSiteOffer}
            hidePricingSummary={compactListingOffer}
            horizontalPricingLayout={compactListingOffer}
            updateSiteOfferField={updateSiteOfferField}
          />
          {!hideOfferStockSection ? (
            <>
              <Divider style={{ margin: 0 }} />
              <ProductOfferStockSection
                productSnapshotView={productSnapshotView}
                activeProductSiteOffer={activeProductSiteOffer}
                productWarehouseStockRows={productWarehouseStockRows}
              />
            </>
          ) : null}
          <Divider style={{ margin: 0 }} />
          <ProductOfferMetaSection
            productSnapshotView={productSnapshotView}
            currentProductSummarySurface={currentProductSummarySurface}
            activeProductSiteOffer={activeProductSiteOffer}
            barcodeValidationIssue={barcodeValidationIssue}
            hideHelperText={compactListingOffer}
            horizontalBarcodeLayout={compactListingOffer}
            onBarcodeDraftChange={onBarcodeDraftChange}
            updateSiteOfferField={updateSiteOfferField}
            updateProductSectionField={updateProductSectionField}
            updateProductAttributeField={updateProductAttributeField}
          />
        </Space>
      </ProductDetailSection>
    </Space>
  );
}
