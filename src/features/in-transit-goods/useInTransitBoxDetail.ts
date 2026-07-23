import { useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import {
  fetchInTransitGoodsLines,
  fetchInTransitProductMatchCandidates,
  rematchInTransitProducts
} from './api'
import type { InTransitBatch, InTransitGoodsLine, InTransitProductMatchCandidate } from './types'
import type { BoxDetailTabKey, InTransitGoodsPageProps } from './InTransitGoodsPage.models'
import { buildBoxGroups, buildProductGroups } from './InTransitGoodsPage.selectors'
import { createLatestRequestGuard } from './latestRequestGuard'

export function useInTransitBoxDetail({
  isBoxDetailTab,
  boxDetailRequest,
  onOpenBoxDetailTab,
  onCloseBoxDetailTab
}: Required<Pick<InTransitGoodsPageProps, 'isBoxDetailTab'>> & Omit<InTransitGoodsPageProps, 'isBoxDetailTab'>) {
  const [boxDetailTab, setBoxDetailTab] = useState<BoxDetailTabKey>('box')
  const [boxLines, setBoxLines] = useState<InTransitGoodsLine[]>([])
  const [productMatchCandidates, setProductMatchCandidates] = useState<InTransitProductMatchCandidate[]>([])
  const [loadingBoxLines, setLoadingBoxLines] = useState(false)
  const [rematchingProducts, setRematchingProducts] = useState(false)
  const requestGuard = useRef(createLatestRequestGuard())

  useEffect(() => {
    if (!isBoxDetailTab || !boxDetailRequest?.batchId) {
      requestGuard.current.invalidate()
      return
    }
    const requestToken = requestGuard.current.begin()
    setBoxDetailTab(boxDetailRequest.initialTab ?? 'box')
    setBoxLines([])
    setProductMatchCandidates([])
    setLoadingBoxLines(true)
    Promise.all([
      fetchInTransitGoodsLines(boxDetailRequest.batchId),
      fetchInTransitProductMatchCandidates(boxDetailRequest.batchId)
    ])
      .then(([nextLines, candidates]) => {
        if (requestGuard.current.isCurrent(requestToken)) {
          setBoxLines(nextLines.items ?? [])
          setProductMatchCandidates(candidates.items ?? [])
        }
      })
      .catch((error) => {
        if (requestGuard.current.isCurrent(requestToken)) {
          message.error(error instanceof Error ? error.message : '箱子明细加载失败')
          setBoxLines([])
          setProductMatchCandidates([])
        }
      })
      .finally(() => {
        if (requestGuard.current.isCurrent(requestToken)) {
          setLoadingBoxLines(false)
        }
      })
    return () => requestGuard.current.invalidate()
  }, [boxDetailRequest?.batchId, boxDetailRequest?.initialTab, isBoxDetailTab])

  const boxGroups = useMemo(() => buildBoxGroups(boxLines), [boxLines])
  const productGroups = useMemo(() => buildProductGroups(boxLines), [boxLines])

  const openBoxDetail = (row: InTransitBatch, initialTab: BoxDetailTabKey = 'box') => {
    onOpenBoxDetailTab?.({
      batchId: row.batchId,
      batchReferenceNo: row.batchReferenceNo,
      batch: row,
      initialTab
    })
  }

  const closeBoxDetail = () => {
    setBoxLines([])
    setProductMatchCandidates([])
    setBoxDetailTab('box')
    void onCloseBoxDetailTab?.()
  }

  const rematchProducts = async () => {
    const batchId = boxDetailRequest?.batchId
    if (!batchId) return
    setRematchingProducts(true)
    try {
      const result = await rematchInTransitProducts(batchId)
      setProductMatchCandidates(result.pendingItems ?? [])
      const nextLines = await fetchInTransitGoodsLines(batchId)
      setBoxLines(nextLines.items ?? [])
      if (result.pendingCount > 0) {
        message.warning(`已匹配 ${result.matchedCount} 条，仍有 ${result.pendingCount} 条待匹配`)
      } else {
        message.success(`商品匹配完成，本次匹配 ${result.matchedCount} 条`)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '重新匹配失败')
    } finally {
      setRematchingProducts(false)
    }
  }

  return {
    boxDetailTab,
    setBoxDetailTab,
    boxLines,
    productMatchCandidates,
    boxGroups,
    productGroups,
    loadingBoxLines,
    rematchingProducts,
    rematchProducts,
    openBoxDetail,
    closeBoxDetail
  }
}
