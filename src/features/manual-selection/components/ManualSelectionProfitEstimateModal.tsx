import { Alert, Button, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { fetchLogisticsQuoteOperationPriceItems } from '../../logistics-quote/api'
import type { LogisticsQuoteOperationPriceItemDto } from '../../logistics-quote/types'
import { calculateProfitEstimate } from '../../profit-calculator/api'
import {
  formatMoney,
  PROFIT_FORM_DEFAULTS,
  profitScenarioColor,
  type ProfitCalculationPayload
} from '../../profit-calculator/domain'
import {
  loadManualSelectionGroupProfitEstimate,
  loadManualSelectionSystemCategories,
  saveManualSelectionGroupProcurement,
  saveManualSelectionGroupProfitEstimate
} from '../api'
import {
  chooseSystemCategoryOption,
  systemCategoryDisplayLabel,
  systemCategoryOptionSearchText,
  systemCategorySearchTerms,
  type ManualSelectionSystemCategoryOption
} from '../profitCategoryMatching'
import type { ManualSelectionGroupProfitEstimateSnapshot, ManualSelectionProfitEstimateSeed } from '../types'

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
  logisticsProviderKey?: string
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

type LogisticsProviderOption = {
  label: string
  value: string
  forwarderName: string
  serviceName: string
  transportMode: 'AIR' | 'SEA'
  cargoCategoryName?: string
  quoteVersionNo?: string
  unitPrice: number
  billingUnit?: string
  sourceFileName?: string
}

type SaveFeedback = {
  type: 'success' | 'warning' | 'error'
  message: string
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
    logisticsProviderKey: undefined
  }
}

function logisticsProviderValue(item: LogisticsQuoteOperationPriceItemDto) {
  return `${item.targetType}:${item.targetId}`
}

function transportModeLabel(value?: string) {
  if (value === 'AIR') {
    return '空运'
  }
  if (value === 'SEA') {
    return '海运'
  }
  return value || '-'
}

function billingUnitLabel(value?: string) {
  if (value === 'KG') {
    return 'kg'
  }
  if (value === 'CBM') {
    return 'CBM'
  }
  return value || '-'
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

function isRmbCurrency(value?: string) {
  const normalized = value?.trim().toUpperCase()
  return normalized === 'RMB' || normalized === 'CNY'
}

function isSupportedMainFreightItem(item: LogisticsQuoteOperationPriceItemDto) {
  if (item.targetType !== 'BASE_PRICE' || item.priceStatus !== 'NORMAL') {
    return false
  }
  if (typeof item.effectiveValue !== 'number' || !Number.isFinite(item.effectiveValue) || item.effectiveValue <= 0) {
    return false
  }
  if (!isRmbCurrency(item.currency)) {
    return false
  }
  const transportMode = item.transportMode?.toUpperCase()
  const pricingModel = item.pricingModel?.toUpperCase()
  const billingUnit = item.billingUnit?.toUpperCase()
  return (
    (transportMode === 'AIR' && pricingModel === 'PER_KG' && billingUnit === 'KG') ||
    (transportMode === 'SEA' && pricingModel === 'PER_CBM' && billingUnit === 'CBM')
  )
}

function itemSiteSearchText(item: LogisticsQuoteOperationPriceItemDto) {
  return [
    item.forwarderName,
    item.serviceCode,
    item.serviceName,
    item.targetPlatform,
    item.deliveryCity,
    item.cargoCategoryCode,
    item.cargoCategoryName,
    item.categoryLevel1,
    item.categoryLevel2,
    item.sourceFileName,
    item.remark
  ].filter(Boolean).join(' ')
}

function hasSiteCodeToken(text: string, tokens: string[]) {
  return new RegExp(`(^|[^A-Z0-9])(${tokens.join('|')})([^A-Z0-9]|$)`).test(text)
}

function siteMarkerMatched(item: LogisticsQuoteOperationPriceItemDto, site: 'SA' | 'AE') {
  const rawText = itemSiteSearchText(item)
  const upperText = rawText.toUpperCase()
  const lowerText = rawText.toLowerCase()
  if (site === 'AE') {
    return (
      hasSiteCodeToken(upperText, ['AE', 'ARE', 'UAE', 'NAE']) ||
      lowerText.includes('dubai') ||
      rawText.includes('阿联酋') ||
      rawText.includes('迪拜') ||
      rawText.includes('DXB')
    )
  }
  return (
    hasSiteCodeToken(upperText, ['SA', 'SAU', 'KSA', 'NSA']) ||
    lowerText.includes('saudi') ||
    lowerText.includes('riyadh') ||
    lowerText.includes('jeddah') ||
    rawText.includes('沙特') ||
    rawText.includes('利雅得') ||
    rawText.includes('吉达') ||
    rawText.includes('RUH') ||
    rawText.includes('JED')
  )
}

function logisticsItemMatchesSite(item: LogisticsQuoteOperationPriceItemDto, site: 'SA' | 'AE') {
  const matchesCurrentSite = siteMarkerMatched(item, site)
  const matchesOtherSite = siteMarkerMatched(item, site === 'AE' ? 'SA' : 'AE')
  return matchesCurrentSite || !matchesOtherSite
}

function buildLogisticsProviderOptions(items: LogisticsQuoteOperationPriceItemDto[], site: 'SA' | 'AE') {
  const seenValues = new Set<string>()
  return items
    .filter(isSupportedMainFreightItem)
    .filter((item) => logisticsItemMatchesSite(item, site))
    .map((item): LogisticsProviderOption => {
      const transportMode = item.transportMode?.toUpperCase() === 'SEA' ? 'SEA' : 'AIR'
      const unitPrice = Number(item.effectiveValue)
      const value = logisticsProviderValue(item)
      const cargoCategoryName = item.cargoCategoryName || item.categoryLevel2 || item.categoryLevel1
      return {
        value,
        label: [
          item.forwarderName || '未命名货代',
          item.serviceName || item.serviceCode || '未命名服务线',
          cargoCategoryName,
          `${transportModeLabel(transportMode)} ¥${formatMoney(unitPrice)}/${billingUnitLabel(item.billingUnit)}`
        ].filter(Boolean).join(' / '),
        forwarderName: item.forwarderName || '未命名货代',
        serviceName: item.serviceName || item.serviceCode || '未命名服务线',
        transportMode,
        cargoCategoryName,
        quoteVersionNo: item.quoteVersionNo,
        unitPrice,
        billingUnit: item.billingUnit,
        sourceFileName: item.sourceFileName
      }
    })
    .filter((item) => {
      if (seenValues.has(item.value)) {
        return false
      }
      seenValues.add(item.value)
      return true
    })
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
    && values.logisticsProviderKey
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

function savedCalculation(snapshot?: ManualSelectionGroupProfitEstimateSnapshot | null) {
  return snapshotObject(snapshot?.snapshot?.calculation) as ProfitCalculationPayload | undefined
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

function buildProfitRequest(values: ProfitEstimateFormValues, provider: LogisticsProviderOption) {
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
    airFreightUnitPrice: provider.transportMode === 'AIR'
      ? provider.unitPrice
      : PROFIT_FORM_DEFAULTS.airFreightUnitPrice,
    oceanFreightUnitPrice: provider.transportMode === 'SEA'
      ? provider.unitPrice
      : PROFIT_FORM_DEFAULTS.oceanFreightUnitPrice,
    airFreightDimFactor: PROFIT_FORM_DEFAULTS.airFreightDimFactor,
    fbnCommissionRate: DEFAULT_CATEGORY_COMMISSION_RATE,
    fbpCommissionRate: DEFAULT_CATEGORY_COMMISSION_RATE,
    fbnOutboundFee: PROFIT_FORM_DEFAULTS.fbnOutboundFee,
    manualFbnOutboundFeeOverride: true,
    fbpDirectShipFee: PROFIT_FORM_DEFAULTS.fbpDirectShipFee,
    fulfillmentFee: PROFIT_FORM_DEFAULTS.fulfillmentFee
  }
}

function scenarioMatchesProvider(scenarioCode: string, provider?: LogisticsProviderOption) {
  if (!provider) {
    return false
  }
  if (provider.transportMode === 'AIR') {
    return scenarioCode.includes('_AIR')
  }
  if (provider.transportMode === 'SEA') {
    return scenarioCode.includes('_OCEAN')
  }
  return false
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
  const [logisticsOptions, setLogisticsOptions] = useState<LogisticsProviderOption[]>([])
  const [logisticsLoading, setLogisticsLoading] = useState(false)
  const [logisticsError, setLogisticsError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    form.setFieldsValue(initialValues(seed, currentSiteCode))
    setCategoryOptions([])
    setCategoryError(null)
    setLogisticsOptions([])
    setLogisticsError(null)
    setCalculation(null)
    setError(null)
    setSavedAt(null)
    setSaving(false)
    setSaveFeedback(null)
    if (seed?.groupId) {
      loadManualSelectionGroupProfitEstimate(seed.groupId)
        .then((snapshot) => {
          if (!snapshot || snapshot.status === 'missing') {
            return
          }
          const formValues = savedFormValues(snapshot)
          if (formValues) {
            form.setFieldsValue({
              ...formValues,
              site: currentSiteCode
            })
          }
          const persistedCalculation = savedCalculation(snapshot)
          if (persistedCalculation) {
            setCalculation(persistedCalculation)
          }
          setSavedAt(snapshot.createdAt || null)
        })
        .catch((reason) => {
          setError(reason instanceof Error ? reason.message : '读取已保存预估利润失败')
        })
    }
    setCategoryLoading(true)
    fetchSystemCategoryOptions(storeCode, seed)
      .then((options) => {
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
        setCategoryOptions([])
        setCategoryError(reason instanceof Error ? reason.message : '读取系统类目表失败')
      })
      .finally(() => setCategoryLoading(false))
    setLogisticsLoading(true)
    fetchLogisticsQuoteOperationPriceItems()
      .then((payload) => {
        const options = buildLogisticsProviderOptions(payload.items || [], currentSiteCode)
        setLogisticsOptions(options)
        if (!options.length) {
          setLogisticsError(`${siteLabel(currentSiteCode)} 未维护可用于利润预估的空运/KG 或海运/CBM 主报价。`)
          return
        }
        const currentProviderKey = form.getFieldValue('logisticsProviderKey')
        if (!currentProviderKey || !options.some((option) => option.value === currentProviderKey)) {
          form.setFieldValue('logisticsProviderKey', options[0].value)
        }
      })
      .catch((reason) => {
        setLogisticsError(reason instanceof Error ? reason.message : '读取系统货代报价失败')
      })
      .finally(() => setLogisticsLoading(false))
  }, [currentSiteCode, form, open, seed, storeCode])

  const computedDomesticShippingFee = domesticShippingFee(watchedValues?.grossWeightKg)
  const effectiveSite = normalizeSiteCode(watchedValues?.site || currentSiteCode)
  const vatRate = siteVatRate(effectiveSite)
  const selectedCategory = categoryOptions.find((item) => item.value === watchedValues?.categoryKey)
  const selectedProvider = logisticsOptions.find((item) => item.value === watchedValues?.logisticsProviderKey)
  const canCalculate = requiredValuesReady({ ...watchedValues, site: currentSiteCode }) && Boolean(selectedCategory && selectedProvider)
  const visibleScenarios = useMemo(() => (
    calculation?.scenarios?.filter((scenario) => scenarioMatchesProvider(scenario.code, selectedProvider)) || []
  ), [calculation, selectedProvider])

  useEffect(() => {
    if (!open || !canCalculate || !selectedProvider) {
      return
    }
    const timer = window.setTimeout(() => {
      const values = {
        ...form.getFieldsValue(),
        site: currentSiteCode
      }
      setLoading(true)
      setError(null)
      calculateProfitEstimate(buildProfitRequest(values, selectedProvider))
        .then((payload) => setCalculation(payload))
        .catch((reason) => {
          setCalculation(null)
          setError(reason instanceof Error ? reason.message : '预估利润计算失败')
        })
        .finally(() => setLoading(false))
    }, 450)

    return () => window.clearTimeout(timer)
  }, [canCalculate, currentSiteCode, form, open, selectedProvider, watchedValues])

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
      const provider = logisticsOptions.find((item) => item.value === values.logisticsProviderKey)
      const category = categoryOptions.find((item) => item.value === values.categoryKey)
      if (!provider || !category) {
        setSaveFeedback({ type: 'warning', message: '请先选择系统类目和货代。' })
        return
      }
      setSaving(true)
      await saveManualSelectionGroupProcurement(groupId, {
        purchaseUrl: values.ali1688Url,
        purchasePrice: values.purchasePrice
      })
      const snapshot = await saveManualSelectionGroupProfitEstimate(groupId, {
        currencyCode: 'RMB',
        profitAmount: bestScenario?.profitRmb,
        profitMargin: bestScenario?.marginRatePct,
        snapshot: {
          formValues: values,
          selectedCategory: category,
          selectedProvider: provider,
          calculation,
          bestScenario,
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
        <Button key="save" type="primary" loading={saving} onClick={() => void handleSave()}>
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
            <Col span={5}>
              <Form.Item label="商品类目" name="categoryKey" rules={[{ required: true, message: '请选择商品类目' }]}>
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
            <Col span={6}>
              <Form.Item label="货代" name="logisticsProviderKey" rules={[{ required: true, message: '请选择货代' }]}>
                <Select
                  loading={logisticsLoading}
                  optionFilterProp="label"
                  options={logisticsOptions.map(({ label, value }) => ({ label, value }))}
                  placeholder={logisticsLoading ? '读取系统货代' : '选择系统货代'}
                  showSearch
                  notFoundContent={logisticsLoading ? <Spin size="small" /> : '暂无系统货代报价'}
                />
              </Form.Item>
            </Col>
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
          <Tag color={selectedCategory ? 'blue' : undefined}>
            系统类目 {selectedCategory ? systemCategoryDisplayLabel(selectedCategory) : '未匹配'}
          </Tag>
          {selectedProvider ? (
            <>
              <Tag>{selectedProvider.forwarderName}</Tag>
              <Tag>{transportModeLabel(selectedProvider.transportMode)}</Tag>
              <Tag>主运费 ¥{formatMoney(selectedProvider.unitPrice)}/{billingUnitLabel(selectedProvider.billingUnit)}</Tag>
              {selectedProvider.quoteVersionNo ? <Tag>报价 {selectedProvider.quoteVersionNo}</Tag> : null}
            </>
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
        {!canCalculate ? <Alert showIcon type="warning" message="请补齐售价、采购价、尺寸、毛重、类目和物流商" /> : null}

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
      </Space>
    </Modal>
  )
}
