import {
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileDoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  UploadOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Segmented,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Key } from 'react'
import type { AuthSession } from '../auth/session'
import {
  createShippingOrder,
  exportShippingOrderLogisticsQuoteReport,
  generateShippingOrderExpectedBill,
  importShippingOrderLogisticsQuoteReport,
  loadShippingOrder,
  loadPurchaseOrders,
  loadShippingOrderLogisticsQuoteOptions,
  loadShippingOrderLogisticsQuoteOptionsForScope,
  loadShippingOrders,
  submitShippingOrder,
  updateShippingOrderLineYiteMaterial,
  updateShippingOrder
} from '../purchase-order/api'
import type {
  PurchaseOrder,
  PurchaseOrderLogisticsQuoteChannelOption,
  PurchaseOrderLogisticsQuoteForwarderOption,
  PurchaseOrderLogisticsQuoteImportResult,
  PurchaseOrderLogisticsQuoteOptions,
  ShippingOrder,
  ShippingOrderSegment,
  ShippingOrderLine
} from '../purchase-order/types'
import './WarehouseShippingOrderPage.css'

const { Text, Title } = Typography

type WarehouseShippingOrderPageProps = {
  session?: AuthSession | null
}

type QuoteExportSelection = {
  forwarderCode?: string
  routeCode?: string
}

type QuoteImportResultState = {
  orderId: string
  segmentIds: string[]
  result: PurchaseOrderLogisticsQuoteImportResult
}

const YITE_MATERIAL_OPTIONS = ['塑料', '陶瓷', '金属', '纸', '纺织', '木制'].map((value) => ({
  label: value,
  value
}))

export function WarehouseShippingOrderPage({ session }: WarehouseShippingOrderPageProps) {
  const [shippingOrders, setShippingOrders] = useState<ShippingOrder[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedSourceOrderIds, setSelectedSourceOrderIds] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [sourceKeyword, setSourceKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editShippingOrderTarget, setEditShippingOrderTarget] = useState<ShippingOrder | null>(null)
  const [editShippingOrderTitle, setEditShippingOrderTitle] = useState('')
  const [editShippingOrderRemark, setEditShippingOrderRemark] = useState('')
  const [detailShippingOrderTarget, setDetailShippingOrderTarget] = useState<ShippingOrder | null>(null)
  const [detailMaterialFilter, setDetailMaterialFilter] = useState<'ALL' | 'MISSING'>('ALL')
  const [selectedDetailSegmentIds, setSelectedDetailSegmentIds] = useState<string[]>([])
  const [lastQuoteImportResult, setLastQuoteImportResult] = useState<QuoteImportResultState | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionKey, setActionKey] = useState<string>()
  const [quoteExportTarget, setQuoteExportTarget] = useState<ShippingOrder | null>(null)
  const [quoteExportSegmentIds, setQuoteExportSegmentIds] = useState<string[]>([])
  const [quoteExportOptions, setQuoteExportOptions] = useState<PurchaseOrderLogisticsQuoteOptions | null>(null)
  const [quoteExportSelection, setQuoteExportSelection] = useState<QuoteExportSelection>({})
  const [quoteExportLoading, setQuoteExportLoading] = useState(false)

  const selectedSourceOrders = useMemo(
    () => selectedSourceOrderIds
      .map((orderId) => purchaseOrders.find((order) => order.id === orderId))
      .filter((order): order is PurchaseOrder => Boolean(order)),
    [purchaseOrders, selectedSourceOrderIds]
  )
  const visibleShippingOrders = useMemo(
    () => filterShippingOrders(shippingOrders, keyword),
    [keyword, shippingOrders]
  )
  const visiblePurchaseOrders = useMemo(
    () => filterPurchaseOrders(purchaseOrders, sourceKeyword),
    [purchaseOrders, sourceKeyword]
  )
  const quoteForwarderOptions = useMemo(
    () => buildQuoteForwarderSelectOptions(quoteExportOptions),
    [quoteExportOptions]
  )
  const quoteSelectedForwarder = useMemo(
    () => findQuoteForwarderOption(quoteExportOptions, quoteExportSelection.forwarderCode),
    [quoteExportOptions, quoteExportSelection.forwarderCode]
  )
  const quoteChannelOptions = useMemo(
    () => buildQuoteChannelSelectOptions(quoteSelectedForwarder),
    [quoteSelectedForwarder]
  )
  const quoteSelectedChannel = useMemo(
    () => findQuoteChannelOption(quoteSelectedForwarder, quoteExportSelection.routeCode),
    [quoteExportSelection.routeCode, quoteSelectedForwarder]
  )
  const detailLines = useMemo(
    () => detailShippingOrderTarget?.lines || [],
    [detailShippingOrderTarget]
  )
  const detailSegments = useMemo(
    () => detailShippingOrderTarget?.segments || [],
    [detailShippingOrderTarget]
  )
  const sortedDetailSegments = useMemo(
    () => sortShippingOrderSegments(detailSegments),
    [detailSegments]
  )
  const yiteDetailSegmentIds = useMemo(
    () => new Set(detailSegments.filter(isYiteSegment).map((segment) => segment.id)),
    [detailSegments]
  )
  const activeDetailSegment = useMemo(() => {
    const selectedSegmentId = selectedDetailSegmentIds[0]
    if (selectedSegmentId) {
      const selectedSegment = detailSegments.find((segment) => segment.id === selectedSegmentId)
      if (selectedSegment) {
        return selectedSegment
      }
    }
    return sortedDetailSegments[0]
  }, [detailSegments, selectedDetailSegmentIds, sortedDetailSegments])
  const activeDetailSegmentIds = useMemo(
    () => (activeDetailSegment ? [activeDetailSegment.id] : []),
    [activeDetailSegment]
  )
  const activeDetailSegmentSubmitted = activeDetailSegment?.shippingSubmitStatus === 'SUBMITTED'
  const activeDetailLines = useMemo(
    () => detailLines.filter((line) => (activeDetailSegment ? line.shippingOrderSegmentId === activeDetailSegment.id : true)),
    [activeDetailSegment, detailLines]
  )
  const activeDetailMissingMaterialCount = useMemo(
    () => activeDetailLines.filter((line) => isMissingYiteMaterial(line, yiteDetailSegmentIds)).length,
    [activeDetailLines, yiteDetailSegmentIds]
  )
  const activeDetailConfirmedQuoteCount = useMemo(
    () => activeDetailLines.filter((line) => line.quoteStatus === 'CONFIRMED').length,
    [activeDetailLines]
  )
  const activeDetailPendingQuoteCount = useMemo(
    () => activeDetailLines.length - activeDetailConfirmedQuoteCount,
    [activeDetailConfirmedQuoteCount, activeDetailLines.length]
  )
  const visibleQuoteImportResult = useMemo(() => {
    if (!detailShippingOrderTarget || !lastQuoteImportResult) {
      return null
    }
    if (lastQuoteImportResult.orderId !== detailShippingOrderTarget.id) {
      return null
    }
    return sameStringSet(lastQuoteImportResult.segmentIds, activeDetailSegmentIds)
      ? lastQuoteImportResult.result
      : null
  }, [activeDetailSegmentIds, detailShippingOrderTarget, lastQuoteImportResult])
  const quoteExportScopeLines = useMemo(() => {
    const lines = quoteExportTarget?.lines || []
    if (!quoteExportSegmentIds.length) {
      return lines
    }
    const segmentIdSet = new Set(quoteExportSegmentIds)
    return lines.filter((line) => line.shippingOrderSegmentId ? segmentIdSet.has(line.shippingOrderSegmentId) : false)
  }, [quoteExportSegmentIds, quoteExportTarget])
  const quoteExportConfirmedCount = useMemo(
    () => quoteExportScopeLines.filter((line) => line.quoteStatus === 'CONFIRMED').length,
    [quoteExportScopeLines]
  )
  const quoteExportTotalCount = quoteExportScopeLines.length || quoteSelectedChannel?.pendingLineCount || quoteExportOptions?.pendingLineCount || 0
  const quoteExportPendingCount = quoteExportScopeLines.length
    ? quoteExportScopeLines.length - quoteExportConfirmedCount
    : quoteSelectedChannel?.pendingLineCount || quoteExportOptions?.pendingLineCount || 0
  const visibleDetailLines = useMemo(
    () => activeDetailLines
      .filter((line) => (detailMaterialFilter === 'MISSING' ? isMissingYiteMaterial(line, yiteDetailSegmentIds) : true)),
    [activeDetailLines, detailMaterialFilter, yiteDetailSegmentIds]
  )

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      const [nextShippingOrders, nextPurchaseOrders] = await Promise.all([
        loadShippingOrders(),
        loadPurchaseOrders({ submittedOnly: true, shippingAvailableOnly: false })
      ])
      setLoadError(undefined)
      setShippingOrders(nextShippingOrders)
      setPurchaseOrders(nextPurchaseOrders)
      setSelectedSourceOrderIds((current) => current.filter((orderId) => nextPurchaseOrders.some((order) => order.id === orderId)))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '读取发货单失败'
      setLoadError(messageText)
      message.error(messageText)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  useEffect(() => {
    if (!detailShippingOrderTarget) {
      return
    }
    const segmentIds = sortedDetailSegments.map((segment) => segment.id)
    setSelectedDetailSegmentIds((current) => {
      const currentId = current[0]
      if (currentId && segmentIds.includes(currentId)) {
        return current.length === 1 ? current : [currentId]
      }
      const firstUnsubmitted = sortedDetailSegments.find((segment) => segment.shippingSubmitStatus !== 'SUBMITTED')
      return firstUnsubmitted ? [firstUnsubmitted.id] : (segmentIds[0] ? [segmentIds[0]] : [])
    })
  }, [detailShippingOrderTarget, sortedDetailSegments])

  async function handleCreateShippingOrder() {
    if (!selectedSourceOrderIds.length) {
      message.warning('请选择要合并的采购单。')
      return
    }
    setActionKey('create-shipping-order')
    try {
      const nextShippingOrder = await createShippingOrder({
        purchaseOrderIds: selectedSourceOrderIds
      })
      setSelectedSourceOrderIds([])
      setCreateModalOpen(false)
      await loadPage()
      message.success(`已创建发货单 ${nextShippingOrder.shippingOrderNo}。`)
      for (const warning of nextShippingOrder.warnings || []) {
        message.warning(warning)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建发货单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  function openEditShippingOrderModal(order: ShippingOrder) {
    setEditShippingOrderTarget(order)
    setEditShippingOrderTitle(order.title || order.shippingOrderNo || '')
    setEditShippingOrderRemark(order.remark || '')
  }

  function closeEditShippingOrderModal() {
    setEditShippingOrderTarget(null)
    setEditShippingOrderTitle('')
    setEditShippingOrderRemark('')
  }

  async function handleUpdateShippingOrderTitle() {
    if (!editShippingOrderTarget) {
      return
    }
    const title = editShippingOrderTitle.trim()
    if (!title) {
      message.warning('请输入发货单名。')
      return
    }
    setActionKey(`update-shipping-order:${editShippingOrderTarget.id}`)
    try {
      const nextOrder = await updateShippingOrder(editShippingOrderTarget.id, {
        title,
        remark: editShippingOrderRemark.trim() || undefined
      })
      setShippingOrders((current) => current.map((order) => (order.id === nextOrder.id ? { ...order, ...nextOrder } : order)))
      closeEditShippingOrderModal()
      message.success('已保存发货单名。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存发货单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function openShippingOrderDetail(order: ShippingOrder) {
    setDetailShippingOrderTarget({ ...order, lines: [] })
    setDetailMaterialFilter('ALL')
    setSelectedDetailSegmentIds([])
    setLastQuoteImportResult(null)
    setDetailLoading(true)
    try {
      const detail = await loadShippingOrder(order.id)
      setDetailShippingOrderTarget(detail)
      setShippingOrders((current) => current.map((item) => (item.id === detail.id ? { ...item, ...detail, lines: item.lines } : item)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取发货单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeShippingOrderDetail() {
    setDetailShippingOrderTarget(null)
    setDetailMaterialFilter('ALL')
    setSelectedDetailSegmentIds([])
    setLastQuoteImportResult(null)
    setDetailLoading(false)
  }

  async function handleUpdateLineYiteMaterial(line: ShippingOrderLine, yiteMaterial?: string) {
    const order = detailShippingOrderTarget
    if (!order) {
      return
    }
    setActionKey(`update-yite-material:${line.id}`)
    try {
      const nextOrder = await updateShippingOrderLineYiteMaterial(order.id, line.id, {
        yiteMaterial: yiteMaterial || undefined
      })
      setDetailShippingOrderTarget(nextOrder)
      setShippingOrders((current) => current.map((item) => (item.id === nextOrder.id ? { ...item, ...nextOrder, lines: item.lines } : item)))
      message.success('已保存义特材质。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存义特材质失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function openCreateShippingOrderModal() {
    setCreateModalOpen(true)
    setSourceKeyword('')
    try {
      const nextPurchaseOrders = await loadPurchaseOrders({ submittedOnly: true, shippingAvailableOnly: false })
      setPurchaseOrders(nextPurchaseOrders)
      setSelectedSourceOrderIds((current) => current.filter((orderId) => nextPurchaseOrders.some((order) => order.id === orderId)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取已提交采购单失败')
    }
  }

  async function openLogisticsQuoteExportModal(order: ShippingOrder, segmentIds?: string[]) {
    if (!order.lineCount) {
      message.warning('当前发货单还没有商品。')
      return
    }
    setQuoteExportTarget(order)
    setQuoteExportSegmentIds(segmentIds || [])
    setQuoteExportOptions(null)
    setQuoteExportSelection({})
    setQuoteExportLoading(true)
    try {
      const options = segmentIds?.length
        ? await loadShippingOrderLogisticsQuoteOptionsForScope(order.id, segmentIds)
        : await loadShippingOrderLogisticsQuoteOptions(order.id)
      setQuoteExportOptions(options)
      setQuoteExportSelection({})
    } catch (error) {
      setQuoteExportOptions(null)
      message.error(error instanceof Error ? error.message : '读取可导出货代渠道失败')
    } finally {
      setQuoteExportLoading(false)
    }
  }

  async function handleExportLogisticsQuoteReport() {
    const order = quoteExportTarget
    if (!order?.id) {
      return
    }
    if (!quoteExportSelection.forwarderCode || !quoteExportSelection.routeCode) {
      message.warning('请选择货代和渠道。')
      return
    }
    setActionKey(`logistics-quote-export:${order.id}`)
    try {
      const report = await exportShippingOrderLogisticsQuoteReport(order.id, {
        forwarderCode: quoteExportSelection.forwarderCode,
        routeCode: quoteExportSelection.routeCode,
        segmentIds: quoteExportSegmentIds
      })
      saveBlobFile(report.blob, report.filename)
      closeLogisticsQuoteExportModal()
      await loadPage()
      message.success('已导出物流报价表。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出物流报价表失败')
    } finally {
      setActionKey(undefined)
    }
  }

  function handleQuoteExportForwarderChange(forwarderCode: string) {
    const forwarder = findQuoteForwarderOption(quoteExportOptions, forwarderCode)
    setQuoteExportSelection({
      forwarderCode,
      routeCode: forwarder?.channels?.length === 1 ? forwarder.channels[0].routeCode : undefined
    })
  }

  function closeLogisticsQuoteExportModal() {
    setQuoteExportTarget(null)
    setQuoteExportSegmentIds([])
    setQuoteExportOptions(null)
    setQuoteExportSelection({})
    setQuoteExportLoading(false)
  }

  async function handleImportLogisticsQuoteReport(order: ShippingOrder, file: File, segmentIds?: string[]) {
    setActionKey(`logistics-quote-import:${order.id}`)
    try {
      const result = await importShippingOrderLogisticsQuoteReport(order.id, file, segmentIds)
      setLastQuoteImportResult({
        orderId: order.id,
        segmentIds: segmentIds || [],
        result
      })
      await loadPage()
      if (detailShippingOrderTarget?.id === order.id) {
        const detail = await loadShippingOrder(order.id)
        setDetailShippingOrderTarget(detail)
      }
      const failedText = result.skippedRows ? `，跳过 ${result.skippedRows} 行` : ''
      if (!result.updatedRows) {
        Modal.warning({
          title: '报价未更新',
          content: quoteImportResultContent(result),
          okText: '知道了'
        })
        return
      }
      message.success(`已回传物流报价 ${result.updatedRows} 行${failedText}。`)
      if (result.errors?.length || result.skippedRows) {
        Modal.warning({
          title: '部分报价未更新',
          content: quoteImportResultContent(result),
          okText: '知道了'
        })
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '回传物流报价表失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function handleSubmitShipping(order: ShippingOrder, segmentIds?: string[]) {
    const selectedSegments = segmentIds?.length ? (order.segments || []).filter((segment) => segmentIds.includes(segment.id)) : []
    const submitted = selectedSegments.length
      ? selectedSegments.every((segment) => segment.shippingSubmitStatus === 'SUBMITTED')
      : order.shippingSubmitStatus === 'SUBMITTED'
    const selectedSegmentIdSet = new Set(segmentIds || [])
    const yiteSegmentIds = new Set((order.segments || []).filter(isYiteSegment).map((segment) => segment.id))
    const missingMaterialCount = order.lines?.length
      ? order.lines
        .filter((line) => !selectedSegmentIdSet.size || selectedSegmentIdSet.has(line.shippingOrderSegmentId || ''))
        .filter((line) => isMissingYiteMaterial(line, yiteSegmentIds)).length
      : selectedSegments.reduce((sum, segment) => sum + Number(segment.missingYiteMaterialCount || 0), 0)
    if (submitted) {
      Modal.warning({
        title: '当前发货单已提交',
        content: '已提交给仓库的子发货单不能重复提交。',
        okText: '知道了'
      })
      return
    }
    if (missingMaterialCount > 0) {
      Modal.warning({
        title: '义特材质缺失',
        content: `还有 ${missingMaterialCount} 个商品材质缺失，补齐后才能提交给仓库装箱。`,
        okText: '知道了'
      })
      return
    }
    setActionKey(`submit-shipping:${order.id}`)
    try {
      const result = await submitShippingOrder(order.id, segmentIds)
      await loadPage()
      if (detailShippingOrderTarget?.id === order.id) {
        const detail = await loadShippingOrder(order.id)
        setDetailShippingOrderTarget(detail)
        const nextSegment = detail.segments?.find((segment) => segment.shippingSubmitStatus !== 'SUBMITTED')
        setSelectedDetailSegmentIds(nextSegment ? [nextSegment.id] : activeDetailSegmentIds)
      }
      Modal.success({
        title: '已提交发货',
        content: `已提交给仓库 ${result.submittedLineCount} 行。`,
        okText: '知道了'
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交发货失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function handleGenerateExpectedBill(order: ShippingOrder, segmentIds?: string[]) {
    if (segmentIds?.length !== 1) {
      message.warning('请选择一个子发货单生成账单。')
      return
    }
    const selectedSegments = segmentIds?.length ? (order.segments || []).filter((segment) => segmentIds.includes(segment.id)) : []
    const quoteConfirmed = selectedSegments.length
      ? selectedSegments.every((segment) => segment.quoteStatus === 'CONFIRMED')
      : order.quoteStatus === 'CONFIRMED'
    if (!quoteConfirmed) {
      message.warning('还有物流报价未确认，不能生成账单。')
      return
    }
    setActionKey(`generate-expected-bill:${order.id}`)
    try {
      const bill = await generateShippingOrderExpectedBill(order.id, segmentIds)
      message.success(`已生成预估账单 ${bill.expectedBillNo}。`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '生成预估账单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  const sourceOrderSelection = {
    selectedRowKeys: selectedSourceOrderIds,
    onChange: (selectedRowKeys: Key[]) => {
      setSelectedSourceOrderIds(selectedRowKeys.map(String))
    }
  }
  const detailScopeActionDisabled = detailSegments.length ? !activeDetailSegmentIds.length : !detailLines.length

  return (
    <div className="warehouse-shipping-order-page" data-testid="warehouse-shipping-order-page">
      <div className="warehouse-shipping-order-toolbar">
        <div>
          <Title level={4}>发货单</Title>
          <Text type="secondary">按老板名下多店铺采购单合并，报价确认后再提交仓库装箱发货。</Text>
        </div>
        <div className="warehouse-shipping-order-toolbar-actions">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索发货单 / SKU / 采购单"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => void openCreateShippingOrderModal()}>
            新增发货单
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadPage()} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        <div className="warehouse-shipping-order-main">
          <section className="warehouse-shipping-order-list-section">
            <Table<ShippingOrder>
              size="small"
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              columns={[
                {
                  title: '发货单',
                  dataIndex: 'title',
                  width: 260,
                  render: (_, order) => {
                    const status = shippingOrderStatusMeta(order)
                    const missingYiteMaterialCount = Number(order.missingYiteMaterialCount || 0)
                    return (
                      <div className="warehouse-shipping-order-source-name">
                        <Text strong>{order.title || order.shippingOrderNo}</Text>
                        <Text type="secondary">{order.shippingOrderNo}</Text>
                        <div className="warehouse-shipping-order-status-tags">
                          <Tag color={status.color}>{status.label}</Tag>
                          {missingYiteMaterialCount > 0 ? (
                            <Tag color="red">材质缺失 {formatQuantity(missingYiteMaterialCount)} 条</Tag>
                          ) : null}
                        </div>
                      </div>
                    )
                  }
                },
                {
                  title: '来源采购单',
                  dataIndex: 'purchaseOrderCount',
                  width: 110,
                  render: (value) => `${value || 0} 单`
                },
                {
                  title: '商品行',
                  dataIndex: 'lineCount',
                  width: 90
                },
                {
                  title: 'SKU',
                  dataIndex: 'skuCount',
                  width: 80
                },
                {
                  title: '数量',
                  dataIndex: 'totalQuantity',
                  width: 100,
                  align: 'right',
                  render: (value) => formatQuantity(Number(value || 0))
                },
                {
                  title: '报价',
                  dataIndex: 'quoteStatus',
                  width: 110,
                  render: (_, order) => <Tag color={shippingOrderStatusMeta(order).color}>{shippingOrderStatusMeta(order).label}</Tag>
                },
                {
                  title: '创建时间',
                  dataIndex: 'createdAt',
                  width: 120,
                  render: (value) => formatDate(String(value || ''))
                },
                {
                  title: '操作',
                  width: 180,
                  render: (_, order) => (
                    <div className="warehouse-shipping-order-table-actions" onClick={(event) => event.stopPropagation()}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        disabled={!order.lineCount}
                        loading={detailLoading && detailShippingOrderTarget?.id === order.id}
                        onClick={() => void openShippingOrderDetail(order)}
                      >
                        查看详情
                      </Button>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        loading={actionKey === `update-shipping-order:${order.id}`}
                        onClick={() => openEditShippingOrderModal(order)}
                      >
                        改名
                      </Button>
                    </div>
                  )
                }
              ]}
              dataSource={visibleShippingOrders}
              locale={{
                emptyText: loadError ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={loadError}
                  >
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => void loadPage()}>
                      重新读取
                    </Button>
                  </Empty>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无发货单" />
                )
              }}
            />
          </section>
        </div>
      </Spin>

      <Modal
        title="修改发货单名"
        open={Boolean(editShippingOrderTarget)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === `update-shipping-order:${editShippingOrderTarget?.id}` }}
        onOk={() => void handleUpdateShippingOrderTitle()}
        onCancel={closeEditShippingOrderModal}
        width={520}
      >
        <div className="warehouse-shipping-order-edit-form">
          <Form.Item label="发货单名" required>
            <Input
              value={editShippingOrderTitle}
              onChange={(event) => setEditShippingOrderTitle(event.target.value)}
              maxLength={80}
              showCount
              placeholder="输入发货单名"
            />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea
              value={editShippingOrderRemark}
              onChange={(event) => setEditShippingOrderRemark(event.target.value)}
              maxLength={160}
              showCount
              autoSize={{ minRows: 3, maxRows: 5 }}
              placeholder="输入备注"
            />
          </Form.Item>
        </div>
      </Modal>

      <Modal
        title={detailShippingOrderTarget ? `${detailShippingOrderTarget.title || detailShippingOrderTarget.shippingOrderNo} 商品明细` : '发货单商品明细'}
        open={Boolean(detailShippingOrderTarget)}
        footer={null}
        onCancel={closeShippingOrderDetail}
        width={1260}
      >
        <Spin spinning={detailLoading}>
          <div className="warehouse-shipping-order-detail-toolbar">
            <div className="warehouse-shipping-order-segment-tabs">
              {sortedDetailSegments.map((segment) => {
                const active = activeDetailSegment?.id === segment.id
                return (
                  <Button
                    key={segment.id}
                    size="small"
                    type={active ? 'primary' : 'default'}
                    className="warehouse-shipping-order-segment-tab"
                    onClick={() => {
                      setSelectedDetailSegmentIds([segment.id])
                      setDetailMaterialFilter('ALL')
                    }}
                  >
                    {shippingOrderSegmentTabLabel(segment)}
                  </Button>
                )
              })}
            </div>
            <div className="warehouse-shipping-order-detail-actions">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={detailScopeActionDisabled}
                onClick={() => detailShippingOrderTarget && void openLogisticsQuoteExportModal(detailShippingOrderTarget, activeDetailSegmentIds)}
              >
                导出审核单
              </Button>
              <Upload
                accept=".xls,.xlsx"
                showUploadList={false}
                beforeUpload={(file) => {
                  if (detailShippingOrderTarget) {
                    void handleImportLogisticsQuoteReport(detailShippingOrderTarget, file as File, activeDetailSegmentIds)
                  }
                  return false
                }}
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  disabled={detailScopeActionDisabled}
                  loading={actionKey === `logistics-quote-import:${detailShippingOrderTarget?.id}`}
                >
                  回传报价
                </Button>
              </Upload>
              <Button
                size="small"
                icon={<FileDoneOutlined />}
                disabled={detailScopeActionDisabled || activeDetailSegmentIds.length !== 1}
                loading={actionKey === `generate-expected-bill:${detailShippingOrderTarget?.id}`}
                onClick={() => detailShippingOrderTarget && void handleGenerateExpectedBill(detailShippingOrderTarget, activeDetailSegmentIds)}
              >
                生成账单
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                disabled={detailScopeActionDisabled || activeDetailSegmentSubmitted}
                loading={actionKey === `submit-shipping:${detailShippingOrderTarget?.id}`}
                onClick={() => detailShippingOrderTarget && void handleSubmitShipping(detailShippingOrderTarget, activeDetailSegmentIds)}
              >
                {activeDetailSegmentSubmitted ? '已提交' : '提交发货'}
              </Button>
            </div>
          </div>
          <div className="warehouse-shipping-order-detail-subbar">
            <Segmented
              size="small"
              value={detailMaterialFilter}
              options={[
                { label: `全部 ${activeDetailLines.length}`, value: 'ALL' },
                { label: `材料缺失 ${activeDetailMissingMaterialCount}`, value: 'MISSING' }
              ]}
              onChange={(value) => setDetailMaterialFilter(value as 'ALL' | 'MISSING')}
            />
            <div className="warehouse-shipping-order-quote-counts">
              <Tag color="gold">待报价 {activeDetailPendingQuoteCount}</Tag>
              <Tag color="green">已报价 {activeDetailConfirmedQuoteCount}</Tag>
            </div>
            {activeDetailSegment ? (
              <div className="warehouse-shipping-order-segment-summary">
                <Tag color="processing">{activeDetailSegment.segmentNo}</Tag>
                <Text type="secondary">{activeDetailSegment.forwarderName || '-'}</Text>
                <Text type="secondary">{formatQuantity(Number(activeDetailSegment.totalQuantity || 0))} 件</Text>
                <Tag color={activeDetailSegment.quoteStatus === 'CONFIRMED' ? 'green' : 'gold'}>
                  {activeDetailSegment.quoteStatus === 'CONFIRMED' ? '已报价' : '待报价'}
                </Tag>
                <Tag color={activeDetailSegment.shippingSubmitStatus === 'SUBMITTED' ? 'blue' : activeDetailSegment.shippingSubmitStatus === 'PARTIAL_SUBMITTED' ? 'purple' : 'default'}>
                  {shippingSubmitLabel(activeDetailSegment.shippingSubmitStatus)}
                </Tag>
              </div>
            ) : null}
          </div>
          {visibleQuoteImportResult ? (
            <Alert
              className="warehouse-shipping-order-import-alert"
              type={Number(visibleQuoteImportResult.updatedRows || 0) > 0 && !visibleQuoteImportResult.skippedRows ? 'success' : 'warning'}
              showIcon
              message={quoteImportResultTitle(visibleQuoteImportResult)}
              description={quoteImportResultContent(visibleQuoteImportResult)}
            />
          ) : null}
          <Table<ShippingOrderLine>
            size="small"
            rowKey="id"
            scroll={{ x: 1205 }}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            columns={[
              {
                title: '商品',
                dataIndex: 'productTitle',
                width: 610,
                render: (_, line) => {
                  const imageUrl = shippingOrderLineImageUrl(line)
                  const titleCn = shippingOrderLineTitleCn(line)
                  return (
                    <div className="warehouse-shipping-order-product-cell">
                      {imageUrl ? (
                        <Image
                          className="warehouse-shipping-order-product-image"
                          src={imageUrl}
                          alt={titleCn}
                          width={70}
                          height={70}
                          preview={{ src: imageUrl }}
                        />
                      ) : (
                        <div className="warehouse-shipping-order-product-placeholder" />
                      )}
                      <div>
                        <Text strong className="warehouse-shipping-order-product-title-cn">
                          {titleCn}
                        </Text>
                        <Text type="secondary" className="warehouse-shipping-order-product-title-en">
                          {shippingOrderLineTitleEn(line)}
                        </Text>
                      </div>
                    </div>
                  )
                }
              },
              {
                title: 'Barcode',
                dataIndex: 'barcode',
                width: 105,
                render: (_, line) => line.barcode || '-'
              },
              {
                title: '来源采购单',
                dataIndex: 'purchaseOrderNo',
                width: 120,
                render: (_, line) => (
                  <div className="warehouse-shipping-order-source-name">
                    <Text>{line.purchaseOrderTitle || line.purchaseOrderNo}</Text>
                  </div>
                )
              },
              {
                title: '店铺',
                dataIndex: 'sourceStoreName',
                width: 90,
                render: (_, line) => line.sourceStoreCode || '-'
              },
              {
                title: '站点',
                dataIndex: 'siteCode',
                width: 60
              },
              {
                title: '数量',
                dataIndex: 'quantity',
                width: 70,
                align: 'right',
                render: (value) => formatQuantity(Number(value || 0))
              },
              {
                title: '义特材质',
                dataIndex: 'yiteMaterial',
                width: 150,
                render: (_, line) => (
                  <Select
                    size="small"
                    allowClear
                    placeholder="选择材质"
                    options={YITE_MATERIAL_OPTIONS}
                    value={line.yiteMaterial || undefined}
                    disabled={detailShippingOrderTarget?.shippingSubmitStatus === 'SUBMITTED'}
                    loading={actionKey === `update-yite-material:${line.id}`}
                    onChange={(value) => void handleUpdateLineYiteMaterial(line, value)}
                  />
                )
              }
            ]}
            dataSource={visibleDetailLines}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={detailMaterialFilter === 'MISSING' ? '暂无材料缺失商品' : '暂无商品'}
                />
              )
            }}
          />
        </Spin>
      </Modal>

      <Modal
        title="新增发货单"
        open={createModalOpen}
        width={860}
        onCancel={() => setCreateModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!selectedSourceOrderIds.length}
            loading={actionKey === 'create-shipping-order'}
            onClick={() => void handleCreateShippingOrder()}
          >
            创建发货单
          </Button>
        ]}
      >
        <div className="warehouse-shipping-order-create-modal">
          <Alert
            type="info"
            showIcon
            message={`只显示已提交采购单。已选 ${selectedSourceOrders.length} 单，合计 ${formatQuantity(sumPurchaseOrderQuantity(selectedSourceOrders))} 件。`}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索采购单 / SKU"
            value={sourceKeyword}
            onChange={(event) => setSourceKeyword(event.target.value)}
          />
          <Table<PurchaseOrder>
            size="small"
            rowKey="id"
            rowSelection={sourceOrderSelection}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            columns={[
              {
                title: '采购单',
                dataIndex: 'title',
                render: (_, order) => (
                  <div className="warehouse-shipping-order-source-name">
                    <Text strong>{order.title || order.orderNo}</Text>
                    <Text type="secondary">{order.orderNo}</Text>
                  </div>
                )
              },
              {
                title: '店铺',
                dataIndex: 'storeName',
                width: 150,
                render: (_, order) => order.storeName || order.storeCode
              },
              {
                title: 'SKU',
                width: 90,
                render: (_, order) => countPurchaseOrderSku(order)
              },
              {
                title: '数量',
                width: 100,
                render: (_, order) => formatQuantity(sumPurchaseOrderQuantity([order]))
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 120,
                render: (value) => formatDate(String(value || ''))
              }
            ]}
            dataSource={visiblePurchaseOrders}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已提交采购单" /> }}
          />
        </div>
      </Modal>

      <Modal
        title="导出发货单审核单"
        open={Boolean(quoteExportTarget)}
        okText={quoteSelectedForwarder?.templateName ? `导出 ${quoteSelectedForwarder.templateName}` : '导出'}
        cancelText="取消"
        okButtonProps={{
          disabled: quoteExportLoading || !quoteExportSelection.forwarderCode || !quoteExportSelection.routeCode,
          loading: actionKey === `logistics-quote-export:${quoteExportTarget?.id}`
        }}
        onOk={() => void handleExportLogisticsQuoteReport()}
        onCancel={closeLogisticsQuoteExportModal}
        width={720}
      >
        <Spin spinning={quoteExportLoading}>
          {quoteExportOptions?.forwarders?.length ? (
            <div className="warehouse-shipping-quote-export">
              <Alert
                type={quoteSelectedForwarder && quoteSelectedChannel ? 'success' : 'warning'}
                showIcon
                message={
                  quoteSelectedForwarder && quoteSelectedChannel
                    ? `将导出：${quoteChannelLabel(quoteSelectedForwarder, quoteSelectedChannel)}，全部 ${quoteExportTotalCount} 行（待报价 ${quoteExportPendingCount}，已报价 ${quoteExportConfirmedCount}）`
                    : `请先选择货代和渠道，待报价 ${quoteExportOptions.pendingLineCount || 0} 行，已报价商品会一并导出`
                }
              />
              <div className="warehouse-shipping-quote-export-controls">
                <Form.Item label="选择货代" required>
                  <Select
                    options={quoteForwarderOptions}
                    value={quoteExportSelection.forwarderCode}
                    onChange={handleQuoteExportForwarderChange}
                    placeholder="选择货代"
                    allowClear
                  />
                </Form.Item>
                <Form.Item label="选择渠道" required>
                  <Select
                    options={quoteChannelOptions}
                    value={quoteExportSelection.routeCode}
                    onChange={(routeCode) => setQuoteExportSelection((current) => ({ ...current, routeCode }))}
                    placeholder="选择渠道"
                    disabled={!quoteExportSelection.forwarderCode}
                    allowClear
                  />
                </Form.Item>
              </div>
              {quoteSelectedChannel ? (
                <div className="warehouse-shipping-quote-export-detail">
                  <Tag color="blue">{quoteForwarderLabel(quoteSelectedForwarder)}</Tag>
                  <Tag color="processing">{quoteSelectedChannel.siteCode || '-'}</Tag>
                  <strong>全部 {quoteExportTotalCount} 行</strong>
                </div>
              ) : null}
              {quoteSelectedForwarder?.templateName ? (
                <Text type="secondary">{quoteSelectedForwarder.templateName}</Text>
              ) : null}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={quoteExportOptions ? '当前发货单没有已配置模板的可导出渠道。' : '正在读取可导出渠道'}
            />
          )}
        </Spin>
      </Modal>
    </div>
  )
}

function filterShippingOrders(orders: ShippingOrder[], keyword: string) {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) {
    return orders
  }
  return orders.filter((order) => {
    const text = [
      order.shippingOrderNo,
      order.title,
      order.forwarderName,
      order.routeName,
      order.remark,
      ...(order.lines || []).flatMap((line) => [
        line.partnerSku,
        line.skuParent,
        line.productTitle,
        line.sourceStoreName,
        line.sourceStoreCode,
        line.purchaseOrderNo
      ])
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(normalized)
  })
}

function shippingOrderLineImageUrl(line: ShippingOrderLine) {
  return line.productImageUrl || undefined
}

function shippingOrderLineTitleCn(line: ShippingOrderLine) {
  return line.productTitleCn || line.productTitle || line.partnerSku || line.pskuCode || '-'
}

function shippingOrderLineTitleEn(line: ShippingOrderLine) {
  return line.productTitleEn || line.productTitle || line.partnerSku || line.pskuCode || '-'
}

function isYiteSegment(segment: ShippingOrderSegment) {
  const text = `${segment.forwarderCode || ''} ${segment.forwarderName || ''}`.trim()
  return /义特|YITE|\bYT\b/i.test(text)
}

function isMissingYiteMaterial(line: ShippingOrderLine, yiteSegmentIds: Set<string>) {
  return Boolean(line.shippingOrderSegmentId && yiteSegmentIds.has(line.shippingOrderSegmentId) && !line.yiteMaterial?.trim())
}

function filterPurchaseOrders(orders: PurchaseOrder[], keyword: string) {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) {
    return orders
  }
  return orders.filter((order) => {
    const text = [
      order.orderNo,
      order.title,
      order.storeName,
      order.storeCode,
      ...(order.items || []).flatMap((item) => [
        item.partnerSku,
        item.skuParent,
        item.productTitle,
        item.sourceTitle,
        item.sourceTitleCn,
        ...(item.allocations || []).map((allocation) => allocation.pskuCode)
      ])
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(normalized)
  })
}

function countPurchaseOrderSku(order: PurchaseOrder) {
  const skus = new Set<string>()
  for (const item of order.items || []) {
    if (item.partnerSku || item.skuParent) {
      skus.add(item.partnerSku || item.skuParent || '')
    }
  }
  return skus.size
}

function sumPurchaseOrderQuantity(orders: PurchaseOrder[]) {
  return orders.reduce((total, order) => total + (order.items || []).reduce((itemTotal, item) => itemTotal + Number(item.totalQuantity || 0), 0), 0)
}

function shippingOrderStatusMeta(order: ShippingOrder) {
  if (order.shippingSubmitStatus === 'SUBMITTED') {
    return { label: '已提交发货', color: 'green' }
  }
  if (order.shippingSubmitStatus === 'PARTIAL_SUBMITTED') {
    return { label: '部分提交', color: 'purple' }
  }
  if (order.quoteStatus === 'CONFIRMED') {
    return { label: '报价已确认', color: 'blue' }
  }
  if (order.quoteStatus === 'EXPORTED') {
    return { label: '已导出', color: 'cyan' }
  }
  return { label: '待报价', color: 'gold' }
}

function transportModeLabel(value?: string) {
  switch ((value || '').toUpperCase()) {
    case 'SEA':
      return '海运'
    case 'AIR':
      return '空运'
    case 'EXPRESS':
      return '快递'
    default:
      return value || '-'
  }
}

function shippingOrderSegmentTabLabel(segment: ShippingOrderSegment) {
  return [
    segment.siteCode || '-',
    transportModeLabel(segment.transportMode)
  ].join('-')
}

function sortShippingOrderSegments(segments: ShippingOrderSegment[]) {
  return [...segments].sort((left, right) => {
    const siteDiff = segmentSiteRank(left.siteCode) - segmentSiteRank(right.siteCode)
    if (siteDiff !== 0) {
      return siteDiff
    }
    const transportDiff = segmentTransportRank(left.transportMode) - segmentTransportRank(right.transportMode)
    if (transportDiff !== 0) {
      return transportDiff
    }
    return String(left.segmentNo || '').localeCompare(String(right.segmentNo || ''))
  })
}

function segmentSiteRank(siteCode?: string) {
  switch ((siteCode || '').toUpperCase()) {
    case 'SA':
      return 1
    case 'AE':
      return 2
    default:
      return 10
  }
}

function segmentTransportRank(transportMode?: string) {
  switch ((transportMode || '').toUpperCase()) {
    case 'AIR':
      return 1
    case 'SEA':
      return 2
    case 'EXPRESS':
      return 3
    default:
      return 10
  }
}

function shippingSubmitLabel(value?: string) {
  switch ((value || '').toUpperCase()) {
    case 'SUBMITTED':
      return '已提交'
    case 'PARTIAL_SUBMITTED':
      return '部分提交'
    default:
      return '未提交'
  }
}

function findQuoteForwarderOption(
  options?: PurchaseOrderLogisticsQuoteOptions | null,
  forwarderCode?: string
) {
  if (!forwarderCode) {
    return undefined
  }
  return options?.forwarders?.find((item) => item.forwarderCode === forwarderCode)
}

function findQuoteChannelOption(
  forwarder?: PurchaseOrderLogisticsQuoteForwarderOption,
  routeCode?: string
) {
  if (!routeCode) {
    return undefined
  }
  return forwarder?.channels?.find((item) => item.routeCode === routeCode)
}

function buildQuoteForwarderSelectOptions(options?: PurchaseOrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).map((forwarder) => ({
    value: forwarder.forwarderCode,
    label: quoteForwarderLabel(forwarder)
  }))
}

function buildQuoteChannelSelectOptions(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption) {
  return (forwarder?.channels || []).map((channel) => ({
    value: channel.routeCode,
    label: quoteChannelLabel(forwarder, channel)
  }))
}

function quoteForwarderLabel(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption) {
  const text = `${forwarder?.forwarderName || ''} ${forwarder?.forwarderCode || ''}`.trim()
  if (/义特|YITE|YT/i.test(text)) {
    return '义特'
  }
  if (/易通|\bET\b/i.test(text)) {
    return '易通'
  }
  return forwarder?.forwarderName || forwarder?.forwarderCode || '-'
}

function quoteChannelLabel(
  forwarder: PurchaseOrderLogisticsQuoteForwarderOption | undefined,
  channel: PurchaseOrderLogisticsQuoteChannelOption
) {
  return [
    quoteForwarderLabel(forwarder),
    channel.siteCode || channel.routeCode
  ].filter(Boolean).join(' / ')
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatDate(value?: string) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function quoteImportResultContent(result: PurchaseOrderLogisticsQuoteImportResult) {
  const summary = `识别 ${formatQuantity(Number(result.totalRows || 0))} 行，更新 ${formatQuantity(Number(result.updatedRows || 0))} 行，跳过 ${formatQuantity(Number(result.skippedRows || 0))} 行。`
  const errors = (result.errors || [])
    .slice(0, 6)
    .map((error) => `第 ${error.rowNumber || '-'} 行：${error.message || '未更新'}`)
  if (!errors.length) {
    return <Text>{summary}</Text>
  }
  const moreCount = (result.errors || []).length - errors.length
  return (
    <div className="warehouse-shipping-order-import-result">
      <Text>{summary}</Text>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
      {moreCount > 0 ? <Text type="secondary">其余 {moreCount} 条请检查文件。</Text> : null}
    </div>
  )
}

function quoteImportResultTitle(result: PurchaseOrderLogisticsQuoteImportResult) {
  const updatedRows = Number(result.updatedRows || 0)
  const skippedRows = Number(result.skippedRows || 0)
  if (updatedRows > 0 && skippedRows > 0) {
    return `已回传 ${formatQuantity(updatedRows)} 行，跳过 ${formatQuantity(skippedRows)} 行`
  }
  if (updatedRows > 0) {
    return `已回传 ${formatQuantity(updatedRows)} 行`
  }
  return '报价未更新'
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }
  const rightSet = new Set(right)
  return left.every((value) => rightSet.has(value))
}

function saveBlobFile(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
