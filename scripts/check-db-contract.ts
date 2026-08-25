/**
 * DB-contract check: verifies that every table referenced via
 * `.from("table")` in src/ exists in the generated Database types, and
 * that every quoted column passed to `.select("...")` on that table is
 * present in the type's Row block.
 *
 * Deliberately regex-based (no TS compiler) so it runs anywhere in <1s:
 *
 *   npm run db:contract
 *
 * Exit 1 on any drift — wire into CI next to the typegen guard.
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const TYPES = path.join(SRC, "types", "database.ts");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

/** Extracts `Tables["<name>"]["Row"]` blocks from the generated types. */
function parseRowColumns(typesSource: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const tableRegex = /(\w+):\s*\{\s*Row:\s*\{([\s\S]*?)\n\s{8}\}\n/g;
  let m: RegExpExecArray | null;
  while ((m = tableRegex.exec(typesSource)) !== null) {
    const cols = new Set<string>();
    const colRegex = /^\s{10}(\w+):/gm;
    let c: RegExpExecArray | null;
    while ((c = colRegex.exec(m[2])) !== null) cols.add(c[1]);
    tables.set(m[1], cols);
  }
  return tables;
}

function main() {
  const source = fs.readFileSync(TYPES, "utf-8");
  const tables = parseRowColumns(source);

  if (tables.size === 0) {
    console.error("✗ Could not parse any Row blocks from database.ts");
    process.exit(1);
  }

  const files = walk(SRC).filter((f) => !f.includes(`${path.sep}types${path.sep}`));
  let errors = 0;

  const callRegex =
    /\.from\(\s*["']([\w_]+)["']\s*\)(?:[\s\S]{0,200}?\.select\(\s*(?:"([^"]*)"|'([^']*)'))?/g;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = callRegex.exec(text)) !== null) {
      const table = match[1];
      const columnsRaw = match[2] ?? match[3];
      if (!tables.has(table)) {
        // Skip joins like universities(name) handled by their own .from.
        console.error(`✗ ${rel}: table "${table}" not found in Database types`);
        errors++;
        continue;
      }
      if (!columnsRaw) continue;
      const known = tables.get(table)!;
      for (const rawCol of columnsRaw.split(",")) {
        // Skip embedded relations & aggregates: university(name), items(*),
        // programme_count:programmes(count) — aliases may hide parens.
        if (rawCol.includes("(")) continue;
        const col = rawCol.trim().split(":")[0].replace(/[*]/g, "").trim();
        if (!col || col.startsWith("*")) continue; // *-shorthand
        if (!known.has(col)) {
          console.error(
            `✗ ${rel}: column "${col}" missing from ${table}.Row (stale select or migration drift)`,
          );
          errors++;
        }
      }
    }
  }

  if (errors > 0) {
    console.error(`\n${errors} contract violation(s). Regenerate types or fix queries.`);
    process.exit(1);
  }
  console.log(`✓ DB contract OK — ${files.length} files checked against ${tables.size} tables`);
}

main();