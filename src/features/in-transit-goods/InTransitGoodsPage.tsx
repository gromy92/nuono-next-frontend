import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  Upload,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  confirmInTransitImport,
  deleteInTransitGoodsLine,
  downloadInTransitImportTemplate,
  fetchInTransitBatches,
  fetchInTransitContract,
  fetchInTransitForwarders,
  fetchInTransitGoodsLines,
  fetchInTransitLogisticsNodes,
  previewInTransitImport,
  saveInTransitGoodsLine,
  saveInTransitLogisticsNode,
  saveInTransitBatch
} from './api'
import type {
  InTransitBatch,
  InTransitBatchFilters,
  InTransitContract,
  InTransitForwarder,
  InTransitGoodsLine,
  InTransitImportIssue,
  InTransitImportPreview,
  InTransitImportPreviewBatch,
  InTransitImportPreviewLine,
  InTransitLogisticsNode,
  SaveInTransitGoodsLineRequest,
  SaveInTransitLogisticsNodeRequest,
  SaveInTransitBatchRequest
} from './types'
import './InTransitGoodsPage.css'

const { RangePicker } = DatePicker
const { Text, Title } = Typography
const DEFAULT_FILTERS: InTransitBatchFilters = { statusScope: 'all' }

type PageState =
  | { status: 'idle' | 'loading'; data?: InTransitBatch[]; message?: string }
  | { status: 'success'; data: InTransitBatch[]; message?: string }
  | { status: 'error'; data?: InTransitBatch[]; message: string }

type InTransitBoxGroup = {
  boxNo: string
  lines: InTransitGoodsLine[]
  skuCount: number
  shippedQuantityTotal: number
  receivedQuantityTotal: number
  remainingQuantityTotal: number
  cartonCountTotal: number | null
}

const DEFAULT_CONTRACT: InTransitContract = {
  transportModes: [
    { code: 'SEA', label: '海运' },
    { code: 'AIR', label: '空运' }
  ],
  batchStatuses: [
    { code: 'draft', label: '草稿' },
    { code: 'pending_shipment', label: '待发货' },
    { code: 'shipped', label: '已发货' },
    { code: 'in_transit', label: '运输中' },
    { code: 'customs_clearance', label: '清关中' },
    { code: 'delivering', label: '派送中' },
    { code: 'warehouse_received', label: '已入仓' },
    { code: 'exception', label: '异常' },
    { code: 'completed', label: '已完成' },
    { code: 'cancelled', label: '已取消' }
  ],
  nodeStatuses: [
    { code: 'created', label: '已登记' },
    { code: 'handed_to_forwarder', label: '已交货代' },
    { code: 'departed_origin', label: '起运地发出' },
    { code: 'in_transit', label: '运输中' },
    { code: 'arrived_port', label: '到港' },
    { code: 'customs_clearance', label: '清关中' },
    { code: 'customs_released', label: '清关完成' },
    { code: 'delivering', label: '派送中' },
    { code: 'warehouse_received', label: '已入仓' },
    { code: 'exception', label: '异常' },
    { code: 'cancelled', label: '已取消' }
  ],
  qualityStatuses: [],
  purchaseOrderFields: [],
  feeFields: []
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  forwarder: '货代',
  transportMode: '运输方式',
  targetStoreCode: '目标店铺',
  targetWarehouseName: '目标仓'
}

function formatNodeDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

function normalizeNodeDateTime(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return undefined
  }
  return trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
}

function nodeTimelineColor(status?: string | null) {
  if (status === 'exception') {
    return 'red'
  }
  if (status === 'warehouse_received') {
    return 'green'
  }
  if (status === 'customs_clearance') {
    return 'orange'
  }
  return 'blue'
}

function importIssueColor(level?: string | null) {
  return level === 'error' ? 'red' : 'gold'
}

export function InTransitGoodsPage() {
  const [state, setState] = useState<PageState>({ status: 'idle' })
  const [contract, setContract] = useState<InTransitContract>(DEFAULT_CONTRACT)
  const [forwarders, setForwarders] = useState<InTransitForwarder[]>([])
  const [filters, setFilters] = useState<InTransitBatchFilters>(DEFAULT_FILTERS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<InTransitBatch | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lines, setLines] = useState<InTransitGoodsLine[]>([])
  const [loadingLines, setLoadingLines] = useState(false)
  const [lineEditorOpen, setLineEditorOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<InTransitGoodsLine | null>(null)
  const [submittingLine, setSubmittingLine] = useState(false)
  const [boxModalOpen, setBoxModalOpen] = useState(false)
  const [boxModalBatch, setBoxModalBatch] = useState<InTransitBatch | null>(null)
  const [boxLines, setBoxLines] = useState<InTransitGoodsLine[]>([])
  const [loadingBoxLines, setLoadingBoxLines] = useState(false)
  const [nodes, setNodes] = useState<InTransitLogisticsNode[]>([])
  const [loadingNodes, setLoadingNodes] = useState(false)
  const [nodeEditorOpen, setNodeEditorOpen] = useState(false)
  const [submittingNode, setSubmittingNode] = useState(false)
  const [importDrawerOpen, setImportDrawerOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<InTransitImportPreview | null>(null)
  const [previewingImport, setPreviewingImport] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [form] = Form.useForm<SaveInTransitBatchRequest & { dateRange?: [dayjs.Dayjs, dayjs.Dayjs] }>()
  const [lineForm] = Form.useForm<SaveInTransitGoodsLineRequest>()
  const [nodeForm] = Form.useForm<SaveInTransitLogisticsNodeRequest>()

  const transportOptions = useMemo(
    () => contract.transportModes.map((item) => ({ label: item.label, value: item.code })),
    [contract.transportModes]
  )
  const statusOptions = useMemo(
    () => contract.batchStatuses.map((item) => ({ label: item.label, value: item.code })),
    [contract.batchStatuses]
  )
  const nodeOptions = useMemo(
    () => contract.nodeStatuses.map((item) => ({ label: item.label, value: item.code })),
    [contract.nodeStatuses]
  )
  const forwarderOptions = useMemo(
    () => forwarders.map((item) => ({
      label: item.forwarderName || item.forwarderCode || `#${item.id}`,
      value: item.id
    })),
    [forwarders]
  )

  const statusLabel = useMemo(
    () => new Map(contract.batchStatuses.map((item) => [item.code, item.label])),
    [contract.batchStatuses]
  )
  const transportLabel = useMemo(
    () => new Map(contract.transportModes.map((item) => [item.code, item.label])),
    [contract.transportModes]
  )
  const nodeStatusLabel = useMemo(
    () => new Map(contract.nodeStatuses.map((item) => [item.code, item.label])),
    [contract.nodeStatuses]
  )

  const load = async (nextFilters: InTransitBatchFilters = filters) => {
    setState((current) => ({ status: 'loading', data: current.data }))
    try {
      const [nextContract, nextForwarders, list] = await Promise.all([
        fetchInTransitContract(),
        fetchInTransitForwarders(),
        fetchInTransitBatches(nextFilters)
      ])
      setContract(nextContract)
      setForwarders(nextForwarders)
      setState({ status: 'success', data: list.items ?? [] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '在途批次加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = state.data ?? []

  const boxGroups = useMemo<InTransitBoxGroup[]>(() => {
    const groups = new Map<string, InTransitGoodsLine[]>()
    boxLines.forEach((line) => {
      const boxNo = line.boxNo?.trim() || '未填写箱号'
      const current = groups.get(boxNo) ?? []
      current.push(line)
      groups.set(boxNo, current)
    })
    return Array.from(groups.entries()).map(([boxNo, groupLines]) => {
      const cartonValues = groupLines.map((line) => line.cartonCount).filter((value): value is number => value !== null && value !== undefined)
      return {
        boxNo,
        lines: groupLines,
        skuCount: groupLines.length,
        shippedQuantityTotal: groupLines.reduce((total, line) => total + (line.shippedQuantity ?? 0), 0),
        receivedQuantityTotal: groupLines.reduce((total, line) => total + (line.receivedQuantity ?? 0), 0),
        remainingQuantityTotal: groupLines.reduce((total, line) => total + (line.remainingQuantity ?? 0), 0),
        cartonCountTotal: cartonValues.length ? cartonValues.reduce((total, value) => total + value, 0) : null
      }
    })
  }, [boxLines])

  const openCreate = () => {
    setEditingBatch(null)
    setLines([])
    setNodes([])
    setLineEditorOpen(false)
    setNodeEditorOpen(false)
    setEditingLine(null)
    lineForm.resetFields()
    nodeForm.resetFields()
    form.resetFields()
    form.setFieldsValue({ batchStatus: 'draft' })
    setDrawerOpen(true)
  }

  const loadLines = async (batchId: number) => {
    setLoadingLines(true)
    try {
      const nextLines = await fetchInTransitGoodsLines(batchId)
      setLines(nextLines.items ?? [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品明细加载失败')
      setLines([])
    } finally {
      setLoadingLines(false)
    }
  }

  const openBoxModal = async (row: InTransitBatch) => {
    setBoxModalBatch(row)
    setBoxLines([])
    setBoxModalOpen(true)
    setLoadingBoxLines(true)
    try {
      const nextLines = await fetchInTransitGoodsLines(row.batchId)
      setBoxLines(nextLines.items ?? [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '箱子明细加载失败')
      setBoxLines([])
    } finally {
      setLoadingBoxLines(false)
    }
  }

  const loadNodes = async (batchId: number) => {
    setLoadingNodes(true)
    try {
      const nextNodes = await fetchInTransitLogisticsNodes(batchId)
      setNodes(nextNodes.items ?? [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '物流节点加载失败')
      setNodes([])
    } finally {
      setLoadingNodes(false)
    }
  }

  const openEdit = (row: InTransitBatch) => {
    setEditingBatch(row)
    setLineEditorOpen(false)
    setNodeEditorOpen(false)
    setEditingLine(null)
    lineForm.resetFields()
    nodeForm.resetFields()
    setNodes([])
    form.setFieldsValue({
      batchId: row.batchId,
      standardForwarderId: row.standardForwarderId ?? undefined,
      rawForwarderName: row.rawForwarderName ?? undefined,
      transportMode: row.transportMode ?? undefined,
      targetStoreCode: row.targetStoreCode ?? undefined,
      targetSiteCode: row.targetSiteCode ?? undefined,
      targetWarehouseName: row.targetWarehouseName ?? undefined,
      departureDate: row.departureDate ?? undefined,
      etaDate: row.etaDate ?? undefined,
      trackingNo: row.trackingNo ?? undefined,
      containerNo: row.containerNo ?? undefined,
      batchReferenceNo: row.batchReferenceNo ?? undefined,
      batchStatus: row.batchStatus ?? 'draft',
      remark: row.remark ?? undefined
    })
    void loadLines(row.batchId)
    void loadNodes(row.batchId)
    setDrawerOpen(true)
  }

  const applyFilters = () => {
    void load(filters)
  }

  const submit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await saveInTransitBatch({
        ...values,
        batchId: editingBatch?.batchId,
        departureDate: values.departureDate ? String(values.departureDate) : undefined,
        etaDate: values.etaDate ? String(values.etaDate) : undefined
      })
      message.success('在途批次已保存')
      setDrawerOpen(false)
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '在途批次保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateLine = () => {
    setEditingLine(null)
    lineForm.resetFields()
    setLineEditorOpen(true)
  }

  const openEditLine = (row: InTransitGoodsLine) => {
    setEditingLine(row)
    lineForm.setFieldsValue({
      lineId: row.lineId,
      boxNo: row.boxNo ?? undefined,
      sku: row.sku,
      msku: row.msku ?? undefined,
      psku: row.psku ?? undefined,
      productName: row.productName ?? undefined,
      storeCode: row.storeCode ?? undefined,
      siteCode: row.siteCode ?? undefined,
      shippedQuantity: row.shippedQuantity,
      receivedQuantity: row.receivedQuantity,
      cartonCount: row.cartonCount ?? undefined,
      unitsPerCarton: row.unitsPerCarton ?? undefined,
      cartonWeightKg: row.cartonWeightKg ?? undefined,
      cartonVolumeCbm: row.cartonVolumeCbm ?? undefined,
      remark: row.remark ?? undefined
    })
    setLineEditorOpen(true)
  }

  const submitLine = async () => {
    if (!editingBatch) {
      return
    }
    const values = await lineForm.validateFields()
    setSubmittingLine(true)
    try {
      await saveInTransitGoodsLine(editingBatch.batchId, {
        ...values,
        lineId: editingLine?.lineId
      })
      message.success('商品明细已保存')
      setLineEditorOpen(false)
      setEditingLine(null)
      lineForm.resetFields()
      await loadLines(editingBatch.batchId)
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品明细保存失败')
    } finally {
      setSubmittingLine(false)
    }
  }

  const removeLine = async (row: InTransitGoodsLine) => {
    if (!editingBatch) {
      return
    }
    setSubmittingLine(true)
    try {
      const nextLines = await deleteInTransitGoodsLine(editingBatch.batchId, row.lineId)
      setLines(nextLines.items ?? [])
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品明细删除失败')
    } finally {
      setSubmittingLine(false)
    }
  }

  const openCreateNode = () => {
    nodeForm.resetFields()
    setNodeEditorOpen(true)
  }

  const submitNode = async () => {
    if (!editingBatch) {
      return
    }
    const values = await nodeForm.validateFields()
    setSubmittingNode(true)
    try {
      await saveInTransitLogisticsNode(editingBatch.batchId, {
        ...values,
        nodeHappenedAt: normalizeNodeDateTime(values.nodeHappenedAt)
      })
      message.success('物流节点已保存')
      setNodeEditorOpen(false)
      nodeForm.resetFields()
      await loadNodes(editingBatch.batchId)
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '物流节点保存失败')
    } finally {
      setSubmittingNode(false)
    }
  }

  const openImportDrawer = () => {
    setImportPreview(null)
    setImportDrawerOpen(true)
  }

  const handleImportFile = async (file: File) => {
    setPreviewingImport(true)
    try {
      const preview = await previewInTransitImport(file)
      setImportPreview(preview)
      if ((preview.errorCount ?? 0) > 0) {
        message.warning('导入预览存在错误，请修正模板后重传')
      } else {
        message.success('导入预览已生成')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入预览失败')
    } finally {
      setPreviewingImport(false)
    }
  }

  const handleDownloadImportTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const blob = await downloadInTransitImportTemplate()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = '在途商品导入模板.xlsx'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      message.success('导入模板已下载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入模板下载失败')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const submitImportConfirm = async () => {
    if (!importPreview) {
      return
    }
    setConfirmingImport(true)
    try {
      const result = await confirmInTransitImport(importPreview.importBatchId)
      message.success(`已导入 ${result.importedBatchCount ?? 0} 个批次、${result.importedLineCount ?? 0} 条商品`)
      setImportDrawerOpen(false)
      setImportPreview(null)
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '确认导入失败')
    } finally {
      setConfirmingImport(false)
    }
  }

  const columns = useMemo<ColumnsType<InTransitBatch>>(
    () => [
      {
        title: '批次',
        key: 'batch',
        fixed: 'left',
        width: 180,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.batchReferenceNo || `#${row.batchId}`}</Text>
            <Text type="secondary">{row.trackingNo || row.containerNo || '-'}</Text>
          </Space>
        )
      },
      {
        title: '货代',
        key: 'forwarder',
        width: 180,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{row.standardForwarderName || row.rawForwarderName || '-'}</Text>
            {row.forwarderQualityStatus === 'forwarder_unmatched' ? (
              <Tag color="orange" style={{ marginInlineEnd: 0 }}>未归一</Tag>
            ) : (
              <Tag color="green" style={{ marginInlineEnd: 0 }}>已归一</Tag>
            )}
          </Space>
        )
      },
      {
        title: '运输',
        dataIndex: 'transportMode',
        key: 'transportMode',
        width: 100,
        render: (value) => value ? <Tag color={value === 'AIR' ? 'blue' : 'cyan'}>{transportLabel.get(value) || value}</Tag> : '-'
      },
      {
        title: '目标',
        key: 'target',
        width: 170,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{[row.targetStoreCode, row.targetSiteCode].filter(Boolean).join(' / ') || '-'}</Text>
            <Text type="secondary">{row.targetWarehouseName || '-'}</Text>
          </Space>
        )
      },
      {
        title: 'ETA',
        dataIndex: 'etaDate',
        key: 'etaDate',
        width: 120,
        render: (value) => value || '-'
      },
      {
        title: '状态',
        dataIndex: 'batchStatus',
        key: 'batchStatus',
        width: 120,
        render: (value) => <Tag color={value === 'exception' ? 'red' : value === 'draft' ? 'default' : 'purple'}>{statusLabel.get(value) || value || '-'}</Tag>
      },
      {
        title: '最新节点',
        key: 'latestNode',
        width: 210,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            {row.latestNodeStatus ? (
              <Tag color={nodeTimelineColor(row.latestNodeStatus)} style={{ marginInlineEnd: 0 }}>
                {nodeStatusLabel.get(row.latestNodeStatus) || row.latestNodeStatus}
              </Tag>
            ) : (
              <Text type="secondary">-</Text>
            )}
            <Text type="secondary">{formatNodeDateTime(row.latestNodeHappenedAt)}</Text>
            <Text>{row.latestNodeDescription || '-'}</Text>
          </Space>
        )
      },
      {
        title: '汇总',
        key: 'summary',
        width: 310,
        render: (_value, row) => (
          <Space size={10} wrap>
            <span className="in-transit-page__stat">SKU {row.skuCount ?? '-'}</span>
            <span className="in-transit-page__stat">发货 {row.shippedQuantityTotal ?? '-'}</span>
            <span className="in-transit-page__stat">入仓 {row.receivedQuantityTotal ?? '-'}</span>
            <span className="in-transit-page__stat">剩余 {row.remainingQuantityTotal ?? '-'}</span>
            <span className="in-transit-page__stat">箱数 {row.cartonCountTotal ?? '-'}</span>
            <span className="in-transit-page__stat">重量 {row.totalWeightKg ?? '-'}</span>
            <span className="in-transit-page__stat">体积 {row.totalVolumeCbm ?? '-'}</span>
          </Space>
        )
      },
      {
        title: '缺项',
        key: 'missing',
        width: 180,
        render: (_value, row) => (
          <div className="in-transit-page__missing">
            {(row.missingFields ?? []).length ? (
              row.missingFields?.map((item) => (
                <Tag key={item} color="gold" style={{ marginInlineEnd: 0 }}>
                  {MISSING_FIELD_LABELS[item] || item}
                </Tag>
              ))
            ) : (
              <Text type="secondary">-</Text>
            )}
          </div>
        )
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 180,
        render: (_value, row) => (
          <Space size={6}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => void openBoxModal(row)}>
              查看箱子
            </Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
              编辑
            </Button>
          </Space>
        )
      }
    ],
    [nodeStatusLabel, statusLabel, transportLabel]
  )

  const lineColumns = useMemo<ColumnsType<InTransitGoodsLine>>(
    () => [
      {
        title: '箱号',
        dataIndex: 'boxNo',
        key: 'boxNo',
        width: 150,
        render: (value) => value || '-'
      },
      {
        title: '商品',
        key: 'goods',
        width: 220,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.sku}</Text>
            <Text type="secondary">{[row.msku, row.psku].filter(Boolean).join(' / ') || '-'}</Text>
            <Text type="secondary">{row.productName || '-'}</Text>
          </Space>
        )
      },
      {
        title: '店铺',
        key: 'store',
        width: 140,
        render: (_value, row) => [row.storeCode, row.siteCode].filter(Boolean).join(' / ') || '-'
      },
      {
        title: '数量',
        key: 'quantity',
        width: 170,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>发货 {row.shippedQuantity ?? '-'}</Text>
            <Text>入仓 {row.receivedQuantity ?? '-'}</Text>
            <Text>剩余 {row.remainingQuantity ?? '-'}</Text>
          </Space>
        )
      },
      {
        title: '箱规',
        key: 'carton',
        width: 180,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>箱数 {row.cartonCount ?? '-'}</Text>
            <Text>单箱 {row.unitsPerCarton ?? '-'}</Text>
            <Text>重量 {row.cartonWeightKg ?? '-'}</Text>
            <Text>体积 {row.cartonVolumeCbm ?? '-'}</Text>
          </Space>
        )
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 120,
        render: (value) => value || '-'
      },
      {
        title: '操作',
        key: 'actions',
        width: 140,
        render: (_value, row) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditLine(row)}>
              编辑
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} loading={submittingLine} onClick={() => void removeLine(row)}>
              删除
            </Button>
          </Space>
        )
      }
    ],
    [editingBatch, filters, submittingLine]
  )

  const boxColumns = useMemo<ColumnsType<InTransitBoxGroup>>(
    () => [
      {
        title: '箱号',
        dataIndex: 'boxNo',
        key: 'boxNo',
        width: 180,
        render: (value) => <Text strong>{value}</Text>
      },
      {
        title: 'SKU数',
        dataIndex: 'skuCount',
        key: 'skuCount',
        width: 90
      },
      {
        title: '数量汇总',
        key: 'quantity',
        width: 260,
        render: (_value, row) => (
          <Space size={10} wrap>
            <span className="in-transit-page__stat">发货 {row.shippedQuantityTotal}</span>
            <span className="in-transit-page__stat">入仓 {row.receivedQuantityTotal}</span>
            <span className="in-transit-page__stat">剩余 {row.remainingQuantityTotal}</span>
            <span className="in-transit-page__stat">箱数 {row.cartonCountTotal ?? '-'}</span>
          </Space>
        )
      }
    ],
    []
  )

  const boxLineColumns = useMemo<ColumnsType<InTransitGoodsLine>>(
    () => [
      {
        title: 'SKU',
        key: 'sku',
        width: 220,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.sku}</Text>
            <Text type="secondary">{[row.msku, row.psku].filter(Boolean).join(' / ') || '-'}</Text>
            <Text type="secondary">{row.productName || '-'}</Text>
          </Space>
        )
      },
      {
        title: '店铺',
        key: 'store',
        width: 150,
        render: (_value, row) => [row.storeCode, row.siteCode].filter(Boolean).join(' / ') || '-'
      },
      {
        title: '数量',
        key: 'quantity',
        width: 180,
        render: (_value, row) => (
          <Space size={8} wrap>
            <span>发货 {row.shippedQuantity ?? '-'}</span>
            <span>入仓 {row.receivedQuantity ?? '-'}</span>
            <span>剩余 {row.remainingQuantity ?? '-'}</span>
          </Space>
        )
      },
      {
        title: '箱规',
        key: 'carton',
        width: 220,
        render: (_value, row) => (
          <Space size={8} wrap>
            <span>箱数 {row.cartonCount ?? '-'}</span>
            <span>单箱 {row.unitsPerCarton ?? '-'}</span>
            <span>重量 {row.cartonWeightKg ?? '-'}</span>
            <span>体积 {row.cartonVolumeCbm ?? '-'}</span>
          </Space>
        )
      }
    ],
    []
  )

  const importIssueColumns = useMemo<ColumnsType<InTransitImportIssue>>(
    () => [
      {
        title: '级别',
        dataIndex: 'level',
        key: 'level',
        width: 80,
        render: (value) => <Tag color={importIssueColor(value)}>{value === 'error' ? '错误' : '提醒'}</Tag>
      },
      {
        title: '行号',
        dataIndex: 'rowNumber',
        key: 'rowNumber',
        width: 72,
        render: (value) => value ?? '-'
      },
      {
        title: '字段',
        dataIndex: 'field',
        key: 'field',
        width: 140,
        render: (value) => value || '-'
      },
      {
        title: '说明',
        dataIndex: 'message',
        key: 'message'
      }
    ],
    []
  )

  const importLineColumns = useMemo<ColumnsType<InTransitImportPreviewLine>>(
    () => [
      {
        title: '行',
        dataIndex: 'rowNumber',
        key: 'rowNumber',
        width: 60
      },
      {
        title: 'SKU',
        key: 'sku',
        width: 220,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.sku || '-'}</Text>
            <Text type="secondary">{[row.msku, row.psku].filter(Boolean).join(' / ') || '-'}</Text>
            <Text type="secondary">{row.productName || '-'}</Text>
          </Space>
        )
      },
      {
        title: '箱号',
        dataIndex: 'boxNo',
        key: 'boxNo',
        width: 150,
        render: (value) => value || '-'
      },
      {
        title: '数量',
        key: 'quantity',
        width: 160,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>发货 {row.shippedQuantity ?? '-'}</Text>
            <Text>入仓 {row.receivedQuantity ?? '-'}</Text>
          </Space>
        )
      },
      {
        title: '箱规',
        key: 'carton',
        width: 180,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>箱数 {row.cartonCount ?? '-'}</Text>
            <Text>单箱 {row.unitsPerCarton ?? '-'}</Text>
            <Text>重量 {row.cartonWeightKg ?? '-'}</Text>
            <Text>体积 {row.cartonVolumeCbm ?? '-'}</Text>
          </Space>
        )
      },
      {
        title: '校验',
        key: 'issues',
        width: 220,
        render: (_value, row) => (row.issues ?? []).length ? (
          <Space wrap size={4}>
            {row.issues?.map((issue) => (
              <Tag key={`${issue.code}-${issue.field}`} color={importIssueColor(issue.level)}>
                {issue.message}
              </Tag>
            ))}
          </Space>
        ) : (
          <Tag color="green">可导入</Tag>
        )
      }
    ],
    []
  )

  const importBatchColumns = useMemo<ColumnsType<InTransitImportPreviewBatch>>(
    () => [
      {
        title: '批次',
        key: 'batch',
        width: 180,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.batchReferenceNo || row.batchKey}</Text>
            <Text type="secondary">{row.trackingNo || row.containerNo || '-'}</Text>
          </Space>
        )
      },
      {
        title: '货代',
        key: 'forwarder',
        width: 170,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{row.standardForwarderName || row.rawForwarderName || '-'}</Text>
            <Tag color={row.forwarderQualityStatus === 'forwarder_matched' ? 'green' : 'gold'} style={{ marginInlineEnd: 0 }}>
              {row.forwarderQualityStatus === 'forwarder_matched' ? '已归一' : '待匹配'}
            </Tag>
          </Space>
        )
      },
      {
        title: '运输',
        dataIndex: 'transportMode',
        key: 'transportMode',
        width: 90,
        render: (value) => value ? <Tag>{transportLabel.get(value) || value}</Tag> : '-'
      },
      {
        title: '状态',
        dataIndex: 'batchStatus',
        key: 'batchStatus',
        width: 100,
        render: (value) => value ? <Tag>{statusLabel.get(value) || value}</Tag> : '-'
      },
      {
        title: '目标',
        key: 'target',
        width: 180,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{[row.targetStoreCode, row.targetSiteCode].filter(Boolean).join(' / ') || '-'}</Text>
            <Text type="secondary">{row.targetWarehouseName || '-'}</Text>
          </Space>
        )
      },
      {
        title: 'ETA',
        dataIndex: 'etaDate',
        key: 'etaDate',
        width: 100,
        render: (value) => value || '-'
      },
      {
        title: '商品行',
        key: 'lineCount',
        width: 90,
        render: (_value, row) => row.lines?.length ?? 0
      }
    ],
    [statusLabel, transportLabel]
  )

  return (
    <div className="in-transit-page" data-testid="in-transit-goods-page">
      <div className="in-transit-page__header">
        <Space direction="vertical" size={2}>
          <Title level={4} style={{ margin: 0 }}>在途商品</Title>
          <Text type="secondary">维护在途批次、货代归一、运输方式、目标仓和 ETA。</Text>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => load(filters)} loading={state.status === 'loading'}>
            刷新
          </Button>
          <Button icon={<UploadOutlined />} onClick={openImportDrawer}>
            导入预览
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建批次
          </Button>
        </Space>
      </div>

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      <div className="in-transit-page__toolbar">
        <Select
          allowClear
          placeholder="货代"
          options={forwarderOptions}
          value={filters.standardForwarderId}
          onChange={(value) => setFilters((current) => ({ ...current, standardForwarderId: value }))}
        />
        <Input
          allowClear
          placeholder="原始货代"
          value={filters.rawForwarderName}
          onChange={(event) => setFilters((current) => ({ ...current, rawForwarderName: event.target.value }))}
        />
        <Select
          allowClear
          placeholder="运输方式"
          options={transportOptions}
          value={filters.transportMode}
          onChange={(value) => setFilters((current) => ({ ...current, transportMode: value }))}
        />
        <Input
          allowClear
          placeholder="SKU/MSKU/PSKU"
          value={filters.skuKeyword}
          onChange={(event) => setFilters((current) => ({ ...current, skuKeyword: event.target.value }))}
        />
        <Input
          allowClear
          placeholder="目标店铺"
          value={filters.targetStoreCode}
          onChange={(event) => setFilters((current) => ({ ...current, targetStoreCode: event.target.value }))}
        />
        <Input
          allowClear
          placeholder="目标仓"
          value={filters.targetWarehouseName}
          onChange={(event) => setFilters((current) => ({ ...current, targetWarehouseName: event.target.value }))}
        />
        <Select
          placeholder="批次范围"
          options={[
            { label: '未完成', value: 'active' },
            { label: '已完成', value: 'completed' },
            { label: '全部历史', value: 'all' }
          ]}
          value={filters.statusScope}
          onChange={(value) => setFilters((current) => ({ ...current, statusScope: value }))}
        />
        <Select
          allowClear
          placeholder="当前状态"
          options={statusOptions}
          value={filters.batchStatus}
          onChange={(value) => setFilters((current) => ({ ...current, batchStatus: value }))}
        />
        <RangePicker
          placeholder={['ETA 起', 'ETA 止']}
          onChange={(dates) => setFilters((current) => ({
            ...current,
            etaFrom: dates?.[0]?.format('YYYY-MM-DD'),
            etaTo: dates?.[1]?.format('YYYY-MM-DD')
          }))}
        />
        <Button icon={<SearchOutlined />} type="primary" onClick={applyFilters}>
          筛选
        </Button>
      </div>

      <div className="in-transit-page__table">
        <Table
          rowKey="batchId"
          columns={columns}
          dataSource={rows}
          loading={state.status === 'loading'}
          locale={{ emptyText: '暂无在途批次' }}
          scroll={{ x: 1484 }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </div>

      <Modal
        title={`查看箱子${boxModalBatch?.batchReferenceNo ? ` - ${boxModalBatch.batchReferenceNo}` : ''}`}
        open={boxModalOpen}
        width={980}
        footer={<Button onClick={() => setBoxModalOpen(false)}>关闭</Button>}
        onCancel={() => setBoxModalOpen(false)}
      >
        <Table
          rowKey="boxNo"
          columns={boxColumns}
          dataSource={boxGroups}
          loading={loadingBoxLines}
          locale={{ emptyText: '暂无箱子明细' }}
          pagination={false}
          size="small"
          scroll={{ x: 560 }}
          expandable={{
            expandedRowKeys: boxGroups.map((box) => box.boxNo),
            expandedRowRender: (box) => (
              <Table
                rowKey="lineId"
                columns={boxLineColumns}
                dataSource={box.lines}
                pagination={false}
                size="small"
                scroll={{ x: 770 }}
              />
            )
          }}
        />
      </Modal>

      <Drawer
        title="历史数据导入预览"
        open={importDrawerOpen}
        width={980}
        destroyOnClose
        onClose={() => setImportDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setImportDrawerOpen(false)}>关闭</Button>
            <Button
              type="primary"
              loading={confirmingImport}
              disabled={!importPreview || (importPreview.errorCount ?? 0) > 0}
              onClick={() => void submitImportConfirm()}
            >
              确认导入
            </Button>
          </Space>
        }
      >
        <div className="in-transit-import">
          <div className="in-transit-import__upload">
            <Button
              icon={<DownloadOutlined />}
              loading={downloadingTemplate}
              onClick={() => void handleDownloadImportTemplate()}
            >
              下载模板
            </Button>
            <Upload
              accept=".csv,.xls,.xlsx"
              showUploadList={false}
              beforeUpload={(file) => {
                void handleImportFile(file as File)
                return false
              }}
            >
              <Button icon={<UploadOutlined />} loading={previewingImport}>
                选择文件
              </Button>
            </Upload>
            {importPreview?.fileName ? <Text type="secondary">{importPreview.fileName}</Text> : null}
          </div>

          {importPreview ? (
            <>
              <div className="in-transit-import__summary">
                <span className="in-transit-page__stat">行数 {importPreview.totalRowCount ?? 0}</span>
                <span className="in-transit-page__stat">有效 {importPreview.validRowCount ?? 0}</span>
                <span className="in-transit-page__stat">批次 {importPreview.willCreateBatchCount ?? 0}</span>
                <span className="in-transit-page__stat">商品 {importPreview.willUpsertLineCount ?? 0}</span>
                <Tag color={(importPreview.errorCount ?? 0) > 0 ? 'red' : 'green'}>
                  错误 {importPreview.errorCount ?? 0}
                </Tag>
                <Tag color={(importPreview.warningCount ?? 0) > 0 ? 'gold' : 'green'}>
                  提醒 {importPreview.warningCount ?? 0}
                </Tag>
              </div>

              {(importPreview.issues ?? []).length ? (
                <Table
                  rowKey={(row) => `${row.level}-${row.code}-${row.rowNumber ?? 0}-${row.field ?? ''}`}
                  columns={importIssueColumns}
                  dataSource={importPreview.issues}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Alert type="success" showIcon message="预览校验通过" />
              )}

              <Table
                rowKey="batchKey"
                columns={importBatchColumns}
                dataSource={importPreview.batches}
                pagination={false}
                size="small"
                scroll={{ x: 820 }}
                expandable={{
                  expandedRowKeys: importPreview.batches.map((batch) => batch.batchKey),
                  expandedRowRender: (batch) => (
                    <Table
                      rowKey={(row) => `${batch.batchKey}-${row.rowNumber}`}
                      columns={importLineColumns}
                      dataSource={batch.lines}
                      pagination={false}
                      size="small"
                      scroll={{ x: 990 }}
                    />
                  )
                }}
              />
            </>
          ) : (
            <Alert type="info" showIcon message="未生成预览" />
          )}
        </div>
      </Drawer>

      <Drawer
        title={editingBatch ? '编辑在途批次' : '新建在途批次'}
        open={drawerOpen}
        width={960}
        destroyOnClose
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={submitting} onClick={() => void submit()}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <div className="in-transit-drawer__grid">
            <Form.Item name="standardForwarderId" label="标准货代">
              <Select allowClear options={forwarderOptions} placeholder="选择标准货代" />
            </Form.Item>
            <Form.Item name="rawForwarderName" label="原始货代名称">
              <Input placeholder="历史记录里的货代名称" />
            </Form.Item>
            <Form.Item name="transportMode" label="运输方式">
              <Select allowClear options={transportOptions} placeholder="选择运输方式" />
            </Form.Item>
            <Form.Item name="batchStatus" label="当前状态">
              <Select options={statusOptions} placeholder="选择状态" />
            </Form.Item>
            <Form.Item name="targetStoreCode" label="目标店铺">
              <Input placeholder="如 STR245027-NAE" />
            </Form.Item>
            <Form.Item name="targetSiteCode" label="目标站点">
              <Input placeholder="如 AE / SA" />
            </Form.Item>
            <Form.Item name="targetWarehouseName" label="目标仓">
              <Input placeholder="如 FBN-DXB" />
            </Form.Item>
            <Form.Item name="batchReferenceNo" label="批次号">
              <Input placeholder="内部批次或货代批次号" />
            </Form.Item>
            <Form.Item name="departureDate" label="发货日期">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="etaDate" label="ETA">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="trackingNo" label="物流单号">
              <Input placeholder="物流单号" />
            </Form.Item>
            <Form.Item name="containerNo" label="柜号">
              <Input placeholder="柜号" />
            </Form.Item>
            <Form.Item name="remark" label="备注" className="in-transit-drawer__wide">
              <Input.TextArea rows={3} placeholder="补充说明" />
            </Form.Item>
          </div>
        </Form>

        {editingBatch ? (
          <>
            <Divider />
            <div className="in-transit-lines">
              <div className="in-transit-lines__header">
                <Title level={5} style={{ margin: 0 }}>商品明细</Title>
                <Button icon={<PlusOutlined />} onClick={openCreateLine}>
                  添加商品
                </Button>
              </div>
              <Table
                rowKey="lineId"
                columns={lineColumns}
                dataSource={lines}
                loading={loadingLines}
                pagination={false}
                scroll={{ x: 1050 }}
                size="small"
              />
              {lineEditorOpen ? (
                <div className="in-transit-line-editor">
                  <Title level={5} style={{ margin: 0 }}>{editingLine ? '编辑商品' : '添加商品'}</Title>
                  <Form form={lineForm} layout="vertical">
                    <div className="in-transit-line-editor__grid">
                      <Form.Item name="boxNo" label="箱号">
                        <Input placeholder="箱号" />
                      </Form.Item>
                      <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入 SKU' }]}>
                        <Input placeholder="商品 SKU" />
                      </Form.Item>
                      <Form.Item name="msku" label="MSKU">
                        <Input placeholder="平台 MSKU" />
                      </Form.Item>
                      <Form.Item name="psku" label="PSKU">
                        <Input placeholder="店铺 PSKU" />
                      </Form.Item>
                      <Form.Item name="productName" label="商品名称">
                        <Input placeholder="商品名称" />
                      </Form.Item>
                      <Form.Item name="storeCode" label="店铺">
                        <Input placeholder="店铺编码" />
                      </Form.Item>
                      <Form.Item name="siteCode" label="站点">
                        <Input placeholder="站点" />
                      </Form.Item>
                      <Form.Item name="shippedQuantity" label="发货数量">
                        <InputNumber min={0} precision={0} placeholder="发货数量" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="receivedQuantity" label="已入仓数量">
                        <InputNumber min={0} precision={0} placeholder="已入仓数量" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="cartonCount" label="箱数">
                        <InputNumber min={0} precision={0} placeholder="箱数" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="unitsPerCarton" label="单箱数量">
                        <InputNumber min={0} precision={0} placeholder="单箱数量" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="cartonWeightKg" label="单箱重量">
                        <InputNumber min={0} precision={6} placeholder="单箱重量" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="cartonVolumeCbm" label="单箱体积">
                        <InputNumber min={0} precision={6} placeholder="单箱体积" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="remark" label="备注" className="in-transit-line-editor__wide">
                        <Input.TextArea rows={2} placeholder="商品明细备注" />
                      </Form.Item>
                    </div>
                    <Space>
                      <Button type="primary" loading={submittingLine} onClick={() => void submitLine()}>
                        保存商品
                      </Button>
                      <Button onClick={() => setLineEditorOpen(false)}>取消</Button>
                    </Space>
                  </Form>
                </div>
              ) : null}
            </div>

            <Divider />
            <div className="in-transit-nodes">
              <div className="in-transit-nodes__header">
                <Title level={5} style={{ margin: 0 }}>物流时间线</Title>
                <Button icon={<PlusOutlined />} onClick={openCreateNode}>
                  添加节点
                </Button>
              </div>
              {nodes.length ? (
                <Timeline
                  pending={loadingNodes ? '加载中' : undefined}
                  items={nodes.map((node) => ({
                    color: nodeTimelineColor(node.nodeStatus),
                    children: (
                      <Space direction="vertical" size={2}>
                        <Space size={8} wrap>
                          <Tag color={nodeTimelineColor(node.nodeStatus)} style={{ marginInlineEnd: 0 }}>
                            {nodeStatusLabel.get(node.nodeStatus) || node.nodeStatus}
                          </Tag>
                          <Text type="secondary">{formatNodeDateTime(node.nodeHappenedAt)}</Text>
                        </Space>
                        <Text>{node.description || '-'}</Text>
                        {node.operatorName ? <Text type="secondary">操作人 {node.operatorName}</Text> : null}
                      </Space>
                    )
                  }))}
                />
              ) : (
                <Text type="secondary">{loadingNodes ? '物流节点加载中' : '暂无物流节点'}</Text>
              )}
              {nodeEditorOpen ? (
                <div className="in-transit-node-editor">
                  <Title level={5} style={{ margin: 0 }}>添加节点</Title>
                  <Form form={nodeForm} layout="vertical">
                    <div className="in-transit-node-editor__grid">
                      <Form.Item name="nodeStatus" label="节点状态" rules={[{ required: true, message: '请选择节点状态' }]}>
                        <Select id="nodeStatus" options={nodeOptions} placeholder="选择节点状态" />
                      </Form.Item>
                      <Form.Item name="nodeHappenedAt" label="发生时间">
                        <Input placeholder="YYYY-MM-DD HH:mm:ss" />
                      </Form.Item>
                      <Form.Item name="operatorName" label="操作人">
                        <Input placeholder="操作人" />
                      </Form.Item>
                      <Form.Item name="description" label="节点说明" className="in-transit-node-editor__wide">
                        <Input.TextArea rows={2} placeholder="节点说明" />
                      </Form.Item>
                    </div>
                    <Space>
                      <Button type="primary" loading={submittingNode} onClick={() => void submitNode()}>
                        保存节点
                      </Button>
                      <Button onClick={() => setNodeEditorOpen(false)}>取消</Button>
                    </Space>
                  </Form>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </Drawer>
    </div>
  )
}

export default InTransitGoodsPage
