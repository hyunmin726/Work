# Contributing

프로젝트 개선에 참여해 주셔서 감사합니다. 이 문서는 기능 개발, 문서 수정, 버그 수정을
위한 기본 작업 방식을 안내합니다.

## 개발 환경

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Visualization: Chart.js
- 저장소: 별도 데이터베이스 없음
- 클라이언트 저장소: 브라우저 `localStorage`

## 시작하기

1. 저장소를 fork하거나 작업 권한이 있는지 확인합니다.
2. `main` 브랜치에서 작업 브랜치를 생성합니다.

```bash
git switch main
git pull origin main
git switch -c feature/short-description
```

3. 변경 사항을 구현합니다.
4. 브라우저에서 관련 HTML 파일을 직접 열어 동작을 확인합니다.
5. 변경 사항을 커밋하고 원격 브랜치에 push합니다.

## 브랜치 이름

브랜치 이름은 변경 목적을 알 수 있도록 다음 접두사를 사용합니다.

- `feature/`: 새로운 기능
- `fix/`: 버그 수정
- `docs/`: 문서 변경
- `refactor/`: 동작 변경 없는 구조 개선

예시:

```text
feature/study-record
fix/grade-prediction-validation
docs/update-contributing
```

## 커밋 메시지

커밋 메시지는 `type: description` 형식을 사용합니다.

```text
feat: add study record management
fix: validate assessment weights
docs: add contribution guide
refactor: simplify record rendering
```

제목은 변경 내용을 간결한 영어 문장으로 작성하고, 하나의 커밋에는 하나의 논리적인
변경만 포함하는 것을 권장합니다.

## 코드 변경 가이드

- 기존 정적 HTML, CSS, Vanilla JavaScript 구조를 우선적으로 따릅니다.
- 브라우저에서 직접 실행할 수 있어야 하며 별도 서버나 데이터베이스를 전제로 하지 않습니다.
- 사용자 입력은 DOM API를 사용해 안전하게 렌더링하고, `innerHTML`을 사용할 때는
  신뢰할 수 없는 값을 그대로 삽입하지 않습니다.
- 학습 기록 데이터와 연동하는 기능은 기존 `localStorage` 키와 데이터 구조를 확인합니다.
- 기능에 직접 관련된 문서가 있다면 함께 업데이트합니다.
- 사용하지 않는 라이브러리나 빌드 도구는 추가하지 않습니다.

## 테스트 및 확인

자동화된 테스트 도구가 없는 정적 페이지는 다음 항목을 브라우저에서 확인합니다.

- 정상 입력과 빈 입력 처리
- 저장, 수정, 삭제 동작
- 검색·필터·통계 또는 계산 결과
- 잘못된 입력에 대한 안내
- 새로고침 후 `localStorage` 데이터 유지
- 모바일 화면에서의 기본 레이아웃

변경 전후에 `git diff --check`를 실행해 공백 오류도 확인합니다.

## Pull Request

Pull Request에는 다음 내용을 포함합니다.

- 변경 목적과 주요 변경 사항
- 사용자가 경험하는 동작 변화
- 테스트 또는 브라우저 검증 결과
- 리뷰어가 확인할 사항
- 관련 이슈나 선행 PR

작은 단위의 PR을 만들고, 기능 구현과 무관한 변경은 별도 PR로 분리합니다. 리뷰 의견이
반영되면 변경 내용을 추가 커밋으로 push하고 PR 설명을 최신 상태로 유지합니다.

## Issue와 리뷰

기능 제안은 `.github/ISSUE_TEMPLATE/feature.yml`, 버그 제보는
`.github/ISSUE_TEMPLATE/bug.yml`을 사용합니다. 리뷰 의견은 재현 가능한 문제와 영향,
개선 방향을 함께 작성하고, 병합을 막아야 하는 경우 `MUST`, 권장 사항은 `SHOULD`로
표시합니다.
