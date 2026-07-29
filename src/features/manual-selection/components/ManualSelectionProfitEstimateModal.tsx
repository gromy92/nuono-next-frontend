import { Button, Form, Modal, Space } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { calculateProfitEstimate } from '../../profit-calculator/api'
import { saveManualSelectionGroupProcurement } from '../api'
import { saveManualSelectionGroupProfitEstimate } from '../../selection-analysis/api'
import { buildCompetitorCategoryRows } from '../profitCompetitorCategoryLinks'
import {
  scenarioMatchesLogisticsQuotes,
} from '../profitEstimateLogisticsOptions'
import {
  logisticsProvidersForMode,
  logisticsSelectionEvidence
} from '../profitEstimateLogisticsSelection'
import {
  buildProfitRequest,
  domesticShippingFee,
  normalizeSiteCode,
  requiredValuesReady,
  siteVatRate,
  type ManualSelectionProfitEstimateModalProps,
  type ProfitEstimateFormValues
} from './manualSelectionProfitEstimateModel'
import { ManualSelectionCompetitorCategoryModal } from './ManualSelectionCompetitorCategoryModal'
import { ManualSelectionProfitEstimateForm } from './ManualSelectionProfitEstimateForm'
import { ManualSelectionProfitEstimateResults } from './ManualSelectionProfitEstimateResults'
import { useManualSelectionProfitEstimateData } from './useManualSelectionProfitEstimateData'

export function ManualSelectionProfitEstimateModal(props: ManualSelectionProfitEstimateModalProps) {
  const { open, seed, siteCode, storeCode, onCancel, onSaved } = props
  const currentSiteCode = normalizeSiteCode(siteCode)
  const [form] = Form.useForm<ProfitEstimateFormValues>()
  const watchedValues = Form.useWatch([], form) as Partial<ProfitEstimateFormValues> | undefined
  const [competitorCategoryOpen, setCompetitorCategoryOpen] = useState(false)
  const data = useManualSelectionProfitEstimateData({
    form,
    open,
    seed,
    storeCode,
    currentSiteCode
  })
  const {
    calculation, setCalculation, loading, setLoading, saving, setSaving,
    saveFeedback, setSaveFeedback, error, setError, savedAt, setSavedAt,
    categoryOptions, categoryLoading, categoryError,
    logisticsOptions, logisticsLoading, logisticsHydrated, logisticsError,
    setLogisticsError
  } = data

  const computedDomesticShippingFee = domesticShippingFee(watchedValues?.grossWeightKg)
  const effectiveSite = normalizeSiteCode(watchedValues?.site || currentSiteCode)
  const vatRate = siteVatRate(effectiveSite)
  const selectedCategory = categoryOptions.find((item) => item.value === watchedValues?.categoryKey)
  const airProviders = logisticsProvidersForMode(logisticsOptions, 'AIR')
  const seaProviders = logisticsProvidersForMode(logisticsOptions, 'SEA')
  const selectedAirProvider = airProviders.find((item) => item.value === watchedValues?.airProviderKey)
  const selectedSeaProvider = seaProviders.find((item) => item.value === watchedValues?.seaProviderKey)
  const selectedAirQuote = selectedAirProvider?.airQuotes.find((quote) => quote.value === watchedValues?.airQuoteKey)
  const selectedSeaQuote = selectedSeaProvider?.seaQuotes.find((quote) => quote.value === watchedValues?.seaQuoteKey)
  const quoteSelectionReady = Boolean(
    selectedAirProvider
    && selectedAirQuote
    && selectedSeaProvider
    && selectedSeaQuote
  )
  const canCalculate = requiredValuesReady({ ...watchedValues, site: currentSiteCode })
    && Boolean(selectedCategory && quoteSelectionReady)
  const visibleScenarios = useMemo(() => (
    calculation?.scenarios?.filter((scenario) => (
      scenarioMatchesLogisticsQuotes(scenario.code, selectedAirQuote, selectedSeaQuote)
    )) || []
  ), [calculation, selectedAirQuote, selectedSeaQuote])
  const competitorCategoryRows = useMemo(() => (
    buildCompetitorCategoryRows(seed?.competitors || [])
  ), [seed?.competitors])

  const handleLogisticsProviderChange = (mode: 'AIR' | 'SEA', providerValue: string) => {
    const provider = logisticsOptions.find((item) => item.value === providerValue)
    const quotes = mode === 'AIR' ? provider?.airQuotes : provider?.seaQuotes
    form.setFieldsValue(mode === 'AIR'
      ? { airQuoteKey: quotes?.length === 1 ? quotes[0].value : undefined }
      : { seaQuoteKey: quotes?.length === 1 ? quotes[0].value : undefined })
    setCalculation(null)
    setLogisticsError(null)
  }

  const handleLogisticsQuoteChange = () => {
    setCalculation(null)
    setLogisticsError(null)
  }

  useEffect(() => {
    if (!open || !canCalculate || !selectedAirQuote || !selectedSeaQuote) {
      setCalculation(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setCalculation(null)
    const timer = window.setTimeout(() => {
      const values = {
        ...form.getFieldsValue(),
        site: currentSiteCode
      }
      setLoading(true)
      setError(null)
      calculateProfitEstimate(buildProfitRequest(values, selectedAirQuote, selectedSeaQuote))
        .then((payload) => {
          if (!cancelled) {
            setCalculation(payload)
          }
        })
        .catch((reason) => {
          if (!cancelled) {
            setCalculation(null)
            setError(reason instanceof Error ? reason.message : '预估利润计算失败')
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false)
          }
        })
    }, 450)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [canCalculate, currentSiteCode, form, open, selectedAirQuote, selectedSeaQuote, watchedValues])

  const bestScenario = useMemo(() => {
    return visibleScenarios
      ?.slice()
      .sort((left, right) => right.profitRmb - left.profitRmb)[0]
  }, [visibleScenarios])

  const handleSave = async () => {
    const groupId = seed?.groupId
    if (!groupId) {
      setSaveFeedback({ type: 'warning', message: '缺少选品组，无法保存预估利润。' })
      return
    }
    setSaveFeedback(null)
    try {
      const values = {
        ...(await form.validateFields()),
        site: currentSiteCode
      }
      const airProvider = airProviders.find((item) => item.value === values.airProviderKey)
      const seaProvider = seaProviders.find((item) => item.value === values.seaProviderKey)
      const category = categoryOptions.find((item) => item.value === values.categoryKey)
      const airQuote = airProvider?.airQuotes.find((quote) => quote.value === values.airQuoteKey)
      const seaQuote = seaProvider?.seaQuotes.find((quote) => quote.value === values.seaQuoteKey)
      if (!airProvider || !airQuote || !seaProvider || !seaQuote || !category) {
        setSaveFeedback({ type: 'warning', message: '请先选择系统类目、空运货代与报价、海运货代与报价。' })
        return
      }
      setSaving(true)
      const currentCalculation = await calculateProfitEstimate(
        buildProfitRequest(values, airQuote, seaQuote)
      )
      const currentVisibleScenarios = currentCalculation.scenarios.filter((scenario) => (
        scenarioMatchesLogisticsQuotes(scenario.code, airQuote, seaQuote)
      ))
      const currentBestScenario = currentVisibleScenarios
        .slice()
        .sort((left, right) => right.profitRmb - left.profitRmb)[0]
      if (!currentBestScenario) {
        throw new Error('利润接口未返回可保存的空运或海运方案。')
      }
      setCalculation(currentCalculation)
      await saveManualSelectionGroupProcurement(groupId, {
        purchaseUrl: values.ali1688Url,
        purchasePrice: values.purchasePrice
      })
      const snapshot = await saveManualSelectionGroupProfitEstimate(groupId, {
        currencyCode: 'RMB',
        profitAmount: currentBestScenario.profitRmb,
        profitMargin: currentBestScenario.marginRatePct,
        snapshot: {
          schemaVersion: 3,
          formValues: values,
          selectedCategory: category,
          selectedLogistics: {
            AIR: logisticsSelectionEvidence(airProvider, airQuote),
            SEA: logisticsSelectionEvidence(seaProvider, seaQuote)
          },
          calculation: currentCalculation,
          visibleScenarioCodes: currentVisibleScenarios.map((scenario) => scenario.code),
          bestScenario: currentBestScenario,
          savedAt: new Date().toISOString()
        }
      })
      const nextSavedAt = snapshot.createdAt || null
      setSavedAt(nextSavedAt)
      setSaveFeedback({
        type: 'success',
        message: nextSavedAt ? `保存成功，时间 ${nextSavedAt}` : '保存成功'
      })
      onSaved?.(snapshot)
    } catch (reason) {
      const validationError = typeof reason === 'object'
        && reason !== null
        && Array.isArray((reason as { errorFields?: unknown[] }).errorFields)
      setSaveFeedback({
        type: 'error',
        message: validationError
          ? '请补齐必填项后再保存。'
          : (reason instanceof Error ? reason.message : '保存预估利润失败')
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="预估利润"
      open={open}
      width={1040}
      footer={[
        <Button
          key="save"
          type="primary"
          loading={saving}
          disabled={!logisticsHydrated}
          onClick={() => void handleSave()}
        >
          {saving ? '保存中' : '保存'}
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>
      ]}
      destroyOnClose
      onCancel={onCancel}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <ManualSelectionProfitEstimateForm
          form={form}
          seed={seed}
          currentSiteCode={currentSiteCode}
          categoryOptions={categoryOptions}
          categoryLoading={categoryLoading}
          setCompetitorCategoryOpen={setCompetitorCategoryOpen}
          airProviders={airProviders}
          seaProviders={seaProviders}
          selectedAirProvider={selectedAirProvider}
          selectedSeaProvider={selectedSeaProvider}
          logisticsLoading={logisticsLoading}
          logisticsHydrated={logisticsHydrated}
          effectiveSite={effectiveSite}
          handleLogisticsProviderChange={handleLogisticsProviderChange}
          handleLogisticsQuoteChange={handleLogisticsQuoteChange}
        />

        <ManualSelectionProfitEstimateResults
          vatRate={vatRate}
          computedDomesticShippingFee={computedDomesticShippingFee}
          selectedAirProvider={selectedAirProvider}
          selectedAirQuote={selectedAirQuote}
          selectedSeaProvider={selectedSeaProvider}
          selectedSeaQuote={selectedSeaQuote}
          bestScenario={bestScenario}
          savedAt={savedAt}
          logisticsError={logisticsError}
          categoryError={categoryError}
          saveFeedback={saveFeedback}
          error={error}
          canCalculate={canCalculate}
          loading={loading}
          visibleScenarios={visibleScenarios}
        />

        <ManualSelectionCompetitorCategoryModal
          open={competitorCategoryOpen}
          rows={competitorCategoryRows}
          onClose={() => setCompetitorCategoryOpen(false)}
        />
      </Space>
    </Modal>
  )
}
