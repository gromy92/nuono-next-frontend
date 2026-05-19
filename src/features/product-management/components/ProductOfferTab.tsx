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
    updateSiteOfferField,
    updateProductSectionField,
    updateProductAttributeField,
  } = props;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProductDetailSection>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <ProductOfferVisibilitySection
            activeProductSiteOffer={activeProductSiteOffer}
            currentProductSummarySurface={currentProductSummarySurface}
            productSnapshotView={productSnapshotView}
            updateSiteOfferField={updateSiteOfferField}
          />
          <Divider style={{ margin: 0 }} />
          <ProductOfferPricingSection
            productSnapshotView={productSnapshotView}
            activeProductSiteOffer={activeProductSiteOffer}
            updateSiteOfferField={updateSiteOfferField}
          />
          <Divider style={{ margin: 0 }} />
          <ProductOfferStockSection
            productSnapshotView={productSnapshotView}
            activeProductSiteOffer={activeProductSiteOffer}
            productWarehouseStockRows={productWarehouseStockRows}
          />
          <Divider style={{ margin: 0 }} />
          <ProductOfferMetaSection
            productSnapshotView={productSnapshotView}
            currentProductSummarySurface={currentProductSummarySurface}
            activeProductSiteOffer={activeProductSiteOffer}
            updateSiteOfferField={updateSiteOfferField}
            updateProductSectionField={updateProductSectionField}
            updateProductAttributeField={updateProductAttributeField}
          />
        </Space>
      </ProductDetailSection>
    </Space>
  );
}
