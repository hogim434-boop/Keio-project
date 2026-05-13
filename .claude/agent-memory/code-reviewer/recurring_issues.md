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

## 2026-05-09 7차 리뷰 (마이페이지·신고·알림·어드민 영역 C)

### 잘 구현된 부분:
1. proxy.ts + AdminLayout 이중 어드민 게이트 — defense-in-depth 올바른 패턴
2. 신고 UNIQUE 23505 → 409 매핑이 api-helpers.ts와 정확히 연동
3. useNotifications 낙관적 업데이트 + 함수형 업데이터 롤백 패턴

### 발견된 이슈:
1. **my-client.tsx 데드 코드**: 현재 page.tsx에서 사용되지 않음. 한국어 텍스트("프로필 설정") 포함.
2. **_components/logout-button.tsx stub**: alert('Task 006에서 구현') — 삭제됐어야 할 개발용 stub.
3. **profile/page.tsx: user_metadata 의존**: 폼 초기값을 user_metadata에서 로드 — profiles DB와 불일치 가능성 (4차 리뷰 반복 이슈).
4. **report-sheet.tsx onSubmit: try-catch 없음**: 전체 fetch가 try-catch 없음 — 네트워크 에러 시 unhandled rejection.
5. **admin/page.tsx: count 집계가 현재 페이지 50건 기준**: 51번째 동일 대상 신고는 count에 미포함.
6. **admin/page.tsx: postsRes.error / commentsRes.error 미처리**: DB 에러 시 빈 preview 표시.
7. **useNotifications: refresh()와 refreshUnreadCount() 경쟁 조건**: 패널 열기 + window focus 동시 발생 시 unreadCount 일시적 불일치 가능.
8. **my-comment-card.tsx: 삭제된 게시글로 이동하는 링크**: post_title null일 때도 링크 활성화.
9. **fetchMyBookmarks: is_deleted 필터 없음**: bookmarks 쿼리에 posts의 is_deleted 필터 미적용 (fetchMyPosts는 적용됨).

## 2026-05-09 6차 리뷰 (게시판 핵심 영역 B — posts/comments/reactions/bookmarks)

### 현재 상태 (이번 영역에서 잘 구현된 부분):
- Next.js 16 params Promise / searchParams Promise 올바르게 처리됨
- withAuth + pgErrorToResponse + ok/err 일관 사용
- ILIKE 검색어 % _ escape + cursor base64url 인코딩
- IntersectionObserver AbortController race 방지
- 낙관적 업데이트 6케이스 카운터 보정 (post-detail-actions)
- CommentForm 4차 리뷰 지적 try-catch 수정 확인

### 새로 발견된 이슈 (영역 B):
1. **post-card.tsx: 롤백 시 post.reaction_up/down 원본값 사용**: 롤백 시 setReactionUp(post.reaction_up)이 클로저 캡처 초기값으로 복원 — 이 컴포넌트 수명 중 다른 반응이 있었다면 잘못된 값으로 롤백됨.
2. **post-feed.tsx: fetchMore useEffect 내 클로저 stale**: [hasMore, cursor] 의존성이지만 fetchMore 내에서 cursor/isLoading/hasMore를 직접 읽음 — cursor 상태가 오래된 값을 참조할 수 있음.
3. **lib/community/posts.ts: cursor 내용 검증 없음**: decodeCursor 후 created_at/id 필드를 바로 SQL 파라미터로 삽입. PostgREST .or() 의 파라미터는 PostgREST 필터 문자열에 직접 보간되므로 cursor 조작 시 쿼리 변형 가능성.
4. **toggleReaction/toggleBookmark: withAuth 이후 내부 getUser() 재호출**: 4차 리뷰 지적 사항 여전히 미수정.
5. **hot-feed.ts: HOT_WINDOW_DAYS=7인데 주석은 24h TOP3**: 코드(7일)와 JSDoc 주석(24h)이 불일치.
6. **post-detail.ts: buildCommentTree — parent_id 있지만 byId에 없는 경우 루트로 승격**: 삭제된 댓글의 자식이 루트로 올라오는 UX 혼란 가능성.
7. **write-bottom-sheet.tsx: Textarea ref 병합 방식 중복 register 호출**: register('body')를 두 번 호출(line 463, 468)하여 이벤트 핸들러가 두 번 등록될 수 있음.
8. **comment-form.tsx: onSubmit에 try-catch 추가됨**: 4차 리뷰 지적 사항 수정 확인.
9. **post-actions-sheet.tsx handleMenu: preview props가 없을 때 undefined 전달**: PostDetailActions에서 openActions({ id, isOwner }) 호출 시 preview 미전달 — 시트 타이틀 표시 없음(기능상 무해하나 UX 미완).
10. **explore/page.tsx: 인기 모드 limit=10 무한 스크롤**: nextCursor가 있으면 무한 스크롤로 추가 로드 가능. 인기 모드 의도가 TOP10이라면 PostFeed에 maxPage 제한 필요.

## 2026-05-09 5차 리뷰 (인증·인프라·공통 영역 A)

### 현재 상태 (개선된 사항):
- lang="ja" 수정됨 (app/layout.tsx)
- admin 라우트 보호 proxy.ts에 추가됨 (DB role 검증)
- password_set 우회 이슈: proxy.ts에서 user_metadata 기반 needsSetup 가드 여전히 사용 중 → 4차 리뷰 Blocker 미수정

### 새로 발견된 이슈:
1. **proxy.ts: admin 검사 매 요청마다 DB 쿼리**: /admin/* 접근 시 매 요청마다 profiles 테이블 SELECT → Proxy는 모든 요청에 실행되므로 성능 부담. JWT claims 기반 낙관적 체크 후 페이지 내에서 재검증 패턴이 적합.
2. **setup/page.tsx: onSubmit 성공 후 signOut 후 router.replace('/login')**: signOut이 비동기인데 await 후 라우팅은 올바름. 단, signOut 실패 시에도 /login으로 리다이렉트되어 세션이 살아있는 상태로 login 페이지로 가는 엣지 케이스 존재.
3. **signup/page.tsx: useEffect에서 window.location.search 사용**: searchParams hook 미사용. Next.js App Router에서는 useSearchParams()가 권장 패턴.
4. **metadata description 여전히 한국어**: app/layout.tsx 26라인 "게이오 재학생을 위한 익명 강의 리뷰 플랫폼" → 일본어 서비스 불일치 (4차 리뷰 지적 사항 미수정).
5. **privacy/page.tsx: 개인정보보호법 제11조 연락처 미기재**: "（連絡先: 運営者により後日公表）" — 서비스 공개 전 반드시 기재 필요.
6. **KEIO_EMAIL_DOMAINS: endsWith 패턴 우회 가능성**: 'xxx@notkeio.jp'도 '@keio.jp'로 끝나면 통과. .split('@')[1] === 도메인 비교 방식이 더 안전.
7. **lib/locale/date.ts: Intl 인스턴스 재사용 없음**: toLocaleDateString 호출마다 내부적으로 Intl 인스턴스 재생성. Intl.DateTimeFormat 캐싱이 성능에 유리.
8. **hero-section.tsx: 일본어 서비스인데 한국어 텍스트**: "게이오대학교 전용 플랫폼", "익명 강의 리뷰 플랫폼" — 일본어로 교체 필요.
9. **auth/callback/route.ts: state 파라미터 미검증**: OAuth CSRF 방어를 위한 state 파라미터를 서버에서 직접 검증하지 않음 (Supabase PKCE가 처리하나, 명시적 검증 없음).
10. **types/domain.ts: CAMPUS_VALUES 한국어 키 (미타, 히요시 등)**: DB CHECK 제약과 UI 라벨이 한국어로 혼재 — labels.ts에서 한→일 매핑을 하지만 DB 저장값 자체가 한국어라 외부 API 노출 시 혼란.
