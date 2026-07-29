import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  linkAli1688HistoricalOrderProduct,
  linkAli1688HistoricalOrderProductBatch,
  loadAli1688HistoricalOrderProductLinkCandidates,
  unlinkAli1688HistoricalOrderProduct
} from '../api'
import type {
  Ali1688HistoricalOrderProductLinkCandidate,
  Ali1688HistoricalOrderQuery
} from '../types'
import type {
  ProductLineRow,
  ProductLinkStatusFilter
} from '../model/pageTypes'
import {
  canLinkProductLine,
  canMarkDiscontinuedProductLine
} from '../model/productLineEligibility'
import {
  filterProductLinkCandidates
} from '../model/productLinkModel'
import { markAli1688RowsDiscontinued } from '../model/markDiscontinued'

export function useAli1688ProductLinkWorkflow({
  canMutateProductLinks,
  query,
  reloadWorkbench,
  clearSelectedLines,
  closeAction
}: {
  canMutateProductLinks: boolean
  query: Ali1688HistoricalOrderQuery
  reloadWorkbench: (query: Ali1688HistoricalOrderQuery) => Promise<unknown>
  clearSelectedLines: () => void
  closeAction: () => void
}) {
  const [productLinkRow, setProductLinkRow] =
    useState<ProductLineRow | null>(null)
  const [productLinkRows, setProductLinkRows] = useState<ProductLineRow[]>([])
  const [productLinkCandidates, setProductLinkCandidates] = useState<
    Ali1688HistoricalOrderProductLinkCandidate[]
  >([])
  const [productLinkStatusFilter, setProductLinkStatusFilter] =
    useState<ProductLinkStatusFilter>('all')
  const [productLinkSearch, setProductLinkSearch] = useState('')
  const [selectedProductCandidate, setSelectedProductCandidate] =
    useState<Ali1688HistoricalOrderProductLinkCandidate | null>(null)
  const [productLinkLoading, setProductLinkLoading] = useState(false)
  const [productLinkSubmitting, setProductLinkSubmitting] = useState(false)
  const [productLinkUnlinkingAssignmentId, setProductLinkUnlinkingAssignmentId] =
    useState<number>()
  const [markingDiscontinued, setMarkingDiscontinued] = useState(false)
  const requestSequence = useRef(0)
  const filteredProductLinkCandidates = useMemo(
    () => filterProductLinkCandidates(productLinkCandidates, productLinkSearch),
    [productLinkCandidates, productLinkSearch]
  )
  const productLinkCandidateSourceRow = useMemo(
    () =>
      productLinkRows.find(canLinkProductLine) ||
      (productLinkRow && canLinkProductLine(productLinkRow)
        ? productLinkRow
        : null),
    [productLinkRows, productLinkRow]
  )
  const canShowProductCandidateSearch =
    canMutateProductLinks && Boolean(productLinkCandidateSourceRow)
  const canMarkDiscontinuedActionRows =
    canMutateProductLinks &&
    productLinkRows.some(canMarkDiscontinuedProductLine)

  useEffect(() => {
    if (!canShowProductCandidateSearch || !productLinkCandidateSourceRow) {
      return undefined
    }
    const timeoutId = window.setTimeout(
      () =>
        void loadProductLinkCandidatesForRow(
          productLinkCandidateSourceRow,
          productLinkStatusFilter,
          productLinkSearch
        ),
      productLinkSearch.trim() ? 250 : 0
    )
    return () => window.clearTimeout(timeoutId)
  }, [
    canShowProductCandidateSearch,
    productLinkCandidateSourceRow,
    productLinkSearch,
    productLinkStatusFilter
  ])

  async function initializeProductActionRows(rows: ProductLineRow[]) {
    const primaryRow = rows[0] || null
    setProductLinkRow(primaryRow)
    setProductLinkRows(rows)
    setProductLinkStatusFilter('all')
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    setProductLinkCandidates([])
    const source = rows.find(canLinkProductLine)
    if (canMutateProductLinks && source) {
      await loadProductLinkCandidatesForRow(source, 'all', '')
    }
  }

  async function continueAfterAssignment(
    nextRows: ProductLineRow[],
    fallbackRows: ProductLineRow[]
  ) {
    const nextCandidateRow = nextRows.find(canLinkProductLine)
    setProductLinkRows(nextRows)
    setProductLinkRow(
      nextCandidateRow || nextRows[0] || fallbackRows[0] || null
    )
    setProductLinkStatusFilter('all')
    setSelectedProductCandidate(null)
    setProductLinkCandidates([])
    if (nextCandidateRow) {
      await loadProductLinkCandidatesForRow(nextCandidateRow, 'all', '')
    } else if (nextRows.length) {
      message.warning(
        '分配已保存；当前货品不能关联当前 SKU，可标记下架数据或关闭弹窗'
      )
    } else {
      message.warning('分配已保存，请在列表刷新后重新打开商品关联')
    }
  }

  async function changeProductLinkStatusFilter(
    linkStatus: ProductLinkStatusFilter
  ) {
    setProductLinkStatusFilter(linkStatus)
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    if (productLinkCandidateSourceRow) {
      await loadProductLinkCandidatesForRow(
        productLinkCandidateSourceRow,
        linkStatus,
        ''
      )
    }
  }

  async function loadProductLinkCandidatesForRow(
    row: ProductLineRow,
    linkStatus: ProductLinkStatusFilter,
    keyword?: string
  ) {
    const assignmentId = row.item?.assignmentId
    if (!assignmentId) return
    const sequence = requestSequence.current + 1
    requestSequence.current = sequence
    const trimmedKeyword = keyword?.trim()
    setProductLinkLoading(true)
    try {
      const candidates =
        await loadAli1688HistoricalOrderProductLinkCandidates({
          assignmentId,
          ...(linkStatus === 'all' ? {} : { linkStatus }),
          ...(trimmedKeyword ? { keyword: trimmedKeyword } : {})
        })
      if (sequence === requestSequence.current) {
        setProductLinkCandidates(candidates)
      }
    } catch (error) {
      if (sequence === requestSequence.current) {
        message.error(
          error instanceof Error ? error.message : '读取商品关联候选失败'
        )
        setProductLinkCandidates([])
      }
    } finally {
      if (sequence === requestSequence.current) setProductLinkLoading(false)
    }
  }

  function resetProductLinkState() {
    setProductLinkRow(null)
    setProductLinkRows([])
    setProductLinkStatusFilter('all')
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    setProductLinkCandidates([])
    setProductLinkLoading(false)
  }

  async function submitProductLink() {
    if (!canMutateProductLinks) {
      message.warning('当前角色只能查看商品关联，不能修改')
      return
    }
    const assignmentIds = productLinkRows
      .map((row) => row.item?.assignmentId)
      .filter((id): id is number => Boolean(id))
    if (!assignmentIds.length || !selectedProductCandidate?.skuParent) {
      message.error('请选择要关联的商品')
      return
    }
    setProductLinkSubmitting(true)
    try {
      const links = assignmentIds.map((assignmentId) => ({
        assignmentId,
        skuParent: selectedProductCandidate.skuParent,
        partnerSku: selectedProductCandidate.partnerSku,
        pskuCode: selectedProductCandidate.pskuCode,
        productTitle: selectedProductCandidate.productTitle,
        productImageUrl: selectedProductCandidate.productImageUrl
      }))
      if (links.length === 1) await linkAli1688HistoricalOrderProduct(links[0])
      else await linkAli1688HistoricalOrderProductBatch({ links })
      message.success(
        links.length > 1 ? `已关联 ${links.length} 条货品` : '商品关联已保存'
      )
      closeAction()
      clearSelectedLines()
      await reloadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '关联商品失败')
    } finally {
      setProductLinkSubmitting(false)
    }
  }

  async function submitMarkDiscontinuedFromProductLink() {
    if (!canMutateProductLinks) {
      message.warning('当前角色只能查看商品关联，不能修改')
      return
    }
    setMarkingDiscontinued(true)
    try {
      const markedCount = await markAli1688RowsDiscontinued(productLinkRows)
      if (!markedCount) {
        message.error('请选择已分配店铺的货品行')
        return
      }
      message.success(
        markedCount > 1
          ? `已标记 ${markedCount} 条下架数据`
          : '已标记为下架数据'
      )
      closeAction()
      clearSelectedLines()
      await reloadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '标记下架数据失败')
    } finally {
      setMarkingDiscontinued(false)
    }
  }

  async function submitProductUnlink(assignmentId?: number) {
    if (!canMutateProductLinks || !assignmentId) {
      if (!canMutateProductLinks) {
        message.warning('当前角色只能查看商品关联，不能修改')
      }
      return false
    }
    setProductLinkUnlinkingAssignmentId(assignmentId)
    try {
      await unlinkAli1688HistoricalOrderProduct(assignmentId)
      message.success('商品关联已解除')
      await reloadWorkbench(query)
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解除商品关联失败')
      return false
    } finally {
      setProductLinkUnlinkingAssignmentId(undefined)
    }
  }

  return {
    productLinkRow, productLinkRows, productLinkCandidates,
    productLinkStatusFilter, productLinkSearch, setProductLinkSearch,
    selectedProductCandidate, setSelectedProductCandidate, productLinkLoading,
    productLinkSubmitting, productLinkUnlinkingAssignmentId,
    markingDiscontinued, filteredProductLinkCandidates,
    canShowProductCandidateSearch, canMarkDiscontinuedActionRows,
    initializeProductActionRows, continueAfterAssignment,
    changeProductLinkStatusFilter,
    loadProductLinkCandidatesForRow, resetProductLinkState, submitProductLink,
    submitMarkDiscontinuedFromProductLink, submitProductUnlink
  }
}
