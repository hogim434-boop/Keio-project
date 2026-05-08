/**
 * 일본 사용자 대상 서비스 — 시간 표시는 항상 JST(Asia/Tokyo) 고정.
 *
 * toLocaleString('ja-JP') 만 호출하면 timeZone 옵션이 없어 브라우저 로컬 타임존을
 * 따라가므로, 해외에서 접속한 사용자에게는 다른 시간이 표시된다.
 * 이 모듈은 timezone을 강제 고정한 두 종류의 포맷터를 제공한다.
 */

const TIMEZONE = 'Asia/Tokyo'

/**
 * 날짜만 — 게시물 카드·마이 페이지 등 목록형 UI용.
 * 결과 예시: "2026/05/08"
 */
export function formatJstDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('ja-JP', { timeZone: TIMEZONE })
}

/**
 * 월·일 + 시·분 — 게시물 상세·댓글·리포트 등 시각이 중요한 UI용.
 * 결과 예시: "5月8日 16:24"
 */
export function formatJstDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
