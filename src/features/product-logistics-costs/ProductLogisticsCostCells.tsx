import { Space, Tag } from 'antd';
import type { CostFilters, ProductCostTableRow, ProductLogisticsCostRow } from './productLogisticsCostModels';
import {
  formatPrice,
  formatShortDate,
  optionLabel,
  textValue,
  transportLabel
} from './productLogisticsCostRouteDomain';
import { FORWARDER_OPTIONS } from './productLogisticsCostModels';

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
    || optionLabel(FORWARDER_OPTIONS, filters.forwarderCode);
  const transportMode = sourceRow?.transportMode || filters.transportMode;
  return (
    <Space direction="vertical" size={0} className="product-logistics-costs-page__route-cell">
      <span>
        <Tag className="product-logistics-costs-page__site-tag">{siteCode || '-'}</Tag>
        <span>{forwarder || '-'}</span>
      </span>
      <span className="product-logistics-costs-page__subtext">{transportLabel(transportMode)}</span>
    </Space>
  );
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
