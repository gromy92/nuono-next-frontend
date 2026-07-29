import { useRef, useState } from 'react'
import { message } from 'antd'
import {
  fetchInTransitBatchFreightCosts,
  fetchInTransitGoodsLines,
  fetchInTransitLogisticsNodes
} from './api'
import type {
  InTransitBatchFreightCost,
  InTransitGoodsLine,
  InTransitLogisticsNode
} from './types'
import { createLatestRequestGuard } from './latestRequestGuard'

const EMPTY_FREIGHT_COSTS: InTransitBatchFreightCost = { bills: [], components: [] }

export function useInTransitBatchResources() {
  const linesRequestGuard = useRef(createLatestRequestGuard())
  const nodesRequestGuard = useRef(createLatestRequestGuard())
  const freightRequestGuard = useRef(createLatestRequestGuard())
  const [lines, setLines] = useState<InTransitGoodsLine[]>([])
  const [loadingLines, setLoadingLines] = useState(false)
  const [nodes, setNodes] = useState<InTransitLogisticsNode[]>([])
  const [loadingNodes, setLoadingNodes] = useState(false)
  const [batchFreightCosts, setBatchFreightCosts] = useState<InTransitBatchFreightCost>(EMPTY_FREIGHT_COSTS)
  const [loadingBatchFreightCosts, setLoadingBatchFreightCosts] = useState(false)

  const resetBatchResources = () => {
    setLines([])
    setNodes([])
    setBatchFreightCosts(EMPTY_FREIGHT_COSTS)
  }

  const loadLines = async (batchId: number) => {
    const requestToken = linesRequestGuard.current.begin()
    setLoadingLines(true)
    try {
      const nextLines = await fetchInTransitGoodsLines(batchId)
      if (linesRequestGuard.current.isCurrent(requestToken)) {
        setLines(nextLines.items ?? [])
      }
    } catch (error) {
      if (linesRequestGuard.current.isCurrent(requestToken)) {
        message.error(error instanceof Error ? error.message : '商品明细加载失败')
        setLines([])
      }
    } finally {
      if (linesRequestGuard.current.isCurrent(requestToken)) {
        setLoadingLines(false)
      }
    }
  }

  const loadNodes = async (batchId: number) => {
    const requestToken = nodesRequestGuard.current.begin()
    setLoadingNodes(true)
    try {
      const nextNodes = await fetchInTransitLogisticsNodes(batchId)
      if (nodesRequestGuard.current.isCurrent(requestToken)) {
        setNodes(nextNodes.items ?? [])
      }
    } catch (error) {
      if (nodesRequestGuard.current.isCurrent(requestToken)) {
        message.error(error instanceof Error ? error.message : '物流节点加载失败')
        setNodes([])
      }
    } finally {
      if (nodesRequestGuard.current.isCurrent(requestToken)) {
        setLoadingNodes(false)
      }
    }
  }

  const loadBatchFreightCosts = async (batchId: number) => {
    const requestToken = freightRequestGuard.current.begin()
    setLoadingBatchFreightCosts(true)
    try {
      const nextFreightCosts = await fetchInTransitBatchFreightCosts(batchId)
      if (freightRequestGuard.current.isCurrent(requestToken)) {
        setBatchFreightCosts({
          bills: nextFreightCosts.bills ?? [],
          components: nextFreightCosts.components ?? []
        })
      }
    } catch (error) {
      if (freightRequestGuard.current.isCurrent(requestToken)) {
        message.error(error instanceof Error ? error.message : '实际运费加载失败')
        setBatchFreightCosts(EMPTY_FREIGHT_COSTS)
      }
    } finally {
      if (freightRequestGuard.current.isCurrent(requestToken)) {
        setLoadingBatchFreightCosts(false)
      }
    }
  }

  return {
    lines,
    loadingLines,
    nodes,
    loadingNodes,
    batchFreightCosts,
    loadingBatchFreightCosts,
    loadLines,
    loadNodes,
    loadBatchFreightCosts,
    replaceLines: setLines,
    replaceNodes: setNodes,
    resetBatchResources
  }
}
