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
| ch2 소자 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch3 공정·계측 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch4 회로·IP | 6 | 6 | ✅ 완료 (2026-08-30, chiplet-ucie 포함) |
| ch5 설계방법론 | 4 | 4 | ✅ 완료 (2026-08-30) |
| ch6 아키텍처 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch7 패키징·집적 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch8 시스템·SW | 6 | 6 | ✅ 완료 (2026-08-30) |

**42/42 완료.** 완료 표시는 `analysis/subtopics.json`의 `researched: true`로도 동일하게 추적한다(전량 `true`).

### 전체 문서 목록 (계층순)

**ch1 재료·물성** — [si-crystal-channel](si-crystal-channel.md) · [high-k-metal-gate-dielectric](high-k-metal-gate-dielectric.md) · [cu-low-k-interconnect](cu-low-k-interconnect.md) · [monolayer-semiconductor-channel](monolayer-semiconductor-channel.md)(교차 ch1+ch2) · [ferroelectric-gate-dielectric](ferroelectric-gate-dielectric.md)(교차 ch1+ch2) · [iii-v-ge-channel](iii-v-ge-channel.md)

**ch2 소자** — [finfet-gaa-nanosheet](finfet-gaa-nanosheet.md)(교차 ch1+ch2+ch3) · [cfet](cfet.md)(교차 ch1+ch2+ch3) · [dram-cell-vertical-stacking](dram-cell-vertical-stacking.md)(교차 ch1+ch2+ch3) · [vertical-nand](vertical-nand.md)(교차 ch2+ch3) · [sram-cell](sram-cell.md)(교차 ch2+ch3+ch4)

**ch3 공정·계측** — [euv-lithography](euv-lithography.md) · [atomic-layer-process](atomic-layer-process.md) · [metrology-scatterometry](metrology-scatterometry.md) · [har-etching](har-etching.md) · [lithography-alternatives](lithography-alternatives.md)

**ch4 회로·IP** — [rtl-design-flow](rtl-design-flow.md)(교차 ch4+ch5) · [standard-cell-ip-reuse](standard-cell-ip-reuse.md) · [analog-mixed-signal-design](analog-mixed-signal-design.md)(교차 ch4+ch5) · [hls-high-level-synthesis](hls-high-level-synthesis.md)(교차 ch4+ch5) · [ml-eda-automation](ml-eda-automation.md)(교차 ch4+ch5) · [chiplet-ucie](chiplet-ucie.md)(극단 교차 ch3~ch8, 6개 장)

**ch5 설계방법론** — [uvm-verification](uvm-verification.md)(교차 ch4+ch5) · [mmmc-ssta-signoff](mmmc-ssta-signoff.md)(교차 ch3+ch5) · [open-source-eda](open-source-eda.md)(교차 ch4+ch5) · [hardware-emulation](hardware-emulation.md)

**ch6 아키텍처** — [von-neumann-cache-hierarchy](von-neumann-cache-hierarchy.md) · [memory-bandwidth-energy-wall](memory-bandwidth-energy-wall.md) · [compute-in-memory](compute-in-memory.md)(교차 ch2+ch6) · [wafer-scale-dataflow-architecture](wafer-scale-dataflow-architecture.md)(교차 ch6+ch7+ch8) · [logic-stack-hybrid-bonding](logic-stack-hybrid-bonding.md)(교차 ch3+ch6+ch7)

**ch7 패키징·집적** — [hbm](hbm.md)(교차 ch6+ch7+ch8) · [silicon-interposer](silicon-interposer.md)(교차 ch6+ch7) · [glass-interposer-substrate](glass-interposer-substrate.md) · [co-packaged-optics](co-packaged-optics.md)(교차 ch6+ch7+ch8) · [fan-out-mobile-packaging](fan-out-mobile-packaging.md)

**ch8 시스템·SW** — [cuda-programming-model](cuda-programming-model.md) · [pytorch-jax-framework](pytorch-jax-framework.md) · [mfu-utilization-gap](mfu-utilization-gap.md) · [distributed-training-framework](distributed-training-framework.md) · [llm-serving-optimization](llm-serving-optimization.md) · [cxl-memory-fabric](cxl-memory-fabric.md)(교차 ch6+ch7+ch8)

## 다음 단계 (착수 전 — 그림 작업)

소주제별 심화 연구(주 작업)가 42/42 완료됐다. 사용자 지시에 따라 **그림(층1 SVG 개념도 + 층2 외부 링크) 작업은 이번 세션에서 시작하지 않고 다음 세션으로 넘긴다.**

그림 착수 전 남은 선택지(다음 세션에서 결정):
1. `chiplet-ucie`를 "축을 관통하는 주제"로 별도 카테고리화할지 — [chiplet-ucie.md](chiplet-ucie.md) 하단에 미결정으로 표시해둠.
2. 출처(sources) 보강을 그림 작업 전/후 어느 시점에 넣을지 — 구현지시서 6-b 원칙(링크 확인 후에만 게재)에 따라 42개 문서 전체가 아직 출처 0건.
3. 층1 SVG 대상은 계층 8개 + 교차 소주제 22개로 이미 확정돼 있음(사용자 확정 사항) — 이번 42개 심화 문서가 그 SVG의 "경계 긋기" 내용 소스가 된다.
