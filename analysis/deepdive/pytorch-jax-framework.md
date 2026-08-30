---
id: pytorch-jax-framework
ch: 8
title: PyTorch/JAX 프레임워크
appears_in: [8]
---

# PyTorch/JAX 프레임워크

## 1. 현재 표준 — 디버깅 경험이 만든 2018~2020년 전환

PyTorch가 TensorFlow를 밀어낸 사건은 2018~2020년 사이에 실증됐다. **동적 그래프의 Pythonic 디버깅 경험**이 연구자 채택을 끌었고, HuggingFace transformers를 중심으로 한 모델 저장소 생태계가 사실상 표준 인터페이스가 됐다. TensorFlow는 프로덕션 배포 도구(TF Serving, TFLite)에서 앞섰지만 연구 단계에서의 패배가 프로덕션까지 파급됐다.

JAX는 XLA 컴파일러의 함수형 프로그래밍 모델로 연구 커뮤니티(특히 Google DeepMind 주변)와 대형 학습(구글 TPU 세대) 세그먼트에서 세를 유지하지만, 범용 프레임워크로서의 지분은 PyTorch에 밀린다.

## 2. 한계 — 동적 그래프와 컴파일 최적화의 긴장

PyTorch의 동적 그래프(eager execution)는 디버깅에는 유리하지만, [[mfu-utilization-gap]]에서 다룬 이론-실측 격차를 좁히려면 컴파일 최적화(kernel fusion, operator scheduling)가 필요하다. torch.compile이 이 긴장을 해소하려는 시도이지만, 워크로드마다 최적 스케줄이 달라 완전 자동화는 여전히 미완성이며, 수작업 커널(FlashAttention, PagedAttention)이 격차를 좁혀왔다는 것이 실증적 사실이다.

JAX의 함수형 모델은 컴파일 최적화에는 유리하지만, PyTorch만큼의 디버깅 편의성을 제공하지 못해 광범위한 연구자 채택으로 이어지지 못했다 — 이는 두 프레임워크가 정반대 트레이드오프를 택한 결과다.

## 3. 대안 후보

**MLIR 계열 컴파일러(XLA·IREE·Mojo).** 프론트엔드(TensorFlow·JAX·PyTorch)와 백엔드(CPU·GPU·TPU·NPU) 사이에 공통 IR을 두어 벤더 파편화를 흡수하는 것이 목표다. XLA는 TPU 백엔드에서 실증됐고, IREE는 모바일·엣지에서 진행 중이다. 미해결은 벤더 백엔드 성숙도 편차와 프론트엔드 파편화(각 프레임워크가 자기 IR을 갖는 상황)다. Mojo(Modular)가 Python 호환 시스템 언어로 이 문제를 정면 공략 중이지만 상용 채택은 초기 단계다.

**Dataflow SW 스택으로의 이탈.** [[wafer-scale-dataflow-architecture]]에서 다룬 Cerebras·Groq·SambaNova의 SDK는 PyTorch/JAX 프론트엔드를 유지하면서 백엔드만 다른 실행 모델로 바꾸는 접근이지만, 워크로드 마이그레이션 비용이 여전히 크다.

## 4. 상위(되돌아가는) 영향

**프레임워크 컴파일러 백엔드가 벤더 하드웨어에 종속되는 방식으로 파편화가 잠금된다** — [[cuda-programming-model]]과 결합해, torch inductor·XLA가 특정 벤더 백엔드에 최적화되면서 새 하드웨어 벤더의 시장 진입 장벽을 만든다.

**컴파일러 autotuning의 한계가 회로·IP 계층에 "손코딩 커널이 여전히 필요하다"는 현실을 되돌려보낸다** — FlashAttention·PagedAttention 같은 수작업 최적화가 계속 필요하다는 사실은, [[ml-eda-automation]]에서 다룬 "좁은 최적화는 검증됐으나 넓은 자동화는 마케팅 단계"라는 패턴이 소프트웨어 계층에서도 반복됨을 보여준다.

**분산 학습 프레임워크와의 통합이 아키텍처 요구로 이어진다** — PyTorch가 FSDP를 native로 흡수하면서([[distributed-training-framework]] 참조) 프레임워크 계층의 표준화가 분산 계층의 표준화를 견인하는 방향으로 작동한다.
