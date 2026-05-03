/**
 * Supabase Database 타입 정의
 *
 * Supabase의 `generate_typescript_types` CLI 출력과 호환되는 형식으로 작성.
 * 향후 자동 생성 타입으로 대체 가능 (`npx supabase gen types typescript`).
 *
 * 사용 예:
 * ```ts
 * import type { Database } from '@/types/database'
 * type Course = Database['public']['Tables']['courses']['Row']
 * ```
 */

// ============================================================
// JSON 타입 (Supabase 표준)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// Database 인터페이스 (public 스키마)
// ============================================================

export interface Database {
  public: {
    Tables: {
      // ──────────────────────────────────────────────────────
      // profiles — 회원 프로필
      //   auth.users 와 1:1 연결. 가입 시 자동 생성, setup 페이지에서 campus/grade/department 입력
      // ──────────────────────────────────────────────────────
      profiles: {
        Row: {
          id: string
          email: string
          campus: string | null
          grade: string | null
          department: string | null
          nickname: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          campus?: string | null
          grade?: string | null
          department?: string | null
          nickname?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          campus?: string | null
          grade?: string | null
          department?: string | null
          nickname?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }

      // ──────────────────────────────────────────────────────
      // courses — 강의 정보
      //   PRD 14컬럼 + day_period/classroom 추가 (PDF 추출 데이터 호환)
      // ──────────────────────────────────────────────────────
      courses: {
        Row: {
          id: string
          name: string
          name_en: string | null
          professor: string
          campus: string
          faculty: string
          semester: string
          language: 'ja' | 'en'
          requirement_type: string | null
          has_textbook: boolean
          enrollment_size: string | null
          day_period: string | null
          classroom: string | null
          avg_rating: number | null
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_en?: string | null
          professor: string
          campus: string
          faculty: string
          semester: string
          language?: 'ja' | 'en'
          requirement_type?: string | null
          has_textbook?: boolean
          enrollment_size?: string | null
          day_period?: string | null
          classroom?: string | null
          avg_rating?: number | null
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_en?: string | null
          professor?: string
          campus?: string
          faculty?: string
          semester?: string
          language?: 'ja' | 'en'
          requirement_type?: string | null
          has_textbook?: boolean
          enrollment_size?: string | null
          day_period?: string | null
          classroom?: string | null
          avg_rating?: number | null
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ──────────────────────────────────────────────────────
      // reviews — 강의 리뷰 (5축 평점)
      //   UNIQUE(course_id, user_id) — 한 사용자는 한 강의당 1개 리뷰
      //   AFTER INSERT/UPDATE/DELETE 트리거가 courses.avg_rating, review_count 갱신
      // ──────────────────────────────────────────────────────
      reviews: {
        Row: {
          id: string
          course_id: string
          user_id: string
          taken_semester: string
          rating_overall: number
          rating_attendance: number
          rating_exam_difficulty: number
          rating_grading_ease: number
          rating_teaching_style: number
          teaching_style_tags: string[]
          body: string | null
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          taken_semester: string
          rating_overall: number
          rating_attendance: number
          rating_exam_difficulty: number
          rating_grading_ease: number
          rating_teaching_style: number
          teaching_style_tags?: string[]
          body?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          taken_semester?: string
          rating_overall?: number
          rating_attendance?: number
          rating_exam_difficulty?: number
          rating_grading_ease?: number
          rating_teaching_style?: number
          teaching_style_tags?: string[]
          body?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      // user_list 뷰는 profiles 마이그레이션에서 정의됨
      user_list: {
        Row: {
          id: string | null
          email: string | null
          campus: string | null
          grade: string | null
          department: string | null
          setup_complete: boolean | null
          joined_at: string | null
          last_sign_in_at: string | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ============================================================
// 헬퍼 타입 (자주 쓰는 단축 alias)
// ============================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// 자주 쓰는 모델 단축 export
export type Profile = Tables<'profiles'>
export type Course = Tables<'courses'>
export type Review = Tables<'reviews'>

export type ProfileInsert = TablesInsert<'profiles'>
export type CourseInsert = TablesInsert<'courses'>
export type ReviewInsert = TablesInsert<'reviews'>

export type ProfileUpdate = TablesUpdate<'profiles'>
export type CourseUpdate = TablesUpdate<'courses'>
export type ReviewUpdate = TablesUpdate<'reviews'>
