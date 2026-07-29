import { EditOutlined } from '@ant-design/icons';
import { Button, Col, Row, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import './ProductClassificationFields.css';

const { Text } = Typography;
const LABEL_STYLE = { color: 'var(--pm-text-muted)', display: 'block', marginBottom: 6 } as const;

export function ProductClassificationFields(props: {
  brandInput: ReactNode;
  fulltypeInput: ReactNode;
  horizontalLayout?: boolean;
  onEditCategory: () => void;
}) {
  const { brandInput, fulltypeInput, horizontalLayout = false, onEditCategory } = props;
  const editButton = (
    <Button
      size="small"
      icon={<EditOutlined />}
      data-testid="product-listing-category-editor-button"
      onClick={onEditCategory}
    >
      编辑类目
    </Button>
  );
  return (
    <Row className={horizontalLayout ? 'product-classification-horizontal' : undefined} gutter={[12, 12]}>
      <Col xs={24} md={horizontalLayout ? 8 : 12}>
        <div className="product-classification-field">
          <Text style={LABEL_STYLE}>品牌</Text>
          {brandInput}
        </div>
      </Col>
      <Col xs={24} md={horizontalLayout ? 16 : 12}>
        {horizontalLayout ? (
          <div className="product-classification-field product-classification-category-field">
            <Text style={LABEL_STYLE}>Product Fulltype</Text>
            <div className="product-classification-input-actions">
              {fulltypeInput}
              {editButton}
            </div>
          </div>
        ) : (
          <>
            <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: 'var(--pm-text-muted)' }}>Product Fulltype（官方类目）</Text>
              {editButton}
            </Space>
            {fulltypeInput}
          </>
        )}
      </Col>
    </Row>
  );
}
