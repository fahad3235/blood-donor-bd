/* blood-donor-bd — headless-Chrome smoke tests (puppeteer-core + system Chromium).
 * Run: NODE_PATH=<dir containing puppeteer-core> node tests/smoke.test.js
 * Uses ?asof=2026-10-11 for deterministic date math. */
"use strict";

const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = path.resolve(__dirname, "..");
const CHROME = "/opt/meta-chromium/chrome";
const BASE = "file://" + ROOT + "/index.html?asof=2026-10-11";

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(
    () => { results.push({ name, ok: true }); console.log("  PASS " + name); },
    (err) => { results.push({ name, ok: false }); console.log("  FAIL " + name + " :: " + (err && err.message || err)); }
  );
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  const consoleErrors = [], pageErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on("dialog", (d) => d.accept()); // auto-accept confirms
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => pageErrors.push(String(e && e.message || e)));

  console.log("smoke: blood-donor-bd @ " + BASE);
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("#donorList");

  await check("page loads: title + 4 sections", async () => {
    const title = await page.title();
    assert(title.includes("Blood Donor BD"), "title=" + title);
    for (const id of ["#compat", "#donors", "#requests", "#data"])
      assert(await page.$(id), "missing " + id);
  });

  await check("compat AB+: donate-to=[AB+], receive-from=all 8", async () => {
    await page.select("#compatGroup", "AB+");
    await sleep(100);
    const dto = await page.$$eval("#donateToList .badge", (els) => els.map((e) => e.textContent));
    const rf = await page.$$eval("#receiveFromList .badge", (els) => els.map((e) => e.textContent));
    assert(JSON.stringify(dto) === JSON.stringify(["AB+"]), "donate-to=" + JSON.stringify(dto));
    assert(rf.length === 8, "receive-from len=" + rf.length);
  });

  await check("compat O-: donate-to=all 8, receive-from=[O-]", async () => {
    await page.select("#compatGroup", "O-");
    await sleep(100);
    const dto = await page.$$eval("#donateToList .badge", (els) => els.map((e) => e.textContent));
    const rf = await page.$$eval("#receiveFromList .badge", (els) => els.map((e) => e.textContent));
    assert(dto.length === 8, "donate-to len=" + dto.length);
    assert(JSON.stringify(rf) === JSON.stringify(["O-"]), "receive-from=" + JSON.stringify(rf));
  });

  await check("add donor: invalid phone shows error, nothing added", async () => {
    await page.evaluate(() => {
      document.getElementById("donorName").value = "Bad Phone";
      document.getElementById("donorGroup").value = "A+";
      document.getElementById("donorPhone").value = "12345";
    });
    await page.click("#donorSubmit");
    await sleep(150);
    const err = await page.$eval("#err-phone", (e) => e.textContent);
    assert(err.length > 0, "no phone error shown");
    const n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 0, "donor was added despite invalid phone");
  });

  await check("add donor: missing name shows error", async () => {
    await page.evaluate(() => {
      document.getElementById("donorName").value = "   ";
      document.getElementById("donorPhone").value = "";
    });
    await page.click("#donorSubmit");
    await sleep(150);
    const err = await page.$eval("#err-name", (e) => e.textContent);
    assert(err.length > 0, "no name error shown");
  });

  await check("add donor: valid (O+, 60d ago) -> eligible now", async () => {
    await page.evaluate(() => {
      document.getElementById("donorName").value = "Test Donor";
      document.getElementById("donorGroup").value = "O+";
      document.getElementById("donorPhone").value = "01712345678";
      document.getElementById("donorArea").value = "Mirpur";
      document.getElementById("donorLast").value = "2026-08-12";
    });
    await page.click("#donorSubmit");
    await sleep(200);
    const items = await page.$$eval("#donorList .item", (els) => els.map((e) => e.textContent));
    assert(items.length === 1, "expected 1 donor, got " + items.length);
    assert(items[0].includes("Eligible now"), "eligibility text missing: " + items[0].slice(0, 120));
    assert(items[0].includes("Mirpur"), "area missing");
  });

  await check("edit donor: change area, saved", async () => {
    await page.click('#donorList .item [data-act="edit"]');
    await sleep(150);
    const v = await page.$eval("#donorArea", (e) => e.value);
    assert(v === "Mirpur", "form not populated, area=" + v);
    await page.evaluate(() => { document.getElementById("donorArea").value = "Uttara"; });
    await page.click("#donorSubmit");
    await sleep(200);
    const txt = await page.$eval("#donorList .item", (e) => e.textContent);
    assert(txt.includes("Uttara"), "edited area not shown");
  });

  await check("add donor: 30d ago -> '26 days to go'", async () => {
    await page.evaluate(() => {
      document.getElementById("donorName").value = "Recent Donor";
      document.getElementById("donorGroup").value = "O-";
      document.getElementById("donorPhone").value = "";
      document.getElementById("donorArea").value = "";
      document.getElementById("donorLast").value = "2026-09-11";
    });
    await page.click("#donorSubmit");
    await sleep(200);
    const items = await page.$$eval("#donorList .item", (els) => els.map((e) => e.textContent));
    assert(items.length === 2, "expected 2 donors, got " + items.length);
    assert(items.some((t) => t.includes("26 days to go")), "waiting text missing");
  });

  await check("find donors for A+ shows O+ and O- donors", async () => {
    await page.select("#findForGroup", "A+");
    await sleep(150);
    const n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 2, "expected 2, got " + n);
    await page.select("#findForGroup", "O-");
    await sleep(150);
    const n2 = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n2 === 1, "expected 1 (O- only), got " + n2);
    await page.evaluate(() => { document.getElementById("findForGroup").value = ""; document.getElementById("findForGroup").dispatchEvent(new Event("change")); });
    await sleep(100);
  });

  await check("search filters by name; clear restores", async () => {
    await page.type("#donorSearch", "Test Donor");
    await sleep(150);
    let n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 1, "expected 1 after search, got " + n);
    await page.evaluate(() => {
      const s = document.getElementById("donorSearch");
      s.value = "zzz-no-match"; s.dispatchEvent(new Event("input"));
    });
    await sleep(150);
    n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 0, "expected 0, got " + n);
    const emptyVisible = await page.$eval("#donorEmpty", (e) => !e.hidden);
    assert(emptyVisible, "filter empty state not shown");
    await page.click("#clearFilters");
    await sleep(150);
    n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 2, "expected 2 after clear, got " + n);
  });

  await check("request: post -> open list; fulfill -> fulfilled list", async () => {
    await page.evaluate(() => {
      document.getElementById("reqPatient").value = "Test Patient";
      document.getElementById("reqGroup").value = "B+";
      document.getElementById("reqBags").value = "2";
      document.getElementById("reqHospital").value = "DMCH";
      document.getElementById("reqContact").value = "01911111111";
      document.getElementById("reqNeededBy").value = "2026-10-20";
    });
    await page.click("#reqSubmit");
    await sleep(200);
    let open = await page.$$eval("#openList .item", (els) => els.map((e) => e.textContent));
    assert(open.length === 1 && open[0].includes("2 bags"), "open request missing: " + JSON.stringify(open));
    await page.click('#openList .item [data-act="fulfill"]');
    await sleep(200);
    open = await page.$$eval("#openList .item", (els) => els.length);
    const done = await page.$$eval("#fulfilledList .item", (els) => els.length);
    assert(open === 0 && done === 1, "fulfill failed: open=" + open + " done=" + done);
  });

  await check("request: invalid bags shows error", async () => {
    await page.evaluate(() => {
      document.getElementById("reqPatient").value = "P2";
      document.getElementById("reqGroup").value = "A+";
      document.getElementById("reqBags").value = "0";
      document.getElementById("reqHospital").value = "H2";
    });
    await page.click("#reqSubmit");
    await sleep(150);
    const err = await page.$eval("#err-bags", (e) => e.textContent);
    assert(err.length > 0, "no bags error shown");
  });

  await check("BN toggle: Bengali title + Bengali digits, persisted in localStorage", async () => {
    await page.click("#langBn");
    await sleep(200);
    const title = await page.$eval("#appTitle", (e) => e.textContent);
    assert(title === "রক্তদাতা বিডি", "title=" + title);
    const lang = await page.evaluate(() => localStorage.getItem("bdb_lang"));
    assert(lang === "bn", "bdb_lang=" + lang);
    const badge = await page.$eval("#donorList .item .pill", (e) => e.textContent);
    assert(/[০-৯]/.test(badge), "no Bengali digits in: " + badge);
    await page.click("#langEn");
    await sleep(150);
  });

  await check("reload: donors, requests, lang persist", async () => {
    await page.click("#langBn");
    await sleep(150);
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector("#donorList");
    await sleep(200);
    const title = await page.$eval("#appTitle", (e) => e.textContent);
    assert(title === "রক্তদাতা বিডি", "lang not persisted, title=" + title);
    const n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 2, "donors not persisted: " + n);
    const done = await page.$$eval("#fulfilledList .item", (els) => els.length);
    assert(done === 1, "requests not persisted: " + done);
    await page.click("#langEn");
    await sleep(150);
  });

  await check("import: malformed JSON rejected via file input, data intact", async () => {
    const before = await page.$$eval("#donorList .item", (els) => els.length);
    require("fs").writeFileSync("/tmp/bdb-bad.json", "this is not json {");
    await page.$eval("#importFile", () => {});
    const input = await page.$("#importFile");
    await input.uploadFile("/tmp/bdb-bad.json");
    await sleep(300);
    const msg = await page.$eval("#importMsg", (e) => e.textContent);
    const cls = await page.$eval("#importMsg", (e) => e.className);
    assert(msg.length > 0 && cls.includes("err"), "no import error: " + msg);
    const after = await page.$$eval("#donorList .item", (els) => els.length);
    assert(after === before, "data changed after failed import");
  });

  await check("import: valid JSON replaces data", async () => {
    const doc = JSON.stringify({
      version: 1, exportedAt: "2026-10-11T00:00:00Z",
      donors: [{ id: "imp-1", name: "Imported One", group: "AB+", phone: "", area: "Dhaka", lastDonation: "" }],
      requests: [],
    });
    require("fs").writeFileSync("/tmp/bdb-good.json", doc);
    const input = await page.$("#importFile");
    await input.uploadFile("/tmp/bdb-good.json");
    await sleep(300);
    const n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 1, "expected 1 imported donor, got " + n);
    const txt = await page.$eval("#donorList .item", (e) => e.textContent);
    assert(txt.includes("Imported One") && txt.includes("AB+"), "imported donor wrong: " + txt.slice(0, 100));
  });

  await check("delete donor works", async () => {
    await page.click('#donorList .item [data-act="del"]');
    await sleep(200);
    const n = await page.$$eval("#donorList .item", (els) => els.length);
    assert(n === 0, "expected 0 donors after delete, got " + n);
    const emptyVisible = await page.$eval("#donorEmpty", (e) => !e.hidden);
    assert(emptyVisible, "empty state not shown after delete");
  });

  await check("390px viewport: no horizontal overflow", async () => {
    await page.setViewport({ width: 390, height: 844 });
    await sleep(200);
    const overflow = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, "horizontal overflow: " + overflow + "px");
    await page.setViewport({ width: 1280, height: 800 });
  });

  await check("zero console errors and zero page errors", async () => {
    assert(consoleErrors.length === 0, "console errors: " + JSON.stringify(consoleErrors.slice(0, 3)));
    assert(pageErrors.length === 0, "page errors: " + JSON.stringify(pageErrors.slice(0, 3)));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log("\nsmoke: " + (results.length - failed) + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
