import { LinkOutlined } from '@ant-design/icons'
import { Alert, Button, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { fetchLogisticsQuoteOperationPriceItems } from '../../logistics-quote/api'
import { calculateProfitEstimate } from '../../profit-calculator/api'
import {
  formatMoney,
  PROFIT_FORM_DEFAULTS,
  profitScenarioColor,
  type ProfitCalculationPayload
} from '../../profit-calculator/domain'
import { loadManualSelectionSystemCategories, saveManualSelectionGroupProcurement } from '../api'
import { loadManualSelectionGroupProfitEstimate, saveManualSelectionGroupProfitEstimate } from '../../selection-analysis/api'
import {
  chooseSystemCategoryOption,
  systemCategoryDisplayLabel,
  systemCategoryOptionSearchText,
  systemCategorySearchTerms,
  type ManualSelectionSystemCategoryOption
} from '../profitCategoryMatching'
import {
  buildCompetitorCategoryRows,
  type CompetitorCategoryRow
} from '../profitCompetitorCategoryLinks'
import {
  buildLogisticsProviderOptions,
  buildLogisticsQuoteOptions,
  scenarioMatchesLogisticsQuotes,
  transportModeLabel,
  type LogisticsProviderOption,
  type LogisticsQuoteOption
} from '../profitEstimateLogisticsOptions'
import {
  logisticsProvidersForMode,
  logisticsSelectionEvidence,
  resolvePersistedLogisticsSelections
} from '../profitEstimateLogisticsSelection'
import type { ManualSelectionGroupProfitEstimateSnapshot } from '../../selection-analysis/types'
import type { ManualSelectionProfitEstimateSeed } from '../types'
import { ManualSelectionProfitLogisticsFields, profitQuoteOptionLabel } from './ManualSelectionProfitLogisticsFields'

const { Text } = Typography
const SYSTEM_CATEGORY_SELECT_LIMIT = 5000

type ProfitEstimateFormValues = {
  ali1688Url?: string
  title?: string
  site: 'SA' | 'AE'
  salePrice?: number
  purchasePrice?: number
  lengthCm: number
  widthCm: number
  heightCm: number
  grossWeightKg: number
  categoryKey: string
  airProviderKey?: string
  seaProviderKey?: string
  /** Legacy v1/v2 snapshot field. */
  logisticsProviderKey?: string
  airQuoteKey?: string
  seaQuoteKey?: string
}

type ManualSelectionProfitEstimateModalProps = {
  open: boolean
  seed?: ManualSelectionProfitEstimateSeed | null
  siteCode?: string
  storeCode?: string
  onCancel: () => void
  onSaved?: (snapshot: ManualSelectionGroupProfitEstimateSnapshot) => void
}

const DEFAULT_CATEGORY_COMMISSION_RATE = PROFIT_FORM_DEFAULTS.fbnCommissionRate

type SaveFeedback = {
  type: 'success' | 'warning' | 'error'
  message: string
}

type PersistedProfitFormState = {
  schemaVersion: number
  formValues: Partial<ProfitEstimateFormValues>
}

function initialValues(
  seed: ManualSelectionProfitEstimateSeed | null | undefined,
  siteCode: 'SA' | 'AE',
  categoryKey = ''
): ProfitEstimateFormValues {
  return {
    ali1688Url: seed?.ali1688Url || '',
    title: seed?.title || '',
    site: siteCode,
    salePrice: seed?.salePrice,
    purchasePrice: seed?.purchasePrice,
    lengthCm: PROFIT_FORM_DEFAULTS.lengthCm,
    widthCm: PROFIT_FORM_DEFAULTS.widthCm,
    heightCm: PROFIT_FORM_DEFAULTS.heightCm,
    grossWeightKg: Number((PROFIT_FORM_DEFAULTS.weightGrams / 1000).toFixed(3)),
    categoryKey,
    airProviderKey: undefined,
    airQuoteKey: undefined,
    seaProviderKey: undefined,
    seaQuoteKey: undefined
  }
}

function normalizeSiteCode(value?: string): 'SA' | 'AE' {
  const normalized = (value || '').trim().toUpperCase()
  if (normalized === 'AE' || normalized === 'ARE' || normalized === 'UAE' || normalized.includes('NAE')) {
    return 'AE'
  }
  return 'SA'
}

function siteLabel(site: 'SA' | 'AE') {
  return site === 'AE' ? '阿联酋 AE' : '沙特 SA'
}

function siteVatRate(site?: string) {
  return site === 'AE' ? 0.05 : 0.15
}

function domesticShippingFee(grossWeightKg?: number) {
  if (typeof grossWeightKg !== 'number' || !Number.isFinite(grossWeightKg)) {
    return 0
  }
  return Number((grossWeightKg * 2).toFixed(2))
}

function requiredValuesReady(values?: Partial<ProfitEstimateFormValues>) {
  return Boolean(
    values?.site
    && values.salePrice
    && values.purchasePrice
    && values.lengthCm
    && values.widthCm
    && values.heightCm
    && values.grossWeightKg
    && values.categoryKey
  )
}

function snapshotObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

function savedFormValues(snapshot?: ManualSelectionGroupProfitEstimateSnapshot | null) {
  return snapshotObject(snapshot?.snapshot?.formValues) as Partial<ProfitEstimateFormValues> | undefined
}

function savedSnapshotVersion(snapshot?: ManualSelectionGroupProfitEstimateSnapshot | null) {
  return Number(snapshotObject(snapshot?.snapshot)?.schemaVersion || 1)
}

function categorySelectLabel(option: ManualSelectionSystemCategoryOption) {
  const label = systemCategoryDisplayLabel(option)
  const detail = [
    option.family,
    option.productType,
    option.productSubtype
  ].filter(Boolean).join(' / ')
  if (!detail || detail === label) {
    return label
  }
  return `${label} · ${detail}`
}

function categorySelectOptionLabel(option: ManualSelectionSystemCategoryOption) {
  const name = systemCategoryDisplayLabel(option)
  const pathLabel = [
    option.family,
    option.productType,
    option.productSubtype
  ].filter(Boolean).join(' / ')
  const fullLabel = categorySelectLabel(option)
  return (
    <span className="manual-selection-profit-category-option" title={fullLabel}>
      <span className="manual-selection-profit-category-option-name">{name}</span>
      {pathLabel && pathLabel !== name ? (
        <span className="manual-selection-profit-category-option-path">{pathLabel}</span>
      ) : null}
    </span>
  )
}

function uniqueCategoryOptions(groups: ManualSelectionSystemCategoryOption[][]) {
  const seen = new Set<string>()
  const merged: ManualSelectionSystemCategoryOption[] = []
  groups.flat().forEach((item) => {
    if (!item.value || seen.has(item.value)) {
      return
    }
    seen.add(item.value)
    merged.push(item)
  })
  return merged
}

async function fetchSystemCategoryOptions(storeCode: string | undefined, seed?: ManualSelectionProfitEstimateSeed | null) {
  if (!storeCode) {
    return []
  }
  const options = await loadManualSelectionSystemCategories(storeCode, {
    query: '',
    limit: SYSTEM_CATEGORY_SELECT_LIMIT,
    includeGlobalFulltypes: true
  })
  const searchTerms = systemCategorySearchTerms(seed).slice(0, 8)
  const matchedOptions = options.filter((option) => {
    const searchText = systemCategoryOptionSearchText(option)
    return searchTerms.some((term) => searchText.includes(term.toLowerCase()))
  })
  return uniqueCategoryOptions([matchedOptions, options])
}

function buildProfitRequest(
  values: ProfitEstimateFormValues,
  airQuote: LogisticsQuoteOption,
  seaQuote: LogisticsQuoteOption
) {
  return {
    title: values.title || values.ali1688Url || '',
    site: values.site,
    salePrice: values.salePrice,
    purchasePrice: values.purchasePrice,
    lengthCm: values.lengthCm,
    widthCm: values.widthCm,
    heightCm: values.heightCm,
    weightGrams: Number((values.grossWeightKg * 1000).toFixed(2)),
    vatRate: siteVatRate(values.site),
    exchangeRate: values.site === 'AE' ? 1.96 : PROFIT_FORM_DEFAULTS.exchangeRate,
    domesticShippingFee: domesticShippingFee(values.grossWeightKg),
    warehouseDeliveryUnitPrice: PROFIT_FORM_DEFAULTS.warehouseDeliveryUnitPrice,
    airFreightUnitPrice: airQuote.unitPrice,
    oceanFreightUnitPrice: seaQuote.unitPrice,
    airFreightDimFactor: PROFIT_FORM_DEFAULTS.airFreightDimFactor,
    fbnCommissionRate: DEFAULT_CATEGORY_COMMISSION_RATE,
    fbpCommissionRate: DEFAULT_CATEGORY_COMMISSION_RATE,
    fbnOutboundFee: PROFIT_FORM_DEFAULTS.fbnOutboundFee,
    manualFbnOutboundFeeOverride: true,
    fbpDirectShipFee: PROFIT_FORM_DEFAULTS.fbpDirectShipFee,
    fulfillmentFee: PROFIT_FORM_DEFAULTS.fulfillmentFee
  }
}

function scenarioColumns(): ColumnsType<ProfitCalculationPayload['scenarios'][number]> {
  return [
    {
      title: '方案',
      dataIndex: 'label',
      width: 130,
      render: (value: string) => <Text strong>{value}</Text>
    },
    {
      title: '预估利润',
      dataIndex: 'profitRmb',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: profitScenarioColor(value) }}>
          ¥{formatMoney(value)}
        </Text>
      )
    },
    {
      title: '利润率',
      dataIndex: 'marginRatePct',
      width: 90,
      align: 'right',
      render: (value: number) => `${formatMoney(value)}%`
    },
    {
      title: '销售收入',
      dataIndex: 'grossRevenueRmb',
      width: 110,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '平台扣费',
      dataIndex: 'platformDeductionRmb',
      width: 110,
      align: 'right',
      render: (value: number, row) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
          <Text>¥{formatMoney(value)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatMoney(row.commissionAmountMarket)} + {formatMoney(row.platformFeeAmountMarket)} + 税
          </Text>
        </Space>
      )
    },
    {
      title: '采购',
      dataIndex: 'purchasePriceRmb',
      width: 90,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '国内物流',
      dataIndex: 'domesticShippingFeeRmb',
      width: 100,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '头程',
      dataIndex: 'firstLegFeeRmb',
      width: 90,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '总成本',
      dataIndex: 'totalCostRmb',
      width: 100,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    }
  ]
}

export function ManualSelectionProfitEstimateModal(props: ManualSelectionProfitEstimateModalProps) {
  const { open, seed, siteCode, storeCode, onCancel, onSaved } = props
  const currentSiteCode = normalizeSiteCode(siteCode)
  const [form] = Form.useForm<ProfitEstimateFormValues>()
  const watchedValues = Form.useWatch([], form) as Partial<ProfitEstimateFormValues> | undefined
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
  const [competitorCategoryOpen, setCompetitorCategoryOpen] = useState(false)

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
          if (cancelled) {
            return
          }
          if (!snapshot || snapshot.status === 'missing') {
            setPersistedFormState({ schemaVersion: 0, formValues: {} })
            return
          }
          const formValues = savedFormValues(snapshot)
          if (formValues) {
            form.setFieldsValue({
              ...formValues,
              site: currentSiteCode
            })
          }
          setPersistedFormState({
            schemaVersion: savedSnapshotVersion(snapshot),
            formValues: formValues || {}
          })
          setSavedAt(snapshot.createdAt || null)
        })
        .catch((reason) => {
          if (cancelled) {
            return
          }
          setPersistedFormState({ schemaVersion: 0, formValues: {} })
          setError(reason instanceof Error ? reason.message : '读取已保存预估利润失败')
        })
    } else {
      setPersistedFormState({ schemaVersion: 0, formValues: {} })
    }
    setCategoryLoading(true)
    fetchSystemCategoryOptions(storeCode, seed)
      .then((options) => {
        if (cancelled) {
          return
        }
        setCategoryOptions(options)
        const matchedCategory = chooseSystemCategoryOption(options, seed)
        if (!form.getFieldValue('categoryKey')) {
          form.setFieldValue('categoryKey', matchedCategory?.value || '')
        }
        if (!storeCode) {
          setCategoryError('缺少当前店铺编码，暂时不能读取系统类目表。')
          return
        }
        if (!options.length) {
          setCategoryError('当前店铺没有可用系统类目，请先同步或维护系统类目表。')
          return
        }
        if (!matchedCategory) {
          setCategoryError('未从系统类目表自动匹配到当前商品，请手动选择类目。')
        }
      })
      .catch((reason) => {
        if (cancelled) {
          return
        }
        setCategoryOptions([])
        setCategoryError(reason instanceof Error ? reason.message : '读取系统类目表失败')
      })
      .finally(() => {
        if (!cancelled) {
          setCategoryLoading(false)
        }
      })
    setLogisticsLoading(true)
    fetchLogisticsQuoteOperationPriceItems()
      .then((payload) => {
        if (cancelled) {
          return
        }
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
        if (!cancelled) {
          setLogisticsLoading(false)
        }
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
        <Form form={form} layout="vertical" initialValues={initialValues(seed, currentSiteCode)}>
          <Row gutter={10}>
            <Col span={9}>
              <Form.Item label="1688采购链接" name="ali1688Url">
                <Input placeholder="粘贴 1688 商品链接" />
              </Form.Item>
            </Col>
            <Col span={11}>
              <Form.Item
                label={(
                  <Space size={6}>
                    <span>商品类目</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setCompetitorCategoryOpen(true)
                      }}
                    >
                      查看竞品类目
                    </Button>
                  </Space>
                )}
                name="categoryKey"
                rules={[{ required: true, message: '请选择商品类目' }]}
              >
                <Select
                  loading={categoryLoading}
                  optionFilterProp="searchText"
                  options={categoryOptions.map((option) => {
                    const label = categorySelectLabel(option)
                    return {
                      label: categorySelectOptionLabel(option),
                      displayLabel: systemCategoryDisplayLabel(option),
                      searchText: systemCategoryOptionSearchText(option),
                      value: option.value
                    }
                  })}
                  optionLabelProp="displayLabel"
                  placeholder={categoryLoading ? '读取系统类目' : '选择系统类目'}
                  popupClassName="manual-selection-profit-category-dropdown"
                  popupMatchSelectWidth={860}
                  showSearch
                  virtual
                  notFoundContent={categoryLoading ? <Spin size="small" /> : '暂无匹配系统类目'}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <div className="manual-selection-profit-site">
                <Text type="secondary">当前站点</Text>
                <Tag color="blue">{siteLabel(currentSiteCode)}</Tag>
              </div>
            </Col>
          </Row>
          <Row gutter={10}>
            <ManualSelectionProfitLogisticsFields
              mode="AIR"
              providers={airProviders}
              selectedProvider={selectedAirProvider}
              loading={logisticsLoading}
              disabled={!logisticsHydrated}
              onProviderChange={(value) => handleLogisticsProviderChange('AIR', value)}
              onQuoteChange={handleLogisticsQuoteChange}
            />
            <ManualSelectionProfitLogisticsFields
              mode="SEA"
              providers={seaProviders}
              selectedProvider={selectedSeaProvider}
              loading={logisticsLoading}
              disabled={!logisticsHydrated}
              onProviderChange={(value) => handleLogisticsProviderChange('SEA', value)}
              onQuoteChange={handleLogisticsQuoteChange}
            />
          </Row>
          <Row gutter={10}>
            <Col span={5}>
              <Form.Item label="目标售价" name="salePrice" rules={[{ required: true, message: '请输入目标售价' }]}>
                <InputNumber min={0} precision={2} addonAfter={effectiveSite === 'AE' ? 'AED' : 'SAR'} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="采购单价" name="purchasePrice" rules={[{ required: true, message: '请输入采购单价' }]}>
                <InputNumber min={0} precision={2} addonAfter="RMB" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="长" name="lengthCm" rules={[{ required: true, message: '请输入长度' }]}>
                <InputNumber min={0} precision={1} addonAfter="cm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="宽" name="widthCm" rules={[{ required: true, message: '请输入宽度' }]}>
                <InputNumber min={0} precision={1} addonAfter="cm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="高" name="heightCm" rules={[{ required: true, message: '请输入高度' }]}>
                <InputNumber min={0} precision={1} addonAfter="cm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="毛重" name="grossWeightKg" rules={[{ required: true, message: '请输入毛重' }]}>
                <InputNumber min={0} precision={3} addonAfter="kg" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Space wrap size={[8, 6]}>
          <Tag>税率 {(vatRate * 100).toFixed(0)}%</Tag>
          <Tag>佣金率 {(DEFAULT_CATEGORY_COMMISSION_RATE * 100).toFixed(0)}%</Tag>
          <Tag>国内物流 ¥{formatMoney(computedDomesticShippingFee)}</Tag>
          <Tag>毛重 × 2 RMB/kg</Tag>
          {selectedAirProvider && selectedAirQuote ? (
            <Tag>空运 {selectedAirProvider.forwarderName} · {profitQuoteOptionLabel(selectedAirQuote)}</Tag>
          ) : null}
          {selectedSeaProvider && selectedSeaQuote ? (
            <Tag>海运 {selectedSeaProvider.forwarderName} · {profitQuoteOptionLabel(selectedSeaQuote)}</Tag>
          ) : null}
          {bestScenario ? (
            <Tag color={bestScenario.profitRmb >= 0 ? 'success' : 'error'}>
              最优 {bestScenario.label} ¥{formatMoney(bestScenario.profitRmb)}
            </Tag>
          ) : null}
          {savedAt ? <Tag color="processing">已保存 {savedAt}</Tag> : null}
        </Space>

        {logisticsError ? <Alert showIcon type="warning" message={logisticsError} /> : null}
        {categoryError ? <Alert showIcon type="warning" message={categoryError} /> : null}
        {saveFeedback ? <Alert showIcon type={saveFeedback.type} message={saveFeedback.message} /> : null}
        {error ? <Alert showIcon type="error" message={error} /> : null}
        {!canCalculate ? (
          <Alert
            showIcon
            type="warning"
            message="请补齐售价、采购价、尺寸、毛重、类目、空运货代与报价、海运货代与报价"
          />
        ) : null}

        <Spin spinning={loading}>
          <Table
            rowKey="code"
            size="small"
            pagination={false}
            columns={scenarioColumns()}
            dataSource={visibleScenarios}
            locale={{ emptyText: canCalculate ? '等待计算结果' : '缺少参数' }}
            scroll={{ x: 930 }}
          />
        </Spin>

        <Modal
          title="竞品类目链接"
          open={competitorCategoryOpen}
          width={780}
          footer={[
            <Button key="close" onClick={() => setCompetitorCategoryOpen(false)}>
              关闭
            </Button>
          ]}
          onCancel={() => setCompetitorCategoryOpen(false)}
        >
          <Table<CompetitorCategoryRow>
            rowKey="rowKey"
            size="small"
            pagination={false}
            dataSource={competitorCategoryRows}
            columns={[
              {
                title: '竞品',
                dataIndex: 'competitorLabel',
                width: 220,
                render: (value: string) => (
                  <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                    {value}
                  </Typography.Paragraph>
                )
              },
              {
                title: '来源',
                dataIndex: 'sourceHost',
                width: 130,
                render: (value: string) => value || '-'
              },
              {
                title: '类目',
                dataIndex: 'categoryPath',
                width: 180,
                render: (value: string) => <Text type={value === '暂无类目链接' ? 'secondary' : undefined}>{value}</Text>
              },
              {
                title: '类目链接',
                dataIndex: 'categoryUrl',
                width: 120,
                render: (value: string) => value ? (
                  <Typography.Link href={value} target="_blank" rel="noreferrer">
                    打开
                  </Typography.Link>
                ) : (
                  <Text type="secondary">暂无</Text>
                )
              },
              {
                title: '商品链接',
                dataIndex: 'productUrl',
                width: 120,
                render: (value: string) => value ? (
                  <Typography.Link href={value} target="_blank" rel="noreferrer">
                    查看
                  </Typography.Link>
                ) : (
                  <Text type="secondary">暂无</Text>
                )
              }
            ]}
            locale={{ emptyText: '当前选品组暂无竞品链接' }}
          />
        </Modal>
      </Space>
    </Modal>
  )
}
