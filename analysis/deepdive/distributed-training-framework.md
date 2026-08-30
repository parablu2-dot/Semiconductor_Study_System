---
id: distributed-training-framework
ch: 8
title: 분산 학습 프레임워크 (DeepSpeed·FSDP·Megatron)
appears_in: [8]
---

# 분산 학습 프레임워크 (DeepSpeed·FSDP·Megatron)

## 1. 현재 표준 — ZeRO가 만든 파라미터 shard 관행

DeepSpeed(ZeRO)·FSDP·Megatron-LM이 대형 모델 병렬화 관행을 만들었다. ZeRO 계열의 파라미터 shard, pipeline parallelism, tensor parallelism 자동화가 표준 관행으로 자리잡았고, PyTorch가 FSDP를 native로 흡수하면서 이 흐름이 통합되고 있다.

이 표준화는 [[mfu-utilization-gap]]에서 다룬 이론-실측 격차 중 통신·메모리 병목을 정면으로 겨냥한다 — 단일 GPU 메모리에 담을 수 없는 대형 모델을 여러 GPU에 나누는 것이 목적이지만, 나누는 방식(파라미터·옵티마이저 상태·그래디언트를 어떻게 분산할지)에 따라 통신량과 실효 처리량이 크게 달라진다.

## 2. 한계 — 자동 병렬 전략 탐색의 미완성

**자동 병렬 전략 탐색은 워크로드·클러스터 토폴로지·모델 구조마다 정답이 달라 여전히 수작업 튜닝을 완전히 대체하지 못한다.** Alpa가 병렬 전략을 자동 탐색하려 했지만, FSDP가 PyTorch native로 흡수된 이후에도 최상위 학습은 여전히 **Megatron-LM 스타일 수작업이 우세**하다는 것이 통설이다.

이는 [[ml-eda-automation]]에서 다룬 "좁은 최적화는 검증됐으나 넓은 자동화는 마케팅 단계"라는 패턴이 분산 학습 계층에서도 반복되는 사례다 — 특정 모델 구조·클러스터 규모에서의 자동 탐색은 성공하지만, 범용 자동화는 아직 달성되지 않았다.

## 3. 대안 후보

**Alpa류 자동 병렬 전략 탐색의 심화.** 탐색 공간을 형식화해 컴파일러가 최적 병렬화를 찾도록 하는 접근이지만, 탐색 시간 자체가 대형 모델에서는 비경제적으로 길어질 수 있다는 트레이드오프가 있다.

**ColossalAI 등 통합 프레임워크.** 여러 병렬화 기법(데이터·파이프라인·텐서·시퀀스 병렬)을 하나의 인터페이스로 통합해 수작업 튜닝 부담을 줄이려는 시도이지만, 여전히 사용자가 조합을 선택해야 한다.

**CXL fabric과의 결합.** [[cxl-memory-fabric]] 참조 — 메모리를 GPU 간에 명시적으로 공유·풀링해 파라미터 shard 자체의 필요성을 줄이려는 접근이 근본적으로 다른 방향의 대안이다.

## 4. 상위(되돌아가는) 영향

**통신 오버헤드가 아키텍처 계층에 in-network compute·switch 내부 reduction 지원을 요구한다** — MoE의 all-to-all 통신 병목이 아키텍처에 새로운 하드웨어 지원을 요구하는 대표 사례이며, 이는 [[memory-bandwidth-energy-wall]]에서 다룬 이중 상한과 직결된다.

**straggler·fault 문제가 아키텍처 계층에 결정론적 실행·gang scheduling·hardware-level fault isolation을 요구한다** — 대규모 분산 학습의 fault 빈도가 하이퍼스케일러 리포트에서 반복 확인되면서, 이 요구가 다음 세대 아키텍처 설계에 반영되는 압력으로 작용한다.

**분산 학습의 fault tolerance 요구가 패키징·회로 계층에 chiplet redundancy·HBM spare channel 확대를 요구한다** — [[chiplet]]·[[hbm]]에서 다룬 조합 수율 문제와 결합해, 분산 학습 규모가 커질수록 개별 부품의 결함 허용 설계가 더 중요해진다.
