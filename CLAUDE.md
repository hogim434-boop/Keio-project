@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 주요 명령어

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 실행
```

shadcn 컴포넌트 추가:
```bash
npx shadcn add <component-name>
```

## 기술 스택

| 항목 | 버전/상세 |
|------|----------|
| Next.js | **16.2.4** (App Router, React 19 기반) |
| React | 19.2.4 |
| TypeScript | ^5 (strict 모드) |
| Tailwind CSS | v4 (`@tailwindcss/postcss` 사용, `tailwind.config` 파일 없음) |
| shadcn/ui | style: `radix-nova`, 아이콘: `lucide-react` |
| Supabase | `@supabase/supabase-js` + `@supabase/ssr` |

## 아키텍처

### App Router 구조

- `app/` — Next.js App Router 라우트 및 레이아웃
- `components/ui/` — shadcn/ui 컴포넌트 (자동 생성, 직접 수정 가능)
- `lib/utils.ts` — `cn()` 유틸리티 함수 (clsx + tailwind-merge)
- `lib/supabase/client.ts` — 브라우저(Client Component)용 Supabase 클라이언트
- `lib/supabase/server.ts` — 서버(Server Component / Route Handler)용 Supabase 클라이언트
- `proxy.ts` — 세션 자동 갱신 (Next.js 16의 `middleware.ts` 대체)

### Supabase 클라이언트 사용 규칙

| 컨텍스트 | import 경로 |
|---------|------------|
| Client Component (`'use client'`) | `@/lib/supabase/client` |
| Server Component / Route Handler | `@/lib/supabase/server` |

`proxy.ts`에서 `supabase.auth.getUser()` 호출을 제거하면 세션 갱신이 중단되므로 수정 금지.

### 경로 별칭

`tsconfig.json`에서 `@/*`가 프로젝트 루트로 매핑됨:

```
@/components  →  components/
@/components/ui  →  components/ui/
@/lib  →  lib/
@/hooks  →  hooks/
```

### CSS 설정

Tailwind v4는 `app/globals.css`에서 직접 설정. `tailwind.config.ts` 파일이 없으며, CSS 변수 기반 테마를 사용함.

### 파일 컨벤션 변경 사항 (Next.js 16)

Next.js 16은 여러 파일 컨벤션이 변경되었음. `middleware.ts` → `proxy.ts` (함수명도 `middleware` → `proxy`).
새 코드 작성 전 반드시 `node_modules/next/dist/docs/` 내 관련 가이드를 확인할 것.

## 주의사항

- **Tailwind v4 문법은 v3와 다름** — `@apply`, 설정 방식 등이 변경됨
- shadcn 컴포넌트는 `components.json`의 `aliases` 설정을 따름
- 환경변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 `.env.local`에 설정
