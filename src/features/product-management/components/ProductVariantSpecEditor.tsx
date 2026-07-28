import { Button, InputNumber, Select, Space, Tag, Typography, type SelectProps } from 'antd';
import type { ReactNode } from 'react';
import type { ProductVariantSpecLogisticsValue, ProductVariantSpecPayload } from '../../product-specs/types';
import { formatSnapshotValue } from '../utils/common';
import {
  batteryOptions,
  cartonSpecFields,
  liquidOptions,
  missingFieldLabel,
  productSpecFields,
  specRowKey,
  statusLabel,
  type NumericSpecConfig
} from './productVariantSpecModel';

const { Text } = Typography;

export function ProductVariantSpecEditor(props: {
  row: ProductVariantSpecPayload;
  showVariantHeader: boolean;
  savingKey?: string;
  savedKey?: string;
  updateRow: (rowKey: string, patch: Partial<ProductVariantSpecPayload>) => void;
  saveRow: (row: ProductVariantSpecPayload) => void | Promise<void>;
}) {
  const { row, showVariantHeader, savingKey, savedKey, updateRow, saveRow } = props;
  const rowKey = specRowKey(row);
  const disabled = Boolean(savingKey);
  const justSaved = savedKey === rowKey && savingKey !== rowKey;

  return (
    <div style={{ border: '1px solid #eef2f7', borderRadius: 6, background: '#ffffff', overflow: 'hidden' }}>
      {showVariantHeader ? (
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: '#f8fafc',
          borderBottom: '1px solid #eef2f7'
        }}>
          <Space size={8} wrap>
            <Text strong>{formatSnapshotValue(row.partnerSku)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Child {formatSnapshotValue(row.childSku)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Size {formatSnapshotValue(row.sizeEn || row.sizeAr)}
            </Text>
          </Space>
          <ProductVariantSpecStatus row={row} />
        </div>
      ) : null}

      <div className="product-spec-layout-row" style={specLayoutRowStyle}>
        <ProductVariantSpecGroupLabel title="产品规格" />
        {productSpecFields.map((field) => (
          <ProductVariantSpecNumberField
            key={field.field}
            config={field}
            row={row}
            disabled={disabled}
            updateRow={updateRow}
          />
        ))}
      </div>

      <div className="product-spec-layout-row" style={specLayoutRowStyle}>
        <ProductVariantSpecGroupLabel title="箱规" />
        {cartonSpecFields.map((field) => (
          <ProductVariantSpecNumberField
            key={field.field}
            config={field}
            row={row}
            disabled={disabled}
            updateRow={updateRow}
          />
        ))}
      </div>

      <div className="product-spec-layout-row" style={specLayoutRowStyle}>
        <ProductVariantSpecGroupLabel title="物流属性" />
        <ProductVariantSpecSelectField
          label="带电/磁"
          field="batteryMagneticType"
          options={batteryOptions}
          row={row}
          disabled={disabled}
          updateRow={updateRow}
        />
        <ProductVariantSpecSelectField
          label="液体/粉末"
          field="liquidPowderType"
          options={liquidOptions}
          row={row}
          disabled={disabled}
          updateRow={updateRow}
        />
        <ProductVariantSpecField label="状态">
          <ProductVariantSpecStatus row={row} />
        </ProductVariantSpecField>
        <div style={{ alignSelf: 'end', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            loading={savingKey === rowKey}
            disabled={Boolean(savingKey)}
            onClick={() => void saveRow(row)}
          >
            {justSaved ? '已保存' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const specLayoutRowStyle = {
  display: 'grid',
  gridTemplateColumns: '88px repeat(auto-fit, minmax(132px, 1fr))',
  gap: '10px 14px',
  alignItems: 'end',
  padding: '10px 12px',
  borderBottom: '1px solid #f1f5f9'
} as const;

function ProductVariantSpecNumberField(props: {
  config: NumericSpecConfig;
  row: ProductVariantSpecPayload;
  disabled: boolean;
  updateRow: (rowKey: string, patch: Partial<ProductVariantSpecPayload>) => void;
}) {
  const { config, row, disabled, updateRow } = props;
  const precision = config.precision ?? 2;
  return (
    <ProductVariantSpecField label={config.label}>
      <InputNumber
        min={precision === 0 ? 1 : 0.01}
        precision={precision}
        addonAfter={config.unit}
        value={row[config.field] ?? null}
        disabled={disabled}
        style={{ width: '100%' }}
        onChange={(value) =>
          updateRow(specRowKey(row), {
            [config.field]: typeof value === 'number' ? value : undefined
          } as Partial<ProductVariantSpecPayload>)
        }
      />
    </ProductVariantSpecField>
  );
}

function ProductVariantSpecSelectField(props: {
  label: string;
  field: 'batteryMagneticType' | 'liquidPowderType',
  options: SelectProps<ProductVariantSpecLogisticsValue>['options'];
  row: ProductVariantSpecPayload;
  disabled: boolean;
  updateRow: (rowKey: string, patch: Partial<ProductVariantSpecPayload>) => void;
}) {
  const { label, field, options, row, disabled, updateRow } = props;
  return (
    <ProductVariantSpecField label={label}>
      <Select<ProductVariantSpecLogisticsValue>
        value={row[field] ?? 'unknown'}
        options={options}
        disabled={disabled}
        style={{ width: '100%' }}
        onChange={(value) => updateRow(specRowKey(row), { [field]: value } as Partial<ProductVariantSpecPayload>)}
      />
    </ProductVariantSpecField>
  );
}

function ProductVariantSpecField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4, minWidth: 0 }}>
      <Text type="secondary" style={{ fontSize: 12, lineHeight: '18px' }}>{label}</Text>
      {children}
    </label>
  );
}

function ProductVariantSpecGroupLabel({ title }: { title: string }) {
  return <Text strong style={{ alignSelf: 'center', color: '#334155', fontSize: 13 }}>{title}</Text>;
}

function ProductVariantSpecStatus({ row }: { row: ProductVariantSpecPayload }) {
  return (
    <Space direction="vertical" size={3} style={{ minWidth: 0 }}>
      <Tag color={row.completenessStatus === 'ready' ? 'success' : 'warning'} style={{ width: 'fit-content', marginInlineEnd: 0 }}>
        {statusLabel(row.completenessStatus)}
      </Tag>
      {row.missingFields?.length ? (
        <Text type="secondary" style={{ fontSize: 12, lineHeight: '16px' }}>
          {row.missingFields.map(missingFieldLabel).join(' / ')}
        </Text>
      ) : null}
    </Space>
  );
}
