import { Col, Form, Select, Spin } from 'antd'
import { formatMoney } from '../../profit-calculator/domain'
import {
  billingUnitLabel,
  type LogisticsProviderOption,
  type LogisticsQuoteOption
} from '../profitEstimateLogisticsOptions'
import type { LogisticsTransportMode } from '../profitEstimateLogisticsSelection'
import './ManualSelectionProfitLogisticsFields.css'

type ManualSelectionProfitLogisticsFieldsProps = {
  mode: LogisticsTransportMode
  providers: LogisticsProviderOption[]
  selectedProvider?: LogisticsProviderOption
  loading: boolean
  disabled: boolean
  onProviderChange: (providerValue: string) => void
  onQuoteChange: () => void
}

export function profitQuoteOptionLabel(quote: LogisticsQuoteOption) {
  return [
    quote.cargoCategoryName || quote.serviceName,
    `¥${formatMoney(quote.unitPrice)}/${billingUnitLabel(quote.billingUnit)}`
  ].join(' · ')
}

function quoteSelectOptions(quotes: LogisticsQuoteOption[]) {
  const baseLabels = quotes.map(profitQuoteOptionLabel)
  const labelCounts = new Map<string, number>()
  baseLabels.forEach((label) => labelCounts.set(label, (labelCounts.get(label) || 0) + 1))
  return quotes.map((quote, index) => {
    const baseLabel = baseLabels[index]
    const detail = [quote.serviceName, quote.quoteVersionNo].filter(Boolean).join(' · ')
    const categoryLabel = [
      quote.cargoCategoryName || quote.serviceName,
      labelCounts.get(baseLabel)! > 1 ? detail : ''
    ].filter(Boolean).join(' · ')
    const priceLabel = `¥${formatMoney(quote.unitPrice)}/${billingUnitLabel(quote.billingUnit)}`
    const displayLabel = [categoryLabel, priceLabel].join(' · ')
    return {
      label: (
        <span className="manual-selection-profit-logistics-quote-option" title={displayLabel}>
          <span className="manual-selection-profit-logistics-quote-option-name">{categoryLabel}</span>
          <span className="manual-selection-profit-logistics-quote-option-price">{priceLabel}</span>
        </span>
      ),
      displayLabel,
      value: quote.value,
      searchText: [
        quote.cargoCategoryCode,
        quote.cargoCategoryName,
        quote.serviceName,
        quote.quoteVersionNo
      ].filter(Boolean).join(' ')
    }
  })
}

export function ManualSelectionProfitLogisticsFields(
  props: ManualSelectionProfitLogisticsFieldsProps
) {
  const {
    mode,
    providers,
    selectedProvider,
    loading,
    disabled,
    onProviderChange,
    onQuoteChange
  } = props
  const isAir = mode === 'AIR'
  const modeLabel = isAir ? '空运' : '海运'
  const providerFieldName = isAir ? 'airProviderKey' : 'seaProviderKey'
  const quoteFieldName = isAir ? 'airQuoteKey' : 'seaQuoteKey'
  const quotes = selectedProvider
    ? (isAir ? selectedProvider.airQuotes : selectedProvider.seaQuotes)
    : []

  return (
    <>
      <Col span={5}>
        <Form.Item
          label={`${modeLabel}货代`}
          name={providerFieldName}
          rules={[{ required: true, message: `请选择${modeLabel}货代` }]}
        >
          <Select
            loading={loading}
            disabled={disabled || !providers.length}
            optionFilterProp="label"
            options={providers.map(({ value, forwarderName }) => ({
              label: forwarderName,
              value
            }))}
            onChange={onProviderChange}
            placeholder={loading ? '读取系统货代' : `选择${modeLabel}货代`}
            showSearch
            notFoundContent={loading ? <Spin size="small" /> : `暂无${modeLabel}货代报价`}
          />
        </Form.Item>
      </Col>
      <Col span={7}>
        <Form.Item
          label={`${modeLabel}报价类别`}
          name={quoteFieldName}
          rules={[{ required: true, message: `请选择${modeLabel}报价类别` }]}
        >
          <Select
            disabled={disabled || !selectedProvider}
            optionFilterProp="searchText"
            optionLabelProp="displayLabel"
            options={quoteSelectOptions(quotes)}
            onChange={onQuoteChange}
            placeholder={!selectedProvider ? `先选择${modeLabel}货代` : `选择${modeLabel}报价类别`}
            popupClassName="manual-selection-profit-logistics-quote-dropdown"
            popupMatchSelectWidth={560}
            showSearch
          />
        </Form.Item>
      </Col>
    </>
  )
}
