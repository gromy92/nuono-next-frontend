import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const editorFiles = [
  'ProductClassificationEditor.tsx',
  'ProductClassificationFields.tsx',
  'ProductCompetitorCategoryModal.tsx'
];

editorFiles.forEach((fileName) => {
  const source = readFileSync(`src/features/product-editor/${fileName}`, 'utf8');
  assert.doesNotMatch(
    source,
    /from ['"][^'"]*(?:product-management|product-listing)/,
    `${fileName} must not depend on either product editor host Module`
  );
  assert(
    source.split('\n').length <= 300,
    `${fileName} must stay within the source-size policy after moving into product-editor`
  );
});

['ProductClassificationEditor.tsx', 'ProductClassificationFields.tsx'].forEach((fileName) => {
  assert.equal(
    existsSync(`src/features/product-management/components/${fileName}`),
    false,
    `product-management must not retain the shared ${fileName} Implementation`
  );
});

const editorSource = readFileSync('src/features/product-editor/ProductClassificationEditor.tsx', 'utf8');
const modalSource = readFileSync('src/features/product-editor/ProductCompetitorCategoryModal.tsx', 'utf8');
const contentTabSource = readFileSync(
  'src/features/product-editor/ProductContentTab.tsx',
  'utf8'
);

assert.match(
  editorSource,
  /fetchProductClassificationOptions/,
  'classification option loading must remain behind the editor Seam'
);
assert.match(
  modalSource,
  /preferredCompetitorCategoryLabel/,
  'competitor category presentation must remain behind the editor Seam'
);
assert.match(
  contentTabSource,
  /from ['"]\.\/ProductClassificationEditor/,
  'the shared Content host must consume the local classification editor Interface'
);
