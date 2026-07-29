import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { officialWarehouseError } from './api'
import {
  loadOfficialWarehouseInboundStatistics,
  loadOfficialWarehouseProductInboundHistory,
  loadOfficialWarehouseStockStatistics
} from './statisticsApi'
import { buildProductStockSourceChain, inferProductStockSourceByTotal } from './statisticsDomain'
import type { ProductStockSourceChainSegment } from './statisticsDomain'
import type { OfficialWarehouseStockStatisticsRow } from './statisticsTypes'
import {
  EMPTY_INBOUND_STATS,
  EMPTY_PRODUCT_INBOUND_HISTORY,
  EMPTY_STOCK_STATS,
  type OfficialWarehouseStatisticsPanelMode,
  type OfficialWarehouseStatisticsTabKey
} from './officialWarehouseStatisticsModel'

export function useOfficialWarehouseStatistics(
  storeCode?: string,
  siteCode?: string,
  mode: OfficialWarehouseStatisticsPanelMode = 'all'
) {
  const visibleTabs = useMemo<OfficialWarehouseStatisticsTabKey[]>(
    () => (mode === 'product' ? ['product'] : mode === 'inbound' ? ['inbound'] : ['product', 'inbound']),
    [mode]
  )
  const [activeTab, setActiveTab] = useState<OfficialWarehouseStatisticsTabKey>(
    mode === 'inbound' ? 'inbound' : 'product'
  )
  const [stockStats, setStockStats] = useState(EMPTY_STOCK_STATS)
  const [inboundStats, setInboundStats] = useState(EMPTY_INBOUND_STATS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [stockKeyword, setStockKeyword] = useState('')
  const [inboundKeyword, setInboundKeyword] = useState('')
  const [stockBucket, setStockBucket] = useState<string | undefined>('SELLABLE')
  const [selectedStockRow, setSelectedStockRow] = useState<OfficialWarehouseStockStatisticsRow>()
  const [selectedSourceSegment, setSelectedSourceSegment] = useState<ProductStockSourceChainSegment>()
  const [productHistory, setProductHistory] = useState(EMPTY_PRODUCT_INBOUND_HISTORY)
  const [historyLoading, setHistoryLoading] = useState(false)

  const currentTab = visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0]
  const shouldShowProduct = visibleTabs.includes('product')
  const shouldShowInbound = visibleTabs.includes('inbound')

  useEffect(() => {
    void loadStatistics()
  }, [storeCode, siteCode, stockBucket, mode])

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0])
    }
  }, [activeTab, visibleTabs])

  async function loadStatistics() {
    if (!storeCode || !siteCode) {
      setStockStats(EMPTY_STOCK_STATS)
      setInboundStats(EMPTY_INBOUND_STATS)
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const [stock, inbound] = await Promise.all([
        shouldShowProduct
          ? loadOfficialWarehouseStockStatistics({ storeCode, siteCode, keyword: stockKeyword, stockBucket })
          : Promise.resolve(EMPTY_STOCK_STATS),
        shouldShowInbound
          ? loadOfficialWarehouseInboundStatistics({ storeCode, siteCode, keyword: inboundKeyword })
          : Promise.resolve(EMPTY_INBOUND_STATS)
      ])
      setStockStats(stock)
      setInboundStats(inbound)
    } catch (loadError) {
      const text = officialWarehouseError(loadError, '读取官方仓统计失败')
      setError(text)
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  async function openProductHistory(row: OfficialWarehouseStockStatisticsRow) {
    if (!storeCode || !siteCode || !(row.partnerSku || row.productSiteOfferId)) {
      message.warning('当前商品缺少 PSKU，无法查看入仓历史')
      return
    }
    setSelectedStockRow(row)
    setProductHistory(EMPTY_PRODUCT_INBOUND_HISTORY)
    setHistoryLoading(true)
    try {
      const history = await loadOfficialWarehouseProductInboundHistory({
        storeCode,
        siteCode,
        partnerSku: row.partnerSku,
        productSiteOfferId: row.productSiteOfferId
      })
      setProductHistory(history)
    } catch (historyError) {
      message.error(officialWarehouseError(historyError, '读取商品入仓历史失败'))
    } finally {
      setHistoryLoading(false)
    }
  }

  const productSourceInference = useMemo(
    () => inferProductStockSourceByTotal(selectedStockRow?.currentStock || 0, productHistory.rows),
    [selectedStockRow?.currentStock, productHistory.rows]
  )
  const productSourceChain = useMemo(
    () => buildProductStockSourceChain(productSourceInference, productHistory.sourceCandidates),
    [productHistory.sourceCandidates, productSourceInference]
  )

  function closeProductHistory() {
    setSelectedStockRow(undefined)
    setSelectedSourceSegment(undefined)
    setProductHistory(EMPTY_PRODUCT_INBOUND_HISTORY)
  }

  return {
    visibleTabs,
    activeTab,
    setActiveTab,
    currentTab,
    shouldShowProduct,
    shouldShowInbound,
    stockStats,
    inboundStats,
    loading,
    error,
    stockKeyword,
    setStockKeyword,
    inboundKeyword,
    setInboundKeyword,
    stockBucket,
    setStockBucket,
    selectedStockRow,
    selectedSourceSegment,
    setSelectedSourceSegment,
    productHistory,
    historyLoading,
    productSourceChain,
    loadStatistics,
    openProductHistory,
    closeProductHistory
  }
}
