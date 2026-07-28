import { type ReactNode } from 'react';
import { Alert, Button, Card, Space, Tag, Typography, type AlertProps } from 'antd';
import type { ProcurementAutoInquiryWorkbenchPayload, ProcurementAutoInquiryWorkbenchState } from './types';
import { ProcurementAutoInquiryValidationGuide } from './ProcurementAutoInquiryValidationGuide';
import { ProcurementAutoInquiryValidationResult } from './ProcurementAutoInquiryValidationResult';

const { Text } = Typography;

export type ProcurementAutoInquiryValidationMeta = {
  alertType: AlertProps['type'];
  resultTagColor: string;
  resultLabel: string;
  summary: ReactNode;
};

type ProcurementAutoInquiryFeedback = {
  status: 'idle' | 'success' | 'error';
  action?: 'start' | 'refresh';
  message?: string;
  time?: string;
};

type ProcurementAutoInquiryValidationPanelProps = {
  canUseValidation: boolean;
  starting: boolean;
  validationMeta: ProcurementAutoInquiryValidationMeta;
  feedback: ProcurementAutoInquiryFeedback;
  state: ProcurementAutoInquiryWorkbenchState;
  realSession?: ProcurementAutoInquiryWorkbenchPayload['sessionPool'][number];
  latestTask?: NonNullable<ProcurementAutoInquiryWorkbenchPayload['latestTask']>;
  onOpenValidationSample: () => void;
  onLoadWorkbench: () => void | Promise<void>;
  onStartValidation: () => void | Promise<void>;
};

export function ProcurementAutoInquiryValidationPanel({
  canUseValidation,
  starting,
  validationMeta,
  feedback,
  state,
  realSession,
  latestTask,
  onOpenValidationSample,
  onLoadWorkbench,
  onStartValidation
}: ProcurementAutoInquiryValidationPanelProps) {
  return (
    <details style={{ borderRadius: 12, border: '1px solid #dbe4ea', background: '#ffffff', padding: '12px 14px' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
        <Space wrap size={[8, 8]}>
          <Text strong style={{ color: '#475569' }}>开发验证（内部）</Text>
          <Tag color="default" style={{ marginInlineEnd: 0 }}>不作为产品验收入口</Tag>
        </Space>
        <Text style={{ display: 'block', marginTop: 8, color: '#64748b' }}>
          正常产品验收请走候选池里的“发起自动询价”和“自动询价结果”区域；这里仅保留给开发排查发送链路。
        </Text>
      </summary>

      <Card
        size="small"
        variant="borderless"
        style={{
          marginTop: 12,
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          border: '1px solid #c7d2fe'
        }}
        title={
          <Space wrap size={[8, 8]}>
            <Text strong style={{ color: '#312e81' }}>发送链路技术验证</Text>
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>仅开发排查</Tag>
          </Space>
        }
        extra={
          <Space wrap size={[8, 8]}>
            <Button onClick={onOpenValidationSample}>打开 1688 样本页</Button>
            <Button onClick={() => void onLoadWorkbench()} disabled={!canUseValidation}>刷新阶段结果</Button>
            <Button
              type="primary"
              loading={starting}
              onClick={() => void onStartValidation()}
              disabled={!canUseValidation}
            >
              一键触发发送阶段验证
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={validationMeta.alertType}
            showIcon
            message={`当前结论：${validationMeta.resultLabel}`}
            description={validationMeta.summary}
          />
          {feedback.status !== 'idle' ? (
            <Alert
              type={feedback.status === 'success' ? 'success' : 'info'}
              showIcon
              message={`最近一次按钮响应：${feedback.action === 'refresh' ? '刷新阶段结果' : '一键触发发送阶段验证'}`}
              description={`${feedback.time || '刚刚'} 已收到系统响应：${feedback.message || '请直接看下面的状态与证据字段。'}`}
            />
          ) : null}
          <ProcurementAutoInquiryValidationGuide state={state} realSession={realSession} />
          <ProcurementAutoInquiryValidationResult
            state={state}
            latestTask={latestTask}
            validationMeta={validationMeta}
          />
        </Space>
      </Card>
    </details>
  );
}
