#!/usr/bin/env node
"use strict";
/*
 * content/*.md  →  docs/data.json (GitHub Pages가 docs/ 를 서빙)
 *
 * 규약 (구현지시서 3, 6-b 참고):
 *   frontmatter: id, no, title, lede (root는 summary도)
 *   각 장 파일 맨 위 "# 장 제목" H1 한 줄은 무시(정본 제목은 frontmatter title).
 *   "## <문항명>" 또는 "## N. <문항명>"  → 소주제(q) 노드   id: <장id>-q<N>
 *     제목에 " — 설명" 이 붙어 있으면(딥 리서치 원문 관례) 앞부분만 title로,
 *     뒷부분은 그 노드의 lede로 쓴다.
 *   "### basis: <제목>"   → 그 아래 근거 노드 id: <q id>-b<N>
 *   "**출처**" 이하 "- [제목](url) — kind · 발행처 · 날짜" 목록 → sources[]
 *   figures/<노드id>.svg 가 있으면 그 노드에 figure.svg 로 인라인
 *   00_*.md (또는 frontmatter id: root) → 루트(종합) 메타. 구조가 4문항과
 *     다른 교차분석 문서이므로 summary는 frontmatter에서 직접 받고,
 *     본문 전체는 body(HTML)로 그대로 렌더링한다.
 *   원문은 마크다운 특수문자가 백슬래시로 이스케이프된 상태로 올 수 있다
 *     (Drive 딥 리서치 산출물 관례) — 파싱 전에 그대로 풀어준다.
 *   analysis/subtopics.json 이 있으면(없어도 무방) 각 장 노드에
 *     `topics: [{id,title,lede,home,appears_in}]` 를 덧붙인다. 4문항 제목이
 *     아니라 그 장에서 실제로 다뤄진 기술 대상 이름의 소주제 색인이며,
 *     appears_in 은 이 소주제가 실제로 등장하는 다른 장 번호(1~8)를 담는다.
 *
 * content/ 가 비어 있어도 실패하지 않고 빈 트리를 낸다.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const ROOT_DIR = __dirname;
const CONTENT_DIR = path.join(ROOT_DIR, "content");
const DAVE_CONTENT_DIR = path.join(CONTENT_DIR, "dave");
const FIGURES_DIR = path.join(ROOT_DIR, "figures");
const SUBTOPICS_FILE = path.join(ROOT_DIR, "analysis", "subtopics.json");
const DAVE_SESSIONS_FILE = path.join(ROOT_DIR, "analysis", "dave_sessions.json");
const OUT_FILE = path.join(ROOT_DIR, "docs", "data.json");

const SOURCE_MARK = "**출처**";
// CommonMark가 허용하는 백슬래시 이스케이프 대상 구두점
const ESCAPE_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])/g;
const DASH_SPLIT_RE = /\s+—\s+/; // "제목 — 설명" 형식의 헤딩 분리

// ── 유틸 ──────────────────────────────────────────────

function unescapeMd(s) {
  return s.replace(ESCAPE_RE, "$1");
}

// 문서 맨 앞의 "# 제목" H1 한 줄 제거(있으면). frontmatter 뒤의 빈 줄은
// 건너뛰고 찾는다. "##"는 건드리지 않는다.
function stripLeadingH1(s) {
  return s.replace(/^\s*#(?!#)[^\n]*\n+/, "");
}

function readFigure(id) {
  const p = path.join(FIGURES_DIR, `${id}.svg`);
  if (!fs.existsSync(p)) return null;
  return { svg: fs.readFileSync(p, "utf8").trim() };
}

// analysis/subtopics.json — 4문항 제목이 아니라 실제 기술 대상 이름으로
// 뽑은 소주제 색인(장간 통일·appears_in 포함). 없어도 실패하지 않는다.
function readSubtopics() {
  if (!fs.existsSync(SUBTOPICS_FILE)) return [];
  try {
    const list = JSON.parse(fs.readFileSync(SUBTOPICS_FILE, "utf8"));
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn(`analysis/subtopics.json 파싱 실패 — 소주제 없이 진행: ${e.message}`);
    return [];
  }
}

// 주어진 장 번호(1~8)가 등장하는 소주제만 골라, 그 장 페이지에 필요한
// 필드만 남긴다. home은 그 소주제가 원래 속한(가장 먼저 다뤄진) 장.
function topicsForChapter(subtopics, chapterNo) {
  return subtopics
    .filter((t) => Array.isArray(t.appears_in) && t.appears_in.includes(chapterNo))
    .map((t) => ({ id: t.id, title: t.title, lede: t.lede || "", home: t.ch, appears_in: t.appears_in }));
}

// analysis/dave_sessions.json — 세션별 also_in/pattern 메타. 없어도 실패하지 않는다.
function readDaveSessions() {
  if (!fs.existsSync(DAVE_SESSIONS_FILE)) return new Map();
  try {
    const list = JSON.parse(fs.readFileSync(DAVE_SESSIONS_FILE, "utf8"));
    const map = new Map();
    if (Array.isArray(list)) list.forEach((r) => r && r.id && map.set(r.id, r));
    return map;
  } catch (e) {
    console.warn(`analysis/dave_sessions.json 파싱 실패 — also_in/pattern 없이 진행: ${e.message}`);
    return new Map();
  }
}

function plainify(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// 헤딩 텍스트를 "제목 — 설명" 규칙으로 title/lede로 나눈다.
function splitHeadingTitle(text) {
  const parts = text.split(DASH_SPLIT_RE);
  if (parts.length > 1) {
    return { title: parts[0].trim(), lede: parts.slice(1).join(" — ").trim() };
  }
  return { title: text.trim(), lede: "" };
}

// "**출처**" 아래 리스트를 sources[] 로, 그 앞부분을 본문으로 분리
function extractSources(raw) {
  const idx = raw.indexOf(SOURCE_MARK);
  if (idx === -1) return { body: raw, sources: [] };
  const before = raw.slice(0, idx);
  const after = raw.slice(idx + SOURCE_MARK.length);
  const sources = [];
  const lineRe = /^-\s*(?:\[(.+?)\]\((.*?)\)|([^—]+?))\s*—\s*(.+)$/;
  for (const rawLine of after.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("-")) continue;
    const m = line.match(lineRe);
    if (!m) continue;
    const t = (m[1] || m[3] || "").trim();
    const u = (m[2] || "").trim();
    const rest = m[4].split("·").map((s) => s.trim());
    sources.push({ t, u, kind: rest[0] || "", pub: rest[1] || "", date: rest[2] || "" });
  }
  return { body: before, sources };
}

// 마크다운 블록 → { summary[], body(html), sources[] }
function toLeafFields(raw) {
  const { body: withoutSources, sources } = extractSources(raw);
  const paras = withoutSources
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const summary = paras[0] ? [plainify(paras[0])] : [];
  const restMd = paras.slice(1).join("\n\n");
  const body = restMd ? marked.parse(restMd) : "";
  return { summary, body, sources };
}

function makeNode(id, headingText, raw) {
  const { title, lede } = splitHeadingTitle(headingText);
  const { summary, body, sources } = toLeafFields(raw);
  const node = { id, title, lede, summary, body, sources, children: [] };
  const fig = readFigure(id);
  if (fig) node.figure = fig;
  return node;
}

// "## 제목" 단위로 분할 (레벨 2, "###"는 매치 안 됨). 앞에 "N. "이 있으면 뗀다.
function splitTop(md) {
  const lines = md.split(/\r?\n/);
  const pre = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(?:\d+\.\s*)?(.+?)\s*$/);
    if (m) {
      if (cur) sections.push(cur);
      cur = { heading: m[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      pre.push(line);
    }
  }
  if (cur) sections.push(cur);
  return { pre: pre.join("\n"), sections: sections.map((s) => ({ heading: s.heading, raw: s.lines.join("\n") })) };
}

// "### basis: 제목" 단위로 분할 (레벨 3, basis 한정)
function splitBasis(md) {
  const lines = md.split(/\r?\n/);
  const pre = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^###\s+basis:\s*(.+?)\s*$/i);
    if (m) {
      if (cur) sections.push(cur);
      cur = { heading: m[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      pre.push(line);
    }
  }
  if (cur) sections.push(cur);
  return { pre: pre.join("\n"), sections: sections.map((s) => ({ heading: s.heading, raw: s.lines.join("\n") })) };
}

// "### S<n> 제목" 단위로 분할 (레벨 3, DAVE 세션 전용)
function splitSession(md) {
  const lines = md.split(/\r?\n/);
  const pre = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^###\s+S(\d+)\s+(.+?)\s*$/);
    if (m) {
      if (cur) sections.push(cur);
      cur = { no: parseInt(m[1], 10), heading: m[2].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      pre.push(line);
    }
  }
  if (cur) sections.push(cur);
  return { pre: pre.join("\n"), sections: sections.map((s) => ({ no: s.no, heading: s.heading, raw: s.lines.join("\n") })) };
}

// ── DAVE 장(대주제) 파싱 ──────────────────────────────
// content/dave/*.md 전용 — "##"는 소주제, "### S<n> 제목"은 세션. basis 근거 노드는 없다.

function parseDaveChapter(file, daveSessions) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content: rawContent } = matter(raw);
  const content = stripLeadingH1(unescapeMd(rawContent));
  const id = data.id || path.basename(file, ".md");
  const top = splitTop(content);

  const qnodes = top.sections.map((sec, i) => {
    const qid = `${id}-q${i + 1}`;
    const sessionSplit = splitSession(sec.raw);
    const qnode = makeNode(qid, sec.heading, sessionSplit.pre);
    qnode.children = sessionSplit.sections.map((s) => {
      const sid = "s" + String(s.no).padStart(3, "0");
      const node = makeNode(sid, `S${s.no} ${s.heading}`, s.raw);
      const meta = daveSessions.get(sid);
      if (meta) {
        if (meta.also_in && meta.also_in.length) node.also_in = meta.also_in;
        if (meta.pattern) node.pattern = meta.pattern;
      }
      return node;
    });
    return qnode;
  });

  const lead = toLeafFields(top.pre);
  const chapter = {
    id,
    no: data.no || "",
    title: data.title || id,
    lede: data.lede || "",
    summary: lead.summary,
    body: lead.body,
    sources: lead.sources,
    children: qnodes,
  };
  // d9(회고)의 "반복된 디버깅 패턴" 절 그림은 지시서 6절이 지정한 파일명(d9-pattern.svg)을
  // 그대로 쓰되, 소주제 자동 id(d9-q2 등)에 의존하지 않도록 장 레벨에 붙인다.
  const fig = readFigure(id) || (id === "d9" ? readFigure("d9-pattern") : null);
  if (fig) chapter.figure = fig;
  return chapter;
}

function countSessions(chapters) {
  return chapters.reduce((s, c) => s + (c.children || []).reduce((s2, q) => s2 + (q.children || []).length, 0), 0);
}

// content/dave/ 가 있으면 dave 컬렉션(대주제→소주제→세션)을 만들어 반환, 없으면 null.
// root.children(교과서 8장)과 완전히 분리된 형제 트리 — 기존 계층 스트립·통계에 영향 없음.
function buildDaveCollection() {
  const files = fs.existsSync(DAVE_CONTENT_DIR)
    ? fs
        .readdirSync(DAVE_CONTENT_DIR)
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(DAVE_CONTENT_DIR, f))
    : [];
  if (!files.length) return null;

  const daveSessions = readDaveSessions();
  const chapters = files
    .map((f) => parseDaveChapter(f, daveSessions))
    .sort((a, b) => {
      const na = parseInt(String(a.no).replace(/\D/g, ""), 10);
      const nb = parseInt(String(b.no).replace(/\D/g, ""), 10);
      return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
    });

  const totalTopics = chapters.reduce((s, c) => s + (c.children || []).length, 0);
  const totalSessions = countSessions(chapters);

  return {
    id: "dave",
    title: "DAVE 실습 — CustomSoC PoC",
    lede: "자연어 요구 → RTL → cocotb → Yosys 폐루프를 114개 세션에 걸쳐 완결한 1인기업 PoC 기록.",
    summary: [
      "'CustomSoC(Dave)'는 오픈소스 RISC-V 코어(PicoRV32)를 자연어 요구로 커스터마이징하는 1인기업 PoC다. spec.json 자동 해석부터 RTL 생성, cocotb·형식 등가검사(eqy) 검증, FPGA 실물(Track A)·ASIC PnR·Sign-off(Track B) 두 트랙, 그리고 7개 App까지 — 아래 대주제 순서(환경·도구 → 자연어→Spec → Spec→RTL → 검증 → FPGA 실물 → ASIC PnR → App → 회고)가 실제 진행 순서와 같다.",
    ],
    children: chapters,
    stats: [
      { n: String(chapters.length), l: "대주제" },
      { n: String(totalTopics), l: "소주제" },
      { n: String(totalSessions), l: "세션" },
    ],
    figure: readFigure("dave") || undefined,
  };
}

// ── 장(chapter) 파싱 ──────────────────────────────────

function parseChapter(file) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content: rawContent } = matter(raw);
  const content = stripLeadingH1(unescapeMd(rawContent));
  const id = data.id || path.basename(file, ".md");
  const top = splitTop(content);

  const qnodes = top.sections.map((sec, i) => {
    const qid = `${id}-q${i + 1}`;
    const basisSplit = splitBasis(sec.raw);
    const qnode = makeNode(qid, sec.heading, basisSplit.pre);
    qnode.children = basisSplit.sections.map((b, j) => makeNode(`${qid}-b${j + 1}`, b.heading, b.raw));
    return qnode;
  });

  const lead = toLeafFields(top.pre);
  const numMatch = path.basename(file).match(/^(\d+)_/);
  const chapter = {
    id,
    no: data.no || (numMatch ? numMatch[1] : ""),
    title: data.title || id,
    lede: data.lede || "",
    summary: lead.summary,
    body: lead.body,
    sources: lead.sources,
    children: qnodes,
  };
  const fig = readFigure(id);
  if (fig) chapter.figure = fig;
  return chapter;
}

// ── 루트(00_종합) 파싱 ────────────────────────────────
// 종합 문서는 4문항 구조가 아니라 장별 교차분석(표·다이어그램·불일치 목록)
// 이므로 문단 자동 추출 대신 frontmatter의 summary를 그대로 쓰고,
// 본문 전체는 그대로 HTML로 렌더링해 표·코드블록 서식을 보존한다.

function parseRoot(files) {
  const defaults = {
    id: "root",
    title: "반도체 교과서 — 계층 8장",
    lede: "재료에서 시스템·SW까지, 한 계층의 한계가 다음 계층에 무엇을 강제하는지를 사슬로 읽는 구조.",
    summary: [],
    body: "",
    sources: [],
  };
  const rootFile = files.find((f) => {
    if (path.basename(f).startsWith("00_")) return true;
    const { data } = matter(fs.readFileSync(f, "utf8"));
    return data.id === "root";
  });
  if (!rootFile) return { ...defaults, children: [] };

  const raw = fs.readFileSync(rootFile, "utf8");
  const { data, content: rawContent } = matter(raw);
  const content = stripLeadingH1(unescapeMd(rawContent));
  const { body: withoutSources, sources } = extractSources(content);
  const trimmed = withoutSources.trim();
  const summaryList = Array.isArray(data.summary)
    ? data.summary
    : data.summary
      ? [data.summary]
      : defaults.summary;

  return {
    id: "root",
    title: data.title || defaults.title,
    lede: data.lede || defaults.lede,
    summary: summaryList,
    body: trimmed ? marked.parse(trimmed) : "",
    sources,
    children: [],
  };
}

// ── 집계 ──────────────────────────────────────────────

function countNodes(n) {
  return 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0);
}
function countSources(n) {
  return (n.sources || []).length + (n.children || []).reduce((s, c) => s + countSources(c), 0);
}

// ── 메인 ──────────────────────────────────────────────

function main() {
  const files = fs.existsSync(CONTENT_DIR)
    ? fs
        .readdirSync(CONTENT_DIR)
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(CONTENT_DIR, f))
    : [];

  const chapterFiles = files
    .filter((f) => !path.basename(f).startsWith("00_"))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b), "en", { numeric: true }));

  const root = parseRoot(files);
  root.children = chapterFiles.map(parseChapter);

  const subtopics = readSubtopics();
  if (subtopics.length) {
    root.children.forEach((chapter, i) => {
      // 장 번호(no)가 아니라 frontmatter id(ch5, ch6 ...)로 매칭한다.
      // no는 파일명에서 온 표시용 라벨일 뿐이고, id가 그 장의 실제 정체성이다.
      // 화면 순서와 subtopics.json의 ch 번호가 어긋나는 개편이 생겨도
      // (예: 화면 순서만 바뀌고 content/*.md id는 그대로일 때) 번호 매칭은
      // 조용히 틀린 장에 소주제를 붙일 수 있지만, id 매칭은 그렇지 않다.
      const idMatch = String(chapter.id || "").match(/^ch(\d+)$/);
      const chapterNo = idMatch ? parseInt(idMatch[1], 10) : parseInt(chapter.no, 10) || i + 1;
      const topics = topicsForChapter(subtopics, chapterNo);
      if (topics.length) chapter.topics = topics;
    });
  }

  const totalNodes = root.children.reduce((s, c) => s + countNodes(c), 0);
  const totalSources = countSources(root);
  root.stats = [
    { n: String(root.children.length), l: "계층" },
    { n: "4", l: "문항 / 장" },
    { n: String(totalNodes), l: "기본 노드" },
    { n: totalSources ? String(totalSources) : "—", l: "출처" },
  ];

  const rootFig = readFigure("root");
  if (rootFig) root.figure = rootFig;

  const dave = buildDaveCollection();
  if (dave) root.dave = dave;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(root, null, 2), "utf8");
  const daveMsg = dave ? `, DAVE 대주제 ${dave.children.length}개/세션 ${countSessions(dave.children)}개` : "";
  console.log(
    `data.json 생성 완료 — 장 ${root.children.length}개, 노드 ${totalNodes}개, 출처 ${totalSources}개${daveMsg} → ${path.relative(ROOT_DIR, OUT_FILE)}`
  );
}

main();
