import Button from './Button'
import { useType } from './useType'
import { colors, space } from '../tokens'

/* 장바구니가 빔(기획 S40-EMPTY, 사용자 2026-10-20). 마지막 메뉴를 뺐을 때 보인다.
   일반·낮은 화면이 같은 글과 같은 버튼을 쓴다. 결제 버튼은 아래에서 잠겨 있고, 나가는 길은 이 버튼. */
export default function CartEmpty({ onShowMenu }: { onShowMenu: () => void }) {
  const t = useType()
  return <div data-cart-empty style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.lg, textAlign: 'center' }}>
    <h2 style={{ ...t.title, margin: 0, color: colors.textPrimary }}>장바구니가 비어 있어요</h2>
    <Button purpose="decision" variant="Tertiary" voiceAction="cart-empty-menu" onClick={onShowMenu} style={{ minWidth: 360 }}>메뉴 보러 가기</Button>
  </div>
}
