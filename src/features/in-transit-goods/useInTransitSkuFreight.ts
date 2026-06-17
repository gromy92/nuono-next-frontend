import { useState } from 'react'
import { message } from 'antd'
import {
  fetchInTransitForwarderFreightComparison,
  fetchInTransitSkuFreightHistory
} from './api'
import type {
  InTransitBoxDetailTabRequest,
  InTransitForwarderFreightComparisonRow,
  InTransitSkuFreightCostHistoryRow
} from './types'
import type { InTransitProductGroup } from './InTransitGoodsPage.models'

export function useInTransitSkuFreight(boxDetailRequest?: InTransitBoxDetailTabRequest | null) {
  const [skuFreightDrawerOpen, setSkuFreightDrawerOpen] = useState(false)
  const [skuFreightContext, setSkuFreightContext] = useState<{ psku: string; targetSiteCode: string } | null>(null)
  const [skuFreightHistory, setSkuFreightHistory] = useState<InTransitSkuFreightCostHistoryRow[]>([])
  const [forwarderFreightComparison, setForwarderFreightComparison] = useState<InTransitForwarderFreightComparisonRow[]>([])
  const [loadingSkuFreight, setLoadingSkuFreight] = useState(false)

  const closeSkuFreightDrawer = () => {
    setSkuFreightDrawerOpen(false)
    setSkuFreightContext(null)
    setSkuFreightHistory([])
    setForwarderFreightComparison([])
  }

  const openSkuFreightHistory = async (row: InTransitProductGroup) => {
    const targetSiteCode = row.lines.find((line) => line.siteCode?.trim())?.siteCode?.trim()
    if (!targetSiteCode) {
      message.error('缺少站点，无法查询 SKU 运费历史')
      return
    }
    const context = { psku: row.psku, targetSiteCode }
    setSkuFreightContext(context)
    setSkuFreightHistory([])
    setForwarderFreightComparison([])
    setSkuFreightDrawerOpen(true)
    setLoadingSkuFreight(true)
    try {
      const [history, comparison] = await Promise.all([
        fetchInTransitSkuFreightHistory(context),
        fetchInTransitForwarderFreightComparison({
          ...context,
          transportMode: boxDetailRequest?.batch.transportMode ?? undefined,
          destinationCode: boxDetailRequest?.batch.targetStoreCode ?? undefined
        })
      ])
      setSkuFreightHistory(history.items ?? [])
      setForwarderFreightComparison(comparison.items ?? [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'SKU 运费历史加载失败')
    } finally {
      setLoadingSkuFreight(false)
    }
  }

  return {
    skuFreightDrawerOpen,
    skuFreightContext,
    skuFreightHistory,
    forwarderFreightComparison,
    loadingSkuFreight,
    closeSkuFreightDrawer,
    openSkuFreightHistory
  }
}
