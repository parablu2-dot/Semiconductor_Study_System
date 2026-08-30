#!/usr/bin/env node
"use strict";
/*
 * content/*.md  →  public/data.json
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
 *
 * content/ 가 비어 있어도 실패하지 않고 빈 트리를 낸다.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const ROOT_DIR = __dirname;
const CONTENT_DIR = path.join(ROOT_DIR, "content");
const FIGURES_DIR = path.join(ROOT_DIR, "figures");
const OUT_FILE = path.join(ROOT_DIR, "public", "data.json");

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

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(root, null, 2), "utf8");
  console.log(
    `data.json 생성 완료 — 장 ${root.children.length}개, 노드 ${totalNodes}개, 출처 ${totalSources}개 → ${path.relative(ROOT_DIR, OUT_FILE)}`
  );
}

main();
