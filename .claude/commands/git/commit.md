---
description: "변경된 파일을 각각 분석하여 개별 커밋 메시지로 커밋합니다"
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(git log:*)
---

# Claude 명령어: Commit

변경된 파일을 각각 개별적으로 분석하여 이모지 컨벤셔널 커밋 메시지로 커밋합니다.

## 사용법

```
/commit
```

## 프로세스

1. `git status`로 변경된 파일 목록 전체 확인
2. 스테이지된 파일이 있으면 해당 파일만 대상으로 함, 없으면 모든 변경 파일 대상
3. **파일별로 각각** `git diff` 분석 → 변경 내용과 목적 파악
4. 파일마다 알맞은 이모지 + 타입 + 설명으로 개별 커밋 생성
5. 각 커밋은 `git add <파일>` → `git commit -m "<메시지>"` 순서로 실행

## 커밋 포맷

`<이모지> <타입>: <설명>`

**타입:**

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서화
- `style`: 포맷팅
- `refactor`: 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트
- `chore`: 빌드/도구

**규칙:**

- 명령형 어조 ("추가" not "추가됨")
- 첫 줄 72자 미만
- 원자적 커밋 (단일 목적)
- 관련 없는 변경사항 분할

## 이모지 맵

✨ feat | 🐛 fix | 📝 docs | 💄 style | ♻️ refactor | ⚡ perf | ✅ test | 🔧 chore | 🚀 ci | 🚨 warnings | 🔒️ security | 🚚 move | 🏗️ architecture | ➕ add-dep | ➖ remove-dep | 🌱 seed | 🧑‍💻 dx | 🏷️ types | 👔 business | 🚸 ux | 🩹 minor-fix | 🥅 errors | 🔥 remove | 🎨 structure | 🚑️ hotfix | 🎉 init | 🔖 release | 🚧 wip | 💚 ci-fix | 📌 pin-deps | 👷 ci-build | 📈 analytics | ✏️ typos | ⏪️ revert | 📄 license | 💥 breaking | 🍱 assets | ♿️ accessibility | 💡 comments | 🗃️ db | 🔊 logs | 🔇 remove-logs | 🙈 gitignore | 📸 snapshots | ⚗️ experiment | 🚩 flags | 💫 animations | ⚰️ dead-code | 🦺 validation | ✈️ offline

## 파일별 커밋 규칙

- 파일 하나당 커밋 하나 (원자적 커밋)
- 동일한 목적의 파일(예: 테스트 파일 + 구현 파일)은 함께 묶어도 됨
- 각 파일의 diff를 직접 읽고 변경 의도를 파악하여 설명 작성

## 참고사항

- 스테이지된 파일이 있으면 해당 파일만 커밋
- **파일마다 diff를 분석하여 개별 커밋 메시지 생성**
- **커밋에 Claude 서명 절대 추가하지 않음**
