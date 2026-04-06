# Techniques

Techniques discovered and applied during this MySQL-to-PostgreSQL migration project.

## 1. Web App as Behavioral Oracle

Instead of writing SQL-level unit tests for migration correctness, use the web application's rendered output as the source of truth. If the same page produces the same HTML when backed by MySQL vs PostgreSQL, the migration is correct — regardless of internal query differences.

**Why it works**: The web app exercises the full stack — queries, joins, stored procedures, triggers, views — through realistic code paths. A rendered page is the ultimate integration test.

**Limitation**: Non-deterministic query results (no ORDER BY) can produce different row orderings that are both correct. The comparison framework needs to account for this.

## 2. Headless Chrome for Structured Data Extraction

Playwright captures more than screenshots. For each page, extract structured data from the DOM:
- Table contents (headers + all row data)
- Form fields (names, types, pre-filled values)
- Headings and badges
- Alert/message text

This makes diffing programmatic rather than visual. Two pages can look identical in screenshots but have subtle data differences that only show up in extracted table rows.

## 3. Write-Then-Verify Flows

Read-only page captures only test SELECT queries. To test INSERT, UPDATE, and DELETE operations:
1. Navigate to the add/edit form
2. Fill fields and submit
3. Navigate to the list page
4. Extract table data and verify the new record appears

This caught bugs that read-only testing missed entirely (e.g., LIKE quoting differences, date format issues, case-sensitive column names).

## 4. MySQL-Compatible PostgreSQL Wrapper

Rather than rewriting the entire application's data access layer, create a thin wrapper around the `pg` npm package that exposes the same `.query(sql, params, callback)` API as the `mysql` package. The wrapper handles translation at runtime:
- `?` placeholders -> `$1, $2, ...`
- Backtick removal
- Function name translation (`DATE(NOW())` -> `CURRENT_DATE`, `IFNULL` -> `COALESCE`)
- LIKE string quoting (`"%foo%"` -> `'%foo%'`)

This keeps application code untouched and isolates all MySQL/PG differences in one file.

## 5. DDL Parameter Inlining

PostgreSQL doesn't support parameterized queries in DDL statements (`CREATE VIEW ... WHERE id=$1` fails). The wrapper detects DDL statements by regex (`/^\s*(create|alter|drop)\s/i`) and inlines parameters with proper escaping instead of using `$N` placeholders.

This was discovered at runtime when the patient login flow crashed — it creates a view dynamically on each login.

## 6. Reverse-Engineering Schema from Application Code

When the provided SQL dump is incomplete (common with student/demo projects), reconstruct the full schema by:
1. Reading all `db_controller.js` functions for table/column references
2. Reading all controllers for direct SQL queries
3. Reading EJS templates for column name references in display logic
4. Cross-referencing INSERT, SELECT, and UPDATE queries to infer column types and constraints

This produced 18 tables from an SQL dump that only defined 8.

## 7. Environment Variable Database Switching

Use a single env var (`DB_DRIVER=mysql` or `DB_DRIVER=pg`) to switch between backends. The `db_config.js` factory module loads the appropriate driver. This allows:
- Running the same app code against both databases
- Resetting each database independently
- Capturing baselines with identical application code

## 8. Centralized Connection Patching

When an app has hardcoded database connections scattered across many files (11 files in this case), create a shared config module and replace all connection sites. Search with `grep -r "mysql.createConnection"` to find every site. This is a prerequisite for the env-var switching technique above.

## 9. Seed Data as Test Fixtures

Use identical seed data in both database init scripts. This ensures that read-only page captures produce byte-identical output (excluding timestamps). The seed data should cover:
- Multiple records per table (to test list rendering)
- Foreign key relationships (to test JOINs)
- Data that triggers computed values (e.g., appointments that fire the max_allowed trigger)

## 10. page.evaluate() to Bypass UI Widgets

Bootstrap datepicker and similar widgets intercept normal keyboard input. Playwright's `page.fill()` may not work because the widget overrides the value. Use `page.evaluate()` to set the input value directly via the DOM, bypassing the widget entirely:

```js
await page.evaluate(
  ({ sel, val }) => {
    document.querySelector(sel).value = val;
  },
  { sel: '[name="date"]', val: '2024-03-01' }
);
```

## 11. Date Format Sensitivity in Write Tests

MySQL's DATE type silently rejects invalid formats when inserted via string concatenation (the `mysql` npm driver doesn't throw — the callback fires with no error but the row isn't inserted). Always use ISO format (`YYYY-MM-DD`) in test data. Verify writes actually persisted by checking the database directly, not just the server logs.

## 12. Case Sensitivity as a Migration Trap

MySQL column names are case-insensitive. PostgreSQL folds unquoted identifiers to lowercase. A column created as `locationName` in MySQL works fine when queried as `locationName`, `LOCATIONNAME`, or `locationname`. In PostgreSQL:
- If created as `"locationName"` (quoted), it must always be referenced as `"locationName"`
- If created as `locationName` (unquoted), it becomes `locationname` and must be referenced as lowercase

The safest approach: use lowercase column names in the PostgreSQL schema and let PG's case-folding handle the rest, since application queries are typically unquoted.

## 13. Incremental Verification

Don't wait until the full migration is done to test. Verify at each stage:
1. After schema load: `SHOW TABLES` / `\dt` to confirm all objects created
2. After seed data: spot-check row counts
3. After app starts: curl every route for HTTP 200
4. After baseline capture: inspect extracted data JSON to confirm real content
5. After comparison: investigate every FAIL before declaring success

## 14. Comparison with Tolerance

The baseline comparison script should distinguish between:
- **Real failures**: different HTTP status, missing/extra table rows, wrong data values
- **Expected differences**: non-deterministic row ordering, timestamp differences

Strip timestamps before comparing. For row-order differences, consider sorting rows before comparison (or flagging as a known issue rather than a hard failure).
