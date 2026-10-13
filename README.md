# Git/GitHub Practice

## 학습 목표
- Git의 기본 명령어 익히기
- GitHub 저장소 생성 및 관리
- 커밋과 푸시 과정 이해하기

## DORA 4대 지표 자동 수집

[`dora-metrics.yml`](.github/workflows/dora-metrics.yml)은 매주 월요일과 수동 실행 시
최근 7일의 **Lead Time, Deployment Frequency, MTTR, Change Failure Rate**를 GitHub
Deployments API에서 계산합니다. 실행 결과는 `dora-metrics.json`과 `weekly-report.md`
아티팩트로 90일간 보관됩니다. 수동 실행의 `window_days` 입력으로 측정 기간을 바꿀 수
있습니다.

### 대시보드 시안

Chart.js로 만든 정적 대시보드는 [`docs/dora-dashboard.html`](docs/dora-dashboard.html)에서
확인할 수 있습니다. 현재는 화면 예시용 데이터가 포함되어 있으며, Actions 아티팩트의
`dora-metrics.json`을 `data` 객체로 교체하면 실제 수치가 표시됩니다.

![DORA dashboard preview](docs/dora-dashboard-preview.svg)

지표 정의와 계산 기준도 JSON에 함께 기록해 재현성을 확보했습니다. Lead Time과 MTTR은
중앙값을 사용하며, Change Failure Rate는 실패·오류·취소된 배포를 모든 종료 배포로 나눈
값입니다.

## GitHub Projects 계획·추적

이슈 생성 시 다음 Issue Form을 사용하면 계획에 필요한 정보와 완료 조건을 일정한 형식으로
수집할 수 있습니다.

- [Bug 템플릿](.github/ISSUE_TEMPLATE/bug.yml): 재현 절차, 영향 범위, 실행 환경, 증거 자료,
  완료 조건
- [Feature 템플릿](.github/ISSUE_TEMPLATE/feature.yml): 문제 정의, 사용자 스토리, 범위,
  수용 기준, 릴리스 계획, 작업 분해

두 템플릿은 저장소에 해당 라벨이 존재할 경우 `type: bug` 또는 `type: feature` 라벨을
자동으로 붙입니다. GitHub Projects에서 이 라벨을 기준으로 Bug/Feature 보기를 나누고,
`priority` 응답(P0~P3)을 Priority 필드와
동기화하면 백로그 우선순위와 진행 상황을 함께 추적할 수 있습니다. 이슈의 상태는 Projects의
기본 Status 필드에서 `Todo → In Progress → Done`으로 관리합니다.