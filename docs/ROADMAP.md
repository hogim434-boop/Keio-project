# Jukulog (塾ログ) 개발 로드맵

게이오 대학교 재학생이 수강신청 전 신뢰할 수 있는 강의 정보를 얻을 수 있도록, keio.jp 인증 기반의 익명 5축 강의 리뷰 플랫폼을 제공합니다.

## 개요

Jukulog은 게이오 대학교 재학생을 위한 강의 리뷰 웹 앱으로 다음 핵심 기능을 제공합니다:

- **keio.jp 이메일 인증**: 재학생 전용 폐쇄형 커뮤니티로 리뷰 신뢰도 확보
- **5축 다차원 리뷰**: 종합 평점에 더해 출석체크 빈도, 시험·과제 난이도, 학점 취득 난이도, 강의 스타일 만족도까지 평가
- **모바일 우선 탐색**: 하단 탭 네비게이션과 캠퍼스/학부/학기 필터로 수강신청 전 빠른 강의 탐색 지원

## 개발 워크플로우

1. **작업 계획**

   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - `/tasks` 디렉토리에 새 작업 파일 생성
   - 명명 형식: `XXX-description.md` (예: `001-setup.md`)
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**
   - 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조
   - 새 작업의 경우, 문서에는 빈 박스와 변경 사항 요약이 없어야 함

3. **작업 구현**

   - 작업 파일의 명세서를 따름
   - 기능과 기능성 구현
   - **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
   - 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
   - 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
   - 테스트 통과 확인 후 다음 단계로 진행
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

   - 로드맵에서 완료된 작업을 ✅로 표시

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

- **Task 001: 프로젝트 구조 및 라우팅 설정** ✅ - 완료
  - See: `/tasks/001-project-setup.md`
  - ✅ Next.js 16.2.4 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui 환경 구성
  - ✅ `lib/supabase/` 브라우저/서버 클라이언트 분리 구현
  - ✅ `.env.local` Supabase 키 등록 및 `proxy.ts` 세션 갱신 미들웨어 구현
  - ✅ `lib/utils.ts` `cn()` 유틸리티 함수 작성

- **Task 002: 라우트 골격 및 공통 레이아웃 설정** - 우선순위
  - App Router 라우트 그룹 설계: `(public)` / `(app)` / `(admin)` 그룹 분리
  - 빈 페이지 파일 생성: `/`, `/login`, `/signup`, `/courses`, `/courses/[id]`, `/search`, `/my`, `/my/profile`, `/admin`
  - `(app)` 레이아웃에 하단 탭 네비게이션 골격 (강의/검색/마이 3탭, Safe Area 대응) 작성
  - `(public)` 레이아웃에 간소 상단 헤더 (로고/로그인/회원가입) 작성
  - `proxy.ts`에 미인증 시 `/login` 리디렉션 로직 추가
  - 모바일 글로벌 스타일 정의 (최대 너비 768px 중앙 정렬, `pb-safe`, 16px 여백)

### Phase 2: UI/UX 완성 (더미 데이터 활용)

- **Task 004: 공통 컴포넌트 라이브러리 구현** - 우선순위
  - shadcn `button`, `input`, `label`, `select`, `textarea`, `card`, `dialog`, `sheet`, `form`, `dropdown-menu` 추가
  - 5축 평점 시각화 컴포넌트 `<RatingBarChart />` 자체 구현 (가로 바 차트)
  - 별점 입력 컴포넌트 `<StarRatingInput />` 작성 (1~5 정수, 44px 터치 영역)
  - 강의 카드 컴포넌트 `<CourseCard />` 작성 (강의명/교수명/평점/리뷰 수)
  - 하단 탭 네비게이션 `<BottomTabBar />` 완성 (활성/비활성 상태, Safe Area 대응)
  - `lib/dummy-data.ts` 더미 데이터 생성 및 관리 유틸리티 작성

- **Task 005: 모든 페이지 UI 완성**
  - 랜딩 페이지: 서비스 소개 + 인기 강의 미리보기 카드 + 검색창 UI
  - 로그인/회원가입 페이지: 이메일·비밀번호 폼, 캠퍼스/학부 선택 드롭다운 UI
  - 강의 목록 페이지: 캠퍼스 가로 스크롤 필터 칩 + 강의 카드 목록 UI
  - 강의 상세 페이지: 5축 바 차트 + 스타일 태그 + 리뷰 목록 + Floating 리뷰 작성 버튼 UI
  - 검색 페이지: 검색창 자동 포커스 + 결과 리스트 UI
  - 마이페이지/프로필 설정 페이지: 내 리뷰 목록 + 로그아웃 버튼 UI
  - 어드민 페이지: 강의 등록 폼 + CSV 임포트 + 관리 테이블 UI

### Phase 3: 핵심 기능 구현

- **Task 003: 타입 정의 및 데이터베이스 스키마 설계** ✅ - 완료
  - ✅ `types/database.ts`: profiles/courses/reviews Row/Insert/Update + Relationships
  - ✅ `types/domain.ts`: Campus(6캠퍼스 한국어)/Semester/Language/RequirementType/EnrollmentSize/UserRole/Grade/KeioEmail enum + zod
  - ✅ `types/rating.ts`: Ratings5Axis(camelCase) + DbReviewRatings(snake_case) + dbToUiRatings/uiToDbRatings 변환 헬퍼 + RATING_AXES 메타 + TeachingStyleTag
  - ✅ 마이그레이션 4건 적용: extend_profiles_role_nickname, create_courses_table, create_reviews_table, optimize_rls_and_revoke_trigger_func (RLS auth.uid() 최적화 + 트리거 함수 RPC 차단)
  - ✅ courses 17컬럼 + pg_trgm GIN 인덱스(name, professor) + RLS 4정책(SELECT 공개/INSERT·UPDATE·DELETE 어드민)
  - ✅ reviews 14컬럼 + UNIQUE(course_id, user_id) + 5축 CHECK + body 1000자 + RLS 4정책(본인만)
  - ✅ refresh_course_avg_rating 트리거 (INSERT/UPDATE/DELETE → avg_rating, review_count 자동 갱신)
  - ✅ 검증: 정상 INSERT 2건 + 위반 케이스 4건(UNIQUE/campus CHECK/rating CHECK/body length CHECK) + FK CASCADE 모두 통과

- **Task 006: 인증 및 회원가입 플로우 구현** ✅ - 완료
  - ✅ `types/auth.ts` 신규 — `KEIO_EMAIL_DOMAINS` 단일 출처 + `KeioEmailSchema`/`PasswordSchema`/`NicknameSchema`/`LoginFormSchema`/`SetupFormSchema`
  - ✅ `types/domain.ts` `KeioEmailSchema` re-export로 통일, `app/auth/callback/route.ts` 하드코딩 제거
  - ✅ `profiles.email` DB CHECK 제약 (`profiles_email_keio_check`) — 정규식 `@(keio\.jp|g\.keio\.ac\.jp|sfc\.keio\.ac\.jp)$`
  - ✅ Supabase Auth: `signInWithOAuth` (Google + hd=keio.jp) / `signInWithPassword` / `updateUser` / `signOut` 연동
  - ✅ 이메일 인증 콜백 (`app/auth/callback/route.ts`) — keio.jp 도메인 검증 후 `/signup/setup` 또는 `/courses` 분기
  - ✅ profiles upsert는 DB 트리거(`handle_new_user` + `handle_user_metadata_update`)가 자동 처리 (nickname 동기화 포함)
  - ✅ login 페이지 RHF + zodResolver 리팩토링 (LoginFormSchema 적용, 인라인 에러)
  - ✅ setup 페이지 RHF + zodResolver 리팩토링 + CAMPUSES 한국어 enum 통일 (courses CHECK 정합) + GRADES 라벨 매핑
  - ✅ Playwright MCP E2E: 보호 라우트 차단(/courses → /login), 콜백 단위 검증(/auth/callback → /signup?error=auth), Zod 도메인 차단(`test@gmail.com` → 즉시 인라인 에러), setup 가드(/signup/setup → /signup) 모두 PASS, 콘솔 에러 0건

- **Task 007: 강의 목록 및 필터 기능 구현**
  - 무한 스크롤 강의 목록 (Supabase `range()` + Intersection Observer)
  - 캠퍼스/학부/학기/언어/이수구분 필터 조합 쿼리 구현
  - 사용자 캠퍼스·학부를 필터 기본값으로 적용
  - 더미 데이터를 실제 Supabase 쿼리로 교체
  - Playwright MCP 테스트: 필터 조합 결과 정확성, 무한 스크롤 동작, 빈 결과 상태

- **Task 008: 강의 상세 및 5축 리뷰 작성/수정/삭제 구현**
  - 강의 상세 페이지 실제 데이터 연동 (기본 정보 + 5축 집계 평점)
  - 리뷰 작성 Bottom Sheet 폼 (5축 별점 + 스타일 태그 + 텍스트 1000자)
  - 리뷰 INSERT/UPDATE/DELETE + RLS 권한 검증
  - avg_rating 캐시 트리거 동작 확인
  - Playwright MCP 테스트: 리뷰 작성→목록 갱신, 중복 리뷰 차단, 타인 리뷰 수정 권한 차단, 익명 표시 확인

- **Task 009: 강의 검색 기능 구현**
  - `/search` 페이지: 진입 시 자동 포커스 + 디바운스 300ms 실시간 검색
  - ILIKE `%query%` 기반 강의명·교수명 검색 구현
  - 검색어 없을 때 인기 강의 / 최근 리뷰된 강의 표시
  - Playwright MCP 테스트: 일본어 검색, IME 입력 처리, 빈 결과 상태

- **Task 010: 어드민 강의 데이터 관리 구현**
  - `users.role = 'admin'` 라우트 가드 적용
  - 강의 신규 등록 폼 + 수정/삭제 기능 연동
  - CSV 일괄 임포트 (papaparse): 검증 → 미리보기 → 일괄 INSERT
  - 시드 강의 데이터 200건 이상 등록 (콜드 스타트 방지)
  - Playwright MCP 테스트: CSV 50건 임포트, 잘못된 행 검출, 어드민 외 접근 차단

- **Task 011: 핵심 기능 통합 테스트**
  - Playwright MCP로 전체 사용자 여정 E2E 테스트 (가입 → 이메일 인증 → 강의 탐색 → 리뷰 작성 → 수정/삭제 → 검색 → 로그아웃)
  - Supabase MCP `get_advisors`로 보안·성능 권고사항 점검
  - RLS 정책 다중 사용자 시나리오 검증 (일반 사용자 / 어드민 권한 분리)
  - 에러 핸들링 및 엣지 케이스 테스트 (네트워크 오류, 빈 데이터, 동시 요청)

### Phase 4: 고급 기능 및 최적화

- **Task 012: SEO 및 성능 최적화**
  - Next.js 16 캐싱 전략 적용 (`use cache` + `cacheLife` + `revalidateTag`)
  - 강의 상세 페이지 비로그인 부분 공개 (기본 정보 + 평점만 표시) — 검색 엔진 인덱싱 가능
  - 메타데이터 / Open Graph / JSON-LD `Course` 스키마 적용
  - `robots.txt`, `sitemap.ts` 생성
  - Lighthouse 모바일 점수 90+ 목표 확인

- **Task 013: 신고 기능 및 법적 리스크 대응**
  - `reports` 테이블 추가 (review_id, reporter_id, reason, status)
  - 리뷰 카드 신고 버튼 → Bottom Sheet 사유 선택 → 제출
  - 신고 N건 누적 시 자동 숨김 처리 트리거
  - 어드민 페이지에 신고 처리 큐 추가
  - 리뷰 작성 시 명예훼손 가이드라인 모달 1회 노출
  - Playwright MCP 테스트: 신고 제출, 자동 숨김 임계치, 어드민 처리 흐름

- **Task 014: 커뮤니티 기능 (Q&A, 유용성 투표)**
  - `questions`, `answers` 테이블 + RLS 설계
  - 강의 상세 페이지에 Q&A 탭 추가 (익명 질문/답변)
  - `review_votes` 테이블 + 리뷰 카드 "도움이 됐어요" 토글 + 카운트 표시
  - Playwright MCP 테스트: 질문 작성 → 답변 → 익명 표시, 중복 투표 차단

- **Task 015: 배포 및 운영 준비**
  - Vercel 프로덕션 배포 + 환경변수 보안 설정
  - Vercel Analytics 또는 PostHog 무료 티어로 MAU 측정
  - 이용약관 / 개인정보처리방침 페이지 (`/terms`, `/privacy`)
  - 비밀번호 재설정 이메일 플로우 완성
  - 사용자 탈퇴 기능 구현 (個人情報保護法 대응)
