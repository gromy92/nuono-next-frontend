import { Alert, Space, Spin, Table, Tag } from 'antd'
import { formatMoney, type ProfitCalculationPayload } from '../../profit-calculator/domain'
import type { LogisticsProviderOption, LogisticsQuoteOption } from '../profitEstimateLogisticsOptions'
import { profitQuoteOptionLabel } from './ManualSelectionProfitLogisticsFields'
import { DEFAULT_CATEGORY_COMMISSION_RATE, type SaveFeedback } from './manualSelectionProfitEstimateModel'
import { scenarioColumns } from './manualSelectionProfitScenarioColumns'

type Scenario = ProfitCalculationPayload['scenarios'][number]
type Props = {
  vatRate: number
  computedDomesticShippingFee: number
  selectedAirProvider?: LogisticsProviderOption
  selectedAirQuote?: LogisticsQuoteOption
  selectedSeaProvider?: LogisticsProviderOption
  selectedSeaQuote?: LogisticsQuoteOption
  bestScenario?: Scenario
  savedAt: string | null
  logisticsError: string | null
  categoryError: string | null
  saveFeedback: SaveFeedback | null
  error: string | null
  canCalculate: boolean
  loading: boolean
  visibleScenarios: Scenario[]
}

export function ManualSelectionProfitEstimateResults(props: Props) {
  const {
    vatRate, computedDomesticShippingFee, selectedAirProvider, selectedAirQuote,
    selectedSeaProvider, selectedSeaQuote, bestScenario, savedAt, logisticsError,
    categoryError, saveFeedback, error, canCalculate, loading, visibleScenarios
  } = props
  return (
    <>
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
    </>
  )
}
