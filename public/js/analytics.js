const operatorSelect = document.getElementById("operatorSelect");
const stallCards = document.getElementById("stallCards");
const analyticsMsg = document.getElementById("analyticsMsg");

async function loadOperators() {
  try {
    const res = await fetch("/api/inspection/operators");
    const data = await res.json();
    operatorSelect.innerHTML = (data.operators || [])
      .map((o) => `<option value="${o.OperatorID}">${escapeHtml(o.OperatorName)}</option>`)
      .join("");
    if (data.operators && data.operators.length > 0) {
      loadPerformance(data.operators[0].OperatorID);
    }
  } catch (err) {
    operatorSelect.innerHTML = "<option>Unable to load</option>";
  }
}

operatorSelect.addEventListener("change", (e) => loadPerformance(e.target.value));

async function loadPerformance(operatorId) {
  stallCards.innerHTML = "";
  analyticsMsg.textContent = "Loading…";
  analyticsMsg.className = "lookup-msg";

  try {
    const res = await fetch(`/api/analytics/stall-performance/${operatorId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load performance data");

    const stalls = data.stalls || [];
    if (stalls.length === 0) {
      analyticsMsg.textContent = "No stalls found for this operator.";
      return;
    }
    analyticsMsg.textContent = "";

    stalls.forEach((s) => {
      const grade = s.currentHygieneGrade || "none";
      const card = document.createElement("div");
      card.className = "stall-card";
      card.innerHTML = `
        <div class="stall-card-top">
          <div>
            <h3>${escapeHtml(s.stallName)}</h3>
            <p class="hc-name">${escapeHtml(s.hawkerCentreName)}</p>
          </div>
          <span class="grade-badge grade-${grade}">${s.currentHygieneGrade || "—"}</span>
        </div>
        <div class="stat-grid">
          <div class="stat-block">
            <span class="stat-label">Orders</span>
            <span class="stat-value">${s.orderCount}</span>
          </div>
          <div class="stat-block">
            <span class="stat-label">Revenue</span>
            <span class="stat-value">$${Number(s.revenue).toFixed(2)}</span>
          </div>
          <div class="stat-block">
            <span class="stat-label">Avg Rating</span>
            <span class="stat-value">${s.avgRating !== null ? s.avgRating + " / 5" : "—"}</span>
          </div>
          <div class="stat-block">
            <span class="stat-label">Complaints</span>
            <span class="stat-value ${s.complaintCount > 0 ? "chili" : ""}">${s.complaintCount}</span>
          </div>
        </div>
      `;
      stallCards.appendChild(card);
    });
  } catch (err) {
    analyticsMsg.textContent = err.message;
    analyticsMsg.className = "lookup-msg error";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadOperators();
