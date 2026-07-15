import { Button, Col, Descriptions, Input, Row, Space, Typography } from 'antd';
import type { ProductMasterSnapshotPayload } from '../types';
import { formatSnapshotValue, siteOfferCode, textInputValue } from '../utils';
import { collectOfferPricingValidationIssues } from '../utils/offerPricingValidation';

const { Text } = Typography;

const FIELD_LABEL_STYLE = { color: 'var(--pm-text-muted)', display: 'block', marginBottom: 6 } as const;
const PRODUCT_MANAGEMENT_TIME_ZONE = 'Asia/Shanghai';
const DEFAULT_SALE_WINDOW_YEARS = 10;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateParts(parts: DateParts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addYears(parts: DateParts, years: number) {
  const targetYear = parts.year + years;
  const targetDay = Math.min(parts.day, daysInMonth(targetYear, parts.month));
  return {
    year: targetYear,
    month: parts.month,
    day: targetDay
  };
}

function currentShanghaiDateParts() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PRODUCT_MANAGEMENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const valueFor = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: valueFor('year'),
    month: valueFor('month'),
    day: valueFor('day')
  };
}

function defaultSaleWindowForDisplay() {
  const startParts = currentShanghaiDateParts();
  const endParts = addYears(startParts, DEFAULT_SALE_WINDOW_YEARS);
  return {
    saleStart: `${formatDateParts(startParts)} 00:00:00`,
    saleEnd: `${formatDateParts(endParts)} 23:59:59`
  };
}

function formatOfferDateTimeInput(value: unknown) {
  const rawValue = textInputValue(value).trim();
  if (!rawValue) {
    return '';
  }

  const isoMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)/);
  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2].length === 5 ? `${isoMatch[2]}:00` : isoMatch[2]}`;
  }

  return rawValue;
}

function firstTextValue(...values: unknown[]) {
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function firstExternalUrl(...values: unknown[]) {
  const url = firstTextValue(...values);
  return /^https?:\/\//i.test(url) ? url : '';
}

function parseOfferTime(value: unknown) {
  const rawValue = textInputValue(value).trim();
  if (!rawValue) {
    return null;
  }

  const parsed = Date.parse(rawValue);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const normalized = rawValue.replace(' ', 'T');
  const reparsed = Date.parse(normalized);
  return Number.isFinite(reparsed) ? reparsed : null;
}

function isSalePriceActive(
  productSnapshotView: ProductMasterSnapshotPayload | undefined,
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const salePrice = firstTextValue(activeProductSiteOffer?.salePrice, productSnapshotView?.pricing.salePrice);
  if (!salePrice) {
    return false;
  }

  const saleStart = parseOfferTime(firstTextValue(activeProductSiteOffer?.saleStart, productSnapshotView?.pricing.saleStart));
  const saleEnd = parseOfferTime(firstTextValue(activeProductSiteOffer?.saleEnd, productSnapshotView?.pricing.saleEnd));
  const now = Date.now();
  return (!saleStart || now >= saleStart) && (!saleEnd || now <= saleEnd);
}

function saleWindowInputValues(activeProductSiteOffer: Record<string, unknown> | undefined) {
  const saleStart = formatOfferDateTimeInput(activeProductSiteOffer?.saleStart);
  const saleEnd = formatOfferDateTimeInput(activeProductSiteOffer?.saleEnd);
  const hasSalePrice = Boolean(textInputValue(activeProductSiteOffer?.salePrice).trim());
  if (!hasSalePrice || (saleStart && saleEnd)) {
    return { saleStart, saleEnd };
  }

  const defaults = defaultSaleWindowForDisplay();
  return {
    saleStart: saleStart || defaults.saleStart,
    saleEnd: saleEnd || defaults.saleEnd
  };
}

function resolvePricingSummary(
  productSnapshotView: ProductMasterSnapshotPayload | undefined,
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const explicitFinalPrice = firstTextValue(
    activeProductSiteOffer?.finalPrice,
    activeProductSiteOffer?.final_price,
    activeProductSiteOffer?.promoPrice,
    activeProductSiteOffer?.promotionPrice,
    activeProductSiteOffer?.dealPrice,
    productSnapshotView?.pricing.finalPrice,
    productSnapshotView?.pricing.final_price,
    productSnapshotView?.pricing.promoPrice,
    productSnapshotView?.pricing.promotionPrice,
    productSnapshotView?.pricing.dealPrice
  );
  const salePrice = firstTextValue(activeProductSiteOffer?.salePrice, productSnapshotView?.pricing.salePrice);
  const basePrice = firstTextValue(activeProductSiteOffer?.price, productSnapshotView?.pricing.price);
  const saleActive = isSalePriceActive(productSnapshotView, activeProductSiteOffer);
  const hasActivityPrice = Boolean(salePrice);
  const finalPrice = explicitFinalPrice || (hasActivityPrice ? salePrice : basePrice);
  const promoName = firstTextValue(
    activeProductSiteOffer?.activePromotionName,
    activeProductSiteOffer?.activePromotionCode,
    activeProductSiteOffer?.promoName,
    activeProductSiteOffer?.promotionName,
    activeProductSiteOffer?.campaignName,
    activeProductSiteOffer?.dealName,
    activeProductSiteOffer?.dealCode,
    activeProductSiteOffer?.promoCode,
    productSnapshotView?.pricing.activePromotionName,
    productSnapshotView?.pricing.activePromotionCode,
    productSnapshotView?.pricing.promoName,
    productSnapshotView?.pricing.promotionName,
    productSnapshotView?.pricing.campaignName,
    productSnapshotView?.pricing.dealName,
    productSnapshotView?.pricing.dealCode,
    productSnapshotView?.pricing.promoCode
  );
  const promoUrl = firstExternalUrl(
    activeProductSiteOffer?.activePromotionUrl,
    activeProductSiteOffer?.promoUrl,
    activeProductSiteOffer?.promotionUrl,
    activeProductSiteOffer?.campaignUrl,
    activeProductSiteOffer?.dealUrl,
    productSnapshotView?.pricing.activePromotionUrl,
    productSnapshotView?.pricing.promoUrl,
    productSnapshotView?.pricing.promotionUrl,
    productSnapshotView?.pricing.campaignUrl,
    productSnapshotView?.pricing.dealUrl
  );

  return {
    finalPrice,
    priceSource: hasActivityPrice || explicitFinalPrice ? '活动' : '基础售价',
    promoName: hasActivityPrice || explicitFinalPrice ? promoName || (saleActive ? '活动价' : '活动价不在当前时间窗') : '',
    promoUrl: hasActivityPrice || explicitFinalPrice ? promoUrl : ''
  };
}

export function ProductOfferPricingSection(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>;
  updateSiteOfferField: (storeCode: string, field: string, value: unknown) => void;
}) {
  const { productSnapshotView, activeProductSiteOffer, updateSiteOfferField } = props;
  const pricingSummary = resolvePricingSummary(productSnapshotView, activeProductSiteOffer);
  const saleWindowInputs = saleWindowInputValues(activeProductSiteOffer);
  const pricingValidationIssues = collectOfferPricingValidationIssues(activeProductSiteOffer, '当前站点');
  const priceValidationIssue = pricingValidationIssues.find((issue) => issue.fieldKey === 'price');
  const salePriceValidationIssue = pricingValidationIssues.find((issue) => issue.fieldKey === 'salePrice');

  const updateField = (field: string, value: unknown) => {
    if (!activeProductSiteOffer) {
      return;
    }
    updateSiteOfferField(siteOfferCode(activeProductSiteOffer), field, value);
  };

  return (
    <div>
      <Text strong style={{ display: 'block', color: 'var(--pm-text-primary)', marginBottom: 12 }}>
        价格
      </Text>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Text style={FIELD_LABEL_STYLE}>Base Price</Text>
          <Input
            value={textInputValue(activeProductSiteOffer?.price)}
            status={priceValidationIssue ? 'error' : undefined}
            onChange={(event) => updateField('price', event.target.value)}
          />
          {priceValidationIssue ? (
            <Text type="danger" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              {priceValidationIssue.message}
            </Text>
          ) : null}
        </Col>
        <Col xs={24} md={16}>
          <Text style={FIELD_LABEL_STYLE}>Price Min / Max</Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              aria-label="Price Min"
              placeholder="Min"
              style={{ width: 'calc((100% - 34px) / 2)' }}
              value={textInputValue(activeProductSiteOffer?.priceMin)}
              onChange={(event) => updateField('priceMin', event.target.value)}
            />
            <Input disabled value="-" style={{ width: 34, textAlign: 'center', pointerEvents: 'none' }} />
            <Input
              aria-label="Price Max"
              placeholder="Max"
              style={{ width: 'calc((100% - 34px) / 2)' }}
              value={textInputValue(activeProductSiteOffer?.priceMax)}
              onChange={(event) => updateField('priceMax', event.target.value)}
            />
          </Space.Compact>
        </Col>
      </Row>

      <div style={{ marginTop: 12 }}>
        <Text style={FIELD_LABEL_STYLE}>Sale Price / Sale Start / Sale End</Text>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              aria-label="Sale Price"
              placeholder="Sale Price"
              value={textInputValue(activeProductSiteOffer?.salePrice)}
              status={salePriceValidationIssue ? 'error' : undefined}
              onChange={(event) => updateField('salePrice', event.target.value)}
            />
            {salePriceValidationIssue ? (
              <Text type="danger" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                {salePriceValidationIssue.message}
              </Text>
            ) : null}
          </Col>
          <Col xs={24} md={8}>
            <Input
              aria-label="Sale Start"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={saleWindowInputs.saleStart}
              onChange={(event) => updateField('saleStart', event.target.value)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Input
              aria-label="Sale End"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={saleWindowInputs.saleEnd}
              onChange={(event) => updateField('saleEnd', event.target.value)}
            />
          </Col>
        </Row>
      </div>

      <Descriptions column={{ xs: 1, md: 4 }} size="small" colon={false} style={{ marginTop: 12 }}>
        <Descriptions.Item label="最终价格">
          <Text strong>{formatSnapshotValue(pricingSummary.finalPrice)}</Text>
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
            formatSnapshotValue(pricingSummary.promoName)
          )}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}
