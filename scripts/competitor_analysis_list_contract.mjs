import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const pagePath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx');
const apiPath = path.join(rootDir, 'src/features/competitor-analysis/api.ts');
const typesPath = path.join(rootDir, 'src/features/competitor-analysis/types.ts');
const cssPath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.css');
const baselinePath = path.join(rootDir, 'src/features/product-baseline/ProductBaselineDisplay.tsx');

const pageSource = fs.readFileSync(pagePath, 'utf8');
const apiSource = fs.readFileSync(apiPath, 'utf8');
const typesSource = fs.readFileSync(typesPath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');
const baselineSource = fs.readFileSync(baselinePath, 'utf8');

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
  ['zero count filter dropdown placeholder', pageSource, '数量筛选'],
  ['zero count filter dropdown class', pageSource, 'competitor-analysis-zero-filter-select'],
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
  ['per-keyword monitored count value only', pageSource, '{keyword.monitoredCount ?? 0}'],
  ['per-keyword monitored count class', pageSource, 'competitor-analysis-keyword-monitor-count'],
  ['per-keyword monitored count css', cssSource, '.competitor-analysis-keyword-monitor-count']
];

const failures = checks
  .filter(([, source, snippet]) => !source.includes(snippet))
  .map(([name, , snippet]) => `${name}: missing ${snippet}`);

const forbiddenSnippets = [
  ['old zero count checkbox wrapper', pageSource, 'competitor-analysis-zero-filters'],
  ['old per-keyword monitored label', pageSource, '监控 ${keyword.monitoredCount ?? 0}'],
  ['old bare per-keyword count class', pageSource, 'competitor-analysis-keyword-link-count'],
  ['old bare per-keyword count css', cssSource, '.competitor-analysis-keyword-link-count']
];

const forbiddenFailures = forbiddenSnippets
  .filter(([, source, snippet]) => source.includes(snippet))
  .map(([name, , snippet]) => `${name}: forbidden ${snippet}`);

if (failures.length || forbiddenFailures.length) {
  console.error([...failures, ...forbiddenFailures].join('\n'));
  process.exit(1);
}

console.log('Competitor analysis list UI contract passed.');
