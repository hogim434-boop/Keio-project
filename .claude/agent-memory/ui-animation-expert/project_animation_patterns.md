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

`lib/motion-variants.ts` 에 14개의 공유 Variants 정의 (Phase 1B: 2026-05-04 확장):

### 기존 5개
| variant 이름 | 용도 | 핵심 효과 |
|---|---|---|
| `listContainer` | 리스트 부모 | staggerChildren: 0.06, delayChildren: 0.05 |
| `listItem` | 리스트 아이템 | opacity+y:12, duration:0.4, ease:[0.22,1,0.36,1] |
| `pageHeader` | 페이지 제목 | opacity+y:-8, duration:0.35 |
| `fabEntrance` | FAB 버튼 진입 | scale:0→1+y:8, delay:0.3, back-out ease |
| `emptyState` | 빈 상태 UI | scale:0.95→1+opacity, back-out ease |

### Phase 1B 신규 (Threads/X SNS 스타일) — 실제 motion-variants.ts 기준
| variant 이름 | 타입 | 용도 |
|---|---|---|
| `springTap` | transition 객체 | 버튼 whileTap transition — stiffness:500, damping:30, mass:0.6 |
| ~~`cardLift`~~ | ~~Variants~~ | **실제 파일에 없음** — post-card.tsx에서 whileHover 인라인 처리 |
| `heroFadeUp` | Variants | 랜딩 hero 대형 등장 — blur(8px)→0 + y:32→0, duration:0.7 |
| `staggerFast` | Variants | 빠른 stagger 컨테이너 — staggerChildren:0.04 (0.06보다 빠름) |
| `fadeInUp` | Variants | 범용 등장 — y:16→0, duration:0.4, expo-out |
| `glowPulse` | animate 객체 | FAB 글로우 무한 반복 — oklch 보라/파랑 boxShadow 펄스 |
| `heartPop` | animate 객체 | 좋아요 하트 팝 — scale:[1,1.45,1], back-out ease |
| `sheetSlideUp` | transition 객체 | Bottom Sheet 스프링 진입 — stiffness:380, damping:35 |
| `tabIndicator` | transition 객체 | 탭 인디케이터 layoutId 슬라이딩 — stiffness:450, damping:30 |

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

## 랜딩 페이지 Phase 2A/2B 풀 리뉴얼 (2026-05-04)

### `app/(public)/landing/page.tsx`
- Phase 2A 마크업 + Phase 2B 모션 통합 작성
- 구조: 글래스 sticky 헤더 → Hero 섹션 → 3 특징 카드 → CTA 푸터
- 헤더: `motion.header` initial `{opacity:0, y:-20}` animate `{opacity:1, y:0}` duration:0.5
- Hero 컨테이너: `motion.section variants={staggerFast}` initial/animate
  - 배지: `motion.div variants={fadeInUp}`
  - 타이틀: `motion.h1 variants={heroFadeUp}` (blur:8px→0 + y:32)
  - 부제/버튼/안내: `motion.div/p variants={fadeInUp}`
- CTA 버튼: `motion.div` 외부 래핑 — `whileHover:scale:1.02` + `whileTap:scale:0.96` + `transition={springTap}`
- 3 특징 카드: `motion.div variants={staggerFast}` + `whileInView` + `viewport:{once:true, margin:'-80px'}`
  - FeatureCard 컴포넌트: `motion.div variants={fadeInUp}` 외부 + `motion.article variants={cardLift}` 내부 (두 variants 분리 패턴)
- CTA 푸터: `motion.section variants={fadeInUp}` whileInView
- useReducedMotion: `const shouldReduceMotion = useReducedMotion() ?? false` — `INSTANT={duration:0}` 상수로 오버라이드
- 배경 orb: `position: absolute` + globals.css `orb-drift-1/2` keyframes (body max-width 제약 받음 — fixed 가 아닌 relative 컨테이너 내부)

### Button asChild + Framer Motion 패턴 (랜딩 확정)
- `motion.div`로 Button을 외부 래핑 → whileHover/whileTap 적용
- Button 자체를 motion.* 로 변환하지 않음 (asChild radix 충돌 방지)

## 랜딩 페이지 Phase 3 마이크로인터랙션 (2026-05-04)

### `app/(public)/landing/page.tsx` — 추가된 로컬 컴포넌트

#### `<Spotlight />`
- 마우스를 아주 느리게 따라오는 ambient 글로우 원 (파일 내 로컬 컴포넌트)
- useSpring: `{ stiffness: 50, damping: 20 }` — Apple 풍 거의 따라오지 않는 속도
- 크기: 700x700px, `radial-gradient` + `blur-[40px]`
- 라이트: `oklch(0.7 0.18 270 / 0.08)`, 다크: `oklch(0.6 0.22 270 / 0.15)`
- `mix-blend-multiply`(라이트) / `mix-blend-screen`(다크)
- 배치: `position: absolute` (main 기준) — body 768px 제약 안에 가둠 (fixed 미사용)
- 가드: `reduced=true` 시 DOM 렌더 안 함, `(pointer: coarse)` 시 mousemove 미등록

#### `<MagneticButton />`
- 마우스 끌림 효과 + hover glow 를 한 컴포넌트로 통합 (파일 내 로컬 컴포넌트)
- useSpring: `{ stiffness: 200, damping: 18, mass: 0.6 }` — 탄탄하되 민첩
- 끌림 강도: `(dx, dy) * 0.25`, clamp ±8px
- `isPrimary=true` 시 whileHover 에 `boxShadow: '0 0 30px oklch(0.6 0.22 270 / 0.4)'` 추가
- 기존 scale 1.02 / 0.96 springTap 과 공존 (x/y transform 은 독립 축)
- 가드: `reduced=true` 시 whileHover/whileTap undefined, mousemove ref 로 coarse 감지

## 좋아요 4단계 choreography (Pro Phase 1 Day 1, 2026-05-13)

### 공유 컴포넌트: `components/community/like-particles.tsx`
- props: `trigger: boolean` — true 가 되는 순간 파티클 1회 발사 (애니메이션 끝나면 자동 소멸)
- 4개 이모지 파티클 `❤️ ✨ ⭐ ❤️` 각기 다른 각도/거리로 방사
- `useReducedMotion()` true 시 컴포넌트 자체 null 반환
- 부모 요소에 `position: relative` 필수 (`motion.button`에 `relative` 추가)

### 적용 패턴 (`post-card.tsx`, `post-detail-actions.tsx` 동일)
```
① 색 전환: CSS transition-colors duration-150 (myReaction === 'up' 조건부 className)
② 하트 pop: motion.span key={'liked'|'unliked'} animate={{ scale:[1,1.45,1] }}
   - ease: [0.34, 1.56, 0.64, 1] (back-out), duration: 0.35s
   - key 전환 = remount = animate 재실행 (가장 간단한 패턴)
③ 숫자 ticker: AnimatePresence mode="popLayout" + motion.span key={reactionUp}
   - initial:{y:8,opacity:0} / animate:{y:0,opacity:1} / exit:{y:-8,opacity:0}
   - duration:0.32, ease:[0.22,1,0.36,1]
   - 부모 span: overflow-hidden min-w-[1ch] tabular-nums
④ 파티클: before===null && next==='up' 조건에서만 setShowParticles(true)
   setTimeout 650ms 후 false 리셋 (duration 600ms + 50ms 여유)
```

### 4단계가 모두 동시에 시작되는 이유
- ①②④: `setMyReaction(next)` + `setShowParticles(true)` = 같은 render 싸이클
- ③: `setReactionUp` 도 같은 싸이클 → React 배치 업데이트로 T+0ms 동시 발화

## PostFeed stagger entrance 패턴 (Pro Phase 1 Day 1, 2026-05-13)

### `components/community/post-feed.tsx`
- 컨테이너: `motion.div variants={feedContainer}` — 파일 내 로컬 variants (listContainer override)
- `feedContainer.staggerChildren = 0.05` (50ms) — listContainer(0.06=60ms)를 PostFeed에서 override
  - 이유: 일본 시장 톤 — 한국(30-40ms)보다 한 박자 여유있게
- 초기 마운트 카드: `motion.div variants={listItem}` — listItem은 `lib/motion-variants.ts`에서 import
- 무한 스크롤 추가 카드: 일반 `<div>` — 즉시 표시, stagger 없음
- 초기 카드 판별: `useState<number>(initial.items.length)` → `index < initialCount`
  - **중요**: `useRef.current` 를 render 중 읽으면 `react-hooks/refs` ESLint 오류 → `useState` 사용
- `useReducedMotion() ?? false`: true 시 feedContainer/listItem variants 모두 undefined

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

## Phase 3B 컴포넌트 모션 강화 (2026-05-04)

### post-card.tsx
- `<article>` → `<motion.article>` 교체 — **Phase 3B 기록은 부정확**. 실제 motion-variants.ts에 `cardLift` Variants 없음.
  - Pro Phase 1 Day 2 #5 에서 `whileHover`/`whileTap` 인라인으로 직접 구현:
    ```tsx
    whileHover={reduce ? undefined : { y: -2, scale: 1.005, boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)' }}
    whileTap={reduce ? undefined : { scale: 0.985, y: 0 }}
    transition={{ type:'spring', stiffness:400, damping:28, mass: springTap.mass }}
    ```
  - `springTap`의 `mass:0.6` 값을 `(springTap as { mass: number }).mass` 로 재사용
  - ViewTransition wrapper + 좋아요 4단계 choreography 완전 보존
- 추천 버튼: `whileTap + transition={springTap}` + `motion.span key={String(myReaction==='up')} animate={scale:[1,1.45,1]}`로 heartPop 구현
- 활성 색상: 추천 `text-red-500 bg-red-50`, 북마크 `text-amber-500 bg-amber-50`
- **FLIP layout animation (Pro Phase 1 Day 1)**: `layout={reduce ? undefined : 'position'}` + `transition={{ type:'spring', stiffness:350, damping:30 }}` 추가
  - `layout="position"` 선택 이유: "size" 대신 위치만 추적 → 카드 내부 텍스트 클램프 왜곡 없음
  - `reduce===true` 시 layout=undefined으로 FLIP 계산 완전 스킵 (접근성)

### post-detail-actions.tsx
- 모든 motion.button에 `transition={springTap}` 추가
- 좋아요 active: `text-primary bg-primary/10` (red-500 제거)
- 싫어요 active: `text-accent bg-accent/10` (blue-500 제거)
- 북마크 active: `text-amber-400 bg-amber-400/10`
- 삭제 hover: `hover:text-destructive` (red-500 제거)
- heartPop: 좋아요 아이콘 `motion.span key + animate={scale:[1,1.45,1]}`

### bottom-tab-bar.tsx
- 인디케이터 `bg-foreground` → `bg-gradient-violet` (보라-파랑 그라데이션 바)
- active 아이콘 글로우: 래퍼 `<div style={{ filter: 'drop-shadow(0 0 8px oklch(0.6 0.22 270 / 0.5))' }}>`
- Lucide Icon은 style prop 미지원 → 래퍼 div로 처리 (TypeScript 오류 방지 패턴)

### write-fab.tsx
- `animate={glowPulse}` 무한 boxShadow 보라/파랑 펄스
- `whileHover={{ scale: 1.05, rotate: 8 }}` 펜 아이콘 기우는 느낌
- `bg-primary` → `bg-gradient-violet` 그라데이션 배경
- `transition={springTap}` 으로 통일

### sort-toggle.tsx + my-tabs.tsx
- `motion.span layoutId="sort-indicator"` / `"my-tab-indicator"` 슬라이딩 배경 인디케이터
- 버튼에 `relative z-0` + 텍스트에 `relative z-10` (인디케이터 위에 표시)
- 기존 `bg-background shadow-sm` className 제거 → motion.span으로 이전
- `transition={shouldReduce ? {duration: 0} : tabIndicator}`

## Phase 4 컴포넌트 마이크로 인터랙션 (2026-05-04)

### hot-feed-carousel.tsx
- 카드: `motion.div whileHover={{ y:-4, scale:1.01 }} whileTap={{ scale:0.98 }} transition={springTap}`
- 빈 상태: `motion.div variants={fadeInUp}` + `shadow-glow-violet` CSS utility
- 점 인디케이터: `motion.span animate={{ scale: isActive ? 1.4 : 1 }}` + `bg-primary` (active)

### category-icon-row.tsx
- 컨테이너: `motion.div variants={staggerFast}` + 자식 `motion.button variants={fadeInUp}`
- 탭: `motion.button whileTap={{ scale:0.92 }} transition={springTap}`
- active 원형 아이콘: `motion.div animate={{ scale: isActive ? 1.05 : 1 }}` + `ring-glow-violet` + `bg-primary/15`

### explore-search-bar.tsx
- 컨테이너 div: `focus-within:ring-glow-violet` (CSS, Tailwind utility)
- X 버튼: `motion.button` + `AnimatePresence` fade (initial opacity:0 scale:0.7 → animate opacity:1 scale:1)
- X 탭: `whileTap={{ scale:0.85 }}`

### write-bottom-sheet.tsx
- 카테고리 칩: `motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} transition={springTap}`
- active 칩: `ring-glow-violet` 보라 글로우 링

### report-sheet.tsx
- 신고 사유 Label → `motion.label whileTap={{ scale:0.99 }}` + isSelected 시 `ring-glow-violet bg-primary/8`
- 제출 버튼: `motion.div whileTap={{ scale:0.96 }} transition={springTap}` 래퍼로 destructive Button 감쌈

### comment-list.tsx
- `CommentList` 컨테이너: `motion.div variants={staggerFast}` 최상위
- 각 최상위 댓글 그룹: `motion.div variants={fadeInUp}` (stagger 상속)
- `CommentItem`: `motion.div variants={fadeInUp}` + 본인 댓글 `ring-1 ring-primary/30`
- 返信 버튼 hover: `hover:text-primary` (보라 색상)

## Cinema Stamp 인트로 시퀀스 (2026-05-06)

### 핵심 구현 패턴

#### Variable Font weight 애니메이션 패턴 (중요)
`fontVariationSettings`는 CSS 문자열 속성이라 `controls.start()` 또는 `animate()` 에 직접 넣으면 보간 안 됨.
패턴: `useMotionValue(100)` + `wght.on('change', v => el.style.fontVariationSettings = ...)`
`animate(wght, 700, { ... })` — `animate()`의 첫 번째 인자가 MotionValue 일 때는 직접 사용 가능

#### AnimationControls vs animate() 타입 구분 (중요)
- `useAnimationControls()` 반환값 → 반드시 `controls.start({ ... transition })` 방식
- `animate(controls, { ... })` 형태는 TypeScript 오류 발생 (`LegacyAnimationControls` 타입 불일치)
- `animate(motionValue, target, options)` — MotionValue에는 직접 사용 OK

#### horizon-line scaleX 방식
`width: 0→100vw` 는 controls.start 에서 불가 → `scaleX: 0→1` + `w-screen origin-left` 로 대체

#### keyframes 배열 (글리치 펄스)
`controls.start({ opacity: [0, 0.6, 0], x: [0, 2, 0], transition: { ... } })` — keyframes 배열 지원됨

### sessionStorage + reduced 이중 가드 패턴
```tsx
function shouldSkipIntro(): boolean {
  if (reduced) return true
  try { return sessionStorage.getItem('keio_intro_seen') === '1' } catch { return false }
}
```
스킵 시 `controls.set()` 으로 모든 레이어를 즉시 final state로 세팅.

### isSkip 분기로 본 랜딩 delay 재계산
```tsx
const isSkip = reduced || (typeof window !== 'undefined' && sessionStorage.getItem('keio_intro_seen') === '1')
const underlineDelay = isSkip ? 0.2 : 1.85
const subcopyDelay   = isSkip ? 0.35 : 2.0
const ctaDelay       = isSkip ? 0.5  : 2.3
```

### wait() 헬퍼 + async 시퀀스 패턴
```tsx
function wait(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }
// useEffect 내 async runIntro() 에서 await wait(ms) 로 타임라인 동기화
// cancelled 플래그로 unmount 안전 처리
```

## Phase 5 알림 시스템 마이크로 인터랙션 (2026-05-06)

### notification-bell.tsx
- `useAnimationControls()` + `useEffect(shake)` → `controls.start({ rotate: [0,-10,10,-8,8,-4,4,0] })`
- `motion.span` 으로 `<Bell />` 래핑, `style={{ transformOrigin: 'top center' }}`
- shake duration: 0.6s, ease: 'easeInOut'

### notification-bell-container.tsx
- `useRef(unreadCount)` + `useState(shake)` 패턴으로 증가 감지
- unreadCount 증가 시 `setShake(true)` → setTimeout 700ms 후 `setShake(false)`

### notification-item.tsx
- 미읽음 점: `motion.span animate={{ scale:[1,1.25,1], opacity:[1,0.7,1] }}` duration:1.8s, repeat:Infinity
- 클릭 피드백: `motion.div whileTap={{ scale:0.98 }}` transition duration:0.12s

### notification-panel.tsx
- stagger: `motion.div` wrapper per item, `initial:{opacity:0,y:-4}` → `animate:{opacity:1,y:0}`
- delay: `index < 8 ? index * 0.04 : 0` (8개 이후는 즉시)
- 빈 상태 🌸: `motion.span animate={{ y:[0,-3,0] }}` duration:3s, repeat:Infinity
- SkeletonRow: `animationDelay: ${index * 100}ms` CSS prop 추가

## View Transitions API 패턴 (Pro Phase 1 Day 2, 2026-05-13)

### 설정

`next.config.ts`:
```ts
experimental: { viewTransition: true }
```

TypeScript 타입 해제 (React 19.2.4에 없고 canary에만 있음):
```ts
/// <reference types="react/canary" />
```
각 파일 최상단에 추가 (Server + Client 컴포넌트 모두).

### PostCard → 상세 페이지 shared element morph

- **PostCard** (`'use client'`): `import { ViewTransition } from 'react'`
  - 제목+본문 미리보기 영역을 `<ViewTransition name={`post-content-${post.id}`} share="post-morph" default="none">` 으로 래핑
  - `navigateToDetail()`: `router.push(url, { transitionTypes: ['nav-forward'] })` — morph 트리거
- **상세 페이지** (Server Component): 동일하게 `import { ViewTransition } from 'react'`
  - 제목+본문 영역을 동일한 `name={`post-content-${id}`}` 으로 래핑 → 자동 morph 연결

### CSS (globals.css)

```css
::view-transition-group(.post-morph) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
::view-transition-image-pair(.post-morph) {
  animation-name: post-morph-via-blur;
}
@keyframes post-morph-via-blur { 30% { filter: blur(2px); } }

/* prefers-reduced-motion 가드 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

### 핵심 주의사항
- `'use client'` 파일에서도 `ViewTransition` import 가능 (Server Component 전용 아님)
- `default="none"` 필수: 없으면 모든 transition 에서 이 요소가 독립 애니메이션 실행
- `share="post-morph"` 는 CSS 클래스명으로 `::view-transition-image-pair(.post-morph)` 에 대응
- 미지원 브라우저 (Firefox, 구 Safari): graceful degradation — 일반 라우팅, 에러 없음
- Next.js 16 runtime: `compiled/react` (canary 19.3.0) 를 사용 → ViewTransition 실제 동작
- TypeScript: 설치된 `react@19.2.4` 에는 타입 없음 → `react/canary` 레퍼런스 필요

## MyTabContent stagger entrance (Pro Phase 1 Day 2, 2026-05-13)

### `components/community/my-tab-content.tsx` (신규)
- **핵심 원리**: `key={tab}` → 탭 변경 시 Client Component unmount → remount → stagger 재실행
  - 컨테이너에 `key={tab}` 대신 컴포넌트 자체가 `tab` prop을 key로 받아 부모(page.tsx)가 `<MyTabContent tab={...}>` 로 렌더 → 탭이 바뀌면 `{tab === 'posts' && <MyTabContent tab="posts" ...>}` 조건 분기로 자연스럽게 remount
- `tabContainer`: `staggerChildren: 0.05` (50ms, PostFeed feedContainer 와 동일)
- `listItem`: `lib/motion-variants.ts` 에서 import — opacity+y:12, 0.4s expo-out
- Empty State: `initial={{ opacity:0, y:8 }}` → `animate={{ opacity:1, y:0 }}`, `key="empty-{tab}"` 별도 처리
- 이모지 idle loop: `animate={{ y:[0,-4,0] }}` duration:2.5s repeat:Infinity easeInOut
- `useReducedMotion() ?? false`: true 시 variants/initial/animate 모두 undefined

### page.tsx 통합 패턴
- Server Component → Client Component 에 JSX 전달: `children` prop 으로 카드 배열 전달
  - `{posts.map(p => <MyPostCard key={p.id} post={p} />)}` 를 children으로 전달 — 직렬화 없이 JSX tree로 전달됨 (React 정상 패턴)
- `<section className="px-4 py-4">` 에서 `space-y-3` 제거 (MyTabContent 내부가 `space-y-3` 담당)
- 탭별 조건 분기: `{tab === 'posts' && <MyTabContent ...>}` — 조건이 false면 null → 이전 탭 MyTabContent unmount

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
