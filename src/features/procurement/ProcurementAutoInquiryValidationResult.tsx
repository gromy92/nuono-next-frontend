import { Alert, Col, Descriptions, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import type { ProcurementAutoInquiryWorkbenchPayload, ProcurementAutoInquiryWorkbenchState } from './types';
import type { ProcurementAutoInquiryValidationMeta } from './ProcurementAutoInquiryValidationPanel';

const { Text } = Typography;

export function ProcurementAutoInquiryValidationResult({
  state,
  latestTask,
  validationMeta
}: {
  state: ProcurementAutoInquiryWorkbenchState;
  latestTask?: NonNullable<ProcurementAutoInquiryWorkbenchPayload['latestTask']>;
  validationMeta: ProcurementAutoInquiryValidationMeta;
}) {
  if (state.status === 'loading') {
    return (
      <Space size={12}>
        <Spin size="small" />
        <Text>正在读取发送阶段验收样本...</Text>
      </Space>
    );
  }
  if (state.status === 'error') {
    return <Alert type="error" showIcon message="阶段验收入口暂时不可用" description={state.message} />;
  }
  if (state.status !== 'success') {
    return null;
  }

  return (
    <>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <StatusCard>
            <Statistic title="当前任务状态" value={latestTask?.statusLabel || '待触发'} />
            <Tag color={validationMeta.resultTagColor} style={{ marginTop: 10, marginInlineEnd: 0 }}>
              {latestTask?.status || 'NOT_STARTED'}
            </Tag>
          </StatusCard>
        </Col>
        <Col xs={24} md={8}>
          <StatusCard>
            <Statistic title="当前执行阶段" value={latestTask?.executionStageLabel || '待触发'} />
            <Tag color="processing" style={{ marginTop: 10, marginInlineEnd: 0 }}>
              {latestTask?.executionStage || 'NOT_STARTED'}
            </Tag>
          </StatusCard>
        </Col>
        <Col xs={24} md={8}>
          <StatusCard>
            <Statistic
              title="当前验证结论"
              value={validationMeta.resultLabel}
              valueStyle={{
                color:
                  validationMeta.resultTagColor === 'success'
                    ? '#15803d'
                    : validationMeta.resultTagColor === 'error'
                      ? '#b91c1c'
                      : '#1d4ed8',
                fontSize: 24
              }}
            />
            <Text style={{ color: '#64748b' }}>这一轮只验“发送链路打通”，不看回复抓取。</Text>
          </StatusCard>
        </Col>
      </Row>

      <Descriptions
        size="small"
        column={{ xs: 1, xl: 2 }}
        colon={false}
        items={[
          { key: 'sendChannel', label: 'sendChannel', children: latestTask?.sendChannel || '-' },
          {
            key: 'inputLocator',
            label: 'inputLocator',
            children: latestTask?.inputLocator ? <Text code>{latestTask.inputLocator}</Text> : '-'
          },
          { key: 'sendEvidence', label: 'sendEvidence', children: latestTask?.sendEvidence || '-' },
          {
            key: 'threadCheckpoint',
            label: 'threadCheckpoint',
            children: latestTask?.threadCheckpoint ? <Text code>{latestTask.threadCheckpoint}</Text> : '-'
          },
          {
            key: 'messageDigest',
            label: 'messageDigest',
            children: latestTask?.lastMessageDigest ? <Text code>{latestTask.lastMessageDigest}</Text> : '-'
          },
          { key: 'sentAt', label: 'sentAt', children: latestTask?.sentAt || '-' },
          { key: 'confirmedAt', label: 'confirmedAt', children: latestTask?.confirmedAt || '-' }
        ]}
      />

      {latestTask?.failureCode || latestTask?.failureMessage || latestTask?.handoffReason ? (
        <Alert
          type="error"
          showIcon
          message={latestTask.failureCode || '当前任务需要排查'}
          description={latestTask.failureMessage || latestTask.handoffReason || '当前任务没有进入通过态，请先看失败原因。'}
        />
      ) : null}

      {latestTask?.events?.length ? (
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid #dbe4ea', background: '#ffffff' }}>
          <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 10 }}>
            这轮已经走过的关键事件
          </Text>
          <Space wrap size={[8, 8]}>
            {latestTask.events.map((event) => (
              <Tag key={event.id} color="processing" style={{ marginInlineEnd: 0 }}>
                {event.eventType || 'EVENT'}{event.executionStage ? ` · ${event.executionStage}` : ''}
              </Tag>
            ))}
          </Space>
        </div>
      ) : null}
    </>
  );
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, border: '1px solid #dbe4ea', background: '#ffffff' }}>
      {children}
    </div>
  );
}
