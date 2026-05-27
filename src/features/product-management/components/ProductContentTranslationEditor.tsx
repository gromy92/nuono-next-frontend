import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Input, Row, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ProductMasterSnapshotPayload } from '../types';
import { normalizeStringList, textInputValue } from '../utils';
import {
  FIELD_LABEL_STYLE,
  type LoadingMap,
  type TranslationNotice,
  listWithValueAt,
  resolveHighlightRows,
  translateProductTextWithFeedback,
  trimTrailingEmpty
} from './ProductContentTranslationEditor.helpers';

const { Text } = Typography;
type EditableTranslationLang = 'ZH' | 'EN';

export function ProductContentTranslationEditor(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
  updateProductMultilineField: (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => void;
}) {
  const { productSnapshotView, updateProductSectionField, updateProductMultilineField } = props;
  const productKey = textInputValue(productSnapshotView?.identity.skuParent);
  const titleEn = textInputValue(productSnapshotView?.content.titleEn);
  const titleAr = textInputValue(productSnapshotView?.content.titleAr);
  const highlightsEn = useMemo(
    () => normalizeStringList(productSnapshotView?.content.highlightsEn),
    [productSnapshotView?.content.highlightsEn]
  );
  const highlightsAr = useMemo(
    () => normalizeStringList(productSnapshotView?.content.highlightsAr),
    [productSnapshotView?.content.highlightsAr]
  );
  const [titleZh, setTitleZh] = useState(textInputValue(productSnapshotView?.content.titleCn));
  const [highlightsZh, setHighlightsZh] = useState<string[]>(normalizeStringList(productSnapshotView?.content.highlightsZh));
  const [loading, setLoading] = useState<LoadingMap>({});
  const [translationNotice, setTranslationNotice] = useState<TranslationNotice>(null);

  useEffect(() => {
    setTitleZh(textInputValue(productSnapshotView?.content.titleCn));
    setHighlightsZh(normalizeStringList(productSnapshotView?.content.highlightsZh));
  }, [productKey, productSnapshotView?.content.highlightsZh, productSnapshotView?.content.titleCn]);

  const updateTitleZh = (value: string) => {
    setTitleZh(value);
    updateProductSectionField('content', 'titleCn', value);
  };

  const translate = async (text: string, targetLang: EditableTranslationLang, loadingKey: string) => {
    return translateProductTextWithFeedback({
      text,
      targetLang,
      loadingKey,
      emptyMessage: '请输入要翻译的文案',
      setLoading,
      setNotice: setTranslationNotice
    });
  };

  const translateTitle = async (sourceText: string, targetLang: EditableTranslationLang, loadingKey: string) => {
    const translatedText = await translate(sourceText, targetLang, loadingKey);
    if (!translatedText) {
      return;
    }
    if (targetLang === 'ZH') {
      updateTitleZh(translatedText);
      return;
    }
    updateProductSectionField('content', 'titleEn', translatedText);
  };

  const setHighlightZhValues = (values: string[]) => {
    const nextValues = trimTrailingEmpty(values);
    setHighlightsZh(nextValues);
    updateProductSectionField('content', 'highlightsZh', nextValues);
  };

  const setHighlightEnValues = (values: string[]) => {
    updateProductMultilineField('highlightsEn', trimTrailingEmpty(values).join('\n'));
  };

  const updateHighlight = (lang: EditableTranslationLang, index: number, value: string) => {
    if (lang === 'ZH') {
      setHighlightZhValues(listWithValueAt(highlightsZh, index, value));
      return;
    }
    setHighlightEnValues(listWithValueAt(highlightsEn, index, value));
  };

  const translateHighlight = async (index: number, sourceText: string, targetLang: EditableTranslationLang, loadingKey: string) => {
    const translatedText = await translate(sourceText, targetLang, loadingKey);
    if (translatedText) {
      updateHighlight(targetLang, index, translatedText);
    }
  };

  const removeHighlight = (index: number) => {
    setHighlightZhValues(highlightsZh.filter((_, currentIndex) => currentIndex !== index));
    setHighlightEnValues(highlightsEn.filter((_, currentIndex) => currentIndex !== index));
  };

  const highlightRowCount = resolveHighlightRows(highlightsZh, highlightsEn, highlightsAr);
  const highlightRows = Array.from({ length: highlightRowCount }, (_, index) => index);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      {translationNotice ? (
        <Alert
          closable
          message={translationNotice.message}
          showIcon
          type={translationNotice.type}
          onClose={() => setTranslationNotice(null)}
        />
      ) : null}
      <div>
        <Text strong style={{ display: 'block', color: 'var(--pm-text-primary)', marginBottom: 8 }}>
          标题
        </Text>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={7}>
            <Text style={FIELD_LABEL_STYLE}>中文</Text>
            <Input.TextArea
              aria-label="标题中文"
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={titleZh}
              onChange={(event) => updateTitleZh(event.target.value)}
            />
            <Space size={8} style={{ marginTop: 8 }}>
              <Button
                aria-label="翻译标题中文到英语"
                size="small"
                loading={loading['title-zh-en']}
                onClick={() => void translateTitle(titleZh, 'EN', 'title-zh-en')}
              >
                英语
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Text style={FIELD_LABEL_STYLE}>英语</Text>
            <Input.TextArea
              aria-label="标题英语"
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={titleEn}
              onChange={(event) => updateProductSectionField('content', 'titleEn', event.target.value)}
            />
            <Button
              aria-label="翻译标题英语到中文"
              size="small"
              loading={loading['title-en-zh']}
              style={{ marginTop: 8 }}
              onClick={() => void translateTitle(titleEn, 'ZH', 'title-en-zh')}
            >
              中文
            </Button>
          </Col>
          <Col xs={24} md={9}>
            <Text style={FIELD_LABEL_STYLE}>阿语只读</Text>
            <Input.TextArea
              aria-label="标题阿语"
              autoSize={{ minRows: 3, maxRows: 6 }}
              readOnly
              value={titleAr}
            />
          </Col>
        </Row>
      </div>

      <div>
        <Text strong style={{ display: 'block', color: 'var(--pm-text-primary)', marginBottom: 8 }}>
          卖点
        </Text>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {highlightRows.map((index) => (
            <div key={`highlight-${index}`}>
              <Text style={{ display: 'block', color: '#5b5efa', fontWeight: 600, marginBottom: 6 }}>
                卖点 {index + 1}
              </Text>
              <Row gutter={[12, 12]} align="top">
                <Col xs={24} md={7}>
                  <Input.TextArea
                    aria-label={`卖点 ${index + 1} 中文`}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="中文"
                    value={highlightsZh[index] ?? ''}
                    onChange={(event) => updateHighlight('ZH', index, event.target.value)}
                  />
                  <Space size={8} style={{ marginTop: 8 }}>
                    <Button
                      aria-label={`翻译卖点 ${index + 1} 中文到英语`}
                      size="small"
                      loading={loading[`highlight-${index}-zh-en`]}
                      onClick={() => void translateHighlight(index, highlightsZh[index] ?? '', 'EN', `highlight-${index}-zh-en`)}
                    >
                      英语
                    </Button>
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Input.TextArea
                    aria-label={`卖点 ${index + 1} 英语`}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="英语"
                    value={highlightsEn[index] ?? ''}
                    onChange={(event) => updateHighlight('EN', index, event.target.value)}
                  />
                  <Button
                    aria-label={`翻译卖点 ${index + 1} 英语到中文`}
                    size="small"
                    loading={loading[`highlight-${index}-en-zh`]}
                    style={{ marginTop: 8 }}
                    onClick={() => void translateHighlight(index, highlightsEn[index] ?? '', 'ZH', `highlight-${index}-en-zh`)}
                  >
                    中文
                  </Button>
                </Col>
                <Col xs={24} md={8}>
                  <Input.TextArea
                    aria-label={`卖点 ${index + 1} 阿语`}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="阿语只读"
                    readOnly
                    value={highlightsAr[index] ?? ''}
                  />
                </Col>
                <Col xs={24} md={1}>
                  {highlightRowCount > 1 ? (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => removeHighlight(index)}
                    />
                  ) : null}
                </Col>
              </Row>
            </div>
          ))}
        </Space>
        <Button
          icon={<PlusOutlined />}
          type="dashed"
          style={{ marginTop: 12 }}
          onClick={() => setHighlightsZh((currentValue) => [...currentValue, ''])}
        >
          新增卖点
        </Button>
      </div>
    </Space>
  );
}
