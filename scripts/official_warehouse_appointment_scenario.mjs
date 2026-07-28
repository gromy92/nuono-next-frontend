import {
  assert,
  isInboundAsn
} from './official_warehouse_stock_smoke_support.mjs'

export async function verifyOfficialWarehouseAppointmentScenario(page, appointmentPageUrl) {
  const appointmentWorkbenchTab = page.getByRole('tab', { name: 'Noon官方仓' })
  await appointmentWorkbenchTab.click()
  await page.waitForSelector('text=创建 ASN', { timeout: 15000 })
  const embeddedAppointmentBody = await page.locator('body').innerText()
  assert(embeddedAppointmentBody.includes('约仓历史'), 'stock page Noon official warehouse tab should embed appointment history entry')
  assert(embeddedAppointmentBody.includes('同步 ASN 列表'), 'stock page Noon official warehouse tab should embed ASN sync entry')
  assert(embeddedAppointmentBody.includes('创建 ASN'), 'stock page Noon official warehouse tab should embed ASN creation entry')
  assert(!embeddedAppointmentBody.includes('失败信息'), 'appointment ASN table should not keep the old failure-only column title')
  const asnListResponse = await page.request.get(
    'http://127.0.0.1:18084/api/warehouse/official-warehouse/asns?storeCode=STR108065-NSA&siteCode=SA&page=1&perPage=3',
    { headers: { 'X-Nuono-Dev-Session-User-Id': '307' } }
  )
  const asnRows = await asnListResponse.json()
  const firstAsn = Array.isArray(asnRows) ? asnRows[0] : undefined
  assert(firstAsn?.noonAsnNr, 'ASN API should provide a first ASN for appointment table checks')
  const completedAsn = Array.isArray(asnRows)
    ? asnRows.find((row) => isInboundAsn(row))
    : undefined
  assert(completedAsn?.noonAsnNr, 'ASN API should provide an inbound ASN for inbound-only action checks')
  const scheduledPendingInboundAsn = Array.isArray(asnRows)
    ? asnRows.find((row) => row.appointment?.status === 'SCHEDULED' && !isInboundAsn(row))
    : undefined
  const expiredAsn = Array.isArray(asnRows)
    ? asnRows.find((row) => String(row.noonAsnStatus || '').toLowerCase() === 'expired')
    : undefined
  if (expiredAsn?.noonAsnNr) {
    assert(
      (await page.locator('.official-warehouse-page .ant-table-tbody .ant-table-row', { hasText: expiredAsn.noonAsnNr }).count()) === 0,
      'expired ASN should be hidden from the default appointment table'
    )
  }
  assert(
    (await page.getByRole('columnheader', { name: '状态' }).count()) > 0,
    'appointment ASN table should rename appointment column to status'
  )
  assert(
    (await page.getByRole('columnheader', { name: '约仓', exact: true }).count()) === 0,
    'appointment ASN table should not keep appointment wording as the status column title'
  )
  assert(
    (await page.getByRole('columnheader', { name: '货量 / 路由仓' }).count()) > 0,
    'appointment ASN table should merge quantity and routing warehouse into one column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '货量', exact: true }).count()) === 0,
    'appointment ASN table should not keep standalone quantity column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '路由仓', exact: true }).count()) === 0,
    'appointment ASN table should not keep standalone routing warehouse column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '入仓详情', exact: true }).count()) === 0,
    'appointment ASN table should not show inbound detail overview column'
  )
  const embeddedAppointmentTableBox = await page.locator('.official-warehouse-asn-table .ant-table').first().boundingBox()
  const embeddedAppointmentLastHeaderBox = await page.getByRole('columnheader', { name: '操作' }).first().boundingBox()
  assert(
    embeddedAppointmentTableBox &&
      embeddedAppointmentLastHeaderBox &&
      embeddedAppointmentLastHeaderBox.x + embeddedAppointmentLastHeaderBox.width >=
        embeddedAppointmentTableBox.x + embeddedAppointmentTableBox.width - 30,
    'embedded appointment ASN table columns should fill the table panel width'
  )
  const appointmentTableLayout = await page.locator('.official-warehouse-page').last().evaluate((root, scheduledAsnNo) => {
    const visible = (element) => {
      const box = element.getBoundingClientRect()
      return box.width > 0 && box.height > 0
    }
    const headers = Array.from(root.querySelectorAll('.ant-table-thead th')).filter(visible)
    const headerWidths = Object.fromEntries(
      headers.map((header) => [header.textContent?.trim() || '', header.getBoundingClientRect().width])
    )
    const scheduledRow = Array.from(root.querySelectorAll('.ant-table-tbody .ant-table-row'))
      .filter(visible)
      .find((row) => row.textContent?.includes(scheduledAsnNo || ''))
    const statusCell = scheduledRow
      ? Array.from(scheduledRow.querySelectorAll('td')).filter(visible)[2]
      : undefined
    const statusTag = statusCell?.querySelector('.ant-tag')
    return {
      asnWidth: headerWidths['ASN / 状态'] || 0,
      quantityWidth: headerWidths['货量 / 路由仓'] || 0,
      statusWidth: headerWidths['状态'] || 0,
      statusCellWidth: statusCell?.getBoundingClientRect().width || 0,
      statusTagWidth: statusTag?.getBoundingClientRect().width || 0
    }
  }, scheduledPendingInboundAsn?.noonAsnNr || '')
  assert(appointmentTableLayout.asnWidth <= 180, 'ASN/status column should stay compact')
  assert(appointmentTableLayout.quantityWidth <= 150, 'quantity/routing column should stay compact')
  assert(appointmentTableLayout.statusWidth <= 210, 'appointment status column should stay compact')
  assert(
    appointmentTableLayout.statusTagWidth > 0 &&
      appointmentTableLayout.statusTagWidth < appointmentTableLayout.statusCellWidth * 0.6,
    'appointment status tag should size to its text instead of stretching to the whole cell'
  )
  if (scheduledPendingInboundAsn?.noonAsnNr) {
    const scheduledPendingInboundRow = page.locator('.official-warehouse-page .ant-table-tbody .ant-table-row', {
      hasText: scheduledPendingInboundAsn.noonAsnNr
    }).first()
    await scheduledPendingInboundRow.waitFor({ state: 'visible', timeout: 5000 })
    const scheduledPendingInboundText = await scheduledPendingInboundRow.innerText()
    assert(scheduledPendingInboundText.includes('约仓成功'), 'scheduled ASN without inbound result should show scheduled status')
    assert(!scheduledPendingInboundText.includes('待约仓'), 'scheduled ASN without inbound result should not fall back to Noon sealed status')
    assert(scheduledPendingInboundText.includes('送仓时间：'), 'scheduled ASN without inbound result should label delivery time')
    const deliveryTimeColor = await scheduledPendingInboundRow.locator('.official-warehouse-delivery-time').first().evaluate((element) =>
      getComputedStyle(element).color
    )
    assert(deliveryTimeColor === 'rgb(102, 102, 102)', 'delivery time label should use #666')
  }
  const completedAsnTableRow = page.locator('.official-warehouse-page .ant-table-tbody .ant-table-row', { hasText: completedAsn.noonAsnNr }).first()
  await completedAsnTableRow.waitFor({ state: 'visible', timeout: 5000 })
  const completedAsnRowText = await completedAsnTableRow.innerText()
  assert(!completedAsnRowText.includes('查看右侧入仓概况'), 'status column should not show helper copy for inbound rows')
  assert(!completedAsnRowText.includes('0 SKU'), 'quantity/routing column should not show misleading zero SKU count')
  assert(!completedAsnRowText.includes(completedAsn.selectedWarehouseCode), 'quantity/routing column should not show internal Noon warehouse code')
  assert(
    (await completedAsnTableRow.locator('.official-warehouse-inbound-overview').count()) === 0,
    'completed ASN row should not render inbound overview behind the detail button'
  )
  const firstAsnActions = await completedAsnTableRow.locator('.official-warehouse-actions').innerText()
  assert(firstAsnActions.includes('入仓详情'), 'completed ASN should expose inbound detail action')
  assert(!firstAsnActions.includes('下载 PDF'), 'completed ASN should not show appointment PDF action')
  assert(!firstAsnActions.includes('手动约仓'), 'completed ASN should not show manual appointment action')
  assert(!firstAsnActions.includes('自动约仓'), 'completed ASN should not show auto appointment action')
  assert(
    (await page.getByRole('tab', { name: '约仓操作' }).count()) === 0,
    'stock page Noon official warehouse tab should not add an appointment operation sub-tab'
  )
  assert(
    (await page.getByRole('tab', { name: '入仓单视角' }).count()) === 0,
    'stock page Noon official warehouse tab should not expose inbound-order perspective as a sub-tab'
  )
  await completedAsnTableRow.getByRole('button', { name: '入仓详情' }).click()
  const embeddedDrawer = page.locator('.ant-drawer-content').last()
  await embeddedDrawer.waitFor({ state: 'visible', timeout: 5000 })
  await embeddedDrawer.getByText('入仓详情', { exact: true }).waitFor({ state: 'visible', timeout: 15000 })
  const embeddedDetailText = await embeddedDrawer.innerText()
  assert(embeddedDetailText.includes('入仓状态'), 'embedded appointment ASN detail should show inbound stage')
  assert(embeddedDetailText.includes('件数'), 'embedded appointment ASN detail should show inbound quantity')
  assert(embeddedDetailText.includes('Noon仓'), 'embedded appointment ASN detail should show Noon warehouse')
  assert(embeddedDetailText.includes('Noon状态'), 'embedded appointment ASN detail should show Noon ASN status')
  assert(!embeddedDetailText.includes('可选到达仓库'), 'embedded appointment ASN detail should not show optional arrival warehouses')
  assert(!embeddedDetailText.includes('到达仓库'), 'embedded appointment ASN detail summary should not show arrival warehouse')
  assert(!embeddedDetailText.includes('0 SKU'), 'embedded appointment ASN detail should not show misleading zero SKU count')
  if (completedAsn.selectedWarehouseCode) {
    assert(!embeddedDetailText.includes(completedAsn.selectedWarehouseCode), 'embedded appointment ASN detail should not show internal Noon warehouse code')
  }
  await page.keyboard.press('Escape')

  await page.goto(appointmentPageUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('text=创建 ASN', { timeout: 15000 })
  const standaloneAppointmentBody = await page.locator('body').innerText()
  assert(standaloneAppointmentBody.includes('约仓历史'), 'standalone Noon official warehouse page should keep appointment history entry')
  assert(standaloneAppointmentBody.includes('同步 ASN 列表'), 'standalone Noon official warehouse page should keep ASN sync entry')
  assert(
    (await page.getByRole('tab', { name: '库存核对' }).count()) === 0,
    'standalone Noon official warehouse page should not inherit stock page outer tabs'
  )
  assert(
    (await page.getByRole('tab', { name: '入仓单视角' }).count()) === 0,
    'standalone Noon official warehouse page should not inherit embedded inbound-order perspective tab'
  )
  await page.getByRole('button', { name: '入仓详情' }).first().click()
  const standaloneDrawer = page.locator('.ant-drawer-content').last()
  await standaloneDrawer.waitFor({ state: 'visible', timeout: 5000 })
  await standaloneDrawer.getByText('入仓详情', { exact: true }).waitFor({ state: 'visible', timeout: 15000 })
  const standaloneDetailText = await standaloneDrawer.innerText()
  assert(standaloneDetailText.includes('入仓状态'), 'standalone appointment ASN detail should show inbound stage')
  assert(standaloneDetailText.includes('件数'), 'standalone appointment ASN detail should show inbound quantity')
  assert(standaloneDetailText.includes('Noon仓'), 'standalone appointment ASN detail should show Noon warehouse')
  assert(!standaloneDetailText.includes('可选到达仓库'), 'standalone appointment ASN detail should not show optional arrival warehouses')
  assert(!standaloneDetailText.includes('到达仓库'), 'standalone appointment ASN detail summary should not show arrival warehouse')
  assert(!standaloneDetailText.includes('0 SKU'), 'standalone appointment ASN detail should not show misleading zero SKU count')
}
