import { createContext, useContext } from 'react'
import { menuItems, type MenuItem } from './menuData'
import { devParams } from './devParams'

// 메뉴를 받는 상태(기획 S20 ‘메뉴 목록 로딩 시 골격 표시’, 사용자 L1·F 2026-10-20).
// 시안은 메뉴가 앱 안에 있어 늘 바로 'ready'. 실제 매장에서는 주문 시스템에서 메뉴를 받는 동안 'loading',
// 받지 못하면 'failed'. 시연은 주소(?menuload=loading · failed)와 화면 밖 개발 막대로 본다.
export type MenuLoadStatus = 'loading' | 'ready' | 'failed'
// 이 시간 넘게 받지 못하면 ‘메뉴를 불러오지 못했어요’로 바꾼다. 기다림이 끝나지 않는 막다른 길을 막는다.
export const MENU_LOAD_TIMEOUT_MS = 10_000

export interface MenuLoad { status: MenuLoadStatus; retry: () => void }
export const MenuLoadContext = createContext<MenuLoad>({ status: 'ready', retry: () => {} })
export const useMenuLoad = () => useContext(MenuLoadContext)

// 메뉴 화면이 보여 줄 메뉴. 시연 주소 ?empty=dessert면 디저트가 하나도 없는 날처럼 보여
// ‘조건에 맞는 메뉴가 없어요’를 확인한다(S20-EMPTY). 그 밖에는 앱의 메뉴 그대로.
export const menuCatalog: MenuItem[] = devParams.emptyDessert ? menuItems.filter(item => item.kind !== '디저트') : menuItems

