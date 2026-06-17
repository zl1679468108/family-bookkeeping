---
name: code-cleanup
description: Analyze a codebase for unused code, unreferenced files, dead styles, and optimization opportunities. Supports parallel analysis of frontend and backend.
---

# Code Cleanup & Optimization Analysis

Systematically analyze a codebase to find and report unused code, unreferenced files, dead styles, and optimization opportunities.

## When to use

- Before major releases to reduce bundle size and technical debt
- When onboarding to a new codebase to understand what's actually used
- Periodically as a maintenance task
- When the user says "清理未使用代码", "remove dead code", "optimize codebase", or similar

## Procedure

### Step 1: Explore project structure

1. Read the project root to identify the architecture (monorepo? separate frontend/backend?)
2. Identify the framework and tech stack for each sub-project:
   - React/Vue/Angular + TypeScript?
   - NestJS/Express/Next.js backend?
   - What CSS approach? (Tailwind, SCSS, CSS modules, styled-components)
3. Read `package.json` files to understand dependencies

### Step 2: Spawn parallel analysis subagents

Use `compose:parallel` (or spawn multiple explore subagents) to analyze each sub-project independently. For each sub-project, the subagent should check:

#### For Frontend (React/Vue/Angular + TypeScript):

1. **Unused exports**: Find exported functions/components/hooks that are never imported elsewhere
   - Use `grep` or `rg` to search for import statements referencing each export
   - Check `index.ts` barrel files — if an export is only re-exported but never consumed, it's dead

2. **Unused CSS/SCSS classes**: Find class definitions that are never referenced in JSX/TSX
   - Extract class names from `.scss`/`.css` files
   - Search for each in component files

3. **Unreferenced files**: Find `.ts`/`.tsx` files that are never imported by any other file
   - Exception: entry points (`main.tsx`, `App.tsx`, `index.ts`), route files, and type declaration files (`.d.ts`)

4. **Unused dependencies**: Compare `package.json` dependencies against actual imports in source code

5. **Dead code patterns**:
   - Commented-out code blocks
   - `console.log` statements left in production code
   - TODO/FIXME comments that may indicate incomplete features
   - Variables declared but never used
   - Functions defined but never called

#### For Backend (NestJS/Express + TypeScript):

1. **Unused exports**: Find exported classes/functions/services that are never imported
2. **Unreferenced files**: Find `.ts` files never imported elsewhere
3. **Unused module providers**: In NestJS, check if services in `providers` array are actually injected anywhere
4. **Unused DTOs**: Check if DTO classes are referenced in controller decorators
5. **Dead code patterns**: Same as frontend

#### For Both:

1. **Optimization opportunities**:
   - Large files that could be split
   - Missing error handling
   - Inconsistent patterns across modules
   - Potential performance issues (N+1 queries, unnecessary re-renders)

### Step 3: Collect and consolidate results

1. Gather findings from all subagents
2. Deduplicate and categorize by severity:
   - **High**: Unused files that can be safely deleted
   - **Medium**: Unused exports/functions that can be removed
   - **Low**: Dead code patterns, optimization suggestions
3. For each finding, provide:
   - File path
   - What is unused
   - Confidence level (safe to remove / review needed / uncertain)
   - Recommended action

### Step 4: Present report

Format the output as a structured report:

```
## Code Cleanup Report

### Summary
- Files that can be deleted: N
- Unused exports to remove: N
- Dead code patterns found: N
- Optimization suggestions: N

### High Confidence (Safe to delete)
[list of files with paths]

### Medium Confidence (Review needed)
[list of unused exports with file paths]

### Low Confidence / Optimization
[list of suggestions]

### Next Steps
- Recommended order of cleanup
- What to test after cleanup
```

## Important notes

- Never suggest removing files that might be entry points, routes, or type declarations
- Always check for barrel file (`index.ts`) re-exports before marking something unused
- Some "unused" code might be used dynamically (e.g., `require()` with variables) — flag these as uncertain
- For NestJS modules, check the `AppModule` imports to understand the module tree
- Consider that test files (`*.test.ts`, `*.spec.ts`) are not "unused" even if only imported by test runners
