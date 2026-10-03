import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const EXT = /\.(ts|tsx|css|md)$/;
const SKIP_DIRS = new Set(["node_modules", "ui"]); // ui = vendored shadcn source

const BAD = [
  { re: /[\u0400-\u04FF]/g, name: "Cyrillic" },
  { re: /[\u0370-\u03FF]/g, name: "Greek" },
  { re: /[\u4E00-\u9FFF]/g, name: "CJK" },
  { re: /\uFFFD/g, name: "replacement-char" },
  { re: /\u2014/g, name: "em-dash (banned, skill 9.G)" },
  { re: /\u2013/g, name: "en-dash (banned, skill 9.G)" },
  { re: /\u00B7/g, name: "middle-dot (skill 9.F)" },
  { re: /\?{2,}/g, name: "?? run (corruption)" },
  { re: /[a-z]{2,}[A-Z][a-z]+\?(\s|$)/g, name: "camel+question-mark (corruption)" },
  { re: /[a-z]{3,}[A-Z][a-z]+[A-Z]/g, name: "double camel soup (corruption)" },
  { re: /\b\w*[\u3000-\u9FFF]+\w*\b/g, name: "CJK fragment (corruption)" },
  { re: /_{3,}/g, name: "___ run (corruption)" },
  { re: /[a-z][A-Z]{2,}/g, name: "glued caps inside word (corruption)" },
];

// only applies to real prose (multi-word strings), never to identifiers
const PROSE_SOUP = /(?:[a-z]{4,}[A-Z][a-z]{3,})|(?:[A-Z][a-z]{4,}[A-Z][a-z]{4,})/;

// Structural corruption rules only make sense on prose. Identifiers such as
// `targetStudentIds` and code fragments inside `${...}` are legal, so the
// camel rules run against a de-sugared copy of the string.
const STRUCTURAL = new Set([
  "?? run (corruption)",
  "camel+question-mark (corruption)",
  "double camel soup (corruption)",
  "___ run (corruption)",
  "glued caps inside word (corruption)",
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out.push(...walk(full));
    } else if (EXT.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

let issues = 0;
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      const strings = line.match(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g) ?? [];
      for (const raw of strings) {
        const s = raw.slice(1, -1);
        const isProse = (s.match(/ /g) ?? []).length >= 2 && !/[{}=<>|]/.test(s);
        const code = s.replace(/\$\{[^}]*\}/g, "expr");
        for (const { re, name } of BAD) {
          if (STRUCTURAL.has(name) && !isProse) continue;
          re.lastIndex = 0;
          const haystack = STRUCTURAL.has(name) ? code : s;
          if (re.test(haystack)) {
            issues += 1;
            console.log(`${rel}:${i + 1}  [${name}]  ${s.slice(0, 130)}`);
          }
        }
        const nonAscii = s.match(/[^\x00-\x7F]/g);
        if (nonAscii) {
          issues += 1;
          console.log(`${rel}:${i + 1}  [non-ascii: ${nonAscii.join("")}]  ${s.slice(0, 130)}`);
        }
        if (isProse && PROSE_SOUP.test(s)) {
          issues += 1;
          console.log(`${rel}:${i + 1}  [camel-soup]  ${s.slice(0, 130)}`);
        }
      }

      // Whole-line scan: raw JSX text is not wrapped in quotes, so the string
      // extractor above cannot see it. No legitimate code character lives in
      // these blocks, so any hit is corruption.
      const rawBlock = line.match(/[\u0400-\u04FF\u0370-\u03FF\u4E00-\u9FFF\uFFFD]/g);
      if (rawBlock) {
        issues += 1;
        console.log(`${rel}:${i + 1}  [raw jsx text]  ${line.trim().slice(0, 130)}`);
      }
    });
}

console.log(issues === 0 ? "text-check: clean" : `text-check: ${issues} issue(s)`);
process.exit(issues === 0 ? 0 : 1);