import assert from 'node:assert/strict'
import {
  buildDefaultProductFactText,
  buildProductImageAiCopyText,
  buildProductImageAiPromptSections
} from '../src/features/product-image-profile/aiCopyText.ts'

const text = buildProductImageAiCopyText({
  pskuCode: 'SGGRB076',
  productTitle: 'NFC 白卡',
  productFactText: 'SGGR NFC 白卡，PVC 材质，适合门禁、会员卡、活动签到等场景。必须保持白卡外观，不要编造认证信息。',
  brand: 'SGGR',
  titleAr: 'بطاقات NFC فارغة',
  titleEn: 'Blank NFC Cards',
  specSummary: 'PVC / 13.56MHz / 100 pcs',
  heroSellingPoints: ['Printable PVC surface', 'Fast scan response'],
  sizeSection: {
    titleAr: 'مقاس البطاقة',
    titleEn: 'Card Size',
    descriptionAr: 'مقاس قياسي للمحفظة',
    descriptionEn: 'Standard wallet card size.',
    attributesText: '85.6 x 54 mm'
  },
  coreFeatures: [
    {
      id: 'feature-1',
      titleAr: 'استجابة سريعة',
      titleEn: 'Fast Response',
      descriptionAr: 'تدعم القراءة السريعة',
      descriptionEn: 'Supports quick NFC reading.',
      attributesText: '13.56MHz'
    }
  ],
  materialDetails: [
    {
      id: 'detail-1',
      titleAr: 'سطح PVC',
      titleEn: 'PVC Surface',
      descriptionAr: 'سطح أملس للطباعة',
      descriptionEn: 'Smooth surface for printing.',
      focusPart: 'Card surface'
    }
  ],
  usageScene: {
    titleAr: 'للمتاجر والفعاليات',
    titleEn: 'Stores and Events',
    descriptionAr: 'مناسب للبطاقات الذكية',
    descriptionEn: 'Suitable for smart cards and event access.'
  },
  packageList: {
    titleAr: 'محتوى العبوة',
    titleEn: 'Package Includes',
    descriptionAr: '100 بطاقة',
    descriptionEn: '100 blank NFC cards.',
    attributesText: '100 pcs'
  }
})

assert.match(text, /【图片要求】/)
assert.match(text, /第1张 主图/)
assert.match(text, /文案：\n- 英文短标题：Blank NFC Cards\n- 阿语短标题：بطاقات NFC فارغة\n- 精简卖点：Printable PVC surface\n- 规格：PVC \/ 13\.56MHz \/ 100 pcs/)
assert.match(text, /生成主图内容层/)
assert.match(text, /PAPERSAY logo、边框、规格标签和标题由系统合成/)
assert.doesNotMatch(text, /店铺皮肤作为母版/)
assert.doesNotMatch(text, /已有首图作为母版/)
assert.match(text, /第2张 尺寸图/)
assert.match(text, /尺寸文案：85\.6 x 54 mm/)
assert.doesNotMatch(text, /尺寸\/规格：85\.6 x 54 mm/)
assert.match(text, /第3部分 细节图（2-4张）/)
assert.match(text, /- 卖点1：Printable PVC surface/)
assert.match(text, /- 卖点2：Fast scan response/)
assert.match(text, /第4部分 使用场景图（1-2张）/)
assert.match(text, /第5部分 包装图（1张）/)
assert.match(text, /包装数据：100 pcs/)
assert.doesNotMatch(text, /商品标题：NFC 白卡\n品牌：SGGR/)
const imageRequirementSection = text.slice(text.indexOf('【图片要求】'), text.indexOf('【整体要求】'))
assert.match(imageRequirementSection, /文案：/)
const mainImageSection = text.slice(text.indexOf('第1张 主图'), text.indexOf('第2张 尺寸图'))
assert.doesNotMatch(mainImageSection, /SGGR NFC 白卡，PVC 材质/)
assert.doesNotMatch(mainImageSection, /适合门禁、会员卡、活动签到/)
assert.doesNotMatch(mainImageSection, /禁止编造/)
assert.match(text, /【整体要求】/)
assert.match(text, /参考资料（不直接上图）：\nSGGR NFC 白卡，PVC 材质/)
assert.match(text, /尺寸：默认跟随当前店铺皮肤或平台目标画布/)
assert.doesNotMatch(text, /尺寸：输出 1:1 方图/)
assert.doesNotMatch(text, /尺寸：默认跟随当前商品首图/)
assert.match(text, /生成边界：AI 只生成商品、细节、场景、包装等内容层/)
assert.match(text, /皮肤边界：当前店铺皮肤只用于决定构图安全区/)
assert.match(text, /文字：除非某个分区明确要求生成内容层里的自然场景文字/)
assert.match(text, /风格：内容层要干净、清晰、电商感强/)
assert.match(text, /标题：主图只使用“短标题”/)
assert.match(text, /素材边界：每张图只能使用该图“文案”小节里的文字上图/)
assert.match(text, /套图差异：主图、尺寸图、细节图、场景图和包装图必须有独立视觉目标/)
assert.match(text, /不得把同一张产品素材重复裁切后用于多张图/)
const copySection = imageRequirementSection
assert.doesNotMatch(copySection, /SGGR NFC 白卡，PVC 材质/)
assert.doesNotMatch(copySection, /适合门禁、会员卡、活动签到/)
assert.doesNotMatch(copySection, /禁止编造/)
assert.doesNotMatch(text, /【主图脚本】/)
assert.doesNotMatch(text, /【详情图脚本】/)
assert.doesNotMatch(text, /尺寸图脚本/)
assert.doesNotMatch(text, /核心功能 \/ 核心卖点/)
assert.doesNotMatch(text, /材质 \/ 细节特写/)
assert.doesNotMatch(text, /【商品事实库】/)
assert.doesNotMatch(text, /【关键事实】/)
assert.doesNotMatch(text, /【AI 出图要求】/)
assert.doesNotMatch(text, /【文案素材】/)
assert.doesNotMatch(text, /【图片生成要求】/)
assert.doesNotMatch(text, /AI 提取/)
assert.doesNotMatch(text, /调用 AI/)

const sections = buildProductImageAiPromptSections({
  pskuCode: 'SGGRB076',
  productTitle: 'NFC 白卡',
  productFactText: 'SGGR NFC 白卡，PVC 材质，适合门禁、会员卡、活动签到等场景。必须保持白卡外观，不要编造认证信息。',
  brand: 'SGGR',
  titleAr: 'بطاقات NFC فارغة',
  titleEn: 'Blank NFC Cards',
  specSummary: 'PVC / 13.56MHz / 100 pcs',
  heroSellingPoints: ['Printable PVC surface', 'Fast scan response'],
  sizeSection: {
    attributesText: '85.6 x 54 mm'
  },
  usageScene: {
    titleEn: 'Stores and Events',
    descriptionEn: 'Suitable for smart cards and event access.'
  },
  packageList: {
    attributesText: '100 pcs'
  }
})

assert.deepEqual(
  sections.map((section) => section.title),
  ['主图', '尺寸图', '细节', '场景', '包装', '整体要求']
)
assert.deepEqual(
  sections.map((section) => section.copyTitle),
  ['第1张 主图', '第2张 尺寸图', '第3部分 细节图（2-4张）', '第4部分 使用场景图（1-2张）', '第5部分 包装图（1张）', '整体要求']
)
assert.match(sections[0].text, /英文短标题：Blank NFC Cards/)
assert.match(sections[1].text, /尺寸文案：85\.6 x 54 mm/)
assert.match(sections[2].text, /卖点1：Printable PVC surface/)
assert.match(sections[3].text, /使用场景：Stores and Events/)
assert.match(sections[4].text, /包装数据：100 pcs/)
assert.match(sections[5].text, /参考资料（不直接上图）：\nSGGR NFC 白卡/)
assert.doesNotMatch(sections[0].text, /参考资料（不直接上图）/)
assert.doesNotMatch(sections[1].text, /参考资料（不直接上图）/)

const factText = buildDefaultProductFactText({
  pskuCode: 'SGGRB076',
  productTitle: 'NFC 白卡',
  brand: 'SGGR',
  specSummary: 'PVC / 13.56MHz / 100 pcs',
  heroSellingPoints: ['Printable PVC surface', 'Fast scan response'],
  sizeSection: { attributesText: '85.6 x 54 mm' },
  packageList: { attributesText: '100 pcs' }
})

assert.match(factText, /商品：NFC 白卡/)
assert.match(factText, /品牌：SGGR/)
assert.match(factText, /尺寸：85\.6 x 54 mm/)
assert.match(factText, /包装\/数量：100 pcs/)

const longTitleText = buildProductImageAiCopyText({
  pskuCode: 'SGGRB291',
  productTitle: '3Pcs Flameless LED Candles with Remote and Timer, Battery Operated Candles, Decorative Candles for Home, Hotel and Party Decoration(White)',
  productFactText: '完整商品资料参考：3Pcs Flameless LED Candles with Remote and Timer, Battery Operated Candles, Decorative Candles for Home, Hotel and Party Decoration(White)',
  brand: 'Yalla Pick',
  titleAr: '٣ قطع شموع LED بدون لهب مع جهاز تحكم ومؤقت، شموع عمودية كهربائية تعمل بالبطارية من شمع حقيقي وزجاج لتزيين المنزل والفندق والحفلات، أبيض',
  titleEn: '3Pcs Flameless LED Candles with Remote and Timer, Battery Operated Candles, Decorative Candles for Home, Hotel and Party Decoration(White)',
  specSummary: 'White · 3 pcs · remote control + timer',
  heroSellingPoints: ['Realistic candle glow without open flame']
})

const longTitleMainSection = longTitleText.slice(longTitleText.indexOf('第1张 主图'), longTitleText.indexOf('第2张 尺寸图'))
assert.match(longTitleMainSection, /英文短标题：Flameless LED Candles/)
assert.match(longTitleMainSection, /阿语短标题：شموع LED بدون لهب/)
assert.doesNotMatch(longTitleMainSection, /英文短标题：3Pcs/)
assert.doesNotMatch(longTitleMainSection, /阿语短标题：٣ قطع/)
assert.doesNotMatch(longTitleMainSection, /Battery Operated Candles/)
assert.doesNotMatch(longTitleMainSection, /Decorative Candles for Home/)
assert.doesNotMatch(longTitleMainSection, /جهاز تحكم ومؤقت/)
assert.match(longTitleText, /参考资料（不直接上图）：\n完整商品资料参考：3Pcs Flameless LED Candles with Remote and Timer/)

const emptySizeText = buildProductImageAiCopyText({
  pskuCode: 'PAPERSAYSB139',
  productTitle: 'Retractable Black Gel Ink Pens',
  brand: 'PAPERSAY',
  titleAr: 'أقلام حبر جل سوداء قابلة للسحب',
  titleEn: 'Retractable Black Gel Ink Pens',
  specSummary: 'Black · 0.5mm · 12 Pieces',
  heroSellingPoints: ['Smooth 0.5mm writing']
})

const emptySizeSection = emptySizeText.slice(emptySizeText.indexOf('第2张 尺寸图'), emptySizeText.indexOf('第3部分 细节图'))
const emptySizeMainSection = emptySizeText.slice(emptySizeText.indexOf('第1张 主图'), emptySizeText.indexOf('第2张 尺寸图'))
assert.match(emptySizeMainSection, /英文短标题：Retractable Black Gel Ink Pens/)
assert.match(emptySizeMainSection, /阿语短标题：أقلام حبر جل سوداء قابلة للسحب/)
assert.doesNotMatch(emptySizeMainSection, /英文短标题：12 Pieces/)
assert.doesNotMatch(emptySizeMainSection, /阿语短标题：12 /)
assert.match(emptySizeSection, /尺寸文案为空/)
assert.match(emptySizeSection, /不得写具体尺寸数字/)
assert.doesNotMatch(emptySizeSection, /Length:/)
assert.doesNotMatch(emptySizeSection, /Width:/)
assert.doesNotMatch(emptySizeSection, /Height:/)

console.log('product image AI copy text test passed')
