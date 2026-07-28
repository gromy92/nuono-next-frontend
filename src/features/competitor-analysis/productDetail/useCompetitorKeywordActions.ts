import { App } from 'antd'
import { useState } from 'react'
import { normalizeError } from '../../../shared/api'
import type { ProductKeywordDetailKeyword } from '../../product-keywords/ProductKeywordDetailDrawer'
import {
  addCompetitorKeyword,
  addManualCompetitor,
  deleteCompetitorKeyword,
  updateCompetitorKeyword
} from '../api'
import { normalizeProductKeywordNorm } from '../competitorProductListModel'
import { productActionKey } from '../productList/competitorProductIdentity'
import type {
  CompetitorKeyword,
  CompetitorWatchProduct
} from '../types'
import { candidateStatusForKeyword } from './candidateModel'

export function useCompetitorKeywordActions({
  selectedProduct,
  ensureWatchProduct,
  loadProductDetail,
  mergeProduct,
  setSelectedProductId,
  setActionLoading
}: {
  selectedProduct?: CompetitorWatchProduct
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
  const [keywordProduct, setKeywordProduct] = useState<CompetitorWatchProduct>()
  const [selectedKeywordDetail, setSelectedKeywordDetail] =
    useState<ProductKeywordDetailKeyword | null>(null)
  const [keywordModalOpen, setKeywordModalOpen] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [manualKeywordId, setManualKeywordId] = useState('')

  const openManualModal = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('ensure', product))
    const readyProduct = await ensureWatchProduct(product)
    setActionLoading(null)
    if (!readyProduct?.id) return
    setSelectedProductId(readyProduct.id)
    setManualInput('')
    setManualKeywordId('')
    const detail = await loadProductDetail(readyProduct.id)
    if (!detail) return
    const activeKeywords = detail.keywords
      .filter((keyword) => keyword.status === 'active')
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
    if (!activeKeywords.length) {
      message.warning('请先维护关键词')
      setKeywordInput('')
      setManualModalOpen(false)
      setKeywordModalOpen(true)
      return
    }
    setManualKeywordId(activeKeywords[0].id)
    setManualModalOpen(true)
  }

  const openKeywordModal = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('ensure', product))
    const readyProduct = await ensureWatchProduct(product)
    setActionLoading(null)
    if (!readyProduct?.id) return
    setSelectedProductId(readyProduct.id)
    setKeywordProduct(readyProduct)
    setKeywordInput('')
    setKeywordModalOpen(true)
    const detail = await loadProductDetail(readyProduct.id)
    if (detail) setKeywordProduct(detail)
  }

  const handleAddKeyword = async () => {
    const targetProduct = keywordProduct || selectedProduct
    if (!targetProduct?.id) {
      message.warning('请先启用竞品分析')
      return
    }
    const keyword = keywordInput.trim()
    if (!keyword) return
    setActionLoading('add-keyword')
    try {
      const detail = await addCompetitorKeyword(
        targetProduct.id,
        keyword,
        `en-${targetProduct.siteCode}`
      )
      mergeProduct(detail)
      setKeywordProduct(detail)
      message.success('关键词已加入监控')
      setKeywordInput('')
    } catch (error) {
      message.error(normalizeError(error, '新增关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeywordStatusChange = async (
    keyword: CompetitorKeyword,
    status: 'active' | 'paused'
  ) => {
    setActionLoading(`keyword-status-${keyword.id}`)
    try {
      const detail = await updateCompetitorKeyword(keyword.id, {
        keyword: keyword.keyword,
        locale: keyword.locale,
        displayOrder: keyword.displayOrder,
        status
      })
      mergeProduct(detail)
      setKeywordProduct(detail)
      message.success(status === 'active' ? '关键词已启用' : '关键词已暂停')
    } catch (error) {
      message.error(normalizeError(error, '更新关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeywordDelete = async (keyword: CompetitorKeyword) => {
    setActionLoading(`keyword-delete-${keyword.id}`)
    try {
      const detail = await deleteCompetitorKeyword(keyword.id)
      mergeProduct(detail)
      setKeywordProduct(detail)
      message.success('关键词已从竞品监控移除')
    } catch (error) {
      message.error(normalizeError(error, '移除关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const openProductKeywordDetail = (
    product: CompetitorWatchProduct,
    keyword: CompetitorKeyword
  ) => {
    setSelectedKeywordDetail({
      storeCode: product.storeCode,
      siteCode: product.siteCode,
      partnerSku: product.partnerSku,
      keyword: keyword.keyword,
      keywordNorm:
        keyword.keywordNorm || normalizeProductKeywordNorm(keyword.keyword),
      competitorEvidence: true
    })
  }

  const handleManualAdd = async () => {
    if (!selectedProduct) return
    const input = manualInput.trim()
    if (!input) return
    if (!manualKeywordId) {
      message.warning('请先选择关键词')
      return
    }
    const noonProductCode =
      input.match(/[ZN][A-Z0-9]{7,79}/i)?.[0].toUpperCase() || ''
    if (
      noonProductCode &&
      selectedProduct.candidates.some(
        (candidate) =>
          candidate.noonProductCode.toUpperCase() === noonProductCode &&
          candidateStatusForKeyword(candidate, manualKeywordId) !== 'ignored'
      )
    ) {
      message.warning('竞品已存在')
      return
    }
    setActionLoading('manual-add')
    try {
      const detail = await addManualCompetitor(
        selectedProduct.id,
        input,
        manualKeywordId
      )
      mergeProduct(detail)
      message.success('手工竞品已加入确认池')
      setManualInput('')
    } catch (error) {
      message.error(normalizeError(error, '手工添加竞品失败'))
    } finally {
      setActionLoading(null)
    }
  }

  return {
    keywordProduct,
    setKeywordProduct,
    selectedKeywordDetail,
    setSelectedKeywordDetail,
    keywordModalOpen,
    setKeywordModalOpen,
    manualModalOpen,
    setManualModalOpen,
    keywordInput,
    setKeywordInput,
    manualInput,
    setManualInput,
    manualKeywordId,
    setManualKeywordId,
    openManualModal,
    openKeywordModal,
    handleAddKeyword,
    handleKeywordStatusChange,
    handleKeywordDelete,
    openProductKeywordDetail,
    handleManualAdd
  }
}
