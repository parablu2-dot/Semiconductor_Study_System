---
id: llm-serving-optimization
ch: 8
title: LLM 서빙 최적화 (vLLM·PagedAttention)
appears_in: [8]
---

# LLM 서빙 최적화 (vLLM·PagedAttention)

## 1. 현재 표준 — KV 캐시 단편화를 공략한 전환

서빙 계층에서는 [[mfu-utilization-gap]]과 격차의 성격이 다르다 — LLM 서빙의 병목은 **KV 캐시 메모리와 배치 균질성**이다. vLLM의 PagedAttention이 등장하기 전 서빙 스택은 GPU 메모리의 상당 부분을 KV 캐시 단편화로 낭비했고, 실측 처리량이 이론 상한 대비 20~30%에 머무는 사례가 흔했다.

**PagedAttention·continuous batching·speculative decoding** 같은 최근 기법이 격차를 좁혔다. PagedAttention은 운영체제의 가상 메모리 페이징 개념을 KV 캐시에 적용해 단편화를 해소했고, continuous batching은 요청마다 다른 시퀀스 길이를 동적으로 배치해 GPU 유휴 시간을 줄였다. vLLM은 오픈소스 사실상 표준으로 확산됐고, NVIDIA는 TensorRT-LLM으로 벤더 최적화 경로를 잡았다.

## 2. 한계 — 워크로드 특화의 한계

이론 상한에 도달했다고 보기는 어렵다는 것이 통설이다. 각 최적화가 워크로드 특화(긴 컨텍스트 vs 짧은 컨텍스트, 단일 vs 배치, greedy vs sampling)를 요구하고, **이론적으로 "모든 워크로드에 최적인 서빙 스택"은 아직 없다.** 최적화가 급속히 진행 중이라 **6개월 단위로 지형이 바뀐다**는 점이 이 계층의 특이한 불안정성이다.

speculative decoding은 draft 모델과 verify 모델을 동시 실행해 유효 처리량을 늘리지만, acceptance rate(draft 예측이 맞아떨어지는 비율)가 워크로드 의존적이라는 한계가 있다.

## 3. 대안 후보

**SGLang.** 구조화된 생성(structured generation)에 특화된 서빙 프레임워크로, 복잡한 프롬프트 프로그램(RAG, agent 파이프라인)에서 vLLM 대비 이점을 보고하지만, 범용성에서는 아직 vLLM만큼 확산되지 않았다.

**Confidential computing과의 결합.** [[cuda-programming-model]]과 별개로, 다중 테넌트 서빙 환경에서 AMD SEV-SNP·Intel TDX·NVIDIA Confidential Computing 같은 신뢰 경계 기술이 서빙 스택에 통합되는 흐름이 있지만, 성능 오버헤드(암호화·attestation)가 워크로드에 따라 10~30% 수준으로 인용된다.

**Serverless AI 추론.** Modal·RunPod·Together·Anyscale·Fireworks가 GPU를 함수 단위로 사용해 유휴 시간의 경제적 격차를 좁히려 하지만, cold start 지연(수 초~수십 초)·GPU sharing 오버헤드가 미해결이며 학습 세그먼트로의 확장은 실증되지 않았다.

## 4. 상위(되돌아가는) 영향

**KV 캐시 용량 압박이 패키징 계층에 HBM 스택 높이 확장(16-Hi 이상)을 요구한다** — [[hbm]]에서 다룬 스택 확장 로드맵이 서빙 계층의 컨텍스트 길이 증가 요구에서 직접 파생된다.

**서빙 지연 예산이 패키징 계층에 광 인터커넥트의 조기 상용화를 요구한다** — [[co-packaged-optics]] 참조, 서빙 스택의 지연 민감도가 패키지 내 광 통합의 경제적 정당화를 앞당긴다.

**speculative decoding이 아키텍처 계층에 이질 코어 스케줄링을 요구한다** — draft 모델과 verify 모델의 동시 실행이 요구되므로, 서로 다른 크기·정밀도의 코어를 하나의 스케줄링 체계로 관리하는 아키텍처 지원이 필요해진다.
