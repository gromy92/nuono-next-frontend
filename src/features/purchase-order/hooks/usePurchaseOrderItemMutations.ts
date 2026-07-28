import { message } from 'antd'
import type { FormInstance } from 'antd'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { firstFormValidationMessage, normalizeError } from '../../../shared/api'
import type { AuthSession } from '../../auth/session'
import {
  addPurchaseOrderItems,
  deletePurchaseOrderItem,
  updatePurchaseOrderItem
} from '../api'
import type { PurchaseOrder, PurchaseOrderItem } from '../types'
import {
  duplicatePskuSiteMessage,
  normalizeFulfillmentType,
  normalizePskuEntries,
  normalizeSiteQuantityEntries,
  normalizeTransportMode
} from '../model/purchaseOrderItemCommandModel'
import {
  createEmptyPskuEntry,
  createEmptySiteQuantityEntry,
  getOrderSiteOptions
} from '../model/purchaseOrderStoreModel'
import { isSubmittedOrder } from '../model/purchaseOrderSummaryModel'
import { DEFAULT_SITE_CODES } from '../model/purchaseOrderUiMeta'
import type {
  AddItemsFormValues,
  DeleteItemTarget,
  UpdateItemFormValues
} from '../model/purchaseOrderViewTypes'

type PurchaseOrderItemMutationOptions = {
  session?: AuthSession | null
  orders: PurchaseOrder[]
  addItemsForm: FormInstance<AddItemsFormValues>
  editItemForm: FormInstance<UpdateItemFormValues>
  clearProductSearchOptions: () => void
  replaceOrder: (order: PurchaseOrder) => void
  notifyPurchaseOrdersChanged: () => void
  setSelectedOrderId: Dispatch<SetStateAction<string | undefined>>
  setActionKey: Dispatch<SetStateAction<string | undefined>>
}

export function usePurchaseOrderItemMutations({
  session,
  orders,
  addItemsForm,
  editItemForm,
  clearProductSearchOptions,
  replaceOrder,
  notifyPurchaseOrdersChanged,
  setSelectedOrderId,
  setActionKey
}: PurchaseOrderItemMutationOptions) {
  const [addItemsOrderId, setAddItemsOrderId] = useState<string | null>(null)
  const [editItemTarget, setEditItemTarget] = useState<DeleteItemTarget | null>(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState<DeleteItemTarget | null>(null)
  const [addItemsErrorMessage, setAddItemsErrorMessage] = useState<string>()
  const [editItemErrorMessage, setEditItemErrorMessage] = useState<string>()
  const addItemsOrder = addItemsOrderId
    ? orders.find((order) => order.id === addItemsOrderId)
    : undefined

  function openAddItemsModal(order: PurchaseOrder) {
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    const defaultSite = getOrderSiteOptions(order, session)[0]?.value || DEFAULT_SITE_CODES[0]
    addItemsForm.setFieldsValue({
      items: [createEmptyPskuEntry(defaultSite)]
    })
    clearProductSearchOptions()
    setAddItemsErrorMessage(undefined)
    setAddItemsOrderId(order.id)
  }

  function closeAddItemsModal() {
    setAddItemsOrderId(null)
    setAddItemsErrorMessage(undefined)
    clearProductSearchOptions()
    addItemsForm.resetFields()
  }

  function openEditItemModal(order: PurchaseOrder, item: PurchaseOrderItem) {
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    const defaultSite = getOrderSiteOptions(order, session)[0]?.value || DEFAULT_SITE_CODES[0]
    editItemForm.setFieldsValue({
      psku: item.partnerSku,
      fulfillmentType: normalizeFulfillmentType(item.fulfillmentType),
      fulfillmentSourceName: item.fulfillmentSourceName,
      siteQuantities: item.allocations?.length
        ? item.allocations.map((allocation) => ({
          siteCode: allocation.site,
          transportMode: normalizeTransportMode(allocation.transportMode),
          quantity: allocation.quantity
        }))
        : [createEmptySiteQuantityEntry(defaultSite)]
    })
    setEditItemErrorMessage(undefined)
    setEditItemTarget({ order, item })
  }

  function closeEditItemModal() {
    setEditItemTarget(null)
    setEditItemErrorMessage(undefined)
    editItemForm.resetFields()
  }

  async function handleAddItemsToOrder() {
    try {
      if (!addItemsOrder) {
        return
      }
      if (isSubmittedOrder(addItemsOrder)) {
        message.warning('采购单已封存，不能再更改。')
        return
      }
      const values = await addItemsForm.validateFields()
      const items = normalizePskuEntries(values.items)
      if (!items.length) {
        message.warning('请至少添加一行 PSKU、站点、运输方式和数量。')
        return
      }
      const duplicateMessage = duplicatePskuSiteMessage(items, addItemsOrder)
      if (duplicateMessage) {
        setAddItemsErrorMessage(duplicateMessage)
        message.warning(duplicateMessage)
        return
      }
      setAddItemsErrorMessage(undefined)
      setActionKey(`add-items:${addItemsOrder.id}`)
      const nextOrder = await addPurchaseOrderItems(addItemsOrder.id, { items })
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      closeAddItemsModal()
      message.success('已添加商品。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      if (validationMessage) {
        setAddItemsErrorMessage(validationMessage)
        message.warning(validationMessage)
      } else {
        const errorMessage = normalizeError(error, '添加商品失败')
        setAddItemsErrorMessage(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      setActionKey((current) => (current === `add-items:${addItemsOrder?.id}` ? undefined : current))
    }
  }

  async function handleUpdateItem() {
    if (!editItemTarget) {
      return
    }
    const { order, item } = editItemTarget
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    const currentActionKey = `edit-item:${item.id}`
    setActionKey(currentActionKey)
    try {
      const values = await editItemForm.validateFields()
      const siteQuantities = normalizeSiteQuantityEntries(values.siteQuantities)
      if (!siteQuantities.length) {
        message.warning('请至少保留一条站点数量。')
        return
      }
      setEditItemErrorMessage(undefined)
      const nextOrder = await updatePurchaseOrderItem(order.id, item.id, {
        psku: item.partnerSku,
        fulfillmentType: normalizeFulfillmentType(values.fulfillmentType),
        fulfillmentSourceName: values.fulfillmentSourceName?.trim() || undefined,
        siteQuantities
      })
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      closeEditItemModal()
      message.success('已保存商品。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      if (validationMessage) {
        setEditItemErrorMessage(validationMessage)
        message.warning(validationMessage)
      } else {
        const errorMessage = normalizeError(error, '保存商品失败')
        setEditItemErrorMessage(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      setActionKey((current) => (current === currentActionKey ? undefined : current))
    }
  }


  async function handleDeleteItem() {
    if (!deleteTargetItem) {
      return
    }
    const { order, item } = deleteTargetItem
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      setDeleteTargetItem(null)
      return
    }
    const currentActionKey = `delete-item:${item.id}`
    setActionKey(currentActionKey)
    try {
      const nextOrder = await deletePurchaseOrderItem(order.id, item.id)
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      if (editItemTarget?.item.id === item.id) {
        closeEditItemModal()
      }
      setDeleteTargetItem(null)
      message.success('已删除商品行。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除商品失败')
    } finally {
      setActionKey((current) => (current === currentActionKey ? undefined : current))
    }
  }

  function closeOrderItemModals(orderId: string) {
    if (addItemsOrderId === orderId) {
      closeAddItemsModal()
    }
    if (editItemTarget?.order.id === orderId) {
      closeEditItemModal()
    }
    if (deleteTargetItem?.order.id === orderId) {
      setDeleteTargetItem(null)
    }
  }

  return {
    addItemsOrder,
    editItemTarget,
    deleteTargetItem,
    addItemsErrorMessage,
    editItemErrorMessage,
    setDeleteTargetItem,
    openAddItemsModal,
    closeAddItemsModal,
    openEditItemModal,
    closeEditItemModal,
    handleAddItemsToOrder,
    handleUpdateItem,
    handleDeleteItem,
    closeOrderItemModals
  }
}
