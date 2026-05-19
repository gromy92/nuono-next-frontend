import { Col, Form, Input, Row, Select } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductSnapshotHiddenFormProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductSnapshotHiddenForm({ workspace }: ProductSnapshotHiddenFormProps) {
  const { productSnapshotForm, productStoreOptions } = workspace;

  return (
    <Form form={productSnapshotForm} layout="vertical" preserve={false} style={{ display: 'none' }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Form.Item label="逻辑店铺" name="storeCode" rules={[{ required: true, message: '请选择逻辑店铺' }]}>
            <Select placeholder="选择已绑定逻辑店铺" options={productStoreOptions} disabled={!productStoreOptions.length} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Noon 登录账号（可选）" name="noonUser">
            <Input placeholder="留空时默认使用当前店铺绑定账号" maxLength={100} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Noon 登录密码" name="noonPassword" rules={[{ required: true, message: '请输入 Noon 登录密码' }]}>
            <Input.Password placeholder="输入 Noon 密码" maxLength={100} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="skuParent" name="skuParent" rules={[{ required: true, message: '请输入 skuParent' }]}>
            <Input placeholder="例如：Z580978E7ED8F9491B50BZ" maxLength={80} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="partnerSku" name="partnerSku" rules={[{ required: true, message: '请输入 partnerSku' }]}>
            <Input placeholder="例如：MILKYWAYA09" maxLength={80} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="pskuCode" name="pskuCode" rules={[{ required: true, message: '请输入 pskuCode' }]}>
            <Input placeholder="例如：aaffe48340c296b67216702d2acd003a" maxLength={80} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
