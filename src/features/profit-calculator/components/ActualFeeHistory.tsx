import { Button, Card, Descriptions, Empty, Space, Tag, Tooltip, Typography } from 'antd'
import { formatMoney, type OfficialCommissionCalculationResult } from '../domain'
import { historyPeriodLabel, taxIncludedCommission, type ActualOutboundFeeHistoryPeriod } from '../profitPageDomain'

const { Text } = Typography

export function ActualOutboundFeeHistoryChart(props: {
  periods: ActualOutboundFeeHistoryPeriod[];
  currency?: string;
  emptyDescription?: string;
  barColor?: string;
  shadowColor?: string;
}) {
  const { periods, currency, emptyDescription, barColor, shadowColor } = props;
  if (periods.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription || '当前 SKU 暂无历史出舱费记录'} />;
  }

  const maxAmount = Math.max(...periods.map((period) => period.amount), 1);
  const chartHeight = 220;
  const barWidth = 56;
  const gap = 14;
  const minWidth = Math.max(720, periods.length * (barWidth + gap));

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 6 }}>
      <div style={{ minWidth }}>
        <div
          style={{
            height: chartHeight,
            display: 'flex',
            alignItems: 'flex-end',
            gap,
            padding: '16px 12px 8px',
            borderLeft: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
          }}
        >
          {periods.map((period) => {
            const height = Math.max(6, Math.round((period.amount / maxAmount) * (chartHeight - 32)));
            return (
              <Tooltip
                key={`${period.startDate}-${period.endDate}-${period.amount}`}
                title={`${historyPeriodLabel(period)}：${formatMoney(period.amount)} ${period.currency || currency || ''}，${period.dateCount} 个交易日，${period.recordCount} 条`}
              >
                <div style={{ width: barWidth, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: barWidth,
                      height,
                      borderRadius: '6px 6px 0 0',
                      background: barColor || 'linear-gradient(180deg, #0f766e 0%, #14b8a6 100%)',
                      boxShadow: shadowColor || '0 6px 14px rgba(15, 118, 110, 0.18)'
                    }}
                  />
                </div>
              </Tooltip>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap, padding: '6px 12px 0' }}>
          {periods.map((period) => (
            <Text
              key={`${period.startDate}-${period.endDate}-${period.amount}`}
              type="secondary"
              style={{
                width: barWidth,
                display: 'block',
                fontSize: 11,
                lineHeight: '14px',
                textAlign: 'center'
              }}
            >
              {period.startDate === period.endDate ? period.startDate.slice(5) : `${period.startDate.slice(5)}~${period.endDate.slice(5)}`}
            </Text>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommissionSummaryCard(props: {
  value?: OfficialCommissionCalculationResult;
  loading?: boolean;
  onCalculate: () => void | Promise<unknown>;
}) {
  const { value, loading, onCalculate } = props;
  return (
    <Card
      size="small"
      title="当前系统佣金"
      extra={
        <Button size="small" type="primary" loading={loading} onClick={() => void onCalculate()}>
          计算佣金
        </Button>
      }
    >
      {!value ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前列表还没有系统佣金计算结果。" /> : null}
      {value ? (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={value.status === 'CALCULATED' ? 'success' : 'warning'}>{value.status || '-'}</Tag>
            {value.failureCode ? <Tag color="warning">{value.failureCode}</Tag> : null}
            {value.categoryName ? <Text type="secondary">{value.categoryName}</Text> : null}
          </Space>
          <Descriptions
            size="small"
            column={2}
            bordered
            items={[
              {
                key: 'commission',
                label: '未税佣金',
                children: value.status === 'CALCULATED' ? `${formatMoney(value.commissionAmount)} ${value.currency || ''}` : '-'
              },
              {
                key: 'taxCommission',
                label: '含税佣金',
                children: taxIncludedCommission(value) !== undefined ? `${formatMoney(taxIncludedCommission(value))} ${value.currency || ''}` : '-'
              },
              {
                key: 'rate',
                label: '佣金率',
                children: typeof value.commissionRate === 'number' ? `${formatMoney(value.commissionRate * 100)}%` : '-'
              },
              {
                key: 'salePrice',
                label: '计算售价',
                children: typeof value.salePrice === 'number' ? `${formatMoney(value.salePrice)} ${value.marketCurrency || value.currency || ''}` : '-'
              },
              {
                key: 'category',
                label: '命中类目',
                children: value.categoryPath || value.categoryName || '-'
              },
              {
                key: 'brand',
                label: '品牌限制',
                children: value.brandRestriction || '-'
              }
            ]}
          />
          {value.message ? <Text type="secondary">{value.message}</Text> : null}
        </Space>
      ) : null}
    </Card>
  );
}
