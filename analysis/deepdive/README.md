# 소주제 심화 연구 진행 현황

`analysis/subtopics.json`의 42개 소주제를 대상으로, 계층(장) 하나씩 순서대로 심화 연구 문서를 작성한다.
문서는 `analysis/deepdive/<소주제id>.md` 하나당 하나. 대시보드 빌드에는 아직 연결하지 않음(연결은 별도 작업).

## 착수 전 결정 — 교차 소주제의 주 소속 계층

22개 교차 소주제(`appears_in.length > 1`)는 **한 번만 연구**하고 여러 계층에서 참조한다.
주 소속은 `subtopics.json`의 `ch` 필드로 이미 정해져 있다 — 이는 "처음 등장한 장(appears_in[0])"이 아니라
**그 개념의 물리적/개념적 근거가 실제로 사는 계층**을 previous 세션에서 편집 판단으로 정한 값이다.

확인 예시:
- `finfet-gaa-nanosheet`: appears_in=[1,2,3]이지만 ch=2(소자) — 구조 자체의 본체가 소자 계층이기 때문.
- `uvm-verification`: appears_in=[4,5]이지만 ch=5(설계방법론) — 검증 방법론의 본체가 설계방법론 계층이기 때문.
- `compute-in-memory`: appears_in=[2,6]이지만 ch=6(아키텍처) — PIM은 아키텍처 개념이고 ch2는 그 물성적 제약만 참조.
- `chiplet-ucie`: appears_in=[3,4,5,6,7,8], ch=4 — 6개 장에 걸치는 극단적 사례. "소주제"가 아니라
  "축을 관통하는 주제"로 별도 카테고리화가 필요할 수 있다는 이견이 있음(미결정, 리뷰 코멘트 유래).
  연구 자체는 ch4를 주 소속으로 진행하되, 문서 안에 다른 5개 장 관점을 모두 절로 나눠 담는다.

**규칙**: 연구는 `ch` 필드가 가리키는 계층 차례에서 1회 수행한다. 다른 장 차례가 와도 같은 id를 다시 연구하지 않고
기존 문서에 링크만 건다. 4번 문항("상위 계층 영향")은 교차 소주제의 경우 "교차 계층 영향"으로 이름을 바꿔
appears_in에 속한 모든 장과의 관계를 각각 문장으로 정리한다(이 세션 ch1 문서들 참조).

## 소주제 문서 구조 (장 단위 4문항의 소주제 버전)

```
## 1. 현재 표준(후보) — 이 소주제가 왜 지금 이 자리에 있는가
## 2. 한계 — 이 소주제 고유의 물리적·경제적 벽
## 3. 대안 후보 — 이 벽을 넘으려는 시도와 각자 못 푼 문제
## 4. 상위/교차 계층 영향 — 이 소주제의 한계가 다른 계층에 무엇을 강제하는가
```

장 단위 4문항과 다른 점: 질문이 "이 계층 전체에서 무엇이 표준인가"가 아니라
"이 구체적 기술/재료/구조가 왜 표준(후보)인가"로 좁혀진다. 그만큼 메커니즘·수치·경쟁 후보를 더 구체적으로 쓴다.
출처(sources)는 이번 라운드에서는 넣지 않는다 — 별도 남은 일(구현지시서 6-b 원칙에 따른 검증)로 분리되어 있다.

## 진행 현황

| 계층 | 소주제 수 | 완료 | 상태 |
|---|---|---|---|
| ch1 재료·물성 | 6 | 6 | ✅ 완료 (2026-08-30) |
| ch2 소자 | 5 | 0 | 다음 차례 |
| ch3 공정·계측 | 5 | 0 | 대기 |
| ch4 회로·IP | 6 | 0 | 대기 (chiplet-ucie 포함) |
| ch5 설계방법론 | 4 | 0 | 대기 |
| ch6 아키텍처 | 5 | 0 | 대기 |
| ch7 패키징·집적 | 5 | 0 | 대기 |
| ch8 시스템·SW | 6 | 0 | 대기 |

완료 표시는 `analysis/subtopics.json`의 `researched: true`로도 동일하게 추적한다.

### ch1 완료 문서 (6개)

- [si-crystal-channel.md](si-crystal-channel.md) — 실리콘 결정 채널
- [high-k-metal-gate-dielectric.md](high-k-metal-gate-dielectric.md) — HfO₂/Metal Gate 게이트 유전체
- [cu-low-k-interconnect.md](cu-low-k-interconnect.md) — Cu/Low-k 배선
- [monolayer-semiconductor-channel.md](monolayer-semiconductor-channel.md) — 2D 반도체 채널 (교차: ch1+ch2)
- [ferroelectric-gate-dielectric.md](ferroelectric-gate-dielectric.md) — 강유전 HfO₂ (교차: ch1+ch2)
- [iii-v-ge-channel.md](iii-v-ge-channel.md) — III-V·Ge 채널

## 다음 세션

ch2(소자) 5개 소주제 연구. 이 중 `finfet-gaa-nanosheet`·`cfet`·`dram-cell-vertical-stacking`은 교차 소주제이므로
ch1에서 이미 언급된 재료 제약을 전제로 놓고 "소자 구조" 관점만 새로 쓴다(재료 물성 재설명 금지 — 링크로 대체).
