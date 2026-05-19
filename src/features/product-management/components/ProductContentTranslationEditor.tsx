import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Input, Row, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ProductMasterSnapshotPayload } from '../types';
import { normalizeStringList, textInputValue } from '../utils';
import {
  FIELD_LABEL_STYLE,
  type LangCode,
  type LoadingMap,
  type TranslationNotice,
  listWithValueAt,
  resolveHighlightRows,
  translateProductTextWithFeedback,
  trimTrailingEmpty
} from './ProductContentTranslationEditor.helpers';

const { Text } = Typography;

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

  const translate = async (text: string, targetLang: LangCode, loadingKey: string) => {
    return translateProductTextWithFeedback({
      text,
      targetLang,
      loadingKey,
      emptyMessage: '请输入要翻译的文案',
      setLoading,
      setNotice: setTranslationNotice
    });
  };

  const translateTitle = async (sourceText: string, targetLang: LangCode, loadingKey: string) => {
    const translatedText = await translate(sourceText, targetLang, loadingKey);
    if (!translatedText) {
      return;
    }
    if (targetLang === 'ZH') {
      updateTitleZh(translatedText);
      return;
    }
    updateProductSectionField('content', targetLang === 'EN' ? 'titleEn' : 'titleAr', translatedText);
  };

  const setHighlightZhValues = (values: string[]) => {
    const nextValues = trimTrailingEmpty(values);
    setHighlightsZh(nextValues);
    updateProductSectionField('content', 'highlightsZh', nextValues);
  };

  const setHighlightValues = (lang: 'EN' | 'AR', values: string[]) => {
    updateProductMultilineField(lang === 'EN' ? 'highlightsEn' : 'highlightsAr', trimTrailingEmpty(values).join('\n'));
  };

  const updateHighlight = (lang: LangCode, index: number, value: string) => {
    if (lang === 'ZH') {
      setHighlightZhValues(listWithValueAt(highlightsZh, index, value));
      return;
    }
    const sourceValues = lang === 'EN' ? highlightsEn : highlightsAr;
    setHighlightValues(lang, listWithValueAt(sourceValues, index, value));
  };

  const translateHighlight = async (index: number, sourceText: string, targetLang: LangCode, loadingKey: string) => {
    const translatedText = await translate(sourceText, targetLang, loadingKey);
    if (translatedText) {
      updateHighlight(targetLang, index, translatedText);
    }
  };

  const removeHighlight = (index: number) => {
    setHighlightZhValues(highlightsZh.filter((_, currentIndex) => currentIndex !== index));
    setHighlightValues('EN', highlightsEn.filter((_, currentIndex) => currentIndex !== index));
    setHighlightValues('AR', highlightsAr.filter((_, currentIndex) => currentIndex !== index));
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
              <Button
                aria-label="翻译标题中文到阿语"
                size="small"
                loading={loading['title-zh-ar']}
                onClick={() => void translateTitle(titleZh, 'AR', 'title-zh-ar')}
              >
                阿语
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
            <Text style={FIELD_LABEL_STYLE}>阿拉伯语</Text>
            <Input.TextArea
              aria-label="标题阿语"
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={titleAr}
              onChange={(event) => updateProductSectionField('content', 'titleAr', event.target.value)}
            />
            <Button
              aria-label="翻译标题阿语到中文"
              size="small"
              loading={loading['title-ar-zh']}
              style={{ marginTop: 8 }}
              onClick={() => void translateTitle(titleAr, 'ZH', 'title-ar-zh')}
            >
              中文
            </Button>
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
                    <Button
                      aria-label={`翻译卖点 ${index + 1} 中文到阿语`}
                      size="small"
                      loading={loading[`highlight-${index}-zh-ar`]}
                      onClick={() => void translateHighlight(index, highlightsZh[index] ?? '', 'AR', `highlight-${index}-zh-ar`)}
                    >
                      阿语
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
                    placeholder="阿拉伯语"
                    value={highlightsAr[index] ?? ''}
                    onChange={(event) => updateHighlight('AR', index, event.target.value)}
                  />
                  <Button
                    aria-label={`翻译卖点 ${index + 1} 阿语到中文`}
                    size="small"
                    loading={loading[`highlight-${index}-ar-zh`]}
                    style={{ marginTop: 8 }}
                    onClick={() => void translateHighlight(index, highlightsAr[index] ?? '', 'ZH', `highlight-${index}-ar-zh`)}
                  >
                    中文
                  </Button>
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
