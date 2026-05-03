/**
 * 인증 관련 zod 스키마 + 도메인 상수 (Single Source of Truth)
 *
 * 이 파일은 다음 4곳에서 import됩니다:
 *   1) types/domain.ts (re-export로 하위 호환)
 *   2) app/auth/callback/route.ts (서버 콜백 도메인 검증)
 *   3) app/(public)/login/page.tsx (LoginFormSchema)
 *   4) app/(public)/signup/setup/page.tsx (SetupFormSchema)
 *
 * 향후 다른 대학 도메인 추가 시 KEIO_EMAIL_DOMAINS 만 확장하면 4곳 모두 자동 갱신됩니다.
 */

import { z } from 'zod'
import { CampusSchema, GradeSchema } from './domain'

// ============================================================
// 게이오 이메일 도메인 화이트리스트 (단일 출처)
// ============================================================

/** 게이오 대학 공식 이메일 도메인 — 회원가입·로그인·콜백 모두에서 사용 */
export const KEIO_EMAIL_DOMAINS = [
  '@keio.jp',
  '@g.keio.ac.jp',
  '@sfc.keio.ac.jp',
] as const

// ============================================================
// 기본 검증 스키마
// ============================================================

/** keio.jp / g.keio.ac.jp / sfc.keio.ac.jp 도메인만 허용 */
export const KeioEmailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('이메일 형식이 올바르지 않습니다')
  .refine(
    (email) => KEIO_EMAIL_DOMAINS.some((domain) => email.endsWith(domain)),
    { message: 'keio.jp 도메인 이메일만 사용 가능합니다' }
  )

/** 비밀번호: 8자 이상 + 영문 1자 + 숫자 1자 */
export const PasswordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .regex(/[A-Za-z]/, '영문을 1자 이상 포함해야 합니다')
  .regex(/[0-9]/, '숫자를 1자 이상 포함해야 합니다')

/** 닉네임: 2~20자 */
export const NicknameSchema = z
  .string()
  .min(2, '닉네임은 2자 이상이어야 합니다')
  .max(20, '닉네임은 20자 이하여야 합니다')
  .trim()

// ============================================================
// 폼 스키마
// ============================================================

/** 로그인 폼 — login 페이지에서 사용 */
export const LoginFormSchema = z.object({
  email: KeioEmailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type LoginFormData = z.infer<typeof LoginFormSchema>

/** 계정 설정 폼 — signup/setup 페이지에서 사용 */
export const SetupFormSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
    nickname: NicknameSchema,
    campus: CampusSchema,
    grade: GradeSchema,
    department: z.string().min(1, '학부를 입력해주세요').trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

export type SetupFormData = z.infer<typeof SetupFormSchema>
