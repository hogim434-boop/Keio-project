#!/usr/bin/env node
// Keio University Syllabus PDF Parser
// 사용법: node scripts/parse-syllabus.mjs <pdf-path> <output-json>
// 예시: node scripts/parse-syllabus.mjs "~/Documents/シラバス・時間割 月.pdf" docs/data/raw/courses-mon.json

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node parse-syllabus.mjs <pdf-path> <output-json>');
  process.exit(1);
}

const [pdfPath, outputPath] = args;

// 1. PDF → 텍스트 추출 (-layout 모드로 컬럼 보존)
console.log(`📖 Reading: ${pdfPath}`);
const text = execSync(`pdftotext -layout "${pdfPath}" -`, {
  encoding: 'utf8',
  maxBuffer: 200 * 1024 * 1024,
});

// 2. 라인 정리 + 노이즈 제거
const rawLines = text.split('\n');
const noisePatterns = [
  /検索結果 \| シラバス/,
  /https:\/\/gslbs\.keio\.jp/,
  /Page \d+ of \d+/,
  /GMT\+\d{4}/,
  /慶應義塾大学/,
  /^検索条件/,
  /^年度：/,
  /^学年：/,
  /^表示順/,
  /^結果件数/,
  /検索結果が多くて/,
  /追加検索条件/,
  /^\s*\(c\)/i,
];

// 시한 헤더 추적 (例: "月曜1限")
const periodHeaderRe = /^\s*([月火水木金土日])曜(\d+)限\s*$/;

const cleanedLines = [];
let currentPeriod = null;

for (const raw of rawLines) {
  const line = raw.trimEnd();
  if (!line.trim()) {
    cleanedLines.push({ line: '', period: currentPeriod });
    continue;
  }
  if (noisePatterns.some(re => re.test(line))) continue;

  const pm = line.match(periodHeaderRe);
  if (pm) {
    currentPeriod = `${pm[1]}${pm[2]}`;
    continue;
  }

  cleanedLines.push({ line: line.trim(), period: currentPeriod });
}

// 3. 강의 블록 추출
// 헤더 줄: "강의명 + 교수명 + N単位"
// 그 뒤 1~3줄에 메타 정보
const courseHeaderRe = /^(.+?)\s+(\d+)単位\s*$/;

// 교수명 추출 휴리스틱
function splitNameAndProfessor(headerText) {
  // 케이스 1: 외국인 이름 (전각 콤마 포함, 예: "キャンベル， ジョナサン")
  const foreignMatch = headerText.match(
    /^(.+?)\s+([゠-ヿ\w・]+，\s*[゠-ヿ\w・]+(?:\s+[゠-ヿ\w・]+)*)$/u
  );
  if (foreignMatch) {
    return { name: foreignMatch[1].trim(), professor: foreignMatch[2].trim() };
  }

  // 케이스 2: 일본인 이름 (마지막 2~3 토큰이 한자/카타카나)
  const tokens = headerText.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return { name: tokens[0], professor: '' };
  }
  if (tokens.length === 2) {
    return { name: tokens[0], professor: tokens[1] };
  }

  // 마지막 2 토큰이 모두 한자/카타카나 → 일본 이름으로 판단
  const lastTwo = tokens.slice(-2);
  const isJapaneseName = lastTwo.every(t =>
    /^[一-鿿゠-ヿ぀-ゟ]+$/u.test(t)
  );
  if (isJapaneseName) {
    return {
      name: tokens.slice(0, -2).join(' '),
      professor: lastTwo.join(' '),
    };
  }

  // 폴백: 마지막 토큰만 교수
  return {
    name: tokens.slice(0, -1).join(' '),
    professor: tokens[tokens.length - 1],
  };
}

// 메타 라인 합치기 (다음 1~3 줄)
function collectMeta(lines, startIdx) {
  let meta = '';
  for (let j = startIdx; j < Math.min(startIdx + 4, lines.length); j++) {
    const item = lines[j];
    if (!item || !item.line) continue;
    if (/^(学期|キャンパス|教室|実施形態|設置|学年|クラス|セット科目)/.test(item.line) ||
        item.line.includes('学期') || item.line.includes('セット科目')) {
      meta += ' ' + item.line;
    }
    // 다음 강의 헤더가 나오면 중단
    if (j > startIdx && courseHeaderRe.test(item.line)) break;
  }
  return meta.trim();
}

const courses = [];
const debug = { skipped: 0, malformed: 0 };

for (let i = 0; i < cleanedLines.length; i++) {
  const item = cleanedLines[i];
  if (!item || !item.line) continue;

  const m = item.line.match(courseHeaderRe);
  if (!m) continue;

  // 너무 짧으면 false positive (예: "学期 春 ... 1単位"에서 매치)
  if (m[1].length < 2) { debug.malformed++; continue; }
  // 메타 라인 키워드가 들어있으면 false positive
  if (/学期|キャンパス|教室|実施形態|セット科目/.test(m[1])) { debug.malformed++; continue; }

  const headerText = m[1];
  const credits = parseInt(m[2], 10);

  const { name, professor } = splitNameAndProfessor(headerText);

  // 메타 추출
  const meta = collectMeta(cleanedLines, i + 1);
  const semester = (meta.match(/学期\s+(春[^\s]*|秋[^\s]*|通[^\s]*|集中[^\s]*)/) || [])[1] || null;
  const dayPeriod = (meta.match(/曜日時限\s+(\S+)/) || [])[1] || item.period;
  const campus = (meta.match(/キャンパス\s+(\S+)/) || [])[1] || null;
  const classroom = (meta.match(/教室\s+(\S+)/) || [])[1] || null;
  const format = (meta.match(/実施形態\s+(対面授業[^\s設]*(?:[（(][^）)]+[）)])?|オンライン[^\s設]*(?:[（(][^）)]+[）)])?|ハイブリッド[^\s設]*(?:[（(][^）)]+[）)])?)/) || [])[1] || null;
  const faculty = (meta.match(/設置\s+(\S+)/) || [])[1] || null;
  const gradeStr = (meta.match(/学年\s+([\d, ]+)(?=\s+クラス|\s+セット科目|\s*$)/) || [])[1] || '';
  const grades = gradeStr.replace(/\s/g, '').split(',').map(Number).filter(n => !isNaN(n) && n > 0);
  const classNo = (meta.match(/クラス\s+(\S+)/) || [])[1] || null;
  const setCourse = (meta.match(/セット科目\s+(.+?)$/) || [])[1] || null;

  courses.push({
    name,
    professor,
    credits,
    semester,
    day_period: dayPeriod,
    campus,
    classroom,
    format,
    faculty,
    grades,
    class_no: classNo,
    set_course: setCourse,
  });
}

// 4. 결과 저장
const result = {
  source: basename(pdfPath),
  extracted_at: new Date().toISOString(),
  total: courses.length,
  debug,
  courses,
};

writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

console.log(`✅ ${courses.length}개 강의 추출 → ${outputPath}`);
console.log(`   debug: ${JSON.stringify(debug)}`);

// 첫 5개와 마지막 5개 샘플 출력 (검증용)
console.log('\n📌 샘플 (첫 3개):');
courses.slice(0, 3).forEach((c, idx) => {
  console.log(`  [${idx + 1}] "${c.name}" | ${c.professor} | ${c.credits}単位 | ${c.semester} | ${c.day_period} | ${c.campus}/${c.classroom} | ${c.faculty} | 学年${c.grades.join(',')}`);
});
console.log('📌 샘플 (마지막 3개):');
courses.slice(-3).forEach((c, idx) => {
  console.log(`  [${courses.length - 2 + idx}] "${c.name}" | ${c.professor} | ${c.credits}単位 | ${c.semester} | ${c.day_period} | ${c.campus}/${c.classroom} | ${c.faculty} | 学年${c.grades.join(',')}`);
});
