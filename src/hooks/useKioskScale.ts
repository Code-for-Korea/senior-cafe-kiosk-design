import { layout } from '../design-system/metrics'
import { useEffect, useState } from 'react'

const DESIGN_W = layout.width
const DESIGN_H = layout.height

// reservedH: 화면 밖 개발용 탭이 차지하는 높이. fixed: 캡처용으로 원본 크기 고정.
export function useKioskScale(reservedH = 0, fixed = false) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (fixed) return
    function update() {
      const scaleX = window.innerWidth / DESIGN_W
      const scaleY = (window.innerHeight - reservedH) / DESIGN_H
      setScale(Math.min(scaleX, scaleY, 1)) // 원본보다 크게는 늘리지 않음
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [reservedH, fixed])

  return { scale, designW: DESIGN_W, designH: DESIGN_H }
}
