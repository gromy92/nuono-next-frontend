import { parseOptionalNumber, textInputValue } from './common';
import { collectOfferPricingValidationIssues } from './offerPricingValidation';
import { isVisibleDetailedAttributeRecord } from '../productAttributeTemplate';

export function pickAttributeValue(attribute: Record<string, unknown>) {
  return (
    textInputValue(attribute.commonValue).trim() ||
    textInputValue(attribute.enValue).trim() ||
    textInputValue(attribute.arValue).trim()
  );
}

export function collectRequiredAttributeIssues(attributes: Array<Record<string, unknown>>) {
  return attributes
    .filter(isVisibleDetailedAttributeRecord)
    .filter((item) => Boolean(item.required))
    .filter((item) => !pickAttributeValue(item))
    .map((item) => `${textInputValue(item.code) || '关键属性'} 仍需补齐。`);
}

export function collectGroupingDomainIssues(
  group: Record<string, unknown>,
  variants: Array<Record<string, unknown>>
) {
  const issues: string[] = [];
  const axes = Array.isArray(group.axes) ? (group.axes as Array<Record<string, unknown>>) : [];

  if (!axes.length) {
    issues.push('当前还没有维护 Group 轴。');
  }
  if (!variants.length) {
    issues.push('当前还没有维护变体 / 尺码。');
    return issues;
  }

  variants.forEach((variant, index) => {
    if (!textInputValue(variant.childSku).trim()) {
      issues.push(`第 ${index + 1} 条变体缺少 Child SKU。`);
    }
  });

  return issues;
}

export function collectSiteOfferValidationIssues(offer: Record<string, unknown> | undefined, label: string) {
  if (!offer) {
    return ['当前站点经营面暂未就绪。'];
  }

  const issues: string[] = [];
  const price = parseOptionalNumber(offer.price);

  if (price === null || price <= 0) {
    issues.push(`${label} 缺少有效售价。`);
  }
  issues.push(...collectOfferPricingValidationIssues(offer, label).map((issue) => issue.message));

  return issues;
}
