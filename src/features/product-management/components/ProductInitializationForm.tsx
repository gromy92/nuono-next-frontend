import { Col, Form, Input, Row, Select, Space, Tag, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';

const { Text } = Typography;

type ProductInitializationFormProps = {
  workspace: ProductManagementWorkspace;
  hidden?: boolean;
};

export function ProductInitializationForm({ workspace, hidden = false }: ProductInitializationFormProps) {
  const { storeInitializationForm, initializationStoreOptions, setSelectedInitializationStoreCodeOverride } = workspace;

  return (
    <Form form={storeInitializationForm} layout="vertical" preserve={false} style={hidden ? { display: 'none' } : undefined}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={10}>
          <Form.Item label="初始化店铺" name="storeCode" rules={[{ required: true, message: '请选择要初始化的逻辑店铺' }]}>
            <Select
              placeholder="选择要初始化的逻辑店铺"
              options={initializationStoreOptions}
              disabled={!initializationStoreOptions.length}
              onChange={(value) => {
                setSelectedInitializationStoreCodeOverride(value);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Noon 登录密码" name="noonPassword" rules={[{ required: true, message: '请输入 Noon 登录密码' }]}>
            <Input.Password placeholder="本次初始化临时使用" maxLength={100} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="当前试点" style={{ marginBottom: 0 }}>
            <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
              <Space wrap size={[8, 8]}>
                <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                  xingyao
                </Tag>
                <Text style={{ color: '#64748b' }}>先拿这家店把链路跑通</Text>
              </Space>
            </div>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
