import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const typesPath = path.join(rootDir, 'src/features/competitor-analysis/types.ts');

const readSources = (paths) => paths.map((filePath) => fs.readFileSync(path.join(rootDir, filePath), 'utf8')).join('\n');
const pageSource = readSources([
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'src/features/competitor-analysis/CompetitorProductListCells.tsx',
  'src/features/competitor-analysis/productList/CompetitorProductListTab.tsx',
  'src/features/competitor-analysis/productList/CompetitorProductTable.tsx',
  'src/features/competitor-analysis/productList/productListFilters.ts'
]);
const apiSource = readSources([
  'src/features/competitor-analysis/api/backendContracts.ts',
  'src/features/competitor-analysis/api/contracts.ts',
  'src/features/competitor-analysis/api/watchProductMapper.ts',
  'src/features/competitor-analysis/api/watchProductTransport.ts'
]);
const typesSource = fs.readFileSync(typesPath, 'utf8');
const cssSource = readSources([
  'src/features/competitor-analysis/CompetitorAnalysisPage.css',
  ...fs.readdirSync(path.join(rootDir, 'src/features/competitor-analysis/styles'))
    .filter((fileName) => fileName.endsWith('.css'))
    .map((fileName) => `src/features/competitor-analysis/styles/${fileName}`)
]);
const baselineSource = readSources([
  'src/features/product-baseline/ProductBaselineDisplay.tsx',
  'src/features/product-baseline/ProductBaselineIdentity.tsx'
]);

const checks = [
  ['product list code helper', pageSource, 'productListIdentityCodes(product)'],
  ['backend empty message is hidden', fs.readFileSync(path.join(rootDir, 'src/shared/api.ts'), 'utf8'), "messageText === 'No message available'"],
  ['watch product titleCn type', typesSource, 'titleCn?: string'],
  ['backend titleCn field mapping', apiSource, 'titleCn?: string'],
  ['mapped titleCn value', apiSource, 'titleCn:'],
  ['zero confirmed query type', apiSource, 'confirmedCompetitorCountZero?: boolean'],
  ['zero pending query type', apiSource, 'pendingCandidateCountZero?: boolean'],
  ['zero confirmed api param', apiSource, "appendBooleanParam(params, 'confirmedCompetitorCountZero'"],
  ['zero pending api param', apiSource, "appendBooleanParam(params, 'pendingCandidateCountZero'"],
  ['zero confirmed filter state', pageSource, 'monitorZeroOnly'],
  ['zero pending filter state', pageSource, 'candidateZeroOnly'],
  ['filter dropdown placeholder', pageSource, '筛选'],
  ['zero count filter dropdown class', pageSource, 'competitor-analysis-zero-filter-select'],
  ['filter dropdown test id', pageSource, 'competitor-analysis-filter-select'],
  ['zero confirmed filter label', pageSource, '监控为0'],
  ['zero pending filter label', pageSource, '候选为0'],
  ['product bilingual title helper', pageSource, 'productTitleLines(product)'],
  ['product title cn class', cssSource, 'competitor-analysis-product-title-cn'],
  ['product title en class', cssSource, 'competitor-analysis-product-title-en'],
  ['shared identity subtitle prop', baselineSource, 'subtitle?: ReactNode'],
  ['candidate count narrow column', pageSource, 'width: 96'],
  ['candidate count centered stack', cssSource, 'justify-items: center'],
  ['candidate count centered row', cssSource, 'justify-content: center'],
  ['keyword links stay visible', pageSource, 'competitor-analysis-keyword-link'],
  ['keyword text stays visible', pageSource, 'competitor-analysis-keyword-text'],
  ['zero-monitor keywords collapse from the inline list', pageSource, 'keyword.monitoredCount !== 0'],
  ['collapsed keywords keep a visible count', pageSource, 'hiddenKeywordCount'],
  ['collapsed keyword count class', pageSource, 'competitor-analysis-keyword-other-tag']
];

const failures = checks
  .filter(([, source, snippet]) => !source.includes(snippet))
  .map(([name, , snippet]) => `${name}: missing ${snippet}`);

const forbiddenSnippets = [
  ['baseline count helper text', pageSource, '已筛选 {productTotal} 个商品基线'],
  ['auto enable helper text', pageSource, '行内操作会自动启用竞品分析对象'],
  ['old zero count checkbox wrapper', pageSource, 'competitor-analysis-zero-filters'],
  ['old per-keyword monitored label', pageSource, '监控 ${keyword.monitoredCount ?? 0}'],
  ['old bare per-keyword count class', pageSource, 'competitor-analysis-keyword-link-count'],
  ['old bare per-keyword count css', cssSource, '.competitor-analysis-keyword-link-count'],
  ['old monitored count css', cssSource, '.competitor-analysis-keyword-monitor-count']
];

const forbiddenFailures = forbiddenSnippets
  .filter(([, source, snippet]) => source.includes(snippet))
  .map(([name, , snippet]) => `${name}: forbidden ${snippet}`);

if (failures.length || forbiddenFailures.length) {
  console.error([...failures, ...forbiddenFailures].join('\n'));
  process.exit(1);
}

console.log('Competitor analysis list UI contract passed.');
