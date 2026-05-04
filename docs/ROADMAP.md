# Jukulog (塾ログ) 개발 로드맵 — 자유 게시판 버전

> **피벗 노트**: 강의 리뷰(5축 평점) → keio.jp 클로즈드 자유 게시판 (DCInside 스타일 갤러리/게시판) 으로 전환. 본 로드맵은 PRD v2(자유 게시판) 기준으로 재작성되었으며, Phase 1~2 (인프라·인증) 는 그대로 재활용하고 Phase 3 부터 강의 도메인을 폐기 후 게시판 도메인을 신규 구축합니다.

## 개요

Jukulog 은 게이오 대학 재학생만 입장 가능한 클로즈드 익명 자유 게시판입니다. 핵심 가치:

- **클로즈드 신뢰 공간**: keio.jp / g.keio.ac.jp / sfc.keio.ac.jp 도메인만 가입 허용 → 외부인 차단 (F001)
- **갤러리/카테고리 분류**: 자유·연애·학업·취업·일상·질문 + 미타·히요시·SFC 갤러리 (F002, F015)
- **익명 + 책임성**: 화면에는 익명 표시, DB 에는 user_id 저장 → 신고 추적 가능 (F008)
- **모바일 1탭 UX**: 중앙 FAB → Bottom Sheet 80vh 글쓰기 (F016, F017), 카드 인라인 추천·북마크 (F018)
- **핫 피드 캐러셀**: 24시간 추천 TOP 3 가로 스와이프로 콜드 스타트 보완 (F014)

---

## 개발 워크플로우

1. **작업 계획**

   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

   - `/tasks` 디렉토리에 새 작업 파일 생성 — 명명 형식: `XXX-description.md`
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계, **테스트 체크리스트** 포함
   - API/DB 작업 시 Playwright MCP 또는 Supabase MCP 시나리오 필수

3. **작업 구현**

   - 작업 파일의 명세를 따라 구현
   - 각 단계 완료 시 작업 파일 체크박스 업데이트
   - **검증 도구**: Playwright MCP (E2E) / Supabase MCP (DB) / `npm run build` · `npm run lint` (회귀)
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

   - 완료된 Task 는 ✅ 로 표시하고 작업 파일 경로(`See: /tasks/XXX-xxx.md`) 를 추가

---

## Phase 개요

| Phase | 주제 | 상태 | 핵심 산출물 |
|-------|------|------|------------|
| Phase 1 | 인프라 및 라우트 골격 | ✅ 완료 | Next.js 16 / Supabase / 라우트 그룹 / proxy 가드 |
| Phase 2 | 인증·회원가입·setup | ✅ 완료 (1건 잔여) | keio.jp 도메인 검증 / 이메일 인증 / 닉네임·캠퍼스 setup |
| Phase 3 | 강의 도메인 폐기 + 게시판 데이터 모델 | 진행 예정 | DROP 마이그레이션 / 7개 신규 테이블 / categories 시드 |
| Phase 3.5 | UI 시안 검토 (ASCII wireframe) | 진행 예정 | 페이지별 ASCII 와이어프레임 + 사용자 OK 사인 |
| Phase 4 | 게시판 핵심 기능 (F002~F009, F014~F018) | 진행 예정 | FAB+Bottom Sheet 작성 / 핫 피드 / 갤러리 행 / 카드 인라인 반응 / 댓글·신고·북마크 |
| Phase 5 | 어드민·통합테스트·콜드스타트 | 진행 예정 | 신고 큐 어드민 / E2E 통합 / 시드 게시글 |
| Phase 6 | 출시 준비 | 진행 예정 | Vercel 배포 / 가이드라인 페이지 / 운영 SOP / KPI 측정 |
| Phase 7+ | MVP 이후 | 백로그 | 이미지 첨부 / 욕설 필터 / 알림 / 강의 리뷰 부활 검토 등 |

---

## Phase 1: 인프라 및 라우트 골격 ✅

- **Task 001: 프로젝트 셋업 및 Supabase 연동** ✅ - 완료
  - See: `/tasks/001-project-setup.md`
  - ✅ Next.js 16.2.4 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui (radix-nova)
  - ✅ `lib/supabase/client.ts` (브라우저) / `lib/supabase/server.ts` (서버) 분리
  - ✅ `proxy.ts` 세션 자동 갱신 (Next.js 16 의 `middleware.ts` 대체)
  - ✅ `lib/utils.ts` `cn()` 헬퍼

- **Task 002: 라우트 골격 및 공통 레이아웃** ✅ - 완료
  - ✅ App Router 라우트 그룹: `(public)` / `(app)` / `(admin)` 분리
  - ✅ `(app)/layout.tsx` — 하단 탭 네비게이션 컨테이너
  - ✅ `(public)/layout.tsx` — 비로그인 헤더 (로그인/회원가입)
  - ✅ `proxy.ts` 보호 라우트 가드 (`(app)`, `(admin)` → 미인증 시 `/login` 리다이렉트)
  - ✅ 모바일 글로벌 스타일: 최대 너비 768px 중앙 정렬, `pb-safe`, 좌우 16px

---

## Phase 2: 인증·회원가입·프로필 setup ✅ (1건 잔여)

- **Task 003: 타입·DB 기반 정의 (profiles)** ✅ - 완료
  - ✅ `types/auth.ts` — `KEIO_EMAIL_DOMAINS` 단일 출처, `KeioEmailSchema` / `PasswordSchema` / `NicknameSchema` / `LoginFormSchema` / `SetupFormSchema`
  - ✅ `types/domain.ts` — `CAMPUS_VALUES` (한국어 6캠퍼스: 미타/히요시/SFC/야가미/시나노마치/시바공립), `CampusSchema`, `GRADES`, `UserRole`
  - ✅ profiles 테이블 마이그레이션 (`20260502000000`, `20260503000000_extend_profiles.sql`)
  - ✅ `profiles.email` DB CHECK (`profiles_email_keio_check`) — keio.jp 도메인 정규식

- **Task 004: 회원가입 / 이메일 인증 / 로그인 플로우** ✅ - 완료
  - ✅ Supabase Auth `signUp` / `signInWithPassword` / `signOut` 연동
  - ✅ 이메일 인증 콜백 `app/auth/callback/route.ts` — 도메인 재검증 후 `/signup/setup` 또는 `/` 분기
  - ✅ profiles 자동 생성: DB 트리거 `handle_new_user` + `handle_user_metadata_update`
  - ✅ login / signup 페이지 RHF + zodResolver 리팩토링 + 인라인 에러
  - ✅ 회원가입 완료 후 세션 종료 → 로그인 페이지로 이동
  - ✅ Playwright MCP E2E: 도메인 차단 / 보호 라우트 가드 / setup 가드 모두 통과

- **Task 005: 닉네임·캠퍼스·학부 setup 페이지** ✅ - 완료
  - ✅ `/signup/setup` — RHF + zodResolver, CAMPUSES 한국어 enum 통일
  - ✅ profiles upsert (nickname, campus, department)
  - ✅ 마이페이지 Server/Client 분리 + Supabase 실 사용자 닉네임 표시

- **Task 006: 회원가입 페이지 가이드라인 동의 체크박스 (F013)** - 우선순위
  - 회원가입 폼에 "커뮤니티 가이드라인에 동의합니다" 체크박스 (필수) 추가
  - `SignupFormSchema` 에 `agreedToGuidelines: z.literal(true)` 필드 추가
  - 미체크 시 가입 버튼 disabled, Zod 에러 메시지 표시
  - 가이드라인 본문 링크 (Phase 6 의 `/guidelines` 페이지로 연결, 임시 placeholder OK)
  - **검증**: Playwright MCP — 미체크 시 가입 차단 / 체크 후 정상 가입 / 인라인 에러 메시지 표시

---

## Phase 3: 강의 도메인 폐기 + 게시판 데이터 모델 신규 구축

> **순서 원칙**: Phase 3 의 Task 들은 **의존성 사슬**(Task 007 → 008 → 009 → 010 → 011) 로 연결됩니다. 강의 도메인 정리(007) 후에야 신규 마이그레이션(008, 009) 이 안전합니다.

- **Task 007: 강의 도메인 자산 폐기 및 DROP 마이그레이션** ✅ - 완료
  - ✅ `app/(app)/courses/`, `app/(app)/search/`, `app/(app)/community/`, `app/api/courses/` 라우트 폴더 통째 삭제
  - ✅ 강의 컴포넌트 4종 삭제 (`course-card.tsx`, `courses-filter-chips.tsx`, `rating-bar-chart.tsx`, `star-rating-input.tsx`)
  - ✅ `lib/courses/`, `lib/dummy-data.ts`, `lib/dummy-community.ts`, `types/rating.ts` 삭제
  - ✅ `types/database.ts` 의 courses/reviews Row/Insert/Update 블록 제거 (profiles 만 남음)
  - ✅ `proxy.ts` 인증 완료 redirect 대상 `/courses` → `/` (게시판 홈) 으로 변경
  - ✅ `components/bottom-tab-bar.tsx` 임시 정리 (게시판/마이 2탭 — Phase 4 Task 012 에서 3탭+FAB 로 재작성 예정)
  - ✅ `app/(app)/my/page.tsx`, `app/(admin)/admin/page.tsx` 임시 placeholder 화 (Phase 4 Task 018 / Phase 5 Task 019 에서 재작성)
  - ✅ DROP 마이그레이션 `supabase/migrations/20260504000000_drop_courses_reviews.sql` 작성 + dev 프로젝트 적용 (트리거 → 함수 → reviews CASCADE → courses CASCADE)
  - ✅ 검증: `mcp__supabase__list_tables` 결과 `[public.profiles]` 만 (courses/reviews 부재) / `npm run build` 통과 (12 라우트, 강의 흔적 0) / 기존 lint 에러 1건(`signup/page.tsx:56` setState-in-effect)은 본 작업과 무관한 사전 이슈로 P1 항목 유지

- **Task 007 폐기 후 발견된 P1 (별도 진행)**
  - `signup/page.tsx:56` setState-in-effect 리팩토링 (URL 쿼리스트링 → 파생 상태)
  - `bottom-tab-bar.tsx` 를 Phase 4 Task 012 에서 3탭(게시판/탐색/마이) + 중앙 FAB 로 재작성
  - production DB 의 강의 도메인 폐기는 Task 023 (Vercel 배포) 에서 별도 진행

- **Task 007 (구버전): 강의 도메인 자산 폐기 및 DROP 마이그레이션** (참고용 원안)
  - **삭제 대상 파일**:
    - `lib/courses/queries.ts`, `lib/dummy-data.ts`, `lib/dummy-community.ts`
    - `app/api/courses/route.ts`
    - `app/(app)/courses/` (폴더 전체), `app/(app)/search/` (강의 검색 시절)
    - `app/(admin)/admin/page.tsx` (강의 등록 폼) — Phase 5 어드민 신고 큐로 재작성
    - `components/courses-filter-chips.tsx`, `components/course-card.tsx`, `components/rating-bar-chart.tsx`, `components/star-rating-input.tsx`
    - `app/(app)/courses/[id]/_components/review-sheet.tsx` (있는 경우)
  - **수정 대상**:
    - `types/database.ts` — `courses` / `reviews` Row/Insert/Update 타입 제거 (게시판 7테이블은 Task 008 에서 추가)
    - `types/rating.ts` — 5축 평점 파일 통째로 삭제
    - `proxy.ts` — `/courses`, `/search` 보호 경로 제거 / 새 경로(`/`, `/posts/[id]`, `/explore`, `/my`) 로 교체
  - **DROP 마이그레이션 신규 작성**: `supabase/migrations/20260504000000_drop_courses_reviews.sql`
    - `DROP TRIGGER IF EXISTS refresh_course_avg_rating ...`
    - `DROP FUNCTION IF EXISTS refresh_course_avg_rating()`
    - `DROP TABLE IF EXISTS reviews CASCADE; DROP TABLE IF EXISTS courses CASCADE;`
  - **검증**: Supabase MCP `apply_migration` → `list_tables` 로 courses/reviews 부재 확인 / `npm run build` 회귀 0건 / `npm run lint` 통과

- **Task 008: 게시판 7테이블 마이그레이션 (categories / posts / comments)** ✅ - 완료
  - ✅ `20260504000001_create_admin_helper.sql` — `public.is_admin()` 헬퍼 (SECURITY INVOKER + STABLE + search_path=public, RLS 정책 12곳에서 재사용)
  - ✅ `20260504000002_create_categories.sql` — slug UNIQUE / type CHECK (topic|campus) / sort_order / is_active / RLS 4정책 (SELECT 모두 허용, INSERT·UPDATE·DELETE 어드민만)
  - ✅ `20260504000003_create_posts.sql` — user_id ON DELETE CASCADE / category_id ON DELETE RESTRICT / title 1-100자 CHECK / body 10-5000자 CHECK / is_anonymous / reaction_up·reaction_down·comment_count 캐시 컬럼 / is_deleted soft delete
  - ✅ posts 부분 인덱스 4종 (category_created / created / popular / user) WHERE is_deleted=false + GIN(title|body gin_trgm_ops) (F007 검색)
  - ✅ posts RLS 4정책: select_visible(is_deleted=false OR is_admin) / insert_self(auth.uid=user_id) / update_self·delete_self(본인 OR admin)
  - ✅ `20260504000004_create_comments.sql` — post_id·user_id·parent_id self-FK 모두 ON DELETE CASCADE / body 1-1000자 CHECK / `comments_no_self_parent` (parent_id<>id) / RLS 4정책 동일 패턴 / 1단계 대댓글 깊이 강제는 application 레이어 책임
  - ✅ 검증 시나리오 7건 통과: A(type CHECK 23514) / B(slug UNIQUE 23505) / C(임시 시드 정상) / D(body 9자 23514) / E(parent_id=id 자기참조 23514) / F(is_deleted=true row anon SELECT 0건) / G(is_admin() = false)
  - ✅ get_advisors security 본 Task 신규 경고 0건 (기존 advisor 항목은 모두 본 Task 와 무관한 사전 이슈)
  - ✅ 임시 검증 데이터 모두 정리, list 결과 categories/posts/comments 0 row (Task 010 정식 시드 대기 상태)

- **Task 009: 게시판 7테이블 마이그레이션 (reactions / reports / bookmarks)** (의존: Task 008)
  - `20260504000004_create_reactions.sql` — user_id FK / target_type CHECK (post|comment) / target_id UUID / reaction CHECK (up|down) / **UNIQUE(user_id, target_type, target_id)** / RLS (SELECT 본인+집계용 모두, INSERT·DELETE 본인)
  - `20260504000005_create_reports.sql` — reporter_id FK / target_type / target_id / reason CHECK (abuse|defamation|spam|illegal) / description 500자 / status CHECK (pending|processed|dismissed) / RLS (SELECT 어드민, INSERT 본인, UPDATE 어드민)
  - `20260504000006_create_bookmarks.sql` — user_id FK / post_id FK / **UNIQUE(user_id, post_id)** / RLS (SELECT·INSERT·DELETE 본인)
  - 카운터 트리거: `posts.reaction_up/down` (reactions INSERT/DELETE), `posts.comment_count` (comments INSERT/UPDATE soft-delete)
  - **검증**: Supabase MCP — 동일 reaction 중복 INSERT → UNIQUE 위반, 트리거로 reaction_up 증가 확인, `get_advisors` 로 RLS 누락 점검

- **Task 010: 타입 재구성 및 카테고리 시드** (의존: Task 008, 009)
  - `types/database.ts` — `mcp__supabase__generate_typescript_types` 로 자동 생성 후 7테이블 Row/Insert/Update 정합 확인
  - `types/community.ts` 신규 — `CategorySlug` / `CategoryType` / `ReactionKind` (`up`/`down`) / `ReportReason` / `ReportStatus` enum + 각 zod 스키마 (`PostFormSchema`, `CommentFormSchema`, `ReportFormSchema`)
  - `lib/community/categories.ts` — 9개 카테고리 정의 상수 (free/love/study/job/daily/question + mita/hiyoshi/sfc) + 표시 이름·이모지 메타
  - 카테고리 시드 마이그레이션 또는 `mcp__supabase__execute_sql` 로 INSERT 9건
  - **검증**: `SELECT * FROM categories ORDER BY sort_order` 결과 9건 / `npm run build` 통과

- **Task 011: 데이터 액세스 레이어 + API 라우트 골격** (의존: Task 010)
  - `lib/community/posts.ts` — `fetchPosts(supabase, filter, cursor, limit)` (카테고리 필터 + 정렬 latest|popular + keyset 페이징)
  - `lib/community/post-detail.ts` — `fetchPostWithComments(supabase, postId)` (post + comments 트리 + 내 reactions/bookmark 상태)
  - `lib/community/hot-feed.ts` — `fetchHotPosts(supabase)` — 최근 24h `reaction_up` 상위 3건 (F014)
  - `lib/community/reactions.ts` — `toggleReaction(supabase, target, kind)` (낙관적 업데이트용 헬퍼)
  - `lib/community/bookmarks.ts` — `toggleBookmark(supabase, postId)`
  - `app/api/posts/route.ts` (GET 목록 + POST 작성) / `app/api/posts/[id]/route.ts` (GET / DELETE) / `app/api/comments/route.ts` (POST) / `app/api/reactions/route.ts` (POST/DELETE) / `app/api/bookmarks/route.ts` (POST/DELETE) / `app/api/reports/route.ts` (POST)
  - **검증**: Supabase MCP `execute_sql` 동등 쿼리 검증, `npm run build` / `npm run lint`

---

## Phase 3.5: UI 시안 검토 (ASCII Wireframe)

> **목적**: Phase 4 마크업 직전, 각 페이지의 레이아웃을 가벼운 ASCII wireframe 으로 그려 사용자 OK 사인을 받은 후 코드 진입. 디자인 시안 도구(Figma 등) 없이 1~2일 내 완료.

- **Task 011.5: 게시판 페이지 ASCII 와이어프레임 작성** (의존: Task 011)
  - `docs/wireframes/` 폴더 신규
  - 각 페이지마다 1장씩 markdown 코드블럭 ASCII 다이어그램 작성:
    - `home.md` — 게시판 홈 (핫피드 캐러셀 / 갤러리 아이콘 행 / 정렬 토글 / 카드 피드)
    - `post-detail.md` — 게시글 상세 (본문 / 추천·북마크·신고 / 댓글 트리 / 댓글 폼)
    - `write-sheet.md` — 글쓰기 Bottom Sheet (카테고리 칩 / 제목 / 본문 / 익명 토글 / 등록)
    - `explore.md` — 탐색·인기 (검색창 / 카테고리 필터 / 결과 카드)
    - `my.md` — 마이페이지 (프로필 헤더 / 탭 / 카드 리스트)
    - `report-sheet.md` — 신고 Bottom Sheet (사유 라디오 / 보충 설명)
    - `admin-reports.md` — 어드민 신고 큐
  - 각 와이어프레임에 **상호작용 노트**(예: "FAB 클릭 → Sheet 슬라이드 업", "카드 ❤️ 클릭 → 낙관적 업데이트") 1~2줄씩
  - 사용자 검토 → 피드백 반영 → "OK" 사인 후 Phase 4 진입
  - **검증**: 사용자가 7개 와이어프레임을 모두 확인하고 진행 동의

---

## Phase 4: 게시판 핵심 기능 (F002~F009, F014~F018)

> **UX 원칙**: PRD 의 **3탭 + 중앙 FAB** 레이아웃을 모든 `(app)` 라우트에서 공통 노출. FAB → Bottom Sheet 작성은 별도 라우트 없이 어느 페이지에서든 1탭에 진입 가능. **Phase 3.5 와이어프레임 OK 사인 후 진입.**

- **Task 012: 하단 네비게이션 + 중앙 FAB + Bottom Sheet 컨테이너** (의존: Task 011)
  - `components/community/bottom-tab-bar.tsx` — 3탭 (게시판 `Home` / 탐색 `Search` / 마이 `User`) + Safe Area
  - `components/community/write-fab.tsx` — 56×56 원형 PenSquare 버튼, 탭 바 위 8px 부유, drop shadow (F016)
  - `components/community/write-bottom-sheet.tsx` — shadcn `Sheet` 80vh, 카테고리 칩 + 제목 + 본문 + 익명 토글 + 등록 (F017)
  - localStorage `draft:post` 자동 임시 저장 / "이어 쓰기" 토스트 복원
  - `app/(app)/layout.tsx` 에 BottomTabBar + WriteFab 배치 (모든 하위 라우트 공통)
  - **검증**: Playwright MCP — FAB 클릭 → Sheet 열림, 작성 중 X 클릭 → draft 저장 확인, 다시 열면 복원 토스트, 등록 성공 → 게시글 상세로 이동

- **Task 013: 게시판 홈 — 핫 피드 캐러셀 + 갤러리 아이콘 행 (F014, F015)** (의존: Task 012)
  - `app/(app)/page.tsx` — Server Component, 핫 피드 + 카테고리 시드 + 1페이지 게시글 SSR
  - `components/community/hot-feed-carousel.tsx` — 가로 스와이프 캐러셀 (Framer Motion drag), 24h 추천 TOP 3, 카테고리 배지 + 제목 + 추천 수 (F014)
  - `components/community/category-icon-row.tsx` — 인스타 스토리 식 원형 아이콘 가로 스크롤, "전체" 첫 항목 + 9개 카테고리, 클릭 시 해당 카테고리 필터 적용 (F015)
  - 정렬 토글 (최신 / 인기) — sticky, 스크롤 시 상단 고정
  - **검증**: Playwright MCP — 캐러셀 스와이프 / 갤러리 아이콘 클릭 → 필터 URL `?category=love` / 정렬 토글 sticky 동작

- **Task 014: 게시글 카드 + 인라인 반응 + 무한 스크롤 (F004, F018)** (의존: Task 013)
  - `components/community/post-card.tsx` — 카테고리 배지 / 작성자(익명 or 닉네임) / 시간 / 제목 / **본문 첫 80~100자 미리보기** / 인라인 ❤️·💬·🔖 (F018)
  - 카드 ❤️/🔖 클릭 → 낙관적 업데이트 후 `/api/reactions` · `/api/bookmarks` 호출
  - `components/community/post-feed.tsx` — Client Component, IntersectionObserver(rootMargin:200px) + keyset cursor 무한 스크롤
  - 카테고리 / 정렬 변경 시 AbortController 로 race condition 차단
  - 카드 본문 영역 클릭 → 게시글 상세 (`/posts/[id]`) 이동
  - **검증**: Playwright MCP — 카드 ❤️ 클릭 시 즉시 카운트 +1 (낙관적), 새로고침 후에도 유지, 무한 스크롤 동작, 카테고리 필터 시 fetch race 없음

- **Task 015: 게시글 상세 페이지 + 댓글 + 대댓글 (F005, F006, F009)** (의존: Task 014)
  - `app/(app)/posts/[id]/page.tsx` — Server Component, post + comments 트리 + 내 reactions/bookmark 상태 SSR
  - 본문 표시 (카테고리 배지·제목·작성자·시간·본문) + 추천/비추천 + 북마크 + 점 3개(…) 메뉴
  - 본인 게시글 → 삭제 버튼 (soft delete `is_deleted=true`)
  - `components/community/comment-list.tsx` — 댓글 + 대댓글 1단계 트리, 펼치기/접기
  - `components/community/comment-form.tsx` — 화면 하단 고정, 익명/닉네임 토글
  - 댓글 작성 / 삭제 (본인만) + 댓글 추천 (F006)
  - **검증**: Playwright MCP — 댓글 작성 → 즉시 목록 반영 / 대댓글 작성 / 본인 외 삭제 차단 / 추천 1회 제한 (UNIQUE 위반 시 graceful)

- **Task 016: 신고 기능 (F008)** (의존: Task 015)
  - 게시글·댓글 점 3개 메뉴 → "신고" → `components/community/report-sheet.tsx` Bottom Sheet
  - 신고 사유 라디오 (욕설 / 명예훼손 / 스팸 / 불법) + 보충 설명 (선택, 500자)
  - `POST /api/reports` 호출 → reports 테이블 INSERT (status=pending)
  - 동일 user 가 동일 target 중복 신고 방지 (UNIQUE 또는 application-level 체크)
  - **검증**: Playwright MCP — 신고 제출 → 토스트 / DB 에 status=pending row 삽입 / 어드민 큐(Phase 5) 에 노출 확인

- **Task 017: 탐색·인기 페이지 + 검색 (F007, F018)** (의존: Task 014)
  - `app/(app)/explore/page.tsx` — 상단 고정 검색 입력창 (자동 포커스) + 디바운스 300ms
  - 검색어 없을 때 → 이번 주 인기 게시글 TOP 10 (`reaction_up` 7일 합산)
  - 검색어 있을 때 → `pg_trgm similarity` 또는 ILIKE `%query%` 조합으로 제목/본문 검색
  - 카테고리 필터 칩으로 검색 범위 좁히기
  - 결과 카드도 PostCard 재사용 (F018 인라인 반응)
  - **검증**: Playwright MCP — 일본어 검색 (예: "授業") / IME 조합 중 fetch 차단 / 빈 결과 상태 / 인기 모드 정렬 검증

- **Task 018: 마이페이지 (F009, F011)** (의존: Task 015)
  - `app/(app)/my/page.tsx` — 닉네임 + 캠퍼스/학부 표시 + 탭 (내 글 / 내 댓글 / 북마크)
  - 내 글 카드: 제목·카테고리·시간·추천 수 + **삭제** 버튼 (soft delete)
  - 내 댓글 카드: 댓글 내용·원 게시글 제목 링크·시간 + **삭제** 버튼
  - 북마크 카드: 게시글 제목·카테고리 + **북마크 해제** 버튼
  - 프로필 수정 링크 (`/my/profile` 재활용) + **로그아웃** 버튼 (하단)
  - **검증**: Playwright MCP — 내 글 삭제 → 목록에서 제거 / 북마크 해제 → 게시판 홈 카드의 🔖 상태 동기화

---

## Phase 5: 어드민·통합 테스트·콜드 스타트 대응

- **Task 019: 어드민 신고 검토 큐 (F012)** (의존: Task 016)
  - `app/(admin)/admin/page.tsx` 재작성 (강의 등록 폼 폐기 → 신고 큐)
  - `proxy.ts` 또는 layout 에서 `profiles.role = 'admin'` 게이트
  - 미처리 신고 목록: 신고 대상 / 유형 / 시간 / 신고자 수 / 인라인 미리보기
  - **삭제** 버튼 → posts.is_deleted=true (또는 comments) + reports.status=processed
  - **기각** 버튼 → reports.status=dismissed
  - 처리 완료 이력 탭
  - **검증**: Playwright MCP — admin 계정으로 신고 조회 → 삭제 처리 → 게시판 홈에서 해당 글 사라짐 / 일반 사용자 `/admin` 접근 시 차단

- **Task 020: 핵심 기능 통합 E2E 테스트** (의존: Task 019)
  - Playwright MCP 시나리오:
    - 가입 → 이메일 인증 → setup → 게시판 홈 진입 → 갤러리 클릭 → 글쓰기 (FAB→Sheet) → 게시글 상세 → 댓글 → 추천 → 북마크 → 신고 → 마이페이지 확인 → 로그아웃
    - 어드민: 신고 처리 → 삭제 → 일반 사용자 화면에서 해당 글 사라짐 확인
  - Supabase MCP `get_advisors` — 보안·성능 권고사항 0건 목표
  - 다중 사용자 RLS 시나리오 — 본인 글만 삭제, 타인 reactions 변경 불가
  - 엣지 케이스: 빈 데이터 / 네트워크 오류 / 동시 추천 race / soft-deleted 글 캐시 카운트 정합

- **Task 021: 콜드 스타트 시드 데이터 + 가이드라인 게시글** (의존: Task 020)
  - 어드민 계정으로 시드 게시글 30~50건 작성 (각 카테고리당 3~5건)
  - 운영 공지 게시글 (가이드라인 / 닉네임 가이드 / 신고 안내) — 핀 처리는 P1
  - 베타 그룹 (지인 20~30명) 초대 명단 정리

---

## Phase 6: 출시 준비

- **Task 022: 가이드라인 페이지 + 법적 문서** (의존: Task 006)
  - `app/(public)/guidelines/page.tsx` — 커뮤니티 가이드라인 (욕설·명예훼손·실명 언급·성희롱·불법 게시물 금지)
  - `app/(public)/terms/page.tsx`, `app/(public)/privacy/page.tsx` — 이용약관 / 개인정보처리방침
  - 회원가입 페이지의 가이드라인 동의 체크박스(F013) 링크 연결
  - 푸터 또는 마이페이지 하단에 진입점 배치
  - **검증**: 링크 정합성 / 모바일 가독성

- **Task 023: Vercel 배포 + Supabase Production 분리** (의존: Task 020)
  - Vercel 프로젝트 연결 + 환경변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - Supabase: dev 프로젝트 → production 프로젝트 분리 (또는 `mcp__supabase__create_branch` 활용)
  - production DB 에 모든 마이그레이션 적용 + 카테고리 시드 + 어드민 계정 등록
  - 비밀번호 재설정 이메일 플로우 (Supabase Auth `resetPasswordForEmail`) 검증
  - 사용자 탈퇴 기능 (個人情報保護法 대응) — `auth.admin.deleteUser` + profiles cascade
  - **검증**: 프로덕션 도메인에서 가입 → 이메일 인증 메일 수신 → 게시글 작성 전체 흐름

- **Task 024: 운영 매뉴얼 + KPI 측정 도구** (의존: Task 023)
  - `docs/admin-sop.md` — 신고 처리 SOP (48시간 내 처리 목표, 삭제·기각 기준, 명예훼손 신고 에스컬레이션)
  - Vercel Analytics 또는 PostHog 무료 티어 연결 → DAU / MAU / 페이지뷰
  - Supabase 대시보드 SQL 쿼리 (가입자 수 / 게시글 수 / 게시글당 평균 댓글 수 / 신고 평균 처리 시간)
  - KPI 대시보드 한 페이지로 정리 (Notion 또는 `/admin/kpi`)

---

## Phase 7+: MVP 이후 로드맵

> PRD 의 "MVP 이후 로드맵" 항목을 그대로 옮기되, ROADMAP 의 Phase 번호로 재부여합니다.

### Phase 7 — 콘텐츠 품질 향상

- 이미지 첨부 (Supabase Storage + 불법 이미지 신고 대응 흐름 설계 후)
- 게시글 수정 기능 (수정 이력 표시로 투명성 확보)
- 욕설 자동 필터 (금칙어 사전 기반)
- 차단 기능 (특정 사용자 게시글 숨기기)

### Phase 8 — 커뮤니티 확장

- 게시글 공유 URL + 비로그인 미리보기 (SEO 노출)
- 캠퍼스 갤러리 추가 (수요 확인 후 신규 카테고리 오픈 — 야가미 / 시나노마치 / 시바공립)
- 알림 기능 (내 게시글에 댓글 달렸을 때 인앱 알림)
- 강의 리뷰 기능 부활 검토 (커뮤니티가 충분히 성장한 후)

### Phase 9 — 확장

- Google keio.jp Workspace OAuth 로그인
- iOS / Android PWA 앱 최적화
- 타 대학 확장 (와세다, 도쿄대 등) — 멀티 테넌트 구조 도입

---

## 현재 코드베이스 정합성 노트

### 유지·재활용 자산 (그대로 사용)

| 분류 | 파일/경로 | 비고 |
|------|----------|------|
| 인프라 | `lib/supabase/client.ts`, `lib/supabase/server.ts` | 그대로 사용 |
| 라우트 가드 | `proxy.ts` | 보호 경로만 게시판 경로로 교체 (Task 007) |
| 인증 타입 | `types/auth.ts` | 가이드라인 동의 필드 추가 (Task 006) |
| 도메인 enum | `types/domain.ts` | CAMPUS_VALUES 한국어 6개 그대로 사용 |
| profiles 마이그레이션 | `supabase/migrations/20260502000000_create_profiles.sql`, `20260503000000_extend_profiles.sql`, `20260503000003_check_profiles_email_domain.sql` | 그대로 사용 |
| 인증 페이지 | `app/(public)/login/page.tsx`, `app/(public)/signup/page.tsx`, `app/(public)/signup/setup/page.tsx`, `app/auth/callback/route.ts` | 회원가입에 가이드라인 체크박스만 추가 (Task 006) |
| 마이페이지 | `app/(app)/my/page.tsx`, `app/(app)/my/profile/page.tsx` | 콘텐츠를 게시판 기준(내 글/댓글/북마크) 으로 재작성 (Task 018) |
| 공통 UI | `components/ui/*` (shadcn), `components/bottom-tab-bar.tsx` | BottomTabBar 는 3탭 게시판 라벨로 재구성 (Task 012) |
| 유틸 | `lib/utils.ts`, `lib/motion-variants.ts` | 그대로 사용 |

### 폐기 대상 (Task 007 에서 일괄 정리)

| 분류 | 파일/경로 | 폐기 이유 |
|------|----------|----------|
| 강의 도메인 데이터 | `lib/courses/queries.ts` | 강의 → 게시판 피벗 |
| 강의 API | `app/api/courses/route.ts` | 신규 `/api/posts` 등으로 교체 |
| 강의 페이지 | `app/(app)/courses/`, `app/(app)/courses/[id]/` 전체 | `/posts/[id]` 로 교체 |
| 강의 검색 | `app/(app)/search/` | `/explore` 로 교체 (Task 017) |
| 어드민 강의 등록 | `app/(admin)/admin/page.tsx` | 신고 큐로 재작성 (Task 019) |
| 강의 컴포넌트 | `components/courses-filter-chips.tsx`, `components/course-card.tsx`, `components/rating-bar-chart.tsx`, `components/star-rating-input.tsx` | 게시판 컴포넌트로 대체 |
| 더미 데이터 | `lib/dummy-data.ts`, `lib/dummy-community.ts` | 실제 DB 연동 (게시판은 처음부터 DB 기반) |
| 평점 타입 | `types/rating.ts` | 5축 평점 미사용 |
| DB 마이그레이션 | `20260503000001_create_courses.sql`, `20260503000002_create_reviews.sql` | 신규 DROP 마이그레이션(`20260504000000`) 으로 정리 |
| DB 타입 | `types/database.ts` 의 courses/reviews 부분 | `mcp__supabase__generate_typescript_types` 로 게시판 7테이블 재생성 (Task 010) |

### 신규 생성 자산 (Phase 3~4)

| 분류 | 파일/경로 | 담당 Task |
|------|----------|----------|
| DB 마이그레이션 | `20260504000000_drop_courses_reviews.sql` ~ `20260504000006_create_bookmarks.sql` | Task 007~009 |
| 도메인 타입 | `types/community.ts` | Task 010 |
| 카테고리 메타 | `lib/community/categories.ts` | Task 010 |
| 데이터 액세스 | `lib/community/posts.ts`, `post-detail.ts`, `hot-feed.ts`, `reactions.ts`, `bookmarks.ts` | Task 011 |
| API 라우트 | `app/api/posts/`, `comments/`, `reactions/`, `bookmarks/`, `reports/` | Task 011 |
| FAB+Sheet | `components/community/write-fab.tsx`, `write-bottom-sheet.tsx` | Task 012 |
| 게시판 홈 위젯 | `hot-feed-carousel.tsx`, `category-icon-row.tsx`, `post-card.tsx`, `post-feed.tsx` | Task 013, 014 |
| 게시글 상세 | `app/(app)/posts/[id]/page.tsx`, `comment-list.tsx`, `comment-form.tsx` | Task 015 |
| 신고 | `report-sheet.tsx` | Task 016 |
| 탐색 | `app/(app)/explore/page.tsx` | Task 017 |
| 어드민 큐 | `app/(admin)/admin/page.tsx` (재작성) | Task 019 |
| 가이드라인 | `app/(public)/guidelines/page.tsx`, `terms/page.tsx`, `privacy/page.tsx` | Task 022 |

---

## F001~F018 ↔ Task 매핑 (역추적용)

| 기능 ID | 기능명 | 담당 Task |
|---------|--------|----------|
| F001 | keio.jp 이메일 인증 | Task 003, 004 ✅ |
| F002 | 카테고리(갤러리) 분류 | Task 008, 010, 013 |
| F003 | 게시글 작성 | Task 011, 012 |
| F004 | 게시글 목록 조회 | Task 013, 014 |
| F005 | 게시글 상세 + 댓글 | Task 015 |
| F006 | 추천/비추천 | Task 009, 014, 015 |
| F007 | 검색 | Task 008(GIN), 017 |
| F008 | 신고 기능 | Task 009, 016, 019 |
| F009 | 북마크 | Task 009, 014, 018 |
| F010 | 기본 인증 | Task 004 ✅ |
| F011 | 사용자 프로필 | Task 005 ✅, 018 |
| F012 | 어드민 신고 검토 | Task 019 |
| F013 | 가이드라인 동의 | Task 006, 022 |
| F014 | 핫 피드 캐러셀 | Task 011(hot-feed query), 013 |
| F015 | 갤러리 아이콘 행 | Task 013 |
| F016 | 중앙 FAB | Task 012 |
| F017 | 글쓰기 Bottom Sheet | Task 012 |
| F018 | 카드 미리보기 + 인라인 반응 | Task 014, 017 |
