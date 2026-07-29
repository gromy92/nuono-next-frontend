import { chromium } from '@playwright/test'
import { verifyOfficialWarehouseAppointmentScenario } from './official_warehouse_appointment_scenario.mjs'
import { verifyOfficialWarehouseStockProductScenario } from './official_warehouse_stock_product_scenario.mjs'
import { verifyOfficialWarehouseStockSourceScenario } from './official_warehouse_stock_source_scenario.mjs'

const pageUrl =
  process.env.OFFICIAL_WAREHOUSE_STOCK_URL ||
  'http://127.0.0.1:9648/warehouse/official-warehouse-stock?devSession=1&grantWarehouse=1&devStore=STR108065-NSA&devSite=SA'
const appointmentPageUrl =
  process.env.OFFICIAL_WAREHOUSE_APPOINTMENT_URL ||
  'http://127.0.0.1:9648/warehouse/official-warehouse?devSession=1&grantWarehouse=1&devStore=STR108065-NSA&devSite=SA'
const testImageBody = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 2048, height: 900 }, deviceScaleFactor: 1 })
  await page.route('https://f.nooncdn.com/**', (route) => {
    const url = route.request().url()
    if (/https:\/\/f\.nooncdn\.com\/p\/pzsku\/.+\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(url)) {
      void route.fulfill({ status: 200, contentType: 'image/gif', body: testImageBody })
      return
    }
    void route.abort()
  })
  await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('text=商品详情', { timeout: 15000 })

  const initialBody = await verifyOfficialWarehouseStockProductScenario(page)
  await verifyOfficialWarehouseStockSourceScenario(page, initialBody)
  await verifyOfficialWarehouseAppointmentScenario(page, appointmentPageUrl)

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: pageUrl,
        checkedTabs: ['库存核对', 'Noon官方仓'],
        checkedDrawer: 'ASN入仓详情'
      },
      null,
      2
    )
  )
} finally {
  await browser.close()
}
