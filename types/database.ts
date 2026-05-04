/**
 * Supabase Database 타입 정의
 *
 * Supabase의 `generate_typescript_types` CLI 출력과 호환되는 형식으로 작성.
 * 향후 자동 생성 타입으로 대체 가능 (`npx supabase gen types typescript`).
 *
 * 사용 예:
 * ```ts
 * import type { Database } from '@/types/database'
 * type Profile = Database['public']['Tables']['profiles']['Row']
 * ```
 *
 * 참고: courses/reviews 테이블 타입은 게시판 피벗(Task 007)으로 제거됨.
 * 게시판 관련 7테이블은 Task 010에서 mcp__supabase__generate_typescript_types 로 재생성 예정.
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

// profiles 모델 단축 export
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>
