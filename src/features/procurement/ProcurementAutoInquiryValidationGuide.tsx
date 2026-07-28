import { Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import { PROCUREMENT_SEND_PHASE_VALIDATION_CASE } from './constants';
import type { ProcurementAutoInquiryWorkbenchPayload, ProcurementAutoInquiryWorkbenchState } from './types';

const { Text } = Typography;

export function ProcurementAutoInquiryValidationGuide({
  state,
  realSession
}: {
  state: ProcurementAutoInquiryWorkbenchState;
  realSession?: ProcurementAutoInquiryWorkbenchPayload['sessionPool'][number];
}) {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} xl={8}>
        <GuideCard title="你只需要做什么">
          <Text style={{ color: '#475569' }}>1. 直接点“一键触发发送阶段验证”。</Text>
          <Text style={{ color: '#475569' }}>2. 如果你想看原商品，再点“打开 1688 样本页”；这一步现在是辅助查看，不是前置条件。</Text>
          <Text style={{ color: '#475569' }}>3. 看卡片里的状态、阶段和发送证据；如果想手动再读一次，再点“刷新阶段结果”。</Text>
          <Text style={{ color: '#475569' }}>4. 不需要查接口、数据库，也不需要自己补登录态或聊天会话。</Text>
        </GuideCard>
      </Col>
      <Col xs={24} xl={8}>
        <div style={guideCardStyle}>
          <Text strong style={guideTitleStyle}>当前验证样本</Text>
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
                children: state.status === 'success' ? state.data.candidate?.title || '-' : '真实 1688 验证候选样本'
              },
              {
                key: 'sample-session',
                label: '会话准备',
                children: realSession ? (
                  <Space wrap size={[8, 8]}>
                    <Tag color="success" style={{ marginInlineEnd: 0 }}>本地 Chrome 真实会话已挂载</Tag>
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
        <GuideCard title="通过标准">
          <Tag color="success" style={{ marginInlineEnd: 0 }}>状态 = SENT</Tag>
          <Tag color="success" style={{ marginInlineEnd: 0 }}>执行阶段 = SEND_CONFIRMED</Tag>
          <Tag color="success" style={{ marginInlineEnd: 0 }}>发送通道 = hosted-browser-gateway</Tag>
          <Text style={{ color: '#475569' }}>
            同时能看到 sendEvidence、threadCheckpoint、messageDigest、sentAt、confirmedAt 已回写。
          </Text>
        </GuideCard>
      </Col>
    </Row>
  );
}

function GuideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={guideCardStyle}>
      <Text strong style={guideTitleStyle}>{title}</Text>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>{children}</Space>
    </div>
  );
}

const guideCardStyle = {
  height: '100%',
  padding: 14,
  borderRadius: 10,
  border: '1px solid #dbe4ff',
  background: '#ffffff'
} as const;

const guideTitleStyle = {
  display: 'block',
  color: '#0f172a',
  marginBottom: 8
} as const;
