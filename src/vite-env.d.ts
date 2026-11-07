/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Toss 페이먼츠 테스트 클라이언트 키(공개 키, test_ck_...). 클라이언트 전용 데모라 시크릿 키는 쓰지 않는다.
  readonly VITE_TOSS_CLIENT_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
