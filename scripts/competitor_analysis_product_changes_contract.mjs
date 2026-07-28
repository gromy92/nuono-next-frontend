import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const typesPath = path.join(rootDir, 'src/features/competitor-analysis/types.ts');

const readSources = (paths) => paths.map((filePath) => fs.readFileSync(path.join(rootDir, filePath), 'utf8')).join('\n');
const pageSource = readSources([
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'src/features/competitor-analysis/productChanges/ProductChangeModal.tsx',
  'src/features/competitor-analysis/productChanges/ProductChangeCompetitorCard.tsx',
  'src/features/competitor-analysis/productChanges/productChangeModel.ts',
  'src/features/competitor-analysis/rankReports/SelfRankReportModal.tsx',
  'src/features/competitor-analysis/rankReports/RankKeywordReportPanel.tsx',
  'src/features/competitor-analysis/rankReports/rankCompetitorSeries.ts',
  'src/features/competitor-analysis/rankReports/rankReportModel.ts',
  'src/features/competitor-analysis/competitorRankHistory.ts',
  'src/features/competitor-analysis/productList/CompetitorProductListTab.tsx',
  'src/features/competitor-analysis/productList/CompetitorProductTable.tsx',
  'src/features/competitor-analysis/productList/productListFilters.ts'
]);
const apiSource = readSources([
  'src/features/competitor-analysis/api/backendContracts.ts',
  'src/features/competitor-analysis/api/watchProductMapper.ts',
  'src/features/competitor-analysis/api/watchProductTransport.ts',
  'src/features/competitor-analysis/api/productChangeTransport.ts',
  'src/features/competitor-analysis/api/transportValues.ts'
]);
const typesSource = fs.readFileSync(typesPath, 'utf8');
const cssSource = readSources([
  'src/features/competitor-analysis/CompetitorAnalysisPage.css',
  ...fs.readdirSync(path.join(rootDir, 'src/features/competitor-analysis/styles'))
    .filter((fileName) => fileName.endsWith('.css'))
    .map((fileName) => `src/features/competitor-analysis/styles/${fileName}`)
]);

const checks = [
  ['analysis modal compact header class', pageSource, 'competitor-analysis-report-heading'],
  ['analysis modal title', pageSource, '商品分析'],
  ['analysis modal psku in header', pageSource, 'competitor-analysis-report-product-psku'],
  ['analysis modal english title wraps fully', cssSource, 'competitor-analysis-report-product-title-en-full'],
  ['changes analysis tab', pageSource, '变化历史'],
  ['changes embedded in report modal', pageSource, 'changeGroups={changeRows}'],
  ['changes modal component', pageSource, 'ProductChangeModal'],
  ['report modal width', pageSource, 'width="min(1180px, calc(100vw - 96px))"'],
  ['real empty changes state', pageSource, '暂无商品详情变化'],
  ['changes summary single line', pageSource, 'competitor-analysis-product-change-summary-line'],
  ['changes summary reusable component', pageSource, 'function ProductChangeSummaryLine'],
  ['report passes changes summary into product header', pageSource, 'summary={changeSummary}'],
  ['report header owns changes summary', pageSource, '<ProductChangeSummaryLine\n          summary={summary}'],
  ['report change tab suppresses duplicate summary', pageSource, 'showSummary={false}'],
  ['report keyword chip component', pageSource, 'function RankKeywordChips'],
  ['report rank insight strip component', pageSource, 'function RankInsightStrip'],
  ['report compact empty rank panel', pageSource, 'function RankCompactEmpty'],
  ['report hides empty rank chart', pageSource, 'hasRenderableRankData(report)'],
  ['report keyword count is independent from chart series', pageSource, 'function rankedMonitoredCompetitorCount'],
  ['report change rank does not use future fallback', pageSource, 'point.factDate <= factDate'],
  ['rank scan depth normalized in api adapter', apiSource, 'function normalizeRankScanDepth'],
  ['list exposes recent competitor change count', apiSource, 'recent7dCompetitorChangeCount'],
  ['list exposes recent changed competitor product count', apiSource, 'recent7dChangedCompetitorCount'],
  ['list has recent competitor changes column', pageSource, "title: '近7日竞品变化'"],
  ['list renders recent competitor change count value', pageSource, 'product.recent7dCompetitorChangeCount ?? 0'],
  ['list renders recent changed competitor product count value', pageSource, 'product.recent7dChangedCompetitorCount ?? 0'],
  ['list filter control owns sorting', pageSource, 'data-testid="competitor-analysis-filter-select"'],
  ['list sort recent changes desc option', pageSource, "value: 'recent7dChangeCountDesc'"],
  ['list sort recent changes asc option', pageSource, "value: 'recent7dChangeCountAsc'"],
  ['list sort query param', apiSource, "appendSearchParam(params, 'sortBy', query.sortBy)"],
  ['report tooltip controlled while modal opens', pageSource, 'openActionTooltip'],
  ['competitor change card builder', pageSource, 'buildProductChangeCompetitorCards(product, groups)'],
  ['competitor change card list', pageSource, 'competitor-analysis-product-change-competitor-list'],
  ['competitor change card list uses three columns', cssSource, 'grid-template-columns: repeat(3, minmax(0, 1fr))'],
  ['competitor change card product link fallback', pageSource, 'buildNoonProductDetailUrl(group.noonProductCode, product.siteCode)'],
  ['competitor change card image area', pageSource, 'competitor-analysis-product-change-competitor-media'],
  ['competitor change card image uses contain', cssSource, 'object-fit: contain'],
  ['competitor change card left detail column', pageSource, 'competitor-analysis-product-change-competitor-detail'],
  ['competitor change card uses left-right structure', cssSource, 'grid-template-columns: minmax(150px, 0.78fr) minmax(0, 1.22fr)'],
  ['competitor change card identity meta', pageSource, 'competitor-analysis-product-change-competitor-meta'],
  ['competitor change code is not bold css', cssSource, 'font-weight: 400'],
  ['competitor change code wraps fully', cssSource, 'overflow-wrap: anywhere'],
  ['competitor change title max three lines', cssSource, '-webkit-line-clamp: 3'],
  ['competitor change date blocks', pageSource, 'competitor-analysis-product-change-date-block'],
  ['competitor change date blocks align top', cssSource, 'align-content: start'],
  ['competitor change date blocks divider', cssSource, 'competitor-analysis-product-change-date-block + .competitor-analysis-product-change-date-block'],
  ['rank rows in change cards', pageSource, 'function ProductChangeRankSection'],
  ['field rows in change cards', pageSource, 'function ProductChangeFieldSection'],
  ['structured rank item builder', pageSource, 'function buildProductChangeRankItems'],
  ['change content list', pageSource, 'competitor-analysis-product-change-content-list'],
  ['main image change link renderer', pageSource, 'function ProductChangeMainImageLinks'],
  ['main image change A link label', pageSource, 'label="主图A"'],
  ['main image change B link label', pageSource, 'label="主图B"'],
  ['product changes api', apiSource, 'fetchCompetitorProductChanges'],
  ['product change group type', typesSource, 'CompetitorProductChangeGroup'],
  ['product change field type', typesSource, 'CompetitorProductChangeField'],
  ['changes modal css', cssSource, 'competitor-analysis-product-change-modal'],
  ['changes single-line summary css', cssSource, 'competitor-analysis-product-change-summary-line'],
  ['report header summary css', cssSource, 'competitor-analysis-report-header-body > .competitor-analysis-product-change-summary-line'],
  ['main image change links css', cssSource, 'competitor-analysis-product-change-image-links'],
  ['competitor change cards css', cssSource, 'competitor-analysis-product-change-competitor-card'],
  ['rank keyword chip css', cssSource, 'competitor-analysis-report-keyword-chip-list'],
  ['rank insight strip css', cssSource, 'competitor-analysis-rank-insight-strip'],
  ['rank empty panel css', cssSource, 'competitor-analysis-rank-empty-panel']
];

const failures = checks
  .filter(([, source, snippet]) => !source.includes(snippet))
  .map(([name, , snippet]) => `${name}: missing ${snippet}`);

const forbiddenSnippets = [
  ['standalone changes row action', 'aria-label="变化"'],
  ['standalone changes modal state', 'changeOpen'],
  ['mock fallback builder', 'buildMockProductChanges'],
  ['mock change id', 'mock-change'],
  ['collapsed change rank counter', 'competitor-analysis-product-change-rank-more'],
  ['hidden change rank count', 'hiddenCount'],
  ['mock qili product name', 'QiLi 30 Pcs Wooden HB Pencils'],
  ['mock slim case product name', 'Slim Light Trifold Stand Case Cover']
];

const forbiddenFailures = forbiddenSnippets
  .filter(([, snippet]) => pageSource.includes(snippet))
  .map(([name, snippet]) => `${name}: forbidden ${snippet}`);

if (failures.length || forbiddenFailures.length) {
  console.error([...failures, ...forbiddenFailures].join('\n'));
  process.exit(1);
}

console.log('Competitor analysis product changes UI contract passed.');
