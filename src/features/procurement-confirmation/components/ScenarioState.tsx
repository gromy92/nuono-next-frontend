import { Button, Card, Empty, Progress, Result, Space, Typography } from 'antd';
import { navigateRequirementRoute, type RequirementRoute } from '../route';
import type { PreviewScenario } from '../types';

const { Paragraph, Title } = Typography;

type ScenarioStateProps = {
  scenario: PreviewScenario;
  lastErrorMessage: string;
  route: RequirementRoute;
  onReloadList: () => void;
  onReloadDetail: (demandId: string) => void;
};

export function ScenarioState({
  scenario,
  lastErrorMessage,
  route,
  onReloadList,
  onReloadDetail
}: ScenarioStateProps) {
  if (scenario === 'loading') {
    return (
      <Card bordered={false} style={{ borderRadius: 22, padding: 36, minHeight: 520 }}>
        <Space direction="vertical" size={18} style={{ width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}>
          <Progress type="circle" percent={62} strokeColor="#0f766e" />
          <Title level={3} style={{ margin: 0 }}>
            正在加载采购需求确认
          </Title>
          <Paragraph style={{ maxWidth: 520, textAlign: 'center', color: '#475569', marginBottom: 0 }}>
            正在读取采购需求、候选池和询价结果。
          </Paragraph>
        </Space>
      </Card>
    );
  }

  if (scenario === 'empty') {
    return (
      <Card bordered={false} style={{ borderRadius: 22, padding: 24, minHeight: 520 }}>
        <Empty description="当前还没有待确认采购需求" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  if (scenario === 'error') {
    return (
      <Result
        status="error"
        title="采购需求确认加载失败"
        subTitle={lastErrorMessage || '请重试或返回列表。'}
        extra={[
          <Button
            key="retry"
            type="primary"
            onClick={() => {
              if (route.page === 'list') {
                onReloadList();
                return;
              }
              onReloadDetail(route.demandId);
            }}
          >
            重新加载
          </Button>,
          <Button key="back" onClick={() => navigateRequirementRoute({ page: 'list' })}>
            回到列表页
          </Button>
        ]}
      />
    );
  }

  if (scenario === 'forbidden') {
    return (
      <Result
        status="403"
        title="当前角色没有访问权限"
        subTitle={lastErrorMessage || '当前角色没有访问权限。'}
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                if (route.page === 'list') {
                  onReloadList();
                  return;
                }
                onReloadDetail(route.demandId);
              }}
            >
              重新检查权限
            </Button>
            <Button onClick={() => navigateRequirementRoute({ page: 'list' })}>回到列表页</Button>
          </Space>
        }
      />
    );
  }

  return null;
}
