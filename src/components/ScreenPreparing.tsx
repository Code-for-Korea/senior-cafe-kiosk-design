import Spinner from './Spinner'
import { useType } from './useType'
import { colors, space } from '../tokens'

// 다음 화면 파일을 받는 동안(낮은 화면을 처음 켤 때 등). 화면 전체를 바탕색으로 덮고 가운데에 알린다.
// 미리 받아 두므로 거의 보이지 않는다(lowScreens.ts). 사용자 R1 2026-10-20.
export default function ScreenPreparing() {
  const t = useType()
  return <div role="status" data-screen-preparing style={{
    position: 'absolute', inset: 0, background: 'var(--bg-page)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: space.lg,
  }}>
    <Spinner />
    <p style={{ ...t.primary, fontWeight: 700, margin: 0, color: colors.textPrimary }}>화면을 준비하고 있어요</p>
  </div>
}
