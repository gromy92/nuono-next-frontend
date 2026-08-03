import { ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Space, Table, Typography, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadOutboundOrders,
  loadPackingLists,
  loadShippingBatches,
  shipPackingList
} from './api'
import { matchesLogisticsPartition, summarizeLogisticsPartitionValues } from './logisticsPartitionDomain'
import type { LogisticsSiteFilter, LogisticsTransportFilter } from './logisticsPartitionDomain'
import { LogisticsPartitionFilters } from './LogisticsPartitionViews'
import type { PackingBatchDetails } from './packingExportDomain'
import {
  mergeBatchOutboundOrder,
  requireCurrentShippingBatchScope,
  requirePackingBatchDetailsScope,
  requireShippingBatchOwner,
  WarehousePackingScopeError
} from './shippingExecutionDomain'
import {
  requirePackingBatchExportScope,
  requirePackingListActionScope
} from './shippingExecutionActionScope'
import {
  createPackingRequestEpochGate,
  isWarehousePackingRequestSuperseded,
  WarehousePackingRequestSupersededError
} from './packingRequestEpoch'
import type { OutboundOrder, PackingList, ShippingBatch } from './types'
import { usePackingListExport } from './usePackingListExport'
import { WarehousePackingExportModal } from './WarehousePackingExportModal'
import { warehousePackingListColumns } from './WarehousePackingListColumns'
import { PACKING_LIST_TABLE_PAGINATION } from './WarehousePackingListView'
import { WarehousePackingSubmissionDrawer } from './WarehousePackingSubmissionDrawer'

const { Text } = Typography
export function WarehousePackingListPanel() {
  const [shippingBatches, setShippingBatches] = useState<ShippingBatch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>()
  const [outboundOrdersByBatch, setOutboundOrdersByBatch] = useState<Record<string, OutboundOrder[]>>({})
  const [packingListsByOutboundOrder, setPackingListsByOutboundOrder] = useState<Record<string, PackingList[]>>({})
  const [loading, setLoading] = useState(false)
  const [detailLoadingBatchId, setDetailLoadingBatchId] = useState<string>()
  const [shippingPackingListId, setShippingPackingListId] = useState<string>()
  const [loadError, setLoadError] = useState<string>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [siteFilter, setSiteFilter] = useState<LogisticsSiteFilter>('all')
  const [transportFilter, setTransportFilter] = useState<LogisticsTransportFilter>('all')
  const requestEpochGateRef = useRef(createPackingRequestEpochGate())
  const detailInteractionSequenceRef = useRef(0)
  const shipmentInteractionSequenceRef = useRef(0)
  const packingExport = usePackingListExport((batch) => loadBatchDetails(batch, 'export'))
  const filteredBatches = useMemo(() => shippingBatches.filter((batch) => (
    matchesLogisticsPartition(
      summarizeLogisticsPartitionValues(batch.siteCodes, batch.transportModes), siteFilter, transportFilter
    )
  )), [shippingBatches, siteFilter, transportFilter])

  const selectedBatch = useMemo(
    () => shippingBatches.find((batch) => batch.id === selectedBatchId),
    [selectedBatchId, shippingBatches]
  )
  const selectedOutboundOrders = selectedBatch ? outboundOrdersByBatch[selectedBatch.id] || [] : []
  const selectedPackingLists = selectedOutboundOrders.flatMap((order) => packingListsByOutboundOrder[order.id] || [])
  const displayOutboundOrder = selectedBatch
    ? mergeBatchOutboundOrder(selectedBatch, selectedOutboundOrders)
    : undefined
  const displayOutboundOrders = displayOutboundOrder ? [displayOutboundOrder] : []
  const displayPackingListsByOrder = displayOutboundOrder
    ? { [displayOutboundOrder.id]: selectedPackingLists }
    : {}

  useEffect(() => {
    void refreshPackingLists()
    return () => {
      requestEpochGateRef.current.invalidate()
    }
  }, [])

  async function refreshPackingLists() {
    const refreshEpoch = requestEpochGateRef.current.invalidate()
    const refreshTicket = requestEpochGateRef.current.begin(`refresh:${refreshEpoch}`)
    const isCurrentRefresh = () => requestEpochGateRef.current.isEpochCurrent(refreshEpoch)
      && requestEpochGateRef.current.isCurrent(refreshTicket)
    setLoading(true)
    setLoadError(undefined)
    setShippingBatches([])
    setOutboundOrdersByBatch({})
    setPackingListsByOutboundOrder({})
    setSelectedBatchId(undefined)
    setDrawerOpen(false)
    packingExport.close()
    try {
      const nextBatches = await loadShippingBatches()
      if (!isCurrentRefresh()) return
      nextBatches.forEach(requireShippingBatchOwner)
      setShippingBatches(nextBatches)
    } catch (error) {
      if (!isCurrentRefresh()) return
      rejectUnsafePackingScope(error)
      const messageText = error instanceof Error ? error.message : '发货单读取失败'
      setLoadError(messageText)
      message.error(messageText)
    } finally {
      if (isCurrentRefresh()) setLoading(false)
    }
  }

  async function loadBatchDetails(
    requestedBatch: ShippingBatch,
    action: 'view' | 'ship' | 'export' = 'view',
    packingListId?: string
  ): Promise<PackingBatchDetails> {
    const requestTicket = requestEpochGateRef.current.begin(requestedBatch.id)
    setLoading(false)
    setOutboundOrdersByBatch({})
    setPackingListsByOutboundOrder({})
    try {
      const nextBatches = await loadShippingBatches()
      requestEpochGateRef.current.requireCurrent(requestTicket)
      nextBatches.forEach(requireShippingBatchOwner)
      const batch = requireCurrentShippingBatchScope(nextBatches, requestedBatch)
      const outboundOrders = await loadOutboundOrders(batch.id)
      requestEpochGateRef.current.requireCurrent(requestTicket)
      const packingEntries = await Promise.all(
        outboundOrders.map(async (order) => [order.id, await loadPackingLists(order.id)] as const)
      )
      requestEpochGateRef.current.requireCurrent(requestTicket)
      const nextPackingLists = Object.fromEntries(packingEntries)
      const details = requirePackingBatchDetailsScope(batch, {
        outboundOrders,
        packingListsByOutboundOrder: nextPackingLists
      })
      if (action === 'ship') {
        requirePackingListActionScope(batch, details, packingListId || '')
      } else if (action === 'export') {
        requirePackingBatchExportScope(batch, details)
      }
      if (!requestEpochGateRef.current.isCurrent(requestTicket)) {
        throw new WarehousePackingRequestSupersededError()
      }
      setShippingBatches(nextBatches)
      setOutboundOrdersByBatch({ [batch.id]: outboundOrders })
      setPackingListsByOutboundOrder(nextPackingLists)
      return details
    } catch (error) {
      if (isWarehousePackingRequestSuperseded(error)) throw error
      rejectUnsafePackingScope(error)
      throw error
    }
  }

  async function completeShipment(packingListId: string) {
    if (!selectedBatch) return
    const requestedBatch = selectedBatch
    const interactionSequence = ++shipmentInteractionSequenceRef.current
    try {
      requireCurrentShippingBatchScope(shippingBatches, requestedBatch)
      setShippingPackingListId(packingListId)
      await loadBatchDetails(requestedBatch, 'ship', packingListId)
      if (interactionSequence !== shipmentInteractionSequenceRef.current) return
      await shipPackingList(packingListId)
      if (interactionSequence !== shipmentInteractionSequenceRef.current) return
      await refreshPackingLists()
      message.success('已确认交货代，本单发货状态已完成。')
    } catch (error) {
      if (isWarehousePackingRequestSuperseded(error)) return
      rejectUnsafePackingScope(error)
      message.error(error instanceof Error ? error.message : '完成发货失败')
    } finally {
      if (interactionSequence === shipmentInteractionSequenceRef.current) {
        setShippingPackingListId(undefined)
      }
    }
  }

  async function openPackingDetails(batch: ShippingBatch) {
    const interactionSequence = ++detailInteractionSequenceRef.current
    setDetailLoadingBatchId(batch.id)
    try {
      await loadBatchDetails(batch, 'view')
      if (interactionSequence !== detailInteractionSequenceRef.current) return
      setSelectedBatchId(batch.id)
      setDrawerOpen(true)
    } catch (error) {
      if (isWarehousePackingRequestSuperseded(error)) return
      message.error(error instanceof Error ? error.message : '装箱详情读取失败')
    } finally {
      if (interactionSequence === detailInteractionSequenceRef.current) {
        setDetailLoadingBatchId(undefined)
      }
    }
  }

  function rejectUnsafePackingScope(error: unknown) {
    if (!(error instanceof WarehousePackingScopeError)) return
    requestEpochGateRef.current.invalidate()
    detailInteractionSequenceRef.current += 1
    shipmentInteractionSequenceRef.current += 1
    setShippingBatches([])
    setOutboundOrdersByBatch({})
    setPackingListsByOutboundOrder({})
    setSelectedBatchId(undefined)
    setDrawerOpen(false)
    packingExport.close()
    setLoadError(error.message)
    setLoading(false)
    setDetailLoadingBatchId(undefined)
    setShippingPackingListId(undefined)
  }

  const columns = warehousePackingListColumns({
    detailLoadingBatchId,
    exportLoadingBatchId: packingExport.loadingBatchId,
    onOpenDetails: openPackingDetails,
    onOpenExport: packingExport.open
  })

  return (
    <div className="warehouse-dispatch-panel">
      <div className="warehouse-dispatch-toolbar">
        <div className="warehouse-dispatch-toolbar-left">
          <Text strong>发货单</Text>
          <Text type="secondary">显示 {filteredBatches.length} / 共 {shippingBatches.length} 张</Text>
        </div>
        <Space size={8}>
          <LogisticsPartitionFilters siteFilter={siteFilter} transportFilter={transportFilter}
            onSiteFilterChange={setSiteFilter} onTransportFilterChange={setTransportFilter} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void refreshPackingLists()}>
            刷新
          </Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" columns={columns} dataSource={filteredBatches}
        loading={loading} pagination={PACKING_LIST_TABLE_PAGINATION} scroll={{ x: 1430 }}
        rowClassName="warehouse-dispatch-clickable-row"
        onRow={(batch) => ({ onClick: () => void openPackingDetails(batch) })}
        locale={{ emptyText: <Empty description={loadError || '暂无发货单'} /> }} />
      <WarehousePackingSubmissionDrawer open={drawerOpen} batch={selectedBatch}
        outboundOrders={displayOutboundOrders} packingListsByOutboundOrder={displayPackingListsByOrder}
        loading={Boolean(detailLoadingBatchId)} shippingPackingListId={shippingPackingListId}
        onShipPackingList={(packingListId) => { void completeShipment(packingListId) }}
        onClose={() => setDrawerOpen(false)} />
      <WarehousePackingExportModal batch={packingExport.targetBatch}
        channels={packingExport.channels} selection={packingExport.selection}
        loading={Boolean(packingExport.loadingBatchId)}
        onSelectionChange={packingExport.setSelection}
        onConfirm={() => void packingExport.confirm()} onClose={packingExport.close} />
    </div>
  )
}
