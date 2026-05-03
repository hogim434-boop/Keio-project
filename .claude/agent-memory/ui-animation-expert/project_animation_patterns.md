---
name: 프로젝트 애니메이션 패턴 및 설정
description: KEIO SHARE 프로젝트에서 사용 중인 애니메이션 기술, 키프레임, easing 값 기록
type: project
---

## 설치된 애니메이션 라이브러리

- **framer-motion**: 설치 완료 (2026-05-02)
- **tw-animate-css**: globals.css에 `@import "tw-animate-css"` 이미 포함됨

## globals.css 커스텀 @keyframes

`@layer base` 블록 바로 앞에 위치:

```css
@keyframes orb-drift-1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(24px, -16px) scale(1.05); }
}
@keyframes orb-drift-2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-20px, 20px) scale(0.97); }
}
```

## 사용 중인 Easing Curves

| 용도 | 커브 | 설명 |
|------|------|------|
| 일반 진입 | `[0.22, 1, 0.36, 1]` | expo out — 빠르게 시작해 부드럽게 정착 |
| 팝/뱃지 | `[0.34, 1.56, 0.64, 1]` | back out — 살짝 오버슈팅하는 스프링 |
| 마이크로인터랙션 | duration: 0.15s | 버튼 hover/tap |

## 공유 motion-variants 라이브러리

`lib/motion-variants.ts` 에 5개의 공유 Variants 정의 (2026-05-02):

| variant 이름 | 용도 | 핵심 효과 |
|---|---|---|
| `listContainer` | 리스트 부모 | staggerChildren: 0.06, delayChildren: 0.05 |
| `listItem` | 리스트 아이템 | opacity+y:12, duration:0.4, ease:[0.22,1,0.36,1] |
| `pageHeader` | 페이지 제목 | opacity+y:-8, duration:0.35 |
| `fabEntrance` | FAB 버튼 진입 | scale:0→1+y:8, delay:0.3, back-out ease |
| `emptyState` | 빈 상태 UI | scale:0.95→1+opacity, back-out ease |

## 앱 내부 애니메이션 패턴 (2026-05-02 구현)

### layoutId 3종 분리 규칙
- `"tab-indicator"` — BottomTabBar 상단 슬라이딩 바
- `"campus-pill"` — courses-client 캠퍼스 필터 배경
- `"community-tab-pill"` — community-client 탭 필터 배경

### FAB (Floating Action Button) 패턴
- `motion.div`가 `Sheet` 전체를 감쌈 (`post-compose-sheet`, `review-sheet`)
- `fixed bottom-20 right-4 z-50`를 motion.div에 적용
- SheetContent는 Portal 렌더링이므로 wrapper 위치 무관
- `fabEntrance` variant + `whileHover={{ scale: 1.08 }}` + `whileTap={{ scale: 0.92 }}`

### AnimatePresence 사용 패턴
- 필터/탭 변경 시 목록 재등장: `AnimatePresence mode="wait"` + `key={filterValue}`
- 빈 상태 ↔ 결과 목록 전환: 동일 패턴

### whileHover boxShadow 값
- `boxShadow: '0 4px 20px oklch(0 0 0 / 0.08)'` — Framer Motion은 CSS 변수 보간 불가, OKLCH 직접값 사용
- `borderColor: 'oklch(0.708 0 0)'` — 카드 hover 시 테두리 강조

### CourseCard / PostCard 공통 구조
- 외부: `motion.div variants={listItem}` (stagger 상속)
- 내부: `motion.div whileHover={{ y:-2, boxShadow, borderColor }} whileTap={{ scale: 0.985 }}`

## 컴포넌트별 적용 패턴

### `app/(public)/layout.tsx`
- 배경 오브(orb): `fixed inset-0 z-[-1]` — body의 max-width 제약 탈출
- 오브 색상: 왼쪽 보라빛 `oklch(0.75 0.12 280)`, 오른쪽 민트 `oklch(0.82 0.08 200)`
- 헤더: `tw-animate-css`의 `animate-in fade-in slide-in-from-top-4 duration-300 fill-mode-both`
- 헤더 배경: `bg-background/80 backdrop-blur-sm` (글래스모피즘)

### `app/(public)/_components/hero-section.tsx`
- 타이틀 글자 단위 split + `rotateX + blur` flip-in 효과
- `perspective: 800px`를 h1에 직접 style로 적용 (rotateX 원근감)
- `useReducedMotion()` 훅으로 접근성 처리 — true면 모든 variants를 `{}`로 교체
- **Button asChild + framer-motion 충돌 방지**: `motion.div`로 외부 래핑 방식 사용

### `app/(public)/_components/auth-header.tsx` (신규, 2026-05-02)
- 로그인/회원가입 페이지 전용 헤더 컴포넌트
- `motion.header` initial `{ opacity: 0, y: -12 }` → animate `{ opacity: 1, y: 0 }`, duration 0.4s
- `shouldReduce ? false : { opacity: 0, y: -12 }` — shouldReduce true이면 initial을 false로 설정해 즉시 표시
- 헤더 배경: `bg-background/80 backdrop-blur-sm` (랜딩 헤더와 동일한 글래스모피즘)

### `app/(public)/login/page.tsx` 및 `app/(public)/signup/page.tsx` (2026-05-02)
- 레이아웃: `flex flex-col min-h-dvh` 래퍼 + `<AuthHeader />` + `flex-1 flex flex-col justify-center` 콘텐츠 영역
- `pageContainer`: staggerChildren 0.08, delayChildren 0.15
- `fadeUp`: opacity+y 16, duration 0.5, ease [0.22,1,0.36,1] — 제목/구분선/링크에 적용
- `formContainer`: staggerChildren 0.07 — 폼 필드 내부 순차 등장
- `field`: opacity+y 10, duration 0.4, ease [0.22,1,0.36,1] — 개별 필드에 적용
- 버튼: `motion.div` 이중 래핑 (바깥=field variants 등장, 안쪽=whileHover/whileTap 전담)
- `motion.form` 사용 — framer-motion은 모든 HTML 태그 지원

## body 제약사항

```css
/* globals.css @layer base */
body {
  max-width: 768px;
  margin-inline: auto;
}
```
배경 오브처럼 전체 화면을 덮어야 하는 요소는 반드시 `position: fixed`를 사용해야 이 제약을 벗어남.

**Why:** 랜딩 페이지 첫 애니메이션 구현 시 발견한 중요한 레이아웃 제약
**How to apply:** 풀블리드(full-bleed) 배경 요소는 항상 `fixed inset-0`으로 처리
