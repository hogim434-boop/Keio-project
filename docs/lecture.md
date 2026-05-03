# 강의(이수) 데이터 통합 문서

> 게이오 대학 학부 강의 데이터를 `courses` / `search` 페이지에 통합하기 위한 분석·설계·진행 상황 문서입니다.
> 모든 이수 관련 작업은 이 문서를 기준으로 진행합니다.

---

## 📌 1. 배경 및 목표

### 문제 정의
- `courses`, `search` 페이지에 게이오 대학 학부 강의 데이터가 필요함
- 강의를 일일이 수동 입력하는 것은 비효율적 (7,000개 이상)
- 게이오 시러버스(`gslbs.keio.jp`)는 SAML SSO 인증이 필요해 자동 스크래핑 불가

### 핵심 결정 사항 (2026-05-03)
- ✅ **사용자 본인이 본인 계정으로 시러버스에서 PDF 다운로드** → AI 파싱
- ✅ **5개 요일(월~금) PDF**에서 약 7,000건 강의 데이터 확보
- ✅ **옵션 B 채택**: 데이터는 `docs/data/`에 JSON으로만 보관, **Supabase 등록은 ROADMAP Task 010에서 진행**
- ✅ ROADMAP·PRD 흐름을 깨지 않고 본래 작업(Phase 2 UI / Task 003 DB 스키마)으로 복귀

---

## 🗺️ 2. ROADMAP 위치 (반드시 숙지)

| 단계 | 작업 | 상태 |
|------|------|------|
| Phase 3 / Task 010 | "시드 강의 데이터 200건 이상 등록 (콜드 스타트 방지)" | ⏳ **대기 중 — 본 데이터를 여기서 활용** |

**중요**: 본 문서의 데이터(JSON)는 **Task 010 도착 시점까지 사용하지 않음**.
PRD `courses` 테이블 스키마(`PRD.md` 277-294행)가 확정된 후 매핑·import 함.

PRD 차별화 전략(`PRD.md` 399행):
> 경쟁 서비스 (Penmark) 학부생 80% 점유 — "질 높은 다차원 리뷰"와 "SEO 최적화"로 차별화

→ Penmark처럼 **모든 강의를 다 가지는 전략이 아님**. 200~500건의 깊이 있는 시드면 충분.

---

## 📄 3. 데이터 소스

### 소스 A: 시러버스 검색 결과 PDF ⭐ (메인 데이터 소스)

| 파일 (`/Users/kiimho/Documents/`) | 페이지 | 추출 강의 |
|----------|-------|----------|
| `シラバス・時間割 月.pdf` | 129 | 1,982 |
| `シラバス・時間割　火.pdf` | 130 | 1,956 |
| `シラバス・時間割　水.pdf` | 128 | 1,981 |
| `シラバス・時間割　木.pdf` | 130 | 1,985 |
| `シラバス・時間割　金.pdf` | 130 | 1,984 |
| **합계 (raw)** | 647 | **9,888건** |
| **중복 제거 후** | - | **7,003건** |

#### ⚠️ 잘림 주의사항
- 각 PDF에 **"検索結果が多くてすべて表示することができませんでした"** 메시지 포함
- 풋터의 "4,412件(全曜日で26124件)"은 **검색 결과 총수**, PDF 실제 포함 수가 아님
- 실제 추출된 시한: 月1, 月2, 月3 (月4~月7은 잘려서 누락)
- → 본 데이터로는 **"오전·오후 초반 강의"만** 커버
- → 더 많은 데이터 필요 시 학부별/캠퍼스별 좁은 검색으로 재다운로드

#### 출처
- URL: `https://gslbs.keio.jp/syllabus/result` (PDF 풋터에 명시)
- 사용자 본인이 본인 게이오 계정(SAML 로그인)으로 다운로드 → 합법적 권한 내 데이터

### 소스 B: 학부별 履修案内 PDF (보조 데이터, MVP에서는 미사용)

| 파일 | 학부 | 용도 |
|------|------|------|
| `理工.pdf` | 이공학부 | 졸업·진급 조건, K-Number 체계 |
| `経済.pdf` | 경제학부 | 동일 |
| `法.pdf` | 법학부 | 동일 |
| `商.pdf` | 상학부 | 동일 |
| `文学部.pdf` | 문학부 | 동일 |
| `医学.pdf` | 의학부 | 동일 |
| `薬.pdf` | 약학부 | 동일 |

→ 향후 **졸업 요건 체크 기능** 추가 시 활용 (MVP 이후, Phase 4 수준)

---

## 📊 4. 추출 데이터 구조

### JSON 스키마 (`docs/data/raw/courses-*.json`)
```json
{
  "source": "シラバス・時間割 月.pdf",
  "extracted_at": "2026-05-03T22:34:00.000Z",
  "total": 1982,
  "courses": [
    {
      "name": "英語Ⅰ中級",          // 강의명
      "professor": "井口 篤",         // 교수명 ⭐
      "credits": 1,                   // 학점
      "semester": "春",               // 春 / 秋 / 通年 / 春集中 / 秋(学期前半) ...
      "day_period": "月1",            // 월요일 1교시
      "campus": "日吉",               // 日吉 / 三田 / 矢上 / 湘南藤沢 / 芝共立 / 信濃町
      "classroom": "D401",
      "format": "対面授業（主として対面授業）",
      "faculty": "文/人文",           // 학부/학과
      "grades": [1],                  // 대상 학년
      "class_no": null,               // 클래스 (어학 등)
      "set_course": "英語Ⅱ中級 井口 篤 1単位 秋 月1"  // 짝과목
    }
  ]
}
```

### 통합 파일
- `docs/data/courses-merged.json` — 5일치 통합 + 중복 제거
- `docs/data/courses-stats.json` — 분포 통계

---

## 📈 5. 데이터 통계 (2026-05-03 추출 기준)

### 캠퍼스 분포 (전 캠퍼스 커버 ✅)
| 캠퍼스 | 건수 | 비율 |
|--------|------|------|
| 日吉 (1·2학년) | 3,056 | 43.6% |
| 三田 (3·4학년 문계) | 2,932 | 41.9% |
| 矢上 (이공) | 312 | 4.5% |
| 湘南藤沢 (SFC) | 281 | 4.0% |
| 芝共立 (약학부) | 76 | 1.1% |
| 信濃町 (의학부) | 29 | 0.4% |
| (null) | 317 | 4.5% |

### 학부 분포 Top 10
| 학부 | 건수 |
|------|------|
| 文/人文 | 996 |
| 経/経済 | 854 |
| 商/商 | 701 |
| 法/法律 | 640 |
| 法/政治 | 252 |
| 理 | 230 |
| 総環 (SFC) | 199 |
| 経/経Ｐ | 176 |
| 体研 | 171 |
| 法務/法曹 (대학원) | 133 |

### 학기 분포
| 학기 | 건수 |
|------|------|
| 春 | 3,306 |
| 秋 | 2,904 |
| 春(学期前半/後半) | 163 |
| 秋(学期前半/後半) | 137 |
| 春집중/秋집중 | 121 |
| 通年 | 34 |
| 春隔週/秋隔週 | 20 |

### 데이터 품질
| 필드 | null 비율 | 평가 |
|------|----------|------|
| name | 0% | ✅ 완벽 |
| professor | 0% | ✅ 완벽 |
| semester | 4.5% | ✅ 양호 |
| campus | 4.5% | ✅ 양호 |
| classroom | 8.3% | ⚠️ 개선 가능 |
| faculty | 4.5% | ✅ 양호 |
| format | 4.6% | ✅ 양호 |
| grades | 4.8% | ✅ 양호 |

---

## 🔧 6. 파서 도구

### 스크립트
| 파일 | 역할 |
|------|------|
| `scripts/parse-syllabus.mjs` | PDF 1개 → JSON 변환 (정규식 기반, 의존성 0) |
| `scripts/merge-and-validate.mjs` | 5개 JSON 통합 + 중복 제거 + 통계 |

### 사용법
```bash
# 단일 PDF 파싱
node scripts/parse-syllabus.mjs "/path/to/syllabus.pdf" docs/data/raw/courses-xxx.json

# 5일치 통합 + 검증
node scripts/merge-and-validate.mjs
```

### 의존성
- `pdftotext` (poppler-utils) — `brew install poppler`
- Node.js 18+ (ESM 지원)

---

## 🎯 7. PRD 데이터 모델 매핑 (Task 010 진입 시 참고)

PRD `courses` 테이블 (PRD.md 277-294행) ↔ 추출된 데이터:

| PRD 필드 | 추출 데이터 | 매핑 방법 |
|---------|-----------|----------|
| `id` | (생성) | UUID 신규 생성 |
| `name` | `name` | 그대로 사용 |
| `name_en` | (없음) | 향후 영어 강의명 추가 |
| `professor` | `professor` | 그대로 사용 |
| `campus` | `campus` | enum 매핑 (日吉→hiyoshi 등) |
| `faculty` | `faculty` | "文/人文" → 분리 (학부/학과) |
| `semester` | `semester` + `set_course` | "2026-spring" 형식으로 변환 |
| `language` | (없음) | 강의명에서 추측 ("英語"/"フランス語" 등 포함 시) |
| `requirement_type` | (없음) | 履修案内 PDF에서 보강 가능 |
| `has_textbook` | (없음) | 추출 불가 → 기본값 false |
| `enrollment_size` | (없음) | 추출 불가 → 기본값 "중" |

**누락 필드 처리 정책 (Task 010에서 결정)**:
- A. 모두 NOT NULL 제거 + 누락 허용
- B. 시드 200건만 손으로 보강
- C. 履修案内 PDF에서 추가 추출

---

## 🔄 8. 작업 진행 상황

### 완료 (2026-05-03)
- [x] PDF 구조 파악 (履修案内 + 시러버스 검색 결과)
- [x] Penmark 데이터 등록 메커니즘 조사
- [x] ROADMAP·PRD 위치 분석 → 옵션 B 결정
- [x] 시러버스 PDF 5개 → JSON 파서 작성
- [x] 5개 요일 통합 (7,003건 확보)
- [x] 데이터 품질 검증
- [x] `docs/data/` 디렉토리 구조 + `.gitignore` 설정

### Task 003 완료 (2026-05-03)
- [x] PRD `courses` 테이블 마이그레이션 (17컬럼, day_period/classroom 포함)
- [x] PRD `reviews` 테이블 마이그레이션 (5축 + UNIQUE + RLS + avg_rating 트리거)
- [x] profiles 확장 (role + nickname 동기화 트리거)
- [x] 보안·성능 최적화 (RLS auth.uid() (SELECT) 패턴 + 트리거 함수 RPC 차단)
- [x] 6개 시나리오 검증 통과

### Task 006 완료 (2026-05-04)
- [x] `types/auth.ts` 신규 — KEIO_EMAIL_DOMAINS 단일 출처 + 5개 zod schema
- [x] `types/domain.ts` KeioEmailSchema re-export로 통일
- [x] `app/auth/callback/route.ts` 하드코딩 제거 → KEIO_EMAIL_DOMAINS import
- [x] `profiles_email_keio_check` DB CHECK 제약 추가 (서버 사이드 이중 검증)
- [x] login 페이지 RHF + zodResolver 리팩토링 (LoginFormSchema, 인라인 에러)
- [x] setup 페이지 RHF + zodResolver 리팩토링 (SetupFormSchema, 한꺼번에 검증)
- [x] CAMPUSES 한국어 enum 통일 (courses CHECK 정합) + GRADES 라벨 매핑 + Controller 패턴
- [x] PasswordSchema 강화 (8자+영문+숫자)

#### Task 006 Playwright E2E 검증 결과 (localhost:3002)
| Test | 시나리오 | 결과 |
|------|---------|------|
| 1 | 비로그인 `/courses` → `/login` 자동 리다이렉트 | ✅ PASS |
| 2 | 정상 로그인 → `/courses` + 마이페이지 닉네임 | 보류 (사용자 비밀번호 필요) |
| 3 | 로그아웃 → `/login` | 보류 (Test 2 의존) |
| 4 | `/auth/callback` (no code) → `/signup?error=auth` | ✅ PASS |
| 보너스 A | Zod 도메인 차단: `test@gmail.com` → 인라인 에러 "keio.jp 도메인 이메일만 사용 가능합니다" (Supabase 호출 차단) | ✅ PASS |
| 보너스 B | 비로그인 `/signup/setup` → `/signup` 가드 동작 | ✅ PASS |
| 보너스 C | 콘솔 에러 0건 | ✅ PASS |

### 보류 (Task 010 진입 시 진행)
- [ ] 7,003건 중 시드 200~500건 선별 (인기 강의·다양한 학부)
- [ ] PDF 일본어 캠퍼스(日吉/三田) → 한국어 enum(히요시/미타) 매핑
- [ ] PDF 학기(春/秋) → semester 코드(2026-spring/2026-fall) 변환
- [ ] CSV 또는 SQL INSERT 변환
- [ ] Supabase 일괄 import + 검증
- [ ] (선택) `course_requirements` 테이블 추가 + 履修案内 PDF에서 추출

### 향후 개선 (MVP 이후)
- [ ] 月4~月7 데이터 추가 다운로드 (학부별 좁은 검색)
- [ ] 토·일 강의 PDF 다운로드
- [ ] 강의 상세 본문(시러버스 페이지) 크라우드소싱 시스템
- [ ] 학부별 履修案内 PDF에서 졸업 요건 추출 → "졸업 시뮬레이션" 기능

---

## 📝 9. 주의사항 및 정책

### 저작권/법적 안전성
- 강의명, 교수명, 학점, 학기 등 **사실 정보(fact)** 는 저작권 보호 대상 아님
- PDF는 사용자 본인의 게이오 계정(SAML 인증)으로 합법적으로 본인 권한 내 다운로드
- 강의 상세 설명(시러버스 본문)은 **저장하지 않음** — 공식 시러버스 링크로 연결

### 데이터 갱신
- 매 학년도 신규 검색 결과 PDF 다운로드 → 같은 파서 재실행
- `extracted_at` 컬럼으로 시점 관리

### Git 관리
- `docs/data/*.json` 및 `docs/data/raw/`는 `.gitignore` 처리
- 약 5~10MB JSON 파일은 사용자 로컬에서만 보관
- 필요 시 압축해서 클라우드 백업

### 데이터 보안
- 본 데이터는 사용자 본인의 게이오 계정 권한 내에서 본 정보를 가공한 것
- 외부 공개 시 게이오 학칙·이용규정 검토 필수

---

> 📅 최종 업데이트: 2026-05-03
> 🔧 작성자: Claude Code (자동 분석)
> 📂 데이터 위치: `docs/data/courses-merged.json` (7,003건)
