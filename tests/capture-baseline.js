/**
 * Baseline Capture Script
 *
 * Navigates the HMS web app with headless Chrome via Playwright,
 * captures HTML snapshots, screenshots, and extracted data for each route.
 * Results are stored in baselines/<label>/ for later diffing.
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const BASELINE_DIR = path.join(__dirname, "..", "baselines");

// Route definitions grouped by auth context
const ROUTES = {
  public: [
    { path: "/", label: "landing" },
    { path: "/login", label: "login" },
    { path: "/signup", label: "signup" },
    { path: "/patientlogin", label: "patientlogin" },
    { path: "/doctorlogin", label: "doctorlogin" },
    { path: "/patientsignup", label: "patientsignup" },
    { path: "/doctorsignup", label: "doctorsignup" },
  ],
  admin: [
    { path: "/home", label: "admin-home" },
    { path: "/home/departments", label: "admin-departments" },
    { path: "/appointment", label: "admin-appointments" },
    { path: "/store", label: "admin-store" },
    { path: "/employee", label: "admin-employees" },
    { path: "/employee/leave", label: "admin-leaves" },
    { path: "/inbox", label: "admin-inbox" },
    { path: "/receipt", label: "admin-receipt" },
  ],
  patient: [
    { path: "/patienthome", label: "patient-home" },
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

/**
 * Extract structured data from the page DOM — table contents, form fields,
 * headings, and any visible text that represents database-driven content.
 */
async function extractPageData(page) {
  return page.evaluate(() => {
    const data = {};

    // Extract all table data
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

    // Extract headings
    data.headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).map((h) => ({
      tag: h.tagName,
      text: h.textContent.trim(),
    }));

    // Extract form fields
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

    // Extract counts/badges (dashboard widgets)
    data.badges = Array.from(document.querySelectorAll(".badge, .dash-widget-info h3, .dash-count")).map(
      (el) => el.textContent.trim()
    );

    // Extract any visible alert/message text
    data.alerts = Array.from(
      document.querySelectorAll(".alert, .swal2-title, .flash-message")
    ).map((el) => el.textContent.trim());

    return data;
  });
}

/**
 * Capture a single page: screenshot, HTML snapshot, and extracted data.
 */
async function capturePage(page, route, outputDir) {
  const dir = path.join(outputDir, route.label);
  fs.mkdirSync(dir, { recursive: true });

  const url = `${BASE_URL}${route.path}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
  const status = response ? response.status() : "unknown";

  // Wait briefly for any dynamic content
  await page.waitForTimeout(500);

  // Screenshot
  await page.screenshot({
    path: path.join(dir, "screenshot.png"),
    fullPage: true,
  });

  // HTML snapshot
  const html = await page.content();
  fs.writeFileSync(path.join(dir, "snapshot.html"), html);

  // Extracted data
  const data = await extractPageData(page);
  data.url = url;
  data.status = status;
  data.timestamp = new Date().toISOString();
  fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify(data, null, 2));

  console.log(`  [${status}] ${route.label} (${route.path})`);
  return { label: route.label, status, tables: data.tables.length };
}

/**
 * Login to the app and return the authenticated page context.
 */
async function login(page, role) {
  const cred = CREDENTIALS[role];
  await page.goto(`${BASE_URL}${cred.url}`, { waitUntil: "networkidle" });

  await page.fill('input[name="username"]', cred.username);
  await page.fill('input[name="password"]', cred.password);
  await page.click('button[type="submit"], input[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
}

async function main() {
  const outputDir = process.argv[2] || BASELINE_DIR;
  console.log(`Capturing baselines to: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const summary = [];

  try {
    // Public routes (no login needed)
    console.log("\n--- Public routes ---");
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    for (const route of ROUTES.public) {
      const result = await capturePage(publicPage, route, outputDir);
      summary.push(result);
    }
    await publicCtx.close();

    // Admin routes
    console.log("\n--- Admin routes ---");
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, "admin");
    for (const route of ROUTES.admin) {
      const result = await capturePage(adminPage, route, outputDir);
      summary.push(result);
    }
    await adminCtx.close();

    // Patient routes
    console.log("\n--- Patient routes ---");
    const patientCtx = await browser.newContext();
    const patientPage = await patientCtx.newPage();
    await login(patientPage, "patient");
    for (const route of ROUTES.patient) {
      const result = await capturePage(patientPage, route, outputDir);
      summary.push(result);
    }
    await patientCtx.close();

    // Doctor routes
    console.log("\n--- Doctor routes ---");
    const doctorCtx = await browser.newContext();
    const doctorPage = await doctorCtx.newPage();
    await login(doctorPage, "doctor");
    for (const route of ROUTES.doctor) {
      const result = await capturePage(doctorPage, route, outputDir);
      summary.push(result);
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

  console.log(`\n--- Summary ---`);
  console.log(`Captured ${summary.length} pages`);
  console.log(`All OK: ${summary.every((r) => r.status === 200)}`);
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
