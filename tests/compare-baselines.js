/**
 * Baseline Comparison Script
 *
 * Compares two baseline captures (e.g., pre-migration vs post-migration)
 * and reports differences in extracted data, HTML structure, and HTTP status.
 */

const fs = require("fs");
const path = require("path");

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function diffTables(before, after) {
  const diffs = [];
  const maxLen = Math.max(before.length, after.length);

  for (let i = 0; i < maxLen; i++) {
    const b = before[i];
    const a = after[i];

    if (!b) {
      diffs.push({ table: i, type: "added", after: a });
      continue;
    }
    if (!a) {
      diffs.push({ table: i, type: "removed", before: b });
      continue;
    }

    // Compare headers
    if (JSON.stringify(b.headers) !== JSON.stringify(a.headers)) {
      diffs.push({
        table: i,
        type: "headers_changed",
        before: b.headers,
        after: a.headers,
      });
    }

    // Compare row count
    if (b.rows.length !== a.rows.length) {
      diffs.push({
        table: i,
        type: "row_count_changed",
        before: b.rows.length,
        after: a.rows.length,
      });
    }

    // Compare row data
    const minRows = Math.min(b.rows.length, a.rows.length);
    for (let r = 0; r < minRows; r++) {
      if (JSON.stringify(b.rows[r]) !== JSON.stringify(a.rows[r])) {
        diffs.push({
          table: i,
          type: "row_data_changed",
          row: r,
          before: b.rows[r],
          after: a.rows[r],
        });
      }
    }
  }

  return diffs;
}

function comparePage(label, beforeDir, afterDir) {
  const result = { label, pass: true, diffs: [] };

  const beforeDataPath = path.join(beforeDir, label, "data.json");
  const afterDataPath = path.join(afterDir, label, "data.json");

  if (!fs.existsSync(beforeDataPath)) {
    result.pass = false;
    result.diffs.push({ type: "missing_before" });
    return result;
  }
  if (!fs.existsSync(afterDataPath)) {
    result.pass = false;
    result.diffs.push({ type: "missing_after" });
    return result;
  }

  const before = loadJson(beforeDataPath);
  const after = loadJson(afterDataPath);

  // Compare HTTP status
  if (before.status !== after.status) {
    result.pass = false;
    result.diffs.push({
      type: "status_changed",
      before: before.status,
      after: after.status,
    });
  }

  // Compare table data
  const tableDiffs = diffTables(before.tables || [], after.tables || []);
  if (tableDiffs.length > 0) {
    result.pass = false;
    result.diffs.push({ type: "table_diffs", details: tableDiffs });
  }

  // Compare headings
  if (JSON.stringify(before.headings) !== JSON.stringify(after.headings)) {
    result.pass = false;
    result.diffs.push({
      type: "headings_changed",
      before: before.headings,
      after: after.headings,
    });
  }

  // Compare form structure
  const beforeForms = (before.forms || []).map((f) => ({
    action: f.action,
    method: f.method,
    fieldNames: f.fields.map((fi) => fi.name).sort(),
  }));
  const afterForms = (after.forms || []).map((f) => ({
    action: f.action,
    method: f.method,
    fieldNames: f.fields.map((fi) => fi.name).sort(),
  }));
  if (JSON.stringify(beforeForms) !== JSON.stringify(afterForms)) {
    result.pass = false;
    result.diffs.push({
      type: "forms_changed",
      before: beforeForms,
      after: afterForms,
    });
  }

  // Compare badges/counts
  if (JSON.stringify(before.badges) !== JSON.stringify(after.badges)) {
    result.pass = false;
    result.diffs.push({
      type: "badges_changed",
      before: before.badges,
      after: after.badges,
    });
  }

  return result;
}

function main() {
  const beforeDir = process.argv[2];
  const afterDir = process.argv[3];

  if (!beforeDir || !afterDir) {
    console.error("Usage: node compare-baselines.js <before-dir> <after-dir>");
    process.exit(1);
  }

  const beforeSummary = loadJson(path.join(beforeDir, "summary.json"));
  const labels = beforeSummary.routes.map((r) => r.label);

  console.log(`Comparing ${labels.length} pages: ${beforeDir} vs ${afterDir}\n`);

  const results = labels.map((label) =>
    comparePage(label, beforeDir, afterDir)
  );

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.pass) {
      console.log(`  PASS  ${r.label}`);
      passed++;
    } else {
      console.log(`  FAIL  ${r.label}`);
      for (const d of r.diffs) {
        console.log(`        - ${d.type}${d.details ? ` (${d.details.length} differences)` : ""}`);
      }
      failed++;
    }
  }

  console.log(`\n--- Results: ${passed} passed, ${failed} failed out of ${results.length} ---`);

  // Write detailed report
  const reportPath = path.join(afterDir, "comparison-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Detailed report: ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
