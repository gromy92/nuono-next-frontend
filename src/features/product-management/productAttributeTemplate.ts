import {
  PRODUCT_DETAILED_ATTRIBUTE_GROUPS,
  type ProductDetailedAttributeField,
  type ProductDetailedAttributeGroup,
  type ProductDetailedAttributeKind,
  type ProductDetailedAttributeOption
} from './productDetailedContentConfig';
import { textInputValue } from './utils/common';

const VALID_FIELD_KINDS = new Set<ProductDetailedAttributeKind>(['text', 'textarea', 'select', 'dimension']);
const OFFER_ONLY_ATTRIBUTE_CODES = new Set(['barcode', 'barcodes', 'ean', 'gtin', 'upc']);
const DUPLICATE_CLASSIFICATION_GROUP_KEYS = new Set(['classification', 'classfication']);
const HIDDEN_SELLER_ATTRIBUTE_CODES = new Set([
  'external_qc_rejection_reason_fatal',
  'external_qc_rejection_reason_fatal_common',
  'id_partner',
  'brand',
  'fulltype',
  'product_fulltype',
  'number_of_pieces',
  'pending_virtual_attributes',
  'grade'
]);
const DUPLICATE_BASIC_CONTENT_CODES = new Set([
  'product_title',
  'full_product_title',
  'long_description',
  'short_description',
  'description'
]);
const ATTRIBUTE_UI_META: Record<string, { labelZh?: string; maxLength?: number; multiple?: boolean }> = {
  base_material: { labelZh: '基础材质' },
  care_instructions: { labelZh: '护理说明' },
  colour_family: { labelZh: '颜色' },
  colour_name: { labelZh: '颜色名称' },
  connection_type: { labelZh: '连接类型' },
  control_method: { labelZh: '控制方式', multiple: true },
  country_of_origin: { labelZh: '原产国' },
  hs_code: { labelZh: '海关编码' },
  item_condition: { labelZh: '商品成色' },
  lighting_technology: { labelZh: '照明技术' },
  material_finish: { labelZh: '表面工艺' },
  model_name: { labelZh: '型号名称' },
  model_number: { labelZh: '型号' },
  occasion: { labelZh: '适用场景' },
  pattern: { labelZh: '图案' },
  product_height: { labelZh: '商品高度' },
  product_length: { labelZh: '商品长度' },
  product_weight: { labelZh: '商品重量' },
  product_width_depth: { labelZh: '商品宽度/深度' },
  secondary_material: { labelZh: '辅材' },
  set_includes: { labelZh: '包含物', maxLength: 4000 },
  shape: { labelZh: '形状' },
  whats_in_the_box: { labelZh: '包装清单' },
  mpn: { labelZh: '制造商零件号' },
  shipping_height: { labelZh: '包装高度' },
  shipping_length: { labelZh: '包装长度' },
  shipping_weight: { labelZh: '包装重量' },
  shipping_width_depth: { labelZh: '包装宽度/深度' },
  vat_rate_ae: { labelZh: '阿联酋 VAT 税率' },
  vat_rate_eg: { labelZh: '埃及 VAT 税率' },
  vat_rate_sa: { labelZh: '沙特 VAT 税率' }
};

function isDuplicateBasicContentField(code: string) {
  const normalizedCode = normalizeKey(code);
  return (
    DUPLICATE_BASIC_CONTENT_CODES.has(normalizedCode) ||
    normalizedCode === 'feature_bullet' ||
    normalizedCode.startsWith('feature_bullet_') ||
    normalizedCode === 'images' ||
    normalizedCode === 'image_url' ||
    normalizedCode.startsWith('image_url_')
  );
}

function normalizeKey(value: unknown) {
  return textInputValue(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function isHiddenSellerAttributeCode(code: string) {
  const normalizedCode = normalizeKey(code);
  return (
    HIDDEN_SELLER_ATTRIBUTE_CODES.has(normalizedCode) ||
    normalizedCode.startsWith('external_qc_') ||
    normalizedCode.startsWith('pending_virtual_')
  );
}

export function isVisibleDetailedAttributeRecord(record: Record<string, unknown>) {
  const code = firstText(record.code);
  const groupName = firstText(record.groupName);
  return Boolean(
    code &&
      !OFFER_ONLY_ATTRIBUTE_CODES.has(normalizeKey(code)) &&
      !DUPLICATE_CLASSIFICATION_GROUP_KEYS.has(normalizeKey(groupName)) &&
      !isDuplicateBasicContentField(code) &&
      !isHiddenSellerAttributeCode(code)
  );
}

function fieldLabel(label: string, labelZh?: string) {
  return labelZh ? `${label}（${labelZh}）` : label;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function optionFromValue(value: unknown): ProductDetailedAttributeOption | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = textInputValue(value).trim();
    return text ? { value: text, en: text } : undefined;
  }

  const record = objectRecord(value);
  if (!record) {
    return undefined;
  }

  const optionValue = firstText(record.value, record.optionValue, record.option_value, record.code, record.optionCode, record.option_code, record.en);
  const englishLabel = firstText(record.en, record.labelEn, record.label_en, record.label, record.name, optionValue);
  const arabicLabel = firstText(record.ar, record.labelAr, record.label_ar, record.nameAr, record.name_ar);
  if (!optionValue || !englishLabel) {
    return undefined;
  }
  return {
    value: optionValue,
    en: englishLabel,
    ...(arabicLabel ? { ar: arabicLabel } : {})
  };
}

function dedupeOptions(options: ProductDetailedAttributeOption[]) {
  const seen = new Set<string>();
  const result: ProductDetailedAttributeOption[] = [];
  options.forEach((option) => {
    const key = normalizeKey(option.value || option.en);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(option);
  });
  return result;
}

function optionsFromRecord(record: Record<string, unknown>) {
  const rawOptions = record.options;
  if (!Array.isArray(rawOptions)) {
    return [];
  }
  return dedupeOptions(rawOptions.map(optionFromValue).filter((item): item is ProductDetailedAttributeOption => Boolean(item)));
}

function unitOptionsFromRecord(record: Record<string, unknown>) {
  const rawUnits = record.unitOptions;
  if (!Array.isArray(rawUnits)) {
    return [];
  }
  return Array.from(
    new Set(
      rawUnits
        .map((item) => {
          if (typeof item === 'string' || typeof item === 'number') {
            return textInputValue(item).trim();
          }
          const unitRecord = objectRecord(item);
          return unitRecord ? firstText(unitRecord.value, unitRecord.en, unitRecord.label, unitRecord.code) : '';
        })
        .filter(Boolean)
    )
  );
}

function fieldKindFromRecord(
  record: Record<string, unknown>,
  fallbackKind: ProductDetailedAttributeKind,
  officialOptions: ProductDetailedAttributeOption[],
  officialUnitOptions: string[]
): ProductDetailedAttributeKind {
  if (officialUnitOptions.length > 0) {
    return 'dimension';
  }
  if (officialOptions.length > 0) {
    return 'select';
  }
  const rawKind = normalizeKey(record.kind) as ProductDetailedAttributeKind;
  if (VALID_FIELD_KINDS.has(rawKind) && rawKind !== 'text') {
    return rawKind;
  }
  return fallbackKind;
}

function fieldFromRecord(record: Record<string, unknown>): ProductDetailedAttributeField | undefined {
  const code = firstText(record.code);
  if (!isVisibleDetailedAttributeRecord(record)) {
    return undefined;
  }
  const meta = ATTRIBUTE_UI_META[normalizeKey(code)] ?? {};
  return mergeDetailedAttributeField(
    {
      code,
      label: firstText(record.labelEn, record.label, code),
      ...meta,
      kind: 'text'
    },
    record
  );
}

function cloneGroups(groups: ProductDetailedAttributeGroup[]) {
  return groups.map((group) => ({
    ...group,
    fields: group.fields.map((field) => ({ ...field }))
  }));
}

function findOfficialGroup(groups: ProductDetailedAttributeGroup[], groupName: string) {
  const normalizedGroupName = normalizeKey(groupName);
  if (!normalizedGroupName) {
    return undefined;
  }
  return groups.find((group) => group.officialGroupNames.map(normalizeKey).includes(normalizedGroupName));
}

export function mergeDetailedAttributeField(
  field: ProductDetailedAttributeField,
  record: Record<string, unknown>
): ProductDetailedAttributeField {
  const officialOptions = optionsFromRecord(record);
  const officialUnitOptions = unitOptionsFromRecord(record);
  const meta = ATTRIBUTE_UI_META[normalizeKey(field.code)] ?? {};
  const baseLabel = firstText(record.labelEn, record.label, field.label);
  const labelZh = firstText(field.labelZh, meta.labelZh);
  const labelAr = firstText(record.labelAr, field.labelAr);
  return {
    ...field,
    label: fieldLabel(baseLabel, labelZh),
    ...(labelZh ? { labelZh } : {}),
    ...(labelAr ? { labelAr } : {}),
    kind: fieldKindFromRecord(record, field.kind, officialOptions, officialUnitOptions),
    options: officialOptions.length ? officialOptions : field.options,
    unitOptions: officialUnitOptions.length ? officialUnitOptions : field.unitOptions,
    dictionarySource: officialOptions.length || officialUnitOptions.length ? 'official-template' : field.dictionarySource,
    multiple: field.multiple ?? meta.multiple,
    maxLength: field.maxLength ?? meta.maxLength
  };
}

export function buildDetailedAttributeGroups(attributeRecords: Array<Record<string, unknown>>) {
  const groups = cloneGroups(PRODUCT_DETAILED_ATTRIBUTE_GROUPS);
  const knownCodes = new Set(groups.flatMap((group) => group.fields.map((field) => normalizeKey(field.code))));

  attributeRecords.forEach((record) => {
    const field = fieldFromRecord(record);
    if (!field) {
      return;
    }
    const fieldKey = normalizeKey(field.code);
    if (knownCodes.has(fieldKey)) {
      return;
    }
    const groupName = firstText(record.groupName);
    const officialGroup = findOfficialGroup(groups, groupName);
    if (officialGroup) {
      officialGroup.fields.push(field);
    } else {
      const dynamicGroupKey = `official-${normalizeKey(groupName || 'other') || 'other'}`;
      let dynamicGroup = groups.find((group) => group.key === dynamicGroupKey);
      if (!dynamicGroup) {
        dynamicGroup = {
          key: dynamicGroupKey,
          title: groupName || 'Other Detailed Attributes',
          officialGroupNames: groupName ? [groupName] : [],
          fields: []
        };
        groups.push(dynamicGroup);
      }
      dynamicGroup.fields.push(field);
    }
    knownCodes.add(fieldKey);
  });

  return groups;
}
