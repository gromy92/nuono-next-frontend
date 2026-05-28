import { Button, InputNumber, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductVariantSpecs, saveProductVariantSpec } from '../api';
import type {
  ProductMasterSnapshotPayload,
  ProductVariantSpecLogisticsValue,
  ProductVariantSpecPayload
} from '../types';
import { formatSnapshotValue, textInputValue } from '../utils/common';

const { Text } = Typography;

type ProductVariantSpecTableProps = {
  productSnapshotView?: ProductMasterSnapshotPayload;
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

export function ProductVariantSpecTable({ productSnapshotView }: ProductVariantSpecTableProps) {
  const [rows, setRows] = useState<ProductVariantSpecPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string>();

  const ownerUserId = Number(textInputValue(productSnapshotView?.storeContext.ownerUserId)) || undefined;
  const storeCode = textInputValue(productSnapshotView?.storeContext.storeCode).trim();
  const skuParent = textInputValue(productSnapshotView?.identity.skuParent).trim();

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
        message.success('规格已保存');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '保存商品规格失败');
      } finally {
        setSavingKey(undefined);
      }
    },
    [ownerUserId, skuParent, storeCode, updateRow]
  );

  const columns = useMemo<ColumnsType<ProductVariantSpecPayload>>(
    () => [
      {
        title: 'SKU',
        key: 'sku',
        width: 220,
        fixed: 'left',
        render: (_: unknown, row) => (
          <Space direction="vertical" size={2}>
            <Text strong>{formatSnapshotValue(row.partnerSku)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Child {formatSnapshotValue(row.childSku)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Size {formatSnapshotValue(row.sizeEn || row.sizeAr)}
            </Text>
          </Space>
        )
      },
      numberColumn('产品长', 'productLengthCm', 'cm', updateRow, savingKey),
      numberColumn('产品宽', 'productWidthCm', 'cm', updateRow, savingKey),
      numberColumn('产品高', 'productHeightCm', 'cm', updateRow, savingKey),
      numberColumn('产品重量', 'productWeightG', 'g', updateRow, savingKey),
      numberColumn('外箱长', 'cartonLengthCm', 'cm', updateRow, savingKey),
      numberColumn('外箱宽', 'cartonWidthCm', 'cm', updateRow, savingKey),
      numberColumn('外箱高', 'cartonHeightCm', 'cm', updateRow, savingKey),
      numberColumn('外箱重量', 'cartonWeightKg', 'kg', updateRow, savingKey, 3),
      numberColumn('箱装数', 'cartonQuantity', '件', updateRow, savingKey, 0),
      selectColumn('带电/磁', 'batteryMagneticType', batteryOptions, updateRow, savingKey),
      selectColumn('液体/粉末', 'liquidPowderType', liquidOptions, updateRow, savingKey),
      {
        title: '状态',
        key: 'status',
        width: 170,
        render: (_: unknown, row) => (
          <Space direction="vertical" size={4}>
            <Tag color={row.completenessStatus === 'ready' ? 'success' : 'warning'}>
              {statusLabel(row.completenessStatus)}
            </Tag>
            {row.missingFields?.length ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.missingFields.map(missingFieldLabel).join(' / ')}
              </Text>
            ) : null}
          </Space>
        )
      },
      {
        title: '操作',
        key: 'actions',
        width: 96,
        fixed: 'right',
        render: (_: unknown, row) => (
          <Button
            size="small"
            type="primary"
            loading={savingKey === specRowKey(row)}
            disabled={Boolean(savingKey)}
            onClick={() => void saveRow(row)}
          >
            保存
          </Button>
        )
      }
    ],
    [saveRow, savingKey, updateRow]
  );

  return (
    <Table
      size="small"
      loading={loading}
      pagination={false}
      rowKey={specRowKey}
      dataSource={rows}
      columns={columns}
      scroll={{ x: 1720 }}
    />
  );
}

function specRowKey(row: ProductVariantSpecPayload) {
  return [row.variantId, row.partnerSku, row.childSku].map((value) => textInputValue(value).trim()).join(':');
}

function numberColumn(
  title: string,
  field: NumericSpecField,
  unit: string,
  updateRow: (rowKey: string, patch: Partial<ProductVariantSpecPayload>) => void,
  savingKey?: string,
  precision = 2
): ColumnsType<ProductVariantSpecPayload>[number] {
  return {
    title,
    key: field,
    width: 130,
    render: (_: unknown, row) => (
      <InputNumber
        min={precision === 0 ? 1 : 0.01}
        precision={precision}
        addonAfter={unit}
        value={row[field] ?? null}
        disabled={savingKey === specRowKey(row)}
        style={{ width: '100%' }}
        onChange={(value) =>
          updateRow(specRowKey(row), { [field]: typeof value === 'number' ? value : undefined } as Partial<ProductVariantSpecPayload>)
        }
      />
    )
  };
}

function selectColumn(
  title: string,
  field: 'batteryMagneticType' | 'liquidPowderType',
  options: Array<{ label: string; value: ProductVariantSpecLogisticsValue }>,
  updateRow: (rowKey: string, patch: Partial<ProductVariantSpecPayload>) => void,
  savingKey?: string
): ColumnsType<ProductVariantSpecPayload>[number] {
  return {
    title,
    key: field,
    width: 140,
    render: (_: unknown, row) => (
      <Select<ProductVariantSpecLogisticsValue>
        value={row[field] ?? 'unknown'}
        options={options}
        disabled={savingKey === specRowKey(row)}
        style={{ width: '100%' }}
        onChange={(value) => updateRow(specRowKey(row), { [field]: value } as Partial<ProductVariantSpecPayload>)}
      />
    )
  };
}

function statusLabel(status?: string) {
  return status ? statusLabels[status] ?? status : '缺规格';
}

function missingFieldLabel(field: string) {
  return missingFieldLabels[field] ?? field;
}
