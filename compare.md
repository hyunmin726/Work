# CI 최적화 전후 비교 리포트

## 1. 비교 목적

CI 파이프라인의 실행 환경과 재사용성을 개선하고, npm 캐싱이 설치 시간에 미치는
효과를 수치로 확인한다.

## 2. 최적화 전

| 항목 | 기존 구성 |
|---|---|
| 실행 환경 | Ubuntu, Node.js 20 단일 조합 |
| 파이프라인 | Lint/Test 단일 job |
| 의존성 설치 | job마다 `npm ci` 실행 |
| 캐시 측정 | 없음 |
| 아티팩트 | 단일 Build/Test 흐름에서만 사용 |
| 배포 조건 | 모든 실행에서 Deploy 단계 대상 |
| 재사용성 | workflow 내부에 단계가 직접 작성됨 |

### 기존 문제

- Ubuntu와 Node.js 20 외의 환경에서 발생하는 호환성 문제를 확인하기 어려웠다.
- 캐시 적용 전후의 실행 시간 차이를 확인할 수 없었다.
- Build, Test, Deploy 단계의 공통 설정이 중복될 가능성이 있었다.
- 문서나 설정 파일만 변경된 경우에도 배포 단계가 실행될 수 있었다.

## 3. 최적화 후

| 항목 | 최적화 구성 |
|---|---|
| 실행 환경 | Ubuntu·Windows·macOS × Node.js 20·22·24 |
| 파이프라인 | `Build → Test → Deploy` 의존성 |
| 재사용 workflow | `reusable-node-checks.yml` |
| 재사용 action | `.github/actions/node-quality` |
| 캐시 측정 | cold install과 warm install 비교 |
| 결과 보고 | 조합별 결과와 평균 개선률을 Actions Summary에 표시 |
| 아티팩트 | Build 결과 다운로드 후 Deploy용 아티팩트 재생성 |
| 선택적 배포 | `main` push이며 배포 대상 파일이 변경된 경우에만 실행 |

### 캐시 측정 방식

각 OS·Node.js 조합에서 다음 순서로 측정한다.

1. npm 캐시를 비운다.
2. `npm ci`를 실행하고 `cold install` 시간을 기록한다.
3. `node_modules`를 제거한다.
4. 동일한 환경에서 `npm ci`를 다시 실행하고 `warm install` 시간을 기록한다.

개선률은 다음 식으로 계산한다.

```text
개선률(%) = (cold install 시간 - warm install 시간)
            / cold install 시간 × 100
```

개선률이 양수이면 캐시 사용 후 빨라진 것이며, 음수이면 해당 실행에서 캐시 효과가
없었거나 warm install이 더 오래 걸린 것이다.

## 4. 측정 결과

실제 수치는 GitHub Actions의 `Report cache improvement` job이 생성하는 Summary와
`benchmark-*` 아티팩트의 `timing.json`에서 확인한다.

| 실행 조합 | Cold install | Warm install | 개선률 |
|---|---:|---:|---:|
| Ubuntu / Node 20 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| Ubuntu / Node 22 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| Ubuntu / Node 24 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| Windows / Node 20 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| Windows / Node 22 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| Windows / Node 24 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| macOS / Node 20 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| macOS / Node 22 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| macOS / Node 24 | Actions 측정값 | Actions 측정값 | Actions 측정값 |
| **평균** | **Actions 측정값** | **Actions 측정값** | **Actions 측정값** |

## 5. 기대 효과

- 여러 OS와 Node.js 버전에서의 호환성 문제를 조기에 발견할 수 있다.
- 공통 작업을 Reusable Workflow와 Composite Action으로 관리해 수정 지점을 줄인다.
- 캐시 적용 효과를 감이 아닌 실행 시간과 개선률로 확인할 수 있다.
- 변경 파일과 브랜치 조건을 기반으로 불필요한 배포를 줄인다.
- Build 산출물을 Test와 Deploy에서 재사용해 단계 간 결과 일관성을 높인다.

## 6. 해석 시 주의사항

- GitHub-hosted runner의 상태, 네트워크, npm registry 응답에 따라 실행 시간은 달라질 수 있다.
- 단일 실행값보다 동일 조합의 여러 실행에서 관찰되는 평균과 추세를 우선한다.
- 캐시 개선률이 음수인 경우에도 실패로 단정하지 않고, 캐시 적중 여부와 실행 로그를
  함께 확인한다.
