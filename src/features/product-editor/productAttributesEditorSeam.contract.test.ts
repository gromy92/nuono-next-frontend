import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const editorFiles = [
  'ProductAttributesPanel.tsx',
  'ProductAttributeFieldControl.tsx',
  'productAttributeTemplateConfig.ts',
  'productAttributeTemplate.ts',
  'productAttributeValueModel.ts',
  'productAttributeUnits.ts'
];

editorFiles.forEach((fileName) => {
  const source = readFileSync(`src/features/product-editor/${fileName}`, 'utf8');
  assert.doesNotMatch(
    source,
    /from ['"][^'"]*(?:product-management|product-listing)/,
    `${fileName} must not depend on either product editor host Module`
  );
  assert(
    source.split('\n').length <= 301,
    `${fileName} must stay at or below 300 physical lines after moving into product-editor`
  );
});

[
  'components/ProductAttributesPanel.tsx',
  'components/ProductAttributeFieldControl.tsx',
  'productAttributeTemplate.ts'
].forEach((relativePath) => {
  assert.equal(
    existsSync(`src/features/product-management/${relativePath}`),
    false,
    `product-management must not retain the shared ${relativePath} Implementation`
  );
});

const contentTabSource = readFileSync(
  'src/features/product-editor/ProductContentTab.tsx',
  'utf8'
);
const fieldIssuesSource = readFileSync(
  'src/features/product-management/utils/fieldDomainIssues.ts',
  'utf8'
);
const derivedStateSource = readFileSync(
  'src/features/product-management/hooks/useProductWorkbenchDerivedState.ts',
  'utf8'
);

assert.match(
  contentTabSource,
  /from ['"]\.\/ProductAttributesPanel/,
  'the shared Content host must consume the local attribute editor Interface'
);
[fieldIssuesSource, derivedStateSource].forEach((source) => {
  assert.match(
    source,
    /product-editor\/productAttributeTemplate/,
    'management-only state must consume the shared attribute template through product-editor'
  );
});
