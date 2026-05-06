---
name: 프로덕션 배포 컨텍스트
description: keio-project의 Vercel 프로덕션 배포 시작 시점의 프로젝트 상태와 배포 계획
type: project
---

keio-project는 Next.js 16.2.4 + Supabase + Tailwind v4 + shadcn/ui(radix-nova) 기반의 일본 사용자 대상 웹앱.

**배포 방향**: "배포 후 차근차근 수정" 전략 채택 (완벽주의보다 빠른 배포 우선). 사용자가 동의.

**타겟 플랫폼**: Vercel (Next.js 공식 권장 플랫폼)

**환경변수 (.env.local 키 목록)**:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ALLOWED_DEV_ORIGIN (개발용 LAN IP — 프로덕션 Vercel에는 등록 불필요)

**배포 전 주의사항**:
- supabase/migrations/ 에 미적용 가능성 있는 마이그레이션 2개 존재:
  - 20260508000000_admin_resolve_report.sql
  - 20260509000000_profiles_agreed_at.sql
- next.config.ts에 unsplash 이미지 도메인 허용 설정 있음 (Vercel에서도 그대로 동작)
- proxy.ts 가 middleware.ts 역할 수행 (Next.js 16 신규 컨벤션)

**배포 진행 단계 (순서)**:
1. npm run build 빌드 테스트 ← 현재 단계
2. Supabase 프로덕션 마이그레이션 확인
3. Git 커밋 & GitHub 저장소 연결
4. Vercel 가입 & 프로젝트 import
5. 환경변수 등록 (NEXT_PUBLIC_ 설명 포함)
6. Supabase URL Configuration 업데이트
7. 배포 후 검증
8. (선택) 커스텀 도메인

**Why:** 코딩 초보자 대상이므로 한 단계씩 결과 확인 후 진행.
**How to apply:** 각 단계 완료 후 사용자 응답 대기, 에러 발생 시 즉시 트러블슈팅.
