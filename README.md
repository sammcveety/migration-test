# SQL Dialect Migration Test Framework

Test framework that uses an existing web application and headless Chrome to verify behavioral equivalence after migrating a database from one SQL dialect to another.

## Goal

1. Take an existing web app backed by a database with stored procedures/UDFs/triggers
2. Use headless Chrome to capture the app's behavior as a baseline against the source database
3. Migrate the database schema + procedural logic to a different SQL dialect
4. Replay the same headless Chrome tests against the migrated database to verify behavioral equivalence

## Candidate Web Applications

Three candidates identified (none have existing PostgreSQL translations):

### Option 1 (Recommended): alinadir44/HMS — Hospital Management System
- **Repo**: https://github.com/alinadir44/HMS
- **Stack**: Node.js + EJS + MySQL
- **DB features**: Stored procedures, triggers, complex queries
- **Web UI**: EJS server-rendered HTML (ideal for headless Chrome)
- **Migration path**: MySQL → PostgreSQL
- **Why recommended**: Lightweight setup, real rendered pages for browser testing, non-trivial stored procs/triggers, no existing PG port

### Option 2: UmairHabib/Web-Based-Pharmacy-using-C-Sharp-and-SQL — Pharmacy System
- **Repo**: https://github.com/UmairHabib/Web-Based-Pharmacy-using-C-Sharp-and-SQL
- **Stack**: ASP.NET + C# + SQL Server
- **DB features**: Stored procedures, triggers, transactions
- **Migration path**: T-SQL → PostgreSQL
- **Tradeoff**: Harder/more realistic migration, but heavier setup (.NET + SQL Server)

### Option 3: bhumijgupta/Ecommerce-management-DBMS-project — E-Commerce Platform
- **Repo**: https://github.com/bhumijgupta/Ecommerce-management-DBMS-project
- **Stack**: Web frontend + Oracle PL/SQL
- **DB features**: Stored procs with cursors, triggers, functions (cost_filter, total_cost, totalProducts)
- **Migration path**: Oracle PL/SQL → PostgreSQL
- **Tradeoff**: Most complex procedural logic, heaviest DB setup

## Implementation Plan

### Phase 1: Setup the source application
1. Clone the chosen repo
2. Create a `docker-compose.yml` that runs the source database + the web app
3. Load schema including all stored procedures, UDFs, triggers, and seed data
4. Verify the app runs and pages render correctly

### Phase 2: Baseline capture with headless Chrome
1. Set up a headless Chrome test harness (Puppeteer or Playwright)
2. Enumerate the app's pages/routes by reading source code (EJS templates, route definitions)
3. For each page/route:
   - Navigate with headless Chrome
   - Capture: rendered HTML snapshots, screenshot PNGs, key data values extracted from the DOM
   - For forms/actions: submit test data and capture resulting state
4. Store baselines in structured directory (e.g., `baselines/{route}/{snapshot.html, screenshot.png, data.json}`)
5. Build a test runner that replays captures and diffs against new results

### Phase 3: Schema and procedural logic migration
1. Extract full source schema (tables, indexes, constraints, views, stored procs, UDFs, triggers)
2. Translate each component to PostgreSQL:
   - **DDL**: data type mappings (AUTO_INCREMENT → SERIAL, TINYINT → SMALLINT, etc.)
   - **Stored procedures**: MySQL procedure syntax → PL/pgSQL CREATE FUNCTION/PROCEDURE
   - **UDFs**: MySQL FUNCTION → PostgreSQL CREATE FUNCTION
   - **Triggers**: MySQL trigger syntax → PostgreSQL trigger + trigger function pattern
   - **Views**: mostly compatible, check for MySQL-specific functions
3. Stand up a PostgreSQL container in the same docker-compose
4. Load translated schema and seed data
5. Verify all objects created successfully

### Phase 4: Application adaptation
1. Modify the app's DB connection config to point at PostgreSQL
2. Update the dialect/driver (e.g., `mysql2` → `pg` for Node.js)
3. Translate any raw SQL in the app layer (backtick quoting, IFNULL → COALESCE, LIMIT syntax, etc.)
4. Verify the app starts and connects to PostgreSQL

### Phase 5: Post-migration verification
1. Re-run headless Chrome test suite against the app now backed by PostgreSQL
2. Diff results against baselines:
   - HTML structure diffs (ignoring non-semantic whitespace)
   - Data value comparison (DOM-extracted values should match)
   - Screenshot visual diffs (optional, for layout regressions)
3. Report: which pages pass, which fail, what the specific differences are

### Phase 6: Iteration and reporting
1. For failures, diagnose root cause: schema translation, procedural logic, or app-layer SQL
2. Fix and re-run until all tests pass
3. Document the migration as a reproducible process

## Open Design Decisions
- **Which candidate**: All three are viable; HMS recommended for ease of setup + good headless Chrome fit
- **Test framework**: Puppeteer vs Playwright (Playwright is more modern, better cross-browser)
- **Migration tooling**: Manual translation vs. pgloader for data + manual proc translation
- **App-layer SQL**: If the Node.js app has hardcoded MySQL queries, those need translation too
