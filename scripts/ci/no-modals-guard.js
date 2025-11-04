#!/usr/bin/env node
/*
 Simple CI guard: fails if modal-related patterns are found in frontend code.
 Enforces AGENTS.md rule: Full-screen only (no modals). Allows legitimate uses in test fixtures by whitelisting /test-*.html.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INCLUDE_DIRS = [
  'public',
  'frontend/public',
  'turmas-module/frontend/public',
];

const EXTENSIONS = ['.js', '.ts', '.css', '.html'];

// Patterns that commonly indicate modal UIs (avoid generic 'modal' to prevent false positives like 'modality')
const PATTERNS = [
  /\bshowModal\b/,                 // HTMLDialogElement.showModal
  /\baria-modal\b/i,               // a11y modal indicator
  /class\s*=\s*"[^"]*\bmodal\b[^"]*"/i, // CSS class="... modal ..."
  /id\s*=\s*"[^"]*\bmodal\b[^"]*"/i,    // id="...modal..."
  /\bmodal-open\b/i,
  /\bmodal-overlay\b/i,
  /\bdata-[\w-]*modal\b/i,
];

// Allowlist function: ignore known safe files (debug or explicit test pages)
function isWhitelisted(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  // allow test pages we added explicitly for debugging
  if (/test-.*\.html$/i.test(path.basename(rel))) return true;
  // allow README and docs
  if (/\.(md|MD)$/.test(rel)) return true;
  // ignore legacy playgrounds and RAG data dumps
  if (rel.startsWith('public/old/')) return true;
  if (rel.startsWith('public/data/')) return true;
  return false;
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, results);
    } else {
      const ext = path.extname(entry).toLowerCase();
      if (EXTENSIONS.includes(ext)) results.push(full);
    }
  }
  return results;
}

let violations = [];
for (const base of INCLUDE_DIRS) {
  const dir = path.join(ROOT, base);
  const files = walk(dir);
  for (const file of files) {
    if (isWhitelisted(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const hits = PATTERNS.filter((re) => re.test(content));
    if (hits.length > 0) {
      violations.push({ file, patterns: hits.map((r) => r.toString()) });
    }
  }
}

if (violations.length > 0) {
  console.error('\nNO-MODALS guard failed. The following files contain modal-related patterns:');
  for (const v of violations) {
    console.error(` - ${path.relative(ROOT, v.file)} -> ${v.patterns.join(', ')}`);
  }
  console.error('\nPer AGENTS.md: Use full-screen pages. Remove modal code or rename elements to non-modal semantics.');
  process.exit(1);
} else {
  console.log('✅ NO-MODALS guard passed.');
}
