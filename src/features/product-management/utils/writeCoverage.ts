import type { ProductMasterSnapshotPayload } from '../types';
import { areSnapshotPartsEqual, textInputValue } from './common';

export const NOON_WRITABLE_SITE_OFFER_FIELDS = [
  'price',
  'salePrice',
  'saleStart',
  'saleEnd',
  'priceMin',
  'priceMax',
  'isActive',
  'idWarranty',
  'offerNote'
] as const;

export const NOON_READONLY_SITE_OFFER_FIELDS = ['barcode'] as const;

const CORE_ATTRIBUTE_CODES = new Set([
  'brand',
  'family',
  'product_type',
  'product_subtype',
  'product_fulltype',
  'item_condition',
  'grade',
  'product_title',
  'long_description'
]);

function attributeCodeTokens(code: unknown) {
  return textInputValue(code)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function isReadonlyNoonAttributeCode(code: unknown) {
  const normalized = textInputValue(code).toLowerCase();
  const tokens = attributeCodeTokens(code);
  return (
    normalized.includes('barcode') ||
    tokens.includes('gtin') ||
    tokens.includes('ean') ||
    tokens.includes('upc')
  );
}

function isLocalProductImageAssetUrl(value: unknown) {
  return textInputValue(value).trim().startsWith('/api/product-master/image-assets/');
}

function snapshotRecordMap(records: Array<Record<string, unknown>>, keyField: string) {
  const result = new Map<string, Record<string, unknown>>();
  records.forEach((item) => {
    const key = textInputValue(item[keyField]).trim();
    if (key) {
      result.set(key, item);
    }
  });
  return result;
}

export function isCoreNoonAttributeCode(code: unknown) {
  return CORE_ATTRIBUTE_CODES.has(textInputValue(code).trim());
}

export function isScalarNoonAttributeValue(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function isNoonWritableAttribute(record: Record<string, unknown>) {
  if (isCoreNoonAttributeCode(record.code) || isReadonlyNoonAttributeCode(record.code)) {
    return false;
  }
  return (
    isScalarNoonAttributeValue(record.commonValue) &&
    isScalarNoonAttributeValue(record.enValue) &&
    isScalarNoonAttributeValue(record.arValue)
  );
}

function readableAttributeCode(code: string) {
  return code || '关键属性';
}

function recordList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

function groupDefinitionComparable(group: Record<string, unknown> | undefined) {
  const axes = recordList(group?.axes)
    .map((axis) => ({
      axisCode: textInputValue(axis.axisCode || axis.axis_code).trim(),
      axisName: textInputValue(axis.axisName || axis.axis_name).trim()
    }))
    .filter((axis) => axis.axisCode)
    .sort((left, right) => left.axisCode.localeCompare(right.axisCode));
  return {
    skuGroup: textInputValue(group?.skuGroup).trim(),
    groupRef: textInputValue(group?.groupRef).trim(),
    groupRefCanonical: textInputValue(group?.groupRefCanonical).trim(),
    conditionsBrand: textInputValue(group?.conditionsBrand).trim(),
    conditionsFulltype: textInputValue(group?.conditionsFulltype).trim(),
    axes
  };
}

export function collectUnsupportedGroupingWriteIssues(
  draft: ProductMasterSnapshotPayload,
  baseline: ProductMasterSnapshotPayload
) {
  const issues: string[] = [];

  if (!areSnapshotPartsEqual(groupDefinitionComparable(draft.group), groupDefinitionComparable(baseline.group))) {
    issues.push('Group 换组或轴定义当前暂未开放 Noon 写回；本期支持已有成员 Group 轴属性值、新增未分组商品和 Unlink。');
  }

  const draftVariants = snapshotRecordMap(draft.variants ?? [], 'childSku');
  const baselineVariants = snapshotRecordMap(baseline.variants ?? [], 'childSku');
  const draftKeys = [...draftVariants.keys()].sort();
  const baselineKeys = [...baselineVariants.keys()].sort();
  if (!areSnapshotPartsEqual(draftKeys, baselineKeys)) {
    issues.push('尺码新增、删除或 Child SKU 变更当前没有 Noon 写回适配，请撤回这类修改后再发布。');
  }

  return issues;
}

export function collectUnsupportedAttributeWriteIssues(
  draft: ProductMasterSnapshotPayload,
  baseline: ProductMasterSnapshotPayload
) {
  const issues: string[] = [];
  const draftAttributes = snapshotRecordMap(draft.keyAttributes ?? [], 'code');
  const baselineAttributes = snapshotRecordMap(baseline.keyAttributes ?? [], 'code');
  const codes = new Set([...draftAttributes.keys(), ...baselineAttributes.keys()]);

  codes.forEach((code) => {
    const draftAttribute = draftAttributes.get(code);
    const baselineAttribute = baselineAttributes.get(code);
    if (areSnapshotPartsEqual(draftAttribute, baselineAttribute)) {
      return;
    }
    if (!draftAttribute || !baselineAttribute) {
      issues.push(`${readableAttributeCode(code)} 的属性新增或移除当前没有 Noon 写回适配。`);
      return;
    }
    if (isReadonlyNoonAttributeCode(code)) {
      issues.push(`${readableAttributeCode(code)} 当前只支持本地草稿展示，暂不支持发布到 Noon。`);
      return;
    }
    if (isCoreNoonAttributeCode(code)) {
      issues.push(`${readableAttributeCode(code)} 是核心属性，请在对应主档字段维护，不允许从关键属性表发布。`);
      return;
    }
    if (!isNoonWritableAttribute(draftAttribute) || !isNoonWritableAttribute(baselineAttribute)) {
      issues.push(`${readableAttributeCode(code)} 包含复杂值，当前没有 Noon 写回适配。`);
    }
  });

  return issues;
}

export function collectUnsupportedCurrentSiteWriteIssues(
  draft: ProductMasterSnapshotPayload,
  baseline: ProductMasterSnapshotPayload,
  currentSiteCode?: string
) {
  const issues: string[] = [];
  const draftOffers = snapshotRecordMap(draft.siteOffers ?? [], 'storeCode');
  const baselineOffers = snapshotRecordMap(baseline.siteOffers ?? [], 'storeCode');
  const siteCodes = currentSiteCode ? [currentSiteCode] : [...draftOffers.keys()];

  siteCodes.forEach((storeCode) => {
    const draftOffer = draftOffers.get(storeCode);
    const baselineOffer = baselineOffers.get(storeCode);
    if (!draftOffer || !baselineOffer) {
      return;
    }
    NOON_READONLY_SITE_OFFER_FIELDS.forEach((field) => {
      if (!areSnapshotPartsEqual(draftOffer[field], baselineOffer[field])) {
        issues.push(`${storeCode} 的 ${field} 当前没有 Noon 写回适配，或属于 Noon 只读/汇总字段。`);
      }
    });
  });

  return issues;
}

export function collectUnsupportedContentWriteIssues(
  draft: ProductMasterSnapshotPayload,
  baseline: ProductMasterSnapshotPayload
) {
  if (areSnapshotPartsEqual(draft.content?.images, baseline.content?.images)) {
    return [];
  }
  const images = Array.isArray(draft.content?.images) ? draft.content.images : [];
  return images.some(isLocalProductImageAssetUrl)
    ? ['本地上传图片还没有 Noon 可访问 URL，暂时不能发布；请先删除本地上传图片或等待图片外链适配。']
    : [];
}

export function collectUnsupportedProductPublishIssues(
  draft: ProductMasterSnapshotPayload,
  baseline: ProductMasterSnapshotPayload,
  currentSiteCode?: string
) {
  return [
    ...collectUnsupportedContentWriteIssues(draft, baseline),
    ...collectUnsupportedGroupingWriteIssues(draft, baseline),
    ...collectUnsupportedAttributeWriteIssues(draft, baseline),
    ...collectUnsupportedCurrentSiteWriteIssues(draft, baseline, currentSiteCode)
  ];
}
