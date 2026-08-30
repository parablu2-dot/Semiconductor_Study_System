---
id: compute-in-memory
ch: 6
title: Compute-in-Memory / PIM
appears_in: [2, 6]
cross_topic: true
primary_rationale: >
  데이터 이동 에너지 우회라는 아키텍처적 목적이 본체이므로 ch6을 주 소속으로 둔다.
  ch2는 RRAM/PCM 물성의 정밀도 한계라는 소자 계층 관점에서만 참조.
---

# Compute-in-Memory / PIM

## 1. 현재 표준(후보) — 데이터 이동을 0에 근접시키는 접근

Compute-in-Memory(CIM)는 [[memory-bandwidth-energy-wall]]에서 다룬 데이터 이동 에너지 상한을 겨냥한 가장 급진적인 대안이다. 아날로그 SRAM CIM(Mythic, 학계 다수), RRAM/PCM 기반 CIM(IBM 프로토타입, 학계), DRAM 셀 배열 자체에서 bit-line 연산을 수행하는 in-DRAM 계산이 대표 계보다. 별개로 니어 메모리 컴퓨팅(PIM, Processing-in-Memory)은 삼성 HBM-PIM(Aquabolt-XL 계열)·SK hynix AiM·UPMEM처럼 메모리 근접부에 별도 연산 유닛을 두는 방식으로, CIM(셀 배열 자체가 연산)과는 구분되는 절충 형태다.

원리적으로 CIM은 데이터 이동 에너지를 0에 근접시키고, 셀 배열의 아날로그 병렬성으로 MAC throughput을 극대화한다.

## 2. 한계 — 정밀도와 프로그래머 모델

미해결 문제는 세 가지다: (a) 아날로그 정밀도·잡음·드리프트로 인해 8-bit 이상의 정확도 확보가 어렵고, (b) 프로그래머 모델·컴파일러 스택이 미성숙하며, (c) [[analog-mixed-signal-design]]에서 다룬 방법론 편향(mixed-signal 스택 분리, formal 검증 부재)이 실리콘 실현을 지연시킨다.

정밀도 문제의 근원은 소자 계층에 있다 — RRAM/PCM 저항성 스위칭 소자 자체의 conductance state 제어가 아직 8-bit급 정밀도를 안정적으로 못 낸다. 상용 성공 사례는 아직 제한적이며, 학계 논문 성능과 실제 실리콘 성능의 격차가 논쟁 중이다.

PIM 쪽 한계는 다르다: (a) 표준화되지 않은 프로그래머 인터페이스(JEDEC HBM-PIM 표준화 진행 중이나 아직 광범위 채택 이전), (b) 호스트 CPU/GPU 워크로드 분할의 자동화 부재, (c) DRAM 공정 위에 로직을 얹는 밀도·수율의 제약이다.

## 3. 대안(비교) 후보

**PIM으로의 절충.** CIM의 정밀도 문제를 정면 돌파하는 대신, 셀 배열 자체는 손대지 않고 근접부에 디지털 연산 유닛을 두는 PIM이 현재 더 실용적인 경로로 자리잡고 있다. HBM-PIM의 성능 이득은 특정 워크로드(대규모 임베딩 룩업, LLM 디코딩 단계)에서 실증됐으나, general-purpose 적용성은 논쟁 중이다.

**혼합 정밀도 아날로그-디지털 하이브리드.** 아날로그 배열로 대략적 연산을 하고 디지털 보정 회로로 정밀도를 확보하는 접근이 연구 단계에서 진행 중이지만, 이는 CIM의 핵심 이점(완전 아날로그 병렬성)을 일부 포기하는 절충이다.

**뉴로모픽 아키텍처와의 결합.** [[wafer-scale-dataflow-architecture]]와 별개로, 스파이킹 뉴런 모델과 CIM을 결합하려는 시도가 저전력 엣지 도메인에서 진행 중이지만 킬러 애플리케이션이 좁다.

## 4. 상위/교차 계층 영향

**정밀도 미해결이 아키텍처 계층에서 CIM의 응용 범위를 저정밀 추론(엣지 AI)으로 제한한다** — 8-bit 이상 정밀도가 필요한 학습·고정밀 추론 워크로드에는 아직 적용 불가능하며, 이는 소자 계층의 물성 한계가 아키텍처 응용 범위를 직접 강제하는 사례다.

**표준화 부재가 회로·IP 계층에 커스텀 base die 설계 요구로 이어진다** — [[hbm]]에서 다룬 base die 커스텀화 흐름과 맞물려, PIM 로직을 얹은 base die는 표준 IP가 아니라 워크로드별 맞춤 설계가 되는 경향이 있다.

**방법론 편향(mixed-signal 스택 분리)이 CIM 실리콘화를 지연시킨다** — [[analog-mixed-signal-design]]에서 다룬 20년째 미완결인 unified mixed-signal signoff 문제가, CIM처럼 아날로그-디지털 co-optimization이 근본적으로 필요한 아키텍처의 상용화를 저해하는 직접적 원인이 된다.
