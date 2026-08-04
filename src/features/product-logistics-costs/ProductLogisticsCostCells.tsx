import { Space, Tag } from 'antd';
import type {
  CostFilters,
  ForwarderEligibilityStatus,
  ProductCostTableRow,
  ProductLogisticsCostRow
} from './productLogisticsCostModels';
import {
  formatPrice,
  formatShortDate,
  textValue,
  transportLabel
} from './productLogisticsCostRouteDomain';

export function QuotePriceCell({
  row,
  emptyText,
  dateValue,
  onClick
}: {
  row?: ProductLogisticsCostRow;
  emptyText: string;
  dateValue?: string | null;
  onClick?: () => void;
}) {
  const content = (
    <Space direction="vertical" size={0} className="product-logistics-costs-page__price-cell">
      {row ? (
        <span className="product-logistics-costs-page__price-line">
          <span className="product-logistics-costs-page__price">{formatPrice(row.unitCostCny)}</span>
          <span className="product-logistics-costs-page__unit">{row.chargeUnit || row.currencyCode || '-'}</span>
        </span>
      ) : (
        <span className="product-logistics-costs-page__muted">{emptyText}</span>
      )}
      <span className="product-logistics-costs-page__subtext">{formatShortDate(dateValue)}</span>
    </Space>
  );
  if (!onClick) return content;
  return (
    <button type="button" className="product-logistics-costs-page__price-button" onClick={onClick}>
      {content}
    </button>
  );
}

export function RouteCell({ row, filters }: { row: ProductCostTableRow; filters: CostFilters }) {
  const sourceRow = row.currentCost || row.historyCosts[0];
  const siteCode = sourceRow?.siteCode || filters.siteCode;
  const forwarder = sourceRow?.forwarderName
    || sourceRow?.forwarderCode
    || filters.forwarderCode;
  const transportMode = sourceRow?.transportMode || filters.transportMode;
  return (
    <span className="product-logistics-costs-page__route-line">
      <Tag className="product-logistics-costs-page__site-tag">{siteCode || '-'}</Tag>
      <span className="product-logistics-costs-page__route-forwarder">{forwarder || '-'}</span>
      <span className="product-logistics-costs-page__route-separator">·</span>
      <span className="product-logistics-costs-page__subtext">{transportLabel(transportMode)}</span>
    </span>
  );
}

const ELIGIBILITY_STATUS_PRESENTATION: Record<
  ForwarderEligibilityStatus,
  { label: string; color: string }
> = {
  SUPPORTED: { label: '可发', color: 'green' },
  INQUIRY_REQUIRED: { label: '需询价', color: 'orange' },
  UNSUPPORTED: { label: '不接', color: 'red' }
};

export function EligibilityStatusCell({ status }: { status: ForwarderEligibilityStatus }) {
  const presentation = ELIGIBILITY_STATUS_PRESENTATION[status];
  return <Tag color={presentation.color}>{presentation.label}</Tag>;
}

export function HistoryQuotesCell({ rows }: { rows: ProductLogisticsCostRow[] }) {
  if (!rows.length) {
    return <span className="product-logistics-costs-page__muted">无历史价</span>;
  }
  return (
    <div className="product-logistics-costs-page__history-list">
      {rows.map((row) => {
        const batchReferenceNo = textValue(row.batchReferenceNo);
        return (
          <span key={row.id} className="product-logistics-costs-page__history-item">
            {batchReferenceNo ? (
              <span className="product-logistics-costs-page__history-batch" title={batchReferenceNo}>
                {batchReferenceNo}
              </span>
            ) : null}
            <span className="product-logistics-costs-page__history-price">
              {formatPrice(row.unitCostCny)} {row.chargeUnit || row.currencyCode || '-'}
            </span>
            <span className="product-logistics-costs-page__history-date">
              {formatShortDate(row.costOccurredAt || row.refreshedAt)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
