import { Button, Card, Space, Tag, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import type { PreOrderProfitCalculation, PreOrderProfitInput, PreOrderProfitPurchaseOrder } from './types';

const { Paragraph, Text } = Typography;

export function AiAssistancePanel(props: {
  candidate: PreOrderProfitInput;
  calculation: PreOrderProfitCalculation;
  purchaseOrders: PreOrderProfitPurchaseOrder[];
  onParseLink: () => void;
  onRecommendCompetitor: () => void;
  onGenerateSummary: () => void;
  onSuggestPurchaseOrder: () => void;
}) {
  const {
    candidate,
    calculation,
    onGenerateSummary,
    onParseLink,
    onRecommendCompetitor,
    onSuggestPurchaseOrder,
    purchaseOrders
  } = props;
  const suggestedPurchaseOrder = purchaseOrders.find((order) => order.id === candidate.aiSuggestedPurchaseOrderId);

  return (
    <Card
      className="pre-order-profit-card"
      title={
        <Space>
          <RobotOutlined />
          AI 辅助
        </Space>
      }
      data-testid="pre-order-profit-ai-panel"
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div className="pre-order-profit-ai-actions">
          <Button data-testid="pre-order-profit-ai-parse-link" onClick={onParseLink}>
            AI解析1688链接
          </Button>
          <Button data-testid="pre-order-profit-ai-recommend-competitor" onClick={onRecommendCompetitor}>
            AI推荐竞品
          </Button>
          <Button data-testid="pre-order-profit-ai-generate-summary" onClick={onGenerateSummary}>
            AI生成分析
          </Button>
          <Button data-testid="pre-order-profit-ai-suggest-purchase-order" onClick={onSuggestPurchaseOrder}>
            AI建议采购单
          </Button>
        </div>

        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          当前为前端 mock：按钮只生成确定性样例结果，后续真实接入时走后端 AI capability layer。
        </Paragraph>

        {candidate.aiSummary ? (
          <div className="pre-order-profit-ai-result" data-testid="pre-order-profit-ai-summary">
            <Text strong>AI 分析</Text>
            <Paragraph style={{ marginBottom: 0 }}>
              {candidate.aiSummary}
              当前预估毛利率 {calculation.estimatedMarginPct.toFixed(2)}%。
            </Paragraph>
          </div>
        ) : null}

        {suggestedPurchaseOrder ? (
          <div
            className="pre-order-profit-ai-result"
            data-testid="pre-order-profit-ai-purchase-order-suggestion"
          >
            <Tag color="purple">建议加入</Tag>
            <Text strong>{suggestedPurchaseOrder.name}</Text>
            {suggestedPurchaseOrder.notes ? (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {suggestedPurchaseOrder.notes}
              </Paragraph>
            ) : null}
          </div>
        ) : null}
      </Space>
    </Card>
  );
}
