import { Alert, Button, Space, Tag, Typography } from 'antd';
import type { LoadingMap, TranslationNotice } from './ProductContentTranslationEditor.helpers';

const { Text } = Typography;

export function ProductContentTranslationSection(props: {
  loading: LoadingMap;
  notice: TranslationNotice;
  translationDraft: string;
  onGenerate: () => void;
}) {
  const { loading, notice, onGenerate, translationDraft } = props;
  return (
    <div>
      <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={8}>
          <Text strong>翻译</Text>
          <Tag color="processing">翻译成中文</Tag>
        </Space>
        <Button loading={Boolean(loading['field-edit-translation'])} onClick={onGenerate}>
          生成中文翻译
        </Button>
      </Space>
      {notice ? <Alert showIcon type={notice.type} message={notice.message} /> : null}
      <div
        data-testid="product-content-translation-draft-preview"
        style={{
          color: translationDraft ? 'var(--pm-text-primary)' : 'var(--pm-text-muted)',
          lineHeight: 1.6,
          minHeight: 24,
          padding: '2px 0',
          whiteSpace: 'pre-wrap'
        }}
      >
        {translationDraft || '点击生成翻译后在这里显示结果'}
      </div>
    </div>
  );
}
