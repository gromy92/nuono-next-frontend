import { App } from 'antd'
import { useState } from 'react'
import { normalizeError } from '../../../shared/api'
import {
  fetchCompetitorProductChanges
} from '../api'
import { loadReportRankHistory } from '../competitorRankHistory'
import { productActionKey } from '../productList/competitorProductIdentity'
import type {
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeGroup,
  CompetitorWatchProduct
} from '../types'

export function useCompetitorReport({
  ensureWatchProduct,
  loadProductDetail,
  mergeProduct,
  setSelectedProductId,
  setActionLoading
}: {
  ensureWatchProduct: (
    product: CompetitorWatchProduct
  ) => Promise<CompetitorWatchProduct | undefined>
  loadProductDetail: (
    productId: string,
    options?: { showLoading?: boolean }
  ) => Promise<CompetitorWatchProduct | undefined>
  mergeProduct: (product: CompetitorWatchProduct) => void
  setSelectedProductId: (productId: string) => void
  setActionLoading: (value: string | null) => void
}) {
  const { message } = App.useApp()
  const [reportProduct, setReportProduct] = useState<CompetitorWatchProduct>()
  const [changeRows, setChangeRows] = useState<CompetitorProductChangeGroup[]>([])
  const [changeBaselineSummary, setChangeBaselineSummary] =
    useState<CompetitorProductChangeBaselineSummary>()
  const [reportOpen, setReportOpen] = useState(false)
  const [reportRankLoading, setReportRankLoading] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)

  const openReport = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('report', product))
    const readyProduct = await ensureWatchProduct(product)
    if (!readyProduct?.id) {
      setActionLoading(null)
      return
    }
    const detailProduct = await loadProductDetail(readyProduct.id, {
      showLoading: false
    })
    setActionLoading(null)
    if (!detailProduct?.id) return
    setSelectedProductId(detailProduct.id)
    setReportProduct(detailProduct)
    setChangeRows([])
    setChangeBaselineSummary(undefined)
    setReportOpen(true)
    setReportRankLoading(true)
    loadReportRankHistory(detailProduct)
      .then(({ product: reportReadyProduct, failedCount }) => {
        setReportProduct(reportReadyProduct)
        mergeProduct(reportReadyProduct)
        if (failedCount > 0) {
          message.warning(`有 ${failedCount} 个关键词历史排名读取失败`)
        }
      })
      .catch((error) => {
        message.error(normalizeError(error, '读取历史排名失败'))
      })
      .finally(() => setReportRankLoading(false))

    setChangeLoading(true)
    try {
      const result = await fetchCompetitorProductChanges(detailProduct.id)
      setChangeRows(result.items)
      setChangeBaselineSummary(result.baselineSummary)
    } catch {
      setChangeRows([])
      setChangeBaselineSummary(undefined)
    } finally {
      setChangeLoading(false)
    }
  }

  return {
    reportProduct,
    reportOpen,
    setReportOpen,
    reportRankLoading,
    changeRows,
    changeBaselineSummary,
    changeLoading,
    openReport
  }
}
