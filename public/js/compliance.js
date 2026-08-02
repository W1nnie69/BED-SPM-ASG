// ---------------------------------------------------------------
// REQUIRE LOGIN
// Unlike the customer order page, guests aren't allowed here at all.
// Same jwtToken/userType/userId pattern as your other pages, assumed
// userType for this role is "Officer" - adjust if yours is named
// differently (e.g. "NEAOfficer").
// ---------------------------------------------------------------
const jwtToken = localStorage.getItem("jwtToken");
const officerUserType = sessionStorage.getItem("userType");
const currentOfficerId = sessionStorage.getItem("userId");

if (!jwtToken || officerUserType !== "NeaOfficer" || !currentOfficerId) {
  window.location.href = "/login";
}

let stalls = [];

const whoBtn = document.getElementById("whoBtn");

const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    views.forEach((v) => v.classList.remove("active"));
    document.getElementById(`view-${tab.dataset.view}`).classList.add("active");
  });
});

// ---------- Who's inspecting (name pill, links to profile) ----------
// Assumes GET /api/Officer/get-profile/:id, same route pattern used
// on the profile page for the other roles.
async function initWho() {
  whoBtn.textContent = "Loading...";

  whoBtn.addEventListener("click", () => {
    window.location.href = "/profile";
  });

  try {
    const res = await fetch(`/api/user/get-profile/${currentOfficerId}`, {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    const data = await res.json();
    console.log(data);
    whoBtn.textContent = data.OfficerName;
  } catch (err) {
    whoBtn.textContent = currentOfficerId;
    console.error(err);
  }
}

// ---------- Load stalls for the dropdown ----------
async function loadStalls() {
  const select = document.getElementById("stallSelect");
  try {
    const res = await fetch("/api/inspection/stalls", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    const data = await res.json();
    stalls = data.stalls || [];
    select.innerHTML = stalls
      .map((s) => `<option value="${s.StallID}">${escapeHtml(s.StallName)} — ${escapeHtml(s.HCName)}</option>`)
      .join("");
  } catch (err) {
    select.innerHTML = "<option>Unable to load</option>";
  }
}

// ---------- Submit a new inspection ----------
document.getElementById("submitInspectionBtn").addEventListener("click", async () => {
  const officerId = currentOfficerId;
  const stallId = document.getElementById("stallSelect").value;
  const hygieneGrade = document.getElementById("gradeSelect").value;
  const gradeExpiry = document.getElementById("expiryInput").value;
  const remarksRaw = document.getElementById("remarksInput").value.trim();
  const remarks = remarksRaw ? remarksRaw.split("\n").map((r) => r.trim()).filter(Boolean) : [];

  const msg = document.getElementById("inspectionMsg");
  msg.textContent = "";
  msg.className = "action-msg";

  if (!gradeExpiry) {
    msg.textContent = "Please select a grade expiry date.";
    msg.className = "action-msg error";
    return;
  }

  const btn = document.getElementById("submitInspectionBtn");
  btn.disabled = true;
  btn.textContent = "Submitting…";

  try {
    const res = await fetch("/api/inspection/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ officerId, stallId, hygieneGrade, gradeExpiry, remarks })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to record inspection");

    msg.textContent = `Inspection ${data.inspection.inspectionId} recorded — grade ${data.inspection.hygieneGrade}.`;
    msg.className = "action-msg success";
    document.getElementById("remarksInput").value = "";
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "action-msg error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit Inspection";
  }
});

// ---------- Look up + update grade ----------
document.getElementById("lookupInspectionBtn").addEventListener("click", async () => {
  const inspectionId = document.getElementById("inspectionIdInput").value.trim().toUpperCase();
  const lookupMsg = document.getElementById("gradeLookupMsg");
  const detail = document.getElementById("gradeDetail");
  lookupMsg.textContent = "";
  lookupMsg.className = "lookup-msg";
  detail.classList.add("hidden");

  if (!inspectionId) {
    lookupMsg.textContent = "Enter an inspection ID.";
    lookupMsg.className = "lookup-msg error";
    return;
  }

  try {
    const res = await fetch(`/api/inspection/byId/${inspectionId}`, {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Inspection not found");

    const inspection = data.inspection;
    document.getElementById("inspectionIdLabel").textContent = inspection.inspectionId;
    document.getElementById("inspectionStallLabel").textContent = inspection.stallName;
    document.getElementById("inspectionDateLabel").textContent = new Date(inspection.inspectionDate).toLocaleString();
    document.getElementById("updateGradeSelect").value = inspection.hygieneGrade;
    document.getElementById("updateExpiryInput").value = inspection.gradeExpiry.split("T")[0];

    detail.dataset.inspectionId = inspection.inspectionId;
    detail.classList.remove("hidden");
  } catch (err) {
    lookupMsg.textContent = err.message;
    lookupMsg.className = "lookup-msg error";
  }
});

document.getElementById("saveGradeBtn").addEventListener("click", async () => {
  const detail = document.getElementById("gradeDetail");
  const inspectionId = detail.dataset.inspectionId;
  const hygieneGrade = document.getElementById("updateGradeSelect").value;
  const gradeExpiry = document.getElementById("updateExpiryInput").value;
  const msg = document.getElementById("gradeMsg");

  msg.textContent = "";
  msg.className = "action-msg";

  const btn = document.getElementById("saveGradeBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    const res = await fetch(`/api/inspection/${inspectionId}/grade`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ hygieneGrade, gradeExpiry })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update grade");

    msg.textContent = "Grade updated successfully.";
    msg.className = "action-msg success";
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "action-msg error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Grade";
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

initWho();
loadStalls();