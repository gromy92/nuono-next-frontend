import { type ReactNode } from 'react';
import { Alert, Button, Card, Col, Descriptions, Row, Space, Spin, Statistic, Tag, Typography, type AlertProps } from 'antd';
import { PROCUREMENT_SEND_PHASE_VALIDATION_CASE } from './constants';
import type { ProcurementAutoInquiryWorkbenchPayload, ProcurementAutoInquiryWorkbenchState } from './types';

const { Text } = Typography;

type ProcurementAutoInquiryValidationMeta = {
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
              <details
                style={{
                  borderRadius: 12,
                  border: '1px solid #dbe4ea',
                  background: '#ffffff',
                  padding: '12px 14px'
                }}
              >
                <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                  <Space wrap size={[8, 8]}>
                    <Text strong style={{ color: '#475569' }}>
                      开发验证（内部）
                    </Text>
                    <Tag color="default" style={{ marginInlineEnd: 0 }}>
                      不作为产品验收入口
                    </Tag>
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
                      <Text strong style={{ color: '#312e81' }}>
                        发送链路技术验证
                      </Text>
                      <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                        仅开发排查
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Space wrap size={[8, 8]}>
                      <Button onClick={() => onOpenValidationSample()}>
                        打开 1688 样本页
                      </Button>
                      <Button onClick={() => void onLoadWorkbench()} disabled={!canUseValidation}>
                        刷新阶段结果
                      </Button>
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
                    message={`最近一次按钮响应：${
                      feedback.action === 'refresh' ? '刷新阶段结果' : '一键触发发送阶段验证'
                    }`}
                    description={`${
                      feedback.time || '刚刚'
                    } 已收到系统响应：${feedback.message || '请直接看下面的状态与证据字段。'}`}
                  />
                ) : null}

                <Row gutter={[12, 12]}>
                  <Col xs={24} xl={8}>
                    <div
                      style={{
                        height: '100%',
                        padding: 14,
                        borderRadius: 10,
                        border: '1px solid #dbe4ff',
                        background: '#ffffff'
                      }}
                    >
                      <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                        你只需要做什么
                      </Text>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Text style={{ color: '#475569' }}>1. 直接点“一键触发发送阶段验证”。</Text>
                        <Text style={{ color: '#475569' }}>2. 如果你想看原商品，再点“打开 1688 样本页”；这一步现在是辅助查看，不是前置条件。</Text>
                        <Text style={{ color: '#475569' }}>3. 看卡片里的状态、阶段和发送证据；如果想手动再读一次，再点“刷新阶段结果”。</Text>
                        <Text style={{ color: '#475569' }}>4. 不需要查接口、数据库，也不需要自己补登录态或聊天会话。</Text>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} xl={8}>
                    <div
                      style={{
                        height: '100%',
                        padding: 14,
                        borderRadius: 10,
                        border: '1px solid #dbe4ff',
                        background: '#ffffff'
                      }}
                    >
                      <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                        当前验证样本
                      </Text>
                      <Descriptions
                        size="small"
                        column={1}
                        colon={false}
                        items={[
                          {
                            key: 'sample-demand',
                            label: '采购需求',
                            children:
                              state.status === 'success'
                                ? state.data.demandItem?.sourceTitle || PROCUREMENT_SEND_PHASE_VALIDATION_CASE.label
                                : PROCUREMENT_SEND_PHASE_VALIDATION_CASE.label
                          },
                          {
                            key: 'sample-candidate',
                            label: '候选商品',
                            children:
                              state.status === 'success'
                                ? state.data.candidate?.title || '-'
                                : '真实 1688 验证候选样本'
                          },
                          {
                            key: 'sample-session',
                            label: '会话准备',
                            children: realSession ? (
                              <Space wrap size={[8, 8]}>
                                <Tag color="success" style={{ marginInlineEnd: 0 }}>
                                  本地 Chrome 真实会话已挂载
                                </Tag>
                                <Text style={{ color: '#475569' }}>真实发送环境已就绪，这一轮不需要你额外准备 1688 登录或聊天页。</Text>
                              </Space>
                            ) : (
                              <Text style={{ color: '#92400e' }}>系统正在准备真实发送环境；在阶段完成前，不需要你自己补会话。</Text>
                            )
                          },
                          {
                            key: 'sample-session-note',
                            label: '会话说明',
                            children: realSession
                              ? '这一轮使用系统侧已挂载的真实发送环境，老板验收时不需要再做技术前置动作。'
                              : '当前仍在读取阶段环境说明。'
                          },
                          {
                            key: 'sample-entry',
                            label: '目标入口',
                            children: (
                              <Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                                {PROCUREMENT_SEND_PHASE_VALIDATION_CASE.entryUrl}
                              </Text>
                            )
                          }
                        ]}
                      />
                    </div>
                  </Col>
                  <Col xs={24} xl={8}>
                    <div
                      style={{
                        height: '100%',
                        padding: 14,
                        borderRadius: 10,
                        border: '1px solid #dbe4ff',
                        background: '#ffffff'
                      }}
                    >
                      <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                        通过标准
                      </Text>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Tag color="success" style={{ marginInlineEnd: 0 }}>
                          状态 = SENT
                        </Tag>
                        <Tag color="success" style={{ marginInlineEnd: 0 }}>
                          执行阶段 = SEND_CONFIRMED
                        </Tag>
                        <Tag color="success" style={{ marginInlineEnd: 0 }}>
                          发送通道 = hosted-browser-gateway
                        </Tag>
                        <Text style={{ color: '#475569' }}>
                          同时能看到 sendEvidence、threadCheckpoint、messageDigest、sentAt、confirmedAt 已回写。
                        </Text>
                      </Space>
                    </div>
                  </Col>
                </Row>

                {state.status === 'loading' ? (
                  <Space size={12}>
                    <Spin size="small" />
                    <Text>正在读取发送阶段验收样本...</Text>
                  </Space>
                ) : null}

                {state.status === 'error' ? (
                  <Alert
                    type="error"
                    showIcon
                    message="阶段验收入口暂时不可用"
                    description={state.message}
                  />
                ) : null}

                {state.status === 'success' ? (
                  <>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={8}>
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            border: '1px solid #dbe4ea',
                            background: '#ffffff'
                          }}
                        >
                          <Statistic title="当前任务状态" value={latestTask?.statusLabel || '待触发'} />
                          <Tag color={validationMeta.resultTagColor} style={{ marginTop: 10, marginInlineEnd: 0 }}>
                            {latestTask?.status || 'NOT_STARTED'}
                          </Tag>
                        </div>
                      </Col>
                      <Col xs={24} md={8}>
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            border: '1px solid #dbe4ea',
                            background: '#ffffff'
                          }}
                        >
                          <Statistic
                            title="当前执行阶段"
                            value={latestTask?.executionStageLabel || '待触发'}
                          />
                          <Tag color="processing" style={{ marginTop: 10, marginInlineEnd: 0 }}>
                            {latestTask?.executionStage || 'NOT_STARTED'}
                          </Tag>
                        </div>
                      </Col>
                      <Col xs={24} md={8}>
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            border: '1px solid #dbe4ea',
                            background: '#ffffff'
                          }}
                        >
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
                        </div>
                      </Col>
                    </Row>

                    <Descriptions
                      size="small"
                      column={{ xs: 1, xl: 2 }}
                      colon={false}
                      items={[
                        {
                          key: 'sendChannel',
                          label: 'sendChannel',
                          children: latestTask?.sendChannel || '-'
                        },
                        {
                          key: 'inputLocator',
                          label: 'inputLocator',
                          children: latestTask?.inputLocator ? (
                            <Text code>{latestTask.inputLocator}</Text>
                          ) : (
                            '-'
                          )
                        },
                        {
                          key: 'sendEvidence',
                          label: 'sendEvidence',
                          children: latestTask?.sendEvidence || '-'
                        },
                        {
                          key: 'threadCheckpoint',
                          label: 'threadCheckpoint',
                          children: latestTask?.threadCheckpoint ? (
                            <Text code>{latestTask.threadCheckpoint}</Text>
                          ) : (
                            '-'
                          )
                        },
                        {
                          key: 'messageDigest',
                          label: 'messageDigest',
                          children: latestTask?.lastMessageDigest ? (
                            <Text code>{latestTask.lastMessageDigest}</Text>
                          ) : (
                            '-'
                          )
                        },
                        {
                          key: 'sentAt',
                          label: 'sentAt',
                          children: latestTask?.sentAt || '-'
                        },
                        {
                          key: 'confirmedAt',
                          label: 'confirmedAt',
                          children: latestTask?.confirmedAt || '-'
                        }
                      ]}
                    />

                    {latestTask?.failureCode ||
                    latestTask?.failureMessage ||
                    latestTask?.handoffReason ? (
                      <Alert
                        type="error"
                        showIcon
                        message={latestTask.failureCode || '当前任务需要排查'}
                        description={
                          latestTask.failureMessage ||
                          latestTask.handoffReason ||
                          '当前任务没有进入通过态，请先看失败原因。'
                        }
                      />
                    ) : null}

                    {latestTask?.events?.length ? (
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: '1px solid #dbe4ea',
                          background: '#ffffff'
                        }}
                      >
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
                ) : null}
              </Space>
                </Card>
              </details>
  );
}
