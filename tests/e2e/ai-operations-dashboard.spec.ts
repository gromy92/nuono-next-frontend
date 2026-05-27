import { expect, test } from '@playwright/test';

function dashboardOverview(datePreset: string) {
  return {
    scope: {
      ownerUserId: 307,
      operatorUserId: 307,
      storeCode: 'STR108065-NAE',
      siteCode: 'AE',
      datePreset,
      dateFrom: datePreset === 'last30Days' ? '2026-04-22' : '2026-05-15',
      dateTo: '2026-05-21'
    },
    summary: {
      title: 'AI运营看板',
      state: 'partial_success',
      description: '当前范围已有部分经营信号接入。'
    },
    metricCards: [
      {
        key: 'sales',
        title: '销量概览',
        state: 'not_connected',
        qualityState: 'not_connected',
        value: null,
        unit: null,
        description: '销量事实将在 A02 接入。'
      },
      {
        key: 'sales_revenue_shipped',
        title: '销售额',
        state: 'ready',
        qualityState: 'partial_success',
        value: '25.50',
        unit: null,
        description: '来源于销量分析 summary.revenueShipped。'
      },
      {
        key: 'sales_net_units',
        title: '净销量',
        state: 'ready',
        qualityState: 'partial_success',
        value: 2,
        unit: '件',
        description: '来源于销量分析 summary.netUnits。'
      },
      {
        key: 'sales_visitors',
        title: '访客',
        state: 'ready',
        qualityState: 'partial_success',
        value: 100,
        unit: '人',
        description: '来源于销量分析 summary.yourVisitors。'
      },
      {
        key: 'sales_conversion',
        title: '转化率',
        state: 'ready',
        qualityState: 'partial_success',
        value: 50,
        unit: '%',
        description: '来源于销量分析 summary.conversionVisitorsPercentage。'
      },
      {
        key: 'sales_lifecycle_new',
        title: '生命周期：新品',
        state: 'ready',
        qualityState: 'ready',
        value: 1,
        unit: '个',
        description: 'DEFAULT_V1 分类：新品；来源于销量分析 productRows.lifecycleCode。'
      },
      {
        key: 'sales_lifecycle_growth',
        title: '生命周期：增长',
        state: 'ready',
        qualityState: 'ready',
        value: 1,
        unit: '个',
        description: 'DEFAULT_V1 分类：增长；来源于销量分析 productRows.lifecycleCode。'
      },
      {
        key: 'sales_lifecycle_stable',
        title: '生命周期：稳定',
        state: 'ready',
        qualityState: 'ready',
        value: 1,
        unit: '个',
        description: 'DEFAULT_V1 分类：稳定；来源于销量分析 productRows.lifecycleCode。'
      },
      {
        key: 'sales_lifecycle_decline',
        title: '生命周期：衰退',
        state: 'ready',
        qualityState: 'ready',
        value: 1,
        unit: '个',
        description: 'DEFAULT_V1 分类：衰退；来源于销量分析 productRows.lifecycleCode。'
      },
      {
        key: 'sales_lifecycle_long_tail',
        title: '生命周期：长尾期',
        state: 'ready',
        qualityState: 'ready',
        value: 1,
        unit: '个',
        description: 'DEFAULT_V1 分类：长尾期；来源于销量分析 productRows.lifecycleCode。'
      },
      {
        key: 'sales_lifecycle_data_insufficient',
        title: '生命周期：数据不足',
        state: 'ready',
        qualityState: 'ready',
        value: 1,
        unit: '个',
        description: 'DEFAULT_V1 分类：数据不足；来源于销量分析 productRows.lifecycleCode。'
      },
      {
        key: 'selection',
        title: '选品信号',
        state: 'not_connected',
        qualityState: 'not_connected',
        value: null,
        unit: null,
        description: '选品与 1688 信号将在 A03 接入。'
      }
    ],
    signals: [
      {
        key: 'sales_declining_products',
        title: '衰退商品',
        state: 'ready',
        severity: 'warning',
        description: '发现 1 个衰退商品，优先查看 DECLINE。',
        source: 'sales',
        drillThroughPath:
          '/data/sales-analysis?storeCode=STR108065-NAE&siteCode=AE&dateFrom=2026-04-22&dateTo=2026-05-21&search=DECLINE',
        evidence: [
          {
            id: 'sales_declining_products-evidence',
            label: '衰退商品证据',
            source: 'sales_analysis.product_rows',
            state: 'ready',
            description:
              'ruleVersion=DEFAULT_V1;source=sales_analysis.product_rows;lifecycle=decline;count=1;topPartnerSku=DECLINE'
          }
        ]
      },
      {
        key: 'sales_lifecycle_distribution',
        title: '商品生命周期分布',
        state: 'ready',
        severity: 'info',
        description: 'DEFAULT_V1：新品 1，增长 1，稳定 1，衰退 1，长尾期 1，数据不足 1',
        source: 'sales',
        evidence: []
      }
    ],
    aiSummary: {
      title: 'AI今日总结',
      state: 'runtime_disabled',
      qualityState: 'runtime_disabled',
      content: null,
      generatedAt: null
    },
    suggestions: {
      state: 'runtime_disabled',
      title: 'AI建议',
      items: []
    },
    evidence: {
      state: 'partial_success',
      title: '证据来源',
      items: [
        {
          id: 'sales-lifecycle-default-v1-distribution',
          label: '生命周期规则版本',
          source: 'sales',
          state: 'ready',
          description:
            'ruleVersion=DEFAULT_V1;source=sales_analysis.product_rows;new=1;growth=1;stable=1;decline=1;longTail=1;data_insufficient=1'
        }
      ]
    },
    qualityStates: [
      'not_connected',
      'ready',
      'sync_in_progress',
      'empty',
      'stale',
      'backfill_required',
      'backfill_running',
      'backfill_failed',
      'empty_report',
      'missing_mapping',
      'workspace_empty',
      'provider_unavailable',
      'runtime_disabled',
      'partial_success'
    ]
  };
}

function dashboardOverviewForSyncState(state: string, qualityState = state) {
  const overview = dashboardOverview('last7Days');
  const businessMetricsAllowed = state === 'ready' && qualityState === 'ready';
  overview.summary.description = businessMetricsAllowed
    ? '当前范围已有可信销量经营信号。'
    : `质量状态 ${qualityState}，暂不展示业务指标。`;
  overview.metricCards = overview.metricCards.map((card) => {
    if (!card.key.startsWith('sales_')) return card;
    if (businessMetricsAllowed) {
      return { ...card, state: 'ready', qualityState: 'ready' };
    }
    return {
      ...card,
      state,
      qualityState,
      value: null,
      description: `质量状态 ${qualityState}，共享销量分析暂不允许业务指标，暂不展示数值。`
    };
  });
  overview.signals = [
    {
      key: 'sales_freshness',
      title: '销量数据新鲜度',
      state,
      severity: qualityState === 'provider_unavailable' || state === 'backfill_failed' ? 'error' : 'warning',
      description: `质量状态 ${qualityState}，暂不生成业务判断。`,
      source: 'sales',
      drillThroughPath: '/data/sales-analysis?storeCode=STR108065-NAE&siteCode=AE',
      evidence: []
    }
  ];
  overview.evidence.items = [
    {
      id: `sales-sync-${qualityState}`,
      label: '销量同步状态',
      source: 'sales',
      state: qualityState,
      description: `syncState=${state};qualityState=${qualityState};businessMetricsAllowed=${businessMetricsAllowed}`
    }
  ];
  overview.aiSummary = {
    title: 'AI今日总结',
    state: 'runtime_disabled',
    qualityState: 'runtime_disabled',
    content: null,
    generatedAt: null
  };
  overview.suggestions = {
    state: 'runtime_disabled',
    title: 'AI建议',
    items: []
  };
  return overview;
}

test('AI operations dashboard opens with scoped sales metrics and no fake zero values', async ({ page }) => {
  const requestedUrls: string[] = [];

  await page.route('**/api/ai-operations-dashboard/overview?**', async (route) => {
    const url = new URL(route.request().url());
    requestedUrls.push(url.toString());
    await route.fulfill({
      json: dashboardOverview(url.searchParams.get('datePreset') || 'last7Days')
    });
  });

  await page.goto('/operations/dashboard?devSession=1&devRole=boss&grantOperationsDashboard=1');

  const workbench = page.getByTestId('ai-operations-dashboard-workbench');
  await expect(workbench).toBeVisible();
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: 'AI运营看板' })).toBeVisible();
  await expect(workbench).toContainText('当前范围已有部分经营信号接入');
  await expect(workbench).toContainText('销售额');
  await expect(workbench).toContainText('25.50');
  await expect(workbench).toContainText('净销量');
  await expect(workbench).toContainText('2 件');
  await expect(workbench).toContainText('访客');
  await expect(workbench).toContainText('100 人');
  await expect(workbench).toContainText('转化率');
  await expect(workbench).toContainText('50 %');
  await expect(workbench).toContainText('生命周期：长尾期');
  await expect(workbench).toContainText('生命周期：数据不足');
  await expect(workbench).toContainText('衰退商品');
  await expect(workbench).toContainText('warning');
  await expect(workbench.getByRole('link', { name: /查看/ })).toHaveAttribute(
    'href',
    /\/data\/sales-analysis.*search=DECLINE/
  );
  await expect(workbench).toContainText('商品生命周期分布');
  await expect(workbench).toContainText('DEFAULT_V1');
  await expect(workbench).toContainText('partial_success');
  await expect(workbench).toContainText('AI今日总结');
  await expect(workbench).toContainText('runtime_disabled');
  await expect(workbench).toContainText('not_connected');
  await expect(workbench).not.toContainText('0 件');
  await expect(workbench).not.toContainText('¥0');

  expect(requestedUrls[0]).toContain('storeCode=STR108065-NAE');
  expect(requestedUrls[0]).toContain('siteCode=AE');
  expect(requestedUrls[0]).toContain('datePreset=last7Days');

  await workbench.getByText('近30天').click();
  await expect.poll(() => requestedUrls.some((url) => url.includes('datePreset=last30Days'))).toBe(true);
});

test('AI operations dashboard gates A02 sync states without fake metrics or AI output', async ({ page }) => {
  const states = [
    ['ready', 'ready'],
    ['stale', 'stale'],
    ['empty_report', 'empty_report'],
    ['backfill_required', 'backfill_required'],
    ['backfill_running', 'backfill_running'],
    ['backfill_failed', 'backfill_failed'],
    ['backfill_failed', 'provider_unavailable']
  ];
  let nextOverview = dashboardOverviewForSyncState('ready', 'ready');

  await page.route('**/api/ai-operations-dashboard/overview?**', async (route) => {
    await route.fulfill({ json: nextOverview });
  });

  for (const [state, qualityState] of states) {
    nextOverview = dashboardOverviewForSyncState(state, qualityState);
    await page.goto(`/operations/dashboard?devSession=1&devRole=boss&grantOperationsDashboard=1&a02Gate=${qualityState}`);

    const workbench = page.getByTestId('ai-operations-dashboard-workbench');
    await expect(workbench).toBeVisible();
    await expect(workbench).toContainText(qualityState);
    await expect(workbench).toContainText('runtime_disabled');
    await expect(workbench).not.toContainText('AI生成建议');
    if (state !== 'ready' || qualityState !== 'ready') {
      await expect(workbench).toContainText('暂不展示数值');
      await expect(workbench).not.toContainText('0 件');
      await expect(workbench).not.toContainText('¥0');
    }
  }
});
