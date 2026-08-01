import { App } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AuthSession } from '../../auth/session'
import { getProductCurrentZCode } from '../../product-domain/productIdentity'
import {
  fetchProductSpecsOverview,
  saveProductSpecSource,
  selectProductSpecEffectiveSource
} from '../api'
import { saveProductLogisticsProfile } from '../logisticsProfileApi'
import type {
  EditableSourceType,
  LogisticsAttributeFilter,
  SpecCompletenessFilter,
  SpecNumberField,
  SpecSourceDraft
} from '../specPageConfig'
import {
  buildEditKey,
  createSpecSourceDraft,
  defaultLogisticsProfile,
  findSource,
  normalizeDraftNumber,
  productSpecRowKey,
  readInitialProductSpecsKeyword,
  withLogisticsConfirmationStatus
} from '../specDomain'
import {
  assertProductSpecsResponseScope,
  buildProductSpecsStoreLabelByCode,
  productSpecsScopeKey,
  resolveProductSpecsRequestScope
} from '../productSpecsRequestScope'
import { sourceLabels } from '../specPageConfig'
import type { ProductLogisticsProfilePayload, ProductVariantSpecPayload } from '../types'

export function useProductSpecsController({
  session,
  activeOwnerId
}: {
  session: AuthSession
  activeOwnerId?: number
}) {
  const { message } = App.useApp()
  const requestScope = useMemo(
    () => resolveProductSpecsRequestScope(session, activeOwnerId),
    [activeOwnerId, session]
  )
  const ownerUserId = requestScope.ownerUserId
  const storeCode = requestScope.storeCode
  const currentScopeKey = productSpecsScopeKey(requestScope)
  const scopeKeyRef = useRef(currentScopeKey)
  scopeKeyRef.current = currentScopeKey
  const requestSequenceRef = useRef(0)
  const [keyword, setKeyword] = useState(readInitialProductSpecsKeyword)
  const [completenessFilter, setCompletenessFilter] = useState<SpecCompletenessFilter>('all')
  const [logisticsAttributeFilter, setLogisticsAttributeFilter] =
    useState<LogisticsAttributeFilter>('all')
  const [rowsState, setRowsState] = useState<{
    scopeKey: string
    items: ProductVariantSpecPayload[]
  }>({ scopeKey: currentScopeKey, items: [] })
  const rows = rowsState.scopeKey === currentScopeKey ? rowsState.items : []
  const [loading, setLoading] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<SpecSourceDraft>(createSpecSourceDraft())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [selectingEffectiveKey, setSelectingEffectiveKey] = useState<string | null>(null)
  const [logisticsSavingKey, setLogisticsSavingKey] = useState<string | null>(null)
  const storeLabelByCode = useMemo(() => buildProductSpecsStoreLabelByCode(session), [session])

  const loadRows = useCallback(async () => {
    const normalizedStoreCode = storeCode.trim()
    const requestSequence = ++requestSequenceRef.current
    if (requestScope.error || !normalizedStoreCode) {
      setRowsState({ scopeKey: currentScopeKey, items: [] })
      setLoading(false)
      if (requestScope.error) message.error(requestScope.error)
      return
    }
    setLoading(true)
    try {
      const payload = await fetchProductSpecsOverview({
        ownerUserId,
        storeCode: normalizedStoreCode,
        keyword: keyword.trim() || undefined
      })
      assertProductSpecsResponseScope(requestScope, payload)
      if (requestSequence !== requestSequenceRef.current || scopeKeyRef.current !== currentScopeKey) return
      setRowsState({ scopeKey: currentScopeKey, items: payload.items || [] })
    } catch (error) {
      if (requestSequence !== requestSequenceRef.current || scopeKeyRef.current !== currentScopeKey) return
      setRowsState({ scopeKey: currentScopeKey, items: [] })
      message.error(error instanceof Error ? error.message : '商品规格加载失败')
    } finally {
      if (requestSequence === requestSequenceRef.current && scopeKeyRef.current === currentScopeKey) {
        setLoading(false)
      }
    }
  }, [currentScopeKey, keyword, message, ownerUserId, requestScope, storeCode])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  useEffect(() => {
    setEditingKey(null)
    setEditingDraft(createSpecSourceDraft())
    setSavingKey(null)
    setSelectingEffectiveKey(null)
    setLogisticsSavingKey(null)
  }, [currentScopeKey])

  const handleStartEdit = useCallback((row: ProductVariantSpecPayload, sourceType: EditableSourceType) => {
    const source = findSource(row.sources, sourceType)
    const fallback = row.effectiveSourceType === sourceType ? row : undefined
    setEditingKey(buildEditKey(row, sourceType))
    setEditingDraft(createSpecSourceDraft(source || fallback, sourceType))
  }, [])

  const handleDraftNumberChange = useCallback((field: SpecNumberField, value: number | string | null) => {
    setEditingDraft((current) => ({ ...current, [field]: normalizeDraftNumber(value) }))
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingKey(null)
    setEditingDraft(createSpecSourceDraft())
  }, [])

  const handleSaveSource = useCallback(async (
    row: ProductVariantSpecPayload,
    sourceType: EditableSourceType
  ) => {
    const actionScopeKey = currentScopeKey
    const normalizedStoreCode = storeCode.trim()
    if (!normalizedStoreCode || !(row.partnerSku || row.variantId)) {
      message.warning('缺少店铺或 SKU 上下文，暂不能保存规格')
      return
    }
    const key = buildEditKey(row, sourceType)
    setSavingKey(key)
    try {
      await saveProductSpecSource({
        ownerUserId, storeCode: normalizedStoreCode, variantId: row.variantId,
        partnerSku: row.partnerSku, currentZCode: getProductCurrentZCode(row),
        skuParent: getProductCurrentZCode(row), sourceType, ...editingDraft
      })
      if (scopeKeyRef.current !== actionScopeKey) return
      message.success('规格已保存')
      setEditingKey(null)
      setEditingDraft(createSpecSourceDraft())
      await loadRows()
    } catch (error) {
      if (scopeKeyRef.current !== actionScopeKey) return
      message.error(error instanceof Error ? error.message : '保存规格来源失败')
    } finally {
      if (scopeKeyRef.current === actionScopeKey) setSavingKey(null)
    }
  }, [currentScopeKey, editingDraft, loadRows, message, ownerUserId, storeCode])

  const handleSelectEffectiveSource = useCallback(async (
    row: ProductVariantSpecPayload,
    sourceType: EditableSourceType
  ) => {
    const actionScopeKey = currentScopeKey
    const normalizedStoreCode = storeCode.trim()
    const source = findSource(row.sources, sourceType)
    if (!normalizedStoreCode || !(row.partnerSku || row.variantId) || !source?.sourceId) {
      message.warning('请先维护该来源规格，再设为生效')
      return
    }
    const key = buildEditKey(row, sourceType)
    setSelectingEffectiveKey(key)
    try {
      await selectProductSpecEffectiveSource({
        ownerUserId, storeCode: normalizedStoreCode, variantId: row.variantId,
        partnerSku: row.partnerSku, currentZCode: getProductCurrentZCode(row),
        skuParent: getProductCurrentZCode(row), sourceId: source.sourceId
      })
      if (scopeKeyRef.current !== actionScopeKey) return
      message.success(`${sourceLabels[sourceType]}规格已设为生效`)
      await loadRows()
    } catch (error) {
      if (scopeKeyRef.current !== actionScopeKey) return
      message.error(error instanceof Error ? error.message : '切换生效规格失败')
    } finally {
      if (scopeKeyRef.current === actionScopeKey) setSelectingEffectiveKey(null)
    }
  }, [currentScopeKey, loadRows, message, ownerUserId, storeCode])

  const handleChangeLogisticsProfile = useCallback(async (
    row: ProductVariantSpecPayload,
    patch: Partial<ProductLogisticsProfilePayload>
  ) => {
    const actionScopeKey = currentScopeKey
    const normalizedStoreCode = storeCode.trim()
    if (!normalizedStoreCode || !(row.partnerSku || row.variantId)) {
      message.warning('缺少店铺或 SKU 上下文，暂不能保存物流属性')
      return
    }
    const nextProfile = withLogisticsConfirmationStatus({
      ...defaultLogisticsProfile(row, normalizedStoreCode),
      ...row.logisticsProfile,
      ...patch
    })
    const key = productSpecRowKey(row)
    setRowsState((current) => current.scopeKey === actionScopeKey ? {
      ...current,
      items: current.items.map((item) =>
        productSpecRowKey(item) === key ? { ...item, logisticsProfile: nextProfile } : item
      )
    } : current)
    setLogisticsSavingKey(key)
    try {
      const saved = await saveProductLogisticsProfile({
        ...nextProfile, ownerUserId, storeCode: normalizedStoreCode,
        variantId: row.variantId, partnerSku: row.partnerSku,
        currentZCode: getProductCurrentZCode(row), skuParent: getProductCurrentZCode(row)
      })
      if (scopeKeyRef.current !== actionScopeKey) return
      setRowsState((current) => current.scopeKey === actionScopeKey ? {
        ...current,
        items: current.items.map((item) =>
          productSpecRowKey(item) === key ? { ...item, logisticsProfile: saved } : item
        )
      } : current)
    } catch (error) {
      if (scopeKeyRef.current !== actionScopeKey) return
      message.error(error instanceof Error ? error.message : '保存物流属性失败，已重新加载当前数据')
      await loadRows()
    } finally {
      if (scopeKeyRef.current === actionScopeKey) setLogisticsSavingKey(null)
    }
  }, [currentScopeKey, loadRows, message, ownerUserId, storeCode])

  return {
    keyword, setKeyword, completenessFilter, setCompletenessFilter,
    logisticsAttributeFilter, setLogisticsAttributeFilter, rows, loading,
    editingKey, editingDraft, savingKey, selectingEffectiveKey, logisticsSavingKey,
    storeCode, storeLabelByCode, loadRows, handleStartEdit, handleDraftNumberChange,
    handleCancelEdit, handleSaveSource, handleSelectEffectiveSource,
    handleChangeLogisticsProfile
  }
}
