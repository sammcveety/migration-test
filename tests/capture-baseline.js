/**
 * Baseline Capture Script (v2 — full coverage)
 *
 * Navigates the HMS web app with headless Chrome via Playwright.
 * Captures all GET routes + performs write-then-verify flows for POST routes.
 * Results are stored in baselines/<label>/ for later diffing.
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const BASELINE_DIR = path.join(__dirname, "..", "baselines");

// ---------------------------------------------------------------------------
// Route definitions grouped by auth context
// ---------------------------------------------------------------------------

const ROUTES = {
  public: [
    { path: "/", label: "landing" },
    { path: "/login", label: "login" },
    { path: "/signup", label: "signup" },
    { path: "/patientlogin", label: "patientlogin" },
    { path: "/doctorlogin", label: "doctorlogin" },
    { path: "/patientsignup", label: "patientsignup" },
    { path: "/doctorsignup", label: "doctorsignup" },
    { path: "/complain", label: "complain-form" },
    { path: "/verify", label: "verify" },
    { path: "/resetpassword", label: "resetpassword" },
    { path: "/setpassword", label: "setpassword" },
  ],
  admin: [
    // Dashboard & lists
    { path: "/home", label: "admin-home" },
    { path: "/home/departments", label: "admin-departments" },
    { path: "/home/add_departments", label: "admin-add-departments" },
    { path: "/appointment", label: "admin-appointments" },
    { path: "/store", label: "admin-store" },
    { path: "/store/add_med", label: "admin-add-med" },
    { path: "/employee", label: "admin-employees" },
    { path: "/employee/add", label: "admin-add-employee" },
    { path: "/employee/leave", label: "admin-leaves" },
    { path: "/employee/add_leave", label: "admin-add-leave" },
    { path: "/doctors", label: "admin-doctors-list" },
    { path: "/doctors/add_doctor", label: "admin-add-doctor" },
    { path: "/inbox", label: "admin-inbox" },
    { path: "/receipt", label: "admin-receipt" },
    // Detail/edit pages with known IDs from seed data
    { path: "/store/edit_med/1", label: "admin-edit-med" },
    { path: "/store/delete_med/1", label: "admin-delete-med" },
    { path: "/employee/edit_employee/1", label: "admin-edit-employee" },
    { path: "/employee/delete_employee/1", label: "admin-delete-employee" },
    { path: "/doctors/edit_doctor/1", label: "admin-edit-doctor" },
    { path: "/doctors/delete_doctor/1", label: "admin-delete-doctor" },
    { path: "/receipt/generateslip/1", label: "admin-payslip" },
    { path: "/appointment/delete_appointment/100", label: "admin-delete-appointment" },
  ],
  patient: [
    { path: "/patienthome", label: "patient-home" },
    { path: "/patienthome/bills", label: "patient-bills" },
    { path: "/patienthome/edit_apt/100", label: "patient-edit-apt" },
  ],
  doctor: [
    { path: "/doctorhome", label: "doctor-home" },
  ],
};

// Login credentials for each role
const CREDENTIALS = {
  admin: { url: "/login", username: "admin", password: "admin123" },
  patient: { url: "/patientlogin", username: "alice", password: "pass123" },
  doctor: { url: "/doctorlogin", username: "drchen", password: "doc123" },
};

// ---------------------------------------------------------------------------
// Write-then-verify flows
// ---------------------------------------------------------------------------

/**
 * Each flow: submit a form, then capture the resulting list page to verify
 * the data was written and is displayed correctly.
 */
const WRITE_FLOWS = {
  admin: [
    {
      label: "flow-add-employee",
      description: "Add a new employee, verify it appears in the list",
      steps: [
        { action: "navigate", url: "/employee/add" },
        {
          action: "fill_and_submit",
          fields: {
            name: "Test Nurse",
            email: "testnurse@hospital.com",
            contact: "555-9999",
            date: "2024-03-01",
            salary: "55000",
          },
          selectFields: { role: "Nurse" },
          submit: ".submit-btn",
        },
        {
          action: "capture",
          url: "/employee",
          label: "flow-add-employee-result",
          verify: { tableContains: "Test Nurse" },
        },
      ],
    },
    {
      label: "flow-search-employee",
      description: "Search for an employee by name",
      steps: [
        { action: "navigate", url: "/employee" },
        {
          action: "fill_and_submit",
          fields: { search: "John" },
          submit: 'button[formaction="/employee/search"]',
        },
        {
          action: "capture_current",
          label: "flow-search-employee-result",
          verify: { tableContains: "John Davis" },
        },
      ],
    },
    {
      label: "flow-add-medicine",
      description: "Add a new medicine, verify it appears in the store",
      steps: [
        { action: "navigate", url: "/store/add_med" },
        {
          action: "fill_and_submit",
          fields: {
            name: "Aspirin",
            p_date: "2024-04-01",
            expire: "3",
            e_date: "2027-04-01",
            price: "5.99",
            quantity: "800",
          },
          submit: ".submit-btn",
        },
        {
          action: "capture",
          url: "/store",
          label: "flow-add-medicine-result",
          verify: { tableContains: "Aspirin" },
        },
      ],
    },
    {
      label: "flow-search-medicine",
      description: "Search for a medicine by name",
      steps: [
        { action: "navigate", url: "/store" },
        {
          action: "fill_and_submit",
          fields: { search: "Ibuprofen" },
          submit: 'button[formaction="/store/search"]',
        },
        {
          action: "capture_current",
          label: "flow-search-medicine-result",
          verify: { tableContains: "Ibuprofen" },
        },
      ],
    },
    {
      label: "flow-add-department",
      description: "Add a new department, verify it appears in the list",
      steps: [
        { action: "navigate", url: "/home/add_departments" },
        {
          action: "fill_and_submit",
          fields: { dname: "Radiology" },
          textareaFields: {
            contact: "555-0199",
            location: "Building D, Floor 2",
          },
          submit: ".submit-btn",
        },
        {
          action: "capture",
          url: "/home/departments",
          label: "flow-add-department-result",
          verify: { tableContains: "Radiology" },
        },
      ],
    },
    {
      label: "flow-add-leave",
      description: "Add a leave request, verify it appears in the list",
      steps: [
        { action: "navigate", url: "/employee/add_leave" },
        {
          action: "fill_and_submit",
          fields: {
            name: "John Davis",
            id: "1",
            from: "2024-04-10",
            to: "2024-04-12",
          },
          selectFields: { leave_type: "Casual Leave" },
          textareaFields: { reason: "Flu" },
          submit: ".submit-btn",
        },
        {
          action: "capture",
          url: "/employee/leave",
          label: "flow-add-leave-result",
          verify: { tableContains: "John Davis" },
        },
      ],
    },
  ],
  patient: [
    {
      label: "flow-patient-book-apt",
      description: "Patient selects department then books an appointment",
      steps: [
        { action: "navigate", url: "/patienthome" },
        {
          // Select Neurology department (dept_id=101)
          action: "fill_and_submit",
          selectFields: { department: "101" },
          fields: {},
          submit: ".account-btn, button[type='submit']",
        },
        {
          // Now on add_apt page — fill appointment form
          action: "fill_and_submit",
          fields: {
            title: "Headache Consultation",
            date: "2024-05-01",
          },
          selectFields: { staff_id: "101" },
          submit: ".submit-btn, button[type='submit']",
        },
        {
          action: "capture",
          url: "/patienthome",
          label: "flow-patient-book-apt-result",
          verify: { tableContains: "Headache Consultation" },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract structured data from the page DOM.
 */
async function extractPageData(page) {
  return page.evaluate(() => {
    const data = {};

    const tables = document.querySelectorAll("table");
    data.tables = Array.from(tables).map((table, idx) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent.trim()
      );
      const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
        Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim())
      );
      return { index: idx, headers, rows };
    });

    data.headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).map((h) => ({ tag: h.tagName, text: h.textContent.trim() }));

    const forms = document.querySelectorAll("form");
    data.forms = Array.from(forms).map((form) => ({
      action: form.action,
      method: form.method,
      fields: Array.from(
        form.querySelectorAll("input, select, textarea")
      ).map((el) => ({
        type: el.type || el.tagName.toLowerCase(),
        name: el.name,
        value: el.value,
      })),
    }));

    data.badges = Array.from(
      document.querySelectorAll(".badge, .dash-widget-info h3, .dash-count")
    ).map((el) => el.textContent.trim());

    data.alerts = Array.from(
      document.querySelectorAll(".alert, .swal2-title, .flash-message")
    ).map((el) => el.textContent.trim());

    return data;
  });
}

/**
 * Capture a single page: screenshot, HTML snapshot, and extracted data.
 */
async function capturePage(page, label, urlOrNull, outputDir) {
  const dir = path.join(outputDir, label);
  fs.mkdirSync(dir, { recursive: true });

  let status;
  if (urlOrNull) {
    const response = await page.goto(`${BASE_URL}${urlOrNull}`, {
      waitUntil: "networkidle",
      timeout: 15000,
    }).catch((e) => { console.error(`    navigation error: ${e.message}`); return null; });
    status = response ? response.status() : "error";
  } else {
    status = 200; // already on the page
  }

  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(dir, "screenshot.png"),
    fullPage: true,
  });

  const html = await page.content();
  fs.writeFileSync(path.join(dir, "snapshot.html"), html);

  const data = await extractPageData(page);
  data.url = page.url();
  data.status = status;
  data.timestamp = new Date().toISOString();
  fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify(data, null, 2));

  return { label, status, tables: data.tables.length, data };
}

/**
 * Login to the app.
 */
async function login(page, role) {
  const cred = CREDENTIALS[role];
  await page.goto(`${BASE_URL}${cred.url}`, { waitUntil: "networkidle" });
  await page.fill('input[name="username"]', cred.username);
  await page.fill('input[name="password"]', cred.password);
  await page.click('button[type="submit"], input[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
}

/**
 * Execute a write-then-verify flow.
 */
async function executeFlow(page, flow, outputDir) {
  console.log(`  [flow] ${flow.label}: ${flow.description}`);
  const results = [];

  for (const step of flow.steps) {
    switch (step.action) {
      case "navigate":
        await page.goto(`${BASE_URL}${step.url}`, {
          waitUntil: "networkidle",
          timeout: 15000,
        }).catch((e) => console.error(`    nav error: ${e.message}`));
        console.log(`    navigated to: ${page.url()}`);
        break;

      case "fill_and_submit":
        // Fill regular input fields
        for (const [name, value] of Object.entries(step.fields || {})) {
          try {
            const selector = `input[name="${name}"], input#${name}`;
            const el = await page.$(selector);
            if (!el) {
              console.log(`    warning: input "${name}" not found, skipping`);
              continue;
            }
            // Clear and set value directly to bypass datepicker widgets
            await page.evaluate(
              ({ sel, val }) => {
                const input = document.querySelector(sel);
                if (input) { input.value = val; }
              },
              { sel: `[name="${name}"]`, val: value }
            );
          } catch (e) {
            console.log(`    warning filling input "${name}": ${e.message}`);
          }
        }
        // Fill select fields
        for (const [name, value] of Object.entries(step.selectFields || {})) {
          try {
            const selector = `select[name="${name}"]`;
            const el = await page.$(selector);
            if (!el) {
              console.log(`    warning: select "${name}" not found, skipping`);
              continue;
            }
            // Try by value first, fall back to label
            await page.selectOption(selector, value).catch(() =>
              page.selectOption(selector, { label: value })
            );
          } catch (e) {
            console.log(`    warning selecting "${name}": ${e.message}`);
          }
        }
        // Fill textarea fields
        for (const [name, value] of Object.entries(step.textareaFields || {})) {
          try {
            const selector = `textarea[name="${name}"]`;
            const el = await page.$(selector);
            if (!el) {
              console.log(`    warning: textarea "${name}" not found, skipping`);
              continue;
            }
            await el.fill(value);
          } catch (e) {
            console.log(`    warning filling textarea "${name}": ${e.message}`);
          }
        }
        // Submit
        try {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {}),
            page.click(step.submit),
          ]);
        } catch (e) {
          console.log(`    submit error: ${e.message}`);
        }
        console.log(`    after submit: ${page.url()}`);
        break;

      case "capture":
        const result = await capturePage(page, step.label, step.url, outputDir);
        if (step.verify && step.verify.tableContains) {
          const found = (result.data.tables || []).some((t) =>
            t.rows.some((r) => r.some((c) => c.includes(step.verify.tableContains)))
          );
          result.verified = found;
          console.log(
            `    verify "${step.verify.tableContains}" in table: ${found ? "FOUND" : "NOT FOUND"}`
          );
        }
        results.push(result);
        break;

      case "capture_current":
        const curResult = await capturePage(page, step.label, null, outputDir);
        if (step.verify && step.verify.tableContains) {
          const found = (curResult.data.tables || []).some((t) =>
            t.rows.some((r) => r.some((c) => c.includes(step.verify.tableContains)))
          );
          curResult.verified = found;
          console.log(
            `    verify "${step.verify.tableContains}" in table: ${found ? "FOUND" : "NOT FOUND"}`
          );
        }
        results.push(curResult);
        break;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const outputDir = process.argv[2] || BASELINE_DIR;
  console.log(`Capturing baselines to: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const summary = [];

  try {
    // ---- Public routes ----
    console.log("\n--- Public routes ---");
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    for (const route of ROUTES.public) {
      const result = await capturePage(publicPage, route.label, route.path, outputDir);
      summary.push({ label: result.label, status: result.status, tables: result.tables });
    }
    await publicCtx.close();

    // ---- Admin routes + flows ----
    console.log("\n--- Admin GET routes ---");
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, "admin");
    for (const route of ROUTES.admin) {
      const result = await capturePage(adminPage, route.label, route.path, outputDir);
      summary.push({ label: result.label, status: result.status, tables: result.tables });
    }

    console.log("\n--- Admin write flows ---");
    for (const flow of WRITE_FLOWS.admin) {
      const flowResults = await executeFlow(adminPage, flow, outputDir);
      for (const r of flowResults) {
        summary.push({
          label: r.label,
          status: r.status,
          tables: r.tables,
          verified: r.verified,
        });
      }
    }
    await adminCtx.close();

    // ---- Patient routes + flows ----
    console.log("\n--- Patient routes ---");
    const patientCtx = await browser.newContext();
    const patientPage = await patientCtx.newPage();
    await login(patientPage, "patient");
    for (const route of ROUTES.patient) {
      const result = await capturePage(patientPage, route.label, route.path, outputDir);
      summary.push({ label: result.label, status: result.status, tables: result.tables });
    }

    console.log("\n--- Patient write flows ---");
    for (const flow of WRITE_FLOWS.patient || []) {
      const flowResults = await executeFlow(patientPage, flow, outputDir);
      for (const r of flowResults) {
        summary.push({
          label: r.label,
          status: r.status,
          tables: r.tables,
          verified: r.verified,
        });
      }
    }
    await patientCtx.close();

    // ---- Doctor routes ----
    console.log("\n--- Doctor routes ---");
    const doctorCtx = await browser.newContext();
    const doctorPage = await doctorCtx.newPage();
    await login(doctorPage, "doctor");
    for (const route of ROUTES.doctor) {
      const result = await capturePage(doctorPage, route.label, route.path, outputDir);
      summary.push({ label: result.label, status: result.status, tables: result.tables });
    }
    await doctorCtx.close();

  } finally {
    await browser.close();
  }

  // Write summary
  fs.writeFileSync(
    path.join(outputDir, "summary.json"),
    JSON.stringify({ captured: new Date().toISOString(), routes: summary }, null, 2)
  );

  const totalPages = summary.length;
  const allOk = summary.every((r) => r.status === 200);
  const verified = summary.filter((r) => r.verified !== undefined);
  const verifiedOk = verified.filter((r) => r.verified === true).length;

  console.log(`\n--- Summary ---`);
  console.log(`Captured ${totalPages} pages`);
  console.log(`All HTTP 200: ${allOk}`);
  if (verified.length > 0) {
    console.log(`Write verifications: ${verifiedOk}/${verified.length} passed`);
  }
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
