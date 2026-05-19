import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_API_BASE = 'http://127.0.0.1:18080';
const DEFAULT_EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const SCENARIOS = [
  {
    key: 'missing-specs',
    candidateId: 43004,
    title: '充电发香器 头发衣物熏香款',
    expectedCardText: '待补：长度 / 宽度 / 高度',
    expectedAlertText: '待补字段：长度 / 宽度 / 高度',
    expectedRetainedText: '已保留字段： 目标站点 / 目标售价 / 采购单价 / 重量',
    expectedFormValues: {
      salePrice: '16.00',
      purchasePrice: '14.20',
      lengthCm: '',
      widthCm: '',
      heightCm: '',
      weightGrams: '280.00'
    }
  },
  {
    key: 'missing-weight',
    candidateId: 43005,
    title: '便携式充电电熏香炉 轻奢礼品款',
    expectedCardText: '待补：重量',
    expectedAlertText: '待补字段：重量',
    expectedRetainedText: '已保留字段： 目标站点 / 目标售价 / 采购单价 / 长度 / 宽度 / 高度',
    expectedFormValues: {
      salePrice: '16.00',
      purchasePrice: '14.85',
      lengthCm: '18.00',
      widthCm: '8.00',
      heightCm: '8.00',
      weightGrams: ''
    }
  }
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    apiBase: DEFAULT_API_BASE,
    executablePath: DEFAULT_EXECUTABLE_PATH,
    artifactDir: path.resolve(process.cwd(), `../../tmp-profit-pending-page-smoke-${new Date().toISOString().replace(/[:]/g, '-')}`)
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--base-url' && next) {
      options.baseUrl = next;
      index += 1;
    } else if (token === '--api-base' && next) {
      options.apiBase = next;
      index += 1;
    } else if (token === '--executable-path' && next) {
      options.executablePath = next;
      index += 1;
    } else if (token === '--artifact-dir' && next) {
      options.artifactDir = path.resolve(next);
      index += 1;
    }
  }

  return options;
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseNumberRange(rawValue) {
  if (!rawValue) {
    return { min: null, max: null };
  }
  const matchedNumbers = rawValue.match(/\d+(?:\.\d+)?/g);
  if (!matchedNumbers?.length) {
    return { min: null, max: null };
  }
  const numbers = matchedNumbers.map(Number).filter((item) => Number.isFinite(item));
  if (!numbers.length) {
    return { min: null, max: null };
  }
  return {
    min: numbers[0] ?? null,
    max: numbers.length > 1 ? numbers[1] ?? numbers[0] : numbers[0]
  };
}

function midpointPrice(min, max) {
  if (typeof min === 'number' && typeof max === 'number') {
    return Number(((min + max) / 2).toFixed(2));
  }
  if (typeof min === 'number') {
    return Number(min.toFixed(2));
  }
  if (typeof max === 'number') {
    return Number(max.toFixed(2));
  }
  return undefined;
}

function collectCandidateTexts(candidate) {
  const texts = [
    candidate?.title,
    candidate?.standardizedPriceText,
    candidate?.priceText,
    candidate?.resultCardText,
    candidate?.detailHighlightText,
    candidate?.attributeSnapshotText,
    candidate?.shippingSnapshotText,
    candidate?.packageSnapshotText,
    candidate?.standardizedSizeText,
    candidate?.sizeText,
    candidate?.standardizedPackageText,
    candidate?.packageText,
    candidate?.standardizedDeliveryText,
    candidate?.deliveryTimelineText,
    candidate?.materialText,
    candidate?.powerModeText,
    ...(candidate?.reasons || []),
    ...(candidate?.warnings || []),
    ...(candidate?.badges || []),
    ...((candidate?.extractionEvidences || []).flatMap((item) => [item?.fieldValue, item?.evidenceText]))
  ];
  return texts.filter((item) => typeof item === 'string' && item.trim());
}

function parseDimensions(texts) {
  for (const text of texts) {
    const normalized = text.replace(/[×X*]/g, 'x');
    const matched = normalized.match(
      /(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?/i
    );
    if (matched) {
      return {
        lengthCm: Number(matched[1]),
        widthCm: Number(matched[2]),
        heightCm: Number(matched[3]),
        sourceText: text
      };
    }
  }
  return null;
}

function parseWeightGrams(texts) {
  for (const text of texts) {
    const matched = text.match(/(\d+(?:\.\d+)?)\s*(kg|公斤|千克|g|克)\b/i);
    if (!matched) {
      continue;
    }
    const numericValue = Number(matched[1]);
    if (!Number.isFinite(numericValue)) {
      continue;
    }
    const unit = matched[2].toLowerCase();
    return unit === 'kg' || unit === '公斤' || unit === '千克'
      ? Number((numericValue * 1000).toFixed(2))
      : Number(numericValue.toFixed(2));
  }
  return undefined;
}

function findScenarioCandidates(candidatePool) {
  const demandItem = (candidatePool.demandItems || []).find((item) => item.id === 41002);
  if (!demandItem) {
    throw new Error('candidate-pool missing demand item 41002');
  }

  return SCENARIOS.map((scenario) => {
    const candidate = (demandItem.candidates || []).find((item) => item.id === scenario.candidateId);
    if (!candidate) {
      throw new Error(`candidate-pool missing candidate ${scenario.candidateId}`);
    }
    const candidatePriceRange = parseNumberRange(candidate.standardizedPriceText || candidate.priceText);
    const texts = collectCandidateTexts(candidate);
    const dimensions = parseDimensions(texts);
    const weightGrams = parseWeightGrams(texts);
    return {
      scenario,
      demandItem,
      candidate,
      salePrice: midpointPrice(demandItem.targetPriceMin, demandItem.targetPriceMax),
      purchasePrice: midpointPrice(candidatePriceRange.min, candidatePriceRange.max),
      dimensions,
      weightGrams,
      collectedTexts: texts
    };
  });
}

function expectedMissingFields(snapshot) {
  const missing = [];
  if (!snapshot.dimensions) {
    missing.push('lengthCm', 'widthCm', 'heightCm');
  }
  if (typeof snapshot.weightGrams !== 'number') {
    missing.push('weightGrams');
  }
  return missing;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${options?.method || 'GET'} ${url} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function runScenario(browser, session, config, scenarioSnapshot, artifactDir) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 2400 }
  });
  await context.addInitScript((sessionValue) => {
    window.localStorage.setItem('nuono-next-session', JSON.stringify(sessionValue));
  }, session);

  const page = await context.newPage();
  await page.goto(config.baseUrl, { waitUntil: 'networkidle' });
  await page.locator('li').filter({ hasText: /^采购单$/ }).first().click();
  await page.getByText('采购 / 采购单').waitFor({ timeout: 15000 });

  const candidateCardHandle = await page.evaluateHandle(({ title, expectedCardText }) => {
    const normalized = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
    const matches = [...document.querySelectorAll('div')]
      .filter((div) => {
        const text = normalized(div.innerText);
        return text.includes(title)
          && text.includes(expectedCardText)
          && text.includes('快速利润信号')
          && text.includes('打开候选页')
          && (text.includes('查看对比') || text.includes('正在对比'))
          && (text.includes('选为意向采购') || text.includes('已是意向采购'));
      })
      .sort((left, right) => normalized(left.innerText).length - normalized(right.innerText).length);
    return matches[0] || null;
  }, {
    title: scenarioSnapshot.scenario.title,
    expectedCardText: scenarioSnapshot.scenario.expectedCardText
  });

  const candidateCard = candidateCardHandle.asElement();
  if (!candidateCard) {
    throw new Error(`candidate card not found for ${scenarioSnapshot.scenario.title}`);
  }

  const cardText = normalizeText(await candidateCard.evaluate((node) => node.innerText));
  if (!cardText.includes(scenarioSnapshot.scenario.expectedCardText)) {
    throw new Error(`candidate card mismatch for ${scenarioSnapshot.scenario.key}: ${cardText}`);
  }

  const isCurrentCompare = cardText.includes('当前对比中');
  if (!isCurrentCompare) {
    await candidateCard.evaluate((node) => {
      const button = [...node.querySelectorAll('button')].find((item) => {
        const text = String(item.textContent ?? '').trim();
        return text === '查看对比' || text === '正在对比';
      });
      button?.click();
    });
    await page.waitForFunction((title) => {
      const normalized = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
      return [...document.querySelectorAll('div')].some((div) => {
        const text = normalized(div.innerText);
        return text.includes(title) && text.includes('当前对比中') && text.includes('快速利润信号');
      });
    }, scenarioSnapshot.scenario.title);
  }

  const candidateShot = path.join(artifactDir, `${scenarioSnapshot.scenario.key}-candidate-card.png`);
  await candidateCard.screenshot({ path: candidateShot });

  await page.getByRole('button', { name: '带入利润计算' }).first().click();
  await page.getByText('商品利润计算').waitFor({ timeout: 15000 });

  const warningAlert = page
    .getByText('当前候选参数还没补齐，详细利润页暂不展示利润结果。')
    .locator('xpath=ancestor::div[contains(@class,"ant-alert")]')
    .first();
  await warningAlert.waitFor({ timeout: 15000 });

  const alertText = normalizeText(await warningAlert.innerText());
  if (!alertText.includes(scenarioSnapshot.scenario.expectedAlertText)) {
    throw new Error(`detail alert missing expected fields for ${scenarioSnapshot.scenario.key}: ${alertText}`);
  }
  if (!alertText.includes(scenarioSnapshot.scenario.expectedRetainedText)) {
    throw new Error(`detail alert missing retained fields for ${scenarioSnapshot.scenario.key}: ${alertText}`);
  }

  const detailShot = path.join(artifactDir, `${scenarioSnapshot.scenario.key}-profit-detail.png`);
  await page.screenshot({ path: detailShot, fullPage: true });

  const formValues = await page.evaluate(() => {
    const read = (labelText) => {
      const labels = [...document.querySelectorAll('label')];
      const label = labels.find((item) => String(item.textContent ?? '').includes(labelText));
      if (!label) {
        return null;
      }
      const formItem = label.closest('.ant-form-item');
      const input = formItem?.querySelector('input');
      if (input) {
        return input.value;
      }
      return null;
    };
    return {
      salePrice: read('目标售价'),
      purchasePrice: read('采购单价'),
      lengthCm: read('长（cm）'),
      widthCm: read('宽（cm）'),
      heightCm: read('高（cm）'),
      weightGrams: read('重量（g）')
    };
  });

  for (const [field, expectedValue] of Object.entries(scenarioSnapshot.scenario.expectedFormValues)) {
    if (String(formValues[field] ?? '') !== expectedValue) {
      throw new Error(
        `form field ${field} mismatch for ${scenarioSnapshot.scenario.key}: expected ${expectedValue}, got ${formValues[field]}`
      );
    }
  }

  const bodyText = normalizeText(await page.locator('body').innerText());
  const hasMisleadingResult =
    bodyText.includes('当前口径说明') || bodyText.includes('体积（cbm）') || bodyText.includes('利润率 ');

  if (hasMisleadingResult) {
    throw new Error(`detail page rendered misleading profit result for ${scenarioSnapshot.scenario.key}`);
  }

  await context.close();

  return {
    scenario: scenarioSnapshot.scenario.key,
    title: scenarioSnapshot.scenario.title,
    candidateId: scenarioSnapshot.candidate.id,
    demandItemId: scenarioSnapshot.demandItem.id,
    candidateCardText: cardText,
    alertText,
    formValues,
    screenshots: {
      candidateCard: candidateShot,
      profitDetail: detailShot
    }
  };
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  await fs.mkdir(config.artifactDir, { recursive: true });

  const sessionPayload = await fetchJson(`${config.apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountNo: '18521524250', password: 'boss123' })
  });
  const session = sessionPayload.session;
  if (!session?.defaultOwnerUserId) {
    throw new Error('login response missing defaultOwnerUserId');
  }

  const candidatePool = await fetchJson(
    `${config.apiBase}/api/procurement/candidate-pool?ownerUserId=${session.defaultOwnerUserId}`
  );
  const scenarioSnapshots = findScenarioCandidates(candidatePool);

  const baselineSummary = {};
  for (const snapshot of scenarioSnapshots) {
    const missingFields = expectedMissingFields(snapshot);
    baselineSummary[snapshot.scenario.key] = {
      candidateId: snapshot.candidate.id,
      title: snapshot.candidate.title,
      missingFields,
      salePrice: snapshot.salePrice,
      purchasePrice: snapshot.purchasePrice,
      dimensions: snapshot.dimensions,
      weightGrams: snapshot.weightGrams
    };
    const expectedMissing =
      snapshot.scenario.key === 'missing-specs'
        ? ['lengthCm', 'widthCm', 'heightCm']
        : ['weightGrams'];
    if (JSON.stringify(missingFields) !== JSON.stringify(expectedMissing)) {
      throw new Error(
        `${snapshot.scenario.key} raw sample mismatch: expected ${expectedMissing.join(',')}, got ${missingFields.join(',') || 'none'}`
      );
    }
  }

  await fs.writeFile(
    path.join(config.artifactDir, 'raw-sample-baseline.json'),
    JSON.stringify(baselineSummary, null, 2),
    'utf-8'
  );

  const browser = await chromium.launch({
    executablePath: config.executablePath,
    headless: true,
    args: ['--disable-gpu']
  });

  const results = [];
  for (const snapshot of scenarioSnapshots) {
    results.push(await runScenario(browser, session, config, snapshot, config.artifactDir));
  }
  await browser.close();

  const summary = {
    baseUrl: config.baseUrl,
    apiBase: config.apiBase,
    executablePath: config.executablePath,
    artifactDir: config.artifactDir,
    scenarios: results
  };

  await fs.writeFile(
    path.join(config.artifactDir, 'results.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
