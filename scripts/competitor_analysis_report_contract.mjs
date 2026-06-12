import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const pagePath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx');
const cssPath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.css');
const source = fs.readFileSync(pagePath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');

const requiredSnippets = [
  ['report button aria label', 'aria-label="报表"'],
  ['product report modal state', 'reportProduct'],
  ['self rank report component', 'SelfRankReportModal'],
  ['real report builder', 'buildSelfRankReport'],
  ['report keyword tabs', '<Tabs'],
  ['chart panel usage', 'EChartPanel'],
  ['same keyword competitor series builder', 'buildKeywordCompetitorRankSeries'],
  ['report chart product grouping', 'buildRankChartProductSeries'],
  ['product color helper', 'colorByProduct'],
  ['competitor organic data', 'organicData'],
  ['competitor ad data', 'adData'],
  ['race track chart class', 'competitor-analysis-rank-race-card'],
  ['heatmap matrix class', 'competitor-analysis-rank-heatmap'],
  ['report summary builder', 'buildReportSummary'],
  ['heatmap row builder', 'buildRankHeatmapRows'],
  ['real empty ranking state', '暂无真实排名数据'],
  ['15 day report summary label', '近15日变化'],
  ['legend grouped by product', 'legendProductNames'],
  ['tooltip keeps line kind', 'formatRankChartTooltip'],
  ['self organic series label', '本品自然'],
  ['self ad series label', '本品广告'],
  ['competitor series label', '竞品'],
  ['rank tab visible count label', '有排名'],
  ['rank tab monitored count label', '监控'],
  ['ranked product count helper', 'rankedProductCount'],
  ['report monitored count helper', 'reportMonitoredCount'],
  ['report modal owns compact header', 'competitor-analysis-report-header'],
  ['report title moved into header body', 'competitor-analysis-report-heading'],
  ['report bilingual product title helper', 'productTitleLines(product)'],
  ['report product title cn class', cssSource, 'competitor-analysis-product-title-cn'],
  ['report product title en class', cssSource, 'competitor-analysis-product-title-en'],
  ['report header uses image thumb', 'ProductImageThumb'],
  ['compact primary report tabs', cssSource, 'competitor-analysis-analysis-tabs > .ant-tabs-nav .ant-tabs-tab'],
  ['compact keyword report tabs', cssSource, 'competitor-analysis-report-tabs .ant-tabs-tab'],
  ['summary metric keeps value inline', cssSource, 'competitor-analysis-rank-summary-card .ant-typography:last-child'],
  ['competitor link button', 'competitor-analysis-competitor-link-button'],
  ['competitor detail url helper', 'buildNoonProductDetailUrl'],
  ['competitor series uses product code', 'buildCompetitorSeriesName(candidate: CompetitorCandidate)']
];

const failures = requiredSnippets
  .filter(([, snippetOrSource, maybeSnippet]) => {
    const checkSource = maybeSnippet ? String(snippetOrSource) : source;
    const snippet = String(maybeSnippet ?? snippetOrSource);
    return !checkSource.includes(snippet);
  })
  .map(([name, snippetOrSource, maybeSnippet]) => `${name}: missing ${String(maybeSnippet ?? snippetOrSource)}`);

const forbiddenSnippets = [
  ['right-side report table columns', 'reportColumns'],
  ['old chart plus table layout', 'competitor-analysis-report-keyword-layout'],
  ['old second color self ad palette', "'#1677ff', '#722ed1'"],
  ['old legend per line', 'data: series.map((item) => item.name)'],
  ['old self ad legend name', "name: isSelf ? '本品广告'"],
  ['old competitor ad legend name', "name: isSelf ? '本品广告' : `${productSeries.name} 广告`"],
  ['mock keyword builder', 'buildMockReportKeywords'],
  ['mock self rank points', 'buildMockSelfRankPoints'],
  ['mock report dates', 'buildMockReportDates'],
  ['mock competitor series', 'buildMockCompetitorRankSeries'],
  ['mock competitor organic data', 'buildMockCompetitorRankData'],
  ['mock competitor ad data', 'buildMockCompetitorAdRankData'],
  ['mock report run status', '模拟数据'],
  ['mock competitor code', 'mock-competitor'],
  ['old modal title placement', 'title="商品分析"'],
  ['old product report tag', '商品级报表'],
  ['old competitor indexed brand label', '竞品 ${index + 1}']
];

const forbiddenFailures = forbiddenSnippets
  .filter(([, snippet]) => source.includes(snippet))
  .map(([name, snippet]) => `${name}: forbidden ${snippet}`);

if (failures.length || forbiddenFailures.length) {
  console.error([...failures, ...forbiddenFailures].join('\n'));
  process.exit(1);
}

console.log('Competitor analysis report UI contract passed.');
