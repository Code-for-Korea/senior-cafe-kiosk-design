import { useOrderPricing } from './useOrderPricing'
import { menuCardMetrics, layer } from '../design-system/metrics'
import { useState } from 'react'
import { colors, font, radius, space } from '../tokens'
import { useType } from './useType'
import GuideCue from '../voice/GuideCue'
import { dialogVoice } from '../voice/guides'
import { useSoldOut } from '../soldOut'
import Icon from './Icon'
import Button from './Button'
import { useTheme } from './ThemeContext'
import type { MenuItem } from '../menuData'
import {
  compose, consonantKeys, pressBackspace, pressConsonant, pressSpace, pressVowel, unitsFromText,
} from '../hangul'
import type { ConsonantKey, Unit, VowelKey } from '../hangul'
import { searchMenu } from '../menuSearch'
import type { MenuMatch } from '../menuSearch'

/* 메뉴 검색 창 · '검색하기'를 누르면 화면 아래에서 입력칸과 자판이 함께 뜬다.
   입력칸 · 찾은 메뉴 · 자판을 한곳에 모아 시선이 멀리 움직이지 않게 한다.
   찾은 메뉴 자리는 높이를 고정해, 입력하는 동안 입력칸과 자판이 움직이지 않는다.
   찾은 메뉴는 누르면 먼저 선택만 되고, 아래 버튼을 눌러야 다음 화면으로 넘어간다. */
interface Props {
  items: MenuItem[]
  startText?: string
  startSelectedId?: string | null // 캡처용 · 메뉴를 고른 상태로 시작
  onSelect: (item: MenuItem) => void
  onClose: () => void
}

const MAX_RESULTS = 3
const RESULT_H = 124
const RESULT_GAP = 12
const KEY_H = 112
const KEY_GAP = 12
const KEY_BORDER = 'var(--border-default)'

type Key =
  | { type: 'vowel'; key: VowelKey; name: string }
  | { type: 'consonant'; key: ConsonantKey }
  | { type: 'backspace' | 'clear' | 'space' | 'empty' }

/* 천지인 배열 · 오른쪽 줄은 지우기와 띄어쓰기 */
const keypad: Key[] = [
  { type: 'vowel', key: 'ㅣ', name: '모음 이' }, { type: 'vowel', key: 'ㆍ', name: '모음 점' }, { type: 'vowel', key: 'ㅡ', name: '모음 으' }, { type: 'backspace' },
  { type: 'consonant', key: 'ㄱ' }, { type: 'consonant', key: 'ㄴ' }, { type: 'consonant', key: 'ㄷ' }, { type: 'clear' },
  { type: 'consonant', key: 'ㅂ' }, { type: 'consonant', key: 'ㅅ' }, { type: 'consonant', key: 'ㅈ' }, { type: 'space' },
  { type: 'empty' }, { type: 'consonant', key: 'ㅇ' }, { type: 'empty' },
]

/* 자리가 모자라면 마지막 줄은 '더 있어요' 안내로 쓴다 */
function visibleMatches(matches: MenuMatch[]) {
  return matches.length > MAX_RESULTS ? matches.slice(0, MAX_RESULTS - 1) : matches
}

export default function SearchPanel({ items, startText = '', startSelectedId = null, onSelect, onClose }: Props) {
  const t = useType()
  const theme = useTheme()
  const [units, setUnits] = useState<Unit[]>(() => unitsFromText(startText))
  const [selectedId, setSelectedId] = useState<string | null>(startSelectedId)

  const text = compose(units)
  const matches = searchMenu(items, units)
  const shown = visibleMatches(matches)
  const hidden = matches.length - shown.length
  const hasMore = hidden > 0
  const selected = shown.find((match) => match.item.id === selectedId)?.item ?? null

  // 글자를 바꿔서 고른 메뉴가 목록에서 사라지면 선택도 푼다
  const type = (next: Unit[]) => {
    setUnits(next)
    if (!visibleMatches(searchMenu(items, next)).some((match) => match.item.id === selectedId)) setSelectedId(null)
  }

  const keyStyle = {
    background: colors.bgSurface, border: `2px solid ${KEY_BORDER}`, borderRadius: 16,
    boxShadow: '0 3px 0 rgba(0,0,0,0.18)', cursor: 'pointer', color: colors.textPrimary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, minWidth: 0,
  }
  const functionKeyStyle = { ...keyStyle, background: colors.bgDisabled }
  const glyph = { fontFamily: t.title.fontFamily, fontSize: t.title.fontSize, fontWeight: font.semibold, lineHeight: 1 }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: layer.search, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* 뒤 화면을 어둡게 가린다 · 잘못 눌러 닫히지 않도록 닫기는 '닫기' 버튼으로만 한다 */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

      <section role="dialog" aria-modal="true" aria-label="메뉴 검색" style={{
        position: 'relative', background: colors.bgPage, borderRadius: '32px 32px 0 0',
        padding: `${space.lg}px ${space.page}px`,
        display: 'flex', flexDirection: 'column', gap: space.md,
      }}>
        <GuideCue guide={{ id: 'dialog-search', ...dialogVoice.search, target: '[data-search-keyboard]' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <h2 style={{ ...t.title, margin: 0, color: colors.textPrimary }}>메뉴 검색</h2>
          <Button purpose="support" variant="Utility" size="small" onClick={onClose} style={{ height: 88, padding: '0 32px' }}>
            <Icon name="close" size={40} color={colors.textPrimary} optical="utility" />
            닫기
          </Button>
        </div>

        {/* 입력칸 · 화면 자판으로만 입력한다 */}
        <div role="textbox" aria-label="메뉴 이름" aria-readonly="true" style={{
          height: 100, flexShrink: 0, padding: '0 24px',
          background: theme.surface, border: `3px solid ${theme.stateCurrent}`, borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 20, overflow: 'hidden',
        }}>
          <Icon name="search" size={48} color={colors.textPrimary} optical="utility" />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
            {text && <span style={{ ...t.primary, color: colors.textPrimary }}>{text}</span>}
            <span aria-hidden="true" style={{ width: 3, height: 48, marginLeft: text ? 4 : 0, marginRight: 12, background: theme.stateCurrent, flexShrink: 0 }} />
            {!text && <span style={{ ...t.body, color: colors.textSecondary }}>메뉴 이름을 입력해주세요</span>}
          </div>
        </div>

        {/* 찾은 메뉴 · 세 줄 높이를 유지해 입력 중 자판이 움직이지 않는다. */}
        <div role="region" aria-label="검색 결과" aria-live="polite" style={{
          height: RESULT_H * MAX_RESULTS + RESULT_GAP * (MAX_RESULTS - 1), flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: RESULT_GAP,
        }}>
          {shown.map((match) => (
            <ResultRow key={match.item.id} match={match} selected={match.item.id === selectedId}
              onSelect={() => setSelectedId(match.item.id)} />
          ))}
          {hasMore && (
            <p style={{ ...t.body, margin: 0, height: RESULT_H, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>
              메뉴가 {hidden}개 더 있어요. 글자를 더 입력해 주세요.
            </p>
          )}
          {matches.length === 0 && (
            <p style={{ ...t.body, margin: 0, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: colors.textSecondary }}>
              {text ? '찾는 메뉴가 없어요. 글자를 지우고 다시 입력해 주세요.' : '글자를 입력하면 여기에 메뉴가 나와요.'}
            </p>
          )}
        </div>

        {/* 넘어가기 · 고른 메뉴 바로 아래에 둔다. 고르기 전에도 같은 자리에 꺼진 모양으로 둔다 */}
        <Button purpose="decision" variant="Primary" voiceAction="search-go" disabled={!selected} onClick={() => selected && onSelect(selected)}>
          {selected ? '주문으로 넘어가기' : '메뉴를 먼저 골라 주세요'}
        </Button>

        {/* 자판 */}
        <div data-search-keyboard style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: KEY_H, gap: KEY_GAP }}>
          {keypad.map((key, index) => {
            if (key.type === 'empty') return <div key={index} />
            if (key.type === 'vowel') {
              return (
                <button key={index} className="kiosk-key" aria-label={key.name} style={keyStyle}
                  onClick={() => type(pressVowel(units, key.key))}>
                  {key.key === 'ㆍ'
                    ? <span style={{ width: 14, height: 14, borderRadius: '50%', background: colors.textPrimary }} />
                    : <span style={glyph}>{key.key}</span>}
                </button>
              )
            }
            if (key.type === 'consonant') {
              const [first, second] = consonantKeys[key.key]
              return (
                <button key={index} className="kiosk-key" aria-label={`자음 ${first} ${second}`} style={{ ...keyStyle, gap: 14 }}
                  onClick={() => type(pressConsonant(units, key.key))}>
                  <span style={glyph}>{first}</span>
                  <span style={{ ...t.body, lineHeight: 1, color: colors.textSecondary }}>{second}</span>
                </button>
              )
            }
            const action = {
              backspace: { label: '지우기', run: pressBackspace },
              clear: { label: '모두 지우기', run: (): Unit[] => [] },
              space: { label: '띄어쓰기', run: pressSpace },
            }[key.type]
            return (
              <button key={index} className="kiosk-key"
                style={{ ...functionKeyStyle, ...(key.type === 'space' ? { gridRow: 'span 2' } : null) }}
                onClick={() => type(action.run(units))}>
                <span style={t.bodyButton}>{action.label}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/* 찾은 메뉴 한 줄 · 누르면 선택된다 (선택된 필터 탭과 같은 파란 선).
   입력한 글자와 맞은 부분은 색으로 표시한다. */
function ResultRow({ match, selected, onSelect }: { match: MenuMatch; selected: boolean; onSelect: () => void }) {
  const { priceText } = useOrderPricing()
  // 품절 메뉴는 찾아지되 고를 수 없다. 가격 자리에 ‘품절’(기획 MN-05).
  const soldOut = useSoldOut()(match.item.id)
  const t = useType()
  const theme = useTheme()
  const { item, from, to } = match
  const chars = [...item.name]

  return (
    <button className="kiosk-key" onClick={soldOut ? undefined : onSelect} disabled={soldOut} aria-pressed={selected} aria-label={soldOut ? `${item.name} 품절, 지금은 주문할 수 없어요` : undefined} data-sold-out={soldOut || undefined} style={{
      // 테두리가 2px에서 3px로 굵어져도 안쪽 배치가 움직이지 않게 여백으로 맞춘다
      height: RESULT_H, flexShrink: 0, padding: selected ? '0 27px 0 13px' : '0 28px 0 14px',
      background: selected ? theme.stateSelected : theme.surface,
      border: selected ? `3px solid ${theme.stateSelectedBorder}` : `2px solid ${theme.borderNeutral}`, borderRadius: radius.card,
      display: 'flex', alignItems: 'center', gap: space.md, cursor: soldOut ? 'default' : 'pointer', textAlign: 'left',
    }}>
      <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: menuCardMetrics.imageBackground, position: 'relative' }}>
        {item.imageUrl && (
          <img src={item.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: item.imagePosition ?? 'center', ...(soldOut ? { filter: 'grayscale(1)', opacity: 0.45 } : null) }} />
        )}
      </div>
      <span style={{ ...t.primary, flex: 1, minWidth: 0, color: soldOut ? colors.textDisabled : colors.textPrimary }}>
        {chars.slice(0, from).join('')}
        <span style={{ color: theme.stateSelectedText, fontWeight: font.semibold }}>{chars.slice(from, to + 1).join('')}</span>
        {chars.slice(to + 1).join('')}
      </span>
      {soldOut
        ? <span style={{ ...t.body, flexShrink: 0, fontWeight: font.bold, color: colors.textSecondary }}>품절</span>
        : <span style={{ ...t.price, flexShrink: 0, color: colors.textPrimary }}>{priceText(item)}</span>}
    </button>
  )
}
