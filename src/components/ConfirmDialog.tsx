import { dialogMetrics, layer, layout } from '../design-system/metrics'
import { useEffect, useRef, type ReactNode } from 'react'
import { colors, radius, space } from '../tokens'
import { useType } from './useType'
import { useTheme } from './ThemeContext'
import Button from './Button'
import { useAppControls } from './AppControlsContext'
import GuideCue from '../voice/GuideCue'
import type { DialogVoice } from '../voice/guides'
import { DialogVoiceBar } from './VoiceBarControls'

/* 한 번 더 묻는 대화상자 · 장바구니 빼기, 변경 취소, 처음으로 돌아가기가 같이 쓴다.
   왼쪽은 그만두기(Text), 오른쪽은 하려던 일(Primary). 큰 글씨 모드도 같은 역할 크기를 따라간다. */
interface Props {
  titleId: string
  title: ReactNode
  message?: ReactNode
  messageEmphasis?: boolean
  // 큰 글씨에서 설명을 36으로(직원 부르기·기다리는 창, 사용자 2026-10-20).
  messageReadable?: boolean
  cancelLabel: string
  confirmLabel: string
  destructive?: boolean
  lowScreen?: boolean
  onCancel: () => void
  onConfirm: () => void
  children?: ReactNode  // 버튼 대신 넣을 내용 (식사 장소 고르기처럼)
  // 음성 안내가 켜져 있으면 열릴 때 읽을 문장(guides.ts dialogVoice)과 테두리를 두를 곳. 기본은 버튼 줄.
  // always: 경고처럼 나타날 때마다 처음부터 읽는 대화상자(시간 초과 경고).
  voice?: DialogVoice & { target?: string; always?: boolean }
}

// icon: 제목 위 그림(담기 알림). dismissOnPress: 창 어디를 눌러도 닫기(버튼 없는 알림).
// 누름이 끝난 click에서 닫아야 같은 누름이 뒤 화면 버튼까지 가지 않는다.
export function DialogFrame({ titleId, title, message, messageEmphasis = false, messageReadable = false, children, icon, onDismiss, dismissOnPress = false, width = dialogMetrics.width, contentPaddingX = dialogMetrics.padding, contentPaddingTop = dialogMetrics.padding, contentGap = space.lg, lowScreen: lowOverride, voice }: Pick<Props, 'titleId' | 'title' | 'message' | 'messageEmphasis' | 'messageReadable' | 'children' | 'lowScreen' | 'voice'> & { icon?: ReactNode; onDismiss?: () => void; dismissOnPress?: boolean; width?: number; contentPaddingX?: number; contentPaddingTop?: number; contentGap?: number }) {
  const controls = useAppControls()
  const lowScreen = lowOverride ?? controls.lowScreen ?? false
  const t = useType()
  const theme = useTheme()
  const dialogRef = useRef<HTMLDivElement>(null)
  const dismissRef = useRef(onDismiss)
  useEffect(() => { dismissRef.current = onDismiss }, [onDismiss])
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const siblings = Array.from(dialog.parentElement?.children ?? []).filter((node): node is HTMLElement => node instanceof HTMLElement && node !== dialog)
    const previousInert = siblings.map((node) => node.inert)
    siblings.forEach((node) => { node.inert = true })
    dialog.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissRef.current) {
        event.preventDefault()
        dismissRef.current()
      }
      if (event.key !== 'Tab') return
      const buttons = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'))
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (!first) { event.preventDefault(); dialog.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus() }
    }
    dialog.addEventListener('keydown', onKeyDown)
    return () => {
      dialog.removeEventListener('keydown', onKeyDown)
      siblings.forEach((node, index) => { node.inert = previousInert[index] })
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  useEffect(() => { dialogRef.current?.focus() }, [titleId])
  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={dismissOnPress ? () => dismissRef.current?.() : undefined} style={{
      position: 'absolute', inset: 0, zIndex: layer.dialog, background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.page, ...(lowScreen ? { paddingTop: layout.lowHeaderHeight } : {}),
    }}>
      <div style={{ width, maxHeight: '100%', overflowY: 'auto', boxSizing: 'border-box', background: theme.surface, borderRadius: radius.dialog, padding: dialogMetrics.padding, paddingInline: contentPaddingX, paddingTop: contentPaddingTop, display: 'flex', flexDirection: 'column', gap: contentGap }}>
        {icon}
        {(title || message) && <div data-dialog-copy style={{ display: 'flex', flexDirection: 'column', gap: space.sm, flexShrink: 0 }}>
          {title && <p id={titleId} style={{ ...t.title, margin: 0, textAlign: 'center', color: colors.textPrimary }}>{title}</p>}
          {message && <p style={{ ...(messageEmphasis ? t.primary : messageReadable ? t.readable(t.body) : t.body), margin: 0, textAlign: 'center', color: messageEmphasis ? colors.textPrimary : colors.textSecondary }}>{message}</p>}
        </div>}
        {children}
      </div>
      {voice && <GuideCue guide={{ id: 'dialog-' + titleId, text: voice.text, narration: voice.narration, target: voice.target ?? '[data-dialog-actions]', always: voice.always }} />}
      <DialogVoiceBar />
    </div>
  )
}

export default function ConfirmDialog({ cancelLabel, confirmLabel, onCancel, onConfirm, destructive = false, ...frame }: Props) {
  return (
    <DialogFrame {...frame} onDismiss={onCancel}>
      <div data-dialog-actions style={{ display: 'flex', gap: 24 }}>
        <Button purpose="decision" variant="Text" onClick={onCancel} style={{ flex: 1 }}>{cancelLabel}</Button>
        <Button purpose="decision" variant={destructive ? "Destructive" : "Primary"} onClick={onConfirm} style={{ flex: 1 }}>{confirmLabel}</Button>
      </div>
    </DialogFrame>
  )
}
