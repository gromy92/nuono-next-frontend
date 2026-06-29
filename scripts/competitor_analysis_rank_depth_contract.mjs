import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const pagePath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx');
const domainPath = path.join(rootDir, 'src/features/competitor-analysis/domain.ts');
const typesPath = path.join(rootDir, 'src/features/competitor-analysis/types.ts');

const pageSource = fs.readFileSync(pagePath, 'utf8');
const domainSource = fs.readFileSync(domainPath, 'utf8');
const typesSource = fs.readFileSync(typesPath, 'utf8');

const requiredSnippets = [
  ['default rank scan depth constant', pageSource, 'DEFAULT_RANK_SCAN_DEPTH = 100'],
  ['not-in-range formatter', pageSource, 'formatNotInRankRangeText'],
  ['rank status uses formatter', pageSource, 'formatNotInRankRangeText(rankPoint.scanDepth)'],
  ['history table uses formatter', pageSource, 'formatRankPointStatusTag(point)'],
  ['report summary passes scan depth', pageSource, 'formatSummaryRankText(summary.latestOrganicRank, summary.scanDepth)'],
  ['self report status carries scan depth', pageSource, 'scanDepth: reportScanDepth(points)'],
  ['heatmap tooltip uses scan depth formatter', pageSource, 'formatNotInRankRangeText(cell.scanDepth)'],
  ['rank summary renamed', typesSource, 'notInScanDepthCount: number'],
  ['rank summary domain count renamed', domainSource, 'notInScanDepthCount']
];

const failures = requiredSnippets
  .filter(([, source, snippet]) => !source.includes(snippet))
  .map(([name, , snippet]) => `${name}: missing ${snippet}`);

const forbiddenSnippets = [
  ['hardcoded visible top20 page copy', pageSource, '未进前20'],
  ['hardcoded visible top20 domain copy', domainSource, '未进前20'],
  ['old rank summary count name page', pageSource, 'notInTop20Count'],
  ['old rank summary count name domain', domainSource, 'notInTop20Count'],
  ['old rank summary count name type', typesSource, 'notInTop20Count'],
  ['old self report status name', pageSource, 'not_in_top_100'],
  ['old incomplete top100 copy', pageSource, '未进100']
];

const forbiddenFailures = forbiddenSnippets
  .filter(([, source, snippet]) => source.includes(snippet))
  .map(([name, , snippet]) => `${name}: forbidden ${snippet}`);

if (failures.length || forbiddenFailures.length) {
  console.error([...failures, ...forbiddenFailures].join('\n'));
  process.exit(1);
}

console.log('Competitor analysis rank depth contract passed.');
