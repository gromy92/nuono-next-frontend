import { useState } from 'react'
import type { ProductListRowPayload } from '../../product-domain/productListTypes'
import {
  calculateOfficialOutboundFeeByNoonOfficialSpec,
  fetchActualOutboundFeeOrderGroups
} from '../api'
import {
  defaultHistoryDateRange,
  rowSalePrice,
  rowSkuId,
  siteCodeFromStoreCode
} from '../profitPageDomain'
import type {
  CommissionDetailState,
  OutboundFeeDetailState,
  ProfitCalculatorPageProps
} from '../profitPageTypes'
import { profitRowKey } from '../profitWorkspaceModel'

export function useProfitDetailState({
  ownerUserId,
  defaultStoreCode,
  defaultSite
}: Pick<ProfitCalculatorPageProps, 'ownerUserId' | 'defaultStoreCode' | 'defaultSite'>) {
  const [detailState, setDetailState] = useState<OutboundFeeDetailState | null>(null)
  const [commissionDetailState, setCommissionDetailState] =
    useState<CommissionDetailState | null>(null)

  function openOutboundFeeDetail(record: ProductListRowPayload) {
    const rowKey = profitRowKey(record)
    const storeCode = record.referenceStoreCode || defaultStoreCode || ''
    const site = siteCodeFromStoreCode(storeCode) || defaultSite
    const skuId = rowSkuId(record)
    const { dateFrom, dateTo } = defaultHistoryDateRange()
    setDetailState({
      rowKey, record, storeCode, site, skuId, dateFrom, dateTo,
      noonOfficialLoading: Boolean(ownerUserId && storeCode && skuId),
      noonOfficialResult: undefined,
      noonOfficialError: !ownerUserId || !storeCode || !skuId
        ? '缺少老板账号、店铺或 SKU，无法计算 Noon 官方尺寸出舱费。'
        : undefined,
      historyLoading: Boolean(storeCode && skuId),
      historyGroups: [],
      historyError: !storeCode || !skuId
        ? '缺少店铺或 SKU，无法读取历史出舱费记录。'
        : undefined
    })
    if (ownerUserId && storeCode && skuId) {
      void calculateOfficialOutboundFeeByNoonOfficialSpec({
        ownerUserId, storeCode, site, skuId, salePrice: rowSalePrice(record)
      }).then((result) => {
        setDetailState((current) => current?.rowKey === rowKey ? {
          ...current,
          noonOfficialLoading: false,
          noonOfficialResult: result,
          noonOfficialError: undefined
        } : current)
      }).catch((error) => {
        setDetailState((current) => current?.rowKey === rowKey ? {
          ...current,
          noonOfficialLoading: false,
          noonOfficialError: error instanceof Error
            ? error.message
            : 'Noon 官方尺寸出舱费计算失败。'
        } : current)
      })
    }
    if (storeCode && skuId) {
      void fetchActualOutboundFeeOrderGroups({
        storeCode, siteCode: site, partnerSku: skuId, dateFrom, dateTo
      }).then((groups) => {
        setDetailState((current) => current?.rowKey === rowKey ? {
          ...current,
          historyLoading: false,
          historyGroups: groups,
          historyError: undefined
        } : current)
      }).catch((error) => {
        setDetailState((current) => current?.rowKey === rowKey ? {
          ...current,
          historyLoading: false,
          historyError: error instanceof Error
            ? error.message
            : '历史出舱费记录加载失败。'
        } : current)
      })
    }
  }

  function openCommissionDetail(record: ProductListRowPayload) {
    const rowKey = profitRowKey(record)
    const storeCode = record.referenceStoreCode || defaultStoreCode || ''
    const site = siteCodeFromStoreCode(storeCode) || defaultSite
    const skuId = rowSkuId(record)
    const { dateFrom, dateTo } = defaultHistoryDateRange()
    setCommissionDetailState({
      rowKey, record, storeCode, site, skuId, dateFrom, dateTo,
      historyLoading: Boolean(storeCode && skuId),
      historyGroups: [],
      historyError: !storeCode || !skuId
        ? '缺少店铺或 SKU，无法读取历史佣金记录。'
        : undefined
    })
    if (storeCode && skuId) {
      void fetchActualOutboundFeeOrderGroups({
        storeCode, siteCode: site, partnerSku: skuId, dateFrom, dateTo
      }).then((groups) => {
        setCommissionDetailState((current) => current?.rowKey === rowKey ? {
          ...current,
          historyLoading: false,
          historyGroups: groups,
          historyError: undefined
        } : current)
      }).catch((error) => {
        setCommissionDetailState((current) => current?.rowKey === rowKey ? {
          ...current,
          historyLoading: false,
          historyError: error instanceof Error ? error.message : '历史佣金记录加载失败。'
        } : current)
      })
    }
  }

  return {
    detailState,
    commissionDetailState,
    openOutboundFeeDetail,
    openCommissionDetail,
    closeOutboundFeeDetail: () => setDetailState(null),
    closeCommissionDetail: () => setCommissionDetailState(null)
  }
}
