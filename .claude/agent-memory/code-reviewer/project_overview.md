---
name: Project Overview
description: keio-project의 기술 스택, 아키텍처 패턴, 주요 파일 구조
type: project
---

Next.js 16.2.4 (App Router) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui (radix-nova) + Supabase + framer-motion 12.

**Why:** 게이오 대학 재학생 전용 익명 강의 리뷰 플랫폼.

**How to apply:** 코드 작성 시 항상 proxy.ts(middleware.ts 아님), @supabase/ssr 패턴, Tailwind v4 CSS-in-CSS 방식 준수할 것.

주요 패턴:
- middleware.ts 대신 proxy.ts 사용 (Next.js 16 변경사항)
- Client Component: @/lib/supabase/client, Server Component: @/lib/supabase/server
- CSS: app/globals.css에서 @theme inline으로 CSS 변수 정의
- 오브 배경 애니메이션: globals.css의 @keyframes orb-drift-1/2
- 회원가입 2단계 플로우: step 1(이메일) → step 2(캠퍼스/학년/학부/비밀번호)
- framer-motion useReducedMotion()으로 OS 모션 설정 존중
