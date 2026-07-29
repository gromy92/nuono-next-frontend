import { Popover, Space, Tag, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import { formatDateTimeParts } from '../utils/common';
import {
  buildProductPublishStatusDisplay,
  productDetailPublishStatusColor,
  productListingPublishStatusMeta
} from '../utils/productListingPublishStatus';

const { Text } = Typography;

function publishText(value: unknown) {
  return String(value ?? '').trim();
}

function ProductPublishPopoverContent({ task }: { task: NonNullable<ProductListRowPayload['lastPublishTask']> }) {
  const isDeleteTask = task.taskType === 'product-delete';
  const isRebuildTask = task.taskType === 'product-rebuild';
  const changes = Array.isArray(task.changes)
    ? task.changes.filter((change): change is Record<string, unknown> => Boolean(change) && typeof change === 'object')
    : [];

  return (
    <Space direction="vertical" size={10} style={{ minWidth: 320, maxWidth: 460 }}>
      <Space wrap size={[8, 6]}>
        <Tag color={productDetailPublishStatusColor(task.statusLabel).tag} style={{ marginInlineEnd: 0 }}>
          {task.statusLabel}
        </Tag>
        {task.targetSiteCode ? <Tag style={{ marginInlineEnd: 0 }}>{task.targetSiteCode}</Tag> : null}
      </Space>
      <Space direction="vertical" size={4}>
        {task.submittedAt ? <Text style={{ fontSize: 12 }}>提交时间：{task.submittedAt}</Text> : null}
        {task.finishedAt ? <Text style={{ fontSize: 12 }}>结果时间：{task.finishedAt}</Text> : null}
        {task.resultText ? <Text style={{ fontSize: 12 }}>结果：{task.resultText}</Text> : null}
      </Space>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
        {changes.length ? (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {changes.map((change, index) => {
              const label = publishText(change.label) || publishText(change.field) || '字段';
              return (
                <div key={`${label}-${index}`} style={{ fontSize: 12, lineHeight: '18px' }}>
                  <Text strong>{label}：</Text>
                  <Text>{publishText(change.before) || '空'}</Text>
                  <Text style={{ color: '#64748b' }}> -&gt; </Text>
                  <Text>{publishText(change.after) || '空'}</Text>
                </div>
              );
            })}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isRebuildTask
              ? '本次重建任务不记录字段变更。'
              : isDeleteTask
                ? '本次删除任务不记录字段变更。'
                : '本次发布内容明细暂未记录。'}
          </Text>
        )}
      </div>
      {task.taskId ? (
        <Text type="secondary" style={{ fontSize: 11 }}>
          Task ID：{task.taskId}
        </Text>
      ) : null}
    </Space>
  );
}

function ListingPublishPopoverContent({
  task
}: {
  task: NonNullable<ProductListRowPayload['listingPublishTask']>;
}) {
  const colors = productListingPublishStatusMeta(task.status, task.statusLabel);
  return (
    <Space direction="vertical" size={10} style={{ minWidth: 320, maxWidth: 460 }}>
      <Space wrap size={[8, 6]}>
        <Tag color={colors.tag} style={{ marginInlineEnd: 0 }}>
          {colors.label}
        </Tag>
        {task.storeCode ? <Tag style={{ marginInlineEnd: 0 }}>{task.storeCode}</Tag> : null}
      </Space>
      <Space direction="vertical" size={4}>
        {task.taskNo ? <Text style={{ fontSize: 12 }}>任务号：{task.taskNo}</Text> : null}
        {task.partnerSku ? <Text style={{ fontSize: 12 }}>PSKU：{task.partnerSku}</Text> : null}
        {task.pskuCode ? <Text style={{ fontSize: 12 }}>pskuCode：{task.pskuCode}</Text> : null}
        {task.skuParent ? <Text style={{ fontSize: 12 }}>skuParent：{task.skuParent}</Text> : null}
        {task.submittedAt ? <Text style={{ fontSize: 12 }}>提交时间：{task.submittedAt}</Text> : null}
        {task.finishedAt ? <Text style={{ fontSize: 12 }}>结果时间：{task.finishedAt}</Text> : null}
        {task.failureCode ? <Text style={{ fontSize: 12 }}>失败代码：{task.failureCode}</Text> : null}
        {task.failureMessage ? <Text style={{ fontSize: 12 }}>失败信息：{task.failureMessage}</Text> : null}
      </Space>
      {task.taskId ? (
        <Text type="secondary" style={{ fontSize: 11 }}>
          Task ID：{task.taskId}
        </Text>
      ) : null}
    </Space>
  );
}

export function PublishStatusCell({ record }: { record: ProductListRowPayload }) {
  const display = buildProductPublishStatusDisplay(record);
  if (!display) {
    return <span style={{ display: 'block', minHeight: 38 }} />;
  }
  const colors = display.color;
  const timeParts = formatDateTimeParts(display.timeText);
  const popoverContent =
    display.kind === 'listing' && record.listingPublishTask ? (
      <ListingPublishPopoverContent task={record.listingPublishTask} />
    ) : record.lastPublishTask ? (
      <ProductPublishPopoverContent task={record.lastPublishTask} />
    ) : null;

  return popoverContent ? (
    <Popover trigger={['click']} title={display.title} content={popoverContent}>
      <button
        type="button"
        style={{
          width: '100%',
          minHeight: 58,
          padding: '8px 10px',
          borderRadius: 6,
          border: `1px solid ${colors.border}`,
          background: colors.background,
          textAlign: 'left',
          cursor: 'pointer'
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Tag color={colors.tag} style={{ marginInlineEnd: 0, marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
          {display.label}
        </Tag>
        <Text style={{ display: 'block', color: colors.text, fontSize: 11, lineHeight: '15px' }}>
          {timeParts ? `${timeParts.date} ${timeParts.time}` : display.resultText || ''}
        </Text>
        {display.resultText && timeParts ? (
          <Text type="secondary" style={{ display: 'block', fontSize: 11, lineHeight: '15px' }}>
            {display.resultText}
          </Text>
        ) : null}
      </button>
    </Popover>
  ) : (
    <span style={{ display: 'block', minHeight: 38 }} />
  );
}
