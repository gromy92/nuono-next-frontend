import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readSource(relativePath) {
  return readFileSync(path.resolve(root, relativePath), 'utf8');
}

function assertIncludes(source, expected, context) {
  assert(source.includes(expected), `${context} must include ${expected}`);
}

function assertExcludes(source, unexpected, context) {
  assert(!source.includes(unexpected), `${context} must not include ${unexpected}`);
}

const contentTab = readSource('src/features/product-management/components/ProductContentTab.tsx');
const classificationEditor = readSource('src/features/product-management/components/ProductClassificationEditor.tsx');
const translationEditor = readSource('src/features/product-management/components/ProductContentTranslationEditor.tsx');
const longDescriptionEditor = readSource('src/features/product-management/components/ProductLongDescriptionEditor.tsx');
const attributeControl = readSource('src/features/product-management/components/ProductAttributeFieldControl.tsx');
const attributeTemplate = readSource('src/features/product-management/productAttributeTemplate.ts');
const productApi = readSource('src/features/product-management/api.ts');
const translationHelper = readSource('src/features/product-management/components/ProductContentTranslationEditor.helpers.ts');

assertIncludes(productApi, "fetch('/api/product-master/translate'", 'translation API');
assertIncludes(translationHelper, '翻译服务没有返回结果', 'translation unavailable feedback');
assertIncludes(translationHelper, 'AI 未生成有效翻译', 'translation ineffective feedback');

assertIncludes(classificationEditor, 'AutoComplete', 'classification editor');
assertIncludes(classificationEditor, 'brandQuery', 'brand search');
assertIncludes(classificationEditor, 'fulltypeQuery', 'fulltype search');
assertIncludes(classificationEditor, "updateProductSectionField('taxonomy', 'family'", 'fulltype family derivation');
assertIncludes(classificationEditor, "updateProductSectionField('taxonomy', 'productType'", 'fulltype product type derivation');
assertIncludes(classificationEditor, "updateProductSectionField('taxonomy', 'productSubtype'", 'fulltype product subtype derivation');
assertExcludes(classificationEditor, '>family<', 'classification editor');
assertExcludes(classificationEditor, '>productType<', 'classification editor');
assertExcludes(classificationEditor, '>productSubtype<', 'classification editor');

assertIncludes(longDescriptionEditor, 'ProductRichTextEditor', 'English long description');
assertIncludes(longDescriptionEditor, 'Long Description English', 'English long description label');
assertIncludes(longDescriptionEditor, '中文长描述', 'Chinese long description textarea');
assertIncludes(longDescriptionEditor, '阿语只读', 'Arabic long description readonly label');
assertExcludes(longDescriptionEditor, "updateProductSectionField('content', 'descriptionAr'", 'Arabic long description');
assertExcludes(longDescriptionEditor, "'description-zh-ar'", 'Arabic long description translation');

assertIncludes(translationEditor, '阿语只读', 'Arabic title/highlights readonly label');
assertIncludes(translationEditor, 'readOnly', 'Arabic title/highlights readonly controls');
assertExcludes(translationEditor, "updateProductSectionField('content', 'titleAr'", 'Arabic title');
assertExcludes(translationEditor, "setHighlightValues('AR'", 'Arabic highlights');
assertExcludes(translationEditor, "'title-zh-ar'", 'Arabic title translation');
assertExcludes(translationEditor, "'highlight-${index}-zh-ar'", 'Arabic highlight translation');
assertExcludes(translationEditor, 'Arabic (Optional)', 'Arabic optional wording');

assertIncludes(attributeTemplate, 'isVisibleDetailedAttributeRecord', 'attribute filtering');
for (const hiddenCode of [
  'id_partner',
  'external_qc_',
  'pending_virtual_',
  'feature_bullet',
  'images',
  'grade'
]) {
  assertIncludes(attributeTemplate, hiddenCode, 'hidden attribute filter');
}
assertIncludes(attributeControl, 'options={selectOptions(field, value)}', 'attribute dropdown options');
assertIncludes(attributeControl, 'unitOptions', 'attribute unit options');
assertIncludes(attributeControl, 'disabled', 'Arabic attribute readonly controls');

assertExcludes(contentTab, 'ProductImagesPanel', 'Content tab');

console.log('product Content contract check passed');
