import { type ReactNode } from 'react';
import { Button, Space, Tag, Typography } from 'antd';
import type { ProcurementCandidatePoolPayload, ProcurementPreviewFrame, ProcurementSearchPagePreviewPayload } from './types';
import {
  formatProcurementPriceRange,
  procurementCandidateDisplayTitle,
  procurementDemandDisplayTitle,
  procurementDisplayArray,
  procurementDisplayText,
  procurementImageModeMeta,
  procurementPlatformLabel,
  procurementRequirementText,
  procurementSourcePlatformColor,
  sanitizeProcurementCopy
} from './domain';

const { Text } = Typography;

export function escapeProcurementSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function procurementPreviewPalette(seedValue: string) {
  const palettes = [
    {
      background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
      border: '#99f6e4',
      heading: '#115e59',
      secondary: '#0f766e',
      chipBackground: 'rgba(15, 118, 110, 0.12)'
    },
    {
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: '#fdba74',
      heading: '#9a3412',
      secondary: '#c2410c',
      chipBackground: 'rgba(194, 65, 12, 0.12)'
    },
    {
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      border: '#a5b4fc',
      heading: '#3730a3',
      secondary: '#4338ca',
      chipBackground: 'rgba(67, 56, 202, 0.12)'
    },
    {
      background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
      border: '#facc15',
      heading: '#854d0e',
      secondary: '#a16207',
      chipBackground: 'rgba(161, 98, 7, 0.14)'
    }
  ];

  const hash = Array.from(seedValue).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export function procurementIllustrationPalette(seedValue: string) {
  const palettes = [
    {
      backgroundTop: '#f5fffa',
      backgroundBottom: '#d9f99d',
      panel: '#ffffff',
      primary: '#0f766e',
      secondary: '#115e59',
      accent: '#14b8a6',
      soft: '#ccfbf1',
      text: '#0f172a'
    },
    {
      backgroundTop: '#fff7ed',
      backgroundBottom: '#fed7aa',
      panel: '#ffffff',
      primary: '#c2410c',
      secondary: '#9a3412',
      accent: '#fb923c',
      soft: '#ffedd5',
      text: '#431407'
    },
    {
      backgroundTop: '#eef2ff',
      backgroundBottom: '#c7d2fe',
      panel: '#ffffff',
      primary: '#4338ca',
      secondary: '#3730a3',
      accent: '#818cf8',
      soft: '#e0e7ff',
      text: '#312e81'
    },
    {
      backgroundTop: '#fefce8',
      backgroundBottom: '#fde68a',
      panel: '#ffffff',
      primary: '#a16207',
      secondary: '#854d0e',
      accent: '#eab308',
      soft: '#fef3c7',
      text: '#422006'
    }
  ];

  const hash = Array.from(seedValue).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export function procurementProductFamily(title: string) {
  if (title.includes('古兰经') || title.includes('音箱')) {
    return 'speaker';
  }
  if (title.includes('头发') || title.includes('衣物')) {
    return 'wand';
  }
  if (title.includes('迷你') || title.includes('摆件') || title.includes('香座')) {
    return 'mabkhara';
  }
  if (title.includes('陶瓷')) {
    return 'ceramic';
  }
  return 'portable';
}

export function procurementShapeSvg(family: string, variant: string, palette: ReturnType<typeof procurementIllustrationPalette>) {
  if (family === 'speaker') {
    const detail = variant === 'detail';
    return `
      <g transform="translate(90 84)">
        <rect x="24" y="72" rx="34" ry="34" width="190" height="236" fill="${palette.panel}" stroke="${palette.secondary}" stroke-width="10"/>
        <rect x="56" y="106" rx="18" ry="18" width="126" height="74" fill="${palette.soft}" />
        <rect x="76" y="198" rx="14" ry="14" width="86" height="24" fill="${palette.accent}" opacity="0.9" />
        <circle cx="72" cy="246" r="10" fill="${palette.secondary}" />
        <circle cx="108" cy="246" r="10" fill="${palette.secondary}" />
        <circle cx="144" cy="246" r="10" fill="${palette.secondary}" />
        <circle cx="180" cy="246" r="10" fill="${palette.secondary}" />
        <rect x="84" y="316" rx="18" ry="18" width="70" height="82" fill="${palette.primary}" />
        <rect x="${detail ? 214 : 230}" y="${detail ? 178 : 152}" rx="18" ry="18" width="${detail ? 70 : 54}" height="${detail ? 126 : 110}" fill="${palette.panel}" stroke="${palette.primary}" stroke-width="8"/>
        <circle cx="${detail ? 249 : 257}" cy="${detail ? 214 : 186}" r="9" fill="${palette.accent}" />
        <rect x="${detail ? 236 : 246}" y="${detail ? 242 : 214}" rx="6" ry="6" width="24" height="50" fill="${palette.soft}" />
      </g>
    `;
  }
  if (family === 'wand') {
    const detail = variant === 'detail';
    return `
      <g transform="translate(88 76) rotate(${detail ? -20 : -12} 110 180)">
        <rect x="116" y="30" rx="42" ry="42" width="92" height="268" fill="${palette.panel}" stroke="${palette.secondary}" stroke-width="10"/>
        <rect x="130" y="56" rx="24" ry="24" width="64" height="132" fill="${palette.soft}" />
        <circle cx="162" cy="236" r="18" fill="${palette.accent}" />
        <rect x="82" y="282" rx="22" ry="22" width="158" height="86" fill="${palette.primary}" />
        <rect x="142" y="366" rx="12" ry="12" width="38" height="74" fill="${palette.secondary}" />
        <path d="M162 440 C164 470 186 488 212 494" stroke="${palette.accent}" stroke-width="12" fill="none" stroke-linecap="round"/>
        <circle cx="214" cy="494" r="12" fill="${palette.accent}" />
      </g>
    `;
  }
  if (family === 'mabkhara') {
    return `
      <g transform="translate(88 94)">
        <ellipse cx="150" cy="270" rx="110" ry="42" fill="${palette.secondary}" opacity="0.12"/>
        <path d="M64 232 C70 134 110 92 152 92 C196 92 236 134 242 232 Z" fill="${palette.panel}" stroke="${palette.secondary}" stroke-width="10"/>
        <ellipse cx="152" cy="100" rx="68" ry="22" fill="${palette.soft}" stroke="${palette.secondary}" stroke-width="8"/>
        <path d="M98 236 C114 278 132 302 152 302 C172 302 190 278 206 236" fill="${palette.accent}" opacity="0.28"/>
        <rect x="128" y="298" rx="18" ry="18" width="48" height="62" fill="${palette.primary}" />
        <ellipse cx="152" cy="364" rx="88" ry="22" fill="${palette.primary}" />
        <path d="M128 86 C116 52 128 28 152 20 C174 28 188 52 176 86" fill="none" stroke="${palette.accent}" stroke-width="10" stroke-linecap="round"/>
      </g>
    `;
  }
  if (family === 'ceramic') {
    const detail = variant === 'pack';
    return `
      <g transform="translate(78 88)">
        <ellipse cx="164" cy="288" rx="120" ry="38" fill="${palette.secondary}" opacity="0.12"/>
        <path d="M74 210 C80 128 120 78 164 78 C208 78 248 128 254 210 C254 254 214 296 164 296 C114 296 74 254 74 210 Z" fill="${palette.panel}" stroke="${palette.secondary}" stroke-width="10"/>
        <ellipse cx="164" cy="92" rx="82" ry="28" fill="${palette.soft}" stroke="${palette.secondary}" stroke-width="8"/>
        <rect x="${detail ? 106 : 118}" y="${detail ? 152 : 144}" rx="22" ry="22" width="${detail ? 116 : 92}" height="${detail ? 84 : 72}" fill="${palette.accent}" opacity="0.82"/>
        <rect x="130" y="296" rx="16" ry="16" width="68" height="56" fill="${palette.primary}" />
        <ellipse cx="164" cy="352" rx="96" ry="20" fill="${palette.primary}" />
      </g>
    `;
  }
  return `
    <g transform="translate(84 82)">
      <ellipse cx="164" cy="292" rx="122" ry="36" fill="${palette.secondary}" opacity="0.12"/>
      <rect x="86" y="86" rx="48" ry="48" width="156" height="226" fill="${palette.panel}" stroke="${palette.secondary}" stroke-width="10"/>
      <rect x="114" y="122" rx="24" ry="24" width="100" height="98" fill="${palette.soft}" />
      <rect x="126" y="240" rx="18" ry="18" width="76" height="30" fill="${palette.accent}" />
      <rect x="118" y="314" rx="18" ry="18" width="92" height="60" fill="${palette.primary}" />
      <path d="M126 88 C122 48 136 26 164 18 C194 26 206 48 202 88" fill="none" stroke="${palette.accent}" stroke-width="10" stroke-linecap="round"/>
    </g>
  `;
}

export function buildProcurementIllustrationDataUrl({
  title,
  subtitle,
  badge,
  chips,
  family,
  variant,
  seed
}: {
  title: string;
  subtitle?: string;
  badge: string;
  chips: string[];
  family: string;
  variant: string;
  seed: string;
}) {
  const palette = procurementIllustrationPalette(seed);
  const safeTitle = escapeProcurementSvgText(title);
  const safeSubtitle = escapeProcurementSvgText(subtitle || '');
  const chipTexts = chips.slice(0, 3).map((item) => escapeProcurementSvgText(item));
  const chipY = 422;
  const chipWidth = 332;
  const chipSpacing = 18;

  const chipsSvg = chipTexts
    .map((item, index) => {
      const x = 372 + index * (chipWidth + chipSpacing);
      return `
        <rect x="${x}" y="${chipY}" rx="22" ry="22" width="${chipWidth}" height="46" fill="${palette.panel}" opacity="0.92"/>
        <text x="${x + 18}" y="${chipY + 29}" font-size="18" fill="${palette.text}" font-family="Arial, sans-serif">${item}</text>
      `;
    })
    .join('');

  const shapeSvg = procurementShapeSvg(family, variant, palette);
  const safeBadge = escapeProcurementSvgText(badge);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="880" height="560" viewBox="0 0 880 560">
      <defs>
        <linearGradient id="bg-${seed}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.backgroundTop}" />
          <stop offset="100%" stop-color="${palette.backgroundBottom}" />
        </linearGradient>
      </defs>
      <rect width="880" height="560" rx="36" fill="url(#bg-${seed})" />
      <rect x="344" y="46" width="490" height="468" rx="28" fill="${palette.panel}" opacity="0.9" />
      <rect x="372" y="72" rx="20" ry="20" width="132" height="42" fill="${palette.soft}" />
      <text x="392" y="99" font-size="20" font-weight="700" fill="${palette.secondary}" font-family="Arial, sans-serif">${safeBadge}</text>
      <text x="372" y="176" font-size="34" font-weight="700" fill="${palette.text}" font-family="Arial, sans-serif">${safeTitle}</text>
      <text x="372" y="224" font-size="20" fill="${palette.secondary}" font-family="Arial, sans-serif">${safeSubtitle}</text>
      <text x="372" y="284" font-size="18" fill="${palette.text}" opacity="0.72" font-family="Arial, sans-serif">用于采购决策的商品视觉对照</text>
      ${shapeSvg}
      ${chipsSvg}
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function buildProcurementSourcePreviewFrames(
  item: ProcurementCandidatePoolPayload['demandItems'][number]
): ProcurementPreviewFrame[] {
  const title = procurementDemandDisplayTitle(item);
  const family = procurementProductFamily(title);
  const requirement = procurementRequirementText(item.specialRequirement);
  return [
    {
      key: 'main',
      label: '主图',
      title,
      subtitle: `${procurementPlatformLabel(item.sourcePlatform)} · 目标站点 ${item.targetSite || '待确认'}`,
      imageUrl:
        item.sourceImageUrl ||
        buildProcurementIllustrationDataUrl({
          title,
          subtitle: `${procurementPlatformLabel(item.sourcePlatform)} · 目标站点 ${item.targetSite || '待确认'}`,
          badge: '原商品主图',
          chips: [
            `目标价 ${formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)}`,
            `目标量 ${item.targetQuantity || '-'} 件`,
            requirement
          ],
          family,
          variant: 'main',
          seed: `source-main-${item.id}`
        }),
      imageMode: item.sourceImageUrl ? 'real' : 'generated',
      highlights: [
        `目标价 ${formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)}`,
        `目标量 ${item.targetQuantity || '-'} 件`,
        requirement
      ]
    },
    {
      key: 'detail',
      label: '细节重点',
      title: '重点看炉体结构与使用细节',
      subtitle: '采购判断时优先确认外形、开孔、按键位置和材质质感是否接近原商品。',
      imageUrl: item.sourceDetailImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看外观结构、开孔位置与材质质感',
        badge: '原商品细节',
        chips: [title, requirement, item.targetSite ? `目标站点 ${item.targetSite}` : '目标站点待确认'],
        family,
        variant: 'detail',
        seed: `source-detail-${item.id}`
      }),
      imageMode: item.sourceDetailImageUrl ? 'real' : 'generated',
      highlights: [
        title,
        requirement,
        item.targetSite ? `目标站点 ${item.targetSite}` : '目标站点待确认'
      ],
      note: '后续补真实图片后，这里优先承接细节图和局部结构图。'
    },
    {
      key: 'pack',
      label: '包装重点',
      title: '重点看礼品感与交付稳定性',
      subtitle: '适合中东销售的熏香类商品，包装完整度和礼盒感通常会直接影响采购决策。',
      imageUrl: item.sourcePackageImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看礼盒感、包装完整度和交付稳定性',
        badge: '原商品包装',
        chips: [`目标量 ${item.targetQuantity || '-'} 件`, requirement, '建议确认包装清单与运输稳定性'],
        family,
        variant: 'pack',
        seed: `source-pack-${item.id}`
      }),
      imageMode: item.sourcePackageImageUrl ? 'real' : 'generated',
      highlights: [
        `目标量 ${item.targetQuantity || '-'} 件`,
        requirement,
        '建议确认包装清单与运输稳定性'
      ],
      note: '当前样本图未挂包装图时，先用采购要求卡片做判断占位。'
    }
  ];
}

export function buildProcurementCandidatePreviewFrames(
  candidate: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]
): ProcurementPreviewFrame[] {
  const reasons = procurementDisplayArray(candidate.reasons);
  const warnings = procurementDisplayArray(candidate.warnings);
  const badges = procurementDisplayArray(candidate.badges);
  const title = procurementCandidateDisplayTitle(candidate);
  const family = procurementProductFamily(title);

  return [
    {
      key: 'main',
      label: '候选主图',
      title,
      subtitle: `${procurementDisplayText(candidate.supplierName)} · ${procurementDisplayText(candidate.locationText)}`,
      imageUrl: candidate.mainImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: `${procurementDisplayText(candidate.supplierName)} · ${procurementDisplayText(candidate.locationText)}`,
        badge: '候选商品主图',
        chips: [
          candidate.standardizedPriceText ? `候选价 ${candidate.standardizedPriceText}` : '候选价格待确认',
          candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认',
          badges[0] || '供应标签待补充'
        ],
        family,
        variant: 'main',
        seed: `candidate-main-${candidate.id}`
      }),
      imageMode: candidate.mainImageUrl ? 'real' : 'generated',
      highlights: [
        candidate.standardizedPriceText ? `候选价 ${candidate.standardizedPriceText}` : '候选价格待确认',
        candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认',
        badges[0] || '供应标签待补充'
      ]
    },
    {
      key: 'detail',
      label: '细节判断',
      title: '重点看外观相似度与功能一致性',
      subtitle: '优先看候选商品是否命中关键卖点，再判断是否需要继续进详情页或询价。',
      imageUrl: candidate.detailImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看是否命中关键卖点与外观结构',
        badge: '候选细节',
        chips: [
          reasons[0] || '等待补充命中理由',
          reasons[1] || '等待补充结构线索',
          warnings[0] || '当前未识别明显细节风险'
        ],
        family,
        variant: 'detail',
        seed: `candidate-detail-${candidate.id}`
      }),
      imageMode: candidate.detailImageUrl ? 'real' : 'generated',
      highlights: [
        reasons[0] || '等待补充命中理由',
        reasons[1] || '等待补充结构线索',
        warnings[0] || '当前未识别明显细节风险'
      ],
      note: warnings[1] || '如需继续推进，可在下一步增加规格核验和人工询价。'
    },
    {
      key: 'delivery',
      label: '供应履约',
      title: '重点看供应商能力与交付压力',
      subtitle: '采购同学通常会结合供应商标签、起订量和发货地，快速判断是否值得进入询价。',
      imageUrl: candidate.deliveryImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看供应商能力、发货地和交付稳定性',
        badge: '候选履约',
        chips: [
          procurementDisplayText(candidate.supplierName),
          badges[0] || '供应能力标签待补充',
          candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认'
        ],
        family,
        variant: 'pack',
        seed: `candidate-delivery-${candidate.id}`
      }),
      imageMode: candidate.deliveryImageUrl ? 'real' : 'generated',
      highlights: [
        procurementDisplayText(candidate.supplierName),
        badges[0] || '供应能力标签待补充',
        candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认'
      ],
      note: warnings[0] || '当前风险可控，可继续保留在候选池中。'
    }
  ];
}

export function buildProcurementSearchPreviewFrame(
  candidate: ProcurementSearchPagePreviewPayload['candidates'][number]
): ProcurementPreviewFrame {
  const title = procurementDisplayText(candidate.title);
  const family = procurementProductFamily(title);
  const supplierName = procurementDisplayText(candidate.supplierName);
  const locationText = procurementDisplayText(candidate.locationText);

  return {
    key: 'search-preview',
    label: '搜索候选图',
    title,
    subtitle: `${supplierName} · ${locationText}`,
    imageUrl: candidate.mainImageUrl || buildProcurementIllustrationDataUrl({
      title,
      subtitle: `${supplierName} · ${locationText}`,
      badge: '搜索结果示意',
      chips: [
        candidate.priceText ? `候选价 ${sanitizeProcurementCopy(candidate.priceText)}` : '候选价格待确认',
        candidate.moqText ? `起订量 ${sanitizeProcurementCopy(candidate.moqText)}` : '起订量待确认',
        candidate.materialText ? sanitizeProcurementCopy(candidate.materialText) : '材质待确认'
      ],
      family,
      variant: 'main',
      seed: `search-preview-${candidate.candidateUrl || title}`
    }),
    imageMode: candidate.mainImageUrl ? 'real' : 'generated',
    highlights: [
      candidate.priceText ? `候选价 ${sanitizeProcurementCopy(candidate.priceText)}` : '候选价格待确认',
      candidate.moqText ? `起订量 ${sanitizeProcurementCopy(candidate.moqText)}` : '起订量待确认',
      candidate.materialText ? sanitizeProcurementCopy(candidate.materialText) : '材质待确认'
    ]
  };
}

export function ProcurementGeneratedPreviewCard({
  frame,
  sectionLabel,
  minHeight = 280
}: {
  frame: ProcurementPreviewFrame;
  sectionLabel: string;
  minHeight?: number;
}) {
  const palette = procurementPreviewPalette(`${sectionLabel}-${frame.key}-${frame.title}`);

  return (
    <div
      style={{
        minHeight,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: palette.background
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: 999,
            background: palette.chipBackground,
            color: palette.secondary,
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {frame.label}
        </span>
        <span style={{ color: palette.secondary, fontSize: 12, fontWeight: 600 }}>{sectionLabel}</span>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ color: palette.heading, fontSize: 24, fontWeight: 700, lineHeight: 1.35 }}>
          {frame.title}
        </div>
        <div style={{ marginTop: 10, color: palette.secondary, fontSize: 13, lineHeight: 1.6 }}>
          {frame.subtitle || '待补充更多图片线索'}
        </div>
      </div>

      <Space wrap size={[8, 8]} style={{ marginTop: 16 }}>
        {frame.highlights.slice(0, 3).map((item) => (
          <span
            key={`${frame.key}-${item}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.82)',
              color: '#334155',
              fontSize: 12
            }}
          >
            {item}
          </span>
        ))}
      </Space>
    </div>
  );
}

export function ProcurementGeneratedThumb({
  frame,
  sectionLabel,
  width,
  height
}: {
  frame: ProcurementPreviewFrame;
  sectionLabel: string;
  width: number;
  height: number;
}) {
  const palette = procurementPreviewPalette(`${sectionLabel}-${frame.key}-${frame.title}-thumb`);

  return (
    <div
      style={{
        width,
        height,
        padding: 10,
        borderRadius: 14,
        border: '1px solid #dbe4ea',
        background: `linear-gradient(135deg, ${palette.background}, #ffffff)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <span
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 999,
          background: palette.chipBackground,
          color: palette.secondary,
          fontSize: 11,
          fontWeight: 600
        }}
      >
        {frame.label}
      </span>
      <div>
        <div
          style={{
            color: palette.heading,
            fontSize: width <= 88 ? 11 : 12,
            lineHeight: 1.45,
            fontWeight: 700,
            display: '-webkit-box',
            WebkitLineClamp: width <= 88 ? 3 : 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {frame.title}
        </div>
        <div style={{ marginTop: 6, color: '#64748b', fontSize: 11 }}>
          {frame.highlights[0] || '真实商品图待接入'}
        </div>
      </div>
    </div>
  );
}

export function ProcurementPreviewPanel({
  sectionLabel,
  roleLabel,
  platform,
  frames,
  activeKey,
  onChange,
  extraTag
}: {
  sectionLabel: string;
  roleLabel: string;
  platform?: string;
  frames: ProcurementPreviewFrame[];
  activeKey: string;
  onChange: (nextKey: string) => void;
  extraTag?: ReactNode;
}) {
  const activeFrame = frames.find((item) => item.key === activeKey) ?? frames[0];

  if (!activeFrame) {
    return null;
  }

  const palette = procurementPreviewPalette(`${sectionLabel}-${activeFrame.key}-${activeFrame.title}`);
  const imageModeMeta = procurementImageModeMeta(activeFrame.imageMode);

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        border: '1px solid #dbe4ea',
        background: '#f8fafc',
        height: '100%'
      }}
    >
      <Space wrap size={[8, 8]} style={{ marginBottom: 10 }}>
        {platform ? (
          <Tag color={procurementSourcePlatformColor(platform)} style={{ marginInlineEnd: 0 }}>
            {procurementPlatformLabel(platform)}
          </Tag>
        ) : null}
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          {roleLabel}
        </Tag>
        {extraTag}
      </Space>

      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${palette.border}`,
          background: '#ffffff'
        }}
      >
        <Tag
          color={imageModeMeta.color}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            marginInlineEnd: 0,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)'
          }}
	        >
	          {imageModeMeta.label}
	        </Tag>
	        {activeFrame.imageMode === 'real' && activeFrame.imageUrl ? (
	          <img
	            src={activeFrame.imageUrl}
	            alt={activeFrame.title}
	            style={{ display: 'block', width: '100%', height: 280, objectFit: 'cover', background: '#f8fafc' }}
	          />
	        ) : (
            <ProcurementGeneratedPreviewCard frame={activeFrame} sectionLabel={sectionLabel} minHeight={280} />
	        )}
	      </div>

      <div style={{ marginTop: 10 }}>
        <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>
          {activeFrame.title}
        </Text>
        <Text style={{ color: '#64748b' }}>
          {activeFrame.note || activeFrame.subtitle || '当前图片视角可继续补充。'} · {imageModeMeta.note}
        </Text>
      </div>

      {frames.length > 1 ? (
        <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
          {frames.map((frame) => (
            <Button
              key={frame.key}
              size="small"
              type={frame.key === activeKey ? 'primary' : 'default'}
              ghost={frame.key === activeKey}
              onClick={() => onChange(frame.key)}
            >
              {frame.label}
            </Button>
          ))}
        </Space>
      ) : null}
    </div>
  );
}
