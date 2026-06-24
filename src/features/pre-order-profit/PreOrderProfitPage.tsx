import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType
} from 'antd';
import {
  CalculatorOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { normalizeError } from '../../shared/api';
import { PURCHASE_LISTING_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting';
import type { AuthSession } from '../auth/session';
import { savePreOrderProfitListingPrefill } from '../product-listing/sourcePrefill';
import {
  addPreOrderProfitCandidateToPurchaseOrder,
  addPreOrderProfitCompetitor,
  createPreOrderProfitCandidate,
  createPreOrderProfitPurchaseOrder,
  deletePreOrderProfitCandidate,
  deletePreOrderProfitCompetitor,
  isPersistedPreOrderProfitId,
  loadPreOrderProfitCandidate,
  loadPreOrderProfitCandidates,
  loadPreOrderProfitPurchaseOrders,
  updatePreOrderProfitCandidate,
  updatePreOrderProfitCompetitor
} from './api';
import { DEFAULT_TARGET_MARGIN_PCT, PRE_ORDER_PROFIT_SITE_CONFIGS } from './calculator';
import { AiAssistancePanel } from './AiAssistancePanel';
import { CandidateRelations } from './CandidateRelations';
import { PRE_ORDER_PROFIT_CATEGORY_RULES, PRE_ORDER_PROFIT_LOGISTICS_RULES } from './mockData';
import type {
  PreOrderProfitCalculation,
  PreOrderProfitCompetitor,
  PreOrderProfitCostLine,
  PreOrderProfitInput,
  PreOrderProfitPurchaseOrder,
  PreOrderProfitSiteCode,
  PreOrderProfitStatus
} from './types';
import './PreOrderProfitPage.css';

const { Paragraph, Text } = Typography;

type CandidateRow = PreOrderProfitInput & {
  calculation: PreOrderProfitCalculation;
};

type CandidateFilters = {
  keyword: string;
  site: 'ALL' | PreOrderProfitSiteCode;
  status: 'ALL' | PreOrderProfitStatus;
  categoryId: 'ALL' | string;
  logisticsCarrierId: 'ALL' | string;
};

type CandidateModalMode = 'create' | 'edit';

type PreOrderProfitPageProps = {
  session?: AuthSession;
};

type PreOrderProfitContext = {
  storeCode: string;
  site: PreOrderProfitSiteCode;
};

const EMPTY_FILTERS: CandidateFilters = {
  keyword: '',
  site: 'ALL',
  status: 'ALL',
  categoryId: 'ALL',
  logisticsCarrierId: 'ALL'
};

function cloneCandidateInput(candidate: PreOrderProfitInput): PreOrderProfitInput {
  return {
    ...candidate,
    competitors: candidate.competitors.map((competitor) => ({ ...competitor })),
    purchaseOrders: candidate.purchaseOrders?.map((order) => ({
      ...order,
      itemCandidateIds: order.itemCandidateIds ? [...order.itemCandidateIds] : undefined
    })),
    calculation: candidate.calculation
      ? {
          ...candidate.calculation,
          missingFields: [...candidate.calculation.missingFields],
          costLines: candidate.calculation.costLines.map((line) => ({ ...line }))
        }
      : undefined
  };
}

function createBlankCandidate(context: PreOrderProfitContext): PreOrderProfitInput {
  const defaultCategoryId = context.site === 'AE' ? 'home-storage-ae' : 'home-kitchen-sa';
  const defaultLogisticsCarrierId = context.site === 'AE' ? 'et-ae-air-standard' : 'et-sa-air-standard';

  return {
    id: `candidate-manual-${Date.now()}`,
    storeCode: context.storeCode,
    title: '',
    skuHint: '',
    purchaseUrl: '',
    purchasePriceRmb: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    actualWeightKg: 0,
    categoryId: defaultCategoryId,
    site: context.site,
    logisticsCarrierId: defaultLogisticsCarrierId,
    salePrice: 0,
    targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
    candidateStatus: 'DRAFT',
    competitorCount: 0,
    purchaseOrderCount: 0,
    purchaseOrders: [],
    relationsLoaded: true,
    competitors: []
  };
}

function filterCandidateRows(rows: CandidateRow[], filters: CandidateFilters) {
  const keyword = filters.keyword.trim().toLowerCase();

  return rows.filter((candidate) => {
    const matchesKeyword =
      !keyword ||
      [candidate.title, candidate.skuHint, candidate.purchaseUrl].some((value) => value.toLowerCase().includes(keyword));
    const matchesSite = filters.site === 'ALL' || candidate.site === filters.site;
    const matchesStatus = filters.status === 'ALL' || candidate.calculation.status === filters.status;
    const matchesCategory = filters.categoryId === 'ALL' || candidate.categoryId === filters.categoryId;
    const matchesLogistics =
      filters.logisticsCarrierId === 'ALL' || candidate.logisticsCarrierId === filters.logisticsCarrierId;

    return matchesKeyword && matchesSite && matchesStatus && matchesCategory && matchesLogistics;
  });
}

function money(value: number | null | undefined, currency: string) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value.toFixed(2)} ${currency}`;
}

function percent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value.toFixed(2)}%`;
}

function hasCompleteProfit(calculation: PreOrderProfitCalculation) {
  return calculation.status === 'READY' || calculation.status === 'INVALID_FORMULA';
}

function profitMoney(calculation: PreOrderProfitCalculation) {
  return hasCompleteProfit(calculation) ? money(calculation.estimatedProfit, calculation.currency) : '-';
}

function profitMargin(calculation: PreOrderProfitCalculation) {
  return hasCompleteProfit(calculation) ? percent(calculation.estimatedMarginPct) : '-';
}

function sourceText(source: PreOrderProfitCostLine['source']) {
  if (source === 'manual') return '手动输入';
  if (source === 'fixed') return '固定口径';
  return '规则计算';
}

function statusColor(status: PreOrderProfitCalculation['status']) {
  if (status === 'READY') return 'green';
  if (status === 'MISSING_RULE') return 'orange';
  if (status === 'INVALID_FORMULA') return 'red';
  return 'gold';
}

function displayCalculationFor(candidate: PreOrderProfitInput): PreOrderProfitCalculation {
  if (candidate.calculation) return candidate.calculation;
  const siteConfig = PRE_ORDER_PROFIT_SITE_CONFIGS[candidate.site];
  return {
    status: 'INCOMPLETE_INPUT',
    statusText: '缺输入',
    missingFields: [],
    currency: siteConfig.currency,
    siteLabel: siteConfig.label,
    taxRatePct: siteConfig.taxRate * 100,
    exchangeRate: siteConfig.exchangeRateRmbPerCurrency,
    actualWeightKg: candidate.actualWeightKg,
    volumeWeightKg: 0,
    chargeableWeightKg: 0,
    procurementCost: 0,
    domesticLogisticsCost: 0,
    firstLegLogisticsCost: 0,
    commissionBase: 0,
    commissionTaxIncluded: 0,
    outboundBase: 0,
    outboundTaxIncluded: 0,
    totalCost: 0,
    estimatedProfit: 0,
    estimatedMarginPct: 0,
    breakEvenPrice: null,
    targetMarginPrice: null,
    costLines: []
  };
}

function resolvePreOrderProfitContext(currentStore?: AuthSession['currentStore']): PreOrderProfitContext {
  const stored = readStoredPreOrderProfitContext();
  return {
    storeCode: currentStore?.storeCode?.trim() || stored?.storeCode || 'CANMAN',
    site: normalizeSiteCode(currentStore?.site || stored?.site)
  };
}

function readStoredPreOrderProfitContext(): Partial<PreOrderProfitContext> | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawSession = window.localStorage.getItem('nuono-next-session');
    if (!rawSession) return null;
    const parsed = JSON.parse(rawSession) as { currentStore?: { storeCode?: string; site?: string } | null };
    return {
      storeCode: parsed.currentStore?.storeCode,
      site: normalizeSiteCode(parsed.currentStore?.site)
    };
  } catch {
    return null;
  }
}

function normalizeSiteCode(site?: string | null): PreOrderProfitSiteCode {
  return site === 'AE' ? 'AE' : 'SA';
}

function candidateCompetitorCount(candidate: PreOrderProfitInput) {
  return candidate.competitorCount ?? candidate.competitors.length;
}

function candidatePurchaseOrderCount(candidate: PreOrderProfitInput) {
  return candidate.purchaseOrderCount ?? candidate.purchaseOrders?.length ?? 0;
}

function upsertCandidate(current: PreOrderProfitInput[], incoming: PreOrderProfitInput) {
  const existing = current.find((candidate) => candidate.id === incoming.id);
  const merged = {
    ...incoming,
    aiSummary: existing?.aiSummary ?? incoming.aiSummary,
    aiSuggestedPurchaseOrderId: existing?.aiSuggestedPurchaseOrderId ?? incoming.aiSuggestedPurchaseOrderId
  };

  if (!existing) return [merged, ...current];
  return current.map((candidate) => (candidate.id === incoming.id ? merged : candidate));
}

export function PreOrderProfitPage({ session }: PreOrderProfitPageProps) {
  const sessionStoreCode = session?.currentStore?.storeCode;
  const sessionSite = session?.currentStore?.site;
  const preOrderProfitContext = useMemo(
    () => resolvePreOrderProfitContext(session?.currentStore),
    [sessionSite, sessionStoreCode]
  );
  const [candidates, setCandidates] = useState<PreOrderProfitInput[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PreOrderProfitPurchaseOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [filters, setFilters] = useState<CandidateFilters>(EMPTY_FILTERS);
  const [modalMode, setModalMode] = useState<CandidateModalMode | null>(null);
  const [draftCandidate, setDraftCandidate] = useState<PreOrderProfitInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedIdRef = useRef<string | undefined>(undefined);
  const saveSequenceRef = useRef(0);

  const candidateRows: CandidateRow[] = useMemo(
    () =>
      candidates.map((candidate) => ({
        ...candidate,
        calculation: displayCalculationFor(candidate)
      })),
    [candidates]
  );
  const filteredRows = useMemo(() => filterCandidateRows(candidateRows, filters), [candidateRows, filters]);
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedId) ?? filteredRows[0] ?? candidates[0];
  const calculation = useMemo(
    () =>
      selectedCandidate
        ? displayCalculationFor(selectedCandidate)
        : displayCalculationFor(createBlankCandidate(preOrderProfitContext)),
    [preOrderProfitContext, selectedCandidate]
  );
  const purchaseOrderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    purchaseOrders.forEach((order) => {
      order.itemCandidateIds?.forEach((candidateId) => {
        counts.set(candidateId, (counts.get(candidateId) ?? 0) + 1);
      });
    });
    return counts;
  }, [purchaseOrders]);

  const refreshPurchaseOrders = useCallback(async () => {
    const nextPurchaseOrders = await loadPreOrderProfitPurchaseOrders(preOrderProfitContext.storeCode);
    setPurchaseOrders(nextPurchaseOrders);
    return nextPurchaseOrders;
  }, [preOrderProfitContext.storeCode]);

  const refreshCandidateDetail = useCallback(
    async (candidateId: string) => {
      const detail = await loadPreOrderProfitCandidate(preOrderProfitContext.storeCode, candidateId);
      setCandidates((current) => upsertCandidate(current, detail));
      return detail;
    },
    [preOrderProfitContext.storeCode]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [nextCandidates, nextPurchaseOrders] = await Promise.all([
        loadPreOrderProfitCandidates({ storeCode: preOrderProfitContext.storeCode }),
        loadPreOrderProfitPurchaseOrders(preOrderProfitContext.storeCode)
      ]);
      setCandidates(nextCandidates);
      setPurchaseOrders(nextPurchaseOrders);

      const currentSelectedId = selectedIdRef.current;
      const nextSelectedId =
        currentSelectedId && nextCandidates.some((candidate) => candidate.id === currentSelectedId)
          ? currentSelectedId
          : nextCandidates[0]?.id;
      setSelectedId(nextSelectedId);
      if (nextSelectedId) {
        await refreshCandidateDetail(nextSelectedId);
      }
    } catch (error) {
      setErrorMessage(normalizeError(error, '选品池加载失败。'));
    } finally {
      setIsLoading(false);
    }
  }, [preOrderProfitContext.storeCode, refreshCandidateDetail]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedId) return;
    const selected = candidates.find((candidate) => candidate.id === selectedId);
    if (!selected || selected.relationsLoaded) return;
    void refreshCandidateDetail(selectedId).catch((error) => {
      setErrorMessage(normalizeError(error, '选品池商品详情加载失败。'));
    });
  }, [candidates, refreshCandidateDetail, selectedId]);

  useEffect(() => {
    if (!filteredRows.length) return;
    if (!filteredRows.some((candidate) => candidate.id === selectedId)) {
      setSelectedId(filteredRows[0].id);
    }
  }, [filteredRows, selectedId]);

  const updateSelectedCandidate = (patch: Partial<PreOrderProfitInput>, options: { persist?: boolean } = {}) => {
    if (!selectedCandidate) return;
    const nextCandidate = {
      ...selectedCandidate,
      ...patch,
      storeCode: selectedCandidate.storeCode || preOrderProfitContext.storeCode
    };
    setCandidates((current) =>
      current.map((candidate) => (candidate.id === selectedCandidate.id ? { ...candidate, ...nextCandidate } : candidate))
    );

    if (options.persist === false || !isPersistedPreOrderProfitId(nextCandidate.id)) return;

    const sequence = ++saveSequenceRef.current;
    void updatePreOrderProfitCandidate(nextCandidate, preOrderProfitContext.storeCode)
      .then((savedCandidate) => {
        if (sequence === saveSequenceRef.current) {
          setCandidates((current) => upsertCandidate(current, savedCandidate));
        }
      })
      .catch((error) => {
        setErrorMessage(normalizeError(error, '选品池商品保存失败。'));
      });
  };

  const reloadData = () => {
    setFilters(EMPTY_FILTERS);
    void loadData();
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSelectedId(candidates[0]?.id);
  };

  const openCreateCandidate = () => {
    setModalMode('create');
    setDraftCandidate(createBlankCandidate(preOrderProfitContext));
  };

  const openEditCandidate = (candidate: PreOrderProfitInput) => {
    setModalMode('edit');
    setDraftCandidate(cloneCandidateInput(candidate));
  };

  const updateDraftCandidate = (patch: Partial<PreOrderProfitInput>) => {
    setDraftCandidate((current) => (current ? { ...current, ...patch } : current));
  };

  const saveDraftCandidate = async () => {
    if (!draftCandidate) return;

    const nextCandidate = {
      ...draftCandidate,
      storeCode: draftCandidate.storeCode || preOrderProfitContext.storeCode,
      title: draftCandidate.title.trim() || '未命名商品',
      skuHint: draftCandidate.skuHint.trim() || 'NO-SKU',
      purchaseUrl: draftCandidate.purchaseUrl.trim()
    };

    setIsSavingCandidate(true);
    setErrorMessage(null);
    try {
      const savedCandidate =
        modalMode === 'edit' && isPersistedPreOrderProfitId(nextCandidate.id)
          ? await updatePreOrderProfitCandidate(nextCandidate, preOrderProfitContext.storeCode)
          : await createPreOrderProfitCandidate(nextCandidate, preOrderProfitContext.storeCode);

      setCandidates((current) => upsertCandidate(current, savedCandidate));
      setSelectedId(savedCandidate.id);
      setFilters(EMPTY_FILTERS);
      setModalMode(null);
      setDraftCandidate(null);
    } catch (error) {
      setErrorMessage(normalizeError(error, '选品池商品保存失败。'));
    } finally {
      setIsSavingCandidate(false);
    }
  };

  const closeCandidateModal = () => {
    setModalMode(null);
    setDraftCandidate(null);
  };

  const deleteCandidate = async (candidateId: string) => {
    setErrorMessage(null);
    try {
      if (isPersistedPreOrderProfitId(candidateId)) {
        await deletePreOrderProfitCandidate(preOrderProfitContext.storeCode, candidateId);
      }

      setCandidates((current) => {
        const deletedIndex = current.findIndex((candidate) => candidate.id === candidateId);
        const next = current.filter((candidate) => candidate.id !== candidateId);

        if (candidateId === selectedId) {
          setSelectedId(next[Math.min(Math.max(deletedIndex, 0), Math.max(next.length - 1, 0))]?.id);
        }

        return next;
      });
      setPurchaseOrders((current) =>
        current.map((order) => ({
          ...order,
          itemCandidateIds: order.itemCandidateIds?.filter((itemCandidateId) => itemCandidateId !== candidateId)
        }))
      );
    } catch (error) {
      setErrorMessage(normalizeError(error, '选品池商品删除失败。'));
    }
  };

  const saveCompetitor = async (competitor: PreOrderProfitCompetitor) => {
    if (!selectedCandidate) return;
    setErrorMessage(null);
    try {
      const exists = selectedCandidate.competitors.some((item) => item.id === competitor.id);
      if (exists && isPersistedPreOrderProfitId(competitor.id)) {
        await updatePreOrderProfitCompetitor(preOrderProfitContext.storeCode, selectedCandidate.id, competitor);
      } else {
        await addPreOrderProfitCompetitor(preOrderProfitContext.storeCode, selectedCandidate.id, competitor);
      }
      await refreshCandidateDetail(selectedCandidate.id);
    } catch (error) {
      setErrorMessage(normalizeError(error, '竞品保存失败。'));
      throw error;
    }
  };

  const deleteCompetitor = async (competitorId: string) => {
    if (!selectedCandidate) return;
    setErrorMessage(null);
    try {
      await deletePreOrderProfitCompetitor(preOrderProfitContext.storeCode, selectedCandidate.id, competitorId);
      await refreshCandidateDetail(selectedCandidate.id);
    } catch (error) {
      setErrorMessage(normalizeError(error, '竞品删除失败。'));
    }
  };

  const addSelectedToPurchaseOrder = async (purchaseOrderId: string) => {
    if (!selectedCandidate) return false;
    const targetOrder = purchaseOrders.find((order) => order.id === purchaseOrderId);
    const alreadyLinked = selectedCandidate.purchaseOrders?.some((order) => order.id === purchaseOrderId);
    if (!targetOrder || alreadyLinked) return false;

    setErrorMessage(null);
    try {
      const link = await addPreOrderProfitCandidateToPurchaseOrder(
        preOrderProfitContext.storeCode,
        selectedCandidate.id,
        purchaseOrderId
      );
      await Promise.all([refreshCandidateDetail(selectedCandidate.id), refreshPurchaseOrders()]);
      return !link.alreadyLinked;
    } catch (error) {
      setErrorMessage(normalizeError(error, '加入采购单失败。'));
      return false;
    }
  };

  const createPurchaseOrderAndAddSelected = async (name: string, notes: string) => {
    if (!selectedCandidate) return;
    setErrorMessage(null);
    try {
      const order = await createPreOrderProfitPurchaseOrder(
        preOrderProfitContext.storeCode,
        selectedCandidate.site,
        name.trim() || '未命名采购单',
        notes.trim()
      );
      await addPreOrderProfitCandidateToPurchaseOrder(preOrderProfitContext.storeCode, selectedCandidate.id, order.id);
      await Promise.all([refreshCandidateDetail(selectedCandidate.id), refreshPurchaseOrders()]);
    } catch (error) {
      setErrorMessage(normalizeError(error, '采购单创建失败。'));
      throw error;
    }
  };

  const parseSelectedLinkWithAi = () => {
    if (!selectedCandidate) return;
    updateSelectedCandidate({
      title: 'AI解析商品',
      skuHint: selectedCandidate.skuHint || 'AI-PARSE-001',
      purchasePriceRmb: 15.8,
      lengthCm: 18,
      widthCm: 16,
      heightCm: 14,
      actualWeightKg: 0.72,
      categoryId: 'home-kitchen-sa',
      site: 'SA',
      logisticsCarrierId: 'et-sa-air-standard',
      salePrice: 56,
      aiSummary: 'AI 已根据 1688 链接补全采购价、尺寸、重量、类目和预估售价。'
    });
  };

  const recommendCompetitorWithAi = () => {
    if (!selectedCandidate) return;
    const exists = selectedCandidate.competitors.some(
      (competitor) => competitor.id === 'ai-competitor-noon-sample' || competitor.title === 'AI推荐竞品'
    );
    if (exists) return;

    void saveCompetitor({
      id: 'ai-competitor-noon-sample',
      title: 'AI推荐竞品',
      url: 'https://www.noon.com/saudi-ar/ai-recommended-competitor.html',
      platform: 'Noon',
      site: selectedCandidate.site,
      price: Number((selectedCandidate.salePrice * 1.08).toFixed(2)),
      currency: PRE_ORDER_PROFIT_SITE_CONFIGS[selectedCandidate.site].currency,
      sellerName: 'AI matched seller',
      notes: '根据标题、站点和价格区间生成的 mock 推荐'
    });
  };

  const generateSummaryWithAi = () => {
    if (!selectedCandidate) return;
    updateSelectedCandidate(
      {
        aiSummary: `AI 判断：当前商品已有 ${candidateCompetitorCount(selectedCandidate)} 个竞品记录，利润结果用于选品复核，建议继续核对竞品价格和头程成本。`
      },
      { persist: false }
    );
  };

  const suggestPurchaseOrderWithAi = () => {
    if (!selectedCandidate) return;
    const preferredOrder =
      purchaseOrders.find((order) => order.name.includes(selectedCandidate.site === 'SA' ? 'SGGR' : 'AE')) ??
      purchaseOrders[0];

    updateSelectedCandidate(
      {
        aiSuggestedPurchaseOrderId: preferredOrder?.id
      },
      { persist: false }
    );
  };

  const openProductListing = (candidate: PreOrderProfitInput) => {
    savePreOrderProfitListingPrefill(candidate, preOrderProfitContext.storeCode);
    const params = new URLSearchParams({
      listingSource: 'pre-order-profit',
      sourceCandidateId: candidate.id
    });
    window.location.assign(withCurrentWorkspaceDevQuery(`${PURCHASE_LISTING_PATH}?${params.toString()}`));
  };

  const costColumns: TableColumnsType<PreOrderProfitCostLine> = [
    {
      title: '成本项',
      dataIndex: 'label',
      width: 150
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (value) => money(value, calculation.currency)
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 110,
      render: (value: PreOrderProfitCostLine['source']) => <Tag>{sourceText(value)}</Tag>
    },
    {
      title: '口径',
      dataIndex: 'note'
    }
  ];

  return (
    <div className="pre-order-profit-page">
      <div className="pre-order-profit-header">
        <div>
          <h1 className="pre-order-profit-title">选品池</h1>
          <div className="pre-order-profit-subtitle">商品列表来自后端选品池接口，点击商品后在右侧查看选品分析和利润拆解。</div>
        </div>
        <Space>
          <Tag color="blue">后端 API</Tag>
          <Tag>{preOrderProfitContext.storeCode}</Tag>
          <Button icon={<ReloadOutlined />} loading={isLoading} onClick={reloadData}>
            刷新数据
          </Button>
        </Space>
      </div>

      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

      <div className="pre-order-profit-grid">
        <Card
          className="pre-order-profit-card"
          title="商品列表"
          data-testid="pre-order-profit-product-pool"
          loading={isLoading}
          extra={
            <Space>
              <Text type="secondary">
                {filteredRows.length === candidateRows.length
                  ? `${candidateRows.length} 个商品`
                  : `${filteredRows.length} / ${candidateRows.length} 个商品`}
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                data-testid="pre-order-profit-create-button"
                onClick={openCreateCandidate}
              >
                新增商品
              </Button>
            </Space>
          }
        >
          <div className="pre-order-profit-filter-bar">
            <div className="pre-order-profit-filter-item is-keyword" data-testid="pre-order-profit-keyword-filter">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索商品标题 / SKU / 1688 链接"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </div>
            <Select
              className="pre-order-profit-filter-item"
              value={filters.site}
              options={[
                { value: 'ALL', label: '全部站点' },
                { value: 'SA', label: '沙特' },
                { value: 'AE', label: '阿联酋' }
              ]}
              onChange={(site) => setFilters((current) => ({ ...current, site }))}
            />
            <Select
              className="pre-order-profit-filter-item"
              value={filters.status}
              options={[
                { value: 'ALL', label: '全部状态' },
                { value: 'READY', label: '可计算' },
                { value: 'INCOMPLETE_INPUT', label: '缺输入' },
                { value: 'MISSING_RULE', label: '缺规则' },
                { value: 'INVALID_FORMULA', label: '公式无效' }
              ]}
              onChange={(status) => setFilters((current) => ({ ...current, status }))}
            />
            <Select
              className="pre-order-profit-filter-item"
              value={filters.categoryId}
              options={[
                { value: 'ALL', label: '全部类目' },
                ...PRE_ORDER_PROFIT_CATEGORY_RULES.map((rule) => ({
                  value: rule.id,
                  label: `${rule.label} / ${PRE_ORDER_PROFIT_SITE_CONFIGS[rule.site].label}`
                }))
              ]}
              onChange={(categoryId) => setFilters((current) => ({ ...current, categoryId }))}
            />
            <Select
              className="pre-order-profit-filter-item"
              value={filters.logisticsCarrierId}
              options={[
                { value: 'ALL', label: '全部物流商' },
                ...PRE_ORDER_PROFIT_LOGISTICS_RULES.map((rule) => ({
                  value: rule.id,
                  label: rule.label
                }))
              ]}
              onChange={(logisticsCarrierId) => setFilters((current) => ({ ...current, logisticsCarrierId }))}
            />
            <Button data-testid="pre-order-profit-reset-filters" onClick={resetFilters}>
              重置筛选
            </Button>
          </div>

          {filteredRows.length ? (
            <div className="pre-order-profit-product-grid" data-testid="pre-order-profit-product-grid">
              {filteredRows.map((candidate) => (
                <div
                  key={candidate.id}
                  role="button"
                  tabIndex={0}
                  data-testid="pre-order-profit-product-card"
                  className={`pre-order-profit-product-card${
                    candidate.id === selectedCandidate?.id ? ' is-selected' : ''
                  }`}
                  onClick={() => setSelectedId(candidate.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(candidate.id);
                    }
                  }}
                >
                  <div className="pre-order-profit-product-card-actions">
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      data-testid="pre-order-profit-edit-product"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditCandidate(candidate);
                      }}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="删除商品"
                      description="确认从选品池删除这个商品？"
                      okText="确认删除"
                      cancelText="取消"
                      onConfirm={() => deleteCandidate(candidate.id)}
                    >
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        data-testid="pre-order-profit-delete-product"
                        disabled={candidates.length <= 1}
                        onClick={(event) => event.stopPropagation()}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                  <div className="pre-order-profit-product-image">{candidate.skuHint.slice(0, 2)}</div>
                  <div className="pre-order-profit-product-title">{candidate.title}</div>
                  <div className="pre-order-profit-product-meta">
                    <span>{candidate.skuHint}</span>
                    <span>{PRE_ORDER_PROFIT_SITE_CONFIGS[candidate.site].label}</span>
                    <span>采购 ¥{candidate.purchasePriceRmb.toFixed(2)}</span>
                    <span>售价 {money(candidate.salePrice, candidate.calculation.currency)}</span>
                  </div>
                  <div className="pre-order-profit-product-tags">
                    <Tag color={candidateCompetitorCount(candidate) ? 'blue' : 'default'}>
                      竞品 {candidateCompetitorCount(candidate)}
                    </Tag>
                    <Tag color={(candidate.purchaseOrderCount ?? purchaseOrderCounts.get(candidate.id) ?? 0) ? 'green' : 'default'}>
                      采购单 {candidate.purchaseOrderCount ?? purchaseOrderCounts.get(candidate.id) ?? 0}
                    </Tag>
                  </div>
                  <div className="pre-order-profit-product-profit">
                    <span>
                      预估利润
                      <strong>{profitMoney(candidate.calculation)}</strong>
                    </span>
                    <span>
                      毛利率
                      <strong>{profitMargin(candidate.calculation)}</strong>
                    </span>
                  </div>
                  <Tag color={statusColor(candidate.calculation.status)} style={{ width: 'fit-content' }}>
                    {candidate.calculation.statusText}
                  </Tag>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="没有符合筛选条件的商品"
              className="pre-order-profit-empty"
            >
              <Button data-testid="pre-order-profit-empty-reset" onClick={resetFilters}>
                清空筛选
              </Button>
            </Empty>
          )}
        </Card>

        {selectedCandidate ? (
        <div className="pre-order-profit-analysis" data-testid="pre-order-profit-analysis">
          <Card
            className="pre-order-profit-card"
            title="选品分析"
            extra={
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                data-testid="pre-order-profit-listing-button"
                onClick={() => openProductListing(selectedCandidate)}
              >
                上架
              </Button>
            }
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div className="pre-order-profit-selection-summary">
                <Text strong>{selectedCandidate.title}</Text>
                <Text type="secondary">{selectedCandidate.skuHint}</Text>
                <Tag color="blue">预估售价 {money(selectedCandidate.salePrice, calculation.currency)}</Tag>
              </div>
              <Space wrap>
                <Tag color={statusColor(calculation.status)}>{calculation.statusText}</Tag>
                <Tag>{calculation.siteLabel}</Tag>
                <Tag>{calculation.currency}</Tag>
                <Tag>税率 {percent(calculation.taxRatePct)}</Tag>
                <Tag>汇率 {calculation.exchangeRate}</Tag>
              </Space>
              {calculation.missingFields.length ? (
                <Alert
                  type="warning"
                  showIcon
                  message="利润结果不完整"
                  description={`缺失项：${calculation.missingFields.join('、')}`}
                />
              ) : null}
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                链接仅作为来源记录；采购、规格、站点、物流和售价均可手动调整。
              </Paragraph>
            </Space>
          </Card>

          <AiAssistancePanel
            candidate={selectedCandidate}
            calculation={calculation}
            purchaseOrders={purchaseOrders}
            onParseLink={parseSelectedLinkWithAi}
            onRecommendCompetitor={recommendCompetitorWithAi}
            onGenerateSummary={generateSummaryWithAi}
            onSuggestPurchaseOrder={suggestPurchaseOrderWithAi}
          />

          <CandidateRelations
            candidate={selectedCandidate}
            purchaseOrders={purchaseOrders}
            onSaveCompetitor={saveCompetitor}
            onDeleteCompetitor={deleteCompetitor}
            onAddToPurchaseOrder={addSelectedToPurchaseOrder}
            onCreatePurchaseOrderAndAdd={createPurchaseOrderAndAddSelected}
          />

          <Card className="pre-order-profit-card" title="计算结果">
            <div className="pre-order-profit-result-grid">
              <ResultTile
                testId="pre-order-profit-estimated-profit"
                label="预估利润"
                value={profitMoney(calculation)}
              />
              <ResultTile
                testId="pre-order-profit-estimated-margin"
                label="预估毛利率"
                value={profitMargin(calculation)}
              />
              <ResultTile
                label="保本售价"
                value={money(calculation.breakEvenPrice, calculation.currency)}
              />
              <ResultTile
                testId="pre-order-profit-target-price"
                label="目标毛利售价"
                value={money(calculation.targetMarginPrice, calculation.currency)}
              />
            </div>
          </Card>

          <Card className="pre-order-profit-card" title="录入参数">
            <Form layout="vertical" className="pre-order-profit-form-grid">
              <Form.Item className="is-wide" label="1688 采购链接">
                <Input
                  value={selectedCandidate.purchaseUrl}
                  onChange={(event) => updateSelectedCandidate({ purchaseUrl: event.target.value })}
                />
              </Form.Item>
              <Form.Item label="采购单价 RMB">
                <InputNumber
                  min={0}
                  precision={2}
                  value={selectedCandidate.purchasePriceRmb}
                  onChange={(value) => updateSelectedCandidate({ purchasePriceRmb: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="长 cm">
                <InputNumber
                  min={0}
                  precision={2}
                  value={selectedCandidate.lengthCm}
                  onChange={(value) => updateSelectedCandidate({ lengthCm: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="宽 cm">
                <InputNumber
                  min={0}
                  precision={2}
                  value={selectedCandidate.widthCm}
                  onChange={(value) => updateSelectedCandidate({ widthCm: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="高 cm">
                <InputNumber
                  min={0}
                  precision={2}
                  value={selectedCandidate.heightCm}
                  onChange={(value) => updateSelectedCandidate({ heightCm: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="实际重量 kg">
                <InputNumber
                  min={0}
                  precision={3}
                  value={selectedCandidate.actualWeightKg}
                  onChange={(value) => updateSelectedCandidate({ actualWeightKg: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="商品类目">
                <Select
                  value={selectedCandidate.categoryId}
                  options={PRE_ORDER_PROFIT_CATEGORY_RULES.map((rule) => ({
                    value: rule.id,
                    label: `${rule.label} / ${PRE_ORDER_PROFIT_SITE_CONFIGS[rule.site].label}`
                  }))}
                  onChange={(categoryId) => {
                    const nextRule = PRE_ORDER_PROFIT_CATEGORY_RULES.find((rule) => rule.id === categoryId);
                    updateSelectedCandidate({ categoryId, site: nextRule?.site ?? selectedCandidate.site });
                  }}
                />
              </Form.Item>
              <Form.Item label="销售站点">
                <Select
                  value={selectedCandidate.site}
                  options={[
                    { value: 'SA', label: '沙特' },
                    { value: 'AE', label: '阿联酋' }
                  ]}
                  onChange={(site) => updateSelectedCandidate({ site })}
                />
              </Form.Item>
              <Form.Item label="物流商">
                <Select
                  value={selectedCandidate.logisticsCarrierId}
                  options={PRE_ORDER_PROFIT_LOGISTICS_RULES.map((rule) => ({
                    value: rule.id,
                    label: rule.label
                  }))}
                  onChange={(logisticsCarrierId) => updateSelectedCandidate({ logisticsCarrierId })}
                />
              </Form.Item>
              <Form.Item label="预估售价" data-testid="pre-order-profit-sale-price-input">
                <InputNumber
                  min={0}
                  precision={2}
                  value={selectedCandidate.salePrice}
                  onChange={(value) => updateSelectedCandidate({ salePrice: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="目标毛利率 %" data-testid="pre-order-profit-target-margin-input">
                <InputNumber
                  min={0}
                  max={95}
                  precision={2}
                  value={selectedCandidate.targetMarginPct}
                  onChange={(value) => updateSelectedCandidate({ targetMarginPct: Number(value) || 0 })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Form>
          </Card>

          <Card className="pre-order-profit-card" title="成本拆解" extra={<CalculatorOutlined />}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div className="pre-order-profit-rule-strip">
                <Tag>实际重 {calculation.actualWeightKg} kg</Tag>
                <Tag>体积重 {calculation.volumeWeightKg} kg</Tag>
                <Tag>计费重 {calculation.chargeableWeightKg} kg</Tag>
                <Tag>国内物流 2 RMB/kg</Tag>
              </div>
              <Table
                rowKey="key"
                size="small"
                columns={costColumns}
                dataSource={calculation.costLines}
                pagination={false}
              />
            </Space>
          </Card>
        </div>
        ) : (
          <div className="pre-order-profit-analysis" data-testid="pre-order-profit-analysis">
            <Card className="pre-order-profit-card" title="选品分析">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={isLoading ? '正在加载选品池' : '暂无商品'}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCandidate}>
                  新增商品
                </Button>
              </Empty>
            </Card>
          </div>
        )}
      </div>

      <CandidateEditorModal
        mode={modalMode}
        candidate={draftCandidate}
        onChange={updateDraftCandidate}
        onCancel={closeCandidateModal}
        onSave={saveDraftCandidate}
        saving={isSavingCandidate}
      />
    </div>
  );
}

function ResultTile(props: { label: string; value: string; testId?: string }) {
  return (
    <div className="pre-order-profit-result" data-testid={props.testId}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function CandidateEditorModal(props: {
  mode: CandidateModalMode | null;
  candidate: PreOrderProfitInput | null;
  onChange: (patch: Partial<PreOrderProfitInput>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { candidate, mode, onCancel, onChange, onSave, saving } = props;
  const title = mode === 'create' ? '新增商品' : '编辑商品';
  const canSave = Boolean(candidate?.title.trim() && candidate?.skuHint.trim());

  return (
    <Modal
      title={title}
      open={Boolean(candidate)}
      onCancel={onCancel}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          data-testid="pre-order-profit-modal-save"
          disabled={!canSave}
          loading={saving}
          onClick={onSave}
        >
          保存
        </Button>
      ]}
    >
      {candidate ? (
        <Form layout="vertical" className="pre-order-profit-modal-form">
          <Form.Item label="商品标题" data-testid="pre-order-profit-modal-title">
            <Input value={candidate.title} onChange={(event) => onChange({ title: event.target.value })} />
          </Form.Item>
          <Form.Item label="SKU 提示" data-testid="pre-order-profit-modal-sku">
            <Input value={candidate.skuHint} onChange={(event) => onChange({ skuHint: event.target.value })} />
          </Form.Item>
          <Form.Item className="is-wide" label="1688 采购链接" data-testid="pre-order-profit-modal-purchase-url">
            <Input
              value={candidate.purchaseUrl}
              onChange={(event) => onChange({ purchaseUrl: event.target.value })}
            />
          </Form.Item>
          <Form.Item label="采购单价 RMB" data-testid="pre-order-profit-modal-purchase-price">
            <InputNumber
              min={0}
              precision={2}
              value={candidate.purchasePriceRmb}
              onChange={(value) => onChange({ purchasePriceRmb: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="长 cm" data-testid="pre-order-profit-modal-length">
            <InputNumber
              min={0}
              precision={2}
              value={candidate.lengthCm}
              onChange={(value) => onChange({ lengthCm: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="宽 cm" data-testid="pre-order-profit-modal-width">
            <InputNumber
              min={0}
              precision={2}
              value={candidate.widthCm}
              onChange={(value) => onChange({ widthCm: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="高 cm" data-testid="pre-order-profit-modal-height">
            <InputNumber
              min={0}
              precision={2}
              value={candidate.heightCm}
              onChange={(value) => onChange({ heightCm: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="实际重量 kg" data-testid="pre-order-profit-modal-weight">
            <InputNumber
              min={0}
              precision={3}
              value={candidate.actualWeightKg}
              onChange={(value) => onChange({ actualWeightKg: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="商品类目">
            <Select
              value={candidate.categoryId}
              options={PRE_ORDER_PROFIT_CATEGORY_RULES.map((rule) => ({
                value: rule.id,
                label: `${rule.label} / ${PRE_ORDER_PROFIT_SITE_CONFIGS[rule.site].label}`
              }))}
              onChange={(categoryId) => {
                const nextRule = PRE_ORDER_PROFIT_CATEGORY_RULES.find((rule) => rule.id === categoryId);
                onChange({ categoryId, site: nextRule?.site ?? candidate.site });
              }}
            />
          </Form.Item>
          <Form.Item label="销售站点">
            <Select
              value={candidate.site}
              options={[
                { value: 'SA', label: '沙特' },
                { value: 'AE', label: '阿联酋' }
              ]}
              onChange={(site) => onChange({ site })}
            />
          </Form.Item>
          <Form.Item label="物流商">
            <Select
              value={candidate.logisticsCarrierId}
              options={PRE_ORDER_PROFIT_LOGISTICS_RULES.map((rule) => ({
                value: rule.id,
                label: rule.label
              }))}
              onChange={(logisticsCarrierId) => onChange({ logisticsCarrierId })}
            />
          </Form.Item>
          <Form.Item label="预估售价" data-testid="pre-order-profit-modal-sale-price">
            <InputNumber
              min={0}
              precision={2}
              value={candidate.salePrice}
              onChange={(value) => onChange({ salePrice: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="目标毛利率 %">
            <InputNumber
              min={0}
              max={95}
              precision={2}
              value={candidate.targetMarginPct}
              onChange={(value) => onChange({ targetMarginPct: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      ) : null}
    </Modal>
  );
}
