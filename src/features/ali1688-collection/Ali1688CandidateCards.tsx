import { LeftOutlined, LinkOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import type { Ali1688CandidatePreview } from '../source-collection/types'
import {
  buildCandidateImages,
  type CandidateScoring,
  type ProcurementStageMeta,
  resolveCandidateScoring,
  resolveCandidateStage,
  SCORE_BREAKDOWN_ITEMS
} from './ali1688CandidateModel'
import { CANDIDATE_LEVEL_META } from './ali1688CollectionModel'

const { Paragraph, Text } = Typography

export function CandidateCard(props: {
  candidate: Ali1688CandidatePreview
  fallbackImage?: string
}) {
  const { candidate } = props
  const levelMeta = CANDIDATE_LEVEL_META[candidate.level]
  const stage = resolveCandidateStage(candidate)
  const scoring = resolveCandidateScoring(candidate)
  const images = buildCandidateImages(candidate, props.fallbackImage)
  return (
    <article className={`ali1688-candidate-card is-${levelMeta.tone}`}>
      <CandidateImageCarousel title={candidate.title} rankNo={candidate.rankNo} images={images} />
      <div className="ali1688-candidate-body">
        <div className="ali1688-candidate-topline">
          <div className="ali1688-candidate-tags">
            <Tag color={levelMeta.color}>{levelMeta.label}</Tag>
            <Text type="secondary">{candidate.locationText || '地区待解析'}</Text>
          </div>
          <ScoreBadge score={scoring.totalScore} label={scoring.label} />
        </div>
        <Paragraph ellipsis={{ rows: 2 }} className="ali1688-candidate-title">
          {candidate.title}
        </Paragraph>
        <div className="ali1688-candidate-supplier">{candidate.supplierName}</div>
        <CandidateStageLine stage={stage} />
        <div className="ali1688-candidate-price-line">
          <span>价格 {candidate.priceText || '待解析'}</span>
          <span>起订 {candidate.moqText || '待解析'}</span>
        </div>
        <ScoreBreakdownPanel scoring={scoring} />
        <div className="ali1688-candidate-actions">
          <Button size="small" icon={<LinkOutlined />} onClick={() => openUrl(candidate.candidateUrl)}>
            打开1688
          </Button>
        </div>
      </div>
    </article>
  )
}

export function CandidateStageLine({ stage }: { stage: ProcurementStageMeta }) {
  return (
    <div className="ali1688-card-stage">
      <span>当前阶段</span>
      <Tag color={stage.color}>{stage.label}</Tag>
      <span className="ali1688-card-stage-note">{stage.description}</span>
    </div>
  )
}

function CandidateImageCarousel(props: { title: string; rankNo: number; images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const activeImage = props.images[currentIndex]
  return (
    <div className="ali1688-candidate-carousel">
      {activeImage ? (
        <img src={activeImage} alt={`${props.title} ${currentIndex + 1}`} />
      ) : (
        <div className="ali1688-image-placeholder">NO IMAGE</div>
      )}
      <span className="ali1688-candidate-rank">#{props.rankNo}</span>
      {props.images.length > 1 ? (
        <>
          <button
            type="button"
            className="ali1688-carousel-arrow is-left"
            aria-label="上一张"
            onClick={() => setCurrentIndex((current) => (current === 0 ? props.images.length - 1 : current - 1))}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className="ali1688-carousel-arrow is-right"
            aria-label="下一张"
            onClick={() => setCurrentIndex((current) => (current + 1) % props.images.length)}
          >
            <RightOutlined />
          </button>
          <div className="ali1688-carousel-dots" aria-label={`${props.images.length} 张图片`}>
            {props.images.map((image, index) => (
              <i key={`${image}-${index}`} className={index === currentIndex ? 'is-active' : undefined} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function ScoreBadge(props: { score?: number; label: CandidateScoring['label'] }) {
  const score = props.score
  const tone = score == null ? 'neutral' : score >= 80 ? 'green' : score >= 65 ? 'orange' : 'neutral'
  return (
    <div className={`ali1688-score-badge is-${tone}`} aria-label={`${props.label} ${score ?? '待评分'}`}>
      <span>{props.label}</span>
      <strong>{score ?? '-'}</strong>
    </div>
  )
}

function ScoreBreakdownPanel({ scoring }: { scoring: CandidateScoring }) {
  return (
    <div className="ali1688-score-panel">
      <div className="ali1688-score-panel-title">分项评分</div>
      <div className="ali1688-score-breakdown">
        {SCORE_BREAKDOWN_ITEMS.map((item) => {
          const value = scoring.breakdown[item.key]
          const width = value == null ? 0 : Math.min(Math.max(value / item.max, 0), 1) * 100
          return (
            <div key={item.key} className="ali1688-score-row">
              <span>{item.label}</span>
              <div className="ali1688-score-track">
                <i style={{ width: `${width}%` }} />
              </div>
              <strong>{value == null ? '待评分' : `${value}/${item.max}`}</strong>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function openUrl(url?: string) {
  if (!url) {
    message.info('暂无可打开的链接。')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
