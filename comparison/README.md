# MySQL -> PostgreSQL Migration: Visual Comparison

Visual comparison of the HMS Hospital Management System running on both database backends.

**44 pages tested** | **43 identical** | **1 row-order diff** | **7/7 write flows pass**

---

## Landing & Authentication Pages

Public-facing pages -- no database queries, should be pixel-identical.

### Landing Page -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL landing](../baselines/mysql/landing/screenshot.png) | ![PG landing](../baselines/postgres/landing/screenshot.png) |

### Admin Login -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL login](../baselines/mysql/login/screenshot.png) | ![PG login](../baselines/postgres/login/screenshot.png) |

### Doctor Signup (loads departments from DB) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL doctorsignup](../baselines/mysql/doctorsignup/screenshot.png) | ![PG doctorsignup](../baselines/postgres/doctorsignup/screenshot.png) |

---

## Admin Dashboard & Lists

Data-heavy pages -- staff counts, appointment lists, multi-table JOINs, trigger-affected data.

### Admin Dashboard (staff count + appointment list) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL home](../baselines/mysql/admin-home/screenshot.png) | ![PG home](../baselines/postgres/admin-home/screenshot.png) |

### Appointments (3-table JOIN: appointments + patients + staff) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL appointments](../baselines/mysql/admin-appointments/screenshot.png) | ![PG appointments](../baselines/postgres/admin-appointments/screenshot.png) |

### Departments -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL departments](../baselines/mysql/admin-departments/screenshot.png) | ![PG departments](../baselines/postgres/admin-departments/screenshot.png) |

### Employees -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL employees](../baselines/mysql/admin-employees/screenshot.png) | ![PG employees](../baselines/postgres/admin-employees/screenshot.png) |

### Medicine Store (ORDER BY id DESC) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL store](../baselines/mysql/admin-store/screenshot.png) | ![PG store](../baselines/postgres/admin-store/screenshot.png) |

### Doctors List -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL doctors](../baselines/mysql/admin-doctors-list/screenshot.png) | ![PG doctors](../baselines/postgres/admin-doctors-list/screenshot.png) |

---

## Edit & Detail Pages

Forms pre-populated with data from the database.

### Edit Employee (pre-filled from DB) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL edit emp](../baselines/mysql/admin-edit-employee/screenshot.png) | ![PG edit emp](../baselines/postgres/admin-edit-employee/screenshot.png) |

### Edit Medicine (pre-filled from DB) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL edit med](../baselines/mysql/admin-edit-med/screenshot.png) | ![PG edit med](../baselines/postgres/admin-edit-med/screenshot.png) |

### Employee Payslip -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL payslip](../baselines/mysql/admin-payslip/screenshot.png) | ![PG payslip](../baselines/postgres/admin-payslip/screenshot.png) |

---

## Patient & Doctor Portals

Requires dynamic VIEW creation on login, JOIN queries with patient/staff data.

### Patient Home (dynamic VIEW + JOIN with staff) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL patient](../baselines/mysql/patient-home/screenshot.png) | ![PG patient](../baselines/postgres/patient-home/screenshot.png) |

### Doctor Home (dynamic VIEW + JOIN with patients) -- PASS

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL doctor](../baselines/mysql/doctor-home/screenshot.png) | ![PG doctor](../baselines/postgres/doctor-home/screenshot.png) |

---

## Write-Then-Verify Flows

INSERT data via forms, then verify it appears correctly in the list page.

### Add Employee -> Verify in List -- PASS

Inserted "Test Nurse" -- verified appears in employee table on both backends.

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL add emp](../baselines/mysql/flow-add-employee-result/screenshot.png) | ![PG add emp](../baselines/postgres/flow-add-employee-result/screenshot.png) |

### Search Employee (LIKE query) -- PASS

Searched for "John" -- verified "John Davis" found on both backends.

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL search emp](../baselines/mysql/flow-search-employee-result/screenshot.png) | ![PG search emp](../baselines/postgres/flow-search-employee-result/screenshot.png) |

### Add Medicine -> Verify in Store -- PASS

Inserted "Aspirin" -- verified appears in medicine store on both backends.

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL add med](../baselines/mysql/flow-add-medicine-result/screenshot.png) | ![PG add med](../baselines/postgres/flow-add-medicine-result/screenshot.png) |

### Add Department -> Verify in List -- PASS

Inserted "Radiology" -- verified appears in department list on both backends.

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL add dept](../baselines/mysql/flow-add-department-result/screenshot.png) | ![PG add dept](../baselines/postgres/flow-add-department-result/screenshot.png) |

### Patient Book Appointment (multi-step flow with trigger) -- ROW ORDER DIFF

Patient selected Neurology dept, booked "Headache Consultation" -- data present on both, rows in different order (no ORDER BY in query).

| MySQL | PostgreSQL |
|-------|-----------|
| ![MySQL book apt](../baselines/mysql/flow-patient-book-apt-result/screenshot.png) | ![PG book apt](../baselines/postgres/flow-patient-book-apt-result/screenshot.png) |
