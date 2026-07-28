import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export const CLEAN_SKU_PARENT = process.env.PRODUCT_10_SKU_PARENT ?? 'ZF116A45C167EB04BD58CZ'
export const CLEAN_PARTNER_SKU = process.env.PRODUCT_10_PARTNER_SKU ?? 'MILKYWAYA15'
export const CURRENT_SITE_LIVE_PARTNER_SKU = process.env.PRODUCT_10_CURRENT_SITE_LIVE_PARTNER_SKU ?? 'MILKYWAYA02'
export const CLEAN_TITLE_QUERY = process.env.PRODUCT_10_TITLE_QUERY ?? 'Astronaut'
export const CLEAN_BRAND_QUERY = process.env.PRODUCT_10_BRAND_QUERY ?? 'milkyway'
export const OWNER_USER_ID = Number(process.env.PRODUCT_10_OWNER_USER_ID ?? 10002)
export const STORE_CODE = process.env.PRODUCT_10_STORE_CODE ?? 'STR245027-NAE'
export const SCREENSHOT_DIR = process.env.PRODUCT_10_SCREENSHOT_DIR
  ?? path.resolve(process.cwd(), '../../output_images/product-management-10')

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean)

export const executablePath = browserCandidates.find((candidate) => existsSync(candidate))
if (!executablePath) throw new Error('未找到可用浏览器，请设置 PLAYWRIGHT_CHROMIUM_PATH。')

async function resolveBaseUrl() {
  if (process.env.PRODUCT_10_BASE_URL) return process.env.PRODUCT_10_BASE_URL.replace(/\/$/, '')
  const candidates = ['http://127.0.0.1:9620', 'http://localhost:9620', 'http://127.0.0.1:4173']
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/product/manage?devSession=1`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(1500)
      })
      if (response.ok) return candidate
    } catch {
      // Try the next known frontend port.
    }
  }
  return candidates[0]
}

export const baseUrl = await resolveBaseUrl()
