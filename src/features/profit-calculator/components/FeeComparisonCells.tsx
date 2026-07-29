import { Alert, Button, Card, Descriptions, Empty, Space, Tag, Tooltip, Typography } from 'antd'
import { formatMoney, type ActualCommissionSnapshot, type ActualOutboundFeeSnapshot, type OfficialCommissionCalculationResult, type OfficialOutboundFeeCalculationResult } from '../domain'
import { outboundFeeSpecSourceLabel, taxIncludedCommission, taxIncludedOutboundFee } from '../profitPageDomain'

const { Text } = Typography

export function OutboundFeeCell(props: {
  value?: OfficialOutboundFeeCalculationResult;
  noon?: OfficialOutboundFeeCalculationResult;
  actual?: ActualOutboundFeeSnapshot;
  actualLoading: boolean;
  noonLoading: boolean;
  onOpenDetail?: () => void;
}) {
  const { value, noon, actual, actualLoading, noonLoading, onOpenDetail } = props;
  const effectiveFee = taxIncludedOutboundFee(value);
  const noonFee = taxIncludedOutboundFee(noon);
  const actualFee = typeof actual?.latestFeeAmount === 'number'
    ? actual.latestFeeAmount
    : typeof actual?.averageFeeAmount === 'number'
      ? actual.averageFeeAmount
      : undefined;
  const currency = value?.currency || noon?.currency || actual?.currency || '';
  const diffBaseFee = noonFee ?? effectiveFee;
  const diff = diffBaseFee !== undefined && actualFee !== undefined ? Math.abs(diffBaseFee - actualFee) : undefined;
  const diffColor = diff === undefined ? '#64748b' : diff <= 0.05 ? '#15803d' : diff <= 1 ? '#d97706' : '#b91c1c';

  return (
    <div
      role={onOpenDetail ? 'button' : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
      onClick={onOpenDetail}
      onKeyDown={(event) => {
        if (!onOpenDetail) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail();
        }
      }}
      style={{
        display: 'grid',
        gap: 2,
        width: 140,
        padding: '6px 7px',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        cursor: onOpenDetail ? 'pointer' : undefined
      }}
    >
      <OutboundFeeCompareLine label="1688" value={effectiveFee} currency={currency} loading={false} failure={value?.failureCode} color="#15803d" />
      <OutboundFeeCompareLine label="noon" value={noonFee} currency={currency} loading={noonLoading && !noon} failure={noon?.failureCode} color="#0f766e" />
      <OutboundFeeCompareLine label="最近实际" value={actualFee} currency={currency} loading={actualLoading && !actual} color="#2563eb" />
      <div style={{ height: 1, background: '#e5e7eb', margin: '2px 0' }} />
      <OutboundFeeCompareLine label="差异" value={diff} currency={currency} emphasized color={diffColor} />
    </div>
  );
}

export function OutboundFeeCompareLine(props: {
  label: string;
  value?: number;
  currency?: string | null;
  loading?: boolean;
  failure?: string | null;
  emphasized?: boolean;
  color?: string;
}) {
  const { label, value, currency, loading, failure, emphasized, color } = props;
  const content = loading ? '加载中' : value === undefined ? feeFailureDisplay(failure) : `${formatMoney(value)} ${currency || ''}`;
  return (
    <Tooltip title={failure || undefined}>
      <div style={{ lineHeight: '18px', whiteSpace: 'nowrap' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {label}:{' '}
        </Text>
        <Text
          strong
          type={failure && value === undefined ? 'warning' : undefined}
          style={{
            fontSize: emphasized ? 12 : 11,
            color,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {content}
        </Text>
      </div>
    </Tooltip>
  );
}

export function feeFailureDisplay(failure?: string | null) {
  if (!failure) {
    return '-';
  }
  if (failure === 'RULE_NOT_MATCHED' || failure === 'RULE_NOT_FOUND') {
    return '未命中';
  }
  if (failure === 'MISSING_CATEGORY') {
    return '缺类目';
  }
  if (failure === 'MISSING_SALE_PRICE') {
    return '缺售价';
  }
  if (failure === 'PRODUCT_NOT_FOUND') {
    return '无商品';
  }
  return '失败';
}

export function CommissionCell(props: {
  value?: OfficialCommissionCalculationResult;
  actual?: ActualCommissionSnapshot;
  actualLoading: boolean;
  onOpenDetail?: () => void;
}) {
  const { value, actual, actualLoading, onOpenDetail } = props;
  const ali1688Commission = taxIncludedCommission(value);
  const noonCommission = ali1688Commission;
  const actualCommission = typeof actual?.latestCommissionAmount === 'number'
    ? actual.latestCommissionAmount
    : typeof actual?.averageCommissionAmount === 'number'
      ? actual.averageCommissionAmount
      : undefined;
  const currency = value?.currency || actual?.currency || '';
  const diff = ali1688Commission !== undefined && actualCommission !== undefined ? Math.abs(ali1688Commission - actualCommission) : undefined;
  const diffColor = diff === undefined ? '#64748b' : diff <= 0.05 ? '#15803d' : diff <= 1 ? '#d97706' : '#b91c1c';

  return (
    <div
      role={onOpenDetail ? 'button' : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
      onClick={onOpenDetail}
      onKeyDown={(event) => {
        if (!onOpenDetail) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail();
        }
      }}
      style={{
        display: 'grid',
        gap: 2,
        width: 140,
        padding: '6px 7px',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        cursor: onOpenDetail ? 'pointer' : undefined
      }}
    >
      <OutboundFeeCompareLine label="1688" value={ali1688Commission} currency={currency} failure={value?.failureCode} color="#15803d" />
      <OutboundFeeCompareLine label="noon" value={noonCommission} currency={currency} failure={value?.failureCode} color="#0f766e" />
      <OutboundFeeCompareLine label="最近实际" value={actualCommission} currency={currency} loading={actualLoading && !actual} color="#2563eb" />
      <div style={{ height: 1, background: '#e5e7eb', margin: '2px 0' }} />
      <OutboundFeeCompareLine label="差异" value={diff} currency={currency} emphasized color={diffColor} />
    </div>
  );
}


export function CalculationSummaryCard(props: {
  title: string;
  value?: OfficialOutboundFeeCalculationResult;
  loading?: boolean;
  error?: string;
  emptyText: string;
  calculateLoading?: boolean;
  calculateDisabled?: boolean;
  calculateDisabledReason?: string;
  onCalculate?: () => void | Promise<unknown>;
}) {
  const { title, value, loading, error, emptyText, calculateLoading, calculateDisabled, calculateDisabledReason, onCalculate } = props;
  return (
    <Card
      size="small"
      title={title}
      loading={loading}
      extra={
        onCalculate ? (
          <Tooltip title={calculateDisabled ? calculateDisabledReason : undefined}>
            <Button size="small" type="primary" loading={calculateLoading} disabled={calculateDisabled} onClick={() => void onCalculate()}>
              计算出舱费
            </Button>
          </Tooltip>
        ) : null
      }
    >
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {!loading && !error && !value ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /> : null}
      {!loading && !error && value ? (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={value.status === 'CALCULATED' ? 'success' : 'warning'}>{value.status || '-'}</Tag>
            {value.failureCode ? <Tag color="warning">{value.failureCode}</Tag> : null}
            <Text type="secondary">{outboundFeeSpecSourceLabel(value.specSourceType)}</Text>
          </Space>
          <Descriptions
            size="small"
            column={2}
            bordered
            items={[
              {
                key: 'fee',
                label: '未税出舱费',
                children: value.status === 'CALCULATED' ? `${formatMoney(value.feeAmount)} ${value.currency || ''}` : '-'
              },
              {
                key: 'taxFee',
                label: '含税出舱费',
                children: taxIncludedOutboundFee(value) !== undefined ? `${formatMoney(taxIncludedOutboundFee(value))} ${value.currency || ''}` : '-'
              },
              {
                key: 'classification',
                label: '命中分级',
                children: value.matchedClassificationName || '-'
              },
              {
                key: 'dimensionsWeight',
                label: '尺寸 / 重量',
                children: `${formatMoney(value.lengthCm)} x ${formatMoney(value.widthCm)} x ${formatMoney(value.heightCm)} cm / ${formatMoney(value.weightGrams)} g`
              }
            ]}
          />
          {value.message ? <Text type="secondary">{value.message}</Text> : null}
        </Space>
      ) : null}
    </Card>
  );
}
