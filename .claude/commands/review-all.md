---
description: "현재 작업 파일을 스택 컨벤션 기준으로 종합 코드 리뷰합니다"
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*)
---

# Claude 커맨드: Review All

현재 작업 중인 파일 또는 변경된 코드를 이 프로젝트의 기술 스택 기준으로 종합 리뷰합니다.

## 사용법

```
/review-all
/review-all src/components/ui/button.tsx
```

## 리뷰 프로세스

1. 인자가 있으면 해당 파일, 없으면 `git diff`로 변경된 파일 전체 대상
2. 아래 5가지 기준으로 각각 점검
3. 문제 발견 시 코드 예시와 함께 수정 방법 안내

## 리뷰 기준

### 1. TypeScript 타입 안전성

- `any` 타입 사용 여부 → 구체적인 타입이나 `unknown`으로 교체 제안
- Props 인터페이스 정의 누락 여부
- `as` 타입 단언 남용 여부
- 함수 반환 타입 명시 여부 (필요한 경우)

### 2. shadcn/ui 컴포넌트 컨벤션

- `cn()` 유틸리티 사용 여부 (클래스 병합 시 필수)
- CVA(Class Variance Authority) 패턴 적용 여부 (variant가 2개 이상일 때)
- Radix UI `asChild` 패턴 올바른 사용 여부
- `data-slot` 속성 누락 여부 (shadcn 컴포넌트에서 필요한 경우)

### 3. Tailwind CSS 정리

- 중복되거나 상충하는 클래스 여부 (예: `px-4 px-6`)
- `cn()` 없이 문자열 연결로 클래스 조합하는 패턴 → `cn()` 사용으로 교체
- 반응형 breakpoint 일관성 (`sm`, `md`, `lg` 순서)
- 다크 모드 클래스 누락 여부 (`dark:` 접두어)

### 4. Next.js 16 호환성

- **AGENTS.md 경고**: 이 프로젝트의 Next.js는 기존 버전과 다름 — deprecated API 주의
- `node_modules/next/dist/docs/` 가이드 기준으로 최신 API 사용 여부 확인
- `use client` / `use server` 지시어 올바른 위치 여부
- `metadata` export 방식이 App Router 규격에 맞는지 확인
- `Image`, `Link` 등 Next.js 내장 컴포넌트 올바른 사용 여부

### 5. 접근성(a11y) 기본 체크

- 버튼/링크에 `aria-label` 또는 텍스트 콘텐츠 존재 여부
- 이미지 `alt` 속성 누락 여부
- 폼 `<label>`과 `<input>` 연결 여부 (`htmlFor` / `id`)
- 키보드 접근 가능한 인터랙티브 요소 여부

## 출력 형식

각 기준별로 아래 형식으로 리포트:

```
## [기준명]
✅ 이상 없음  또는
⚠️ [문제 설명]
   현재 코드: ...
   수정 제안: ...
```

마지막에 **전체 요약** (몇 가지 문제, 우선순위 높은 항목)을 한 줄로 정리.
