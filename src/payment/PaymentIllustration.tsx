import type { PaymentArt } from './paymentFlow'
import { assetUrl } from '../assetUrl'

export default function PaymentIllustration({ kind, lowScreen, insertion = false }: { kind: PaymentArt; lowScreen: boolean; insertion?: boolean }) {
  if (kind === 'card' && insertion) {
    const variant = lowScreen ? 'low' : 'normal'
    // 카드가 아래에서 올라가 투입구에 들어가는 움직임 + 위쪽 큰 화살표(기획 S51 ‘큰 화살표·방향·깊이’, 사용자 2026-10-21 B안).
    // 3초마다 계속 반복, 움직임 줄이기 설정이면 꽂힌 모습과 화살표만(payment-flow.css).
    return <div role="img" aria-label="금색 칩이 위로 보이도록 카드를 넣는 그림" data-card-insertion-illustration style={{ position: 'relative', width: lowScreen ? 400 : 600, height: lowScreen ? 400 : 600, flexShrink: 0, ['--card-travel' as string]: lowScreen ? '48px' : '64px', ['--arrow-travel' as string]: lowScreen ? '16px' : '24px' }}>
      <img src={assetUrl('assets/figma-payment/card-insertion/reader-' + variant + '.svg')} alt="" style={{ position: 'absolute', left: lowScreen ? 85 : 100, top: lowScreen ? 30 : 50, maxWidth: 'none' }} />
      <img className="payment-card-insert" src={assetUrl('assets/figma-payment/card-insertion/card-' + variant + '.png')} alt="" width={lowScreen ? 217.989 : 365.641} height={lowScreen ? 192 : 328} style={{ position: 'absolute', left: lowScreen ? 111.005 : 147.183, top: lowScreen ? 140 : 219, maxWidth: 'none' }} />
      <svg className="payment-card-arrow" data-card-insertion-arrow aria-hidden="true" viewBox="0 0 72 200" width={lowScreen ? 48 : 72} height={lowScreen ? 134 : 200}
        style={{ position: 'absolute', left: lowScreen ? 340 : 528, top: lowScreen ? 124 : 190 }}>
        <path d="M36 190V16M8 44 36 16l28 28" fill="none" stroke="var(--accent-text)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  }
  const label = { cash: '지폐 투입·회수 위치 예시', card: '카드를 챙겨 주세요', scan: '휴대폰 결제 코드 인식 위치 예시', tap: '휴대폰을 대는 위치 예시', receipt: '영수증', success: '완료', error: '문제 발생', unknown: '확인 필요' }[kind]
  if (kind === 'scan') return <svg className="payment-scan-art" width="360" height="320" viewBox="0 0 360 320" role="img" aria-label={label} fill="none" stroke="var(--icon-neutral)" strokeWidth="6" strokeLinejoin="round">
    <path d="M228 122h96l20 110H208Z" fill="var(--bg-disabled)" /><path d="M222 148h96l8 48H215Z" fill="var(--bg-surface)" />
    <rect x="36" y="20" width="136" height="252" rx="20" fill="var(--bg-surface)" /><path d="M80 38h48M88 252h32" />
    <g strokeWidth="5"><rect x="60" y="86" width="26" height="26" /><rect x="122" y="86" width="26" height="26" /><rect x="60" y="148" width="26" height="26" /><path d="M104 90v28h38m-38 16h24v40m-24-24v24h-8m50-38v20h-8" /></g>
    <path d="m182 174 26-20m-10-1 12-2-3 13" stroke="var(--accent-text)" />
    <path d="M240 174h65" stroke="var(--accent-text)" />
  </svg>
  if (['cash', 'card', 'tap'].includes(kind)) {
    const asset = kind === 'cash' ? 'cash' : kind === 'card' ? 'card' : 'mobile'
    return <div className={'payment-art payment-art-' + kind} role="img" aria-label={label}>
      {kind === 'cash' && <span className="payment-device-slot" />}
      <span className="payment-device-icon" style={{ maskImage: `url(${assetUrl('assets/figma-payment/' + asset + '-normal.svg')})` }} />
      {kind === 'tap' && <span className="payment-device-target">◎</span>}
    </div>
  }
  return <svg className={'payment-symbol payment-symbol-' + kind} width="176" height="176" viewBox="0 0 160 160" role="img" aria-label={label} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'success' ? <><circle cx="80" cy="80" r="64" /><path d="m48 80 22 22 44-44" /></> : kind === 'receipt' ? <><path d="M42 20h76v124l-19-12-19 12-19-12-19 12Z" /><path d="M60 52h40M60 76h40M60 100h24" /></> : kind === 'error' ? <><path d="m80 18 66 122H14Z" /><path d="M80 60v36m0 20v2" /></> : <><circle cx="80" cy="80" r="64" /><path d="M60 60c0-28 48-28 40 2-4 12-20 12-20 28m0 22v2" /></>}
  </svg>
}
