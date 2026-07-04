import { Card, Col, Space } from 'antd';
import { ProductKeywordPanel } from '../../product-keywords/ProductKeywordPanel';
import { ProductDetailSnapshotBody } from './ProductDetailSnapshotBody';
import { siteOfferCode } from '../utils/common';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductDetailWorkbenchViewProps = {
  workspace: ProductManagementWorkspace;
  isProductDetailTab: boolean;
};

export function ProductDetailWorkbenchView({ workspace, isProductDetailTab }: ProductDetailWorkbenchViewProps) {
  const {
    activeProductSiteOffer,
    currentProductSummarySurface,
    productDetailSummarySurface,
    productWorkbenchContext,
    productWorkbenchRef
  } = workspace;
  const productSummary = currentProductSummarySurface ?? productDetailSummarySurface;
  const currentStoreCode =
    (activeProductSiteOffer ? siteOfferCode(activeProductSiteOffer) : '') ||
    productSummary?.storeCode ||
    productWorkbenchContext?.storeCode;
  const currentSiteCode = siteCodeFromStoreCode(currentStoreCode);
  const currentPartnerSku = productSummary?.partnerSku || productWorkbenchContext?.partnerSku;

  return (
    <Col span={24}>
      <div ref={productWorkbenchRef}>
        <Card
          variant="borderless"
          style={{ marginBottom: 16, border: '1px solid #dbe4ea' }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <ProductKeywordPanel
              storeCode={currentStoreCode}
              siteCode={currentSiteCode}
              partnerSku={currentPartnerSku}
            />
            <ProductDetailSnapshotBody workspace={workspace} isProductDetailTab={isProductDetailTab} />
          </Space>
        </Card>
      </div>
    </Col>
  );
}

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase();
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA';
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE';
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) return 'EG';
  return '';
}
