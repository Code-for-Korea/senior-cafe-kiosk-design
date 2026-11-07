import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { lazy, Suspense } from 'react'
import './index.css'

const PaymentStudy = lazy(() => import('./previews/PaymentStudy'))
const LowScreenCart = lazy(() => import('./previews/LowScreenCart'))
const LowScreenMenu = lazy(() => import('./previews/LowScreenMenu'))
const comparison = new URLSearchParams(window.location.search).get('compare')

// Figma 캡처 주소(#figmacapture=…)로 열었을 때만 캡처 스크립트를 불러온다.
if (window.location.hash.includes('figmacapture')) {
  const script = document.createElement('script')
  script.src = 'https://mcp.figma.com/mcp/html-to-design/capture.js'
  script.async = true
  document.head.appendChild(script)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {comparison === 'payment' || comparison === 'low-payment' ? <Suspense fallback={<p>결제 시안을 불러오고 있어요.</p>}><PaymentStudy initialLow={comparison === 'low-payment'} /></Suspense> : comparison === 'low-cart' ? <Suspense fallback={<p>낮은 장바구니 시안을 불러오고 있어요.</p>}><LowScreenCart /></Suspense> : comparison === 'low-product' ? <Suspense fallback={<p>낮은 상품상세 시안을 불러오고 있어요.</p>}><App lowProductStudy /></Suspense> : comparison === 'low-screen' ? <Suspense fallback={<p>낮은 화면 시안을 불러오고 있어요.</p>}><LowScreenMenu /></Suspense> : <App />}
  </React.StrictMode>,
)
