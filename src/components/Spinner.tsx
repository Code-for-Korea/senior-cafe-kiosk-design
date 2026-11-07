import './spinner.css'

// 기다리는 동안 도는 표시. 결제 처리 중과 같은 크기·색·속도 토큰. small은 알약 안에 넣는 크기.
export default function Spinner({ small = false }: { small?: boolean }) {
  return <span className={'kiosk-spinner' + (small ? ' is-small' : '')} aria-hidden="true" />
}
