# 소주제 심화 연구 진행 현황

`analysis/subtopics.json`의 43개 소주제(원래 42개 + chiplet-ucie 분리로 +1)를 대상으로, 계층(장) 하나씩
순서대로 심화 연구 문서를 작성한다. 문서는 `analysis/deepdive/<소주제id>.md` 하나당 하나.

**2026-08-30 chiplet-ucie 분리(사용자 지시).** "chiplet은 package, ucie는 IP"라는 판단에 따라
기존 6개 장 교차 극단 사례였던 `chiplet-ucie`를 [chiplet.md](chiplet.md)(ch7, 다이 물리 분할·조립 문제)와
[ucie.md](ucie.md)(ch4, D2D 인터페이스·IP 재사용 표준)로 나눴다. 다른 문서에 있던 `[[chiplet-ucie]]` 링크는
문맥에 따라 `[[chiplet]]` 또는 `[[ucie]]`로 전부 재배선했다.

## 착수 전 결정 — 교차 소주제의 주 소속 계층

22개 교차 소주제(`appears_in.length > 1`)는 **한 번만 연구**하고 여러 계층에서 참조한다.
주 소속은 `subtopics.json`의 `ch` 필드로 이미 정해져 있다 — 이는 "처음 등장한 장(appears_in[0])"이 아니라
**그 개념의 물리적/개념적 근거가 실제로 사는 계층**을 previous 세션에서 편집 판단으로 정한 값이다.

확인 예시:
- `finfet-gaa-nanosheet`: appears_in=[1,2,3]이지만 ch=2(소자) — 구조 자체의 본체가 소자 계층이기 때문.
- `uvm-verification`: appears_in=[4,5]이지만 ch=5(설계방법론) — 검증 방법론의 본체가 설계방법론 계층이기 때문.
- `compute-in-memory`: appears_in=[2,6]이지만 ch=6(아키텍처) — PIM은 아키텍처 개념이고 ch2는 그 물성적 제약만 참조.
- `chiplet`(ch7)·`ucie`(ch4): 원래 하나였던 6개 장 교차 극단 사례를 "무엇을 쪼개 어떻게 붙이는가"(패키징)와
  "그 이음매를 어떤 표준으로 규정하는가"(IP)로 분리했다 — chiplet은 물리적 다이 분할·조립(수율·KGD·재작업),
  ucie는 D2D 인터페이스 표준화(상호운용성·pJ/bit). 이 분리로 "축을 관통하는 주제" 별도 카테고리화 논의는
  해소됨(각자 정상적인 교차 소주제로 정리).

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
출처(sources)는 이 deepdive 문서들에는 넣지 않는다 — build.js가 실제로 파싱하는 `content/*.md`(장 문서)에
한정해 구현지시서 6-b 원칙(검증된 것만)으로 넣는다. 아래 "다음 단계" 절 참조.

## 진행 현황

| 계층 | 소주제 수 | 완료 | 상태 |
|---|---|---|---|
| ch1 재료·물성 | 6 | 6 | ✅ 완료 (2026-08-30) |
| ch2 소자 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch3 공정·계측 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch4 회로·IP | 6 | 6 | ✅ 완료 (2026-08-30, ucie 포함) |
| ch5 설계방법론 | 4 | 4 | ✅ 완료 (2026-08-30) |
| ch6 아키텍처 | 5 | 5 | ✅ 완료 (2026-08-30) |
| ch7 패키징·집적 | 6 | 6 | ✅ 완료 (2026-08-30, chiplet 포함) |
| ch8 시스템·SW | 6 | 6 | ✅ 완료 (2026-08-30) |

**43/43 완료.** 완료 표시는 `analysis/subtopics.json`의 `researched: true`로도 동일하게 추적한다(전량 `true`).

### 전체 문서 목록 (계층순)

**ch1 재료·물성** — [si-crystal-channel](si-crystal-channel.md) · [high-k-metal-gate-dielectric](high-k-metal-gate-dielectric.md) · [cu-low-k-interconnect](cu-low-k-interconnect.md) · [monolayer-semiconductor-channel](monolayer-semiconductor-channel.md)(교차 ch1+ch2) · [ferroelectric-gate-dielectric](ferroelectric-gate-dielectric.md)(교차 ch1+ch2) · [iii-v-ge-channel](iii-v-ge-channel.md)

**ch2 소자** — [finfet-gaa-nanosheet](finfet-gaa-nanosheet.md)(교차 ch1+ch2+ch3) · [cfet](cfet.md)(교차 ch1+ch2+ch3) · [dram-cell-vertical-stacking](dram-cell-vertical-stacking.md)(교차 ch1+ch2+ch3) · [vertical-nand](vertical-nand.md)(교차 ch2+ch3) · [sram-cell](sram-cell.md)(교차 ch2+ch3+ch4)

**ch3 공정·계측** — [euv-lithography](euv-lithography.md) · [atomic-layer-process](atomic-layer-process.md) · [metrology-scatterometry](metrology-scatterometry.md) · [har-etching](har-etching.md) · [lithography-alternatives](lithography-alternatives.md)

**ch4 회로·IP** — [rtl-design-flow](rtl-design-flow.md)(교차 ch4+ch5) · [standard-cell-ip-reuse](standard-cell-ip-reuse.md) · [analog-mixed-signal-design](analog-mixed-signal-design.md)(교차 ch4+ch5) · [hls-high-level-synthesis](hls-high-level-synthesis.md)(교차 ch4+ch5) · [ml-eda-automation](ml-eda-automation.md)(교차 ch4+ch5) · [ucie](ucie.md)(교차 ch4+ch5+ch7)

**ch5 설계방법론** — [uvm-verification](uvm-verification.md)(교차 ch4+ch5) · [mmmc-ssta-signoff](mmmc-ssta-signoff.md)(교차 ch3+ch5) · [open-source-eda](open-source-eda.md)(교차 ch4+ch5) · [hardware-emulation](hardware-emulation.md)

**ch6 아키텍처** — [von-neumann-cache-hierarchy](von-neumann-cache-hierarchy.md) · [memory-bandwidth-energy-wall](memory-bandwidth-energy-wall.md) · [compute-in-memory](compute-in-memory.md)(교차 ch2+ch6) · [wafer-scale-dataflow-architecture](wafer-scale-dataflow-architecture.md)(교차 ch6+ch7+ch8) · [logic-stack-hybrid-bonding](logic-stack-hybrid-bonding.md)(교차 ch3+ch6+ch7)

**ch7 패키징·집적** — [chiplet](chiplet.md)(교차 ch3+ch6+ch7+ch8) · [hbm](hbm.md)(교차 ch6+ch7+ch8) · [silicon-interposer](silicon-interposer.md)(교차 ch6+ch7) · [glass-interposer-substrate](glass-interposer-substrate.md) · [co-packaged-optics](co-packaged-optics.md)(교차 ch6+ch7+ch8) · [fan-out-mobile-packaging](fan-out-mobile-packaging.md)

**ch8 시스템·SW** — [cuda-programming-model](cuda-programming-model.md) · [pytorch-jax-framework](pytorch-jax-framework.md) · [mfu-utilization-gap](mfu-utilization-gap.md) · [distributed-training-framework](distributed-training-framework.md) · [llm-serving-optimization](llm-serving-optimization.md) · [cxl-memory-fabric](cxl-memory-fabric.md)(교차 ch6+ch7+ch8)

## 2026-08-30 진행 순서 — 전부 완료

사용자 지시: "3번(chiplet/UCIe)은 정리했고, 출처는 확실한 것만 연결, 그림은 간단하게, 대시보드는 이 셋을 정리하고 진행."

1. ✅ chiplet-ucie 분리 — [chiplet.md](chiplet.md)(ch7)·[ucie.md](ucie.md)(ch4)로 분리, 14개 문서 링크 재배선(커밋 `9d88220`).
2. ✅ 출처(sources) — `content/*.md` 8장에 WebSearch로 실존을 확인한 출처 14건 추가(구현지시서 6-b 원칙, 커밋 `9125c0d`).
   미확인 수치·주장은 신지 않음. 부수 효과로 ch5의 "ISPD 2022" 오기를 실제 발행 연도 "ISPD 2023"으로 정정.
3. ✅ 그림 — `figures/ch1.svg`~`ch8.svg` 층1 개념도 8장 제작(경계 긋기, 팔레트 고정, 수치 없음, 라벨 6단어 이내,
   커밋 `ad382ee`). 발행 전 실제 `.figure` 컴포넌트 스타일로 재현한 검수 페이지를 아티팩트로 공유해 사용자 확인 받음.
4. ✅ 대시보드 — `npm run build`로 `docs/data.json` 재생성(8장 전부 출처+그림 포함 확인), push 완료.

**남은 범위 밖 항목**: 교차 소주제 23개(chiplet·ucie 포함)용 층1 SVG는 이번 라운드에 포함하지 않음 — 8개 장
개념도가 우선순위였고, 교차 소주제 그림은 다음 라운드 대상. 소주제 deepdive 43개 자체에 출처를 넣는 것도
범위 밖 — build.js가 실제로 읽는 `content/*.md`(장 문서)에만 이번 출처 작업을 한정했다.
