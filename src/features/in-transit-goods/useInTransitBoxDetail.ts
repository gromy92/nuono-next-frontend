import { useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { fetchInTransitGoodsLines } from './api'
import type { InTransitBatch, InTransitGoodsLine } from './types'
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
  const [loadingBoxLines, setLoadingBoxLines] = useState(false)
  const requestGuard = useRef(createLatestRequestGuard())

  useEffect(() => {
    if (!isBoxDetailTab || !boxDetailRequest?.batchId) {
      requestGuard.current.invalidate()
      return
    }
    const requestToken = requestGuard.current.begin()
    setBoxDetailTab(boxDetailRequest.initialTab ?? 'box')
    setBoxLines([])
    setLoadingBoxLines(true)
    fetchInTransitGoodsLines(boxDetailRequest.batchId)
      .then((nextLines) => {
        if (requestGuard.current.isCurrent(requestToken)) {
          setBoxLines(nextLines.items ?? [])
        }
      })
      .catch((error) => {
        if (requestGuard.current.isCurrent(requestToken)) {
          message.error(error instanceof Error ? error.message : '箱子明细加载失败')
          setBoxLines([])
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
    setBoxDetailTab('box')
    void onCloseBoxDetailTab?.()
  }

  return {
    boxDetailTab,
    setBoxDetailTab,
    boxLines,
    boxGroups,
    productGroups,
    loadingBoxLines,
    openBoxDetail,
    closeBoxDetail
  }
}
