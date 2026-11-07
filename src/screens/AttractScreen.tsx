import UtilityBar from '../components/UtilityBar'
import { useAppControls } from '../components/AppControlsContext'
import './attract.css'

/* 대기 화면(기획 S00). 위는 광고 사진, 아래 가운데에 시작 안내.
   광고를 포함해 화면 아무 곳이나 누르면 이용 방법으로 간다(사용자 2026-10-19 결정, 기획 ST-01의 별도 시작 버튼과 다름).
   아래 기능바는 시작 전에도 쓸 수 있고, 누를 때는 주문이 시작되지 않는다. */
export default function AttractScreen({ onStart }: { onStart: () => void }) {
  const { lowScreen = false, toggleLowScreen } = useAppControls()
  return <div className="attract-screen" data-attract>
    <button type="button" className="attract-start" data-attract-start onClick={onStart} aria-label="화면을 누르면 주문 시작">
      <img className="attract-photo" src="./assets/ads/attract-coffee.jpg" alt="" />
      <span className="attract-shade" aria-hidden="true" />
      <span className="attract-copy" aria-hidden="true">
        <span className="attract-headline">달콤하고 부드러운<br />커피 한 잔</span>
        <span className="attract-sub">오늘도 천천히, 편하게 주문하세요</span>
      </span>
      <span className="attract-prompt" data-attract-prompt>
        <span className="attract-touch" aria-hidden="true"><i /><i /><b /></span>
        <span className="attract-title" data-attract-title>화면을 누르면 주문 시작</span>
        <span className="attract-hint">글씨 크기·음성 안내는 아래에서 바꿀 수 있어요</span>
      </span>
    </button>
    <UtilityBar lowScreen={lowScreen} onToggleLowScreen={toggleLowScreen} />
  </div>
}
