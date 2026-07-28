import { Alert, Card, Divider, Modal, Space, Tag, Typography } from 'antd'
import { formatMoney, type ActualCommissionSnapshot, type ActualOutboundFeeSnapshot, type OfficialCommissionCalculationResult, type OfficialOutboundFeeCalculationResult } from '../domain'
import { buildHistoryCommissionPeriods, buildHistoryFeePeriods, flattenHistoryLines } from '../profitPageDomain'
import type { CommissionDetailState, OutboundFeeDetailState } from '../profitPageTypes'
import type { ProductListRowPayload } from '../../product-domain/productListTypes'
import { ActualOutboundFeeHistoryChart, CommissionSummaryCard } from './ActualFeeHistory'
import { CalculationSummaryCard } from './FeeComparisonCells'

const { Text } = Typography

export function OutboundFeeDetailModal(props: {
  detail: OutboundFeeDetailState | null;
  currentCalculation?: OfficialOutboundFeeCalculationResult;
  actualSnapshot?: ActualOutboundFeeSnapshot;
  calculating: boolean;
  onCalculate: (record: ProductListRowPayload) => void | Promise<unknown>;
  onClose: () => void;
}) {
  const { detail, currentCalculation, actualSnapshot, calculating, onCalculate, onClose } = props;
  const historyLines = detail ? flattenHistoryLines(detail.historyGroups) : [];
  const historyPeriods = buildHistoryFeePeriods(historyLines);
  const historyCurrency = actualSnapshot?.currency || historyLines.find((line) => line.currency)?.currency || '';
  const latestHistoryPeriod = historyPeriods[historyPeriods.length - 1];

  return (
    <Modal
      title={null}
      open={Boolean(detail)}
      width={1120}
      footer={null}
      onCancel={onClose}
      destroyOnClose
    >
      {detail ? (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <CalculationSummaryCard
            title="当前系统出舱费"
            value={currentCalculation}
            emptyText="当前列表还没有系统出舱费计算结果。"
            calculateLoading={calculating}
            calculateDisabled={!detail.skuId}
            calculateDisabledReason="当前商品行缺少 partnerSku，不能按 SKU 计算出舱费。"
            onCalculate={() => onCalculate(detail.record)}
          />
          <CalculationSummaryCard
            title="按 Noon 官方尺寸计算"
            value={detail.noonOfficialResult}
            loading={detail.noonOfficialLoading}
            error={detail.noonOfficialError}
            emptyText="暂无 Noon 官方尺寸计算结果。"
          />
          <Card
            size="small"
            title="历史报表出舱费变化（含税）"
            extra={
              <Space wrap size={6}>
                <Tag>变化段 {historyPeriods.length}</Tag>
                {latestHistoryPeriod ? <Tag>最新 {formatMoney(latestHistoryPeriod.amount)} {latestHistoryPeriod.currency || historyCurrency}</Tag> : null}
              </Space>
            }
            loading={detail.historyLoading}
          >
            {actualSnapshot ? (
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color="processing">样本 {actualSnapshot.sampleCount}</Tag>
                <Tag>
                  最新 {formatMoney(actualSnapshot.latestFeeAmount)} {actualSnapshot.currency || ''}
                </Tag>
                <Tag>
                  均值 {formatMoney(actualSnapshot.averageFeeAmount)} {actualSnapshot.currency || ''}
                </Tag>
                <Tag>最新 {actualSnapshot.latestTransactionDate || '-'}</Tag>
              </Space>
            ) : null}
            {detail.historyError ? <Alert type="error" showIcon message={detail.historyError} style={{ marginBottom: 12 }} /> : null}
            {!detail.historyLoading ? <ActualOutboundFeeHistoryChart periods={historyPeriods} currency={historyCurrency} /> : null}
          </Card>
          <Divider style={{ margin: 0 }} />
          <Text type="secondary">
            说明：历史报表出舱费取 Noon 财务报表中的 fulfillment logistics fees including VAT，属于含税实际费用。
          </Text>
        </Space>
      ) : null}
    </Modal>
  );
}

export function CommissionDetailModal(props: {
  detail: CommissionDetailState | null;
  currentCalculation?: OfficialCommissionCalculationResult;
  actualSnapshot?: ActualCommissionSnapshot;
  calculating: boolean;
  onCalculate: (record: ProductListRowPayload) => void | Promise<unknown>;
  onClose: () => void;
}) {
  const { detail, currentCalculation, actualSnapshot, calculating, onCalculate, onClose } = props;
  const historyLines = detail ? flattenHistoryLines(detail.historyGroups) : [];
  const historyPeriods = buildHistoryCommissionPeriods(historyLines);
  const historyCurrency = actualSnapshot?.currency || historyLines.find((line) => line.currency)?.currency || '';
  const latestHistoryPeriod = historyPeriods[historyPeriods.length - 1];

  return (
    <Modal
      title={null}
      open={Boolean(detail)}
      width={1120}
      footer={null}
      onCancel={onClose}
      destroyOnClose
    >
      {detail ? (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <CommissionSummaryCard
            value={currentCalculation}
            loading={calculating}
            onCalculate={() => onCalculate(detail.record)}
          />
          <Card
            size="small"
            title="历史报表佣金变化（含税）"
            extra={
              <Space wrap size={6}>
                <Tag>变化段 {historyPeriods.length}</Tag>
                {latestHistoryPeriod ? <Tag>最新 {formatMoney(latestHistoryPeriod.amount)} {latestHistoryPeriod.currency || historyCurrency}</Tag> : null}
              </Space>
            }
            loading={detail.historyLoading}
          >
            {actualSnapshot ? (
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color="processing">样本 {actualSnapshot.sampleCount}</Tag>
                <Tag>
                  最新 {formatMoney(actualSnapshot.latestCommissionAmount)} {actualSnapshot.currency || ''}
                </Tag>
                <Tag>
                  均值 {formatMoney(actualSnapshot.averageCommissionAmount)} {actualSnapshot.currency || ''}
                </Tag>
                <Tag>最新 {actualSnapshot.latestTransactionDate || '-'}</Tag>
              </Space>
            ) : null}
            {detail.historyError ? <Alert type="error" showIcon message={detail.historyError} style={{ marginBottom: 12 }} /> : null}
            {!detail.historyLoading ? (
              <ActualOutboundFeeHistoryChart
                periods={historyPeriods}
                currency={historyCurrency}
                emptyDescription="当前 SKU 暂无历史佣金记录"
                barColor="linear-gradient(180deg, #7c2d12 0%, #f97316 100%)"
                shadowColor="0 6px 14px rgba(194, 65, 12, 0.18)"
              />
            ) : null}
          </Card>
          <Divider style={{ margin: 0 }} />
          <Text type="secondary">
            说明：历史报表佣金取 Noon 财务报表中的 referral fee including VAT，属于含税实际佣金。
          </Text>
        </Space>
      ) : null}
    </Modal>
  );
}

