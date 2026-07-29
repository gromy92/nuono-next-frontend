import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const featurePath = (...parts: string[]) => path.join(
  process.cwd(),
  'src/features/product-image-profile',
  ...parts
)
const readFeatureSource = (...files: string[]) => files
  .map((file) => fs.readFileSync(featurePath(file), 'utf8'))
  .join('\n')

const apiSource = readFeatureSource('apiTypes.ts', 'profileApi.ts')
const pageSource = readFeatureSource(
  'ProductImageProfilePage.tsx',
  'ProductImageProfileTabs.tsx',
  'ProductImageSystemImage.tsx',
  'useProductImageProfileData.ts'
)
const sidebarSource = readFeatureSource('ProductImageProfileSidebar.tsx', 'profileSummaryStatus.ts')

assert.equal(
  apiSource.includes('ProductImageProfileSummaryView'),
  true,
  'product image list API must expose lightweight summary rows'
)
assert.equal(
  apiSource.includes('fetchProductImageProfileSummaries'),
  true,
  'product image page must fetch summaries instead of full profile details for the sidebar list'
)
assert.equal(
  apiSource.includes('fetchProductImageProfileDetail'),
  true,
  'product image page must load the selected profile detail on demand'
)
assert.equal(
  pageSource.includes('fetchProductImageProfileSummaries'),
  true,
  'page must use the summary endpoint for initial load'
)
assert.equal(
  pageSource.includes('fetchProductImageProfileDetail'),
  true,
  'page must fetch full assets/sections/suites only for the selected profile'
)
assert.equal(
  sidebarSource.includes('productProfileVirtualWindow'),
  true,
  'sidebar profile list must use virtual windowing instead of rendering every PSKU card'
)
assert.equal(
  apiSource.includes('profileReadinessStatus') && apiSource.includes('missingProfileFields'),
  true,
  'profile summaries must expose the backend readiness decision and actionable missing fields'
)
assert.equal(
  apiSource.includes('imageStatus') && apiSource.includes('activeSuiteCount'),
  true,
  'profile summaries must expose the aggregated image workflow status and active suite count'
)
assert.equal(
  sidebarSource.includes('readinessFilter') && sidebarSource.includes('imageStatusFilter'),
  true,
  'sidebar must provide independent profile readiness and image status filters'
)
assert.equal(
  sidebarSource.includes('资料完整') && sidebarSource.includes('待补充'),
  true,
  'sidebar must display the two agreed profile readiness labels'
)
assert.equal(
  sidebarSource.includes('需处理') && sidebarSource.includes('待确认') && sidebarSource.includes('已上线'),
  true,
  'sidebar must display operator-facing aggregated image statuses'
)
assert.equal(
  pageSource.includes('useNearViewportEnabled'),
  true,
  'sidebar thumbnails must not request image URLs until the row is near the viewport'
)
assert.equal(
  pageSource.includes('loading="lazy"'),
  true,
  'image tags must opt into browser lazy loading'
)
assert.equal(
  pageSource.includes("style={{ display: loaded ? undefined : 'none' }}"),
  false,
  'lazy images must not be display:none before onLoad because that can prevent the browser from starting the image request'
)
assert.equal(
  pageSource.includes("style={{ visibility: loaded ? undefined : 'hidden' }}"),
  true,
  'lazy images should keep their layout box visible while the fallback is shown'
)
assert.equal(
  pageSource.includes('fetchPriority={fetchPriority}'),
  true,
  'low-priority sidebar thumbnails should not compete with detail content'
)
assert.equal(
  pageSource.includes("useState<ProductImageProfileTabKey>('assets')"),
  true,
  'product image detail should default to the first tab on page entry'
)
assert.equal(
  pageSource.includes('activeKey={activeKey}'),
  true,
  'product image detail tabs must be controlled so inactive tab content can stay unmounted'
)
assert.equal(
  pageSource.includes("children: activeKey === 'suites' ?"),
  true,
  'AI suite thumbnails should only mount after the suite tab is opened'
)
