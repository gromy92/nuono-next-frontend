import { Alert, Button, Card, Descriptions, Divider, Empty, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState, type Key } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import type { AuthSessionStore } from '../auth/session';
import type { ProductListRowPayload } from '../product-management/types';
import { ProductBaselineListCell } from '../product-management/components/ProductBaselineDisplay';
import type { OrderFinanceOrderGroup, OrderFinanceTransactionLine } from '../order-finance/types';
import {
  buildNoonProductUrl,
  buildProductSummarySurfaceFromListItem,
  mergeGalleryImageUrls
} from '../product-management/utils';
import {
  formatMoney,
  type ActualCommissionSnapshot,
  type ActualOutboundFeeSnapshot,
  type OfficialCommissionCalculationResult,
  type OfficialOutboundFeeCalculationResult
} from './domain';
import { calculateOfficialOutboundFeeByNoonOfficialSpec, fetchActualOutboundFeeOrderGroups } from './api';
import type {
  ProfitActualCommissionMap,
  ProfitActualOutboundFeeMap,
  ProfitCommissionMap,
  ProfitListFilters,
  ProfitOutboundFeeMap,
  ProfitProductListState
} from './useProfitCalculatorWorkspace';
import { profitRowKey } from './useProfitCalculatorWorkspace';

const { Text } = Typography;

type ProfitCalculatorPageProps = {
  ownerUserId?: number;
  defaultStoreCode?: string;
  defaultSite: string;
  currentStore: AuthSessionStore | null;
  listState: ProfitProductListState;
  filteredRows: ProductListRowPayload[];
  filters: ProfitListFilters;
  selectedRowKeys: Key[];
  outboundFeeByRowKey: ProfitOutboundFeeMap;
  noonOutboundFeeByRowKey: ProfitOutboundFeeMap;
  actualOutboundFeeByRowKey: ProfitActualOutboundFeeMap;
  commissionByRowKey: ProfitCommissionMap;
  actualCommissionByRowKey: ProfitActualCommissionMap;
  actualOutboundFeeLoading: boolean;
  actualCommissionLoading: boolean;
  noonOutboundFeeLoading: boolean;
  calculatingRowKey: string | null;
  calculatingCommissionRowKey: string | null;
  bulkCalculating: boolean;
  bulkCommissionCalculating: boolean;
  onFiltersChange: (filters: ProfitListFilters) => void;
  onSelectedRowKeysChange: (keys: Key[]) => void;
  onRefresh: () => void | Promise<void>;
  onCalculateOutboundFee: (record: ProductListRowPayload) => void | Promise<unknown>;
  onCalculateSelectedOutboundFees: () => void | Promise<void>;
  onCalculateCommission: (record: ProductListRowPayload) => void | Promise<unknown>;
  onCalculateSelectedCommissions: () => void | Promise<void>;
};

function displayText(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

function displayPrice(record: ProductListRowPayload) {
  return record.salePrice || record.referencePrice || record.originalPrice || '-';
}

function parseAmount(value?: string) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rowSalePrice(record: ProductListRowPayload) {
  return parseAmount(record.salePrice) ?? parseAmount(record.referencePrice) ?? parseAmount(record.originalPrice);
}

function rowSkuId(record: ProductListRowPayload) {
  return record.partnerSku || '';
}

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase();
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) {
    return 'SA';
  }
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) {
    return 'AE';
  }
  return undefined;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultHistoryDateRange() {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setFullYear(dateFrom.getFullYear() - 1);
  return {
    dateFrom: isoDate(dateFrom),
    dateTo: isoDate(dateTo)
  };
}

function OutboundFeeCell(props: {
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

function OutboundFeeCompareLine(props: {
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

function feeFailureDisplay(failure?: string | null) {
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

function CommissionCell(props: {
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

function outboundFeeSpecSourceLabel(sourceType?: string) {
  if (sourceType === 'warehouse') {
    return '仓管尺寸';
  }
  if (sourceType === 'ali1688') {
    return '1688尺寸';
  }
  if (sourceType === 'manual') {
    return '手工尺寸';
  }
  if (sourceType === 'noon_official') {
    return 'Noon官方尺寸';
  }
  return '经营生效尺寸';
}

function taxIncludedOutboundFee(value?: OfficialOutboundFeeCalculationResult) {
  if (value?.status === 'CALCULATED' && typeof value.taxIncludedFeeAmount === 'number' && Number.isFinite(value.taxIncludedFeeAmount)) {
    return value.taxIncludedFeeAmount;
  }
  return undefined;
}

function taxIncludedCommission(value?: OfficialCommissionCalculationResult) {
  if (
    value?.status === 'CALCULATED'
    && typeof value.taxIncludedCommissionAmount === 'number'
    && Number.isFinite(value.taxIncludedCommissionAmount)
  ) {
    return value.taxIncludedCommissionAmount;
  }
  return undefined;
}

type OutboundFeeDetailState = {
  rowKey: string;
  record: ProductListRowPayload;
  storeCode: string;
  site: string;
  skuId: string;
  dateFrom: string;
  dateTo: string;
  noonOfficialLoading: boolean;
  noonOfficialResult?: OfficialOutboundFeeCalculationResult;
  noonOfficialError?: string;
  historyLoading: boolean;
  historyGroups: OrderFinanceOrderGroup[];
  historyError?: string;
};

type CommissionDetailState = {
  rowKey: string;
  record: ProductListRowPayload;
  storeCode: string;
  site: string;
  skuId: string;
  dateFrom: string;
  dateTo: string;
  historyLoading: boolean;
  historyGroups: OrderFinanceOrderGroup[];
  historyError?: string;
};

function CalculationSummaryCard(props: {
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

type ActualOutboundFeeHistoryLine = OrderFinanceTransactionLine & {
  rowKey: string;
  groupOrderNr: string;
};

type ActualOutboundFeeHistoryPeriod = {
  startDate: string;
  endDate: string;
  amount: number;
  recordCount: number;
  dateCount: number;
  currency?: string;
};

function flattenHistoryLines(groups: OrderFinanceOrderGroup[]) {
  return groups.flatMap((group, groupIndex) =>
    (group.lines || []).map((line, lineIndex) => ({
      ...line,
      rowKey: `${group.orderNr || groupIndex}-${line.referenceNr || ''}-${line.itemNr || ''}-${line.transactionDate || line.orderDate || ''}-${lineIndex}`,
      groupOrderNr: group.orderNr
    }))
  );
}

function buildHistoryFeePeriods(lines: ActualOutboundFeeHistoryLine[]) {
  const dateFeeMap = new Map<string, Map<string, { amount: number; count: number; currency?: string }>>();

  lines.forEach((line) => {
    const date = line.transactionDate || line.orderDate;
    if (!date) {
      return;
    }
    const amount = Math.round(Math.abs(line.fulfillmentLogisticsFee || 0) * 100) / 100;
    const amountKey = amount.toFixed(2);
    const feeMap = dateFeeMap.get(date) || new Map<string, { amount: number; count: number; currency?: string }>();
    const current = feeMap.get(amountKey) || {
      amount,
      count: 0,
      currency: line.currency
    };
    current.count += 1;
    current.currency = current.currency || line.currency;
    feeMap.set(amountKey, current);
    dateFeeMap.set(date, feeMap);
  });

  const dailyFees = Array.from(dateFeeMap.entries())
    .map(([date, feeMap]) => {
      const dominantFee = Array.from(feeMap.values()).sort((left, right) => right.count - left.count || right.amount - left.amount)[0];
      return {
        date,
        amount: dominantFee.amount,
        recordCount: dominantFee.count,
        currency: dominantFee.currency
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return dailyFees.reduce<ActualOutboundFeeHistoryPeriod[]>((periods, dailyFee) => {
    const previous = periods[periods.length - 1];
    if (previous && Math.abs(previous.amount - dailyFee.amount) < 0.01 && previous.currency === dailyFee.currency) {
      previous.endDate = dailyFee.date;
      previous.recordCount += dailyFee.recordCount;
      previous.dateCount += 1;
      return periods;
    }
    periods.push({
      startDate: dailyFee.date,
      endDate: dailyFee.date,
      amount: dailyFee.amount,
      recordCount: dailyFee.recordCount,
      dateCount: 1,
      currency: dailyFee.currency
    });
    return periods;
  }, []);
}

function buildHistoryCommissionPeriods(lines: ActualOutboundFeeHistoryLine[]) {
  const dateCommissionMap = new Map<string, Map<string, { amount: number; count: number; currency?: string }>>();

  lines.forEach((line) => {
    const date = line.transactionDate || line.orderDate;
    if (!date) {
      return;
    }
    const amount = Math.round(Math.abs(line.referralFee || 0) * 100) / 100;
    if (amount === 0) {
      return;
    }
    const amountKey = amount.toFixed(2);
    const commissionMap = dateCommissionMap.get(date) || new Map<string, { amount: number; count: number; currency?: string }>();
    const current = commissionMap.get(amountKey) || {
      amount,
      count: 0,
      currency: line.currency
    };
    current.count += 1;
    current.currency = current.currency || line.currency;
    commissionMap.set(amountKey, current);
    dateCommissionMap.set(date, commissionMap);
  });

  const dailyCommissions = Array.from(dateCommissionMap.entries())
    .map(([date, commissionMap]) => {
      const dominantCommission = Array.from(commissionMap.values()).sort(
        (left, right) => right.count - left.count || right.amount - left.amount
      )[0];
      return {
        date,
        amount: dominantCommission.amount,
        recordCount: dominantCommission.count,
        currency: dominantCommission.currency
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return dailyCommissions.reduce<ActualOutboundFeeHistoryPeriod[]>((periods, dailyCommission) => {
    const previous = periods[periods.length - 1];
    if (previous && Math.abs(previous.amount - dailyCommission.amount) < 0.01 && previous.currency === dailyCommission.currency) {
      previous.endDate = dailyCommission.date;
      previous.recordCount += dailyCommission.recordCount;
      previous.dateCount += 1;
      return periods;
    }
    periods.push({
      startDate: dailyCommission.date,
      endDate: dailyCommission.date,
      amount: dailyCommission.amount,
      recordCount: dailyCommission.recordCount,
      dateCount: 1,
      currency: dailyCommission.currency
    });
    return periods;
  }, []);
}

function historyPeriodLabel(period: ActualOutboundFeeHistoryPeriod) {
  return period.startDate === period.endDate ? period.startDate : `${period.startDate} ~ ${period.endDate}`;
}

function ActualOutboundFeeHistoryChart(props: {
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

function CommissionSummaryCard(props: {
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

function OutboundFeeDetailModal(props: {
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

function CommissionDetailModal(props: {
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

function ProductIdentityCell(props: { record: ProductListRowPayload }) {
  const { record } = props;
  const summary = buildProductSummarySurfaceFromListItem(record);
  const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const noonProductUrl = buildNoonProductUrl(summary);

  return (
    <ProductBaselineListCell
      summary={summary}
      imageUrl={galleryImages[0]}
      imageCount={galleryImages.length}
      imageAlt={record.title || record.skuParent}
      titleHref={noonProductUrl}
      actions={
        record.variantCount && record.variantCount > 1 ? (
          <Tag color="warning" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
            多变体 {record.variantCount}
          </Tag>
        ) : null
      }
    />
  );
}

function ProfitPlaceholderCell() {
  return <Text type="secondary">-</Text>;
}

export function ProfitCalculatorPage(props: ProfitCalculatorPageProps) {
  const {
    ownerUserId,
    defaultStoreCode,
    defaultSite,
    listState,
    filteredRows,
    filters,
    selectedRowKeys,
    outboundFeeByRowKey,
    noonOutboundFeeByRowKey,
    actualOutboundFeeByRowKey,
    commissionByRowKey,
    actualCommissionByRowKey,
    actualOutboundFeeLoading,
    actualCommissionLoading,
    noonOutboundFeeLoading,
    calculatingRowKey,
    calculatingCommissionRowKey,
    bulkCalculating,
    bulkCommissionCalculating,
    onFiltersChange,
    onSelectedRowKeysChange,
    onRefresh,
    onCalculateOutboundFee,
    onCalculateSelectedOutboundFees,
    onCalculateCommission,
    onCalculateSelectedCommissions
  } = props;

  const [detailState, setDetailState] = useState<OutboundFeeDetailState | null>(null);
  const [commissionDetailState, setCommissionDetailState] = useState<CommissionDetailState | null>(null);
  const calculatedCount = Object.values(outboundFeeByRowKey).filter((item) => item.status === 'CALCULATED').length;
  const failedCount = Object.values(outboundFeeByRowKey).filter((item) => item.status === 'FAILED').length;
  const commissionCalculatedCount = Object.values(commissionByRowKey).filter((item) => item.status === 'CALCULATED').length;
  const commissionFailedCount = Object.values(commissionByRowKey).filter((item) => item.status === 'FAILED').length;
  const openOutboundFeeDetail = (record: ProductListRowPayload) => {
    const rowKey = profitRowKey(record);
    const storeCode = record.referenceStoreCode || defaultStoreCode || '';
    const site = siteCodeFromStoreCode(storeCode) || defaultSite;
    const skuId = rowSkuId(record);
    const { dateFrom, dateTo } = defaultHistoryDateRange();
    setDetailState({
      rowKey,
      record,
      storeCode,
      site,
      skuId,
      dateFrom,
      dateTo,
      noonOfficialLoading: Boolean(ownerUserId && storeCode && skuId),
      noonOfficialResult: undefined,
      noonOfficialError: !ownerUserId || !storeCode || !skuId ? '缺少老板账号、店铺或 SKU，无法计算 Noon 官方尺寸出舱费。' : undefined,
      historyLoading: Boolean(storeCode && skuId),
      historyGroups: [],
      historyError: !storeCode || !skuId ? '缺少店铺或 SKU，无法读取历史出舱费记录。' : undefined
    });

    if (ownerUserId && storeCode && skuId) {
      void calculateOfficialOutboundFeeByNoonOfficialSpec({
        ownerUserId,
        storeCode,
        site,
        skuId,
        salePrice: rowSalePrice(record)
      })
        .then((result) => {
          setDetailState((currentValue) =>
            currentValue?.rowKey === rowKey
              ? { ...currentValue, noonOfficialLoading: false, noonOfficialResult: result, noonOfficialError: undefined }
              : currentValue
          );
        })
        .catch((error) => {
          setDetailState((currentValue) =>
            currentValue?.rowKey === rowKey
              ? {
                  ...currentValue,
                  noonOfficialLoading: false,
                  noonOfficialError: error instanceof Error ? error.message : 'Noon 官方尺寸出舱费计算失败。'
                }
              : currentValue
          );
        });
    }

    if (storeCode && skuId) {
      void fetchActualOutboundFeeOrderGroups({
        storeCode,
        siteCode: site,
        partnerSku: skuId,
        dateFrom,
        dateTo
      })
        .then((groups) => {
          setDetailState((currentValue) =>
            currentValue?.rowKey === rowKey
              ? { ...currentValue, historyLoading: false, historyGroups: groups, historyError: undefined }
              : currentValue
          );
        })
        .catch((error) => {
          setDetailState((currentValue) =>
            currentValue?.rowKey === rowKey
              ? {
                  ...currentValue,
                  historyLoading: false,
                  historyError: error instanceof Error ? error.message : '历史出舱费记录加载失败。'
                }
              : currentValue
          );
        });
    }
  };
  const openCommissionDetail = (record: ProductListRowPayload) => {
    const rowKey = profitRowKey(record);
    const storeCode = record.referenceStoreCode || defaultStoreCode || '';
    const site = siteCodeFromStoreCode(storeCode) || defaultSite;
    const skuId = rowSkuId(record);
    const { dateFrom, dateTo } = defaultHistoryDateRange();
    setCommissionDetailState({
      rowKey,
      record,
      storeCode,
      site,
      skuId,
      dateFrom,
      dateTo,
      historyLoading: Boolean(storeCode && skuId),
      historyGroups: [],
      historyError: !storeCode || !skuId ? '缺少店铺或 SKU，无法读取历史佣金记录。' : undefined
    });

    if (storeCode && skuId) {
      void fetchActualOutboundFeeOrderGroups({
        storeCode,
        siteCode: site,
        partnerSku: skuId,
        dateFrom,
        dateTo
      })
        .then((groups) => {
          setCommissionDetailState((currentValue) =>
            currentValue?.rowKey === rowKey
              ? { ...currentValue, historyLoading: false, historyGroups: groups, historyError: undefined }
              : currentValue
          );
        })
        .catch((error) => {
          setCommissionDetailState((currentValue) =>
            currentValue?.rowKey === rowKey
              ? {
                  ...currentValue,
                  historyLoading: false,
                  historyError: error instanceof Error ? error.message : '历史佣金记录加载失败。'
                }
              : currentValue
          );
        });
    }
  };
  const columns: ColumnsType<ProductListRowPayload> = [
    {
      title: '商品信息',
      key: 'identity',
      width: 520,
      render: (_, record) => <ProductIdentityCell record={record} />
    },
    {
      title: '类目/品牌',
      key: 'categoryBrand',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{displayText(record.productFulltype)}</Text>
          <Text type="secondary">品牌：{displayText(record.brand)}</Text>
        </Space>
      )
    },
    {
      title: '价格',
      key: 'salePrice',
      width: 120,
      render: (_, record) => (
        <Text strong>
          {displayPrice(record)} {record.currency || ''}
        </Text>
      )
    },
    {
      title: '系统佣金',
      key: 'officialCommission',
      width: 170,
      render: (_, record) => (
        <CommissionCell
          value={commissionByRowKey[profitRowKey(record)]}
          actual={actualCommissionByRowKey[profitRowKey(record)]}
          actualLoading={actualCommissionLoading}
          onOpenDetail={() => openCommissionDetail(record)}
        />
      )
    },
    {
      title: '系统出舱费',
      key: 'officialOutboundFee',
      width: 170,
      render: (_, record) => (
        <OutboundFeeCell
          value={outboundFeeByRowKey[profitRowKey(record)]}
          noon={noonOutboundFeeByRowKey[profitRowKey(record)]}
          actual={actualOutboundFeeByRowKey[profitRowKey(record)]}
          actualLoading={actualOutboundFeeLoading}
          noonLoading={noonOutboundFeeLoading}
          onOpenDetail={() => openOutboundFeeDetail(record)}
        />
      )
    },
    {
      title: 'FBN空运利润',
      key: 'fbnAirProfit',
      width: 150,
      render: () => <ProfitPlaceholderCell />
    },
    {
      title: 'FBP空运利润',
      key: 'fbpAirProfit',
      width: 150,
      render: () => <ProfitPlaceholderCell />
    },
    {
      title: '海运利润',
      key: 'oceanProfit',
      width: 150,
      render: () => <ProfitPlaceholderCell />
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => <Tag>{record.liveStatus || record.statusCode || '-'}</Tag>
    }
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Input
              allowClear
              placeholder="搜索 SKU / PSKU / barcode"
              style={{ width: 240 }}
              value={filters.skuQuery}
              onChange={(event) => onFiltersChange({ ...filters, skuQuery: event.target.value })}
            />
            <Input
              allowClear
              placeholder="搜索标题"
              style={{ width: 220 }}
              value={filters.titleQuery}
              onChange={(event) => onFiltersChange({ ...filters, titleQuery: event.target.value })}
            />
            <Select
              style={{ width: 160 }}
              value={filters.outboundFeeFilter}
              options={[
                { label: '已计算', value: 'calculated' },
                { label: '计算失败', value: 'failed' },
                { label: '待计算', value: 'pending' }
              ]}
              onChange={(value) => onFiltersChange({ ...filters, outboundFeeFilter: value })}
            />
            <Select
              style={{ width: 150 }}
              value={filters.differenceFilter}
              options={[
                { label: '全部差异', value: 'all' },
                { label: '任一有差异', value: 'any' },
                { label: '出舱费有差异', value: 'outboundFee' },
                { label: '佣金有差异', value: 'commission' }
              ]}
              onChange={(value) => onFiltersChange({ ...filters, differenceFilter: value })}
            />
            <Button icon={<ReloadOutlined />} loading={listState.status === 'loading'} onClick={() => void onRefresh()}>
              刷新列表
            </Button>
            <Button type="primary" loading={bulkCalculating} onClick={() => void onCalculateSelectedOutboundFees()}>
              批量计算出舱费{selectedRowKeys.length ? `(${selectedRowKeys.length})` : ''}
            </Button>
            <Button loading={bulkCommissionCalculating} onClick={() => void onCalculateSelectedCommissions()}>
              批量计算佣金{selectedRowKeys.length ? `(${selectedRowKeys.length})` : ''}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              出舱费已计算 {calculatedCount}，失败 {failedCount}；佣金已计算 {commissionCalculatedCount}，失败 {commissionFailedCount}；当前 {filteredRows.length} 行
            </Text>
          </Space>
        </Space>
      </Card>

      {listState.status === 'error' ? <Alert type="error" showIcon message="利润商品列表加载失败" description={listState.message} /> : null}

      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        {listState.status === 'idle' ? (
          <Empty description="当前账号没有可用店铺上下文" />
        ) : (
          <Table
            rowKey={(record) => profitRowKey(record)}
            loading={listState.status === 'loading'}
            columns={columns}
            dataSource={filteredRows}
            rowSelection={{
              selectedRowKeys,
              onChange: onSelectedRowKeysChange
            }}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: 1870 }}
            size="small"
          />
        )}
      </Card>

      <OutboundFeeDetailModal
        detail={detailState}
        currentCalculation={detailState ? outboundFeeByRowKey[detailState.rowKey] : undefined}
        actualSnapshot={detailState ? actualOutboundFeeByRowKey[detailState.rowKey] : undefined}
        calculating={detailState ? calculatingRowKey === detailState.rowKey : false}
        onCalculate={onCalculateOutboundFee}
        onClose={() => setDetailState(null)}
      />
      <CommissionDetailModal
        detail={commissionDetailState}
        currentCalculation={commissionDetailState ? commissionByRowKey[commissionDetailState.rowKey] : undefined}
        actualSnapshot={commissionDetailState ? actualCommissionByRowKey[commissionDetailState.rowKey] : undefined}
        calculating={commissionDetailState ? calculatingCommissionRowKey === commissionDetailState.rowKey : false}
        onCalculate={onCalculateCommission}
        onClose={() => setCommissionDetailState(null)}
      />
    </Space>
  );
}
