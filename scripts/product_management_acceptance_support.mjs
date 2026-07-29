import assert from 'node:assert/strict'

export function normalizeSpace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

export async function bodyText(page) {
  return normalizeSpace(await page.locator('body').innerText())
}

export async function assertBodyIncludes(page, expectedText, context) {
  const text = await bodyText(page)
  assert(text.includes(expectedText), `${context} 缺少：${expectedText}`)
}

export async function assertBodyExcludes(page, unexpectedText, context) {
  const text = await bodyText(page)
  assert(!text.includes(unexpectedText), `${context} 不应展示：${unexpectedText}`)
}

export async function expectTextAreaValue(page, label, pattern) {
  const locator = page.getByRole('textbox', { name: label, exact: true }).first()
  await locator.waitFor({ timeout: 10000 })
  await page.waitForFunction(
    ({ selectorLabel, source }) => {
      const input = [...document.querySelectorAll('textarea, input')].find(
        (item) => item.getAttribute('aria-label') === selectorLabel
      )
      return input && new RegExp(source).test(input.value)
    },
    { selectorLabel: label, source: pattern.source },
    { timeout: 15000 }
  )
}

export async function expectVisibleSelectOption(page, text) {
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last()
  await dropdown.waitFor({ timeout: 10000 })
  const dropdownText = normalizeSpace(await dropdown.innerText())
  assert(dropdownText.includes(text), `下拉候选缺少：${text}，实际：${dropdownText}`)
}

export function isBlockingIssue(issue) {
  const normalized = String(issue ?? '').trim().toLowerCase()
  return Boolean(
    normalized &&
      (
        normalized.includes('fatal') ||
        normalized.includes('reject') ||
        normalized.includes('rejection') ||
        normalized.includes('blocked') ||
        normalized.includes('qc_failed') ||
        normalized.includes('not_approved') ||
        normalized.includes('不通过') ||
        normalized.includes('驳回')
      )
  )
}

function addIssueTag(target, issueTag) {
  if (issueTag && !target.includes(issueTag)) target.push(issueTag)
}

function numericValue(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

export function listIssueTags(item) {
  const issues = []
  for (const issue of item.issueTags ?? []) addIssueTag(issues, String(issue ?? '').trim())
  if (!String(item.offerCode ?? '').trim()) addIssueTag(issues, 'no_offer')
  if (!String(item.referencePrice ?? '').trim() || numericValue(item.referencePrice) <= 0) {
    addIssueTag(issues, 'valid_price')
  }
  if (numericValue(item.totalFbnStock) + numericValue(item.totalFbpStock) <= 0) addIssueTag(issues, 'stock_check')
  if (!String(item.title ?? '').trim()) addIssueTag(issues, 'title_missing')
  if (!String(item.productFulltype ?? '').trim()) addIssueTag(issues, '类目待复核')
  return issues
}

export async function waitForListReady(page) {
  await page.getByPlaceholder('搜索 PSKU / SKU / 商品编码').waitFor({ timeout: 20000 })
  await page.locator('.ant-table-row').first().waitFor({ timeout: 20000 })
}

export async function clickButton(page, name, options = {}) {
  await page.getByRole('button', { name }).first().click(options)
}

export async function closeModal(page) {
  const modal = page.locator('.ant-modal-wrap:visible').last()
  if (!(await modal.count())) return
  const close = modal.locator('.ant-modal-close').first()
  if (await close.count()) await close.click()
  else await page.keyboard.press('Escape')
  await modal.waitFor({ state: 'hidden', timeout: 15000 })
}

export async function closeDrawer(page) {
  const drawer = page.locator('.ant-drawer-content-wrapper:visible').last()
  if (!(await drawer.count())) return
  const close = drawer.locator('.ant-drawer-close').first()
  if (await close.count()) await close.click()
  else await page.keyboard.press('Escape')
  await drawer.waitFor({ state: 'hidden', timeout: 15000 })
}

export async function searchBy(page, placeholder, value) {
  await page.getByRole('button', { name: '重置' }).first().click()
  await waitForListReady(page)
  await page.getByPlaceholder(placeholder).fill(value)
  await clickButton(page, '搜索')
  await page.locator('.ant-table-row').first().waitFor({ timeout: 20000 })
}

export async function cleanRow(page, cleanSkuParent) {
  const row = page.locator('.ant-table-row', { hasText: cleanSkuParent }).first()
  await row.waitFor({ timeout: 20000 })
  return row
}

export async function openCleanDetail(page, cleanSkuParent) {
  await searchBy(page, '搜索 PSKU / SKU / 商品编码', cleanSkuParent)
  const row = await cleanRow(page, cleanSkuParent)
  await row.getByRole('button', { name: '查看详情' }).first().click()
  await page.getByRole('button', { name: '发布当前修改' }).waitFor({ timeout: 25000 })
  await page.getByRole('tab', { name: /Offer/ }).waitFor({ timeout: 15000 })
}
