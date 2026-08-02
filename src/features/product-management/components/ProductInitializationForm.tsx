import { Col, Form, Row, Select, Space, Tag, Typography } from 'antd';
import type { ProductCatalogAccessWorkspace } from '../workspaceTypes';

const { Text } = Typography;

type ProductInitializationFormProps = {
  workspace: ProductCatalogAccessWorkspace;
  hidden?: boolean;
};

export function ProductInitializationForm({ workspace, hidden = false }: ProductInitializationFormProps) {
  const { storeInitializationForm, initializationStoreOptions, setSelectedInitializationStoreCodeOverride } = workspace;

  return (
    <Form form={storeInitializationForm} layout="vertical" preserve={false} style={hidden ? { display: 'none' } : undefined}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={16}>
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
