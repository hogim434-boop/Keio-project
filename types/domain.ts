/**
 * 도메인 enum 및 zod 스키마
 *
 * 비즈니스 도메인의 핵심 enum 값을 string literal union으로 정의하고,
 * 동일한 값에 대해 zod 스키마를 함께 export 하여 클라이언트/서버 검증을 일관되게 한다.
 *
 * - DB 컬럼은 TEXT + CHECK 제약으로 강제 (PostgreSQL enum 타입을 쓰지 않음)
 *   → 새 값 추가 시 ALTER TYPE 없이 마이그레이션 가능
 * - TypeScript 타입은 string literal union 으로 IDE 자동완성·타입 좁히기 활용
 */

import { z } from 'zod'

// ============================================================
// 캠퍼스 (Campus)
// ============================================================

/** 게이오 대학 6개 캠퍼스 */
export const CAMPUS_VALUES = [
  '미타',        // 三田 (3·4학년 문계)
  '히요시',      // 日吉 (1·2학년 일반교양)
  'SFC',         // 湘南藤沢
  '야가미',      // 矢上 (이공학부 3·4학년)
  '시나노마치',  // 信濃町 (의학부)
  '시바공립',    // 芝共立 (약학부)
] as const

export type Campus = (typeof CAMPUS_VALUES)[number]

export const CampusSchema = z.enum(CAMPUS_VALUES)

// ============================================================
// 학기 (Semester)
// ============================================================

/**
 * 학기 코드 형식: `{year}-{term}`
 * - year: 4자리 연도 (예: 2026)
 * - term: spring | fall | spring-first | spring-second | fall-first | fall-second | intensive | year-long
 */
export const SEMESTER_TERMS = [
  'spring',
  'fall',
  'spring-first',
  'spring-second',
  'fall-first',
  'fall-second',
  'intensive',
  'year-long',
] as const

export type SemesterTerm = (typeof SEMESTER_TERMS)[number]

/** 학기 형식 검증: "2026-spring" 같은 형태 */
export const SemesterSchema = z
  .string()
  .regex(
    /^\d{4}-(spring|fall|spring-first|spring-second|fall-first|fall-second|intensive|year-long)$/,
    '학기 코드 형식이 올바르지 않습니다. 예: 2026-spring'
  )

export type Semester = z.infer<typeof SemesterSchema>

/** 일본어 학기 표기 → 코드 매핑 헬퍼 (PDF 추출 데이터 변환용) */
export function jaSemesterToCode(year: number, jaText: string | null): Semester | null {
  if (!jaText) return null
  const map: Record<string, SemesterTerm> = {
    春: 'spring',
    秋: 'fall',
    '春(学期前半)': 'spring-first',
    '春(学期後半)': 'spring-second',
    '秋(学期前半)': 'fall-first',
    '秋(学期後半)': 'fall-second',
    春集中: 'intensive',
    秋集中: 'intensive',
    通年: 'year-long',
  }
  const term = map[jaText]
  if (!term) return null
  return `${year}-${term}` as Semester
}

// ============================================================
// 강의 언어 (Language)
// ============================================================

export const LANGUAGE_VALUES = ['ja', 'en'] as const

export type Language = (typeof LANGUAGE_VALUES)[number]

export const LanguageSchema = z.enum(LANGUAGE_VALUES)

// ============================================================
// 이수 구분 (RequirementType)
// ============================================================

export const REQUIREMENT_TYPE_VALUES = ['필수', '선택', '자유'] as const

export type RequirementType = (typeof REQUIREMENT_TYPE_VALUES)[number]

export const RequirementTypeSchema = z.enum(REQUIREMENT_TYPE_VALUES)

// ============================================================
// 수강 인원 규모 (EnrollmentSize)
// ============================================================

export const ENROLLMENT_SIZE_VALUES = ['소', '중', '대'] as const

export type EnrollmentSize = (typeof ENROLLMENT_SIZE_VALUES)[number]

export const EnrollmentSizeSchema = z.enum(ENROLLMENT_SIZE_VALUES)

// ============================================================
// 사용자 권한 (UserRole)
// ============================================================

export const USER_ROLE_VALUES = ['user', 'admin'] as const

export type UserRole = (typeof USER_ROLE_VALUES)[number]

export const UserRoleSchema = z.enum(USER_ROLE_VALUES)

// ============================================================
// 학년 (Grade)
// ============================================================

export const GRADE_VALUES = ['1', '2', '3', '4', '5', '6', '대학원'] as const

export type Grade = (typeof GRADE_VALUES)[number]

export const GradeSchema = z.enum(GRADE_VALUES)

// ============================================================
// 학부 (Department)
// ============================================================

/** 게이오 대학 학부 — 자유 입력 대신 고정 선택지 */
export const DEPARTMENT_VALUES = [
  '文',
  '商',
  '理工',
  '経済',
  '法',
  '医',
  '薬',
  'sfc',
] as const

export type Department = (typeof DEPARTMENT_VALUES)[number]

export const DepartmentSchema = z.enum(DEPARTMENT_VALUES)

// 게이오 이메일 검증은 types/auth.ts 가 단일 출처(SoT). 직접 거기서 import 사용.
// 이전엔 하위 호환 위해 re-export 했으나 domain ↔ auth 순환이 production 빌드 시
// CampusSchema TDZ 를 유발해 제거함.
