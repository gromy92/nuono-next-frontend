import type { ProductVariantSpecPayload, ProductVariantSpecSourcePayload, ProductVariantSpecSourceType } from '../types'
import {
  sourceColors, sourceLabels, type EditableSourceType, type SpecNumberField, type SpecSourceDraft
} from '../specPageConfig'
import { buildEditKey, findSource } from '../specDomain'
import { SpecGridHeader, SpecGridRow } from './SpecGrid'

export function DomesticSpecMatrix(props: {
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

