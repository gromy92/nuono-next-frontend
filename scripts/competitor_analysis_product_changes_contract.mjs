import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const pagePath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx');
const apiPath = path.join(rootDir, 'src/features/competitor-analysis/api.ts');
const typesPath = path.join(rootDir, 'src/features/competitor-analysis/types.ts');
const cssPath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.css');

const pageSource = fs.readFileSync(pagePath, 'utf8');
const apiSource = fs.readFileSync(apiPath, 'utf8');
const typesSource = fs.readFileSync(typesPath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');

const checks = [
  ['analysis modal title', pageSource, 'title="商品分析"'],
  ['changes analysis tab', pageSource, '变化历史'],
  ['changes embedded in report modal', pageSource, 'changeGroups={changeRows}'],
  ['changes modal component', pageSource, 'ProductChangeModal'],
  ['mock fallback builder', pageSource, 'buildMockProductChanges'],
  ['timeline class', pageSource, 'competitor-analysis-product-change-timeline'],
  ['main image change wording', pageSource, '主图资产变化'],
  ['product changes api', apiSource, 'fetchCompetitorProductChanges'],
  ['product change group type', typesSource, 'CompetitorProductChangeGroup'],
  ['product change field type', typesSource, 'CompetitorProductChangeField'],
  ['changes modal css', cssSource, 'competitor-analysis-product-change-modal'],
  ['changes summary css', cssSource, 'competitor-analysis-product-change-summary-grid']
];

const failures = checks
  .filter(([, source, snippet]) => !source.includes(snippet))
  .map(([name, , snippet]) => `${name}: missing ${snippet}`);

const forbiddenSnippets = [
  ['standalone changes row action', 'aria-label="变化"'],
  ['standalone changes modal state', 'changeOpen']
];

const forbiddenFailures = forbiddenSnippets
  .filter(([, snippet]) => pageSource.includes(snippet))
  .map(([name, snippet]) => `${name}: forbidden ${snippet}`);

if (failures.length || forbiddenFailures.length) {
  console.error([...failures, ...forbiddenFailures].join('\n'));
  process.exit(1);
}

console.log('Competitor analysis product changes UI contract passed.');
