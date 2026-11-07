import { createElement, lazy, useState, type ComponentProps, type ComponentType } from 'react'

// 낮은 화면은 켤 때 따로 받는 파일이다. 받는 동안 ‘화면을 준비하고 있어요’가 보이므로(ScreenPreparing),
// 앱이 쉬는 틈에 미리 받아 두고(preloadLowScreens), 받은 뒤에는 기다리지 않고 바로 그린다(사용자 R1 2026-10-20).
function lazyScreen<C extends ComponentType<any>>(load: () => Promise<{ default: C }>) {
  let loaded: C | null = null
  let pending: Promise<void> | null = null
  const preload = () => pending ??= load().then(module => { loaded = module.default }, () => { pending = null })
  const Lazy = lazy(load)
  // 처음 그릴 때 고른 쪽을 계속 쓴다. 도중에 바꾸면 화면이 새로 만들어져 고르던 것이 사라진다.
  function Screen(props: ComponentProps<C>) {
    const [{ Component }] = useState(() => ({ Component: (loaded ?? Lazy) as ComponentType<ComponentProps<C>> }))
    return createElement(Component, props)
  }
  return Object.assign(Screen, { preload })
}

export const LowScreenProduct = lazyScreen(() => import('./previews/LowScreenProduct'))
export const LowMenuScreen = lazyScreen(() => import('./previews/LowScreenMenu').then(module => ({ default: module.LowMenuScreen })))
export const LowCartScreen = lazyScreen(() => import('./previews/LowScreenCart').then(module => ({ default: module.LowCartScreen })))
export const LowScreenOptions = lazyScreen(() => import('./previews/LowScreenOptions'))
export const LowScreenReview = lazyScreen(() => import('./previews/LowScreenReview'))

export function preloadLowScreens() {
  for (const screen of [LowMenuScreen, LowScreenProduct, LowScreenOptions, LowScreenReview, LowCartScreen]) screen.preload()
}
