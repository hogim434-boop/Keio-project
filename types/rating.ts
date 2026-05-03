/**
 * 5축 평점 타입 정의 및 DB ↔ UI 변환 헬퍼
 *
 * - DB 컬럼 (snake_case): rating_overall, rating_attendance, rating_exam_difficulty, ...
 * - UI 타입 (camelCase): overall, attendance, examDifficulty, ...
 *
 * 키 이름은 기존 `lib/dummy-data.ts`의 DummyRatings와 일치시켜
 * 향후 컴포넌트(rating-bar-chart, star-rating-input)가 import 경로만 교체하면 호환되도록 한다.
 */

import { z } from 'zod'

// ============================================================
// UI 타입 (camelCase) — 컴포넌트·폼에서 사용
// ============================================================

/**
 * 5축 평점 (UI용)
 *
 * - overall: 종합 평점 (1~5)
 * - attendance: 출석 체크 빈도 (1=거의 없음, 5=매우 자주)
 * - examDifficulty: 시험·과제 난이도 (1=매우 쉬움, 5=매우 어려움)
 * - gradingEase: 학점 취득 난이도 (1=매우 어려움, 5=매우 쉬움)
 * - teachingStyle: 강의 스타일 만족도 (1~5)
 *
 * 평균/캐시 필드는 소수 가능. 사용자 입력 시에는 정수 1~5만 허용 → Ratings5AxisInputSchema 사용.
 */
export type Ratings5Axis = {
  overall: number
  attendance: number
  examDifficulty: number
  gradingEase: number
  teachingStyle: number
}

/** 사용자 입력용 zod 스키마 — 1~5 정수 강제 */
export const Ratings5AxisInputSchema = z.object({
  overall: z.number().int().min(1).max(5),
  attendance: z.number().int().min(1).max(5),
  examDifficulty: z.number().int().min(1).max(5),
  gradingEase: z.number().int().min(1).max(5),
  teachingStyle: z.number().int().min(1).max(5),
})

// ============================================================
// DB 타입 (snake_case) — Supabase Insert/Update 페이로드용
// ============================================================

/** reviews 테이블 5축 컬럼 (snake_case, INT 1~5) */
export type DbReviewRatings = {
  rating_overall: number
  rating_attendance: number
  rating_exam_difficulty: number
  rating_grading_ease: number
  rating_teaching_style: number
}

// ============================================================
// 변환 헬퍼
// ============================================================

/** DB(snake_case) → UI(camelCase) 변환 */
export function dbToUiRatings(db: DbReviewRatings): Ratings5Axis {
  return {
    overall: db.rating_overall,
    attendance: db.rating_attendance,
    examDifficulty: db.rating_exam_difficulty,
    gradingEase: db.rating_grading_ease,
    teachingStyle: db.rating_teaching_style,
  }
}

/** UI(camelCase) → DB(snake_case) 변환 */
export function uiToDbRatings(ui: Ratings5Axis): DbReviewRatings {
  return {
    rating_overall: ui.overall,
    rating_attendance: ui.attendance,
    rating_exam_difficulty: ui.examDifficulty,
    rating_grading_ease: ui.gradingEase,
    rating_teaching_style: ui.teachingStyle,
  }
}

// ============================================================
// 5축 메타데이터 — 컴포넌트가 라벨 표시 시 사용
// ============================================================

/**
 * 5축 평점의 메타정보 (라벨 다국어, 도움말 등)
 *
 * RatingBarChart 등에서 import 해서 사용. 라벨 위치를 한 곳에서 관리.
 */
export const RATING_AXES = [
  {
    key: 'overall',
    db_key: 'rating_overall',
    label_ja: '総合評価',
    label_ko: '종합 평가',
  },
  {
    key: 'attendance',
    db_key: 'rating_attendance',
    label_ja: '出席チェック',
    label_ko: '출석 체크 빈도',
  },
  {
    key: 'examDifficulty',
    db_key: 'rating_exam_difficulty',
    label_ja: '試験難易度',
    label_ko: '시험 난이도',
  },
  {
    key: 'gradingEase',
    db_key: 'rating_grading_ease',
    label_ja: '単位取得',
    label_ko: '학점 취득 용이',
  },
  {
    key: 'teachingStyle',
    db_key: 'rating_teaching_style',
    label_ja: '授業スタイル',
    label_ko: '강의 스타일',
  },
] as const satisfies ReadonlyArray<{
  key: keyof Ratings5Axis
  db_key: keyof DbReviewRatings
  label_ja: string
  label_ko: string
}>

// ============================================================
// 강의 스타일 태그 (선택형 멀티 태그)
// ============================================================

export const TEACHING_STYLE_TAG_VALUES = [
  'PPT 위주',
  '판서',
  '영어강의',
  '토론식',
  '실험·실습',
  '발표·프레젠테이션',
  '레포트 중심',
  '시험 없음',
  '소수정예',
  '온라인',
  '하이브리드',
] as const

export type TeachingStyleTag = (typeof TEACHING_STYLE_TAG_VALUES)[number]

export const TeachingStyleTagSchema = z.enum(TEACHING_STYLE_TAG_VALUES)

export const TeachingStyleTagsSchema = z.array(TeachingStyleTagSchema).max(6)
