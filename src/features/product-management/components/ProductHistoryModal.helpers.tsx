import { useState } from 'react';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ProductSummarySurface } from '../types';
import {
  normalizeSnapshotTextList,
  productSummaryIdentityLine,
  productSummaryPriceLine,
  productSummaryPrimarySite,
  productSummaryTitle,
  productSyncStatusMeta
} from '../utils';
import {
  formatHistoryDateTime,
  formatHistoryValue,
  historyChangeFieldLabel,
  historyChangeRecords,
  historyChangeTypeLabel,
  historyImageUrls,
  historyItemTime,
  historyStatusMeta,
  rawHistoryText,
  type ProductHistoryChange,
  type ProductHistoryItem
} from './ProductHistoryModal.utils';

const { Text } = Typography;

function HistoryValueCell(props: {
  value: unknown;
  change: ProductHistoryChange;
  summary?: ProductSummarySurface | null;
}) {
  const { value, change, summary } = props;
  const urls = historyImageUrls(value);
  if (urls.length) {
    return (
      <Space size={4} wrap>
        {urls.slice(0, 4).map((url, index) => (
          <img
            key={`${url}-${index}`}
            src={url}
            alt=""
            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        ))}
        {urls.length > 4 ? <Text type="secondary">+{urls.length - 4}</Text> : null}
      </Space>
    );
  }

  const text = formatHistoryValue(value, change, summary);
  const content = (
    <span
      style={{
        display: 'block',
        maxHeight: 38,
        overflow: 'hidden',
        color: text === '未设置' ? '#94a3b8' : '#0f172a',
        lineHeight: '19px',
        wordBreak: 'break-word'
      }}
    >
      {text}
    </span>
  );
  return text.length > 80 ? <Tooltip title={text}>{content}</Tooltip> : content;
}

function ProductHistoryDiffTable(props: {
  changes: ProductHistoryChange[];
  summary?: ProductSummarySurface | null;
}) {
  const { changes, summary } = props;
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '132px minmax(0, 1fr) minmax(0, 1fr)',
          background: '#f8fafc',
          color: '#64748b',
          fontSize: 12,
          fontWeight: 600
        }}
      >
        <div style={{ padding: '7px 10px' }}>字段</div>
        <div style={{ padding: '7px 10px', borderLeft: '1px solid #e5e7eb' }}>修改前</div>
        <div style={{ padding: '7px 10px', borderLeft: '1px solid #e5e7eb' }}>修改后</div>
      </div>
      {changes.map((change, index) => (
        <div
          key={`${historyChangeFieldLabel(change)}-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '132px minmax(0, 1fr) minmax(0, 1fr)',
            borderTop: '1px solid #eef2f7',
            fontSize: 12
          }}
        >
          <div style={{ padding: '8px 10px', color: '#334155', fontWeight: 600 }}>{historyChangeFieldLabel(change)}</div>
          <div style={{ padding: '8px 10px', borderLeft: '1px solid #eef2f7' }}>
            <HistoryValueCell value={change.before} change={change} summary={summary} />
          </div>
          <div style={{ padding: '8px 10px', borderLeft: '1px solid #eef2f7', background: '#fcfdfd' }}>
            <HistoryValueCell value={change.after} change={change} summary={summary} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductHistoryTimelineItem(props: {
  item: ProductHistoryItem;
  itemKey: string;
  summary?: ProductSummarySurface | null;
  expanded: boolean;
  onToggleExpanded: (itemKey: string) => void;
}) {
  const { item, itemKey, summary, expanded, onToggleExpanded } = props;
  const meta = historyStatusMeta(item);
  const changes = historyChangeRecords(item);
  const visibleChanges = expanded ? changes : changes.slice(0, 3);
  const hiddenCount = Math.max(changes.length - visibleChanges.length, 0);
  const changeTypes = normalizeSnapshotTextList(item.changeTypes);
  const message = rawHistoryText(item.message);
  const targetSiteCode = rawHistoryText(item.targetSiteCode);
  const emptyChangeText =
    rawHistoryText(item.source) === 'action_log' && rawHistoryText(item.actionType) === 'publish-current'
      ? '这条旧版同步发布只记录了发布结果，未保存字段级变更明细。'
      : '当前记录没有字段级变更明细。';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr)', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 8, top: 24, bottom: -18, width: 1, background: '#e5e7eb' }} />
        <span
          style={{
            display: 'block',
            width: 18,
            height: 18,
            borderRadius: 9,
            border: '3px solid #ffffff',
            background: meta.color === 'error' ? '#ef4444' : meta.color === 'success' ? '#22c55e' : '#3b82f6',
            boxShadow: '0 0 0 1px #dbe4ea'
          }}
        />
      </div>
      <div style={{ paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Space wrap size={[6, 6]}>
            <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
              {meta.label}
            </Tag>
            {changeTypes.map((changeType) => (
              <Tag key={changeType} color="blue" style={{ marginInlineEnd: 0 }}>
                {historyChangeTypeLabel(changeType)}
              </Tag>
            ))}
            {targetSiteCode ? <Tag style={{ marginInlineEnd: 0 }}>{targetSiteCode}</Tag> : null}
          </Space>
          <Text type="secondary" style={{ flex: '0 0 auto', fontSize: 12 }}>
            {formatHistoryDateTime(historyItemTime(item))}
          </Text>
        </div>
        {message ? (
          <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
            {message}
          </Text>
        ) : null}
        <div style={{ marginTop: 8 }}>
          {visibleChanges.length ? (
            <ProductHistoryDiffTable changes={visibleChanges} summary={summary} />
          ) : (
            <div style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, color: '#64748b' }}>
              {emptyChangeText}
            </div>
          )}
        </div>
        {hiddenCount || (expanded && changes.length > 3) ? (
          <Button type="link" size="small" style={{ padding: 0, marginTop: 6 }} onClick={() => onToggleExpanded(itemKey)}>
            {expanded ? '收起变更' : `展开 ${changes.length} 项变更`}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function historyItemKey(item: ProductHistoryItem, index: number) {
  return `${rawHistoryText(item.taskId) || rawHistoryText(item.publishedAt) || rawHistoryText(item.visibleAt) || 'history'}-${index}`;
}

export function ProductHistoryAuditList(props: {
  items: ProductHistoryItem[];
  summary?: ProductSummarySurface | null;
}) {
  const { items, summary } = props;
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const toggleExpanded = (itemKey: string) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      {items.map((item, index) => {
        const itemKey = historyItemKey(item, index);
        return (
          <ProductHistoryTimelineItem
            key={itemKey}
            item={item}
            itemKey={itemKey}
            summary={summary}
            expanded={expandedKeys.has(itemKey)}
            onToggleExpanded={toggleExpanded}
          />
        );
      })}
    </Space>
  );
}

export function ProductHistoryHeaderSummary({ summary }: { summary: ProductSummarySurface }) {
  const syncMeta = summary.syncStatus ? productSyncStatusMeta(summary.syncStatus) : null;
  const title = productSummaryTitle(summary);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr)', gap: 12, padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc' }}>
      <div style={{ width: 56, height: 56, borderRadius: 6, border: '1px solid #e5e7eb', background: '#ffffff', overflow: 'hidden' }}>
        {summary.imageUrl ? <img src={summary.imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      </div>
      <div style={{ minWidth: 0 }}>
        <Tooltip title={title}>
          <Text strong style={{ display: 'block', color: '#0f172a', lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </Text>
        </Tooltip>
        <Text type="secondary" style={{ display: 'block', marginTop: 3, fontSize: 12 }}>
          {productSummaryIdentityLine(summary)}
        </Text>
        <Space wrap size={[6, 6]} style={{ marginTop: 8 }}>
          {syncMeta ? <Tag color={syncMeta.color} style={{ marginInlineEnd: 0 }}>{syncMeta.label}</Tag> : null}
          {summary.brand ? <Tag style={{ marginInlineEnd: 0 }}>{summary.brand}</Tag> : null}
          <Tag style={{ marginInlineEnd: 0 }}>{productSummaryPrimarySite(summary)}</Tag>
          <Tag color="green" style={{ marginInlineEnd: 0 }}>
            {productSummaryPriceLine(summary)}
          </Tag>
        </Space>
      </div>
    </div>
  );
}
