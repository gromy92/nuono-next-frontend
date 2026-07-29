import {
  PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS,
  type ProductDetailedAttributeField,
  type ProductDetailedAttributeGroup
} from '../product-domain/productDetailedAttributeCatalog';
import { productEditorTextValue } from './productEditorValues';

export function attributeCode(record: Record<string, unknown>) {
  return productEditorTextValue(record.code).trim();
}

function optionKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function humanizeOption(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function englishChineseLabel(en: string, zh?: string) {
  const english = en.trim();
  const chinese = productEditorTextValue(zh).trim();
  return english && chinese ? `${english}（${chinese}）` : english;
}

function optionChineseLabel(value: string, explicitZh?: string) {
  return productEditorTextValue(explicitZh).trim()
    || PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS[optionKey(value)]?.zh;
}

function optionEnglishDisplayLabel(
  option: NonNullable<ProductDetailedAttributeField['options']>[number]
) {
  return englishChineseLabel(option.en, optionChineseLabel(option.value, option.zh));
}

export function fieldOptionForValue(field: ProductDetailedAttributeField, value: string) {
  const valueKey = optionKey(value);
  return field.options?.find(
    (option) =>
      optionKey(option.value) === valueKey
      || optionKey(option.en) === valueKey
      || optionKey(optionEnglishDisplayLabel(option)) === valueKey
  );
}

export function splitAttributeValues(value: string) {
  return value
    .split(/[,;\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dictionaryLabel(value: string, field: ProductDetailedAttributeField, lang: 'en' | 'ar') {
  const fieldOption = fieldOptionForValue(field, value);
  if (fieldOption) {
    return lang === 'en' ? optionEnglishDisplayLabel(fieldOption) : fieldOption.ar ?? '';
  }
  const mappedValue = PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS[optionKey(value)];
  if (mappedValue?.[lang]) {
    return lang === 'en' ? englishChineseLabel(mappedValue.en, mappedValue.zh) : mappedValue[lang];
  }
  return lang === 'en' ? humanizeOption(value) : '';
}

function rawEnglishValue(record: Record<string, unknown>, field: ProductDetailedAttributeField) {
  const commonValue = productEditorTextValue(record.commonValue).trim();
  const englishValue = productEditorTextValue(record.enValue).trim();
  if (field.kind === 'select' || field.kind === 'dimension') {
    return commonValue || englishValue;
  }
  return englishValue || commonValue;
}

export function englishDisplayValue(record: Record<string, unknown>, field: ProductDetailedAttributeField) {
  const value = rawEnglishValue(record, field);
  if (!value) {
    return '';
  }
  if (field.kind === 'select' && field.multiple) {
    return splitAttributeValues(value)
      .map((item) => dictionaryLabel(item, field, 'en') || item)
      .join(', ');
  }
  return field.kind === 'select' ? dictionaryLabel(value, field, 'en') || value : value;
}

export function arabicDisplayValue(record: Record<string, unknown>, field: ProductDetailedAttributeField) {
  if (field.kind === 'select') {
    const rawValue = rawEnglishValue(record, field);
    const mappedValue = field.multiple
      ? splitAttributeValues(rawValue)
          .map((item) => dictionaryLabel(item, field, 'ar'))
          .filter(Boolean)
          .join(', ')
      : dictionaryLabel(rawValue, field, 'ar');
    if (mappedValue) {
      return mappedValue;
    }
  }
  const directValue = productEditorTextValue(record.arValue).trim();
  return directValue || productEditorTextValue(record.commonValue).trim();
}

export function attributeFilled(record: Record<string, unknown>, field: ProductDetailedAttributeField) {
  return Boolean(englishDisplayValue(record, field) || arabicDisplayValue(record, field));
}

export function buildAttributeMap(attributes: Array<Record<string, unknown>>) {
  const result = new Map<string, Record<string, unknown>>();
  attributes.forEach((item) => {
    const code = attributeCode(item);
    if (code) {
      result.set(code, item);
    }
  });
  return result;
}

export function groupRecords(
  group: ProductDetailedAttributeGroup,
  attributeMap: Map<string, Record<string, unknown>>
) {
  return group.fields.map((field) => ({
    field,
    record: attributeMap.get(field.code) ?? { code: field.code }
  }));
}

export function selectControlValue(field: ProductDetailedAttributeField, value: string) {
  if (!value) {
    return undefined;
  }
  return fieldOptionForValue(field, value)?.value ?? value;
}

export function selectOptions(field: ProductDetailedAttributeField, value: string) {
  const options = (field.options ?? []).map((option) => ({
    value: option.value,
    label: optionEnglishDisplayLabel(option)
  }));
  const customValues = field.multiple ? splitAttributeValues(value) : value ? [value] : [];
  customValues.forEach((item) => {
    const optionExists = options.some((option) => optionKey(option.value) === optionKey(item));
    if (item && !fieldOptionForValue(field, item) && !optionExists) {
      options.unshift({ value: item, label: humanizeOption(item) });
    }
  });
  return options;
}

export function writableAttributeField(
  record: Record<string, unknown>,
  field: ProductDetailedAttributeField
): 'commonValue' | 'enValue' {
  const commonValue = productEditorTextValue(record.commonValue).trim();
  const englishValue = productEditorTextValue(record.enValue).trim();
  const arabicValue = productEditorTextValue(record.arValue).trim();
  if (field.kind === 'select' || field.kind === 'dimension') {
    return 'commonValue';
  }
  if (commonValue && !englishValue && !arabicValue) {
    return 'commonValue';
  }
  return 'enValue';
}

export function dimensionUnitValue(record: Record<string, unknown>) {
  return productEditorTextValue(record.unit).trim();
}

export function editablePlaceholder(field: ProductDetailedAttributeField) {
  if (field.kind === 'select') {
    return field.multiple ? '请选择或输入' : '请选择';
  }
  if (field.kind === 'dimension') {
    return '数值';
  }
  return undefined;
}
