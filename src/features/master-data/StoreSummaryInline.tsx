import { Popover, Typography } from 'antd';
import type { MasterDataUser } from './types';
import { isAllStoresRole } from './display';

const { Text } = Typography;

function storeSummaryText(record: MasterDataUser) {
  if (isAllStoresRole(record)) {
    return '全部店铺';
  }
  if (record.directCompanies) {
    return record.directCompanies;
  }
  if (record.storeCount) {
    return `已挂载 ${record.storeCount} 家店铺`;
  }
  return record.sites ? `站点 ${record.sites}` : '-';
}

function storeSummaryItems(record: MasterDataUser) {
  const summary = storeSummaryText(record);
  if (summary === '-' || summary === '全部店铺' || summary.startsWith('已挂载 ') || summary.startsWith('站点 ')) {
    return [summary];
  }
  return Array.from(new Set(summary
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean)));
}

export function StoreSummaryInline({ record, maxVisible }: { record: MasterDataUser; maxVisible?: number }) {
  const items = storeSummaryItems(record);
  const shouldCollapse = maxVisible != null && items.length > maxVisible;
  const visibleItems = shouldCollapse ? items.slice(0, maxVisible) : items;
  const popoverContent = (
    <div className="nuono-store-summary-tooltip">
      {items.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </div>
  );

  const summaryNode = (
    <div className={shouldCollapse ? 'nuono-store-summary-list nuono-store-summary-list-hoverable' : 'nuono-store-summary-list'}>
      {visibleItems.map((item) => (
        <span key={item} className="nuono-store-summary-item" title={shouldCollapse ? undefined : item}>
          {item}
        </span>
      ))}
      {shouldCollapse ? (
        <span className="nuono-store-summary-item nuono-store-summary-more">...</span>
      ) : null}
    </div>
  );

  if (!shouldCollapse) {
    return summaryNode;
  }

  return (
    <Popover
      title="全部负责店铺"
      content={popoverContent}
      placement="topLeft"
      trigger="hover"
      overlayClassName="nuono-store-summary-popover"
    >
      {summaryNode}
    </Popover>
  );
}

export function EmptyStoreSummary() {
  return <Text type="secondary">-</Text>;
}
