import { Alert, Button, Checkbox, Empty, List, Space, Tag, Typography } from 'antd';
import {
  competitorSourceDisplayText,
  competitorSourceLinkTitle
} from './productContentKeywordEditor';
import { ProductTitleKeywordHighlights } from './ProductTitleKeywordHighlights';
import type { ProductContentFieldEditorController } from './useProductContentFieldEditor';

const { Text } = Typography;

export function ProductCompetitorContentSection(props: {
  controller: ProductContentFieldEditorController;
}) {
  const { controller } = props;
  const { competitor, keyword, loading } = controller;
  return (
    <div>
      <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={8}>
          <Text strong>竞品</Text>
          <Tag color="processing">
            {competitor.selectedCompetitorTexts.length}/{keyword.competitorTextItems.length} 条参与整合
          </Tag>
          {keyword.competitorTextItems.length ? (
            <Checkbox
              checked={competitor.allCompetitorsSelected}
              indeterminate={competitor.partiallySelected}
              onChange={(event) => competitor.toggleAllCompetitors(event.target.checked)}
            >
              全选
            </Checkbox>
          ) : null}
        </Space>
        <Button
          disabled={!competitor.selectedCompetitorTexts.length}
          loading={competitor.competitorLoading}
          onClick={() => void competitor.generateCompetitorDraft()}
        >
          AI整合
        </Button>
      </Space>
      {competitor.competitorNotice ? (
        <Alert showIcon type={competitor.competitorNotice.type} message={competitor.competitorNotice.message} />
      ) : null}
      {keyword.competitorTextItems.length ? (
        <List
          bordered
          size="small"
          dataSource={keyword.competitorTextItems}
          renderItem={(item, index) => (
            <List.Item
              key={item.key}
              style={{ background: competitor.selectedCompetitorKeys.includes(item.key) ? '#f8fafc' : '#fff' }}
            >
              <Space align="start" size={10} style={{ width: '100%' }}>
                <Checkbox
                  checked={competitor.selectedCompetitorKeys.includes(item.key)}
                  style={{ marginTop: 4 }}
                  onChange={(event) => competitor.toggleCompetitorKey(item.key, event.target.checked)}
                />
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Space size={8} wrap>
                    <Text type="secondary">竞品 {index + 1}</Text>
                    {item.source.url ? (
                      <Typography.Link
                        href={item.source.url}
                        rel="noreferrer"
                        target="_blank"
                        title={competitorSourceLinkTitle(item)}
                      >
                        {competitorSourceDisplayText(item)}
                      </Typography.Link>
                    ) : <Text type="secondary">{competitorSourceDisplayText(item)}</Text>}
                    {item.source.platform === 'noon' ? <Tag color="geekblue">可添加竞品</Tag> : null}
                  </Space>
                  <Space align="start" size={10} style={{ display: 'flex', width: '100%' }}>
                    <Text style={{ flex: 1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      <ProductTitleKeywordHighlights
                        text={item.text}
                        keywords={keyword.titleKeywords}
                        tone="competitor"
                      />
                    </Text>
                    <Button
                      loading={Boolean(loading[`competitor-translation-${item.key}`])}
                      size="small"
                      onClick={() => void competitor.generateCompetitorTranslation(item)}
                    >
                      翻译
                    </Button>
                  </Space>
                  {competitor.translationNotices[item.key] ? (
                    <Alert
                      showIcon
                      type={competitor.translationNotices[item.key]?.type}
                      message={competitor.translationNotices[item.key]?.message}
                    />
                  ) : null}
                  {competitor.competitorTranslations[item.key] ? (
                    <div style={{
                      background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6,
                      color: '#135200', lineHeight: 1.6, padding: '8px 10px', whiteSpace: 'pre-wrap'
                    }}>
                      {competitor.competitorTranslations[item.key]}
                    </div>
                  ) : null}
                </Space>
              </Space>
            </List.Item>
          )}
        />
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无竞品素材" />}
    </div>
  );
}
