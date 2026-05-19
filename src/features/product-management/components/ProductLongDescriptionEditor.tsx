import { Alert, Button, Col, Input, Row, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { ProductMasterSnapshotPayload } from '../types';
import { textInputValue } from '../utils';
import {
  type LangCode,
  type LoadingMap,
  type TranslationNotice,
  translateProductTextWithFeedback
} from './ProductContentTranslationEditor.helpers';
import { ProductRichTextEditor } from './ProductRichTextEditor';

const { Text } = Typography;

function longDescriptionZh(productSnapshotView?: ProductMasterSnapshotPayload) {
  return (
    textInputValue(productSnapshotView?.content.descriptionCn) ||
    textInputValue(productSnapshotView?.content.descriptionZh)
  );
}

export function ProductLongDescriptionEditor(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
}) {
  const { productSnapshotView, updateProductSectionField } = props;
  const productKey = textInputValue(productSnapshotView?.identity.skuParent);
  const descriptionEn = textInputValue(productSnapshotView?.content.descriptionEn);
  const descriptionAr = textInputValue(productSnapshotView?.content.descriptionAr);
  const [descriptionZh, setDescriptionZh] = useState(longDescriptionZh(productSnapshotView));
  const [loading, setLoading] = useState<LoadingMap>({});
  const [translationNotice, setTranslationNotice] = useState<TranslationNotice>(null);
  const richTextEditorSize = { minHeight: 140, maxHeight: 260 };

  useEffect(() => {
    setDescriptionZh(longDescriptionZh(productSnapshotView));
  }, [productKey, productSnapshotView?.content.descriptionCn, productSnapshotView?.content.descriptionZh]);

  const updateDescriptionZh = (value: string) => {
    setDescriptionZh(value);
    updateProductSectionField('content', 'descriptionCn', value);
  };

  const translate = async (text: string, targetLang: LangCode, loadingKey: string) => {
    return translateProductTextWithFeedback({
      text,
      targetLang,
      loadingKey,
      emptyMessage: '请输入要翻译的长描述',
      setLoading,
      setNotice: setTranslationNotice
    });
  };

  const translateDescription = async (sourceText: string, targetLang: LangCode, loadingKey: string) => {
    const translatedText = await translate(sourceText, targetLang, loadingKey);
    if (!translatedText) {
      return;
    }
    if (targetLang === 'ZH') {
      updateDescriptionZh(translatedText);
      return;
    }
    updateProductSectionField('content', targetLang === 'EN' ? 'descriptionEn' : 'descriptionAr', translatedText);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Text strong style={{ display: 'block', color: 'var(--pm-text-primary)', marginBottom: 8 }}>
        长描述
      </Text>
      {translationNotice ? (
        <Alert
          closable
          message={translationNotice.message}
          showIcon
          style={{ marginBottom: 12 }}
          type={translationNotice.type}
          onClose={() => setTranslationNotice(null)}
        />
      ) : null}
      <Row gutter={[12, 12]}>
        <Col xs={24} xl={8}>
          <Text style={{ display: 'block', color: 'var(--pm-text-muted)', marginBottom: 6 }}>中文</Text>
          <Input.TextArea
            autoSize={false}
            placeholder="中文长描述"
            value={descriptionZh}
            onChange={(event) => updateDescriptionZh(event.target.value)}
            style={{
              minHeight: richTextEditorSize.minHeight,
              maxHeight: richTextEditorSize.maxHeight,
              height: richTextEditorSize.maxHeight,
              resize: 'vertical'
            }}
          />
          <Space size={8} style={{ marginTop: 8 }}>
            <Button size="small" loading={loading['description-zh-en']} onClick={() => void translateDescription(descriptionZh, 'EN', 'description-zh-en')}>
              英语
            </Button>
            <Button size="small" loading={loading['description-zh-ar']} onClick={() => void translateDescription(descriptionZh, 'AR', 'description-zh-ar')}>
              阿语
            </Button>
          </Space>
        </Col>
        <Col xs={24} xl={8}>
          <ProductRichTextEditor
            {...richTextEditorSize}
            label="Long Description English"
            value={descriptionEn}
            placeholder="Long Description English"
            onChange={(nextValue) => updateProductSectionField('content', 'descriptionEn', nextValue)}
          />
          <Button
            size="small"
            loading={loading['description-en-zh']}
            style={{ marginTop: 8 }}
            onClick={() => void translateDescription(descriptionEn, 'ZH', 'description-en-zh')}
          >
            中文
          </Button>
        </Col>
        <Col xs={24} xl={8}>
          <ProductRichTextEditor
            {...richTextEditorSize}
            label="阿拉伯语"
            value={descriptionAr}
            placeholder="Arabic Description"
            onChange={(nextValue) => updateProductSectionField('content', 'descriptionAr', nextValue)}
          />
          <Button
            size="small"
            loading={loading['description-ar-zh']}
            style={{ marginTop: 8 }}
            onClick={() => void translateDescription(descriptionAr, 'ZH', 'description-ar-zh')}
          >
            中文
          </Button>
        </Col>
      </Row>
    </div>
  );
}
