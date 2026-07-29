import { Input, Select, Space } from 'antd';
import type { ProductDetailedAttributeField } from '../product-domain/productDetailedAttributeCatalog';
import {
  editablePlaceholder,
  fieldOptionForValue,
  selectControlValue,
  selectOptions,
  splitAttributeValues
} from './productAttributeValueModel';
import { productAttributeUnitOptions } from './productAttributeUnits';

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
          options={productAttributeUnitOptions(field)}
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
          options={productAttributeUnitOptions(field)}
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
