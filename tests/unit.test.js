/* blood-donor-bd — Node unit tests (node:assert, no deps).
 * Run: node tests/unit.test.js */
"use strict";
const assert = require("node:assert/strict");
const L = require("../logic.js");

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log("  PASS " + name); }
  catch (e) { fail++; console.log("  FAIL " + name + " :: " + e.message); }
}

/* 1. Exact donate-to matrix for all 8 groups */
const EXPECT_DONATE = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};
for (const g of L.GROUPS) {
  check("donate-to " + g + " exact", () => assert.deepEqual(L.DONATE_TO[g], EXPECT_DONATE[g]));
}

/* 2. receive-from derived (hardcoded expectations in test) */
const EXPECT_RECEIVE = {
  "O-":  ["O-"],
  "O+":  ["O-", "O+"],
  "A-":  ["O-", "A-"],
  "A+":  ["O-", "O+", "A-", "A+"],
  "B-":  ["O-", "B-"],
  "B+":  ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};
for (const g of L.GROUPS) {
  check("receive-from " + g + " derived", () => assert.deepEqual(L.receiveFrom(g), EXPECT_RECEIVE[g]));
}
check("receive-from is transpose of donate-to", () => {
  for (const g of L.GROUPS)
    for (const h of L.GROUPS)
      assert.equal(L.receiveFrom(h).includes(g), L.DONATE_TO[g].includes(h), g + "->" + h);
});

/* 3. eligibility math (asof 2026-10-11) */
const ASOF = "2026-10-11";
check("60d ago -> eligible", () => {
  assert.deepEqual(L.eligibilityStatus("2026-08-12", ASOF),
    { status: "eligible", daysToGo: 0, eligibleDateISO: null });
});
check("30d ago -> 26 days to go, eligible 2026-11-06", () => {
  assert.deepEqual(L.eligibilityStatus("2026-09-11", ASOF),
    { status: "waiting", daysToGo: 26, eligibleDateISO: "2026-11-06" });
});
check("55d ago -> 1 day to go", () => {
  const s = L.eligibilityStatus("2026-08-17", ASOF);
  assert.equal(s.status, "waiting"); assert.equal(s.daysToGo, 1);
  assert.equal(s.eligibleDateISO, "2026-10-12");
});
check("56d ago -> eligible (boundary)", () => {
  assert.equal(L.eligibilityStatus("2026-08-16", ASOF).status, "eligible");
});
check("none -> eligible", () => {
  assert.deepEqual(L.eligibilityStatus("", ASOF),
    { status: "eligible", daysToGo: 0, eligibleDateISO: null });
  assert.deepEqual(L.eligibilityStatus(null, ASOF).status, "eligible");
});
check("future date -> invalid", () => {
  assert.equal(L.eligibilityStatus("2026-10-20", ASOF).status, "invalid");
});
check("same day -> 56 days to go", () => {
  assert.equal(L.eligibilityStatus("2026-10-11", ASOF).daysToGo, 56);
});

/* 4. date helpers */
check("parseDateISO valid", () => {
  const d = L.parseDateISO("2026-02-28");
  assert.equal(d.getFullYear(), 2026); assert.equal(d.getMonth(), 1); assert.equal(d.getDate(), 28);
});
check("parseDateISO rejects 2026-02-30 and garbage", () => {
  assert.equal(L.parseDateISO("2026-02-30"), null);
  assert.equal(L.parseDateISO("not-a-date"), null);
  assert.equal(L.parseDateISO(""), null);
  assert.equal(L.parseDateISO(null), null);
});
check("formatDateISO round-trip", () => {
  assert.equal(L.formatDateISO(L.parseDateISO("2026-01-05")), "2026-01-05");
});

/* 5. donor validation */
const goodDonor = { name: "Rahim", group: "O+", phone: "01712345678", area: "Mirpur", lastDonation: "2026-08-12" };
check("valid donor passes", () => assert.deepEqual(L.validateDonor(goodDonor, ASOF), []));
check("empty phone / no lastDonation pass", () =>
  assert.deepEqual(L.validateDonor({ name: "A", group: "A-" }, ASOF), []));
check("missing name -> name_required", () =>
  assert.ok(L.validateDonor({ name: "  ", group: "A+" }, ASOF).includes("name_required")));
check("bad group -> invalid_group", () =>
  assert.ok(L.validateDonor({ name: "A", group: "X" }, ASOF).includes("invalid_group")));
check("short phone -> invalid_phone", () =>
  assert.ok(L.validateDonor({ name: "A", group: "A+", phone: "12345" }, ASOF).includes("invalid_phone")));
check("phone not starting 01 -> invalid_phone", () =>
  assert.ok(L.validateDonor({ name: "A", group: "A+", phone: "02712345678" }, ASOF).includes("invalid_phone")));
check("phone with spaces/dashes normalized ok", () =>
  assert.deepEqual(L.validateDonor({ name: "A", group: "A+", phone: "01712 345678" }, ASOF), []));
check("letters in phone -> invalid_phone", () =>
  assert.ok(L.validateDonor({ name: "A", group: "A+", phone: "01712abc678" }, ASOF).includes("invalid_phone")));
check("future lastDonation -> future_date", () =>
  assert.ok(L.validateDonor({ name: "A", group: "A+", lastDonation: "2026-12-01" }, ASOF).includes("future_date")));
check("garbage lastDonation -> bad_date", () =>
  assert.ok(L.validateDonor({ name: "A", group: "A+", lastDonation: "yesterday" }, ASOF).includes("bad_date")));
check("non-object donor -> bad_donor", () =>
  assert.ok(L.validateDonor(null, ASOF).includes("bad_donor")));

/* 6. request validation */
const goodReq = { patient: "Karim", group: "B+", bags: 2, hospital: "DMCH", contact: "019", neededBy: "2026-10-20" };
check("valid request passes", () => assert.deepEqual(L.validateRequest(goodReq, ASOF), []));
check("missing patient -> patient_required", () =>
  assert.ok(L.validateRequest({ ...goodReq, patient: "" }, ASOF).includes("patient_required")));
check("bags 0 / 2.5 / 'x' -> invalid_bags", () => {
  for (const b of [0, -1, 2.5, "x"]) assert.ok(L.validateRequest({ ...goodReq, bags: b }, ASOF).includes("invalid_bags"), String(b));
});
check("bags '3' string coerces to valid integer", () =>
  assert.deepEqual(L.validateRequest({ ...goodReq, bags: "3" }, ASOF), []));
check("missing hospital -> hospital_required", () =>
  assert.ok(L.validateRequest({ ...goodReq, hospital: " " }, ASOF).includes("hospital_required")));

/* 7. import schema */
function importDoc(donors, requests, version) {
  return { version: version === undefined ? 1 : version, exportedAt: "2026-10-11T00:00:00Z",
    donors: donors === undefined ? [] : donors, requests: requests === undefined ? [] : requests };
}
check("valid import ok", () => {
  const d = importDoc([{ id: "a1", name: "R", group: "O+", phone: "", area: "", lastDonation: "" }], []);
  assert.equal(L.validateImport(d).ok, true);
});
check("malformed shape -> not_an_object", () => {
  assert.ok(L.validateImport(null).errors.includes("not_an_object"));
  assert.ok(L.validateImport([1, 2]).errors.includes("not_an_object"));
});
check("wrong version -> bad_version", () => {
  assert.ok(L.validateImport(importDoc([], [], 2)).errors.includes("bad_version"));
});
check("missing arrays -> bad_donors/bad_requests", () => {
  const r = L.validateImport({ version: 1 });
  assert.ok(r.errors.includes("bad_donors") && r.errors.includes("bad_requests"));
});
check("donor missing name -> bad_donor_at_0", () => {
  const r = L.validateImport(importDoc([{ id: "x", name: "", group: "O+" }], []));
  assert.equal(r.ok, false);
  assert.ok(r.errors.includes("bad_donor_at_0"));
});
check("donor missing id -> rejected", () => {
  const r = L.validateImport(importDoc([{ name: "R", group: "O+" }], []));
  assert.ok(r.errors.includes("bad_donor_at_0"));
});
check("request with 0 bags -> bad_request_at_0", () => {
  const r = L.validateImport(importDoc([], [{ id: "r1", patient: "P", group: "A+", bags: 0, hospital: "H" }]));
  assert.ok(r.errors.includes("bad_request_at_0"));
});
check("export version constant is 1", () => assert.equal(L.EXPORT_VERSION, 1));

console.log("\nunit: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
