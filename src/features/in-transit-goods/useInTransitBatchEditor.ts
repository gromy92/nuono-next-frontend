import { useState } from 'react'
import { Form, message } from 'antd'
import dayjs from 'dayjs'
import {
  deleteInTransitGoodsLine,
  deleteInTransitLogisticsNode,
  fetchInTransitBatchFreightCosts,
  fetchInTransitGoodsLines,
  fetchInTransitLogisticsNodes,
  saveInTransitBatch,
  saveInTransitGoodsLine,
  saveInTransitLogisticsNode
} from './api'
import type {
  InTransitBatch,
  InTransitBatchFilters,
  InTransitBatchFreightCost,
  InTransitGoodsLine,
  InTransitLogisticsNode,
  SaveInTransitBatchRequest,
  SaveInTransitGoodsLineRequest,
  SaveInTransitLogisticsNodeRequest
} from './types'
import { formatNodeDateTime, normalizeNodeDateTime } from './InTransitGoodsPage.utils'

export function useInTransitBatchEditor(
  filters: InTransitBatchFilters,
  load: (filters: InTransitBatchFilters) => Promise<void>
) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<InTransitBatch | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lines, setLines] = useState<InTransitGoodsLine[]>([])
  const [loadingLines, setLoadingLines] = useState(false)
  const [lineEditorOpen, setLineEditorOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<InTransitGoodsLine | null>(null)
  const [submittingLine, setSubmittingLine] = useState(false)
  const [nodes, setNodes] = useState<InTransitLogisticsNode[]>([])
  const [loadingNodes, setLoadingNodes] = useState(false)
  const [nodeEditorOpen, setNodeEditorOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<InTransitLogisticsNode | null>(null)
  const [submittingNode, setSubmittingNode] = useState(false)
  const [batchFreightCosts, setBatchFreightCosts] = useState<InTransitBatchFreightCost>({ bills: [], components: [] })
  const [loadingBatchFreightCosts, setLoadingBatchFreightCosts] = useState(false)
  const [form] = Form.useForm<SaveInTransitBatchRequest & { dateRange?: [dayjs.Dayjs, dayjs.Dayjs] }>()
  const [lineForm] = Form.useForm<SaveInTransitGoodsLineRequest>()
  const [nodeForm] = Form.useForm<SaveInTransitLogisticsNodeRequest>()
  const batchOperationLocked = Boolean(editingBatch && editingBatch.batchStatus !== 'draft')

  const openCreate = () => {
    setEditingBatch(null)
    setLines([])
    setNodes([])
    setLineEditorOpen(false)
    setNodeEditorOpen(false)
    setEditingLine(null)
    setEditingNode(null)
    setBatchFreightCosts({ bills: [], components: [] })
    lineForm.resetFields()
    nodeForm.resetFields()
    form.resetFields()
    form.setFieldsValue({ batchStatus: 'draft' })
    setDrawerOpen(true)
  }

  const openEdit = (row: InTransitBatch) => {
    setEditingBatch(row)
    setLineEditorOpen(false)
    setNodeEditorOpen(false)
    setEditingLine(null)
    setEditingNode(null)
    lineForm.resetFields()
    nodeForm.resetFields()
    setNodes([])
    setBatchFreightCosts({ bills: [], components: [] })
    form.resetFields()
    form.setFieldsValue({
      batchId: row.batchId,
      standardForwarderId: row.standardForwarderId ?? undefined,
      rawForwarderName: row.rawForwarderName ?? undefined,
      transportMode: row.transportMode ?? undefined,
      targetStoreCode: row.targetStoreCode ?? undefined,
      targetWarehouseName: row.targetWarehouseName ?? undefined,
      departureDate: row.departureDate ?? undefined,
      etaDate: row.etaDate ?? undefined,
      trackingNo: row.trackingNo ?? undefined,
      containerNo: row.containerNo ?? undefined,
      batchReferenceNo: row.batchReferenceNo ?? undefined,
      batchStatus: row.batchStatus ?? 'draft'
    })
    void loadLines(row.batchId)
    void loadNodes(row.batchId)
    void loadBatchFreightCosts(row.batchId)
    setDrawerOpen(true)
  }

  const submit = async () => {
    if (batchOperationLocked) {
      message.warning('已在途批次仅允许维护商品明细')
      return
    }
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
      sku: row.sku ?? undefined,
      msku: row.msku ?? undefined,
      psku: row.psku,
      productName: row.productName ?? undefined,
      storeCode: row.storeCode ?? undefined,
      siteCode: row.siteCode ?? undefined,
      shippedQuantity: row.shippedQuantity,
      receivedQuantity: row.receivedQuantity,
      cartonCount: row.cartonCount ?? undefined,
      unitsPerCarton: row.unitsPerCarton ?? undefined,
      cartonWeightKg: row.cartonWeightKg ?? undefined,
      cartonVolumeCbm: row.cartonVolumeCbm ?? undefined,
      externalBoxNo: row.externalBoxNo ?? undefined,
      packageTrackingNo: row.packageTrackingNo ?? undefined,
      packageWeightKg: row.packageWeightKg ?? undefined,
      packageLengthCm: row.packageLengthCm ?? undefined,
      packageWidthCm: row.packageWidthCm ?? undefined,
      packageHeightCm: row.packageHeightCm ?? undefined,
      packageVolumeCbm: row.packageVolumeCbm ?? undefined,
      measuredWeightKg: row.measuredWeightKg ?? undefined,
      measuredLengthCm: row.measuredLengthCm ?? undefined,
      measuredWidthCm: row.measuredWidthCm ?? undefined,
      measuredHeightCm: row.measuredHeightCm ?? undefined,
      measuredVolumeCbm: row.measuredVolumeCbm ?? undefined,
      packageStatus: row.packageStatus ?? undefined,
      logisticsStatus: row.logisticsStatus ?? undefined
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
      await saveInTransitGoodsLine(editingBatch.batchId, { ...values, lineId: editingLine?.lineId })
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
    if (batchOperationLocked) {
      return
    }
    setEditingNode(null)
    nodeForm.resetFields()
    setNodeEditorOpen(true)
  }

  const openEditNode = (node: InTransitLogisticsNode) => {
    if (batchOperationLocked) {
      return
    }
    setEditingNode(node)
    nodeForm.setFieldsValue({
      nodeId: node.nodeId,
      nodeStatus: node.nodeStatus,
      nodeHappenedAt: node.nodeHappenedAt ? formatNodeDateTime(node.nodeHappenedAt) : undefined,
      description: node.description ?? undefined,
      operatorName: node.operatorName ?? undefined
    })
    setNodeEditorOpen(true)
  }

  const submitNode = async () => {
    if (!editingBatch || batchOperationLocked) {
      return
    }
    const values = await nodeForm.validateFields()
    setSubmittingNode(true)
    try {
      await saveInTransitLogisticsNode(editingBatch.batchId, {
        ...values,
        nodeId: editingNode?.nodeId,
        nodeHappenedAt: normalizeNodeDateTime(values.nodeHappenedAt)
      })
      message.success('物流节点已保存')
      setNodeEditorOpen(false)
      setEditingNode(null)
      nodeForm.resetFields()
      await loadNodes(editingBatch.batchId)
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '物流节点保存失败')
    } finally {
      setSubmittingNode(false)
    }
  }

  const removeNode = async (node: InTransitLogisticsNode) => {
    if (!editingBatch || batchOperationLocked) {
      return
    }
    setSubmittingNode(true)
    try {
      const nextNodes = await deleteInTransitLogisticsNode(editingBatch.batchId, node.nodeId)
      setNodes(nextNodes.items ?? [])
      if (editingNode?.nodeId === node.nodeId) {
        setEditingNode(null)
        setNodeEditorOpen(false)
        nodeForm.resetFields()
      }
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '物流节点删除失败')
    } finally {
      setSubmittingNode(false)
    }
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

  const loadBatchFreightCosts = async (batchId: number) => {
    setLoadingBatchFreightCosts(true)
    try {
      const nextFreightCosts = await fetchInTransitBatchFreightCosts(batchId)
      setBatchFreightCosts({ bills: nextFreightCosts.bills ?? [], components: nextFreightCosts.components ?? [] })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '实际运费加载失败')
      setBatchFreightCosts({ bills: [], components: [] })
    } finally {
      setLoadingBatchFreightCosts(false)
    }
  }

  return {
    drawerOpen,
    editingBatch,
    submitting,
    lines,
    loadingLines,
    lineEditorOpen,
    editingLine,
    submittingLine,
    nodes,
    loadingNodes,
    nodeEditorOpen,
    editingNode,
    submittingNode,
    batchFreightCosts,
    loadingBatchFreightCosts,
    batchOperationLocked,
    form,
    lineForm,
    nodeForm,
    setDrawerOpen,
    setLineEditorOpen,
    setNodeEditorOpen,
    openCreate,
    openEdit,
    submit,
    openCreateLine,
    openEditLine,
    submitLine,
    removeLine,
    openCreateNode,
    openEditNode,
    submitNode,
    removeNode
  }
}

export type InTransitBatchEditorController = ReturnType<typeof useInTransitBatchEditor>
