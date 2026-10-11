/* blood-donor-bd — pure logic (no DOM). Shared by app.js and Node unit tests.
 * SPDX-License-Identifier: MIT */
"use strict";

const GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

/* Exact donor -> recipients matrix (red-cell whole-blood compatibility). */
const DONATE_TO = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/* "Can receive from" is derived by transposing DONATE_TO (never hardcoded). */
function receiveFrom(group) {
  return GROUPS.filter((g) => (DONATE_TO[g] || []).includes(group));
}

/* Minimum interval between whole-blood donations (internationally common
 * standard). Blood banks may set 3-4 months; users must confirm with theirs. */
const MIN_INTERVAL_DAYS = 56;

/* ---- dates (local-midnight, YYYY-MM-DD) ---- */
function parseDateISO(s) {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}
function formatDateISO(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function addDays(d, n) {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n);
  return c;
}
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function todayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/* eligibilityStatus(lastDonationISO|null, todayISO|null)
 * -> { status: "eligible" | "waiting" | "invalid",
 *      daysToGo: number, eligibleDateISO: string|null } */
function eligibilityStatus(lastDonationISO, todayISO) {
  if (!lastDonationISO) return { status: "eligible", daysToGo: 0, eligibleDateISO: null };
  const last = parseDateISO(lastDonationISO);
  const today = todayISO ? parseDateISO(todayISO) : todayLocal();
  if (!last || !today || last.getTime() > today.getTime()) {
    return { status: "invalid", daysToGo: 0, eligibleDateISO: null };
  }
  const since = daysBetween(last, today);
  if (since >= MIN_INTERVAL_DAYS) return { status: "eligible", daysToGo: 0, eligibleDateISO: null };
  return {
    status: "waiting",
    daysToGo: MIN_INTERVAL_DAYS - since,
    eligibleDateISO: formatDateISO(addDays(last, MIN_INTERVAL_DAYS)),
  };
}

/* ---- validation ---- */
function normalizePhone(raw) {
  return String(raw || "").replace(/[\s\-()]/g, "");
}
/* Loosely-validated Bangladesh mobile: 11 digits starting with 01. */
function isValidBdMobile(raw) {
  return /^01\d{9}$/.test(normalizePhone(raw));
}

/* validateDonor(d) -> array of error codes (empty = valid).
 * d: { name, group, phone, area, lastDonation }  (todayISO optional for tests) */
function validateDonor(d, todayISO) {
  const errs = [];
  if (!d || typeof d !== "object") return ["bad_donor"];
  if (!String(d.name || "").trim()) errs.push("name_required");
  if (!GROUPS.includes(d.group)) errs.push("invalid_group");
  if (d.phone != null && String(d.phone).trim() !== "" && !isValidBdMobile(d.phone)) {
    errs.push("invalid_phone");
  }
  const ld = String(d.lastDonation || "").trim();
  if (ld !== "") {
    const dt = parseDateISO(ld);
    if (!dt) {
      errs.push("bad_date");
    } else {
      const today = todayISO ? parseDateISO(todayISO) : todayLocal();
      if (today && dt.getTime() > today.getTime()) errs.push("future_date");
    }
  }
  return errs;
}

/* validateRequest(r) -> array of error codes. */
function validateRequest(r, todayISO) {
  const errs = [];
  if (!r || typeof r !== "object") return ["bad_request"];
  if (!String(r.patient || "").trim()) errs.push("patient_required");
  if (!GROUPS.includes(r.group)) errs.push("invalid_group");
  const bags = Number(r.bags);
  if (!Number.isInteger(bags) || bags < 1) errs.push("invalid_bags");
  if (!String(r.hospital || "").trim()) errs.push("hospital_required");
  const nb = String(r.neededBy || "").trim();
  if (nb !== "" && !parseDateISO(nb)) errs.push("bad_date");
  return errs;
}

const EXPORT_VERSION = 1;

/* validateImport(data) -> { ok, errors[] }. Rejects malformed JSON-shape or
 * wrong schema; callers must leave existing data intact on rejection. */
function validateImport(data) {
  const errs = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, errors: ["not_an_object"] };
  if (data.version !== EXPORT_VERSION) errs.push("bad_version");
  if (!Array.isArray(data.donors)) errs.push("bad_donors");
  if (!Array.isArray(data.requests)) errs.push("bad_requests");
  if (errs.length) return { ok: false, errors: errs };
  data.donors.forEach((d, i) => {
    if (!d || typeof d !== "object" || typeof d.id !== "string" || validateDonor(d).length) {
      errs.push("bad_donor_at_" + i);
    }
  });
  data.requests.forEach((r, i) => {
    if (!r || typeof r !== "object" || typeof r.id !== "string" || validateRequest(r).length) {
      errs.push("bad_request_at_" + i);
    }
  });
  return { ok: errs.length === 0, errors: errs };
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GROUPS, DONATE_TO, receiveFrom, MIN_INTERVAL_DAYS,
    parseDateISO, formatDateISO, addDays, daysBetween, todayLocal,
    eligibilityStatus, normalizePhone, isValidBdMobile,
    validateDonor, validateRequest, validateImport, EXPORT_VERSION, makeId,
  };
}
