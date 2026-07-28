import { Divider, Space } from 'antd';
import { ProductDetailSection } from './ProductDetailSection';
import type { ProductOfferEditorProps } from './productDetailEditorTypes';
import { ProductOfferMetaSection } from './ProductOfferMetaSection';
import { ProductOfferPricingSection } from './ProductOfferPricingSection';
import { ProductOfferVisibilitySection } from './ProductOfferVisibilitySection';

export function ProductOfferTab(props: ProductOfferEditorProps) {
  const {
    productSnapshotView,
    activeProductSiteOffer,
    currentProductSummarySurface,
    offerHeaderExtra,
    offerStockSection,
    offerPresentation,
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
          {offerStockSection ? (
            <>
              <Divider style={{ margin: 0 }} />
              {offerStockSection}
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
