import { message } from 'antd'
import { useCallback } from 'react'
import type { ProductListRowPayload } from '../../product-domain/productListTypes'
import {
  batchCalculateOfficialCommissionByProduct, batchCalculateOfficialOutboundFeeByEffectiveSpec,
  batchCalculateOfficialOutboundFeeByNoonOfficialSpec, calculateOfficialCommissionByProduct,
  calculateOfficialOutboundFeeByEffectiveSpec, calculateOfficialOutboundFeeByNoonOfficialSpec
} from '../api'
import {
  profitRowKey, rowSalePrice, rowSkuId, siteCodeFromStoreCode,
  type ProfitCommissionMap, type ProfitOutboundFeeMap
} from '../profitWorkspaceModel'
import type { useProfitProductData } from './useProfitProductData'

export function useProfitCalculationActions({ data, ownerUserId, defaultStoreCode, defaultSite }: {
  data: ReturnType<typeof useProfitProductData>
  ownerUserId?: number
  defaultStoreCode?: string
  defaultSite: string
}) {
  const {
    filteredRows, selectedRows, setCalculatingRowKey, setCalculatingCommissionRowKey,
    setBulkCalculating, setBulkCommissionCalculating, setOutboundFeeByRowKey,
    setNoonOutboundFeeByRowKey, setCommissionByRowKey
  } = data
  const calculateOutboundFeeForRow = useCallback(
    async (record: ProductListRowPayload) => {
      const rowKey = profitRowKey(record);
      const storeCode = record.referenceStoreCode || defaultStoreCode;
      const site = siteCodeFromStoreCode(storeCode) || defaultSite;
      const skuId = rowSkuId(record);
      if (!ownerUserId || !storeCode) {
        throw new Error('缺少老板账号或店铺上下文，无法计算出舱费。');
      }
      if (!skuId) {
        throw new Error('当前商品行缺少 partnerSku，无法按 SKU 计算出舱费。');
      }
      setCalculatingRowKey(rowKey);
      try {
        const result = await calculateOfficialOutboundFeeByEffectiveSpec({
          ownerUserId,
          storeCode,
          skuId,
          site,
          salePrice: rowSalePrice(record)
        });
        setOutboundFeeByRowKey((currentValue) => ({
          ...currentValue,
          [rowKey]: result
        }));
        void calculateOfficialOutboundFeeByNoonOfficialSpec({
          ownerUserId,
          storeCode,
          skuId,
          site,
          salePrice: rowSalePrice(record)
        }).then((noonResult) => {
          setNoonOutboundFeeByRowKey((currentValue) => ({
            ...currentValue,
            [rowKey]: noonResult
          }));
        });
        if (result.status === 'CALCULATED') {
          message.success(`${skuId} 出舱费已计算：${result.feeAmount ?? '-'} ${result.currency || ''}`);
        } else {
          message.warning(`${skuId} 出舱费未计算成功：${result.message || result.failureCode || '-'}`);
        }
        return result;
      } finally {
        setCalculatingRowKey(null);
      }
    },
    [defaultSite, defaultStoreCode, ownerUserId]
  );

  const calculateCommissionForRow = useCallback(
    async (record: ProductListRowPayload) => {
      const rowKey = profitRowKey(record);
      const storeCode = record.referenceStoreCode || defaultStoreCode;
      const site = siteCodeFromStoreCode(storeCode) || defaultSite;
      const skuId = rowSkuId(record);
      if (!ownerUserId || !storeCode) {
        throw new Error('缺少老板账号或店铺上下文，无法计算佣金。');
      }
      if (!skuId) {
        throw new Error('当前商品行缺少 partnerSku，无法按 SKU 计算佣金。');
      }
      setCalculatingCommissionRowKey(rowKey);
      try {
        const result = await calculateOfficialCommissionByProduct({
          ownerUserId,
          storeCode,
          skuId,
          site,
          salePrice: rowSalePrice(record)
        });
        setCommissionByRowKey((currentValue) => ({
          ...currentValue,
          [rowKey]: result
        }));
        if (result.status === 'CALCULATED') {
          message.success(`${skuId} 佣金已计算：${result.taxIncludedCommissionAmount ?? result.commissionAmount ?? '-'} ${result.currency || ''}`);
        } else {
          message.warning(`${skuId} 佣金未计算成功：${result.message || result.failureCode || '-'}`);
        }
        return result;
      } finally {
        setCalculatingCommissionRowKey(null);
      }
    },
    [defaultSite, defaultStoreCode, ownerUserId]
  );

  const calculateSelectedOutboundFees = useCallback(async () => {
    const targetRows = selectedRows.length ? selectedRows : filteredRows;
    if (!targetRows.length) {
      message.warning('当前没有可计算的商品。');
      return;
    }
    setBulkCalculating(true);
    try {
      if (!ownerUserId || !defaultStoreCode) {
        throw new Error('缺少老板账号或店铺上下文，无法批量计算出舱费。');
      }
      const validRows = targetRows.filter((row) => rowSkuId(row));
      if (!validRows.length) {
        message.warning('当前商品行缺少 partnerSku，无法按 SKU 批量计算出舱费。');
        return;
      }
      const results = await batchCalculateOfficialOutboundFeeByEffectiveSpec({
        ownerUserId,
        storeCode: defaultStoreCode,
        site: defaultSite,
        items: validRows.map((row) => ({
          skuId: rowSkuId(row),
          site: siteCodeFromStoreCode(row.referenceStoreCode || defaultStoreCode) || defaultSite,
          salePrice: rowSalePrice(row)
        }))
      });
      const resultBySkuId = new Map(results.map((result) => [result.skuId, result]));
      const nextOutboundFeeByRowKey: ProfitOutboundFeeMap = {};
      validRows.forEach((row) => {
        const result = resultBySkuId.get(rowSkuId(row));
        if (result) {
          nextOutboundFeeByRowKey[profitRowKey(row)] = result;
        }
      });
      setOutboundFeeByRowKey((currentValue) => ({
        ...currentValue,
        ...nextOutboundFeeByRowKey
      }));
      try {
        const noonResults = await batchCalculateOfficialOutboundFeeByNoonOfficialSpec({
          ownerUserId,
          storeCode: defaultStoreCode,
          site: defaultSite,
          items: validRows.map((row) => ({
            skuId: rowSkuId(row),
            site: siteCodeFromStoreCode(row.referenceStoreCode || defaultStoreCode) || defaultSite,
            salePrice: rowSalePrice(row)
          }))
        });
        const noonResultBySkuId = new Map(noonResults.map((result) => [result.skuId, result]));
        const nextNoonOutboundFeeByRowKey: ProfitOutboundFeeMap = {};
        validRows.forEach((row) => {
          const result = noonResultBySkuId.get(rowSkuId(row));
          if (result) {
            nextNoonOutboundFeeByRowKey[profitRowKey(row)] = result;
          }
        });
        setNoonOutboundFeeByRowKey((currentValue) => ({
          ...currentValue,
          ...nextNoonOutboundFeeByRowKey
        }));
      } catch (error) {
        message.warning(error instanceof Error ? error.message : 'Noon 官方尺寸出舱费批量计算失败');
      }
      const successCount = results.filter((result) => result.status === 'CALCULATED').length;
      const failedCount = results.length - successCount;
      message.info(`批量出舱费计算完成：成功 ${successCount}，失败 ${failedCount}。`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量出舱费计算失败');
    } finally {
      setBulkCalculating(false);
    }
  }, [defaultSite, defaultStoreCode, filteredRows, ownerUserId, selectedRows]);

  const calculateSelectedCommissions = useCallback(async () => {
    const targetRows = selectedRows.length ? selectedRows : filteredRows;
    if (!targetRows.length) {
      message.warning('当前没有可计算的商品。');
      return;
    }
    setBulkCommissionCalculating(true);
    try {
      if (!ownerUserId || !defaultStoreCode) {
        throw new Error('缺少老板账号或店铺上下文，无法批量计算佣金。');
      }
      const validRows = targetRows.filter((row) => rowSkuId(row));
      if (!validRows.length) {
        message.warning('当前商品行缺少 partnerSku，无法按 SKU 批量计算佣金。');
        return;
      }
      const results = await batchCalculateOfficialCommissionByProduct({
        ownerUserId,
        storeCode: defaultStoreCode,
        site: defaultSite,
        items: validRows.map((row) => ({
          skuId: rowSkuId(row),
          site: siteCodeFromStoreCode(row.referenceStoreCode || defaultStoreCode) || defaultSite,
          salePrice: rowSalePrice(row)
        }))
      });
      const resultBySkuId = new Map(results.map((result) => [result.skuId, result]));
      const nextCommissionByRowKey: ProfitCommissionMap = {};
      validRows.forEach((row) => {
        const result = resultBySkuId.get(rowSkuId(row));
        if (result) {
          nextCommissionByRowKey[profitRowKey(row)] = result;
        }
      });
      setCommissionByRowKey((currentValue) => ({
        ...currentValue,
        ...nextCommissionByRowKey
      }));
      const successCount = results.filter((result) => result.status === 'CALCULATED').length;
      const failedCount = results.length - successCount;
      if (successCount === 0 && failedCount > 0) {
        message.warning(`批量佣金计算完成：成功 0，失败 ${failedCount}。请检查类目/品牌是否命中佣金规则。`);
      } else {
        message.info(`批量佣金计算完成：成功 ${successCount}，失败 ${failedCount}。`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量佣金计算失败');
    } finally {
      setBulkCommissionCalculating(false);
    }
  }, [defaultSite, defaultStoreCode, filteredRows, ownerUserId, selectedRows]);
  return {
    calculateOutboundFeeForRow, calculateCommissionForRow,
    calculateSelectedOutboundFees, calculateSelectedCommissions
  }
}
