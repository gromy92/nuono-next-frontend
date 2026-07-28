import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import { productOfferTextValue } from './productOfferValues';

const PRODUCT_OFFER_TIME_ZONE = 'Asia/Shanghai';
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

function currentProductOfferDateParts() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PRODUCT_OFFER_TIME_ZONE,
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
  const startParts = currentProductOfferDateParts();
  const endParts = addYears(startParts, DEFAULT_SALE_WINDOW_YEARS);
  return {
    saleStart: `${formatDateParts(startParts)} 00:00:00`,
    saleEnd: `${formatDateParts(endParts)} 23:59:59`
  };
}

function formatOfferDateTimeInput(value: unknown) {
  const rawValue = productOfferTextValue(value).trim();
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
    const text = productOfferTextValue(value).trim();
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
  const rawValue = productOfferTextValue(value).trim();
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

export function productOfferSaleWindowInputValues(
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const saleStart = formatOfferDateTimeInput(activeProductSiteOffer?.saleStart);
  const saleEnd = formatOfferDateTimeInput(activeProductSiteOffer?.saleEnd);
  const hasSalePrice = Boolean(productOfferTextValue(activeProductSiteOffer?.salePrice).trim());
  if (!hasSalePrice || (saleStart && saleEnd)) {
    return { saleStart, saleEnd };
  }

  const defaults = defaultSaleWindowForDisplay();
  return {
    saleStart: saleStart || defaults.saleStart,
    saleEnd: saleEnd || defaults.saleEnd
  };
}

export function resolveProductOfferPricingSummary(
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
    promoName:
      hasActivityPrice || explicitFinalPrice
        ? promoName || (saleActive ? '活动价' : '活动价不在当前时间窗')
        : '',
    promoUrl: hasActivityPrice || explicitFinalPrice ? promoUrl : ''
  };
}
