---
id: dram-cell-vertical-stacking
ch: 2
title: DRAM 셀 (1T1C → 3D DRAM)
appears_in: [1, 2, 3]
cross_topic: true
primary_rationale: >
  셀 토폴로지(pillar vs 수평 stacked cell) 자체가 소자 구조 문제이므로 ch2를 주 소속으로 둔다.
  ch1은 유전상수 한계가 강제한 배경만, ch3은 HAR 에칭·3D 계측 요구만 참조.
---

# DRAM 셀 (1T1C → 3D DRAM)

## 1. 현재 표준 — pillar 커패시터로 버티는 1T1C

1T1C(트랜지스터 1개 + 커패시터 1개) 셀은 1970년대에 표준으로 굳었지만, 지금까지 살아남은 이유는 재료층 제약([[high-k-metal-gate-dielectric]] 참조 — HfO₂ 유전상수 상한 ~25)이 평면 커패시터로는 충분한 정전용량을 벌어주지 못하기 때문에 산업이 강제로 택한 우회다. 산업은 **커패시터를 수직으로 세우고 aspect ratio를 60:1 이상으로 밀어붙이는 pillar/trench 구조**로 대응해 왔고, 여기에 buried word line(BWL)을 더해 워드라인 저항·기생 커패시턴스를 함께 관리하는 것이 현재 표준 구성이다.

경쟁 후보였던 1T DRAM(플로팅 바디 방식, 별도 커패시터 없이 채널 바디의 전하 상태로 저장)과 FeRAM 확장은 각각 retention과 endurance 어느 한쪽에서 표준을 이기지 못하고 니치 응용에 머물렀다.

## 2. 한계 — aspect ratio가 벌 수 있는 여유의 소진

커패시터 aspect ratio가 60:1을 넘어서면서 상하부 CD 균일도, 홀의 기울기(tilt), 그리고 커패시터 상단에서의 leakage가 retention 마진을 잠식한다. 리프레시 간격을 줄이면 대역폭·전력이 나빠지고, 못 줄이면 데이터가 사라지는 트레이드오프에서 **지금 셀 토폴로지가 물리적으로 벌 수 있는 여유는 거의 소진됐다**는 것이 다수 견해다.

이는 단순한 공정 난도 문제가 아니라 구조 자체의 상한이다 — pillar를 더 가늘고 길게 뽑을수록 유전체 박막의 단차 피복성(step coverage)이 나빠져 오히려 유효 정전용량이 줄어드는 역설적 지점에 근접했다.

## 3. 대안 후보 — 수평 재편으로의 전환

**3D DRAM(수평 stacked cell + vertical channel select transistor).** [[vertical-nand]]가 갔던 길을 DRAM이 뒤따르는 구조로, 커패시터를 수직 pillar가 아니라 **수평으로 배치하고 채널 선택 트랜지스터를 수직으로 세운다**. Samsung·SK hynix·Micron·Intel 계열 모두 연구 단계다. 미해결 문제는 (i) 커패시터 유전체를 수평 셀 전면에 균일하게 증착하는 공정, (ii) 채널 select transistor의 누설 — DRAM의 retention 요구는 NAND보다 훨씬 엄격해 누설 허용 폭이 좁다, (iii) 셀 수율. **상용 양산 시점은 아직 확정되지 않았고 발표 사이 편차가 크다.**

**FeFET·1T FeRAM으로의 부분 대체.** [[ferroelectric-gate-dielectric]]에서 다룬 대로 endurance 한계(10⁹~10¹⁰ 사이클) 때문에 DRAM 전면 대체는 불가능하며, 캐시·NVRAM 계층으로 응용이 강제로 한정된다 — 이는 DRAM 셀 문제의 "해결"이 아니라 "회피"에 가깝다.

## 4. 상위/교차 계층 영향

**pillar aspect ratio 60:1 이상이라는 요구가 공정 계층에 극한 HAR([[har-etching]]) 에칭 장비의 수직도·CD 균일도 요구를 강제하고**, 동시에 계측 계층에는 깊은 홀 내부의 두께·기울기를 웨이퍼 스케일로 측정할 수 있는 3D 계측(X-ray, CD-SAXS)을 강제한다 — 표면 관찰만으로는 셀 실패 원인을 잡을 수 없다.

**3D DRAM으로의 전환이 실제로 일어나면, 공정 계층은 NAND용으로 성숙한 채널홀 에칭·워드라인 슬릿 공정 자산을 재활용할 수 있게 되지만**, DRAM 특유의 엄격한 retention 요구 때문에 NAND보다 더 낮은 누설 기준의 select transistor 공정을 새로 개발해야 하는 부담을 진다.

**셀 토폴로지 전환이 늦어질수록 아키텍처 계층의 [[memory-bandwidth-energy-wall]] 대응 로드맵(HBM 스택 수 확장 등)이 DRAM 셀 밀도 정체분을 다른 방식(적층 수 증가)으로 보정해야 하는 압박을 받는다** — 즉 셀 층의 정체가 패키징 계층의 적층 부담으로 전가된다.
