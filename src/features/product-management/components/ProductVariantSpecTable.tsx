import { Button, Empty, InputNumber, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { fetchProductVariantSpecs, saveProductVariantSpec } from '../api';
import type { ProductVariantSpecLogisticsValue, ProductVariantSpecPayload } from '../types';
import { formatSnapshotValue, textInputValue } from '../utils/common';

const { Text } = Typography;

export type ProductVariantSpecScope = {
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
};

type ProductVariantSpecTableProps = {
  scope?: ProductVariantSpecScope;
  onSaved?: (saved: ProductVariantSpecPayload) => void;
};

type NumericSpecField =
  | 'productLengthCm'
  | 'productWidthCm'
  | 'productHeightCm'
  | 'productWeightG'
  | 'cartonLengthCm'
  | 'cartonWidthCm'
  | 'cartonHeightCm'
  | 'cartonWeightKg'
  | 'cartonQuantity';

type NumericSpecConfig = {
  label: string;
  field: NumericSpecField;
  unit: string;
  precision?: number;
};

const batteryOptions: Array<{ label: string; value: ProductVariantSpecLogisticsValue }> = [
  { label: '待确认', value: 'unknown' },
  { label: '无', value: 'none' },
  { label: '带电', value: 'battery' },
  { label: '带磁', value: 'magnetic' },
  { label: '带电+带磁', value: 'battery_and_magnetic' }
];

const liquidOptions: Array<{ label: string; value: ProductVariantSpecLogisticsValue }> = [
  { label: '待确认', value: 'unknown' },
  { label: '无', value: 'none' },
  { label: '液体', value: 'liquid' },
  { label: '粉末', value: 'powder' },
  { label: '液体+粉末', value: 'liquid_and_powder' }
];

const statusLabels: Record<string, string> = {
  ready: '完整',
  missing_dimensions: '缺尺寸',
  missing_weight: '缺重量',
  missing_carton_quantity: '缺箱装数',
  logistics_attribute_unknown: '物流属性待确认',
  not_found: '未维护'
};

const missingFieldLabels: Record<string, string> = {
  spec_not_found: '未维护',
  dimensions: '尺寸',
  weight: '重量',
  logistics_attribute: '物流属性',
  product_length_cm: '产品长',
  product_width_cm: '产品宽',
  product_height_cm: '产品高',
  product_weight_g: '产品重量',
  carton_length_cm: '外箱长',
  carton_width_cm: '外箱宽',
  carton_height_cm: '外箱高',
  carton_weight_kg: '外箱重量',
  carton_quantity: '箱装数',
  battery_magnetic_type: '带电/磁',
  liquid_powder_type: '液体/粉末'
};

const productSpecFields: NumericSpecConfig[] = [
  { label: '产品长', field: 'productLengthCm', unit: 'cm' },
  { label: '产品宽', field: 'productWidthCm', unit: 'cm' },
  { label: '产品高', field: 'productHeightCm', unit: 'cm' },
  { label: '产品重量', field: 'productWeightG', unit: 'g' }
];

const cartonSpecFields: NumericSpecConfig[] = [
  { label: '外箱长', field: 'cartonLengthCm', unit: 'cm' },
  { label: '外箱宽', field: 'cartonWidthCm', unit: 'cm' },
  { label: '外箱高', field: 'cartonHeightCm', unit: 'cm' },
  { label: '外箱重量', field: 'cartonWeightKg', unit: 'kg', precision: 3 },
  { label: '箱装数', field: 'cartonQuantity', unit: '件', precision: 0 }
];

export function ProductVariantSpecTable({ scope, onSaved }: ProductVariantSpecTableProps) {
  const [rows, setRows] = useState<ProductVariantSpecPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string>();
  const [savedKey, setSavedKey] = useState<string>();

  const ownerUserId = Number(scope?.ownerUserId) || undefined;
  const storeCode = textInputValue(scope?.storeCode).trim();
  const skuParent = textInputValue(scope?.skuParent).trim();

  useEffect(() => {
    if (!ownerUserId || !storeCode || !skuParent) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setRows([]);
    setLoading(true);
    void fetchProductVariantSpecs({ ownerUserId, storeCode, skuParent })
      .then((payload) => {
        if (!cancelled) {
          setRows(payload.items ?? []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.warning(error instanceof Error ? error.message : '商品规格读取失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ownerUserId, storeCode, skuParent]);

  const updateRow = useCallback((rowKey: string, patch: Partial<ProductVariantSpecPayload>) => {
    setRows((currentRows) => currentRows.map((row) => (specRowKey(row) === rowKey ? { ...row, ...patch } : row)));
  }, []);

  const saveRow = useCallback(
    async (row: ProductVariantSpecPayload) => {
      const partnerSku = textInputValue(row.partnerSku).trim();
      if (!ownerUserId || !storeCode || !skuParent || !partnerSku) {
        message.warning('缺少商品或 SKU 上下文，无法保存规格');
        return;
      }

      const rowKey = specRowKey(row);
      setSavedKey(undefined);
      setSavingKey(rowKey);
      try {
        const saved = await saveProductVariantSpec({
          ...row,
          ownerUserId,
          storeCode,
          skuParent,
          partnerSku
        });
        updateRow(rowKey, saved);
        setSavedKey(rowKey);
        onSaved?.(saved);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '保存商品规格失败');
      } finally {
        setSavingKey(undefined);
      }
    },
    [onSaved, ownerUserId, skuParent, storeCode, updateRow]
  );

  useEffect(() => {
    if (!savedKey) {
      return undefined;
    }
    const timer = window.setTimeout(() => setSavedKey(undefined), 1800);
    return () => window.clearTimeout(timer);
  }, [savedKey]);

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {rows.length ? (
          rows.map((row) => (
            <ProductVariantSpecEditor
              key={specRowKey(row)}
              row={row}
              showVariantHeader={rows.length > 1}
              savingKey={savingKey}
              savedKey={savedKey}
              updateRow={updateRow}
              saveRow={saveRow}
            />
          ))
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可维护的 SKU 规格" />
        )}
      </Space>
    </Spin>
  );
}

function ProductVariantSpecEditor(props: {
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
    <div
      style={{
        border: '1px solid #eef2f7',
        borderRadius: 6,
        background: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {showVariantHeader ? (
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: '#f8fafc',
            borderBottom: '1px solid #eef2f7'
          }}
        >
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

function specRowKey(row: ProductVariantSpecPayload) {
  return [row.variantId, row.partnerSku, row.childSku].map((value) => textInputValue(value).trim()).join(':');
}

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
  options: Array<{ label: string; value: ProductVariantSpecLogisticsValue }>;
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

function ProductVariantSpecField(props: {
  label: string;
  children: ReactNode;
}) {
  const { label, children } = props;
  return (
    <label style={{ display: 'grid', gap: 4, minWidth: 0 }}>
      <Text type="secondary" style={{ fontSize: 12, lineHeight: '18px' }}>
        {label}
      </Text>
      {children}
    </label>
  );
}

function ProductVariantSpecGroupLabel({ title }: { title: string }) {
  return (
    <Text strong style={{ alignSelf: 'center', color: '#334155', fontSize: 13 }}>
      {title}
    </Text>
  );
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

function statusLabel(status?: string) {
  return status ? statusLabels[status] ?? status : '缺规格';
}

function missingFieldLabel(field: string) {
  return missingFieldLabels[field] ?? field;
}
