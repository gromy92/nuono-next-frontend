import { Button, Col, Descriptions, Input, Row, Space, Typography } from 'antd';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import { collectProductOfferPricingValidationIssues } from '../product-domain/productOfferPricing';
import {
  productOfferSaleWindowInputValues,
  resolveProductOfferPricingSummary
} from './productOfferPricingPresentation';
import {
  formatProductOfferValue,
  productOfferStoreCode,
  productOfferTextValue
} from './productOfferValues';
import './ProductOfferPricingSection.css';
const { Text } = Typography;
const FIELD_LABEL_STYLE = { color: 'var(--pm-text-muted)', display: 'block', marginBottom: 6 } as const;

export function ProductOfferPricingSection(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>; hidePricingSummary?: boolean; horizontalPricingLayout?: boolean;
  updateSiteOfferField: (storeCode: string, field: string, value: unknown) => void;
}) {
  const { productSnapshotView, activeProductSiteOffer, hidePricingSummary, horizontalPricingLayout, updateSiteOfferField } = props;
  const pricingSummary = resolveProductOfferPricingSummary(productSnapshotView, activeProductSiteOffer);
  const saleWindowInputs = productOfferSaleWindowInputValues(activeProductSiteOffer);
  const pricingValidationIssues = collectProductOfferPricingValidationIssues(activeProductSiteOffer, '当前站点');
  const priceValidationIssue = pricingValidationIssues.find((issue) => issue.fieldKey === 'price');
  const salePriceValidationIssue = pricingValidationIssues.find((issue) => issue.fieldKey === 'salePrice');
  const updateField = (field: string, value: unknown) => {
    if (!activeProductSiteOffer) {
      return;
    }
    updateSiteOfferField(productOfferStoreCode(activeProductSiteOffer), field, value);
  };
  return (
    <div className={horizontalPricingLayout ? 'product-offer-pricing-horizontal' : undefined}>
      <Text strong style={{ display: 'block', color: 'var(--pm-text-primary)', marginBottom: 12 }}>
        价格
      </Text>
      <Row gutter={[12, 12]}>
        <Col className="product-offer-pricing-field" xs={24} md={8}>
          <Text style={FIELD_LABEL_STYLE}>Base Price</Text>
          <Input
            value={productOfferTextValue(activeProductSiteOffer?.price)}
            status={priceValidationIssue ? 'error' : undefined}
            onChange={(event) => updateField('price', event.target.value)}
          />
          {priceValidationIssue ? (
            <Text type="danger" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              {priceValidationIssue.message}
            </Text>
          ) : null}
        </Col>
        <Col className="product-offer-pricing-field" xs={24} md={16}>
          <Text style={FIELD_LABEL_STYLE}>Price Min / Max</Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              aria-label="Price Min"
              placeholder="Min"
              style={{ width: 'calc((100% - 34px) / 2)' }}
              value={productOfferTextValue(activeProductSiteOffer?.priceMin)}
              onChange={(event) => updateField('priceMin', event.target.value)}
            />
            <Input disabled value="-" style={{ width: 34, textAlign: 'center', pointerEvents: 'none' }} />
            <Input
              aria-label="Price Max"
              placeholder="Max"
              style={{ width: 'calc((100% - 34px) / 2)' }}
              value={productOfferTextValue(activeProductSiteOffer?.priceMax)}
              onChange={(event) => updateField('priceMax', event.target.value)}
            />
          </Space.Compact>
        </Col>
      </Row>

      <div style={{ marginTop: 12 }}>
        <Row gutter={[12, 12]}>
          <Col className="product-offer-pricing-field" xs={24} md={8}>
            <Text style={FIELD_LABEL_STYLE}>Sale Price</Text>
            <Input
              aria-label="Sale Price"
              placeholder="Sale Price"
              value={productOfferTextValue(activeProductSiteOffer?.salePrice)}
              status={salePriceValidationIssue ? 'error' : undefined}
              onChange={(event) => updateField('salePrice', event.target.value)}
            />
            {salePriceValidationIssue ? (
              <Text type="danger" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                {salePriceValidationIssue.message}
              </Text>
            ) : null}
          </Col>
          <Col className="product-offer-pricing-field" xs={24} md={8}>
            <Text style={FIELD_LABEL_STYLE}>Sale Start</Text>
            <Input
              aria-label="Sale Start"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={saleWindowInputs.saleStart}
              onChange={(event) => updateField('saleStart', event.target.value)}
            />
          </Col>
          <Col className="product-offer-pricing-field" xs={24} md={8}>
            <Text style={FIELD_LABEL_STYLE}>Sale End</Text>
            <Input
              aria-label="Sale End"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={saleWindowInputs.saleEnd}
              onChange={(event) => updateField('saleEnd', event.target.value)}
            />
          </Col>
        </Row>
      </div>
      {hidePricingSummary ? null : (
        <Descriptions column={{ xs: 1, md: 4 }} size="small" colon={false} style={{ marginTop: 12 }}>
          <Descriptions.Item label="最终价格">
            <Text strong>{formatProductOfferValue(pricingSummary.finalPrice)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="价格来源">{pricingSummary.priceSource}</Descriptions.Item>
          <Descriptions.Item label="具体活动">
            {pricingSummary.promoUrl ? (
              <Button
                href={pricingSummary.promoUrl}
                target="_blank"
                rel="noreferrer"
                type="link"
                size="small"
                style={{ height: 'auto', padding: 0 }}
              >
                {pricingSummary.promoName || '查看活动'}
              </Button>
            ) : (
              formatProductOfferValue(pricingSummary.promoName)
            )}
          </Descriptions.Item>
        </Descriptions>
      )}
    </div>
  );
}
