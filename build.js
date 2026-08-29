#!/usr/bin/env node
"use strict";
/*
 * content/*.md  →  public/data.json
 *
 * 규약 (구현지시서 3, 6-b 참고):
 *   frontmatter: id, no, title, lede
 *   "## N. <문항명>"      → 소주제(q) 노드   id: <장id>-q<N>
 *   "### basis: <제목>"   → 그 아래 근거 노드 id: <q id>-b<N>
 *   "**출처**" 이하 "- [제목](url) — kind · 발행처 · 날짜" 목록 → sources[]
 *   figures/<노드id>.svg 가 있으면 그 노드에 figure.svg 로 인라인
 *   00_*.md (또는 frontmatter id: root) → 루트(종합) 메타
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

// ── 유틸 ──────────────────────────────────────────────

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

function makeNode(id, title, raw) {
  const { summary, body, sources } = toLeafFields(raw);
  const node = { id, title, lede: "", summary, body, sources, children: [] };
  const fig = readFigure(id);
  if (fig) node.figure = fig;
  return node;
}

// "## N. 제목" 단위로 분할 (레벨 2, "###"는 매치 안 됨)
function splitTop(md) {
  const lines = md.split(/\r?\n/);
  const pre = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(?:\d+\.\s*)?(.+?)\s*$/);
    if (m) {
      if (cur) sections.push(cur);
      cur = { title: m[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      pre.push(line);
    }
  }
  if (cur) sections.push(cur);
  return { pre: pre.join("\n"), sections: sections.map((s) => ({ title: s.title, raw: s.lines.join("\n") })) };
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
      cur = { title: m[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      pre.push(line);
    }
  }
  if (cur) sections.push(cur);
  return { pre: pre.join("\n"), sections: sections.map((s) => ({ title: s.title, raw: s.lines.join("\n") })) };
}

// ── 장(chapter) 파싱 ──────────────────────────────────

function parseChapter(file) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const id = data.id || path.basename(file, ".md");
  const top = splitTop(content);

  const qnodes = top.sections.map((sec, i) => {
    const qid = `${id}-q${i + 1}`;
    const basisSplit = splitBasis(sec.raw);
    const qnode = makeNode(qid, sec.title, basisSplit.pre);
    qnode.children = basisSplit.sections.map((b, j) => makeNode(`${qid}-b${j + 1}`, b.title, b.raw));
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

function parseRoot(files) {
  const defaults = {
    id: "root",
    title: "반도체 교과서 — 계층 8장",
    lede: "재료에서 집적까지, 한 계층의 한계가 다음 계층에 무엇을 강제하는지를 사슬로 읽는 구조.",
    summary: [],
    sources: [],
  };
  const rootFile = files.find((f) => {
    if (path.basename(f).startsWith("00_")) return true;
    const { data } = matter(fs.readFileSync(f, "utf8"));
    return data.id === "root";
  });
  if (!rootFile) return { ...defaults, children: [] };

  const raw = fs.readFileSync(rootFile, "utf8");
  const { data, content } = matter(raw);
  const { body, sources } = extractSources(content);
  const paras = body
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    id: "root",
    title: data.title || defaults.title,
    lede: data.lede || defaults.lede,
    summary: paras.map(plainify),
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
