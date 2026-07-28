import {
  splitProductTitleKeywordHighlights,
  type ProductTitleSharedKeyword
} from './productCompetitorContentKeywords';

const HIGHLIGHT_STYLES = {
  generated: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    color: '#1d4ed8'
  },
  competitor: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    color: '#c2410c'
  }
};

export function ProductTitleKeywordHighlights(props: {
  text: string;
  keywords: ProductTitleSharedKeyword[];
  tone: 'generated' | 'competitor';
}) {
  const { keywords, text, tone } = props;
  const style = HIGHLIGHT_STYLES[tone];
  const testId = tone === 'generated'
    ? 'product-competitor-generated-title-keyword'
    : 'product-competitor-source-title-keyword';
  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {splitProductTitleKeywordHighlights(text, keywords).map((part, index) =>
        part.highlighted ? (
          <span
            key={`${part.text}-${index}`}
            data-testid={testId}
            style={{
              backgroundColor: style.backgroundColor,
              border: `1px solid ${style.borderColor}`,
              borderRadius: 4,
              color: style.color,
              padding: '0 3px'
            }}
          >
            {part.text}
          </span>
        ) : part.text
      )}
    </span>
  );
}
