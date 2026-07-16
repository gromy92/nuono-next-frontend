import { parseOptionalNumber } from './common';

export type OfferPricingValidationIssue = {
  fieldKey: 'price' | 'salePrice';
  code:
    | 'price_below_min'
    | 'price_above_max'
    | 'sale_price_below_min'
    | 'sale_price_above_max'
    | 'sale_price_must_be_lower_than_price';
  message: string;
};

export function collectOfferPricingValidationIssues(
  offer: Record<string, unknown> | undefined,
  label: string
): OfferPricingValidationIssue[] {
  if (!offer) {
    return [];
  }

  const issues: OfferPricingValidationIssue[] = [];
  const price = parseOptionalNumber(offer.price);
  const salePrice = parseOptionalNumber(offer.salePrice);
  const priceMin = parseOptionalNumber(offer.priceMin);
  const priceMax = parseOptionalNumber(offer.priceMax);

  if (salePrice !== null && price !== null && salePrice >= price) {
    issues.push({
      fieldKey: 'salePrice',
      code: 'sale_price_must_be_lower_than_price',
      message: `${label}的售价必须小于原价。`
    });
  }
  if (price !== null && priceMin !== null && price < priceMin) {
    issues.push({
      fieldKey: 'price',
      code: 'price_below_min',
      message: `${label}的原价必须在最低价和最高价之间。`
    });
  }
  if (price !== null && priceMax !== null && price > priceMax) {
    issues.push({
      fieldKey: 'price',
      code: 'price_above_max',
      message: `${label}的原价必须在最低价和最高价之间。`
    });
  }
  if (salePrice !== null && priceMin !== null && salePrice < priceMin) {
    issues.push({
      fieldKey: 'salePrice',
      code: 'sale_price_below_min',
      message: `${label}的售价必须在最低价和最高价之间。`
    });
  }
  if (salePrice !== null && priceMax !== null && salePrice > priceMax) {
    issues.push({
      fieldKey: 'salePrice',
      code: 'sale_price_above_max',
      message: `${label}的售价必须在最低价和最高价之间。`
    });
  }

  return issues;
}
