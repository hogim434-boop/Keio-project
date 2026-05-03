---
name: Recurring Issues
description: 코드 리뷰에서 반복적으로 발견되는 패턴 문제
type: project
---

## 2026-05-02 1차 리뷰 (초기 login/signup 페이지)

1. **폼 유효성 검사 없음**: login/signup 페이지에 실제 Supabase 호출 없음.
2. **variants 삼항연산자 반복**: shouldReduce ? {} : variants 패턴이 모든 motion 요소에 반복됨.
3. **lang="en" 문제**: app/layout.tsx의 html lang이 "en"인데 한국어/일본어 콘텐츠 포함.
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
