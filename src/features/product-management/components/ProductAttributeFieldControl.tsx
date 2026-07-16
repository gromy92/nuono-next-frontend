import { Input, Select, Space } from 'antd';
import {
  PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS,
  type ProductDetailedAttributeField,
  type ProductDetailedAttributeGroup
} from '../productDetailedContentConfig';
import { textInputValue } from '../utils';

const LENGTH_UNIT_OPTIONS = ['mm', 'cm', 'm', 'in', 'ft'].map((unit) => ({ value: unit, label: unit }));
const WEIGHT_UNIT_OPTIONS = ['g', 'KG', 'lb', 'lbs'].map((unit) => ({ value: unit, label: unit }));

export function attributeCode(record: Record<string, unknown>) {
  return textInputValue(record.code).trim();
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
  const chinese = textInputValue(zh).trim();
  return english && chinese ? `${english}（${chinese}）` : english;
}

function optionChineseLabel(value: string, explicitZh?: string) {
  return textInputValue(explicitZh).trim() || PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS[optionKey(value)]?.zh;
}

function optionEnglishDisplayLabel(field: ProductDetailedAttributeField, option: NonNullable<ProductDetailedAttributeField['options']>[number]) {
  return englishChineseLabel(option.en, optionChineseLabel(option.value, option.zh));
}

function fieldOptionForValue(field: ProductDetailedAttributeField, value: string) {
  const valueKey = optionKey(value);
  return field.options?.find(
    (option) =>
      optionKey(option.value) === valueKey ||
      optionKey(option.en) === valueKey ||
      optionKey(optionEnglishDisplayLabel(field, option)) === valueKey
  );
}

function splitAttributeValues(value: string) {
  return value
    .split(/[,;\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dictionaryLabel(value: string, field: ProductDetailedAttributeField, lang: 'en' | 'ar') {
  const fieldOption = fieldOptionForValue(field, value);
  if (fieldOption) {
    return lang === 'en' ? optionEnglishDisplayLabel(field, fieldOption) : fieldOption.ar ?? '';
  }
  const mappedValue = PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS[optionKey(value)];
  if (mappedValue?.[lang]) {
    return lang === 'en' ? englishChineseLabel(mappedValue.en, mappedValue.zh) : mappedValue[lang];
  }
  return lang === 'en' ? humanizeOption(value) : '';
}

function rawEnglishValue(record: Record<string, unknown>, field: ProductDetailedAttributeField) {
  const commonValue = textInputValue(record.commonValue).trim();
  const englishValue = textInputValue(record.enValue).trim();
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
  const directValue = textInputValue(record.arValue).trim();
  if (directValue) {
    return directValue;
  }
  return textInputValue(record.commonValue).trim();
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

function selectControlValue(field: ProductDetailedAttributeField, value: string) {
  if (!value) {
    return undefined;
  }
  return fieldOptionForValue(field, value)?.value ?? value;
}

function selectOptions(field: ProductDetailedAttributeField, value: string) {
  const options = (field.options ?? []).map((option) => ({
    value: option.value,
    label: optionEnglishDisplayLabel(field, option)
  }));
  const customValues = field.multiple ? splitAttributeValues(value) : value ? [value] : [];
  customValues.forEach((item) => {
    if (item && !fieldOptionForValue(field, item) && !options.some((option) => optionKey(option.value) === optionKey(item))) {
      options.unshift({ value: item, label: humanizeOption(item) });
    }
  });
  return options;
}

export function writableAttributeField(
  record: Record<string, unknown>,
  field: ProductDetailedAttributeField
): 'commonValue' | 'enValue' {
  const commonValue = textInputValue(record.commonValue).trim();
  const englishValue = textInputValue(record.enValue).trim();
  const arabicValue = textInputValue(record.arValue).trim();
  if (field.kind === 'select' || field.kind === 'dimension') {
    return 'commonValue';
  }
  if (commonValue && !englishValue && !arabicValue) {
    return 'commonValue';
  }
  return 'enValue';
}

export function dimensionUnitValue(record: Record<string, unknown>) {
  return textInputValue(record.unit).trim();
}

function dimensionUnitOptions(field: ProductDetailedAttributeField) {
  if (field.unitOptions?.length) {
    return field.unitOptions.map((unit) => ({ value: unit, label: unit }));
  }
  return field.code.includes('weight') ? WEIGHT_UNIT_OPTIONS : LENGTH_UNIT_OPTIONS;
}

function editablePlaceholder(field: ProductDetailedAttributeField) {
  if (field.kind === 'select') {
    return field.multiple ? '请选择或输入' : '请选择';
  }
  if (field.kind === 'dimension') {
    return '数值';
  }
  return undefined;
}

export function ProductAttributeValueInput(props: {
  field: ProductDetailedAttributeField;
  value: string;
  unit?: string;
  editable: boolean;
  onChange: (value: string) => void;
  onUnitChange?: (value: string) => void;
}) {
  const { editable, field, onChange, onUnitChange, unit, value } = props;
  const placeholder = editablePlaceholder(field);

  if (field.kind === 'textarea') {
    return (
      <Input.TextArea
        autoSize={{ minRows: 2, maxRows: 5 }}
        disabled={!editable}
        maxLength={field.maxLength}
        placeholder={placeholder}
        showCount={Boolean(field.maxLength)}
        value={value}
        onChange={(event) => onChange(field.maxLength ? event.target.value.slice(0, field.maxLength) : event.target.value)}
      />
    );
  }

  if (field.kind === 'dimension') {
    return (
      <Space.Compact style={{ width: '100%' }}>
        <Input disabled={!editable} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
        <Select
          disabled={!editable}
          optionFilterProp="label"
          options={dimensionUnitOptions(field)}
          placeholder="单位"
          showSearch
          style={{ width: 92 }}
          value={unit || undefined}
          onChange={(nextValue) => onUnitChange?.(nextValue ?? '')}
        />
      </Space.Compact>
    );
  }

  if (field.kind === 'select') {
    if (field.multiple) {
      return (
        <Select
          allowClear
          disabled={!editable}
          mode="tags"
          optionFilterProp="label"
          options={selectOptions(field, value)}
          placeholder={placeholder}
          showSearch
          style={{ width: '100%' }}
          value={splitAttributeValues(value).map((item) => fieldOptionForValue(field, item)?.value ?? item)}
          onChange={(nextValue) => onChange(nextValue.join(','))}
        />
      );
    }
    return (
      <Select
        allowClear
        disabled={!editable}
        optionFilterProp="label"
        options={selectOptions(field, value)}
        placeholder={placeholder}
        showSearch
        style={{ width: '100%' }}
        value={selectControlValue(field, value)}
        onChange={(nextValue) => onChange(nextValue ?? '')}
      />
    );
  }

  return <Input disabled={!editable} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
}

export function ProductAttributeReadonlyValue(props: { field: ProductDetailedAttributeField; value: string; unit?: string }) {
  const { field, unit, value } = props;
  if (field.kind === 'select') {
    if (field.multiple) {
      return (
        <Select
          disabled
          mode="multiple"
          options={selectOptions(field, value)}
          placeholder={undefined}
          style={{ width: '100%' }}
          value={splitAttributeValues(value).map((item) => fieldOptionForValue(field, item)?.value ?? item)}
        />
      );
    }
    return <Select disabled options={value ? [{ value, label: value }] : []} placeholder={undefined} style={{ width: '100%' }} value={value || undefined} />;
  }
  if (field.kind === 'dimension') {
    return (
      <Space.Compact style={{ width: '100%' }}>
        <Input disabled placeholder={undefined} value={value} />
        <Select
          disabled
          options={dimensionUnitOptions(field)}
          placeholder={undefined}
          style={{ width: 92 }}
          value={unit || undefined}
        />
      </Space.Compact>
    );
  }
  if (field.kind === 'textarea') {
    return <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} disabled maxLength={field.maxLength} placeholder={undefined} showCount={Boolean(field.maxLength)} value={value} />;
  }
  return <Input disabled placeholder={undefined} value={value} />;
}
