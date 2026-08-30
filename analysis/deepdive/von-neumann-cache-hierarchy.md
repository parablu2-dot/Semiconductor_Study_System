---
id: von-neumann-cache-hierarchy
ch: 6
title: 폰 노이만 코어 + 캐시 계층
appears_in: [6]
---

# 폰 노이만 코어 + 캐시 계층

## 1. 현재 표준 — 소프트웨어 생태계 연속성의 승리

레지스터 → L1/L2/L3 캐시 → 외부 DRAM으로 이어지는 다층 메모리 계층, MESI 계열 캐시 코히런스, out-of-order(OoO) speculative execution이 결합된 폰 노이만 코어 구조는 애플 M/A 시리즈부터 하이퍼스케일러 인하우스 실리콘까지 축을 가리지 않고 공통으로 채택돼 있다.

이 구조가 이긴 첫 번째 이유는 **프로그래머 모델의 연속성**이다. 순차 실행처럼 보이는 메모리 모델과, 하드웨어가 알아서 캐시·재정렬·투기실행을 처리하는 은폐 계층 덕분에 수십 년 축적된 소프트웨어 자산이 아키텍처 세대 교체를 넘어 살아남았다. 명시적 dataflow(Dennis·Arvind의 Monsoon), 명시적 병렬(Cray-style 벡터), 컴파일러 위임 정적 스케줄링(Itanium VLIW) 같은 경쟁 계보가 모두 이 지점에서 무너졌다. **Itanium의 실패는 흔히 "컴파일러가 예측 불가능한 메모리 지연을 감당하지 못했다"로 요약되지만, 더 근본적으로는 speculative OoO가 프로그래머로부터 그 문제를 완전히 숨겨 버렸다는 사실 자체가 승패를 결정했다.**

두 번째 이유는 [[uvm-verification]]·[[mmmc-ssta-signoff]]에서 확인한 방법론 강제와의 정합이다 — 사인오프가 감당 가능한 파티션 단위, 검증 재사용을 위한 대칭 구조를 "대칭 코어 반복 + 캐시 계층"이 자연스럽게 만족한다.

## 2. 한계 — 캐시 은폐가 언제까지 유효한가

캐시 계층이 "메모리 벽"을 은폐하는 데 여전히 성공적이라는 전제는 합의된 통설이지만, 은폐가 언제까지 유효한가는 논쟁이 있다. SPEC·MLPerf류 벤치마크에서 캐시 히트율이 여전히 90%대 후반을 유지하고, 프로그래머가 데이터 지역성을 명시하지 않아도 하드웨어 프리페처가 상당 부분을 흡수한다.

두 번째 한계는 캐시 코히런스 트래픽이 코어 수에 대해 비선형으로 증가한다는 것이다. MESI/MOESI/MESIF 계열의 스누프·디렉토리 프로토콜은 코어 수 수십~수백 규모에서는 감당 가능하지만, 그 위로 확장하려면 계층적 디렉토리·NUMA 도메인·부분 코히런스(coherent island) 같은 우회 구조를 도입해야 한다 — "flat coherence는 확장 불가능하다"는 전제 위에 AMD EPYC의 CCX/CCD 계층, 인텔의 mesh interconnect가 서 있다.

세 번째는 ILP 추출의 한계와 speculative execution의 보안 세금이다. 2010년대 중반 이후 issue width 확장의 성능 이득이 급감했고, Spectre/Meltdown(2018) 이후 speculative 경로 완화가 성능·전력 세금으로 정착됐다.

## 3. 대안 후보

**명시적 스코프 병렬 모델(CUDA·SYCL·HSA류).** flat cache coherence를 포기하고 명시적 메모리 스코프를 노출하는 방향으로, NVIDIA Hopper의 thread block cluster·async copy가 사례다. 미해결은 프로그래머 부담이 여전히 크고, general-purpose CPU와의 프로그래밍 모델 통합이 안 됐다는 것이다.

**Dataflow·wafer-scale 아키텍처.** [[wafer-scale-dataflow-architecture]] 참조 — 캐시 은폐 자체를 포기하고 정적 스케줄링으로 가는 정반대 접근이지만, general-purpose 워크로드에서는 열등하다.

**부분 코히런스(coherent island).** flat coherence 확장 한계를 우회하는 절충안으로, 어느 규모에서 명시적 비코히런스로 완전히 옮겨가야 하는지는 **논쟁 중**이다.

## 4. 상위 계층 영향

**캐시 은폐 모델의 지속이 패키징 계층에 대역폭·데이터 이동 에너지 문제의 최종 해결을 떠넘긴다** — 코어 구조 자체를 바꾸지 않는 한, [[memory-bandwidth-energy-wall]]에서 다룬 이중 상한은 아키텍처 계층 내부에서 풀리지 않고 HBM·2.5D 인터포저 같은 패키징 인프라로 위임된다.

**coherence 확장 한계가 chiplet 시대의 아키텍처 분할 방식을 제약한다** — [[chiplet-ucie]]에서 다이를 쪼갤 때, 코히런스 도메인 경계와 다이 경계를 일치시켜야 한다는 요구가 이 계층의 한계에서 직접 파생된다.

**speculative execution의 보안 세금이 회로·검증 계층에 반복적인 완화 설계 부담을 강제한다** — 새 speculative 취약점이 발견될 때마다 하드웨어 배리어·마이크로코드 패치가 필요해지며, 이는 [[uvm-verification]]의 검증 대상에 보안 속성 검증이라는 새 축을 추가한다.
