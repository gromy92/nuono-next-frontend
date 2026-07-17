import { App, Button, Empty, Input, InputNumber, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthSession, AuthSessionStore } from '../auth/session';
import {
  fetchProductSpecsOverview,
  saveProductLogisticsProfile,
  saveProductSpecSource,
  selectProductSpecEffectiveSource
} from '../product-management/api';
import type {
  ProductLogisticsProfilePayload,
  ProductVariantSpecPayload,
  ProductVariantSpecSourcePayload,
  ProductVariantSpecSourceType
} from '../product-management/types';
import { formatSnapshotValue, normalizeNoonImageUrl } from '../product-management/utils/common';
import { getProductCurrentZCode, getProductStableIdentityKey } from '../product-management/utils';

const { Paragraph, Text } = Typography;

type ProductSpecsPageProps = {
  session: AuthSession;
  activeOwnerId?: number;
};

const sourceLabels: Record<string, string> = {
  ali1688: '1688',
  warehouse: '仓管',
  noon_official: 'Noon官方'
};

const sourceColors: Record<string, string> = {
  ali1688: 'blue',
  warehouse: 'green',
  noon_official: 'purple'
};

type SpecNumberField =
  | 'productLengthCm'
  | 'productWidthCm'
  | 'productHeightCm'
  | 'productWeightG'
  | 'cartonLengthCm'
  | 'cartonWidthCm'
  | 'cartonHeightCm'
  | 'cartonWeightKg'
  | 'cartonQuantity';

type EditableSourceType = Extract<ProductVariantSpecSourceType, 'ali1688'>;
type SpecCompletenessFilter =
  | 'all'
  | 'ali1688_missing'
  | 'warehouse_missing'
  | 'domestic_missing'
  | 'official_missing'
  | 'logistics_missing';

type SpecSourceDraft = Pick<
  ProductVariantSpecSourcePayload,
  | SpecNumberField
  | 'cartonSourceType'
  | 'batteryMagneticType'
  | 'liquidPowderType'
>;

type SpecField = {
  key: SpecNumberField;
  label: string;
  min?: number;
  precision?: number;
};

type LogisticsOption = {
  value: string;
  label: string;
};

const productSpecFields: SpecField[] = [
  { key: 'productLengthCm', label: '长/cm', min: 0.01, precision: 2 },
  { key: 'productWidthCm', label: '宽/cm', min: 0.01, precision: 2 },
  { key: 'productHeightCm', label: '高/cm', min: 0.01, precision: 2 },
  { key: 'productWeightG', label: '重/g', min: 0.01, precision: 2 }
];

const cartonSpecFields: SpecField[] = [
  { key: 'cartonLengthCm', label: '箱长/cm', min: 0.01, precision: 2 },
  { key: 'cartonWidthCm', label: '箱宽/cm', min: 0.01, precision: 2 },
  { key: 'cartonHeightCm', label: '箱高/cm', min: 0.01, precision: 2 },
  { key: 'cartonWeightKg', label: '箱重/kg', min: 0.001, precision: 3 },
  { key: 'cartonQuantity', label: '数量', min: 1, precision: 0 }
];

const magneticLogisticsOptions: LogisticsOption[] = [
  { label: '磁性', value: 'unknown' },
  { label: '不带磁', value: 'none' },
  { label: '带磁', value: 'magnetic' }
];

type LogisticsProfileField =
  | 'batteryType'
  | 'electricType'
  | 'magneticType'
  | 'liquidType'
  | 'powderType'
  | 'woodenMaterialType'
  | 'bladeWeaponType';

type LogisticsFieldConfig = {
  field: LogisticsProfileField;
  ariaLabel: string;
  options: LogisticsOption[];
};

const logisticsFieldConfigs: LogisticsFieldConfig[] = [
  {
    field: 'batteryType',
    ariaLabel: '带电',
    options: [
      { label: '带电', value: 'unknown' },
      { label: '不带电', value: 'none' },
      { label: '带电', value: 'battery_equipment' }
    ]
  },
  {
    field: 'electricType',
    ariaLabel: '电器',
    options: [
      { label: '电器', value: 'unknown' },
      { label: '非电器', value: 'none' },
      { label: '电器', value: 'electric_equipment_review' }
    ]
  },
  {
    field: 'magneticType',
    ariaLabel: '磁性',
    options: magneticLogisticsOptions
  },
  {
    field: 'liquidType',
    ariaLabel: '液体',
    options: [
      { label: '液体', value: 'unknown' },
      { label: '非液体', value: 'none' },
      { label: '液体', value: 'liquid' }
    ]
  },
  {
    field: 'powderType',
    ariaLabel: '粉末',
    options: [
      { label: '粉末', value: 'unknown' },
      { label: '非粉末', value: 'none' },
      { label: '粉末', value: 'powder' }
    ]
  },
  {
    field: 'woodenMaterialType',
    ariaLabel: '木材',
    options: [
      { label: '木材', value: 'unknown' },
      { label: '非木材', value: 'none' },
      { label: '木材', value: 'wooden_material_review' }
    ]
  },
  {
    field: 'bladeWeaponType',
    ariaLabel: '刀具',
    options: [
      { label: '刀具', value: 'unknown' },
      { label: '非刀具', value: 'none' },
      { label: '刀具', value: 'blade_tool_review' }
    ]
  }
];

type LogisticsAttributeFilter = 'all' | `${LogisticsProfileField}:${string}`;

const logisticsAttributeFilterOptions: Array<{ value: LogisticsAttributeFilter; label: string }> = [
  { value: 'all', label: '全部物流属性' },
  ...logisticsFieldConfigs.flatMap((config) =>
    config.options.map((option) => ({
      value: `${config.field}:${option.value}` as LogisticsAttributeFilter,
      label: `${config.ariaLabel}：${logisticsFilterOptionLabel(option)}`
    }))
  )
];

export function ProductSpecsPage({ session, activeOwnerId }: ProductSpecsPageProps) {
  const { message } = App.useApp();
  const ownerUserId = resolveRequestOwnerUserId(session, activeOwnerId);
  const storeScope = useMemo(() => resolveCurrentSpecStoreScope(session), [session]);
  const storeCode = storeScope.storeCode;
  const [keyword, setKeyword] = useState(() => readInitialProductSpecsKeyword());
  const [completenessFilter, setCompletenessFilter] = useState<SpecCompletenessFilter>('all');
  const [logisticsAttributeFilter, setLogisticsAttributeFilter] = useState<LogisticsAttributeFilter>('all');
  const [rows, setRows] = useState<ProductVariantSpecPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<SpecSourceDraft>(createSpecSourceDraft());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [selectingEffectiveKey, setSelectingEffectiveKey] = useState<string | null>(null);
  const [logisticsSavingKey, setLogisticsSavingKey] = useState<string | null>(null);

  const storeLabelByCode = useMemo(() => {
    return buildStoreLabelByCode(session);
  }, [session]);

  const loadRows = useCallback(async () => {
    const normalizedStoreCode = storeCode.trim();
    if (!normalizedStoreCode) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const payload = await fetchProductSpecsOverview({
        ownerUserId,
        storeCode: normalizedStoreCode,
        keyword: keyword.trim() || undefined
      });
      setRows(payload.items || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品规格加载失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, message, ownerUserId, storeCode]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleStartEdit = useCallback((row: ProductVariantSpecPayload, sourceType: EditableSourceType) => {
    const source = findSource(row.sources, sourceType);
    const fallback = row.effectiveSourceType === sourceType ? row : undefined;
    setEditingKey(buildEditKey(row, sourceType));
    setEditingDraft(createSpecSourceDraft(source || fallback, sourceType));
  }, []);

  const handleDraftNumberChange = useCallback((field: SpecNumberField, value: number | string | null) => {
    setEditingDraft((current) => ({
      ...current,
      [field]: normalizeDraftNumber(value)
    }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditingDraft(createSpecSourceDraft());
  }, []);

  const handleSaveSource = useCallback(
    async (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => {
      const normalizedStoreCode = storeCode.trim();
      if (!normalizedStoreCode || !(row.partnerSku || row.variantId)) {
        message.warning('缺少店铺或 SKU 上下文，暂不能保存规格');
        return;
      }
      const key = buildEditKey(row, sourceType);
      setSavingKey(key);
      try {
        await saveProductSpecSource({
          ownerUserId,
          storeCode: normalizedStoreCode,
          variantId: row.variantId,
          partnerSku: row.partnerSku,
          currentZCode: getProductCurrentZCode(row),
          skuParent: getProductCurrentZCode(row),
          sourceType,
          ...editingDraft
        });
        message.success('规格已保存');
        setEditingKey(null);
        setEditingDraft(createSpecSourceDraft());
        await loadRows();
      } catch (error) {
        message.error(error instanceof Error ? error.message : '保存规格来源失败');
      } finally {
        setSavingKey(null);
      }
    },
    [editingDraft, loadRows, message, ownerUserId, storeCode]
  );

  const handleSelectEffectiveSource = useCallback(
    async (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => {
      const normalizedStoreCode = storeCode.trim();
      const source = findSource(row.sources, sourceType);
      if (!normalizedStoreCode || !(row.partnerSku || row.variantId) || !source?.sourceId) {
        message.warning('请先维护该来源规格，再设为生效');
        return;
      }
      const key = buildEditKey(row, sourceType);
      setSelectingEffectiveKey(key);
      try {
        await selectProductSpecEffectiveSource({
          ownerUserId,
          storeCode: normalizedStoreCode,
          variantId: row.variantId,
          partnerSku: row.partnerSku,
          currentZCode: getProductCurrentZCode(row),
          skuParent: getProductCurrentZCode(row),
          sourceId: source.sourceId
        });
        message.success(`${sourceLabels[sourceType]}规格已设为生效`);
        await loadRows();
      } catch (error) {
        message.error(error instanceof Error ? error.message : '切换生效规格失败');
      } finally {
        setSelectingEffectiveKey(null);
      }
    },
    [loadRows, message, ownerUserId, storeCode]
  );

  const handleChangeLogisticsProfile = useCallback(
    async (
      row: ProductVariantSpecPayload,
      patch: Partial<ProductLogisticsProfilePayload>
    ) => {
      const normalizedStoreCode = storeCode.trim();
      if (!normalizedStoreCode || !(row.partnerSku || row.variantId)) {
        message.warning('缺少店铺或 SKU 上下文，暂不能保存物流属性');
        return;
      }
      const nextProfile = {
        ...defaultLogisticsProfile(row, normalizedStoreCode),
        ...row.logisticsProfile,
        ...patch
      };
      const normalizedNextProfile = withLogisticsConfirmationStatus(nextProfile);
      const key = productSpecRowKey(row);
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          productSpecRowKey(currentRow) === key ? { ...currentRow, logisticsProfile: normalizedNextProfile } : currentRow
        )
      );
      setLogisticsSavingKey(key);
      try {
        const saved = await saveProductLogisticsProfile({
          ...normalizedNextProfile,
          ownerUserId,
          storeCode: normalizedStoreCode,
          variantId: row.variantId,
          partnerSku: row.partnerSku,
          currentZCode: getProductCurrentZCode(row),
          skuParent: getProductCurrentZCode(row)
        });
        setRows((currentRows) => currentRows.map((currentRow) => (
          productSpecRowKey(currentRow) === key
            ? { ...currentRow, logisticsProfile: saved }
            : currentRow
        )));
      } catch (error) {
        message.error(error instanceof Error ? error.message : '保存物流属性失败，已重新加载当前数据');
        await loadRows();
      } finally {
        setLogisticsSavingKey(null);
      }
    },
    [loadRows, message, ownerUserId, storeCode]
  );

  const columns = useMemo<ColumnsType<ProductVariantSpecPayload>>(
    () => [
      {
        title: '商品',
        width: 284,
        render: (_, row) => (
          <Space size={8} align="start" style={{ minWidth: 0, width: 276 }}>
            <ProductThumb
              src={row.imageUrl}
              alt={formatSnapshotValue(row.title || row.partnerSku)}
              variantId={row.variantId}
            />
            <Space direction="vertical" size={2} style={{ minWidth: 0, maxWidth: 198 }}>
              <Tooltip title={formatSnapshotValue(row.title)}>
                <Paragraph
                  strong
                  data-testid={row.variantId ? `product-spec-title-${row.variantId}` : undefined}
                  ellipsis={{ rows: 3 }}
                  style={{ maxWidth: 198, fontSize: 12, lineHeight: '16px', marginBottom: 0 }}
                >
                  {formatSnapshotValue(row.title)}
                </Paragraph>
              </Tooltip>
              <Text type="secondary" style={{ fontSize: 12 }}>
                PSKU {formatSnapshotValue(row.partnerSku)}
              </Text>
              <Text type="secondary" ellipsis style={{ fontSize: 13, maxWidth: 198 }}>
                {formatSnapshotValue(storeLabelByCode.get(row.storeCode || storeCode) || row.storeCode || storeCode)}
              </Text>
            </Space>
          </Space>
        )
      },
      {
        title: '国内规格',
        width: 550,
        render: (_, row) => (
          <DomesticSpecMatrix
            row={row}
            sources={row.sources || []}
            effectiveSourceId={row.effectiveSourceId}
            effectiveSourceType={row.effectiveSourceType}
            editingKey={editingKey}
            editingDraft={editingDraft}
            savingKey={savingKey}
            selectingEffectiveKey={selectingEffectiveKey}
            onStartEdit={handleStartEdit}
            onDraftNumberChange={handleDraftNumberChange}
            onCancelEdit={handleCancelEdit}
            onSaveSource={handleSaveSource}
            onSelectEffectiveSource={handleSelectEffectiveSource}
          />
        )
      },
      {
        title: '物流属性',
        width: 250,
        fixed: 'right',
        render: (_, row) => (
          <LogisticsInlineEditor
            row={row}
            saving={logisticsSavingKey === productSpecRowKey(row)}
            savingBlocked={Boolean(logisticsSavingKey)}
            onChange={handleChangeLogisticsProfile}
          />
        )
      }
    ],
    [
      editingDraft,
      editingKey,
      handleCancelEdit,
      handleChangeLogisticsProfile,
      handleDraftNumberChange,
      handleSaveSource,
      handleSelectEffectiveSource,
      handleStartEdit,
      logisticsSavingKey,
      savingKey,
      selectingEffectiveKey,
      storeCode,
      storeLabelByCode
    ]
  );

  const filteredRows = useMemo(() => {
    let result: ProductVariantSpecPayload[];
    switch (completenessFilter) {
      case 'ali1688_missing':
        result = rows.filter((row) => isSourceProductSpecMissing(findSource(row.sources, 'ali1688')));
        break;
      case 'warehouse_missing':
        result = rows.filter((row) => isSourceProductSpecMissing(findSource(row.sources, 'warehouse')));
        break;
      case 'domestic_missing':
        result = rows.filter(isDomesticSpecMissing);
        break;
      case 'official_missing':
        result = rows.filter(isOfficialSpecMissing);
        break;
      case 'logistics_missing':
        result = rows.filter(isLogisticsProfileMissing);
        break;
      default:
        result = rows;
    }
    if (logisticsAttributeFilter === 'all') {
      return result;
    }
    return result.filter((row) => rowMatchesLogisticsAttributeFilter(row, logisticsAttributeFilter));
  }, [completenessFilter, logisticsAttributeFilter, rows]);

  return (
    <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="SKU / 标题"
            value={keyword}
            style={{ width: 260 }}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={() => void loadRows()}
          />
          <Select
            data-testid="product-specs-completeness-filter"
            value={completenessFilter}
            options={[
              { value: 'all', label: '全部规格' },
              { value: 'ali1688_missing', label: '1688规格缺失' },
              { value: 'warehouse_missing', label: '仓管规格缺失' },
              { value: 'domestic_missing', label: '国内规格缺失' },
              { value: 'official_missing', label: 'Noon官方尺寸缺失' },
              { value: 'logistics_missing', label: '物流属性缺失' }
            ]}
            style={{ width: 172 }}
            onChange={setCompletenessFilter}
          />
          <span data-testid="product-specs-logistics-attribute-filter">
            <Select<LogisticsAttributeFilter>
              value={logisticsAttributeFilter}
              options={logisticsAttributeFilterOptions}
              showSearch
              optionFilterProp="label"
              style={{ width: 190 }}
              onChange={(value) => setLogisticsAttributeFilter(value)}
            />
          </span>
          <Tooltip title="刷新">
            <Button icon={<SyncOutlined />} loading={loading} onClick={() => void loadRows()} />
          </Tooltip>
        </Space>
      </div>

      <Table<ProductVariantSpecPayload>
        rowKey={productSpecRowKey}
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={filteredRows}
        scroll={{ x: 1230 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`
        }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品规格" /> }}
      />
    </div>
  );
}

function readInitialProductSpecsKeyword() {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('keyword')?.trim() || '';
}

function DomesticSpecMatrix(props: {
  row: ProductVariantSpecPayload;
  sources: ProductVariantSpecSourcePayload[];
  effectiveSourceId?: number;
  effectiveSourceType?: string;
  editingKey: string | null;
  editingDraft: SpecSourceDraft;
  savingKey: string | null;
  selectingEffectiveKey: string | null;
  onStartEdit: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
  onDraftNumberChange: (field: SpecNumberField, value: number | string | null) => void;
  onCancelEdit: () => void;
  onSaveSource: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
  onSelectEffectiveSource: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
}) {
  const {
    row,
    sources,
    effectiveSourceId,
    effectiveSourceType,
    editingKey,
    editingDraft,
    savingKey,
    selectingEffectiveKey,
    onStartEdit,
    onDraftNumberChange,
    onCancelEdit,
    onSaveSource,
    onSelectEffectiveSource
  } = props;
  return (
    <div style={{ display: 'grid', gap: 6, width: 550, maxWidth: '100%' }}>
      <SpecGridHeader includeCarton includeSource includeEffective />
      {(['ali1688', 'warehouse'] as ProductVariantSpecSourceType[]).map((sourceType) => {
        const source = findSource(sources, sourceType);
        const editableSourceType: EditableSourceType | undefined = sourceType === 'ali1688' ? sourceType : undefined;
        const rowEditKey = editableSourceType ? buildEditKey(row, editableSourceType) : undefined;
        const effective = source?.sourceId
          ? source.sourceId === effectiveSourceId
          : effectiveSourceType === sourceType;
        return (
          <SpecGridRow
            key={sourceType}
            label={sourceLabels[sourceType]}
            color={sourceColors[sourceType]}
            row={row}
            sourceType={editableSourceType}
            cellTestSourceType={sourceType}
            sourceTestId={row.variantId ? `product-specs-source-${sourceType}-${row.variantId}` : undefined}
            source={source}
            fallback={effectiveSourceType === sourceType ? row : undefined}
            includeCarton
            editable={Boolean(editableSourceType)}
            reserveEffectiveColumn={!editableSourceType}
            effective={effective}
            editing={Boolean(rowEditKey && editingKey === rowEditKey)}
            draft={editingDraft}
            saving={savingKey === rowEditKey}
            selectingEffective={selectingEffectiveKey === rowEditKey}
            selectingEffectiveBlocked={Boolean(selectingEffectiveKey)}
            onStartEdit={editableSourceType ? onStartEdit : undefined}
            onDraftNumberChange={onDraftNumberChange}
            onCancelEdit={onCancelEdit}
            onSaveSource={editableSourceType ? onSaveSource : undefined}
            onSelectEffectiveSource={editableSourceType ? onSelectEffectiveSource : undefined}
          />
        );
      })}
      <SpecGridRow
        label="Noon官方"
        color={sourceColors.noon_official}
        row={row}
        source={findSource(sources, 'noon_official')}
        cellTestSourceType="noon_official"
        sourceTestId={row.variantId ? `product-specs-source-noon_official-${row.variantId}` : undefined}
        includeCarton
        reserveEffectiveColumn
        showCartonFields={false}
      />
    </div>
  );
}

function LogisticsInlineEditor(props: {
  row: ProductVariantSpecPayload;
  saving: boolean;
  savingBlocked: boolean;
  onChange: (row: ProductVariantSpecPayload, patch: Partial<ProductLogisticsProfilePayload>) => void | Promise<void>;
}) {
  const { row, saving, savingBlocked, onChange } = props;
  const profile = {
    ...defaultLogisticsProfile(row, row.storeCode),
    ...row.logisticsProfile
  };
  const disabled = savingBlocked;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 5,
        alignItems: 'end',
        width: 240,
        maxWidth: '100%',
        minWidth: 0
      }}
    >
      {logisticsFieldConfigs.map((config) => (
        <LogisticsSelectField
          key={config.field}
          ariaLabel={config.ariaLabel}
          testId={row.variantId ? `product-specs-logistics-select-${config.field}-${row.variantId}` : undefined}
          value={profile[config.field] || 'unknown'}
          options={config.options}
          disabled={disabled}
          saving={saving}
          onChange={(value) => void onChange(row, { [config.field]: value })}
        />
      ))}
    </div>
  );
}

function LogisticsSelectField(props: {
  ariaLabel: string;
  testId?: string;
  value?: string;
  options: LogisticsOption[];
  disabled?: boolean;
  saving?: boolean;
  onChange: (value: string) => void;
}) {
  const { ariaLabel, testId, value, options, disabled, saving, onChange } = props;
  const normalizedValue = value || 'unknown';
  const confirmed = isConfirmedLogisticsValue(normalizedValue);
  const valueKind = logisticsValueKind(normalizedValue);
  return (
    <label aria-label={ariaLabel} style={{ display: 'grid', gap: 3, minWidth: 0 }}>
      <Select
        data-testid={testId}
        aria-label={ariaLabel}
        size="small"
        value={normalizedValue}
        options={options}
        disabled={disabled}
        suffixIcon={null}
        className={[
          'product-specs-logistics-select',
          confirmed ? 'product-specs-logistics-select--confirmed' : 'product-specs-logistics-select--missing',
          valueKind === 'none' ? 'product-specs-logistics-select--none' : '',
          valueKind === 'included' ? 'product-specs-logistics-select--included' : '',
          saving ? 'product-specs-logistics-select--saving' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: '100%', minWidth: 0 }}
        onChange={onChange}
      />
    </label>
  );
}

function logisticsFilterOptionLabel(option: LogisticsOption) {
  return option.value === 'unknown' ? '未选择' : option.label;
}

function isConfirmedLogisticsValue(value: string) {
  return Boolean(value && value !== 'unknown');
}

function logisticsValueKind(value: string) {
  if (!isConfirmedLogisticsValue(value)) {
    return 'missing';
  }
  return value === 'none' ? 'none' : 'included';
}

function withLogisticsConfirmationStatus(profile: ProductLogisticsProfilePayload): ProductLogisticsProfilePayload {
  const confirmed = logisticsFieldConfigs.every((config) =>
    isConfirmedLogisticsValue(String(profile[config.field] || 'unknown'))
  );
  return {
    ...profile,
    profileStatus: confirmed ? 'confirmed' : 'needs_review',
    manualConfirmRequired: !confirmed
  };
}

function SpecGridHeader(props: { includeCarton: boolean; includeSource: boolean; includeEffective?: boolean }) {
  const { includeCarton, includeSource, includeEffective = false } = props;
  return (
    <div style={specGridStyle({ includeCarton, includeSource, includeEffective })}>
      {includeEffective ? <span aria-hidden="true" /> : null}
      {includeSource ? <Text type="secondary" style={headerCellStyle}>来源</Text> : null}
      {productSpecFields.map((field) => (
        <Text key={field.key} type="secondary" style={headerCellStyle}>
          {field.label}
        </Text>
      ))}
      {includeCarton ? (
        <>
          {cartonSpecFields.map((field) => (
            <Text key={field.key} type="secondary" style={headerCellStyle}>
              {field.label}
            </Text>
          ))}
        </>
      ) : null}
    </div>
  );
}

function SpecGridRow(props: {
  label: string;
  color: string;
  row?: ProductVariantSpecPayload;
  sourceType?: EditableSourceType;
  cellTestSourceType?: ProductVariantSpecSourceType;
  sourceTestId?: string;
  source?: ProductVariantSpecSourcePayload;
  fallback?: ProductVariantSpecPayload;
  includeCarton: boolean;
  showCartonFields?: boolean;
  showSource?: boolean;
  editable?: boolean;
  effective?: boolean;
  editing?: boolean;
  reserveEffectiveColumn?: boolean;
  draft?: SpecSourceDraft;
  saving?: boolean;
  selectingEffective?: boolean;
  selectingEffectiveBlocked?: boolean;
  onStartEdit?: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
  onDraftNumberChange?: (field: SpecNumberField, value: number | string | null) => void;
  onCancelEdit?: () => void;
  onSaveSource?: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
  onSelectEffectiveSource?: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
}) {
  const {
    label,
    color,
    row,
    sourceType,
    cellTestSourceType,
    sourceTestId,
    source,
    fallback,
    includeCarton,
    showCartonFields = includeCarton,
    showSource = true,
    editable,
    effective,
    editing,
    reserveEffectiveColumn,
    draft,
    saving,
    selectingEffective,
    selectingEffectiveBlocked,
    onStartEdit,
    onDraftNumberChange,
    onCancelEdit,
    onSaveSource,
    onSelectEffectiveSource
  } = props;
  const valueSource = source || fallback;
  const fields = showCartonFields ? [...productSpecFields, ...cartonSpecFields] : productSpecFields;
  const testSourceType = cellTestSourceType || sourceType;
  const canSelectEffective = Boolean(editable && row && sourceType && source?.sourceId);
  const includeEffectiveColumn = Boolean(editable || reserveEffectiveColumn);
  return (
    <div style={specGridStyle({ includeCarton, includeSource: showSource, includeEffective: includeEffectiveColumn })}>
      {editable ? (
        <Tooltip title={canSelectEffective ? '物流计算使用此来源' : '请先维护该来源规格'}>
          <Button
            type="text"
            size="small"
            aria-label={`设为生效${label}规格`}
            icon={effective ? <CheckOutlined /> : undefined}
            loading={selectingEffective}
            disabled={!canSelectEffective || Boolean(editing) || Boolean(selectingEffectiveBlocked)}
            style={{
              width: 20,
              minWidth: 20,
              height: 20,
              padding: 0,
              borderRadius: 10,
              color: effective ? '#16a34a' : '#94a3b8',
              border: effective ? '1px solid #86efac' : '1px solid #cbd5e1',
              background: effective ? '#f0fdf4' : '#ffffff',
              lineHeight: '18px'
            }}
            onClick={() => {
              if (!effective && row && sourceType) {
                onSelectEffectiveSource?.(row, sourceType);
              }
            }}
          />
        </Tooltip>
      ) : reserveEffectiveColumn ? (
        <Tooltip title={effective ? '当前经营生效来源' : '仓管规格由 APP 维护'}>
          <span
            aria-label={effective ? `当前生效${label}规格` : undefined}
            style={{
              display: 'inline-flex',
              width: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              color: effective ? '#16a34a' : '#cbd5e1'
            }}
          >
            {effective ? <CheckOutlined /> : null}
          </span>
        </Tooltip>
      ) : null}
      {showSource ? (
        <Space size={4} wrap style={{ minWidth: 0 }}>
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            <span data-testid={sourceTestId}>{label}</span>
          </Tag>
          {editable && row && sourceType && !editing ? (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                aria-label={`编辑${label}规格`}
                icon={<EditOutlined />}
                style={{ width: 20, height: 20 }}
                onClick={() => onStartEdit?.(row, sourceType)}
              />
            </Tooltip>
          ) : null}
          {editable && row && sourceType && editing ? (
            <Space size={0}>
              <Tooltip title="保存">
                <Button
                  type="text"
                  size="small"
                  aria-label={`保存${label}规格`}
                  icon={<CheckOutlined />}
                  loading={saving}
                  style={{ width: 20, height: 20, color: '#16a34a' }}
                  onClick={() => onSaveSource?.(row, sourceType)}
                />
              </Tooltip>
              <Tooltip title="取消">
                <Button
                  type="text"
                  size="small"
                  aria-label={`取消编辑${label}规格`}
                  icon={<CloseOutlined />}
                  disabled={saving}
                  style={{ width: 20, height: 20, color: '#64748b' }}
                  onClick={onCancelEdit}
                />
              </Tooltip>
            </Space>
          ) : null}
        </Space>
      ) : null}
      {fields.map((field) =>
        editing ? (
          <InputNumber
            key={field.key}
            size="small"
            controls={false}
            min={field.min}
            precision={field.precision}
            value={draft?.[field.key] ?? null}
            style={{ width: '100%', minWidth: 0 }}
            onChange={(value) => onDraftNumberChange?.(field.key, value)}
          />
        ) : (
          <SpecValue
            key={field.key}
            value={valueSource?.[field.key]}
            testId={
              row?.variantId && testSourceType
                ? `product-specs-spec-cell-${testSourceType}-${field.key}-${row.variantId}`
                : undefined
            }
          />
        )
      )}
    </div>
  );
}

function SpecValue({ value, testId }: { value?: number; testId?: string }) {
  return (
    <Text data-testid={testId} style={{ display: 'block', width: '100%', fontSize: 12, whiteSpace: 'nowrap' }}>
      {value == null ? '-' : formatCompactNumber(value)}
    </Text>
  );
}

function ProductThumb({ src, alt, variantId }: { src?: string; alt: string; variantId?: number }) {
  const normalizedSrc = normalizeNoonImageUrl(src);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setFailed(false);
    setPreviewOpen(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || failed) {
    return (
      <span
        data-testid={variantId ? `product-spec-thumb-${variantId}` : undefined}
        style={{
          flex: '0 0 auto',
          width: 70,
          height: 90,
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#f3f4f6',
          color: '#94a3b8',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11
        }}
      >
        无图
      </span>
    );
  }
  return (
    <span
      data-testid={variantId ? `product-spec-thumb-${variantId}` : undefined}
      onMouseEnter={() => setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
      style={{
        flex: '0 0 auto',
        width: 70,
        height: 90,
        position: 'relative',
        display: 'block'
      }}
    >
      <img
        src={normalizedSrc}
        alt={alt}
        onError={() => setFailed(true)}
        style={{
          width: 70,
          height: 90,
          objectFit: 'cover',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#f1f5f9',
          display: 'block'
        }}
      />
      {previewOpen ? (
        <span
          style={{
            position: 'absolute',
            left: 78,
            top: -8,
            zIndex: 20,
            width: 180,
            height: 180,
            padding: 6,
            borderRadius: 8,
            border: '1px solid #dbe3ef',
            background: '#ffffff',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.2)'
          }}
        >
          <img
            src={normalizedSrc}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </span>
      ) : null}
    </span>
  );
}

function findSource(
  sources: ProductVariantSpecSourcePayload[] | undefined,
  sourceType: ProductVariantSpecSourceType
) {
  return (sources || []).find((source) => source.sourceType === sourceType);
}

function isOfficialSpecMissing(row: ProductVariantSpecPayload) {
  return isSourceProductSpecMissing(findSource(row.sources, 'noon_official'));
}

function isDomesticSpecMissing(row: ProductVariantSpecPayload) {
  return (
    isSourceProductSpecMissing(findSource(row.sources, 'ali1688')) &&
    isSourceProductSpecMissing(findSource(row.sources, 'warehouse'))
  );
}

function isLogisticsProfileMissing(row: ProductVariantSpecPayload) {
  const profile = {
    ...defaultLogisticsProfile(row, row.storeCode),
    ...row.logisticsProfile
  };
  return logisticsFieldConfigs.some((config) => !isConfirmedLogisticsValue(String(profile[config.field] || 'unknown')));
}

function rowMatchesLogisticsAttributeFilter(row: ProductVariantSpecPayload, filter: LogisticsAttributeFilter) {
  if (filter === 'all') {
    return true;
  }
  const separatorIndex = filter.indexOf(':');
  if (separatorIndex < 0) {
    return true;
  }
  const field = filter.slice(0, separatorIndex) as LogisticsProfileField;
  const expectedValue = filter.slice(separatorIndex + 1);
  if (!logisticsFieldConfigs.some((config) => config.field === field)) {
    return true;
  }
  const profile = {
    ...defaultLogisticsProfile(row, row.storeCode),
    ...row.logisticsProfile
  };
  return String(profile[field] || 'unknown') === expectedValue;
}

function isSourceProductSpecMissing(source?: ProductVariantSpecSourcePayload) {
  if (!source) {
    return true;
  }
  return productSpecFields.some((field) => !isPositiveSpecValue(source[field.key]));
}

function isPositiveSpecValue(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function defaultLogisticsProfile(row: ProductVariantSpecPayload, storeCode?: string): ProductLogisticsProfilePayload {
  return {
    storeCode: row.storeCode || storeCode,
    skuParent: row.skuParent,
    currentZCode: getProductCurrentZCode(row),
    title: row.title,
    imageUrl: row.imageUrl,
    variantId: row.variantId,
    partnerSku: row.partnerSku,
    childSku: row.childSku,
    sizeEn: row.sizeEn,
    sizeAr: row.sizeAr,
    profileStatus: 'needs_review',
    batteryType: 'unknown',
    electricType: 'unknown',
    magneticType: 'unknown',
    liquidType: 'unknown',
    powderType: 'unknown',
    woodenMaterialType: 'unknown',
    bladeWeaponType: 'unknown',
    manualConfirmRequired: true
  };
}

type ProductSpecStoreScope = {
  storeCode: string;
};

function resolveCurrentSpecStoreScope(session: AuthSession): ProductSpecStoreScope {
  const stores = collectSpecStores(session);
  const currentStore = resolveCurrentSpecBusinessStore(session, stores);
  if (!currentStore?.storeCode) {
    return { storeCode: '' };
  }
  const currentGroupKey = specBusinessStoreKey(currentStore);
  const groupStores = stores.filter((store) => specBusinessStoreKey(store) === currentGroupKey);
  const requestStore =
    groupStores
      .filter((store) => store.storeCode && store.authorized !== false)
      .sort(compareSpecRequestStores)[0] ||
    groupStores.filter((store) => store.storeCode).sort(compareSpecRequestStores)[0] ||
    currentStore;
  return {
    storeCode: requestStore.storeCode || currentStore.storeCode || ''
  };
}

function collectSpecStores(session: AuthSession) {
  const stores: AuthSessionStore[] = [];
  const seen = new Set<string>();
  const addStore = (store?: AuthSessionStore | null) => {
    if (!store?.storeCode) {
      return;
    }
    const key = `${store.storeCode}::${store.site || ''}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    stores.push(store);
  };
  (session.userStores || []).forEach(addStore);
  addStore(session.currentStore);
  return stores;
}

function resolveCurrentSpecBusinessStore(session: AuthSession, stores: AuthSessionStore[]) {
  const currentStoreCode = session.currentStore?.storeCode;
  const currentSite = session.currentStore?.site;
  if (currentStoreCode) {
    return (
      stores.find(
        (store) => store.storeCode === currentStoreCode && String(store.site || '') === String(currentSite || '')
      ) ||
      stores.find((store) => store.storeCode === currentStoreCode) ||
      session.currentStore
    );
  }
  return stores.find((store) => store.authorized !== false) || stores[0];
}

function specBusinessStoreKey(store: AuthSessionStore) {
  return store.projectCode || store.orgCode || store.projectName || store.storeCode;
}

function specBusinessStoreLabel(store: AuthSessionStore) {
  return store.projectName || store.orgName || store.projectCode || store.storeCode;
}

function compareSpecRequestStores(left: AuthSessionStore, right: AuthSessionStore) {
  return (
    String(left.storeCode || '').localeCompare(String(right.storeCode || '')) ||
    String(left.site || '').localeCompare(String(right.site || ''))
  );
}

function buildStoreLabelByCode(session: AuthSession) {
  const labels = new Map<string, string>();
  collectSpecStores(session).forEach((store) => {
    if (!store.storeCode || labels.has(store.storeCode)) {
      return;
    }
    labels.set(store.storeCode, specBusinessStoreLabel(store));
  });
  return labels;
}

function resolveRequestOwnerUserId(session: AuthSession, activeOwnerId?: number) {
  if (session.defaultOwnerUserId) {
    return activeOwnerId || session.defaultOwnerUserId;
  }
  return undefined;
}

function specGridStyle(props: { includeCarton: boolean; includeSource: boolean; includeEffective?: boolean }) {
  const { includeCarton, includeSource, includeEffective = false } = props;
  const prefixColumns = [
    includeEffective ? '20px' : '',
    includeSource ? (includeCarton ? '76px' : '0px') : ''
  ].filter(Boolean);
  const valueColumns = includeCarton ? 'repeat(9, minmax(22px, 1fr))' : 'repeat(4, minmax(22px, 1fr))';
  return {
    display: 'grid',
    gridTemplateColumns: [...prefixColumns, valueColumns].join(' '),
    gap: '5px 4px',
    alignItems: 'center',
    minWidth: 0
  } as const;
}

const headerCellStyle = {
  fontSize: 12,
  lineHeight: '18px',
  whiteSpace: 'nowrap'
} as const;

function createSpecSourceDraft(
  source?: ProductVariantSpecSourcePayload | ProductVariantSpecPayload,
  sourceType?: EditableSourceType
): SpecSourceDraft {
  return {
    productLengthCm: source?.productLengthCm ?? undefined,
    productWidthCm: source?.productWidthCm ?? undefined,
    productHeightCm: source?.productHeightCm ?? undefined,
    productWeightG: source?.productWeightG ?? undefined,
    cartonLengthCm: source?.cartonLengthCm ?? undefined,
    cartonWidthCm: source?.cartonWidthCm ?? undefined,
    cartonHeightCm: source?.cartonHeightCm ?? undefined,
    cartonWeightKg: source?.cartonWeightKg ?? undefined,
    cartonQuantity: source?.cartonQuantity ?? undefined,
    cartonSourceType:
      source?.cartonSourceType ??
      (sourceType === 'ali1688' ? 'factory_carton' : sourceType === 'warehouse' ? 'warehouse_measured' : 'none'),
    batteryMagneticType: source?.batteryMagneticType ?? 'unknown',
    liquidPowderType: source?.liquidPowderType ?? 'unknown'
  };
}

function normalizeDraftNumber(value: number | string | null) {
  if (value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildEditKey(row: ProductVariantSpecPayload, sourceType: EditableSourceType) {
  return `${productSpecRowKey(row)}:${sourceType}`;
}

function productSpecRowKey(row: ProductVariantSpecPayload) {
  return [
    getProductStableIdentityKey(row),
    row.childSku || row.sizeEn || row.sizeAr || row.variantId
  ].map((value) => String(value ?? '').trim()).filter(Boolean).join(':');
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
