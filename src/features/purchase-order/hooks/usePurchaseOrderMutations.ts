import { App as AntdApp, message } from 'antd'
import type { FormInstance } from 'antd'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { firstFormValidationMessage, normalizeError } from '../../../shared/api'
import type { AuthSession } from '../../auth/session'
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  submitPurchaseOrder,
  updatePurchaseOrder
} from '../api'
import type { PurchaseOrder } from '../types'
import { duplicatePskuSiteMessage, normalizePskuEntries } from '../model/purchaseOrderItemCommandModel'
import { hasSealBlockingIssues, summarizeOrderIssues } from '../model/purchaseOrderIssueModel'
import {
  createEmptyPskuEntry,
  defaultCreateStoreCode,
  defaultCreateStoreSite,
  siteCodesFromPskuRows
} from '../model/purchaseOrderStoreModel'
import { isSubmittedOrder } from '../model/purchaseOrderSummaryModel'
import { PURCHASE_ORDER_SEAL_WARNING } from '../model/purchaseOrderUiMeta'
import type {
  CreateOrderFormValues,
  PskuEntryFormValue,
  UpdateOrderFormValues
} from '../model/purchaseOrderViewTypes'

type PurchaseOrderMutationOptions = {
  session?: AuthSession | null
  storeCode?: string
  createOrderForm: FormInstance<CreateOrderFormValues>
  editOrderForm: FormInstance<UpdateOrderFormValues>
  clearProductSearchOptions: () => void
  replaceOrder: (order: PurchaseOrder) => void
  notifyPurchaseOrdersChanged: () => void
  selectedOrderId?: string
  onOrderDeleted: (orderId: string) => void
  setOrders: Dispatch<SetStateAction<PurchaseOrder[]>>
  setSelectedOrderId: Dispatch<SetStateAction<string | undefined>>
  setActionKey: Dispatch<SetStateAction<string | undefined>>
}

export function usePurchaseOrderMutations({
  session,
  storeCode,
  createOrderForm,
  editOrderForm,
  clearProductSearchOptions,
  replaceOrder,
  notifyPurchaseOrdersChanged,
  selectedOrderId,
  onOrderDeleted,
  setOrders,
  setSelectedOrderId,
  setActionKey
}: PurchaseOrderMutationOptions) {
  const { modal, message: appMessage } = AntdApp.useApp()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editOrderTarget, setEditOrderTarget] = useState<PurchaseOrder | null>(null)
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<PurchaseOrder | null>(null)
  const [createErrorMessage, setCreateErrorMessage] = useState<string>()

  function openCreateOrderModal() {
    const defaultStoreCode = defaultCreateStoreCode(session) || storeCode || ''
    const defaultSite = defaultCreateStoreSite(session, defaultStoreCode)
    createOrderForm.setFieldsValue({
      storeCode: defaultStoreCode,
      title: '',
      remark: '',
      items: [createEmptyPskuEntry(defaultSite)]
    })
    clearProductSearchOptions()
    setCreateErrorMessage(undefined)
    setCreateModalOpen(true)
  }

  function handleCreateStoreChange(nextStoreCode: string) {
    const nextSite = defaultCreateStoreSite(session, nextStoreCode)
    const currentItems = createOrderForm.getFieldValue('items') as PskuEntryFormValue[] | undefined
    createOrderForm.setFieldsValue({
      items: currentItems?.length
        ? currentItems.map((item) => ({ ...item, site: nextSite }))
        : [createEmptyPskuEntry(nextSite)]
    })
    clearProductSearchOptions()
    setCreateErrorMessage(undefined)
  }

  function closeCreateOrderModal() {
    setCreateModalOpen(false)
    setCreateErrorMessage(undefined)
    clearProductSearchOptions()
    createOrderForm.resetFields()
  }

  function openEditOrderModal(order: PurchaseOrder) {
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    editOrderForm.setFieldsValue({
      title: order.title,
      remark: order.remark || ''
    })
    setEditOrderTarget(order)
  }

  function closeEditOrderModal() {
    setEditOrderTarget(null)
    editOrderForm.resetFields()
  }

  async function handleCreateOrder() {
    try {
      const values = await createOrderForm.validateFields()
      if (!values.storeCode) {
        message.warning('请先选择店铺。')
        return
      }
      const items = normalizePskuEntries(values.items)
      const duplicateMessage = duplicatePskuSiteMessage(items)
      if (duplicateMessage) {
        setCreateErrorMessage(duplicateMessage)
        message.warning(duplicateMessage)
        return
      }
      setCreateErrorMessage(undefined)
      setActionKey('create-order')
      const nextOrder = await createPurchaseOrder({
        storeCode: values.storeCode,
        title: values.title.trim(),
        remark: values.remark?.trim() || undefined,
        siteCodes: siteCodesFromPskuRows(values.items),
        items
      })
      setOrders((current) => [nextOrder, ...current.filter((order) => order.id !== nextOrder.id)])
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      closeCreateOrderModal()
      message.success('已创建采购单。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      if (validationMessage) {
        setCreateErrorMessage(validationMessage)
        message.warning(validationMessage)
      } else {
        const errorMessage = normalizeError(error, '创建采购单失败')
        setCreateErrorMessage(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      setActionKey((current) => (current === 'create-order' ? undefined : current))
    }
  }

  async function handleSaveOrderHeader() {
    if (!editOrderTarget) {
      return
    }
    const currentActionKey = `edit-order:${editOrderTarget.id}`
    setActionKey(currentActionKey)
    try {
      const values = await editOrderForm.validateFields()
      const nextOrder = await updatePurchaseOrder(editOrderTarget.id, {
        title: values.title.trim(),
        remark: values.remark?.trim() || undefined
      })
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      closeEditOrderModal()
      message.success('已保存采购单。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      message.error(validationMessage || normalizeError(error, '保存采购单失败'))
    } finally {
      setActionKey((current) => (current === currentActionKey ? undefined : current))
    }
  }

  function handleSubmitOrder(order: PurchaseOrder) {
    if (!order.items?.length) {
      appMessage.warning('当前采购单还没有商品。')
      return
    }
    const issueSummary = summarizeOrderIssues(order)
    if (hasSealBlockingIssues(issueSummary)) {
      appMessage.warning('请先补齐采购单的站点运输和数量信息后再封存。')
      return
    }
    const incompleteItems = order.items.filter((item) => (
      item.productSpecComplete === false || item.logisticsAttributeComplete === false
    ))
    if (incompleteItems.length) {
      const firstItem = incompleteItems[0]
      appMessage.warning(`还有 ${incompleteItems.length} 个商品缺少产品规格或商品属性，请先补齐后再封存。示例：${firstItem.partnerSku || firstItem.skuParent}`)
      return
    }
    const sealWarning = issueSummary.missingCartonSpecCount
      ? `${PURCHASE_ORDER_SEAL_WARNING} 当前有 ${issueSummary.missingCartonSpecCount} 个商品箱规缺失；箱规缺失仅提示，不阻塞本次封存。`
      : PURCHASE_ORDER_SEAL_WARNING
    modal.confirm({
      title: '封存采购单',
      content: sealWarning,
      okText: '确认封存',
      cancelText: '取消',
      onOk: () => sealPurchaseOrder(order)
    })
  }

  async function sealPurchaseOrder(order: PurchaseOrder) {
    setActionKey(`submit-order:${order.id}`)
    try {
      const nextOrder = await submitPurchaseOrder(order.id)
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      appMessage.success('采购单已封存。')
    } catch (error) {
      appMessage.error(normalizeError(error, '封存采购单失败'))
    } finally {
      setActionKey((current) => (current === `submit-order:${order.id}` ? undefined : current))
    }
  }


  async function handleDeleteOrder() {
    if (!deleteTargetOrder) {
      return
    }
    if (isSubmittedOrder(deleteTargetOrder)) {
      message.warning('采购单已封存，不能再更改。')
      setDeleteTargetOrder(null)
      return
    }
    const targetId = deleteTargetOrder.id
    setActionKey(`delete:${targetId}`)
    try {
      await deletePurchaseOrder(targetId)
      setOrders((current) => {
        const nextOrders = current.filter((order) => order.id !== targetId)
        if (selectedOrderId === targetId) {
          setSelectedOrderId(nextOrders[0]?.id)
        }
        return nextOrders
      })
      onOrderDeleted(targetId)
      notifyPurchaseOrdersChanged()
      setDeleteTargetOrder(null)
      message.success('已删除采购单。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除采购单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  return {
    createModalOpen,
    editOrderTarget,
    deleteTargetOrder,
    createErrorMessage,
    setDeleteTargetOrder,
    openCreateOrderModal,
    handleCreateStoreChange,
    closeCreateOrderModal,
    openEditOrderModal,
    closeEditOrderModal,
    handleCreateOrder,
    handleSaveOrderHeader,
    handleSubmitOrder,
    handleDeleteOrder
  }
}
