---
id: chiplet
ch: 7
title: Chiplet (다이 분할)
appears_in: [3, 6, 7, 8]
cross_topic: true
primary_rationale: >
  다이를 물리적으로 쪼개 조립하는 것 자체가 패키징 계층의 실현 문제이므로 ch7을 주 소속으로 둔다.
  ch3은 강제된 원인(수율·다이크기 상한), ch6은 아키텍처 파티션 관점, ch8은 되돌아가는 개방성
  요구 관점에서만 참조. 인터페이스 표준(UCIe) 자체는 [[ucie]]로 분리했다 — chiplet은 "무엇을
  쪼개 어떻게 물리적으로 붙이는가"의 패키징 문제, UCIe는 "그 이음매를 어떤 표준으로 규정하는가"의
  IP·인터페이스 문제로 구분한다(2026-08-30 사용자 지시로 chiplet-ucie.md에서 분리).
---

# Chiplet (다이 분할)

## 1. 현재 표준 — 강제된 분할

Chiplet(다이 분할)은 산업이 선택한 것이 아니라 **강제된 결과**다. 대형 monolithic 다이는 defect Poisson 통계상 면적이 커질수록 수율이 지수적으로 떨어지고, [[euv-lithography]]의 High-NA half-field(26×16.5mm)를 넘는 다이는 stitching 없이 한 번에 노광될 수 없다. 이 두 물리적 벽이 겹치면서 대형 SoC는 물리적으로 분할 외 선택지가 없어졌다.

분할이 강제되자, 아키텍처 계층은 이를 적극적으로 활용하는 방향으로 진화했다. AMD Zen/EPYC의 CCD-IOD 분리, Instinct MI300의 CPU+GPU+HBM 통합, Intel Meteor Lake·Ponte Vecchio의 타일 구성, Apple M1 Ultra의 UltraFusion, NVIDIA Blackwell의 dual-die가 이미 상용 지배 트렌드로 자리잡은 사례들이다 — "필요한 accelerator die만 골라 붙이는" chiplet 조합이 이질 통합의 지배 패턴이 됐다.

## 2. 한계 — 물리적 조립의 벽

패키징 계층 관점에서 chiplet의 한계는 순수하게 "여러 다이를 하나로 묶는" 조립 문제로 나타난다. (i) **KGD(Known-Good-Die) 시험 커버리지** — 조립 후 패키지 시험만으로는 조합 수율(각 다이 수율의 곱)의 손실을 감당할 수 없다. 각 다이 수율이 95%일 때 10개 다이 조합의 수율은 60%까지 떨어지므로, 조립 전 개별 다이 시험이 조합 수율의 지배 인자가 된다. (ii) **재작업(rework) 불가능성** — 하나의 다이가 조립 후 불량으로 판정되면 인터포저 위의 여러 다이 전체가 폐기 대상이 되며, 각 다이가 개별적으로 고가이기 때문에 폐기 비용이 크다. (iii) **이질 다이의 열·전력 동시 관리** — 서로 다른 공정 노드(N3·N5·N7 혼재)·전력 밀도·열 프로파일을 하나의 패키지 안에서 동시에 감당해야 한다.

## 3. 대안 후보

**소켓형 chiplet·detachable HBM.** 재작업 가능성을 부분적으로 보장하려는 시도이지만, μbump·hybrid bonding의 물리적 접합과 상충해 아직 상용화되지 않았다.

**Panel-level packaging(PLP).** [[fan-out-mobile-packaging]]에서 다룬 대로, 대형 패널 단위로 다이를 조립해 단위 다이당 비용을 낮추려는 접근이지만 warpage·정렬 정밀도가 미해결이다.

**웨이퍼-스케일 집적(WSI)으로의 반례.** [[wafer-scale-dataflow-architecture]] 참조 — chiplet이 강제된 이유(수율 저하)를 정면으로 거스르는 선택지로, 다이 분해 대신 웨이퍼 전체를 하나의 시스템으로 쓰는 접근이 특정 세그먼트에서 경쟁한다.

## 4. 교차 계층 영향

**ch3(공정·계측) 관점 — 원인.** High-NA EUV half-field가 만드는 다이 크기 상한과 대형 다이의 수율 저하가 chiplet을 "선택이 아니라 강제 사항"으로 만든다.

**ch6(아키텍처) 관점 — 상용 지배 트렌드.** chiplet 기반 아키텍처 분할은 이미 상용 지배 트렌드다. dark silicon과 이질 통합 지배가 이 분할을 강제하며, coherence 확장 한계([[von-neumann-cache-hierarchy]] 참조)가 다이 경계와 코히런스 도메인 경계를 일치시켜야 한다는 제약을 만든다.

**ch8(시스템·SW) 관점 — 되돌아가는 요구.** 벤더 다변화·자체 SoC 흐름이 chiplet 물리적 조합의 개방성(서로 다른 벤더 다이를 자유롭게 섞어 조립) 확대를 요구로 되돌려보낸다 — 다만 이 개방성은 물리적 조립·KGD 인증 인프라의 문제이지, 인터페이스 표준 자체의 문제는 [[ucie]]로 분리해서 본다.

인터페이스·프로토콜 표준화(UCIe 사양, D2D PHY)는 이 문서의 범위가 아니다 — [[ucie]] 참조.
