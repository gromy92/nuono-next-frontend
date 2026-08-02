import { Alert, Modal, Radio, Select, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ShippingOrderQuoteActions } from './useShippingOrderQuoteActions';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';
import { isExactlyNotSubmitted } from './warehouseShippingOrderDomain';
import { transportModeLabel } from './warehouseShippingQuoteDomain';

const { Text } = Typography;

export function WarehouseShippingOrderReassignModal({
  data,
  quote,
  actions
}: {
  data: WarehouseShippingOrderData;
  quote: ShippingOrderQuoteState;
  actions: ShippingOrderQuoteActions;
}) {
  const [targetTransportMode, setTargetTransportMode] = useState<'AIR' | 'SEA'>('AIR');
  const [targetSegmentId, setTargetSegmentId] = useState<string>('NEW');

  useEffect(() => {
    if (!quote.reassignModalOpen) return;
    setTargetTransportMode(
      String(quote.activeSegment?.transportMode || '').toUpperCase() === 'SEA' ? 'SEA' : 'AIR'
    );
    setTargetSegmentId('NEW');
  }, [quote.activeSegment?.transportMode, quote.reassignModalOpen]);

  const targetSegments = useMemo(() => quote.detailSegments.filter((segment) => (
    segment.id !== quote.activeSegment?.id
    && String(segment.siteCode || '').toUpperCase() === String(quote.activeSegment?.siteCode || '').toUpperCase()
    && String(segment.transportMode || '').toUpperCase() === targetTransportMode
    && isExactlyNotSubmitted(segment.shippingSubmitStatus)
  )), [quote.activeSegment?.id, quote.activeSegment?.siteCode, quote.detailSegments, targetTransportMode]);

  useEffect(() => {
    if (targetSegmentId !== 'NEW' && !targetSegments.some((segment) => segment.id === targetSegmentId)) {
      setTargetSegmentId('NEW');
    }
  }, [targetSegmentId, targetSegments]);

  return (
    <Modal
      title="调整运输方案"
      open={quote.reassignModalOpen}
      okText="确认调整"
      cancelText="取消"
      confirmLoading={data.actionKey === `line-reassign:${data.detailTarget?.id}`}
      onOk={() => void actions.handleReassignLines(
        targetTransportMode,
        targetSegmentId === 'NEW' ? undefined : targetSegmentId
      )}
      onCancel={() => quote.setReassignModalOpen(false)}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message={`已选 ${quote.selectedQuoteLineIds.length} 个商品`}
          description="调整后商品会进入独立分区，再为该分区选择其他货代渠道。已提交分区不能调整。"
        />
        <div>
          <Text strong>运输方式</Text>
          <Radio.Group
            style={{ display: 'block', marginTop: 8 }}
            value={targetTransportMode}
            onChange={(event) => setTargetTransportMode(event.target.value)}
            options={[
              { label: '空运', value: 'AIR' },
              { label: '海运', value: 'SEA' }
            ]}
          />
        </div>
        <div>
          <Text strong>目标分区</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={targetSegmentId}
            onChange={setTargetSegmentId}
            options={[
              {
                value: 'NEW',
                label: `新建 ${quote.activeSegment?.siteCode || '-'}-${transportModeLabel(targetTransportMode)} 分区`
              },
              ...targetSegments.map((segment) => ({
                value: segment.id,
                label: `${segment.segmentNo}（${Number(segment.lineCount || 0)} 个商品）`
              }))
            ]}
          />
        </div>
      </Space>
    </Modal>
  );
}
