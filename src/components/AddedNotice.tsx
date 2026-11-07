import { useEffect, useRef } from 'react'
import { space } from '../tokens'
import { DialogFrame } from './ConfirmDialog'
import { CheckMark } from './SelectionCard'
import './added-notice.css'

// 3초 뒤 저절로 닫힌다(사용자 2026-10-21: C안, 읽을 시간을 두려고 1.5초에서 늘림). 누르면 바로 닫힌다.
export const ADDED_NOTICE_MS = 3000

/* 담은 뒤 장바구니 위에 잠깐 뜨는 알림(F-1). 버튼 없이 체크 + ‘○○를 담았어요’ + 고른 내용·수량.
   음성 안내 문장은 없다(기획 D-04: 다음 행동·위치만). 닫히면 장바구니 안내를 읽는다. */
export default function AddedNotice({ title, detail, onClose }: { title: string; detail: string; onClose: () => void }) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), ADDED_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [])
  return <DialogFrame titleId="added-notice-title" title={title} message={detail} messageReadable
    onDismiss={() => close.current()} dismissOnPress contentGap={space.xl}
    icon={<div className="added-notice-mark" data-added-notice-mark aria-hidden="true"><CheckMark size={64} color="var(--success-mark)" className="added-notice-check" /></div>} />
}
