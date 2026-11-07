import { layout, progressMetrics } from '../design-system/metrics'
import { useAppControls } from '../components/AppControlsContext'
import { colors, radius, space } from '../tokens'
import Icon from '../components/Icon'
import ProgressStep from '../components/ProgressStep'
import UtilityBar from '../components/UtilityBar'
import LanguageTrigger from '../components/LanguageTrigger'
import type { Language } from '../components/LanguageBar'
import type { OrderMethod } from '../components/OrderMethodDialog'
import { useType } from '../components/useType'
import { useTheme } from '../components/ThemeContext'
import '../previews/low-screen-menu.css'

const methods = [
  { value: 'DINE_IN', icon: 'dineIn', label: '매장이용', description: '매장에서 먹기' },
  { value: 'TAKE_OUT', icon: 'takeOut', label: '포장', description: '가지고 가기' },
] as const

export default function OrderMethodScreen({ onSelect, language, onLanguageChange }: {
  onSelect: (method: OrderMethod) => void
  language: Language
  onLanguageChange: (language: Language) => void
}) {
  const t = useType()
  const theme = useTheme()
  const { lowScreen = false, toggleLowScreen } = useAppControls()
  return (
    <div data-method-screen={lowScreen ? 'low' : 'normal'} style={{ position: 'relative', width: layout.width, height: layout.height, background: colors.bgPage, display: 'flex', flexDirection: 'column' }}>
      {lowScreen && <header style={{ height: 640, flexShrink: 0, padding: `0 64px ${layout.lowHeaderBottom}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: layout.lowHeaderGap, background: 'var(--bg-muted)' }}>
        <div style={{ textAlign: 'center', paddingBottom: 60 }}>
          <p style={{ ...t.primary, margin: '0 0 16px' }}>낮은 화면을 사용하고 있어요</p>
          <p style={{ ...t.body, margin: 0, color: colors.textSecondary }}>아래에서 이용 방법을 골라 주세요.</p>
        </div>
        <ProgressStep current={1} />
      </header>}
      <main style={{ flex: 1, minHeight: 0, padding: lowScreen ? '48px 64px' : `${layout.progressTop}px ${space.page}px ${space.xl}px`, display: 'flex', flexDirection: 'column', gap: space.xl }}>
        {!lowScreen && <header data-order-header style={{ flexShrink: 0, paddingBottom: progressMetrics.spaceBelow }}><ProgressStep current={1} /></header>}
        <section aria-labelledby="method-question" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: space.xl }}>
          <div data-method-intro style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
            <div style={{ minHeight: 96, display: 'flex', alignItems: 'center' }}>
              <LanguageTrigger value={language} onChange={onLanguageChange} lowScreen={lowScreen} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
              <h1 id="method-question" style={{ ...t.title, margin: 0, color: colors.textPrimary }}>어디에서 드시겠어요?</h1>
              <p style={{ ...t.readable(t.body), margin: 0, color: colors.textSecondary }}>이용 방법을 선택하면 메뉴로 이동해요.</p>
            </div>
          </div>
          <div data-voice-method-options style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: space.md }}>
            {methods.map(method => (
              <button key={method.value} type="button" onClick={() => onSelect(method.value)} aria-label={method.label} aria-describedby={`method-${method.value}-description`}
                style={{ height: lowScreen ? 400 : 480, padding: 24, border: `2px solid ${theme.borderNeutral}`, borderRadius: lowScreen ? 12 : radius.card, background: theme.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: space.lg, cursor: 'pointer' }}>
                <Icon name={method.icon} size={lowScreen ? 144 : 176} color={colors.iconBrand} />
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
                  <span style={{ ...t.primary, color: colors.textPrimary }}>{method.label}</span>
                  <span id={`method-${method.value}-description`} style={{ ...t.body, whiteSpace: 'pre-line', color: colors.textSecondary, minHeight: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center', wordBreak: 'keep-all' }}>{method.description}</span>
                </span>
              </button>
            ))}
          </div>

        </section>
      </main>
      <UtilityBar lowScreen={lowScreen} onToggleLowScreen={toggleLowScreen} />

    </div>
  )
}
