import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import {
  baseUrl,
  CLEAN_SKU_PARENT,
  executablePath,
  SCREENSHOT_DIR
} from './product_management_acceptance_config.mjs'
import {
  restoreCleanProductBaseline,
  verifyClassificationOptionsApi,
  verifyTranslateApi
} from './product_management_acceptance_api.mjs'
import {
  verifyContentTab,
  verifyGroupsTab,
  verifyOfferTab,
  verifyProductInsightsTab,
  verifyPublishBoundary,
  verifySizesTab,
  verifySwitchConfirm
} from './product_management_detail_scenarios.mjs'
import { verifyProductManagementListScenario } from './product_management_list_scenario.mjs'
import { openCleanDetail } from './product_management_acceptance_support.mjs'

let currentStep = 'bootstrap'

async function step(name, action) {
  currentStep = name
  return action()
}

mkdirSync(SCREENSHOT_DIR, { recursive: true })
const browser = await chromium.launch({ executablePath, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })
page.setDefaultTimeout(15000)

const pageErrors = []
const apiFailures = []
page.on('pageerror', (error) => pageErrors.push(`[${currentStep}] ${error.stack || error.message}`))
page.on('response', (response) => {
  const url = response.url()
  if (url.includes('/api/product-master') && response.status() >= 400) {
    apiFailures.push(`${response.status()} ${url}`)
  }
})

try {
  const aiTranslationAvailable = await step('translation-api', () => verifyTranslateApi())
  await step('classification-options-api', () => verifyClassificationOptionsApi())
  await step('restore-clean-baseline-before', () => restoreCleanProductBaseline())
  await page.goto(`${baseUrl}/product/manage?devSession=1`, { waitUntil: 'domcontentloaded' })
  const listResult = await step('list', () => verifyProductManagementListScenario(page))
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-list.png') })

  await step('open-detail', () => openCleanDetail(page, CLEAN_SKU_PARENT))
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-detail-offer.png') })

  await step('offer', () => verifyOfferTab(page))
  await step('content', () => verifyContentTab(page, aiTranslationAvailable))
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-detail-content.png') })
  await step('sizes', () => verifySizesTab(page))
  await step('groups', () => verifyGroupsTab(page))
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-detail-groups.png') })
  await step('product-insights', () => verifyProductInsightsTab(page))
  await step('unsaved-switch-confirm', () => verifySwitchConfirm(page))
  await step('publish-boundary', () => verifyPublishBoundary(page))

  assert.deepEqual(pageErrors, [], `页面运行时异常：${pageErrors.join('\n')}`)
  assert.deepEqual(apiFailures, [], `商品接口失败：${apiFailures.join('\n')}`)

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    skuParent: CLEAN_SKU_PARENT,
    screenshotDir: SCREENSHOT_DIR,
    listResult,
    checks: [
      'list-layout',
      'list-search',
      'gallery',
      'history',
      'offer',
      'content',
      'classification-options-api',
      'image-manager',
      'sizes',
      'groups',
      'product-insights',
      'unsaved-switch-confirm',
      'publish-boundary'
    ]
  }, null, 2))
} finally {
  try {
    await restoreCleanProductBaseline()
  } catch (error) {
    console.warn(`清理商品草稿失败：${error instanceof Error ? error.message : String(error)}`)
  }
  await browser.close()
}
