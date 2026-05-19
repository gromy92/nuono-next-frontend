import { Col, Row, Space, Tag, Typography } from 'antd';
import {
  findQuickScenario,
  formatMoney,
  formatPercent,
  profitMissingInputLabel,
  profitQuickSignalStatusMeta,
  profitScenarioColor,
  type ProfitQuickSignalsPayload
} from '../profit-calculator/domain';

const { Text } = Typography;

type ProcurementCandidateProfitSignalPanelProps = {
  signal?: ProfitQuickSignalsPayload['signals'][number];
  loading: boolean;
};

export function ProcurementCandidateProfitSignalPanel({
  signal,
  loading
}: ProcurementCandidateProfitSignalPanelProps) {
  const statusMeta = profitQuickSignalStatusMeta(signal?.status);
  const airQuickScenario = findQuickScenario(signal, 'FBN_AIR');
  const oceanQuickScenario = findQuickScenario(signal, 'FBN_OCEAN');

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0'
      }}
    >
      <Space wrap size={[8, 8]} style={{ marginBottom: 10 }}>
        <Text strong style={{ color: '#0f172a' }}>
          快速利润信号
        </Text>
        <Tag color={statusMeta.color} style={{ marginInlineEnd: 0 }}>
          {statusMeta.label}
        </Tag>
        {signal?.usedDefaults?.length ? (
          <Tag color="default" style={{ marginInlineEnd: 0 }}>
            含默认参数估算
          </Tag>
        ) : null}
        {loading ? (
          <Tag color="processing" style={{ marginInlineEnd: 0 }}>
            计算中
          </Tag>
        ) : null}
      </Space>

      {signal?.status === 'BLOCKED' ? (
        <Text style={{ color: '#92400e' }}>
          待补：
          {signal.missingInputs.length ? signal.missingInputs.map((item) => profitMissingInputLabel(item)).join(' / ') : '规格或重量'}
        </Text>
      ) : signal && (airQuickScenario || oceanQuickScenario) ? (
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #dbe4ea'
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>空运毛利</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: profitScenarioColor(airQuickScenario?.profitRmb) }}>
                {formatMoney(airQuickScenario?.profitRmb)}
                <span style={{ fontSize: 12, marginLeft: 6, color: '#64748b' }}>RMB</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                利润率 {formatPercent(airQuickScenario?.marginRatePct)}
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #dbe4ea'
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>海运毛利</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: profitScenarioColor(oceanQuickScenario?.profitRmb) }}>
                {formatMoney(oceanQuickScenario?.profitRmb)}
                <span style={{ fontSize: 12, marginLeft: 6, color: '#64748b' }}>RMB</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                利润率 {formatPercent(oceanQuickScenario?.marginRatePct)}
              </div>
            </div>
          </Col>
        </Row>
      ) : (
        <Text style={{ color: '#64748b' }}>
          {loading ? '正在按统一利润口径生成空运/海运毛利。' : '当前还没有可展示的快速利润信号。'}
        </Text>
      )}
    </div>
  );
}
