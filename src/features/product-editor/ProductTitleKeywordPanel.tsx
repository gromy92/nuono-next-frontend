import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Space, Tag, Tooltip, Typography } from 'antd';
import type { ProductContentFieldEditorController } from './useProductContentFieldEditor';
import type { ProductContentLang } from './productContentEditorTypes';

const { Text } = Typography;

export function ProductTitleKeywordPanel(props: {
  controller: ProductContentFieldEditorController;
  lang: ProductContentLang;
}) {
  const { controller, lang } = props;
  const { copyTitleKeywordToClipboard, keyword, loading } = controller;
  return (
    <div
      data-testid="product-competitor-shared-keywords"
      style={{ border: '1px solid #e0e7ff', borderRadius: 6, background: '#f8fafc', padding: '10px 12px' }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space size={8}>
          <Text strong>共用关键词</Text>
          <Tag color="geekblue">{keyword.titleKeywords.length}</Tag>
          {lang === 'AR' && loading['title-keyword-translation'] ? <Tag color="processing">翻译中</Tag> : null}
        </Space>
        {keyword.keywordTranslationNotice ? (
          <Alert showIcon type={keyword.keywordTranslationNotice.type} message={keyword.keywordTranslationNotice.message} />
        ) : null}
        {keyword.titleKeywords.length ? (
          <Space size={[6, 6]} wrap>
            {keyword.titleKeywords.map((item) => (
              <Tooltip key={item.key} title="点击复制关键词">
                <Tag
                  data-testid="product-competitor-keyword-chip"
                  color="geekblue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => void copyTitleKeywordToClipboard(item.label)}
                >
                  <CopyOutlined style={{ marginRight: 4 }} />
                  {item.label}
                  {keyword.titleKeywordTranslations[item.key]
                    ? `（${keyword.titleKeywordTranslations[item.key]}）`
                    : ''}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          <Text type="secondary">AI整合后会在这里显示共用关键词，点击可复制。</Text>
        )}
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space align="center" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">关键词管理</Text>
            {keyword.keywordPanelLoading ? <Tag color="processing">加载中</Tag> : null}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            AI 自动匹配竞品；只有我方标题和竞品标题同时包含同一个关键词时才会建立关联。
          </Text>
          {keyword.automaticKeywordRows.length ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {keyword.automaticKeywordRows.map((row, index) => (
                <Space key={row.id} align="center" size={8} style={{ display: 'flex', width: '100%' }}>
                  <Input
                    data-testid="product-competitor-keyword-row-input"
                    disabled={keyword.keywordEditingDisabled}
                    placeholder={`关键词${index + 1}`}
                    value={row.value}
                    onChange={(event) => keyword.updateKeywordInputRow(row.id, event.target.value)}
                  />
                  <Button
                    disabled={keyword.keywordEditingDisabled || !row.competitorSourceKeys?.length}
                    style={{ flex: '0 0 auto' }}
                    onClick={() => keyword.openAutomaticCompetitorMatches(row)}
                  >
                    {row.competitorSourceKeys?.length ? `AI 匹配 ${row.competitorSourceKeys.length} 个` : '无共同关键词'}
                  </Button>
                  <Tooltip title="删除关键词">
                    <Button
                      aria-label="删除关键词"
                      danger
                      disabled={keyword.keywordEditingDisabled}
                      icon={<DeleteOutlined />}
                      style={{ flex: '0 0 auto' }}
                      onClick={() => keyword.deleteKeywordInputRow(row.id)}
                    />
                  </Tooltip>
                </Space>
              ))}
            </Space>
          ) : (
            <Text type="secondary">暂无标题关键词，点击下方添加。</Text>
          )}
          <Button
            block
            disabled={keyword.keywordPanelLoading}
            icon={<PlusOutlined />}
            loading={keyword.keywordSaving}
            onClick={keyword.addKeywordInputRow}
          >
            添加关键词
          </Button>
        </Space>
      </Space>
    </div>
  );
}
