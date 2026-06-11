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

const { Text } = Typography;

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

type EditableSourceType = Extract<ProductVariantSpecSourceType, 'ali1688' | 'warehouse'>;
type SpecCompletenessFilter = 'all' | 'domestic_missing' | 'official_missing';

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

type StoreOption = {
  value: string;
  label: string;
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

const baseLogisticsOptions: LogisticsOption[] = [
  { label: '待确认', value: 'unknown' },
  { label: '无', value: 'none' }
];

const logisticsSelectOptions: Partial<Record<keyof ProductLogisticsProfilePayload, LogisticsOption[]>> = {
  batteryType: [...baseLogisticsOptions, { label: '带电', value: 'battery_equipment' }],
  electricType: [...baseLogisticsOptions, { label: '电器', value: 'electric_equipment_review' }],
  magneticType: [...baseLogisticsOptions, { label: '磁性', value: 'magnetic' }],
  liquidType: [...baseLogisticsOptions, { label: '液体', value: 'liquid' }],
  powderType: [...baseLogisticsOptions, { label: '粉末', value: 'powder' }],
  woodenMaterialType: [...baseLogisticsOptions, { label: '需复核', value: 'wooden_material_review' }],
  bladeWeaponType: [...baseLogisticsOptions, { label: '需复核', value: 'blade_tool_review' }]
};

const logisticsStatusOptions: LogisticsOption[] = [
  { label: '待复核', value: 'needs_review' },
  { label: '已确认', value: 'confirmed' }
];

export function ProductSpecsPage({ session, activeOwnerId }: ProductSpecsPageProps) {
  const { message } = App.useApp();
  const ownerUserId = resolveRequestOwnerUserId(session, activeOwnerId);
  const initialStoreCode = resolveInitialSpecStoreCode(session);
  const [storeCode, setStoreCode] = useState(initialStoreCode);
  const [keyword, setKeyword] = useState('');
  const [completenessFilter, setCompletenessFilter] = useState<SpecCompletenessFilter>('all');
  const [rows, setRows] = useState<ProductVariantSpecPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<SpecSourceDraft>(createSpecSourceDraft());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [selectingEffectiveKey, setSelectingEffectiveKey] = useState<string | null>(null);
  const [logisticsSavingKey, setLogisticsSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialStoreCode && !storeCode) {
      setStoreCode(initialStoreCode);
    }
  }, [initialStoreCode, storeCode]);

  const storeOptions = useMemo(() => {
    return buildSpecStoreOptions(session);
  }, [session.userStores]);

  const storeLabelByCode = useMemo(() => {
    return new Map(storeOptions.map((option) => [option.value, option.label]));
  }, [storeOptions]);

  useEffect(() => {
    if (!storeOptions.length || !storeCode) {
      return;
    }
    if (!storeOptions.some((option) => option.value === storeCode)) {
      setStoreCode(storeOptions[0]?.value || '');
    }
  }, [storeCode, storeOptions]);

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
      if (!normalizedStoreCode || !row.variantId) {
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
      if (!normalizedStoreCode || !row.variantId || !source?.sourceId) {
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
    async (row: ProductVariantSpecPayload, patch: Partial<ProductLogisticsProfilePayload>) => {
      const normalizedStoreCode = storeCode.trim();
      if (!normalizedStoreCode || !row.variantId) {
        message.warning('缺少店铺或 SKU 上下文，暂不能保存物流属性');
        return;
      }

      const nextProfile = {
        ...defaultLogisticsProfile(row, normalizedStoreCode),
        ...row.logisticsProfile,
        ...patch
      };
      const key = String(row.variantId);
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.variantId === row.variantId ? { ...currentRow, logisticsProfile: nextProfile } : currentRow
        )
      );
      setLogisticsSavingKey(key);

      try {
        const saved = await saveProductLogisticsProfile({
          ...nextProfile,
          ownerUserId,
          storeCode: normalizedStoreCode,
          variantId: row.variantId
        });
        setRows((currentRows) =>
          currentRows.map((currentRow) =>
            currentRow.variantId === row.variantId ? { ...currentRow, logisticsProfile: saved } : currentRow
          )
        );
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
        width: 262,
        render: (_, row) => (
          <Space size={8} align="start" style={{ minWidth: 0, width: 254 }}>
            <ProductThumb src={row.imageUrl} alt={formatSnapshotValue(row.title || row.partnerSku)} />
            <Space direction="vertical" size={2} style={{ minWidth: 0, maxWidth: 186 }}>
              <Tooltip title={formatSnapshotValue(row.title)}>
                <Text strong ellipsis style={{ maxWidth: 186, fontSize: 12 }}>
                  {formatSnapshotValue(row.title)}
                </Text>
              </Tooltip>
              <Text type="secondary" style={{ fontSize: 12 }}>
                PSKU {formatSnapshotValue(row.partnerSku)}
              </Text>
              <Text type="secondary" ellipsis style={{ fontSize: 13, maxWidth: 186 }}>
                {formatSnapshotValue(storeLabelByCode.get(row.storeCode || storeCode) || row.storeCode || storeCode)}
              </Text>
            </Space>
          </Space>
        )
      },
      {
        title: '国内规格',
        width: 720,
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
        title: 'Noon官方尺寸',
        width: 185,
        render: (_, row) => <NoonOfficialSpec source={findSource(row.sources, 'noon_official')} />
      },
      {
        title: '物流属性',
        width: 300,
        fixed: 'right',
        render: (_, row) => (
          <LogisticsInlineEditor
            row={row}
            saving={logisticsSavingKey === String(row.variantId)}
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
    switch (completenessFilter) {
      case 'domestic_missing':
        return rows.filter(isDomesticSpecMissing);
      case 'official_missing':
        return rows.filter(isOfficialSpecMissing);
      default:
        return rows;
    }
  }, [completenessFilter, rows]);

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
              { value: 'domestic_missing', label: '国内规格缺失' },
              { value: 'official_missing', label: '官方尺寸缺失' }
            ]}
            style={{ width: 150 }}
            onChange={setCompletenessFilter}
          />
          <Select
            showSearch
            value={storeCode || undefined}
            placeholder="店铺"
            options={storeOptions}
            style={{ width: 200 }}
            onChange={(value) => {
              setStoreCode(value);
              setEditingKey(null);
            }}
          />
          <Tooltip title="刷新">
            <Button icon={<SyncOutlined />} loading={loading} onClick={() => void loadRows()} />
          </Tooltip>
        </Space>
      </div>

      <Table<ProductVariantSpecPayload>
        rowKey={(row) => String(row.variantId || `${row.skuParent}-${row.partnerSku}-${row.childSku}`)}
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={filteredRows}
        scroll={{ x: 1460 }}
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
    <div style={{ display: 'grid', gap: 6 }}>
      <SpecGridHeader includeCarton includeSource includeEffective />
      {(['ali1688', 'warehouse'] as EditableSourceType[]).map((sourceType) => {
        const source = findSource(sources, sourceType);
        const rowEditKey = buildEditKey(row, sourceType);
        const effective = source?.sourceId
          ? source.sourceId === effectiveSourceId
          : effectiveSourceType === sourceType;
        return (
          <SpecGridRow
            key={sourceType}
            label={sourceLabels[sourceType]}
            color={sourceColors[sourceType]}
            row={row}
            sourceType={sourceType}
            source={source}
            fallback={effectiveSourceType === sourceType ? row : undefined}
            includeCarton
            editable
            effective={effective}
            editing={editingKey === rowEditKey}
            draft={editingDraft}
            saving={savingKey === rowEditKey}
            selectingEffective={selectingEffectiveKey === rowEditKey}
            selectingEffectiveBlocked={Boolean(selectingEffectiveKey)}
            onStartEdit={onStartEdit}
            onDraftNumberChange={onDraftNumberChange}
            onCancelEdit={onCancelEdit}
            onSaveSource={onSaveSource}
            onSelectEffectiveSource={onSelectEffectiveSource}
          />
        );
      })}
    </div>
  );
}

function NoonOfficialSpec({ source }: { source?: ProductVariantSpecSourcePayload }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <SpecGridHeader includeCarton={false} includeSource={false} />
      <SpecGridRow
        label="Noon官方"
        color="purple"
        source={source}
        includeCarton={false}
        showSource={false}
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
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 90px)', gap: 5, alignItems: 'end', minWidth: 0 }}
    >
      <LogisticsSelectField
        label="状态"
        value={profile.profileStatus || 'needs_review'}
        options={logisticsStatusOptions}
        disabled={disabled}
        saving={saving}
        onChange={(value) => void onChange(row, { profileStatus: value, manualConfirmRequired: value !== 'confirmed' })}
      />
      <LogisticsSelectField
        label="带电"
        value={profile.batteryType || 'unknown'}
        options={logisticsSelectOptions.batteryType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { batteryType: value })}
      />
      <LogisticsSelectField
        label="电器"
        value={profile.electricType || 'unknown'}
        options={logisticsSelectOptions.electricType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { electricType: value })}
      />
      <LogisticsSelectField
        label="磁性"
        value={profile.magneticType || 'unknown'}
        options={logisticsSelectOptions.magneticType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { magneticType: value })}
      />
      <LogisticsSelectField
        label="液体"
        value={profile.liquidType || 'unknown'}
        options={logisticsSelectOptions.liquidType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { liquidType: value })}
      />
      <LogisticsSelectField
        label="粉末"
        value={profile.powderType || 'unknown'}
        options={logisticsSelectOptions.powderType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { powderType: value })}
      />
      <LogisticsSelectField
        label="木材"
        value={profile.woodenMaterialType || 'unknown'}
        options={logisticsSelectOptions.woodenMaterialType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { woodenMaterialType: value })}
      />
      <LogisticsSelectField
        label="刀具"
        value={profile.bladeWeaponType || 'unknown'}
        options={logisticsSelectOptions.bladeWeaponType || []}
        disabled={disabled}
        sensitiveField
        saving={saving}
        onChange={(value) => void onChange(row, { bladeWeaponType: value })}
      />
    </div>
  );
}

function LogisticsSelectField(props: {
  label: string;
  value?: string;
  options: LogisticsOption[];
  disabled?: boolean;
  sensitiveField?: boolean;
  saving?: boolean;
  onChange: (value: string) => void;
}) {
  const { label, value, options, disabled, sensitiveField, saving, onChange } = props;
  const normalizedValue = value || 'unknown';
  const hasSensitiveValue = Boolean(sensitiveField && !isNeutralLogisticsValue(normalizedValue));
  const isNoneValue = normalizedValue === 'none';
  return (
    <label style={{ display: 'grid', gap: 3, minWidth: 0 }}>
      <Text type="secondary" style={{ fontSize: 12, lineHeight: '16px' }}>
        {label}
      </Text>
      <Select
        size="small"
        value={normalizedValue}
        options={options}
        disabled={disabled}
        className={[
          'product-specs-logistics-select',
          isNoneValue ? 'product-specs-logistics-select--none' : '',
          hasSensitiveValue ? 'product-specs-logistics-select--sensitive' : '',
          saving ? 'product-specs-logistics-select--saving' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: '100%' }}
        onChange={onChange}
      />
    </label>
  );
}

function isNeutralLogisticsValue(value: string) {
  return value === 'none' || value === 'unknown';
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
  source?: ProductVariantSpecSourcePayload;
  fallback?: ProductVariantSpecPayload;
  includeCarton: boolean;
  showSource?: boolean;
  editable?: boolean;
  effective?: boolean;
  editing?: boolean;
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
    source,
    fallback,
    includeCarton,
    showSource = true,
    editable,
    effective,
    editing,
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
  const fields = includeCarton ? [...productSpecFields, ...cartonSpecFields] : productSpecFields;
  const canSelectEffective = Boolean(editable && row && sourceType && source?.sourceId);
  return (
    <div style={specGridStyle({ includeCarton, includeSource: showSource, includeEffective: Boolean(editable) })}>
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
      ) : null}
      {showSource ? (
        <Space size={4} wrap style={{ minWidth: 0 }}>
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            {label}
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
          <SpecValue key={field.key} value={valueSource?.[field.key]} />
        )
      )}
    </div>
  );
}

function SpecValue({ value }: { value?: number }) {
  return (
    <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
      {value == null ? '-' : formatCompactNumber(value)}
    </Text>
  );
}

function ProductThumb({ src, alt }: { src?: string; alt: string }) {
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
        style={{
          flex: '0 0 auto',
          width: 60,
          height: 60,
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
      onMouseEnter={() => setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
      style={{
        flex: '0 0 auto',
        width: 60,
        height: 60,
        position: 'relative',
        display: 'block'
      }}
    >
      <img
        src={normalizedSrc}
        alt={alt}
        onError={() => setFailed(true)}
        style={{
          width: 60,
          height: 60,
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
            left: 68,
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

function isDomesticSpecMissing(row: ProductVariantSpecPayload) {
  return (['ali1688', 'warehouse'] as EditableSourceType[]).some((sourceType) =>
    isSourceProductSpecMissing(findSource(row.sources, sourceType))
  );
}

function isOfficialSpecMissing(row: ProductVariantSpecPayload) {
  return isSourceProductSpecMissing(findSource(row.sources, 'noon_official'));
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

function buildSpecStoreOptions(session: AuthSession) {
  const grouped = new Map<string, { option: StoreOption; preferred: boolean }>();
  (session.userStores || []).forEach((store) => {
    if (!store.storeCode || store.authorized === false) {
      return;
    }
    const groupKey = specStoreGroupKey(store);
    const existing = grouped.get(groupKey);
    const preferred = isPreferredSpecStore(store);
    if (existing && (!preferred || existing.preferred)) {
      return;
    }
    grouped.set(groupKey, {
      option: {
        value: store.storeCode,
        label: store.projectName || store.projectCode || store.storeCode
      },
      preferred
    });
  });
  return Array.from(grouped.values()).map((entry) => entry.option);
}

function resolveInitialSpecStoreCode(session: AuthSession) {
  const options = buildSpecStoreOptions(session);
  if (!options.length) {
    return '';
  }
  const currentStore = session.currentStore;
  if (!currentStore?.storeCode) {
    return options[0]?.value || '';
  }
  const currentGroupKey = specStoreGroupKey(currentStore);
  const matched = buildSpecStoreOptions({
    ...session,
    userStores: (session.userStores || []).filter((store) => specStoreGroupKey(store) === currentGroupKey)
  })[0];
  return matched?.value || options[0]?.value || '';
}

function specStoreGroupKey(store: Partial<AuthSessionStore>) {
  return store.projectCode || store.projectName || store.storeCode || '';
}

function isPreferredSpecStore(store: Partial<AuthSessionStore>) {
  const site = String(store.site || '').trim().toUpperCase();
  const storeCode = String(store.storeCode || '').trim().toUpperCase();
  return site === 'AE' || storeCode.endsWith('-NAE');
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
    includeSource ? (includeCarton ? '88px' : '0px') : ''
  ].filter(Boolean);
  const valueColumns = includeCarton ? 'repeat(9, minmax(43px, 1fr))' : 'repeat(4, minmax(43px, 1fr))';
  return {
    display: 'grid',
    gridTemplateColumns: [...prefixColumns, valueColumns].join(' '),
    gap: '5px 6px',
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
  return `${row.variantId || row.partnerSku || row.childSku || row.skuParent}:${sourceType}`;
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
