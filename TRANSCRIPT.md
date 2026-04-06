# Session Log — SQL Migration Test Framework

**Date**: 2026-04-06  
**Repository**: https://github.com/sammcveety/migration-test  

## Objective

Build a framework that uses an existing web application and headless Chrome to verify behavioral equivalence after migrating a database from MySQL to PostgreSQL. The key insight: use the web app's rendered pages as a behavioral oracle, rather than writing SQL-level unit tests.

## Research Phase

### Requirements Gathered
1. Use an **existing** open-source web app (not build a new one)
2. The app must use **stored procedures, UDFs, and triggers** (non-trivial SQL)
3. The app must have a **web UI** (for headless Chrome testing)
4. There should be **no existing PostgreSQL translation** (so the migration is novel)
5. Use **headless Chrome** (Playwright) to capture and diff page output

### Candidates Evaluated

Searched GitHub and the web for sample apps meeting these criteria. Evaluated:

- **Sakila-based apps** (polterguy/sakila, felipeinf/vue_sakila-frontend) — Rejected because jOOQ/sakila already has a complete PostgreSQL port, making the migration "already solved"
- **Northwind-based apps** — Most lack stored procedures in the web layer
- **AdventureWorks** — SQL Server, heavy setup
- **AtalAkbari/E-Commerce-Database** — Oracle + PHP, interesting but heavy Oracle dependency
- **UmairHabib/Web-Based-Pharmacy** — ASP.NET + SQL Server, stored procs + triggers, but .NET + SQL Server setup is heavy
- **bhumijgupta/Ecommerce-management-DBMS-project** — Oracle PL/SQL with cursors, triggers, functions; most complex but Oracle is heaviest

### Winner: alinadir44/HMS (Hospital Management System)

- **Stack**: Node.js + EJS + MySQL
- **DB features**: Stored procedures, triggers, views created dynamically on login
- **Web UI**: 46 EJS server-rendered templates across admin, patient, and doctor roles
- **Migration path**: MySQL → PostgreSQL (no existing port)
- **Why**: Lightweight setup, real rendered HTML pages ideal for Playwright, non-trivial DB logic

## Phase 1: Setup the Source Application

### Cloning and Analysis
- Cloned alinadir44/HMS into `/home/sam_mcveety/migration-test/HMS`
- Discovered the included `nodelogin.sql` was incomplete — only defined 8 tables, but the app code references 18 tables
- Reverse-engineered the complete schema from:
  - `models/db_controller.js` (30+ exported functions with raw SQL)
  - 10 controllers with direct database queries
  - EJS templates that reference specific column names

### Key Findings
- **18 tables** needed (patients, staff, department, appointments, bills, ratings, works_for, admin, doctor, employee, store, complain, departments, leaves, users, verify, temp, appointment)
- **2 triggers**: updateMaxAllowed (after insert on appointments), updateMaxAllowed1 (after delete)
- **1 stored procedure** in original: GetStaffInfo
- **Dual table structures**: Both `doctor` and `staff` tables exist (legacy vs newer code paths)
- **Multiple bugs in source**: SQL syntax error in appointment.js (trailing `=`), column name mismatches (`apt_id` vs `aptid`), broken EJS template (duplicate closing tag), trailing space in view engine setting

### Schema and Seed Data
- Created complete `db/mysql/init.sql` with all 18 tables + 2 triggers + 4 stored procedures + 3 UDFs + seed data
- Added additional stored procedures and UDFs to make the migration more meaningful:
  - `GetPatientBills(p_id)` — joins bills with appointments
  - `GetDepartmentStaff(d_id)` — joins staff with works_for
  - `CreateAppointmentWithBill(...)` — multi-statement transaction with LAST_INSERT_ID
  - `GetStaffRating(s_id)` — returns average rating
  - `GetPatientBalance(p_id)` — returns patient balance
  - `IsStaffAvailable(s_id)` — boolean check on max_allowed

### Dockerization and Connection Patching
- Created `docker-compose.yml` and `Dockerfile` (for future use — Docker not available on the VM)
- Found **11 files** with hardcoded `mysql.createConnection({host: "localhost", ...})` calls
- Created shared `models/db_config.js` module reading from env vars (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- Patched all 11 connection sites to use the shared config
- Fixed IPv6 connection issue (Node.js resolves "localhost" to ::1, but MariaDB listens on IPv4 only)

### Bug Fixes
1. `appointment.js`: Removed trailing `=` from JOIN query
2. `appointment.js` + `appointment.ejs`: Fixed `apt_id` → `aptid` column name
3. `appointment.ejs`: Removed duplicate `<% } %>` causing EJS parse error
4. `appointment.ejs`: Fixed `doctor_name` → `staff_name` (JOIN returns staff columns)
5. `app.js`: Fixed `'view engine '` → `'view engine'` (trailing space)
6. `db_controller.js`: Changed `throw err` to `console.error` on connection failure

### Verification
- Installed Node.js 18, npm 9, MariaDB 10.11 on Debian 12 cloud VM
- All 17 routes verified returning HTTP 200 across all auth contexts

## Phase 2: Baseline Capture with Headless Chrome

### Playwright Setup
- Installed Playwright + Chromium headless shell
- Installed system dependencies (libgbm, libpango, etc.)

### Capture Script (`tests/capture-baseline.js`)
- Navigates 17 routes across 4 auth contexts (public, admin, patient, doctor)
- For each page captures:
  - **Screenshot** (full-page PNG)
  - **HTML snapshot** (complete rendered HTML)
  - **Extracted data** (JSON): table contents, headings, form structure, badges/counts, alerts
- Handles authentication by filling login forms and following redirects
- Outputs structured directory: `baselines/<backend>/<route-label>/`

### Comparison Script (`tests/compare-baselines.js`)
- Diffs two baseline captures
- Compares: HTTP status, table data (headers + rows), headings, form structure, badge counts
- Reports PASS/FAIL per page with detailed diff output
- Writes `comparison-report.json` for programmatic consumption

### MySQL Baseline
- Captured all 17 pages successfully
- Verified real database-driven content in extracted data (patient names, doctor names, appointment dates)

## Phase 3: PostgreSQL Schema Translation

### DDL Translation (MySQL → PostgreSQL)
| MySQL | PostgreSQL |
|-------|-----------|
| `AUTO_INCREMENT` | `SERIAL` |
| `INT NOT NULL PRIMARY KEY AUTO_INCREMENT` | `SERIAL PRIMARY KEY` |
| `ALTER TABLE t AUTO_INCREMENT = 100` | `ALTER SEQUENCE t_col_seq RESTART WITH 100` |
| `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` | (removed — PG default) |
| `REAL` | `REAL` (same) |
| Backtick quoting `` `col` `` | Double-quote quoting `"col"` or none |

### Trigger Translation
MySQL triggers are inline; PostgreSQL requires separate trigger functions:
```sql
-- MySQL
CREATE TRIGGER updateMaxAllowed AFTER INSERT ON appointments
FOR EACH ROW BEGIN
  UPDATE staff SET max_allowed = max_allowed - 1 WHERE staff_id = NEW.staff_id;
END;

-- PostgreSQL
CREATE FUNCTION update_max_allowed_after_insert() RETURNS TRIGGER AS $$
BEGIN
  UPDATE staff SET max_allowed = max_allowed - 1 WHERE staff_id = NEW.staff_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "updateMaxAllowed" AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION update_max_allowed_after_insert();
```

### Stored Procedure Translation
| MySQL | PostgreSQL |
|-------|-----------|
| `DELIMITER //` | Not needed (uses `$$` delimiters) |
| `CREATE PROCEDURE name(IN p INT)` | `CREATE PROCEDURE name(IN p INT) LANGUAGE plpgsql AS $$ ... $$` |
| `SET var = LAST_INSERT_ID()` | `RETURNING col INTO var` |
| `DATE_ADD(date, INTERVAL 30 DAY)` | `date + INTERVAL '30 days'` |

### UDF Translation
| MySQL | PostgreSQL |
|-------|-----------|
| `CREATE FUNCTION name(p INT) RETURNS type DETERMINISTIC` | `CREATE FUNCTION name(p INT) RETURNS type AS $$ ... $$ LANGUAGE plpgsql` |
| `RETURNS BOOLEAN` + `RETURN TRUE` | Same syntax in PL/pgSQL |

## Phase 4: Application Adaptation

### PostgreSQL Driver Wrapper (`models/db_config_pg.js`)
Created a MySQL-API-compatible wrapper around the `pg` npm package:
- Exposes `.query(sql, params, callback)` matching the `mysql` driver interface
- Returns `result.rows` instead of raw result (mysql returns rows directly, pg wraps them)
- Provides no-op `.connect()` method (auto-connects on creation)

### Query Translation Layer
Runtime SQL translation in the wrapper:
- `?` placeholders → `$1, $2, ...` (PostgreSQL parameterized query format)
- Backtick removal (`` ` `` → nothing)
- `DATE(NOW())` → `CURRENT_DATE`
- `IFNULL(...)` → `COALESCE(...)`

### DDL Parameter Inlining
Critical discovery: PostgreSQL doesn't support parameterized queries in DDL statements. The app creates views on login:
```sql
CREATE OR REPLACE VIEW patient_apts AS SELECT * FROM appointments WHERE patient_id=?
```
The wrapper detects DDL (`CREATE`, `ALTER`, `DROP`) and inlines parameters with proper escaping instead of using `$N` placeholders.

### Backend Switching
`db_config.js` acts as a factory:
- `DB_DRIVER=mysql` (default) ��� uses `mysql` npm package
- `DB_DRIVER=pg` → uses `pg` npm package via the compatibility wrapper

## Phase 5: Post-Migration Verification

### Test Results
```
Comparing 17 pages: baselines/mysql vs baselines/postgres

  PASS  landing
  PASS  login
  PASS  signup
  PASS  patientlogin
  PASS  doctorlogin
  PASS  patientsignup
  PASS  doctorsignup
  PASS  admin-home
  PASS  admin-departments
  PASS  admin-appointments
  PASS  admin-store
  PASS  admin-employees
  PASS  admin-leaves
  PASS  admin-inbox
  PASS  admin-receipt
  PASS  patient-home
  PASS  doctor-home

--- Results: 17 passed, 0 failed out of 17 ---
```

**All 17 pages produce identical rendered output** when backed by MySQL vs PostgreSQL.

## Commit History

1. `8e38dff` — Initial commit: project plan and candidate analysis
2. `4bbc05e` — Add HMS app source, Docker setup, and complete MySQL schema
3. `acc5dd9` — Fix app bugs and verify all routes working
4. `8a1e4b5` — Add Playwright test harness and MySQL baseline capture
5. `8e02363` — Complete MySQL → PostgreSQL migration with full test verification

## Architecture Summary

```
migration-test/
├── README.md                  # Project plan
├── TRANSCRIPT.md              # This file
├��─ docker-compose.yml         # Docker setup (MySQL + app)
├── HMS/                       # Hospital Management System (Node.js + EJS)
│   ├── app.js                 # Express server, route mounting
│   ├── models/
│   │   ├── db_config.js       # Connection factory (MySQL or PG based on DB_DRIVER)
│   │   ├── db_config_pg.js    # PostgreSQL wrapper with MySQL-compatible API
│   │   └── db_controller.js   # Data access layer (raw SQL queries)
│   ├── controllers/           # 24 route controllers
│   └── views/                 # 46 EJS templates
├── db/
│   ├── mysql/init.sql         # Complete MySQL schema + seed data
│   └── postgres/init.sql      # PostgreSQL translation
├── tests/
│   ├── capture-baseline.js    # Playwright headless Chrome capture
│   └── compare-baselines.js   # Baseline diff/comparison
└── baselines/
    ├── mysql/                 # Baseline from MySQL backend
    └── postgres/              # Baseline from PostgreSQL backend
```
