import { Empty, Space, Spin, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { fetchProductVariantSpecs, saveProductVariantSpec } from '../../product-specs/api';
import type { ProductVariantSpecPayload } from '../../product-specs/types';
import { textInputValue } from '../utils/common';
import { ProductVariantSpecEditor } from './ProductVariantSpecEditor';
import { specRowKey } from './productVariantSpecModel';

export type ProductVariantSpecScope = {
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
  variantId?: number;
};

type ProductVariantSpecTableProps = {
  scope?: ProductVariantSpecScope;
  onSaved?: (saved: ProductVariantSpecPayload) => void;
};

export function ProductVariantSpecTable({ scope, onSaved }: ProductVariantSpecTableProps) {
  const [rows, setRows] = useState<ProductVariantSpecPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string>();
  const [savedKey, setSavedKey] = useState<string>();

  const ownerUserId = Number(scope?.ownerUserId) || undefined;
  const storeCode = textInputValue(scope?.storeCode).trim();
  const currentZCode = textInputValue(scope?.currentZCode || scope?.skuParent).trim();
  const partnerSku = textInputValue(scope?.partnerSku).trim();

  useEffect(() => {
    if (!ownerUserId || !storeCode || !(partnerSku || currentZCode)) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setRows([]);
    setLoading(true);
    void fetchProductVariantSpecs({ ownerUserId, storeCode, partnerSku, currentZCode, skuParent: currentZCode })
      .then((payload) => {
        if (!cancelled) setRows(payload.items ?? []);
      })
      .catch((error) => {
        if (!cancelled) message.warning(error instanceof Error ? error.message : '商品规格读取失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentZCode, ownerUserId, partnerSku, storeCode]);

  const updateRow = useCallback((rowKey: string, patch: Partial<ProductVariantSpecPayload>) => {
    setRows((currentRows) => currentRows.map((row) => (specRowKey(row) === rowKey ? { ...row, ...patch } : row)));
  }, []);

  const saveRow = useCallback(
    async (row: ProductVariantSpecPayload) => {
      const rowPartnerSku = textInputValue(row.partnerSku || partnerSku).trim();
      const rowCurrentZCode = textInputValue(row.currentZCode || row.skuParent || currentZCode).trim();
      if (!ownerUserId || !storeCode || !(rowPartnerSku || row.variantId)) {
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
          skuParent: rowCurrentZCode,
          currentZCode: rowCurrentZCode,
          partnerSku: rowPartnerSku || undefined
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
    [currentZCode, onSaved, ownerUserId, partnerSku, storeCode, updateRow]
  );

  useEffect(() => {
    if (!savedKey) return undefined;
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
