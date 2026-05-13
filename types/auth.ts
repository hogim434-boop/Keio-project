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
import { CampusSchema, GradeSchema, DepartmentSchema } from './domain'

// ============================================================
// 게이오 이메일 도메인 화이트리스트 (단일 출처)
// ============================================================

/** 게이오 대학 공식 이메일 도메인 — 회원가입·로그인·콜백 모두에서 사용 */
export const KEIO_EMAIL_DOMAINS = [
  '@keio.jp',
  '@g.keio.ac.jp',
  '@sfc.keio.ac.jp',
] as const

/**
 * 이메일이 게이오 대학 도메인에 속하는지 정확히 판정한다.
 *
 * `endsWith('@keio.jp')` 만 쓰면 `evil.keio.jp` 같은 서브도메인 위장 가능성이
 * 있으므로, `@` 로 분리 후 도메인 부분을 화이트리스트와 정확 일치 비교한다.
 * 이메일은 대소문자 무관하므로 toLowerCase 로 정규화.
 */
export function isKeioEmail(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at === -1 || at === email.length - 1) return false
  const domain = email.slice(at + 1).toLowerCase()
  return KEIO_EMAIL_DOMAINS.some((d) => d.slice(1).toLowerCase() === domain)
}

// ============================================================
// 기본 검증 스키마
// ============================================================

/** keio.jp / g.keio.ac.jp / sfc.keio.ac.jp 도메인만 허용 */
export const KeioEmailSchema = z
  .string()
  .min(1, 'メールアドレスを入力してください')
  .email('メールアドレスの形式が正しくありません')
  .refine(isKeioEmail, {
    message: 'keio.jp ドメインのメールアドレスのみご利用いただけます',
  })

/** 비밀번호: 8자 이상 + 영문 1자 + 숫자 1자 */
export const PasswordSchema = z
  .string()
  .min(8, 'パスワードは8文字以上で入力してください')
  .regex(/[A-Za-z]/, '英字を1文字以上含めてください')
  .regex(/[0-9]/, '数字を1文字以上含めてください')

/** 닉네임: 2~20자 */
export const NicknameSchema = z
  .string()
  .min(2, 'ニックネームは2文字以上で入力してください')
  .max(20, 'ニックネームは20文字以下で入力してください')
  .trim()

// ============================================================
// 폼 스키마
// ============================================================

/** 로그인 폼 — login 페이지에서 사용 */
export const LoginFormSchema = z.object({
  email: KeioEmailSchema,
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type LoginFormData = z.infer<typeof LoginFormSchema>

/** 계정 설정 폼 — signup/setup 페이지에서 사용 */
export const SetupFormSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
    nickname: NicknameSchema,
    campus: CampusSchema,
    grade: GradeSchema,
    department: DepartmentSchema,
    /** F013: 利用規約 + コミュニティガイドライン 同意 — refine 으로 true 만 통과 */
    agreedToTerms: z.boolean().refine((v) => v === true, {
      message: '利用規約とコミュニティガイドラインへの同意が必要です',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type SetupFormData = z.infer<typeof SetupFormSchema>
