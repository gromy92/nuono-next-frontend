import { Alert, Modal, Space, Typography } from 'antd';
import type { ProductContentKeywordSaveChangeDetails } from './productContentKeywordEditor';

const { Text } = Typography;

export function ProductContentSaveConfirmModal(props: {
  detail: ProductContentKeywordSaveChangeDetails | null;
  errorMessage?: string | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { detail, errorMessage, loading, onCancel, onConfirm } = props;
  return (
    <Modal
      destroyOnClose
      open={Boolean(detail)}
      title="确认保存本次修改"
      width={720}
      confirmLoading={loading}
      closable={!loading}
      keyboard={!loading}
      maskClosable={!loading}
      okText="确认保存"
      cancelText="返回修改"
      onCancel={() => {
        if (!loading) onCancel();
      }}
      onOk={onConfirm}
    >
      {detail ? (
        <Space data-testid="product-content-save-confirm-modal" direction="vertical" size={14} style={{ width: '100%' }}>
          <Alert showIcon type="warning" message="请确认本次修改内容，确认后会保存到当前商品草稿。" />
          {errorMessage ? (
            <Alert showIcon type="error" message="保存失败，请处理后重试" description={errorMessage} />
          ) : null}
          {detail.titleChanged ? (
            <div>
              <Text strong>标题修改</Text>
              <Space direction="vertical" size={8} style={{ marginTop: 8, width: '100%' }}>
                <SaveConfirmTextBlock label="修改前" value={detail.titleBefore || '未填写'} />
                <SaveConfirmTextBlock label="修改后" value={detail.titleAfter || '未填写'} />
              </Space>
            </div>
          ) : null}
          {detail.keywordDetails.length ? <SaveConfirmList title="关键词变更" items={detail.keywordDetails} /> : null}
          {detail.competitorDetails.length ? <SaveConfirmList title="竞品变更" items={detail.competitorDetails} /> : null}
        </Space>
      ) : null}
    </Modal>
  );
}

function SaveConfirmTextBlock(props: { label: string; value: string }) {
  return (
    <div>
      <Text type="secondary">{props.label}</Text>
      <div style={{
        background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6,
        lineHeight: 1.6, marginTop: 4, padding: '8px 10px', whiteSpace: 'pre-wrap'
      }}>
        {props.value}
      </div>
    </div>
  );
}

function SaveConfirmList(props: { title: string; items: string[] }) {
  return (
    <div>
      <Text strong>{props.title}</Text>
      <ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>
        {props.items.map((item) => <li key={item} style={{ lineHeight: 1.7 }}>{item}</li>)}
      </ul>
    </div>
  );
}
