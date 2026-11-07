import './menu-list-states.css'
import type { ReactNode } from 'react'
import Button from './Button'
import Spinner from './Spinner'
import { useType } from './useType'
import { useAppControls } from './AppControlsContext'
import { menuCardMetrics, shadow } from '../design-system/metrics'
import { colors, space } from '../tokens'

/* 메뉴 목록 자리에 보이는 상태(기획 S20, 사용자 2026-10-20). 일반·낮은 화면이 같이 쓴다.
   불러오는 중(L1): 카드 자리를 회색 골격으로 먼저 보이고, 그 위에 ‘메뉴를 불러오고 있어요’ 알약.
   불러오지 못함(F): 이유와 다시 불러오기. 계속 안 되면 아래 직원 부르기로 안내한다.
   조건에 맞는 메뉴 없음(E1, 기획 S20-EMPTY): 없는 종류 칩은 숨겨 거의 생기지 않지만, 생겨도 막다른 길이 되지 않게 전체 메뉴로 가는 길을 둔다. */

// 메뉴 카드와 같은 크기의 회색 자리. 읽는 사람에게는 숨기고, 상태는 알약이 알린다.
export function MenuSkeletonCards({ count, low = false }: { count: number; low?: boolean }) {
  const { photoHeight, photoRadius, lowPhotoWidth, lowPhotoGap, lowRadius } = menuCardMetrics
  return <>{Array.from({ length: count }, (_, index) => low
    ? <div key={index} aria-hidden="true" data-menu-skeleton style={{ borderRadius: lowRadius, display: 'grid', gridTemplateColumns: `${lowPhotoWidth}px minmax(0, 1fr)`, columnGap: lowPhotoGap, alignItems: 'center' }}>
        <span className="menu-skeleton-block" style={{ width: lowPhotoWidth, height: lowPhotoWidth, borderRadius: photoRadius }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
          <span className="menu-skeleton-block" style={{ width: '46%', height: 28 }} />
          <span className="menu-skeleton-block" style={{ width: '72%', height: 40 }} />
          <span className="menu-skeleton-block" style={{ width: '44%', height: 36 }} />
        </span>
      </div>
    : <div key={index} aria-hidden="true" data-menu-skeleton style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="menu-skeleton-block" style={{ width: '100%', maxWidth: photoHeight, height: photoHeight, alignSelf: 'center', borderRadius: photoRadius }} />
        <span style={{ width: '100%', maxWidth: photoHeight, alignSelf: 'center', boxSizing: 'border-box', padding: `${space.md}px 0 20px`, display: 'flex', flexDirection: 'column' }}>
          <span className="menu-skeleton-block" style={{ width: '46%', height: 32, margin: `${space.xs}px 0 ${space.sm}px` }} />
          <span className="menu-skeleton-block" style={{ width: '64%', height: 40 }} />
          <span className="menu-skeleton-block" style={{ width: '36%', height: 40, marginTop: space.sm }} />
        </span>
      </div>)}</>
}

// 종류 칩 자리. 어떤 종류가 있는지는 메뉴를 받아야 알 수 있어 빈 알약 네 개로 둔다.
export function MenuSkeletonChips({ height }: { height: number }) {
  return <>{[168, 104, 112, 128].map(width => <span key={width} aria-hidden="true" className="menu-skeleton-block" style={{ width, height, borderRadius: 999, flex: 'none' }} />)}</>
}

// ‘아래로 내리면 메뉴가 더 보여요’와 같은 알약 모양. 고대비에서는 그림자 대신 테두리.
export function MenuLoadingNotice() {
  const t = useType()
  const { highContrast } = useAppControls()
  return <div data-menu-loading role="status" style={{
    display: 'inline-flex', alignItems: 'center', gap: 20, padding: '24px 44px', borderRadius: 999,
    background: 'var(--bg-surface)', boxShadow: highContrast ? 'none' : shadow.voicePanel,
    border: highContrast ? '2px solid var(--border-default)' : 'none',
  }}>
    <Spinner small />
    <span style={{ ...t.primary, fontWeight: 700, color: colors.textPrimary, whiteSpace: 'nowrap' }}>메뉴를 불러오고 있어요</span>
  </div>
}

// 목록 자리 가운데에 두는 안내 묶음(불러오지 못함·조건에 맞는 메뉴 없음).
function CenterMessage({ marker, title, body, children }: { marker: string; title: string; body?: string; children: ReactNode }) {
  const t = useType()
  return <div {...{ [marker]: true }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.lg, textAlign: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
      <p style={{ ...t.primary, fontWeight: 700, margin: 0, color: colors.textPrimary }}>{title}</p>
      {body && <p style={{ ...t.body, margin: 0, color: colors.textSecondary, whiteSpace: 'pre-line' }}>{body}</p>}
    </div>
    {children}
  </div>
}

export function MenuLoadFailed({ onRetry }: { onRetry: () => void }) {
  // 직원을 이미 불렀으면 기다리라고 쓴다(음성과 같은 말, 사용자 2026-10-21).
  const { staffPending } = useAppControls()
  return <CenterMessage marker="data-menu-load-failed" title="메뉴를 불러오지 못했어요" body={staffPending ? '다시 불러오기를 눌러 주세요.\n직원을 불렀어요. 잠시 기다려 주세요.' : '다시 불러오기를 눌러 주세요.\n계속 안 되면 아래 직원 부르기를 눌러 주세요.'}>
    <Button purpose="decision" variant="Tertiary" voiceAction="menu-retry" onClick={onRetry} style={{ minWidth: 360 }}>다시 불러오기</Button>
  </CenterMessage>
}

// 기획의 ‘온도 조건 지우기’를 우리 탭 이름(전체)에 맞춰, 누르면 무엇이 보이는지로 적었다(사용자 E1).
export function MenuEmpty({ onShowAll }: { onShowAll: () => void }) {
  return <CenterMessage marker="data-menu-empty" title="조건에 맞는 메뉴가 없어요">
    <Button purpose="decision" variant="Tertiary" voiceAction="menu-show-all" onClick={onShowAll} style={{ minWidth: 360 }}>전체 메뉴 보기</Button>
  </CenterMessage>
}
