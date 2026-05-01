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

## 아키텍처

### App Router 구조

- `app/` — Next.js App Router 라우트 및 레이아웃
- `components/ui/` — shadcn/ui 컴포넌트 (자동 생성, 직접 수정 가능)
- `lib/utils.ts` — `cn()` 유틸리티 함수 (clsx + tailwind-merge)

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

## 주의사항

- **Next.js 16은 훈련 데이터와 다를 수 있음** — 코드 작성 전 `node_modules/next/dist/docs/` 내 관련 가이드 확인 필수 (AGENTS.md 참조)
- Tailwind v4 문법은 v3와 다름 — `@apply`, 설정 방식 등이 변경됨
- shadcn 컴포넌트는 `components.json`의 `aliases` 설정을 따름
