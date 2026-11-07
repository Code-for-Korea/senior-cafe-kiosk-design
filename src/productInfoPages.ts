import { nutritionRows, type MenuItem } from './menuData'

type InformationRow = { label: string; value: string }
export type ProductInfoPage =
  | { kind: 'description'; title: string; value: string }
  | { kind: 'details'; title: string; rows: InformationRow[] }
  | { kind: 'nutrition'; title: string; servingNote: string; rows: InformationRow[] }

// Keep every topic within the reachable low-screen area without shrinking text.
export function productInfoPages(item: MenuItem): ProductInfoPage[] {
  const pages: ProductInfoPage[] = []
  if (item.description) pages.push({ kind: 'description', title: '상품설명', value: item.description })
  const details = (item.info ?? []).filter(row => row.label !== '영양 정보')
  for (let start = 0; start < details.length; start += 2) {
    pages.push({ kind: 'details', title: '재료와 알레르기 안내', rows: details.slice(start, start + 2) })
  }
  if (item.nutrition) {
    const rows = nutritionRows(item.nutrition)
    // 낮은 화면은 사진·주문 버튼 사이에 한 줄씩 보여 페이지 버튼도 가리지 않는다.
    const pageSize = rows.length > 4 ? 3 : 4
    for (let start = 0; start < rows.length; start += pageSize) {
      pages.push({ kind: 'nutrition', title: '영양정보', servingNote: item.nutrition.servingNote, rows: rows.slice(start, start + pageSize) })
    }
  }
  return pages.length ? pages : [{ kind: 'description', title: '상품설명', value: '등록된 상품 안내가 없어요.' }]
}
