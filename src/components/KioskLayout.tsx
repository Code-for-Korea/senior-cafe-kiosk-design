import { layout, optionStepMetrics, progressMetrics } from '../design-system/metrics'
import { useLayoutEffect, useRef } from 'react'
import { useAppControls } from './AppControlsContext'
import { colors, space } from '../tokens'
import OptionStepper from './OptionStepper'
import type { OptionStepRow } from '../selectionSummary'
import Button from './Button'
import StepNavigation from './StepNavigation'
import ProgressStep from './ProgressStep'
import UtilityBar from './UtilityBar'
import { useType } from './useType'
import { useOptionProduct } from './OptionProductContext'
import { useOptionEdit } from './OptionEditContext'
import ItemOrderControls from './ItemOrderControls'
import ScrollBottomShade from './ScrollBottomShade'
import ColdOnlyNotice from './ColdOnlyNotice'
import { useVoiceGuide } from '../voice/VoiceContext'
import ShortTip from '../voice/ShortTip'
import { devParams } from '../devParams'

/* 옵션을 고르는 화면은 주문 전체 단계 중 3단계(추가 선택)에 속한다 */
import { LowScreenOptions, LowScreenReview } from '../lowScreens'
const OPTION_STEP = 3

interface Props {
  question: string
  description?: string
  productName?: string
  children: React.ReactNode
  onPrev?: () => void
  onNext?: () => void
  nextEnabled: boolean
  nextLabel?: string
  prevLabel?: string
  hidePrev?: boolean
  secondaryAction?: { label: string; onClick: () => void }
  steps?: OptionStepRow[]        // 추가 선택의 단계 목록 · 고른 것·지금·남은 것을 한 줄기로
  stepsAfterQuestion?: boolean   // 확인 화면은 질문 아래에 둔다
  isEditMode?: boolean
}

export default function KioskLayout({
  question, description, productName,
  children,
  onPrev, onNext,
  nextEnabled,
  nextLabel = '다음',
  prevLabel = '이전',
  hidePrev = false,
  secondaryAction,
  steps = [],
  stepsAfterQuestion = false,
  isEditMode = false,
}: Props) {
  const controls = useAppControls()
  const t = useType()
  const voice = useVoiceGuide()
  const productActions = useOptionProduct()
  const edit = useOptionEdit()
  const showOrderBar = !!productActions && !isEditMode
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const currentStep = steps.find(step => step.state === 'current')?.key

  useLayoutEffect(() => {
    const viewport = scrollRef.current
    if (!viewport || !showOrderBar) return
    viewport.scrollTop = 0
    const active = viewport.querySelector<HTMLElement>('[data-voice-options][aria-current="step"]')
    if (!active) return
    const frame = viewport.getBoundingClientRect()
    const scale = frame.height / viewport.clientHeight
    if (!scale) return
    const overflow = (active.getBoundingClientRect().bottom - frame.bottom) / scale + space.md
    if (overflow > 0) viewport.scrollTop = overflow
  }, [currentStep, showOrderBar, controls.lowOptions, t.largeText])

  const resolvedNextLabel = isEditMode
    ? (nextEnabled ? edit.nextLabel : '먼저 선택해 주세요')
    : (nextEnabled ? nextLabel : '먼저 선택해 주세요')

  const resolvedPrevLabel = isEditMode ? '취소' : prevLabel

  // 질문만 · '추가 선택 4개 중 2번째' 같은 자리 설명은 단계 목록이 대신한다 (2026-10-01 사용자)
  // 제목 줄 높이는 68로 고정한다. 글꼴 토큰(1.4배)으로는 67.2·70이 되어 아래 단계 목록이 홀수·소수 자리(507.19)에 놓였다. 68이면 기본·큰 글씨 모두 508(사용자 2026-11-03).
  const heading = <div data-voice-heading style={{ display: 'flex', flexDirection: 'column', gap: voice.enabled ? 24 : space.xs, flexShrink: 0 }}>
    <p style={{ ...t.title, lineHeight: '68px', margin: 0, color: colors.textPrimary,
      minHeight: devParams.compactCards && !stepsAfterQuestion ? optionStepMetrics.summaryRowHeight : undefined,
      display: 'flex', alignItems: 'center',
    }}>{question}</p>
    {!stepsAfterQuestion && productActions && <ColdOnlyNotice item={productActions.item} />}
    {description && <p style={{ ...t.body, margin: 0, lineHeight: 1.5, color: colors.textSecondary }}>{description}</p>}
  </div>

  // 확인 화면에서 바꾸기로 들어온 편집은 확인 화면의 제목 묶음과 같은 꼴·높이로 둔다.
  // 바꾸기 전후로 단계 표시와 위쪽 목록 줄이 움직이지 않는다 (2026-10-15 사용자)
  // 음성 안내는 같은 높이로 맞추면 바꾸기 버튼이 화면 밖으로 밀려 기존 한 줄 안내를 유지한다. 음성 안내 화면은 따로 검토한다.
  const compactEditNotice = isEditMode && voice.enabled
  const editHeading = <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs, flexShrink: 0 }}>
    <p style={{ ...t.title, lineHeight: '68px', margin: 0, color: colors.textPrimary, display: 'flex', alignItems: 'center' }}>선택을 바꾸고 있어요.</p>
    <p style={{ ...t.body, margin: 0, lineHeight: 1.5, color: colors.textSecondary }}>‘기존 선택’은 바꾸기 전에 고른 것이에요.</p>
  </div>

  // 수정도 동일한 선택 색을 사용한다. 기존 값으로 돌아와도 확정 버튼은 누를 수 있다.
  const nav = (
    <StepNavigation purpose={isEditMode ? 'decision' : 'support'} voiceTarget
      marginTop={!stepsAfterQuestion ? optionStepMetrics.choicesToNavigationGap - space.md : 0}
      secondaryAction={secondaryAction}
      previous={(!hidePrev || isEditMode) ? { label: resolvedPrevLabel, onClick: onPrev } : undefined}
      next={{ label: resolvedNextLabel, enabled: nextEnabled, onClick: onNext }} />
  )

  if (controls.lowOptions && !isEditMode && stepsAfterQuestion && productActions) return (
    <LowScreenReview question={question} description={description} productName={productName} steps={steps} />
  )

  if (controls.lowOptions && !stepsAfterQuestion) return (
    <LowScreenOptions question={question} productName={productName} steps={steps} isEditMode={isEditMode} nextEnabled={nextEnabled} nextLabel={resolvedNextLabel} prevLabel={!isEditMode && hidePrev ? '이전 · 상품정보' : resolvedPrevLabel} onPrev={!isEditMode && hidePrev ? controls.onLowProduct : onPrev} onNext={onNext}>{children}</LowScreenOptions>
  )

  // 진행 단계와 상품 이름 줄. 진행 단계 아래 간격은 여기서 정한다(진행바는 바깥 여백이 없다).
  const orderHeader = <>
    <div style={{ paddingBottom: progressMetrics.spaceBelow, flexShrink: 0 }}><ProgressStep current={OPTION_STEP} /></div>

    {productName && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, marginTop: space.xs, marginBottom: showOrderBar ? 0 : space.md, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, minWidth: 0 }}>
          <p style={{ ...t.primary, margin: 0, minWidth: 0, color: colors.textPrimary }}>
            {productName}
          </p>
          {productActions && <Button purpose="support" variant="Utility" size="small" ariaLabel={`${productName} 상품정보 보기`} onClick={productActions.onViewProduct} style={{ height: 80, padding: '0 16px', background: 'var(--bg-muted)', borderColor: colors.borderDefault }}>상품정보</Button>}
        </div>
        {productActions && <span style={{ ...t.inlinePrice, color: colors.textPrimary, whiteSpace: 'nowrap', flexShrink: 0 }} aria-label={`기본 가격 ${productActions.basePrice}`}>{productActions.basePrice}</span>}
      </div>
    )}
  </>

  return (
    <div style={{
      width: layout.width, height: layout.height, background: colors.bgPage,
      display: 'flex', flexDirection: 'column', margin: '0 auto',
      position: 'relative', overflow: 'hidden',
    }}>

      {showOrderBar && <header style={{
        // 음성 모드는 본문 위 24px와 합쳐 상단 묶음 아래 48px를 유지한다.
        flexShrink: 0, padding: `${layout.progressTop}px ${space.page}px ${voice.enabled ? space.md : space.xl}px`,
        display: 'flex', flexDirection: 'column', gap: space.md,
      }}>{orderHeader}</header>}

      {/* 스크롤 가능한 콘텐츠 영역 · 구역 사이 간격은 8px 단위(space)로 맞춘다.
          스크롤 막대 자리를 비워 두면 오른쪽 여백만 넓어져 메뉴 화면과 폭이 달라지므로 막대는 숨긴다. */}
      <div data-option-scroll-viewport style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <div ref={scrollRef} data-voice-scroll-viewport data-option-scroll role="region" aria-label="옵션 선택 내용" tabIndex={0} style={{
        height: '100%', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden',
        // 바꾸기 화면은 음성 안내를 켜도 진행바 위 여백(progressTop)을 다른 화면과 같게 둔다. 줄이는 것은 안내 문장뿐이다(2026-11-02).
        // 확인·바꾸기 화면은 끝 여백을 16으로 둔다. 32면 네 단계 목록이 화면을 7~24px 넘겨 미세한 스크롤이 생겼다(사용자 2026-11-03).
        padding: `${showOrderBar ? (voice.enabled ? 24 : 0) : layout.progressTop}px ${space.page}px ${isEditMode || stepsAfterQuestion ? 16 : space.lg}px`,
        scrollbarWidth: 'none',
      }}>
      {/* 제목(또는 바꾸기 안내)과 단계 목록 사이는 16. 진행바 묶음과 안내 사이는 24를 유지해(머리 아래 8 추가) 확인 화면의 제목 위치와 같게 둔다.
          그래야 확인 화면에서 '바꾸기'를 눌러도 단계 목록 첫 줄이 움직이지 않는다(2026-10-15 사용자, 2026-11-03 간격 조정). */}
      <div ref={contentRef} data-voice-scroll-content style={{ display: 'flex', flexDirection: 'column', gap: isEditMode || stepsAfterQuestion ? 16 : space.md }}>
        {!showOrderBar && <header data-order-header style={{ display: 'flex', flexDirection: 'column', gap: space.md, flexShrink: 0, marginBottom: isEditMode ? 8 : 0 }}>{orderHeader}</header>}

        {isEditMode && (compactEditNotice ? <p style={{ ...t.body, margin: 0, color: colors.textSecondary }}>
          선택을 바꾸고 있어요.
        </p> : editHeading)}

        {stepsAfterQuestion ? (
          // 확인 화면 · 제목과 설명 → 고른 목록 → 수량과 담기
          <>
            {heading}
            <div data-voice-review-options><OptionStepper rows={steps} readableTitles /></div>
            {/* 음성 안내: 고른 목록 아래 ‘고른 내용 확인’(화살표 위), 수량 칸 오른쪽 ‘수량 확인’(사용자 2026-10-20). */}
            <ShortTip text="고른 내용 확인" arrow="up" />
            {children}
            {showOrderBar ? null : nav}
          </>
        ) : (
          // 고르는 화면 · 지금 단계의 칸 안에 질문·카드·버튼이 들어간다 (Hers 의 단계 목록 꼴 · 2026-10-01 사용자 레퍼런스)
          <OptionStepper rows={steps} currentContent={<>{heading}{children}{nav}</>} />
        )}
      </div>
      </div>
      <ScrollBottomShade viewportRef={scrollRef} contentRef={contentRef} />
      </div>

      {showOrderBar && productActions && <section aria-label="현재 상품 담기" data-option-order-bar style={{
        flexShrink: 0,
        padding: `${space.md}px ${space.page}px ${space.lg}px`, background: colors.bgSurface,
        display: 'flex', flexDirection: 'column', gap: space.md,
      }}>
        <ItemOrderControls {...productActions} primary={stepsAfterQuestion} quantityTip={stepsAfterQuestion ? <ShortTip text="수량 확인" arrow="left" /> : undefined} />
      </section>}

      {/* 유틸리티 바 — 항상 하단 고정 */}
      <UtilityBar />
    </div>
  )
}
