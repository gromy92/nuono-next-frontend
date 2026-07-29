import type { FormInstance } from 'antd'
import { useEffect, useState } from 'react'
import { fetchLogisticsQuoteOperationPriceItems } from '../../logistics-quote/api'
import type { ProfitCalculationPayload } from '../../profit-calculator/domain'
import { loadManualSelectionGroupProfitEstimate } from '../../selection-analysis/api'
import { chooseSystemCategoryOption, type ManualSelectionSystemCategoryOption } from '../profitCategoryMatching'
import {
  buildLogisticsProviderOptions,
  buildLogisticsQuoteOptions,
  transportModeLabel,
  type LogisticsProviderOption,
  type LogisticsQuoteOption
} from '../profitEstimateLogisticsOptions'
import { resolvePersistedLogisticsSelections } from '../profitEstimateLogisticsSelection'
import type { ManualSelectionProfitEstimateSeed } from '../types'
import {
  fetchSystemCategoryOptions,
  initialValues,
  savedFormValues,
  savedSnapshotVersion,
  siteLabel,
  type PersistedProfitFormState,
  type ProfitEstimateFormValues,
  type SaveFeedback
} from './manualSelectionProfitEstimateModel'

type Options = {
  form: FormInstance<ProfitEstimateFormValues>
  open: boolean
  seed?: ManualSelectionProfitEstimateSeed | null
  storeCode?: string
  currentSiteCode: 'SA' | 'AE'
}

export function useManualSelectionProfitEstimateData({
  form,
  open,
  seed,
  storeCode,
  currentSiteCode
}: Options) {
  const [calculation, setCalculation] = useState<ProfitCalculationPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<ManualSelectionSystemCategoryOption[]>([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [persistedFormState, setPersistedFormState] = useState<PersistedProfitFormState | null>(null)
  const [logisticsQuoteOptions, setLogisticsQuoteOptions] = useState<LogisticsQuoteOption[]>([])
  const [logisticsOptions, setLogisticsOptions] = useState<LogisticsProviderOption[]>([])
  const [logisticsLoading, setLogisticsLoading] = useState(false)
  const [logisticsHydrated, setLogisticsHydrated] = useState(false)
  const [logisticsError, setLogisticsError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    form.setFieldsValue(initialValues(seed, currentSiteCode))
    setCategoryOptions([])
    setCategoryError(null)
    setPersistedFormState(null)
    setLogisticsQuoteOptions([])
    setLogisticsOptions([])
    setLogisticsHydrated(false)
    setLogisticsError(null)
    setCalculation(null)
    setError(null)
    setSavedAt(null)
    setSaving(false)
    setSaveFeedback(null)

    if (seed?.groupId) {
      loadManualSelectionGroupProfitEstimate(seed.groupId)
        .then((snapshot) => {
          if (cancelled) return
          if (!snapshot || snapshot.status === 'missing') {
            setPersistedFormState({ schemaVersion: 0, formValues: {} })
            return
          }
          const formValues = savedFormValues(snapshot)
          if (formValues) {
            form.setFieldsValue({ ...formValues, site: currentSiteCode })
          }
          setPersistedFormState({
            schemaVersion: savedSnapshotVersion(snapshot),
            formValues: formValues || {}
          })
          setSavedAt(snapshot.createdAt || null)
        })
        .catch((reason) => {
          if (cancelled) return
          setPersistedFormState({ schemaVersion: 0, formValues: {} })
          setError(reason instanceof Error ? reason.message : '读取已保存预估利润失败')
        })
    } else {
      setPersistedFormState({ schemaVersion: 0, formValues: {} })
    }

    setCategoryLoading(true)
    fetchSystemCategoryOptions(storeCode, seed)
      .then((options) => {
        if (cancelled) return
        setCategoryOptions(options)
        const matchedCategory = chooseSystemCategoryOption(options, seed)
        if (!form.getFieldValue('categoryKey')) {
          form.setFieldValue('categoryKey', matchedCategory?.value || '')
        }
        if (!storeCode) {
          setCategoryError('缺少当前店铺编码，暂时不能读取系统类目表。')
        } else if (!options.length) {
          setCategoryError('当前店铺没有可用系统类目，请先同步或维护系统类目表。')
        } else if (!matchedCategory) {
          setCategoryError('未从系统类目表自动匹配到当前商品，请手动选择类目。')
        }
      })
      .catch((reason) => {
        if (cancelled) return
        setCategoryOptions([])
        setCategoryError(reason instanceof Error ? reason.message : '读取系统类目表失败')
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false)
      })

    setLogisticsLoading(true)
    fetchLogisticsQuoteOperationPriceItems()
      .then((payload) => {
        if (cancelled) return
        const quotes = buildLogisticsQuoteOptions(payload.items || [], currentSiteCode)
        const options = buildLogisticsProviderOptions(quotes)
        setLogisticsQuoteOptions(quotes)
        setLogisticsOptions(options)
        if (!options.length) {
          setLogisticsError(`${siteLabel(currentSiteCode)} 未维护可用于利润预估的空运/KG 或海运/CBM 主报价。`)
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setLogisticsError(reason instanceof Error ? reason.message : '读取系统货代报价失败')
        }
      })
      .finally(() => {
        if (!cancelled) setLogisticsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentSiteCode, form, open, seed, storeCode])

  useEffect(() => {
    if (!open || persistedFormState === null || logisticsLoading) {
      return
    }
    const selections = resolvePersistedLogisticsSelections(
      logisticsOptions,
      logisticsQuoteOptions,
      persistedFormState.schemaVersion,
      persistedFormState.formValues
    )
    form.setFieldsValue({
      airProviderKey: selections.air.providerValue,
      airQuoteKey: selections.air.quoteValue,
      seaProviderKey: selections.sea.providerValue,
      seaQuoteKey: selections.sea.quoteValue
    })
    if (selections.staleModes.length) {
      const labels = selections.staleModes.map(transportModeLabel).join('、')
      setLogisticsError(`已保存的${labels}货代或报价当前不可用，请重新选择。`)
    }
    setLogisticsHydrated(true)
  }, [form, logisticsLoading, logisticsOptions, logisticsQuoteOptions, open, persistedFormState])

  return {
    calculation, setCalculation, loading, setLoading, saving, setSaving,
    saveFeedback, setSaveFeedback, error, setError, savedAt, setSavedAt,
    categoryOptions, categoryLoading, categoryError,
    logisticsQuoteOptions, logisticsOptions, logisticsLoading,
    logisticsHydrated, logisticsError, setLogisticsError
  }
}
