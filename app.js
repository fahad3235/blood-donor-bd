/* blood-donor-bd app — DOM + i18n + persistence. Depends on logic.js. */
"use strict";

/* ?asof=YYYY-MM-DD overrides "today" (used by deterministic tests). */
function asof() {
  try {
    const m = /[?&]asof=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    if (m && parseDateISO(m[1])) return m[1];
  } catch (e) { /* ignore */ }
  return null;
}
const ASOF = asof();

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function locNum(v) {
  const s = String(v);
  return lang === "bn" ? s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : s;
}
function locDate(iso) {
  return iso ? locNum(iso) : "—";
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------------- i18n ---------------- */
const STR = {
  en: {
    tagline: "Your personal blood-donation organizer — works fully offline.",
    navCompat: "🩸 Compatibility", navDonors: "👥 Donors", navRequests: "📋 Requests", navData: "💾 Data",
    compatH: "🩸 Blood-group compatibility",
    lblCompatGroup: "Your blood group",
    donateToH: "Can donate to", receiveFromH: "Can receive from",
    compatNote: "Compatibility is for whole-blood donation. Always confirm with the blood bank — rules can vary.",
    donorsH: "👥 Donor registry",
    lblName: "Name *", lblGroup: "Blood group *", lblPhone: "Phone (optional)",
    phoneHint: "11 digits starting with 01 (spaces/dashes are ignored).",
    lblArea: "Area / Upazila (optional)", lblLast: "Last donation date (optional)",
    addDonor: "Add donor", saveChanges: "Save changes", cancel: "Cancel",
    e_name_required: "Please enter the donor's name.",
    e_invalid_group: "Please choose a valid blood group.",
    e_invalid_phone: "Phone must be 11 digits starting with 01.",
    e_future_date: "Last donation date cannot be in the future.",
    e_bad_date: "Please enter a valid date.",
    e_bad_donor: "Invalid donor data.",
    lblSearch: "Search", searchPh: "Search name or area…",
    lblGroupFilter: "Blood group", allGroups: "All groups",
    lblFindFor: "Find donors for recipient group", anyRecipient: "Any recipient",
    clearFilters: "Clear filters",
    donorEmpty: "No donors yet. Add your first donor above — your data stays on this device.",
    donorEmptyFilter: "No donors match your search.",
    eligibleNow: "Eligible now", daysToGo: (n) => n + " day" + (n === 1 ? "" : "s") + " to go",
    eligibleOn: (d) => "Eligible on " + d,
    lastDonated: (d) => "Last donated: " + d, neverDonated: "No donation recorded",
    edit: "Edit", del: "Delete", confirmDel: "Delete this donor?",
    requestsH: "📋 Blood request board",
    lblPatient: "Patient name *", lblReqGroup: "Blood group needed *", lblBags: "Bags needed *",
    lblHospital: "Hospital *", lblContact: "Contact (optional)", lblNeededBy: "Needed by (optional)",
    postRequest: "Post request",
    e_patient_required: "Please enter the patient's name.",
    e_invalid_bags: "Bags needed must be a positive whole number.",
    e_hospital_required: "Please enter the hospital name.",
    e_bad_request: "Invalid request data.",
    openH: "Open requests", fulfilledH: "Fulfilled requests",
    openEmpty: "No open requests.", fulfilledEmpty: "No fulfilled requests yet.",
    bags: (n) => n + " bag" + (n === 1 ? "" : "s"),
    neededBy: (d) => "Needed by " + d,
    markFulfilled: "Mark fulfilled", fulfillConfirm: "Mark this request as fulfilled?",
    delReq: "Delete", confirmDelReq: "Delete this request?",
    dataH: "💾 Your data",
    dataNote: "Everything is stored only in this browser (localStorage). Export a JSON backup before clearing browser data.",
    exportBtn: "⬇ Export JSON", lblImport: "Import JSON",
    importOk: "Import successful.",
    importBadJson: "Import failed: the file is not valid JSON. Your existing data is unchanged.",
    importBadSchema: "Import failed: the file does not match the Blood Donor BD format. Your existing data is unchanged.",
    disclaimer: "Disclaimer: Blood Donor BD is a personal organizer, not medical advice. Eligibility rules vary by blood bank (e.g. BDRCS) — always confirm with the blood bank before donating.",
    sos: "🚨 In an emergency, call 999 (Bangladesh national emergency).",
  },
  bn: {
    tagline: "আপনার ব্যক্তিগত রক্তদান সহায়ক — সম্পূর্ণ অফলাইনে চলে।",
    navCompat: "🩸 সামঞ্জস্য", navDonors: "👥 রক্তদাতা", navRequests: "📋 অনুরোধ", navData: "💾 তথ্য",
    compatH: "🩸 রক্তের গ্রুপ সামঞ্জস্য",
    lblCompatGroup: "আপনার রক্তের গ্রুপ",
    donateToH: "রক্ত দিতে পারবেন", receiveFromH: "রক্ত নিতে পারবেন",
    compatNote: "এটি পূর্ণ রক্তদানের (whole-blood) সামঞ্জস্য। নিয়ম ব্যাংকভেদে ভিন্ন হতে পারে — রক্তদানের আগে ব্লাড ব্যাংকের সাথে নিশ্চিত করুন।",
    donorsH: "👥 রক্তদাতা তালিকা",
    lblName: "নাম *", lblGroup: "রক্তের গ্রুপ *", lblPhone: "ফোন (ঐচ্ছিক)",
    phoneHint: "০১ দিয়ে শুরু ১১ সংখ্যা (স্পেস/ড্যাশ বাদ যাবে)।",
    lblArea: "এলাকা / উপজেলা (ঐচ্ছিক)", lblLast: "শেষ রক্তদানের তারিখ (ঐচ্ছিক)",
    addDonor: "রক্তদাতা যোগ করুন", saveChanges: "পরিবর্তন সংরক্ষণ", cancel: "বাতিল",
    e_name_required: "রক্তদাতার নাম লিখুন।",
    e_invalid_group: "সঠিক রক্তের গ্রুপ বেছে নিন।",
    e_invalid_phone: "ফোন নম্বর ০১ দিয়ে শুরু ১১ সংখ্যার হতে হবে।",
    e_future_date: "শেষ রক্তদানের তারিখ ভবিষ্যতের হতে পারে না।",
    e_bad_date: "সঠিক তারিখ দিন।",
    e_bad_donor: "রক্তদাতার তথ্য সঠিক নয়।",
    lblSearch: "খুঁজুন", searchPh: "নাম বা এলাকা খুঁজুন…",
    lblGroupFilter: "রক্তের গ্রুপ", allGroups: "সব গ্রুপ",
    lblFindFor: "কোন গ্রুপের জন্য রক্তদাতা খুঁজুন", anyRecipient: "যেকোনো গ্রুপ",
    clearFilters: "ফিল্টার মুছুন",
    donorEmpty: "এখনো কোনো রক্তদাতা নেই। উপরে প্রথম রক্তদাতা যোগ করুন — তথ্য শুধু এই ডিভাইসে থাকবে।",
    donorEmptyFilter: "খোঁজের সাথে মিলে এমন কোনো রক্তদাতা নেই।",
    eligibleNow: "এখন রক্ত দিতে পারবেন", daysToGo: (n) => "আরও " + n + " দিন",
    eligibleOn: (d) => d + " থেকে রক্ত দিতে পারবেন",
    lastDonated: (d) => "শেষ রক্তদান: " + d, neverDonated: "কোনো রক্তদানের রেকর্ড নেই",
    edit: "সম্পাদনা", del: "মুছুন", confirmDel: "এই রক্তদাতাকে মুছে ফেলবেন?",
    requestsH: "📋 রক্তের অনুরোধ বোর্ড",
    lblPatient: "রোগীর নাম *", lblReqGroup: "প্রয়োজনীয় রক্তের গ্রুপ *", lblBags: "কত ব্যাগ প্রয়োজন *",
    lblHospital: "হাসপাতাল *", lblContact: "যোগাযোগ (ঐচ্ছিক)", lblNeededBy: "কবে প্রয়োজন (ঐচ্ছিক)",
    postRequest: "অনুরোধ পোস্ট করুন",
    e_patient_required: "রোগীর নাম লিখুন।",
    e_invalid_bags: "ব্যাগের সংখ্যা ধনাত্মক পূর্ণসংখ্যা হতে হবে।",
    e_hospital_required: "হাসপাতালের নাম লিখুন।",
    e_bad_request: "অনুরোধের তথ্য সঠিক নয়।",
    openH: "চলমান অনুরোধ", fulfilledH: "পূরণ হওয়া অনুরোধ",
    openEmpty: "কোনো চলমান অনুরোধ নেই।", fulfilledEmpty: "এখনো কোনো অনুরোধ পূরণ হয়নি।",
    bags: (n) => n + " ব্যাগ",
    neededBy: (d) => d + " এর মধ্যে প্রয়োজন",
    markFulfilled: "পূরণ হয়েছে", fulfillConfirm: "অনুরোধটি পূরণ হয়েছে হিসেবে চিহ্নিত করবেন?",
    delReq: "মুছুন", confirmDelReq: "এই অনুরোধটি মুছে ফেলবেন?",
    dataH: "💾 আপনার তথ্য",
    dataNote: "সব তথ্য শুধু এই ব্রাউজারে (localStorage) সংরক্ষিত থাকে। ব্রাউজারের তথ্য মুছে ফেলার আগে JSON ব্যাকআপ নিন।",
    exportBtn: "⬇ JSON এক্সপোর্ট", lblImport: "JSON ইমপোর্ট",
    importOk: "ইমপোর্ট সফল হয়েছে।",
    importBadJson: "ইমপোর্ট ব্যর্থ: ফাইলটি সঠিক JSON নয়। আপনার আগের তথ্য অপরিবর্তিত আছে।",
    importBadSchema: "ইমপোর্ট ব্যর্থ: ফাইলটি Blood Donor BD ফরম্যাটের নয়। আপনার আগের তথ্য অপরিবর্তিত আছে।",
    disclaimer: "দাবিত্যাগ: Blood Donor BD একটি ব্যক্তিগত সহায়ক, চিকিৎসা পরামর্শ নয়। রক্তদানের যোগ্যতার নিয়ম ব্লাড ব্যাংকভেদে ভিন্ন হতে পারে (যেমন BDRCS) — রক্তদানের আগে ব্লাড ব্যাংকের সাথে নিশ্চিত করুন।",
    sos: "🚨 জরুরি অবস্থায় ৯৯৯ নম্বরে কল করুন (বাংলাদেশ জাতীয় জরুরি সেবা)।",
  },
};
let lang = "en";
function t(key, arg) {
  const v = STR[lang][key] !== undefined ? STR[lang][key] : STR.en[key];
  return typeof v === "function" ? v(arg) : v;
}

/* ---------------- persistence ---------------- */
const LS = { donors: "bdb_donors_v1", requests: "bdb_requests_v1", lang: "bdb_lang" };
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v === null || v === undefined ? fallback : v;
  } catch (e) { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage full/blocked */ }
}
let donors = loadJSON(LS.donors, []);
let requests = loadJSON(LS.requests, []);
if (!Array.isArray(donors)) donors = [];
if (!Array.isArray(requests)) requests = [];
try { lang = localStorage.getItem(LS.lang) === "bn" ? "bn" : "en"; } catch (e) { lang = "en"; }

/* ---------------- helpers ---------------- */
const $ = (id) => document.getElementById(id);
function setErr(id, code) { $(id).textContent = code ? t("e_" + code) : ""; }
function clearDonorErrs() {
  ["name", "group", "phone", "area", "lastDonation"].forEach((f) => setErr("err-" + f, null));
  $("donorFormMsg").textContent = "";
}
function clearReqErrs() {
  ["patient", "reqGroup", "bags", "hospital", "contact", "neededBy"].forEach((f) => setErr("err-" + f, null));
  $("reqFormMsg").textContent = "";
}
function groupOptions(sel, includeAny, anyLabel) {
  sel.innerHTML = "";
  if (includeAny) {
    const o = document.createElement("option");
    o.value = ""; o.textContent = anyLabel; sel.appendChild(o);
  }
  GROUPS.forEach((g) => {
    const o = document.createElement("option");
    o.value = g; o.textContent = g; sel.appendChild(o);
  });
}
function eligibilityLabel(donor) {
  const st = eligibilityStatus(donor.lastDonation || "", ASOF);
  if (st.status === "eligible") return { text: t("eligibleNow"), cls: "pill pill-ok" };
  if (st.status === "waiting") {
    const n = locNum(st.daysToGo);
    return { text: t("daysToGo", n) + " · " + t("eligibleOn", locDate(st.eligibleDateISO)), cls: "pill pill-wait" };
  }
  return { text: t("e_bad_date"), cls: "pill pill-wait" };
}

/* ---------------- render: static labels ---------------- */
function renderStatic() {
  document.documentElement.lang = lang === "bn" ? "bn" : "en";
  document.title = lang === "bn" ? "রক্তদাতা বিডি — Blood Donor BD" : "Blood Donor BD — রক্তদাতা বিডি";
  $("appTitle").textContent = lang === "bn" ? "রক্তদাতা বিডি" : "Blood Donor BD";
  $("tagline").textContent = t("tagline");
  $("navCompat").textContent = t("navCompat"); $("navDonors").textContent = t("navDonors");
  $("navRequests").textContent = t("navRequests"); $("navData").textContent = t("navData");
  $("compatH").textContent = t("compatH");
  $("lblCompatGroup").textContent = t("lblCompatGroup");
  $("donateToH").textContent = t("donateToH"); $("receiveFromH").textContent = t("receiveFromH");
  $("compatNote").textContent = t("compatNote");
  $("donorsH").textContent = t("donorsH");
  $("lblName").textContent = t("lblName"); $("lblGroup").textContent = t("lblGroup");
  $("lblPhone").textContent = t("lblPhone"); $("phoneHint").textContent = t("phoneHint");
  $("lblArea").textContent = t("lblArea"); $("lblLast").textContent = t("lblLast");
  $("donorSubmit").textContent = $("editingId").value ? t("saveChanges") : t("addDonor");
  $("donorCancel").textContent = t("cancel");
  $("donorSearch").placeholder = t("searchPh");
  $("lblSearch").textContent = t("lblSearch"); $("lblGroupFilter").textContent = t("lblGroupFilter");
  $("lblFindFor").textContent = t("lblFindFor"); $("clearFilters").textContent = "✕ " + t("clearFilters");
  $("requestsH").textContent = t("requestsH");
  $("lblPatient").textContent = t("lblPatient"); $("lblReqGroup").textContent = t("lblReqGroup");
  $("lblBags").textContent = t("lblBags"); $("lblHospital").textContent = t("lblHospital");
  $("lblContact").textContent = t("lblContact"); $("lblNeededBy").textContent = t("lblNeededBy");
  $("reqSubmit").textContent = t("postRequest");
  $("openH").textContent = t("openH"); $("fulfilledH").textContent = t("fulfilledH");
  $("dataH").textContent = t("dataH"); $("dataNote").textContent = t("dataNote");
  $("exportBtn").textContent = t("exportBtn"); $("lblImport").textContent = t("lblImport");
  $("disclaimer").textContent = t("disclaimer"); $("sos").textContent = t("sos");
  $("langEn").setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  $("langBn").setAttribute("aria-pressed", lang === "bn" ? "true" : "false");
  groupOptions($("donorGroupFilter"), true, t("allGroups"));
  groupOptions($("findForGroup"), true, t("anyRecipient"));
  // re-apply filter values lost by rebuild
  $("donorGroupFilter").value = donorGroupFilterVal;
  $("findForGroup").value = findForGroupVal;
}

/* ---------------- render: compatibility ---------------- */
function renderCompat() {
  const g = $("compatGroup").value || "O+";
  const dto = DONATE_TO[g] || [];
  const rf = receiveFrom(g);
  $("donateToList").innerHTML = dto.map((x) => '<span class="badge">' + esc(x) + "</span>").join("");
  $("receiveFromList").innerHTML = rf.map((x) => '<span class="badge ghost">' + esc(x) + "</span>").join("");
}

/* ---------------- render: donors ---------------- */
let donorSearchVal = "", donorGroupFilterVal = "", findForGroupVal = "";
function filteredDonors() {
  const q = donorSearchVal.trim().toLowerCase();
  return donors.filter((d) => {
    if (donorGroupFilterVal && d.group !== donorGroupFilterVal) return false;
    if (findForGroupVal) {
      // donors whose group can donate to the recipient group
      if (!receiveFrom(findForGroupVal).includes(d.group)) return false;
    }
    if (q) {
      const hay = (d.name + " " + (d.area || "")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
function donorCard(d) {
  const el = eligibilityLabel(d);
  const li = document.createElement("li");
  li.className = "item";
  li.dataset.id = d.id;
  const phone = d.phone && d.phone.trim()
    ? '<div class="meta">📞 <a href="tel:' + esc(normalizePhone(d.phone)) + '">' + esc(d.phone.trim()) + "</a></div>" : "";
  const area = d.area && d.area.trim() ? '<div class="meta">📍 ' + esc(d.area.trim()) + "</div>" : "";
  const last = d.lastDonation
    ? '<div class="meta">' + esc(t("lastDonated", locDate(d.lastDonation))) + "</div>"
    : '<div class="meta">' + esc(t("neverDonated")) + "</div>";
  li.innerHTML =
    '<div><span class="who">' + esc(d.name) + '</span> <span class="badge">' + esc(d.group) + "</span> " +
    '<span class="' + el.cls + '">' + esc(el.text) + "</span>" +
    phone + area + last + "</div>" +
    '<div class="actions"><button type="button" class="btn secondary small" data-act="edit">' + esc(t("edit")) +
    '</button><button type="button" class="btn danger small" data-act="del">' + esc(t("del")) + "</button></div>";
  li.querySelector('[data-act="edit"]').addEventListener("click", () => startEditDonor(d.id));
  li.querySelector('[data-act="del"]').addEventListener("click", () => deleteDonor(d.id));
  return li;
}
function renderDonors() {
  const list = filteredDonors();
  const ul = $("donorList");
  ul.innerHTML = "";
  list.forEach((d) => ul.appendChild(donorCard(d)));
  const empty = $("donorEmpty");
  const filtering = donorSearchVal.trim() || donorGroupFilterVal || findForGroupVal;
  if (list.length === 0) {
    empty.hidden = false;
    empty.textContent = filtering ? t("donorEmptyFilter") : t("donorEmpty");
  } else {
    empty.hidden = true;
  }
}
function resetDonorForm() {
  $("donorForm").reset();
  $("editingId").value = "";
  $("donorCancel").hidden = true;
  $("donorSubmit").textContent = t("addDonor");
  clearDonorErrs();
}
function startEditDonor(id) {
  const d = donors.find((x) => x.id === id);
  if (!d) return;
  $("editingId").value = d.id;
  $("donorName").value = d.name || "";
  $("donorGroup").value = d.group || "";
  $("donorPhone").value = d.phone || "";
  $("donorArea").value = d.area || "";
  $("donorLast").value = d.lastDonation || "";
  $("donorCancel").hidden = false;
  $("donorSubmit").textContent = t("saveChanges");
  clearDonorErrs();
  $("donors").scrollIntoView();
}
function deleteDonor(id) {
  if (!window.confirm(t("confirmDel"))) return;
  donors = donors.filter((d) => d.id !== id);
  saveJSON(LS.donors, donors);
  renderDonors();
}
function submitDonor(ev) {
  ev.preventDefault();
  clearDonorErrs();
  const d = {
    name: $("donorName").value.trim(),
    group: $("donorGroup").value,
    phone: $("donorPhone").value.trim(),
    area: $("donorArea").value.trim(),
    lastDonation: $("donorLast").value,
  };
  const errs = validateDonor(d, ASOF);
  if (errs.length) {
    errs.forEach((code) => {
      const field = code === "name_required" ? "name"
        : code === "invalid_group" ? "group"
        : code === "invalid_phone" ? "phone"
        : code === "future_date" || code === "bad_date" ? "lastDonation" : null;
      if (field) setErr("err-" + field, code);
    });
    return;
  }
  const editingId = $("editingId").value;
  if (editingId) {
    const i = donors.findIndex((x) => x.id === editingId);
    if (i >= 0) donors[i] = Object.assign({}, donors[i], d);
  } else {
    donors.unshift(Object.assign({ id: makeId(), createdAt: new Date().toISOString() }, d));
  }
  saveJSON(LS.donors, donors);
  resetDonorForm();
  renderDonors();
}

/* ---------------- render: requests ---------------- */
function requestCard(r) {
  const li = document.createElement("li");
  li.className = "item";
  li.dataset.id = r.id;
  const contact = r.contact && r.contact.trim() ? '<div class="meta">📞 ' + esc(r.contact.trim()) + "</div>" : "";
  const nb = r.neededBy ? '<div class="meta">' + esc(t("neededBy", locDate(r.neededBy))) + "</div>" : "";
  let actions;
  if (r.status === "open") {
    actions = '<button type="button" class="btn small" data-act="fulfill">' + esc(t("markFulfilled")) + "</button>" +
      '<button type="button" class="btn danger small" data-act="del">' + esc(t("delReq")) + "</button>";
  } else {
    actions = '<button type="button" class="btn danger small" data-act="del">' + esc(t("delReq")) + "</button>";
  }
  li.innerHTML =
    '<div><span class="who">' + esc(r.patient) + '</span> <span class="badge">' + esc(r.group) + "</span> " +
    '<span class="pill ' + (r.status === "open" ? "pill-wait" : "pill-ok") + '">' + esc(t("bags", locNum(r.bags))) + "</span>" +
    '<div class="meta">🏥 ' + esc(r.hospital) + "</div>" + contact + nb + "</div>" +
    '<div class="actions">' + actions + "</div>";
  const f = li.querySelector('[data-act="fulfill"]');
  if (f) f.addEventListener("click", () => fulfillRequest(r.id));
  li.querySelector('[data-act="del"]').addEventListener("click", () => deleteRequest(r.id));
  return li;
}
function renderRequests() {
  const open = requests.filter((r) => r.status === "open");
  const done = requests.filter((r) => r.status === "fulfilled");
  const oul = $("openList"), ful = $("fulfilledList");
  oul.innerHTML = ""; ful.innerHTML = "";
  open.forEach((r) => oul.appendChild(requestCard(r)));
  done.forEach((r) => ful.appendChild(requestCard(r)));
  $("openEmpty").hidden = open.length !== 0;
  $("openEmpty").textContent = t("openEmpty");
  $("fulfilledEmpty").hidden = done.length !== 0;
  $("fulfilledEmpty").textContent = t("fulfilledEmpty");
}
function fulfillRequest(id) {
  if (!window.confirm(t("fulfillConfirm"))) return;
  const r = requests.find((x) => x.id === id);
  if (!r) return;
  r.status = "fulfilled";
  r.fulfilledAt = new Date().toISOString();
  saveJSON(LS.requests, requests);
  renderRequests();
}
function deleteRequest(id) {
  if (!window.confirm(t("confirmDelReq"))) return;
  requests = requests.filter((r) => r.id !== id);
  saveJSON(LS.requests, requests);
  renderRequests();
}
function submitRequest(ev) {
  ev.preventDefault();
  clearReqErrs();
  const r = {
    patient: $("reqPatient").value.trim(),
    group: $("reqGroup").value,
    bags: $("reqBags").value === "" ? NaN : Number($("reqBags").value),
    hospital: $("reqHospital").value.trim(),
    contact: $("reqContact").value.trim(),
    neededBy: $("reqNeededBy").value,
  };
  const errs = validateRequest(r, ASOF);
  if (errs.length) {
    errs.forEach((code) => {
      const field = code === "patient_required" ? "patient"
        : code === "invalid_group" ? "reqGroup"
        : code === "invalid_bags" ? "bags"
        : code === "hospital_required" ? "hospital"
        : code === "bad_date" ? "neededBy" : null;
      if (field) setErr("err-" + field, code);
    });
    return;
  }
  requests.unshift(Object.assign({
    id: makeId(), status: "open", createdAt: new Date().toISOString(),
  }, r, { bags: Math.trunc(r.bags) }));
  saveJSON(LS.requests, requests);
  $("requestForm").reset();
  $("reqBags").value = "1";
  clearReqErrs();
  renderRequests();
}

/* ---------------- export / import ---------------- */
function exportData() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), donors: donors, requests: requests };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "blood-donor-bd-backup.json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function importDataText(text) {
  const msg = $("importMsg");
  msg.className = "msg";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    msg.classList.add("err");
    msg.textContent = t("importBadJson");
    return false;
  }
  const v = validateImport(parsed);
  if (!v.ok) {
    msg.classList.add("err");
    msg.textContent = t("importBadSchema");
    return false;
  }
  donors = parsed.donors;
  requests = parsed.requests;
  saveJSON(LS.donors, donors);
  saveJSON(LS.requests, requests);
  resetDonorForm();
  renderDonors();
  renderRequests();
  msg.classList.add("ok");
  msg.textContent = t("importOk");
  return true;
}
function onImportFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => importDataText(String(reader.result || ""));
  reader.readAsText(f);
  ev.target.value = "";
}

/* ---------------- language ---------------- */
function setLang(l) {
  lang = l === "bn" ? "bn" : "en";
  try { localStorage.setItem(LS.lang, lang); } catch (e) { /* ignore */ }
  renderStatic();
  renderCompat();
  renderDonors();
  renderRequests();
  clearDonorErrs();
  clearReqErrs();
}

/* ---------------- init ---------------- */
function init() {
  groupOptions($("compatGroup"), false);
  groupOptions($("donorGroup"), true, "—");
  groupOptions($("reqGroup"), true, "—");
  $("compatGroup").value = "O+";
  renderStatic();
  renderCompat();
  renderDonors();
  renderRequests();
  $("compatGroup").addEventListener("change", renderCompat);
  $("donorForm").addEventListener("submit", submitDonor);
  $("donorCancel").addEventListener("click", resetDonorForm);
  $("donorSearch").addEventListener("input", (e) => { donorSearchVal = e.target.value; renderDonors(); });
  $("donorGroupFilter").addEventListener("change", (e) => { donorGroupFilterVal = e.target.value; renderDonors(); });
  $("findForGroup").addEventListener("change", (e) => { findForGroupVal = e.target.value; renderDonors(); });
  $("clearFilters").addEventListener("click", () => {
    donorSearchVal = ""; donorGroupFilterVal = ""; findForGroupVal = "";
    $("donorSearch").value = ""; renderStatic(); renderDonors();
  });
  $("requestForm").addEventListener("submit", submitRequest);
  $("exportBtn").addEventListener("click", exportData);
  $("importFile").addEventListener("change", onImportFile);
  $("langEn").addEventListener("click", () => setLang("en"));
  $("langBn").addEventListener("click", () => setLang("bn"));
}
document.addEventListener("DOMContentLoaded", init);
