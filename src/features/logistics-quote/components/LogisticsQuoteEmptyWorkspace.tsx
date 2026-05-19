import { Card, Col, Empty, Row, Space, Typography } from 'antd'

const { Text } = Typography

export function LogisticsQuoteEmptyWorkspace() {
  return (
    <Row gutter={[16, 16]} align="top">
      <Col xs={24} xl={10}>
        <Card
          title="来源包详情"
          bordered={false}
          style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Empty description="选择或新建一个资料包后，在这里管理基础来源信息和报价文件归档" />
            <Text type="secondary">这里不承载补充文案；补充文案归到右侧报价版本管理。</Text>
          </Space>
        </Card>
      </Col>
      <Col xs={24} xl={14}>
        <Card
          title="报价版本管理"
          bordered={false}
          style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
        >
          <Empty description="选择资料包后，在这里管理版本、补充文案、结构化规则和发布确认" />
        </Card>
      </Col>
    </Row>
  )
}
