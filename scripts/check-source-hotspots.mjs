import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const sourceDirs = ['frontend/src', 'taro/src', 'backend/src', 'shared-utils/src', 'shared-types/src'];
const uiSourceDirs = ['frontend/src', 'taro/src'];
const sourceExtensions = new Set(['.ts', '.tsx']);

const checks = [
  {
    name: 'runtime diagnostics must use diagnostic helpers',
    dirs: sourceDirs,
    pattern: /console\.(log|debug|info|warn|error)|debugger/g,
  },
  {
    name: 'TypeScript suppression comments are not allowed in source',
    dirs: sourceDirs,
    pattern: /@ts-ignore|@ts-expect-error/g,
  },
  {
    name: 'dynamic UI class branches should be extracted to helpers',
    dirs: uiSourceDirs,
    pattern:
      /className=\{`|className=\{[^}\n]*\?|className=\{[^}\n]*&&|`[^`]*(active|done|open|selected|disabled|error|success|income|expense|credit|debit|expanded|collapsed|current|highlight)/g,
  },
];

function collectSourceFiles(dir) {
  const absoluteDir = path.join(rootDir, dir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(path.relative(rootDir, absolutePath)));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectImportExportStatements(source) {
  const statements = [];
  const lines = source.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const trimmed = line.trimStart();

    if (!trimmed.startsWith('import ') && !trimmed.startsWith('export ')) {
      continue;
    }

    const statementLines = [line];
    const startLine = lineIndex + 1;

    while (
      lineIndex + 1 < lines.length &&
      !statementLines.join('\n').includes(';') &&
      !/\sfrom\s+['"][^'"]+['"]/.test(statementLines.join('\n'))
    ) {
      lineIndex += 1;
      statementLines.push(lines[lineIndex]);
    }

    statements.push({
      source: statementLines.join('\n'),
      line: startLine,
    });
  }

  return statements;
}

function collectSharedTypesImportMatches(file, source) {
  const matches = [];

  for (const statement of collectImportExportStatements(source)) {
    if (!/\sfrom\s+['"]@family-bookkeeping\/shared-types['"]/.test(statement.source)) {
      continue;
    }

    const trimmed = statement.source.trimStart();

    if (trimmed.startsWith('import type ') || trimmed.startsWith('export type ')) {
      continue;
    }

    matches.push({
      check: 'shared-types imports must be type-only',
      file: path.relative(rootDir, file),
      match: statement.source.split('\n')[0].trim(),
      line: statement.line,
      column: 1,
      preview: statement.source.replace(/\s+/g, ' ').trim(),
    });
  }

  return matches;
}

const allMatches = [];

for (const check of checks) {
  const files = [...new Set(check.dirs.flatMap((dir) => collectSourceFiles(dir)))].sort();

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const lines = source.split('\n');

    for (const [lineIndex, lineSource] of lines.entries()) {
      check.pattern.lastIndex = 0;

      for (const match of lineSource.matchAll(check.pattern)) {
        allMatches.push({
          check: check.name,
          file: path.relative(rootDir, file),
          match: match[0],
          line: lineIndex + 1,
          column: (match.index ?? 0) + 1,
          preview: lineSource.trim(),
        });
      }
    }
  }
}

const sourceFiles = [...new Set(sourceDirs.flatMap((dir) => collectSourceFiles(dir)))].sort();

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  allMatches.push(...collectSharedTypesImportMatches(file, source));
}

if (allMatches.length === 0) {
  console.log('source hotspot scan ok');
  process.exit(0);
}

console.error(`source hotspot scan failed (${allMatches.length} matches)`);

for (const item of allMatches) {
  console.error(`\n[${item.check}]`);
  console.error(`${item.file}:${item.line}:${item.column}`);
  console.error(`match: ${item.match}`);
  console.error(item.preview);
}

process.exit(1);
