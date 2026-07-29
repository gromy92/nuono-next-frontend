import { App as AntdApp } from 'antd'
import type { FormInstance } from 'antd'
import { useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { firstFormValidationMessage, normalizeError } from '../../../shared/api'
import type { AuthSession } from '../../auth/session'
import { fetchProductSpecDetail, saveProductSpecSource } from '../../product-specs/api'
import { fetchProductLogisticsProfiles, saveProductLogisticsProfile } from '../../product-specs/logisticsProfileApi'
import { updatePurchaseOrderItemSourcingRequirement } from '../api'
import { normalizeProductDataNumber } from '../productDataCompletionNumbers'
import type { PurchaseOrder, PurchaseOrderItem } from '../types'
import {
  buildProductDataCompletionContext,
  createDefaultProductDataCompletionValues,
  createProductDataLogisticsProfilePayload,
  normalizeOptionalText,
  productDataHasAnyConfirmedLogisticsValue,
  productDataHasAnyProductSpecValue,
  productDataHasCompleteLogisticsValues,
  productDataHasCompleteProductSpecValues,
  productDataLogisticsValuesFromProfile,
  productDataSourcingValuesFromItem,
  productDataSpecValuesFromDetail,
  shouldSaveProductDataLogistics,
  shouldSaveProductDataSourcing,
  shouldSaveProductDataSpec
} from '../model/productDataCompletionModel'
import { isProductDataCompletionIssue, itemIssues } from '../model/purchaseOrderIssueModel'
import { isSubmittedOrder } from '../model/purchaseOrderSummaryModel'
import type {
  ProductDataCompletionFormValues,
  ProductDataCompletionIssue,
  ProductDataCompletionTarget
} from '../model/purchaseOrderViewTypes'

type ProductDataCompletionOptions = {
  session?: AuthSession | null
  selectedOrder?: PurchaseOrder
  form: FormInstance<ProductDataCompletionFormValues>
  loadOrders: () => Promise<void>
  replaceOrder: (order: PurchaseOrder) => void
  setSelectedOrderId: Dispatch<SetStateAction<string | undefined>>
  setActionKey: Dispatch<SetStateAction<string | undefined>>
}

export function usePurchaseOrderProductDataCompletion({
  session,
  selectedOrder,
  form: productDataCompletionForm,
  loadOrders,
  replaceOrder,
  setSelectedOrderId,
  setActionKey
}: ProductDataCompletionOptions) {
  const { message: appMessage } = AntdApp.useApp()
  const [productDataCompletionTarget, setProductDataCompletionTarget] = useState<ProductDataCompletionTarget | null>(null)
  const [productDataCompletionLoading, setProductDataCompletionLoading] = useState(false)
  const [productDataCompletionError, setProductDataCompletionError] = useState<string>()
  const productDataCompletionRequestIdRef = useRef(0)

  function openFirstProductDataIssue(issue: ProductDataCompletionIssue) {
    if (!selectedOrder) {
      return
    }
    const firstItem = (selectedOrder.items || []).find((item) => itemIssues(item).includes(issue))
    if (!firstItem) {
      return
    }
    openProductDataCompletionModal(selectedOrder, firstItem, issue)
  }

  function openProductDataCompletionModal(
    order: PurchaseOrder,
    item: PurchaseOrderItem,
    issue?: string
  ) {
    if (!isProductDataCompletionIssue(issue)) {
      return
    }
    if (isSubmittedOrder(order)) {
      appMessage.warning('采购单已封存，不能再更改商品资料。')
      return
    }
    const target: ProductDataCompletionTarget = { order, item, focusIssue: issue }
    setProductDataCompletionTarget(target)
    setProductDataCompletionError(undefined)
    productDataCompletionForm.setFieldsValue({
      ...createDefaultProductDataCompletionValues(),
      ...productDataSourcingValuesFromItem(item)
    })
    void loadProductDataCompletionSnapshot(target)
  }

  function closeProductDataCompletionModal() {
    productDataCompletionRequestIdRef.current += 1
    setProductDataCompletionTarget(null)
    setProductDataCompletionLoading(false)
    setProductDataCompletionError(undefined)
    productDataCompletionForm.resetFields()
  }

  async function loadProductDataCompletionSnapshot(target: ProductDataCompletionTarget) {
    const requestId = productDataCompletionRequestIdRef.current + 1
    productDataCompletionRequestIdRef.current = requestId
    const context = buildProductDataCompletionContext(target.order, target.item, session)
    if (!context.storeCode || !context.partnerSku) {
      setProductDataCompletionError('缺少店铺或 PSKU，暂不能读取当前商品资料。')
      return
    }
    setProductDataCompletionLoading(true)
    const errors: string[] = []
    try {
      const [specResult, logisticsResult] = await Promise.allSettled([
        fetchProductSpecDetail(context),
        context.ownerUserId
          ? fetchProductLogisticsProfiles({
            ownerUserId: context.ownerUserId,
            storeCode: context.storeCode,
            partnerSku: context.partnerSku,
            currentZCode: context.currentZCode,
            skuParent: context.currentZCode
          })
          : Promise.resolve(undefined)
      ])
      if (productDataCompletionRequestIdRef.current !== requestId) {
        return
      }
      const nextValues: ProductDataCompletionFormValues = {}
      if (specResult.status === 'fulfilled') {
        Object.assign(nextValues, productDataSpecValuesFromDetail(specResult.value))
      } else {
        errors.push(normalizeError(specResult.reason, '产品规格读取失败'))
      }
      if (logisticsResult.status === 'fulfilled') {
        Object.assign(nextValues, productDataLogisticsValuesFromProfile(logisticsResult.value?.items?.[0]))
      } else {
        errors.push(normalizeError(logisticsResult.reason, '商品属性读取失败'))
      }
      productDataCompletionForm.setFieldsValue({
        ...createDefaultProductDataCompletionValues(),
        ...productDataSourcingValuesFromItem(target.item),
        ...nextValues
      })
      setProductDataCompletionError(errors.length ? errors.join('；') : undefined)
    } finally {
      if (productDataCompletionRequestIdRef.current === requestId) {
        setProductDataCompletionLoading(false)
      }
    }
  }

  async function handleSaveProductDataCompletion() {
    if (!productDataCompletionTarget) {
      return
    }
    const target = productDataCompletionTarget
    const action = `product-data-completion:${target.item.id}`
    const context = buildProductDataCompletionContext(target.order, target.item, session)
    if (!context.storeCode || !context.partnerSku) {
      appMessage.warning('缺少店铺或 PSKU，不能保存商品资料。')
      return
    }
    setActionKey(action)
    try {
      const values = await productDataCompletionForm.validateFields()
      if (productDataHasAnyProductSpecValue(values) && !productDataHasCompleteProductSpecValues(values)) {
        appMessage.warning('产品规格需要完整填写商品长宽高重。')
        return
      }
      if (productDataHasAnyConfirmedLogisticsValue(values) && !productDataHasCompleteLogisticsValues(values)) {
        appMessage.warning('商品属性需要七项全部选择明确值。')
        return
      }
      const saveSpec = shouldSaveProductDataSpec(values)
      const saveLogistics = shouldSaveProductDataLogistics(target.item, values)
      const saveSourcing = shouldSaveProductDataSourcing(target.item, values)
      if (!saveSourcing && !saveSpec && !saveLogistics) {
        appMessage.warning('没有需要保存的商品资料。')
        return
      }
      if (saveSourcing) {
        const nextOrder = await updatePurchaseOrderItemSourcingRequirement(target.order.id, target.item.id, {
          sourcingSpec: normalizeOptionalText(values.sourcingSpec),
          sourcingSize: normalizeOptionalText(values.sourcingSize),
          sourcingColor: normalizeOptionalText(values.sourcingColor)
        })
        replaceOrder(nextOrder)
      }
      if (saveSpec) {
        const source = await saveProductSpecSource({
          ownerUserId: context.ownerUserId,
          storeCode: context.storeCode,
          variantId: context.variantId,
          partnerSku: context.partnerSku,
          currentZCode: context.currentZCode,
          skuParent: context.currentZCode,
          sourceType: 'ali1688',
          productLengthCm: normalizeProductDataNumber(values.productLengthCm),
          productWidthCm: normalizeProductDataNumber(values.productWidthCm),
          productHeightCm: normalizeProductDataNumber(values.productHeightCm),
          productWeightG: normalizeProductDataNumber(values.productWeightG),
          cartonLengthCm: normalizeProductDataNumber(values.cartonLengthCm),
          cartonWidthCm: normalizeProductDataNumber(values.cartonWidthCm),
          cartonHeightCm: normalizeProductDataNumber(values.cartonHeightCm),
          cartonWeightKg: normalizeProductDataNumber(values.cartonWeightKg),
          cartonQuantity: normalizeProductDataNumber(values.cartonQuantity),
          cartonSourceType: 'factory_carton'
        })
        if (!source.sourceId) {
          throw new Error('商品规格保存后缺少来源编号。')
        }
      }
      if (saveLogistics) {
        await saveProductLogisticsProfile({
          ...createProductDataLogisticsProfilePayload(target.order, target.item, values),
          ownerUserId: context.ownerUserId,
          storeCode: context.storeCode,
          variantId: context.variantId,
          partnerSku: context.partnerSku,
          currentZCode: context.currentZCode
        })
      }
      await loadOrders()
      setSelectedOrderId(target.order.id)
      closeProductDataCompletionModal()
      appMessage.success('商品资料已保存。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      appMessage.error(validationMessage || normalizeError(error, '保存商品资料失败'))
    } finally {
      setActionKey((current) => (current === action ? undefined : current))
    }
  }

  return {
    productDataCompletionTarget,
    productDataCompletionLoading,
    productDataCompletionError,
    openFirstProductDataIssue,
    openProductDataCompletionModal,
    closeProductDataCompletionModal,
    handleSaveProductDataCompletion
  }
}
