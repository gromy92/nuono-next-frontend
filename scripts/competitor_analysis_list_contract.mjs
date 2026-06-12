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
  ['product list Chinese title helper', pageSource, 'subtitle={productChineseTitle(product)}'],
  ['product Chinese title function', pageSource, 'function productChineseTitle'],
  ['watch product titleCn type', typesSource, 'titleCn?: string'],
  ['backend titleCn field mapping', apiSource, 'titleCn?: string'],
  ['mapped titleCn value', apiSource, 'titleCn:'],
  ['shared identity subtitle prop', baselineSource, 'subtitle?: ReactNode'],
  ['candidate count narrow column', pageSource, 'width: 96'],
  ['candidate count centered stack', cssSource, 'justify-items: center'],
  ['candidate count centered row', cssSource, 'justify-content: center']
];

const failures = checks
  .filter(([, source, snippet]) => !source.includes(snippet))
  .map(([name, , snippet]) => `${name}: missing ${snippet}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Competitor analysis list UI contract passed.');
