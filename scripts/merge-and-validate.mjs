#!/usr/bin/env node
// 5개 요일 JSON 통합 + 검증 + 통계 집계
// 사용법: node scripts/merge-and-validate.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAW_DIR = 'docs/data/raw';
const OUT_FILE = 'docs/data/courses-merged.json';
const STATS_FILE = 'docs/data/courses-stats.json';

const files = readdirSync(RAW_DIR).filter(f => f.startsWith('courses-') && f.endsWith('.json'));

const all = [];
const perFile = {};

for (const f of files) {
  const data = JSON.parse(readFileSync(join(RAW_DIR, f), 'utf8'));
  perFile[f] = data.total;
  all.push(...data.courses);
}

// 중복 제거 (강의명 + 교수명 + 요일·시한 + 학기 같으면 동일)
const seen = new Set();
const dedup = [];
for (const c of all) {
  const key = `${c.name}|${c.professor}|${c.day_period}|${c.semester}`;
  if (seen.has(key)) continue;
  seen.add(key);
  dedup.push(c);
}

// 통계 집계
function countBy(arr, fn) {
  const m = {};
  for (const x of arr) {
    const k = fn(x) ?? '(null)';
    m[k] = (m[k] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(m).sort((a, b) => b[1] - a[1])
  );
}

const stats = {
  per_file: perFile,
  raw_total: all.length,
  dedup_total: dedup.length,
  duplicates_removed: all.length - dedup.length,
  by_campus: countBy(dedup, c => c.campus),
  by_faculty_top20: Object.fromEntries(
    Object.entries(countBy(dedup, c => c.faculty)).slice(0, 20)
  ),
  by_semester: countBy(dedup, c => c.semester),
  by_day_period: countBy(dedup, c => c.day_period),
  by_format: countBy(dedup, c => c.format),
  by_credits: countBy(dedup, c => c.credits),

  // 데이터 품질 지표
  quality: {
    name_blank: dedup.filter(c => !c.name || c.name === '').length,
    professor_blank: dedup.filter(c => !c.professor || c.professor === '').length,
    semester_null: dedup.filter(c => !c.semester).length,
    campus_null: dedup.filter(c => !c.campus).length,
    classroom_null: dedup.filter(c => !c.classroom).length,
    faculty_null: dedup.filter(c => !c.faculty).length,
    format_null: dedup.filter(c => !c.format).length,
    grades_empty: dedup.filter(c => !c.grades || c.grades.length === 0).length,
  },
};

writeFileSync(OUT_FILE, JSON.stringify({
  source: 'keio_syllabus_2026_pdf_extraction',
  extracted_at: new Date().toISOString(),
  total: dedup.length,
  courses: dedup,
}, null, 2), 'utf8');

writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');

console.log('═'.repeat(60));
console.log('🔢 PARSE SUMMARY');
console.log('═'.repeat(60));
console.log('파일별 추출 수:');
for (const [f, n] of Object.entries(perFile)) {
  console.log(`  ${f}: ${n.toLocaleString()}건`);
}
console.log(`  ─────────────`);
console.log(`  합계 (raw): ${all.length.toLocaleString()}건`);
console.log(`  중복 제거: ${stats.duplicates_removed.toLocaleString()}건`);
console.log(`  최종: ${dedup.length.toLocaleString()}건`);

console.log('\n📊 캠퍼스별 분포:');
for (const [k, v] of Object.entries(stats.by_campus)) {
  console.log(`  ${k}: ${v.toLocaleString()}`);
}

console.log('\n🏫 학부별 분포 (Top 20):');
for (const [k, v] of Object.entries(stats.by_faculty_top20)) {
  console.log(`  ${k}: ${v.toLocaleString()}`);
}

console.log('\n📅 학기별 분포:');
for (const [k, v] of Object.entries(stats.by_semester)) {
  console.log(`  ${k}: ${v.toLocaleString()}`);
}

console.log('\n⏰ 시한별 분포:');
const dpSorted = Object.entries(stats.by_day_period).sort((a, b) => a[0].localeCompare(b[0]));
for (const [k, v] of dpSorted) {
  console.log(`  ${k}: ${v.toLocaleString()}`);
}

console.log('\n✅ 데이터 품질:');
for (const [k, v] of Object.entries(stats.quality)) {
  const pct = ((v / dedup.length) * 100).toFixed(1);
  const flag = v / dedup.length > 0.05 ? '⚠️' : '✓';
  console.log(`  ${flag} ${k}: ${v.toLocaleString()} (${pct}%)`);
}

console.log('\n💾 출력 파일:');
console.log(`  ${OUT_FILE}`);
console.log(`  ${STATS_FILE}`);
