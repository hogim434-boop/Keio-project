---
name: Recurring Issues
description: 코드 리뷰에서 반복적으로 발견되는 패턴 문제
type: project
---

## 2026-05-02 1차 리뷰 (초기 login/signup 페이지)

1. **폼 유효성 검사 없음**: login/signup 페이지에 실제 Supabase 호출 없음.
2. **variants 삼항연산자 반복**: shouldReduce ? {} : variants 패턴이 모든 motion 요소에 반복됨.
3. **lang="en" 문제**: app/layout.tsx의 html lang이 "en"인데 한국어/일본어 콘텐츠 포함. → 4차 리뷰 시 lang="ja"로 수정 확인.
4. **비밀번호 확인 검증 없음**: signup page.tsx에서 password !== confirmPassword 체크 없음.
5. **goNext에 검증 없음**: 이메일 입력 없이도 step 2로 넘어갈 수 있음.
6. **Select에 htmlFor 없음**: 캠퍼스/학년 Select 컴포넌트에 Label의 htmlFor 연결 미구현.
7. **서버 컴포넌트 활용 부족**: react-hook-form, zod가 의존성에 있지만 미사용.

## 2026-05-02 2차 리뷰 (2단계 회원가입 + OAuth 콜백 + proxy + SQL)

개선된 사항:
- 2단계 회원가입 플로우 구현 (signup → setup)
- 비밀번호 확인 검증 추가 (setup/page.tsx 104-108라인)
- OAuth 콜백 도메인 검증 로직 구현 (auth/callback/route.ts)
- proxy.ts에서 needsSetup 라우트 가드 구현

여전히 남아있거나 새로 발견된 문제:
1. **handleGoogleSignIn 에러 처리 없음**: signInWithOAuth 오류 시 setLoading(false) 미호출 (login, signup 양쪽)
2. **variants 삼항연산자 반복 지속**: shouldReduce ? {} : 패턴이 login/signup/setup 전체에 걸쳐 반복
3. **Select에 htmlFor 연결 미구현**: setup/page.tsx 캠퍼스·학년 Label에 htmlFor 없음 (215, 230라인)
4. **grade/department 미입력 시 통과**: setup 제출 시 campus만 검증, grade·department 미필수
5. **password_set을 user_metadata로 관리**: server-side에서만 수정 가능하도록 해야 함
6. **callback route: origin을 request.url에서만 추출**: open redirect 우려 가능성
7. **proxy.ts: protectedPaths가 /my만 포함**: /courses, /community 등 실제 보호 경로 누락
8. **SQL: user_list 뷰에 RLS 없음**: 관리자 뷰지만 일반 사용자도 직접 쿼리 접근 가능
9. **setup/page.tsx: form 태그에 initial/animate 중복**: motion.form에 variants + initial/animate 동시 설정

## 2026-05-06 3차 리뷰 (알림 시스템 + 카테고리 재편)

발견된 문제 패턴:
1. **pgErrorToResponse의 DB 상세 정보 프로덕션 노출**: `extra = { dbCode, details, hint }` 를 env 분기 없이 응답에 포함 — 프로덕션에서 DB 내부 정보가 클라이언트에 노출됨 → 4차 리뷰에서 `process.env.NODE_ENV !== 'production'` 분기 추가로 수정 확인.
2. **as unknown as 타입 캐스팅**: `lib/notifications/server.ts`에서 Supabase 응답을 `as unknown as RawNotificationRow[]`로 강제 변환 — 런타임 타입 안전성 없음
3. **useCallback 의존성 비효율**: `markRead`/`markAllRead`가 `[items, unreadCount]`를 의존성으로 갖아 매 렌더 재생성 → 4차 리뷰에서 함수형 업데이터 패턴으로 수정 확인.
4. **TODO 미완성**: `notification-panel.tsx` 에러 상태에 "再試行" 텍스트만 있고 실제 onRetry prop 미구현 → 4차 리뷰에서 onRetry prop 추가 및 조건부 버튼 표시 구현 확인.
5. **allowedDevOrigins IP 하드코딩**: `next.config.ts`에 `'192.168.128.131'` 하드코딩 → 4차 리뷰에서 환경변수 `ALLOWED_DEV_ORIGIN`으로 교체 확인.
6. **Dead code**: `scroll-area.tsx`가 프로젝트 어디에서도 실제 사용되지 않음 (알림 패널 리팩터링 흔적) → 미확인(4차 리뷰 범위 아님)
7. **주석-코드 불일치**: `notification-panel.tsx` JSDoc 주석이 이전 구현(ScrollArea, stagger) 내용을 여전히 기술 중 → 4차 리뷰 시 주석 업데이트 확인.
8. **profiles 전체 공개 RLS**: `profiles_select_authenticated` 정책이 `USING (true)` — email·campus·department 등 민감 필드도 인증 사용자 전체에게 노출 → 4차 리뷰에서 profiles_public VIEW 분리로 수정 확인.
9. **notification-item의 formatDistanceToNowStrict 렌더 호출**: useMemo 없이 매 렌더마다 날짜 파싱 → 4차 리뷰에서 useMemo 적용 확인.

## 2026-05-06 4차 종합 리뷰 (프로젝트 전체)

### 주요 발견 이슈:
1. **user_list 뷰 접근 제어 없음**: `public.user_list` 뷰에 RLS 없음 + GRANT 없음이 예상이나, 실제 뷰는 auth.users를 조인하므로 일반 authenticated 사용자가 직접 SELECT 시 auth schema 접근 권한 부족으로 자연 차단될 수 있음. 그러나 명시적 RLS 부재는 위험 신호.
2. **notifications 뷰에 UPDATE 정책 과도한 범위**: `notif_update_own` 정책이 `recipient_id = auth.uid()` 조건만 있어 is_read 외 필드(type, actor_id 등)도 업데이트 가능. WITH CHECK가 recipient_id만 확인.
3. **proxy.ts에서 password_set 우회 가능**: `user_metadata.password_set`은 클라이언트 측 `supabase.auth.updateUser({ data: { password_set: true } })`로 임의 설정 가능 — needsSetup 게이트 우회 위험.
4. **as unknown as 캐스팅 잔존**: `lib/community/post-detail.ts` 69라인, `lib/community/posts.ts` 107라인, `lib/community/my.ts` 47·103라인 등 여러 곳에서 `as unknown as` 사용.
5. **profile/page.tsx에서 user_metadata 신뢰**: `user.user_metadata?.campus` 등을 폼 초기값으로 사용 — profiles 테이블 대신 user_metadata에서 읽어 DB와 불일치 가능성.
6. **admin 라우트 보호 없음**: `app/(admin)/` 경로가 proxy.ts에서 보호되지 않음 — 일반 사용자가 /admin URL 직접 접근 가능(페이지는 비어있으나 구조적 위험).
7. **fetchPosts에서 ilike + 특수문자 처리 불완전**: `replace(/[%_]/g, '')` 로 % _ 제거하지만 Supabase .or() PostgREST 쿼리에서 SQL injection-like 우려 (trgm 검색이 아닌 ILIKE 경로).
8. **toggleReaction/toggleBookmark 내부에서 getUser() 재호출**: withAuth가 이미 인증을 확인했는데 내부 함수에서 다시 getUser() 호출 — 불필요한 중복 인증 요청.
9. **CommentForm: fetch 실패 시 try-catch 없음**: onSubmit에 try-catch 없이 await fetch — 네트워크 에러 시 unhandled rejection.
10. **Metadata description이 한국어**: `app/layout.tsx` 24라인에 description이 "게이오 재학생을 위한 익명 강의 리뷰 플랫폼" — 일본어 서비스인데 한국어.
11. **admin 배지가 한국어**: `app/(admin)/layout.tsx` 13라인 "관리자" 텍스트 — 일본어 서비스 불일치.
12. **domain.ts의 한국어 enum 값**: CAMPUS_VALUES('미타', '히요시'), REQUIREMENT_TYPE_VALUES('필수','선택'), ENROLLMENT_SIZE_VALUES('소','중') 등이 한국어. DB와 불일치 위험.
