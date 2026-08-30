---
id: mfu-utilization-gap
ch: 8
title: MFU (이론-실측 활용률 격차)
appears_in: [8]
---

# MFU (이론-실측 활용률 격차)

## 1. 현재 표준(현상) — 좁혀지지 않는 구조적 괴리

벤더 데이터시트의 이론 FLOPS·대역폭과 실제 워크로드가 뽑아내는 유효 처리량 사이에는 지속적이고 좁혀지지 않는 격차가 있다. **MFU(Model FLOPs Utilization)**가 대표 지표다 — 대형 LLM 학습에서 MFU 50%는 매우 잘 튜닝된 수치, 30~40%가 일반적이라는 것이 2022~2024년 학습 리포트들의 통설이다. Google PaLM 논문이 자체 스택에서 46% MFU를 인용했고, Megatron-LM·MosaicML·NVIDIA의 후속 리포트가 40~55% 범위를 보고했다. NVIDIA H100의 이론 989 TFLOPS(FP16)에 대응하는 실측 유효 처리량은 학습에서 300~500 TFLOPS/GPU 수준이 자주 보고된다.

**하이엔드 accelerator TCO의 절반 이상이 이론상으로는 "쓰지 못하는 성능"에 지불되고 있다**는 것이 이 격차의 물리·경제적 함의다.

## 2. 한계 — 원인의 계층별 분해

격차의 원인은 여섯 갈래로 분해된다. (i) **메모리 대역폭 병목** — LLM decoding처럼 산술 강도가 낮은 워크로드는 roofline 모델상 반드시 메모리 bound이며, H100 SXM의 3.35TB/s HBM3에서 실측 이용률은 60~80% 수준이 자주 인용된다. (ii) **커널 런치 오버헤드와 파이프라인 버블** — 짧은 커널이 많은 워크로드에서 GPU가 유휴 상태에 있는 시간이 무시할 수 없다. (iii) **collective communication overhead** — NVLink·NVSwitch 이론 대역폭 대비 NCCL AllReduce·AllGather 실측 이용률은 60~85% 범위다. (iv) **straggler 문제** — 수천 GPU 동기 학습에서 한 노드의 지연이 전체 step 시간을 결정한다. (v) **precision cast·quantization overhead** — FP8·FP4 저정밀 유닛의 이론 처리량을 실측에서 뽑기 어렵다. (vi) **컴파일러 autotuning의 한계** — [[pytorch-jax-framework]]에서 다룬 대로 완전 자동화가 미완성이다.

**통설과 논쟁의 구분**: 격차의 존재와 원인 분해는 통설이다. 논쟁은 (a) 근본 원인의 책임 소재(하드웨어 vs 소프트웨어 vs 워크로드 특성), (b) 소프트웨어 성숙만으로 어디까지 좁혀질 수 있는가, (c) MoE·sparsity 도입으로 "이론 FLOPS" 정의 자체가 흔들린다는 지적이다.

## 3. 대안 후보 — 격차를 좁히려는 다중 경로

**서빙 계층.** [[llm-serving-optimization]] 참조 — PagedAttention·continuous batching·speculative decoding이 서빙 단계의 격차(KV 캐시 단편화·배치 균질성)를 공략한다.

**분산 계층.** [[distributed-training-framework]] 참조 — ZeRO·FSDP·Alpa가 통신 오버헤드와 자동 병렬 전략 탐색을 공략한다.

**메모리 fabric 계층.** [[cxl-memory-fabric]] 참조 — switch·pooling으로 메모리 병목 자체를 재구조화하려는 접근.

**하드웨어·소프트웨어 공동 재설계.** [[wafer-scale-dataflow-architecture]]가 SIMT를 버리고 다른 실행 모델로 격차를 좁히려는 급진적 시도다.

**알고리즘 계층.** MoE·speculative decoding처럼 워크로드 자체를 바꿔 격차를 우회하는 접근이지만, MoE의 all-to-all 통신이 새로운 병목을 만든다는 점에서 격차를 다른 형태로 이전시킬 뿐이라는 지적도 있다.

**요약**: 어느 하나가 통합 표준이 될 것이라는 합의는 없다. 여러 대안이 병렬로 진행되고, 각자가 좁힌 격차의 합이 산업의 실측 활용률을 결정할 것이라는 다중 경로 시나리오가 현재의 통설이다.

## 4. 상위(되돌아가는) 영향 — 사슬을 닫는 되먹임

**이 격차가 패키징 계층에 HBM 스택 수 증가·D2D 대역폭 세대 상승·co-packaged optics 조기 상용화를 요구한다** — MFU 개선의 대부분이 메모리·통신 대역폭 병목 해소에서 나오므로, [[hbm]]·[[co-packaged-optics]]의 로드맵이 이 요구에 종속된다.

**이 격차가 아키텍처 계층에 KV 캐시 전용 하드웨어·저정밀 유닛 다양화를 요구한다** — [[memory-bandwidth-energy-wall]]에서 다룬 이중 상한 대응 로드맵의 우선순위가 이 격차의 원인 분해에 따라 정해진다.

**이 격차가 자체 SoC(Trainium·TPU·Maia) 흐름의 재정적 정당화가 된다** — MFU 40%라는 것은 곧 TCO의 60%가 소각된다는 뜻이며, "동일 이론 FLOPS에서 실측 활용률이 더 높은 스택"을 향한 벤더 다변화 압력이 이 지표에서 직접 파생된다.
