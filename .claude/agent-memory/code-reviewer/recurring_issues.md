---
name: Recurring Issues
description: 코드 리뷰에서 반복적으로 발견되는 패턴 문제
type: project
---

2026-05-02 첫 리뷰에서 발견된 주요 반복 패턴:

1. **폼 유효성 검사 없음**: login/signup 페이지 모두 onSubmit에서 e.preventDefault()만 하고 실제 Supabase 호출 없음. keio.jp 이메일 도메인 검증 로직 미구현.
2. **variants 삼항연산자 반복**: shouldReduce ? {} : variants 패턴이 모든 motion 요소에 반복됨. 유틸리티 함수로 추출 필요.
3. **lang="en" 문제**: app/layout.tsx의 html lang이 "en"인데 한국어/일본어 콘텐츠 포함.
4. **비밀번호 확인 검증 없음**: signup page.tsx에서 password !== confirmPassword 체크 없음.
5. **goNext에 검증 없음**: 이메일 입력 없이도 step 2로 넘어갈 수 있음.
6. **Select에 htmlFor 없음**: 캠퍼스/학년 Select 컴포넌트에 Label의 htmlFor 연결 미구현.
7. **서버 컴포넌트 활용 부족**: react-hook-form, zod가 의존성에 있지만 미사용. Next.js 16 권장 Server Actions 패턴 미사용.
