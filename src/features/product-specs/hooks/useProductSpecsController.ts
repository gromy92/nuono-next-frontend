import { App } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  buildStoreLabelByCode,
  createSpecSourceDraft,
  defaultLogisticsProfile,
  findSource,
  normalizeDraftNumber,
  productSpecRowKey,
  readInitialProductSpecsKeyword,
  resolveCurrentSpecStoreScope,
  resolveRequestOwnerUserId,
  withLogisticsConfirmationStatus
} from '../specDomain'
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
  const ownerUserId = resolveRequestOwnerUserId(session, activeOwnerId)
  const storeCode = useMemo(() => resolveCurrentSpecStoreScope(session).storeCode, [session])
  const [keyword, setKeyword] = useState(readInitialProductSpecsKeyword)
  const [completenessFilter, setCompletenessFilter] = useState<SpecCompletenessFilter>('all')
  const [logisticsAttributeFilter, setLogisticsAttributeFilter] =
    useState<LogisticsAttributeFilter>('all')
  const [rows, setRows] = useState<ProductVariantSpecPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<SpecSourceDraft>(createSpecSourceDraft())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [selectingEffectiveKey, setSelectingEffectiveKey] = useState<string | null>(null)
  const [logisticsSavingKey, setLogisticsSavingKey] = useState<string | null>(null)
  const storeLabelByCode = useMemo(() => buildStoreLabelByCode(session), [session])

  const loadRows = useCallback(async () => {
    const normalizedStoreCode = storeCode.trim()
    if (!normalizedStoreCode) {
      setRows([])
      return
    }
    setLoading(true)
    try {
      const payload = await fetchProductSpecsOverview({
        ownerUserId,
        storeCode: normalizedStoreCode,
        keyword: keyword.trim() || undefined
      })
      setRows(payload.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品规格加载失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, message, ownerUserId, storeCode])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

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
      message.success('规格已保存')
      setEditingKey(null)
      setEditingDraft(createSpecSourceDraft())
      await loadRows()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存规格来源失败')
    } finally {
      setSavingKey(null)
    }
  }, [editingDraft, loadRows, message, ownerUserId, storeCode])

  const handleSelectEffectiveSource = useCallback(async (
    row: ProductVariantSpecPayload,
    sourceType: EditableSourceType
  ) => {
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
      message.success(`${sourceLabels[sourceType]}规格已设为生效`)
      await loadRows()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '切换生效规格失败')
    } finally {
      setSelectingEffectiveKey(null)
    }
  }, [loadRows, message, ownerUserId, storeCode])

  const handleChangeLogisticsProfile = useCallback(async (
    row: ProductVariantSpecPayload,
    patch: Partial<ProductLogisticsProfilePayload>
  ) => {
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
    setRows((current) => current.map((item) =>
      productSpecRowKey(item) === key ? { ...item, logisticsProfile: nextProfile } : item
    ))
    setLogisticsSavingKey(key)
    try {
      const saved = await saveProductLogisticsProfile({
        ...nextProfile, ownerUserId, storeCode: normalizedStoreCode,
        variantId: row.variantId, partnerSku: row.partnerSku,
        currentZCode: getProductCurrentZCode(row), skuParent: getProductCurrentZCode(row)
      })
      setRows((current) => current.map((item) =>
        productSpecRowKey(item) === key ? { ...item, logisticsProfile: saved } : item
      ))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存物流属性失败，已重新加载当前数据')
      await loadRows()
    } finally {
      setLogisticsSavingKey(null)
    }
  }, [loadRows, message, ownerUserId, storeCode])

  return {
    keyword, setKeyword, completenessFilter, setCompletenessFilter,
    logisticsAttributeFilter, setLogisticsAttributeFilter, rows, loading,
    editingKey, editingDraft, savingKey, selectingEffectiveKey, logisticsSavingKey,
    storeCode, storeLabelByCode, loadRows, handleStartEdit, handleDraftNumberChange,
    handleCancelEdit, handleSaveSource, handleSelectEffectiveSource,
    handleChangeLogisticsProfile
  }
}
