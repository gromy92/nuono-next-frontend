import { type ReactNode } from 'react';
import { Alert, Button, Descriptions, Space, Tag, Typography, type AlertProps } from 'antd';
import type { ProcurementCandidate } from './types';

const { Text } = Typography;

type ProcurementAutoInquiryBusinessMetaView = {
  tagColor: string;
  alertType: AlertProps['type'];
  businessStatus: string;
  summary: ReactNode;
  supplierName: string;
  sentAt?: string;
  inquirySummary: string;
  failureReason?: string;
};

type ProcurementAutoInquiryBusinessActionView = {
  label: string;
  disabled: boolean;
};

type ProcurementAutoInquiryResultCardProps = {
  starting: boolean;
  businessMeta: ProcurementAutoInquiryBusinessMetaView;
  businessAction: ProcurementAutoInquiryBusinessActionView;
  nextCandidate?: ProcurementCandidate;
  onStart: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onSwitchCandidate: (candidateId: number) => void;
};

function ProcurementClampNote({ children, title }: { children?: ReactNode; title?: string }) {
  return (
    <div
      title={title}
      style={{
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}
    >
      {children}
    </div>
  );
}

export function ProcurementAutoInquiryResultCard({
  starting,
  businessMeta,
  businessAction,
  nextCandidate,
  onStart,
  onRefresh,
  onSwitchCandidate
}: ProcurementAutoInquiryResultCardProps) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 12,
        border: '1px solid #dbe4ea',
        background: '#ffffff'
      }}
    >
      <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space wrap size={[8, 8]}>
          <Text strong style={{ color: '#0f172a' }}>
            自动询价结果
          </Text>
          <Tag color={businessMeta.tagColor} style={{ marginInlineEnd: 0 }}>
            {businessMeta.businessStatus}
          </Tag>
        </Space>
        <Space wrap size={[8, 8]}>
          <Button type="primary" loading={starting} disabled={businessAction.disabled} onClick={() => void onStart()}>
            {businessAction.label}
          </Button>
          <Button onClick={() => void onRefresh()}>刷新询价结果</Button>
        </Space>
      </Space>

      <Alert
        type={businessMeta.alertType}
        showIcon
        message={`当前状态：${businessMeta.businessStatus}`}
        description={businessMeta.summary}
      />

      {businessAction.disabled && nextCandidate ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            border: '1px solid #dbeafe',
            background: '#eff6ff'
          }}
        >
          <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text style={{ color: '#1d4ed8' }}>
              {businessMeta.businessStatus === '已发送' || businessMeta.businessStatus === '询价中'
                ? `当前这条候选已经完成询价；如果你要继续发起新的自动询价，可以切换到“${nextCandidate.title}”。`
                : `当前这条候选暂不适合直接发起自动询价；系统已帮你找到更适合的一条候选：“${nextCandidate.title}”。`}
            </Text>
            <Button onClick={() => onSwitchCandidate(nextCandidate.id)}>切换到可发起候选</Button>
          </Space>
        </div>
      ) : null}

      <Descriptions
        size="small"
        column={{ xs: 1, xl: 2 }}
        style={{ marginTop: 12 }}
        items={[
          {
            key: 'supplier',
            label: '询价供应商',
            children: businessMeta.supplierName
          },
          {
            key: 'sentAt',
            label: '发送时间',
            children: businessMeta.sentAt || '-'
          },
          {
            key: 'businessStatus',
            label: '业务状态',
            children: businessMeta.businessStatus
          },
          {
            key: 'inquirySummary',
            label: '询价内容摘要',
            children: (
              <ProcurementClampNote title={businessMeta.inquirySummary}>
                {businessMeta.inquirySummary}
              </ProcurementClampNote>
            )
          },
          ...(businessMeta.failureReason
            ? [
                {
                  key: 'failureReason',
                  label: '失败原因',
                  children: businessMeta.failureReason
                }
              ]
            : [])
        ]}
      />
    </div>
  );
}
