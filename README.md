# 반도체교과서 — 계층 대시보드

Google Drive `반도체교과서/` 원류 md를 GitHub 정본으로 옮기고, 계층 대시보드로 열람하는 파이프라인.
전체 설계는 [구현지시서](./반도체교과서_구현지시서_20260829.md)를 참고. (아직 리포에 안 올렸다면 추가 예정)

## 파이프라인

```
content/*.md  →  build.js  →  docs/data.json  →  docs/index.html
```

- `content/*.md` — 원문. 사람이 읽고 고치는 유일한 곳(정본). Drive에서 내려받아 여기 넣는다.
- `figures/<노드id>.svg` — 원리 그림. 미리 만들어 커밋한다(열람 시점 생성 금지).
- `build.js` — md를 파싱해 `docs/data.json` 생성.
- `docs/index.html` — 대시보드. `data.json`을 fetch로 읽는다.
- 산출물 폴더가 `docs/`인 이유는 GitHub Pages의 "Deploy from a branch: main /docs" 옵션이
  바로 이 폴더를 요구하기 때문이다(별도 워크플로 없이 배포하기 위함).

## 사용법

```bash
npm install
npm run build      # content/*.md → docs/data.json
```

`docs/`를 정적 서버(예: GitHub Pages)에 올리면 그대로 열람 가능. 로컬 확인 시에는 `file://`로 열면
`fetch`가 막히므로 아무 정적 서버로 띄워야 한다:

```bash
npx serve docs
```

## GitHub Pages 배포

1. `npm run build`로 `docs/data.json`을 최신 상태로 만들고 커밋·push한다.
2. 리포 **Settings → Pages → Build and deployment → Source**를
   **Deploy from a branch**로, 브랜치는 **main / docs**로 설정한다.
3. 몇 분 뒤 `https://parablu2-dot.github.io/Semiconductor_Study_System/`에서 열람 가능.

빌드가 CI 없이 로컬에서만 이뤄지므로, **content/md를 고친 뒤에는 반드시 `npm run build`를 다시 돌리고
`docs/data.json` 변경분까지 커밋해야** 사이트에 반영된다. 이 흐름이 자리잡은 뒤 GitHub Actions로
자동 빌드·배포를 옮기는 것을 고려할 수 있다(빌드 실패와 배포 실패를 분리해서 진단하기 쉬워짐).

## md 규약

각 장 파일은 frontmatter(`id`, `no`, `title`, `lede`) + `## N. 문항명` 소주제 + `### basis: 제목` 근거로 구성한다.
문항 제목은 4개 고정(현 상태 / 한계 / 대안 후보 / 상위 계층 영향). 각 절 끝에 `**출처**` 목록을 두면
`sources[]`로 파싱된다. `00_종합.md`는 루트(전체 요약) 메타로 쓰인다. 자세한 문법은 구현지시서 3절·6-b절 참고.

## 원칙

- **정본은 GitHub.** Drive는 초안·수집 용도. GitHub에 올린 뒤로는 Drive 파일을 고치지 않는다.
- **딥 리서치 출처를 그대로 옮기지 않는다.** 링크를 열어 확인한 것만 싣는다.
- **사내 자료는 이 리포에 넣지 않는다.** 공개 자료만 수록.
