// ---------------------------------------------------------------
// CONFIG
// Change API_BASE to match where your backend actually runs.
// Change ownerId logic below if you identify the owner a
// different way (e.g. a JWT you decode, or a server-rendered value).
// ---------------------------------------------------------------
const API_BASE = 'http://localhost:3000/api';
const jwtToken = localStorage.getItem('jwtToken');

if (!jwtToken) {
  alert("Something went wrong...");
  window.location.href = '/login';
}

function getOwnerId() {
  const id = sessionStorage.getItem('userId');
  return id;
}

// Which dashboard to show: 'StallOwner' or 'Operator'.
// Set this in sessionStorage right after login succeeds, e.g.
// sessionStorage.setItem('userType', data.userType);
function getUserType() {
  return sessionStorage.getItem('userType') || 'StallOwner';
}

function showError(message) {
  const banner = document.getElementById('errorBanner');
  banner.textContent = message;
  banner.classList.add('show');
}

function formatMoney(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return '$' + n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function gradeBadgeClass(grade) {
  if (grade === 'A') return 'a';
  if (grade === 'B') return 'b';
  return '';
}

function starString(rating) {
  const full = Math.round(Number(rating) || 0);
  return '&#9733;'.repeat(full) + '&#9734;'.repeat(5 - full);
}

function isPromoActive(startDate, endDate) {
  const now = new Date();
  return now >= new Date(startDate) && now <= new Date(endDate);
}

function isAgreementActive(startDate, endDate) {
  const now = new Date();
  return now >= new Date(startDate) && now <= new Date(endDate);
}

// =================================================================
// STALL OWNER DASHBOARD RENDER FUNCTIONS
// Each one is defensive: if a field is missing it falls back
// to a placeholder rather than throwing.
// =================================================================
function renderOwner(owner) {
  const name = owner?.OwnerName || 'Stall Owner';
  const id = owner?.OwnerID || '';
  document.getElementById('portalSub').textContent = 'Stall Owner Dashboard';
  document.getElementById('ownerLabel').textContent = id ? `${name} (${id})` : name;
  document.getElementById('greetingName').textContent = `Welcome back, ${name.split(' ')[0]}`;
  document.getElementById('greetingSub').textContent = 'Here is what is happening with your stalls today';
}

function renderStats(stats, stallCountFallback, promoCountFallback) {
  document.getElementById('statStallCount').textContent = stats?.stallCount ?? stallCountFallback ?? '0';
  const grade = stats?.hygieneGrade || '-';
  const gradeEl = document.getElementById('statHygieneGrade');
  gradeEl.textContent = grade;
  gradeEl.className = 'value' + (grade === 'A' ? ' grade-a' : grade === 'B' ? ' grade-b' : '');
  document.getElementById('statAvgRating').textContent = stats?.avgRating != null ? Number(stats.avgRating).toFixed(1) : '-';
  document.getElementById('statActivePromos').textContent = stats?.activePromotions ?? promoCountFallback ?? '0';
}

function renderStalls(stalls) {
  const body = document.getElementById('stallsTableBody');
  document.getElementById('stallsCount').textContent = `${stalls.length} stall${stalls.length === 1 ? '' : 's'}`;

  if (!stalls.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="7">No stalls found for this account.</td></tr>';
    return;
  }

  body.innerHTML = stalls.map(s => `
    <tr>
      <td>${s.StallID ?? ''}</td>
      <td>${s.StallName ?? ''}</td>
      <td>${s.StallUnitNo ?? ''}</td>
      <td>${s.HCName ?? ''}</td>
      <td>${s.RentalPrice != null ? formatMoney(s.RentalPrice) + ' / mo' : ''}</td>
      <td>${formatDate(s.AgrStartDate)} &ndash; ${formatDate(s.AgrEndDate)}</td>
      <td><span class="badge ${gradeBadgeClass(s.HygieneGrade)}">${s.HygieneGrade ?? '-'}</span></td>
    </tr>
  `).join('');
}

function renderMenuItems(items) {
  const body = document.getElementById('menuTableBody');
  if (!items.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="4">No menu items yet. Add your first item to get started.</td></tr>';
    return;
  }
  body.innerHTML = items.map(i => `
    <tr>
      <td>${i.ItemCode ?? ''}</td>
      <td>${i.ItemDesc ?? ''}</td>
      <td>${i.ItemCategory ?? ''}</td>
      <td>${i.ItemPrice != null ? formatMoney(i.ItemPrice) : ''}</td>
    </tr>
  `).join('');
}

function renderFeedback(feedback) {
  const list = document.getElementById('feedbackList');
  const avgEl = document.getElementById('feedbackAvg');

  if (!feedback.length) {
    list.innerHTML = '<p class="empty-note">No feedback yet.</p>';
    avgEl.textContent = '';
    return;
  }

  const avg = feedback.reduce((sum, f) => sum + Number(f.FbkRating || 0), 0) / feedback.length;
  avgEl.textContent = `Avg ${avg.toFixed(1)} / 5`;

  list.innerHTML = feedback.map(f => `
    <div class="feedback-item">
      <div class="top-row">
        <span class="cust">Customer ${f.CustomerID ?? ''}</span>
        <span class="date">${formatDate(f.FbkDateTime)}</span>
      </div>
      <div class="stars">${starString(f.FbkRating)}</div>
      <div class="comment">${f.FbkComment ?? ''}</div>
    </div>
  `).join('');
}

function renderPromotions(promotions) {
  const list = document.getElementById('promoList');
  if (!promotions.length) {
    list.innerHTML = '<p class="empty-note">No promotions running right now.</p>';
    return;
  }
  list.innerHTML = promotions.map(p => {
    const active = isPromoActive(p.PromoStartDate, p.PromoEndDate);
    return `
      <div class="promo-item">
        <div class="desc">${p.PromoDesc ?? ''}</div>
        <div class="range">${formatDate(p.PromoStartDate)} &ndash; ${formatDate(p.PromoEndDate)} &middot;
          <span class="badge ${active ? 'active' : 'expired'}">${active ? 'Active' : 'Ended'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderInspections(inspections) {
  const body = document.getElementById('inspectionTableBody');
  if (!inspections.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="5">No inspections on record.</td></tr>';
    return;
  }
  body.innerHTML = inspections.map(i => `
    <tr>
      <td>${i.InspectionID ?? ''}</td>
      <td>${formatDate(i.InspectionDate)}</td>
      <td>${i.OfficerID ? `Officer ${i.OfficerID}` : ''}</td>
      <td><span class="badge ${gradeBadgeClass(i.HygieneGrade)}">${i.HygieneGrade ?? '-'}</span></td>
      <td>${i.Remarks ?? ''}</td>
    </tr>
  `).join('');
}

async function loadStallOwnerDashboard(ownerId) {
  document.getElementById('stallOwnerView').classList.add('active');

  const response = await fetch(`${API_BASE}/StallOwner/get-dashboard/${ownerId}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Could not load dashboard data (status ${response.status}).`);
  }

  const data = await response.json();

  renderOwner(data.owner);
  renderStalls(data.stalls || []);
  renderMenuItems(data.menuItems || []);
  renderFeedback(data.feedback || []);
  renderPromotions(data.promotions || []);
  renderInspections(data.inspections || []);
  renderStats(
    data.stats,
    (data.stalls || []).length,
    (data.promotions || []).filter(p => isPromoActive(p.PromoStartDate, p.PromoEndDate)).length
  );
}

// =================================================================
// OPERATOR DASHBOARD RENDER FUNCTIONS
// Expects GET /api/Operator/get-dashboard/:id to return:
// {
//   operator: { OperatorID, OperatorName },
//   stats: { hawkerCentreCount, stallCount, activeComplaints, avgHygieneScore },
//   hawkerCentres: [...], stalls: [...], complaints: [...], inspections: [...]
// }
// =================================================================
function renderOperator(operator) {
  const name = operator?.OperatorName || 'Operator';
  const id = operator?.OperatorID || '';
  document.getElementById('portalSub').textContent = 'Operator Dashboard';
  document.getElementById('ownerLabel').textContent = id ? `${name} (${id})` : name;
  document.getElementById('greetingName').textContent = `Welcome back, ${name.split(' ')[0]}`;
  document.getElementById('greetingSub').textContent = 'Here is an overview of your hawker centres today';
}

function renderOperatorStats(stats, hcCountFallback, stallCountFallback) {
  document.getElementById('op-statHCCount').textContent = stats?.hawkerCentreCount ?? hcCountFallback ?? '0';
  document.getElementById('op-statStallCount').textContent = stats?.stallCount ?? stallCountFallback ?? '0';
  document.getElementById('op-statComplaints').textContent = stats?.activeComplaints ?? '0';
  document.getElementById('op-statHygiene').textContent = stats?.avgHygieneScore || '-';
}

function renderHawkerCentres(centres) {
  const body = document.getElementById('op-hcTableBody');
  document.getElementById('op-hcCount').textContent = `${centres.length} centre${centres.length === 1 ? '' : 's'}`;

  if (!centres.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="4">No hawker centres found for this account.</td></tr>';
    return;
  }

  body.innerHTML = centres.map(c => `
    <tr>
      <td>${c.HawkerCentreID ?? ''}</td>
      <td>${c.HCName ?? ''}</td>
      <td>${c.HCAddress ?? ''}</td>
      <td>${c.StallCount ?? 0}</td>
    </tr>
  `).join('');
}

function renderOperatorStalls(stalls) {
  const body = document.getElementById('op-stallsTableBody');
  document.getElementById('op-stallsCount').textContent = `${stalls.length} stall${stalls.length === 1 ? '' : 's'}`;

  if (!stalls.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="6">No stalls found across your hawker centres.</td></tr>';
    return;
  }

  body.innerHTML = stalls.map(s => {
    const active = s.AgrStartDate && s.AgrEndDate ? isAgreementActive(s.AgrStartDate, s.AgrEndDate) : false;
    return `
    <tr>
      <td>${s.StallID ?? ''}</td>
      <td>${s.StallName ?? ''}</td>
      <td>${s.HCName ?? ''}</td>
      <td>${s.OwnerName ?? 'Vacant'}</td>
      <td><span class="badge ${s.OwnerName ? (active ? 'active' : 'expired') : ''}">${s.OwnerName ? (active ? 'Rented' : 'Lapsed') : 'Vacant'}</span></td>
      <td><span class="badge ${gradeBadgeClass(s.HygieneGrade)}">${s.HygieneGrade ?? '-'}</span></td>
    </tr>
  `;
  }).join('');
}

function renderComplaints(complaints) {
  const list = document.getElementById('op-complaintsList');
  document.getElementById('op-complaintsCount').textContent = `${complaints.length} open`;

  if (!complaints.length) {
    list.innerHTML = '<p class="empty-note">No complaints on record.</p>';
    return;
  }

  list.innerHTML = complaints.map(c => `
    <div class="feedback-item">
      <div class="top-row">
        <span class="cust">${c.StallName ?? c.StallID ?? ''} &middot; ${c.Category ?? ''}</span>
        <span class="date">${formatDate(c.FbkDateTime)}</span>
      </div>
      <div class="comment">${c.FbkComment ?? ''}</div>
    </div>
  `).join('');
}

function renderOperatorInspections(inspections) {
  const list = document.getElementById('op-inspectionsList');
  if (!inspections.length) {
    list.innerHTML = '<p class="empty-note">No inspections on record.</p>';
    return;
  }
  list.innerHTML = inspections.map(i => `
    <div class="promo-item">
      <div class="desc">${i.StallName ?? i.StallID ?? ''} &middot; ${formatDate(i.InspectionDate)}</div>
      <div class="range">Officer ${i.OfficerID ?? ''} &middot;
        <span class="badge ${gradeBadgeClass(i.HygieneGrade)}">${i.HygieneGrade ?? '-'}</span>
      </div>
    </div>
  `).join('');
}

async function loadOperatorDashboard(operatorId) {
  document.getElementById('operatorView').classList.add('active');

  const response = await fetch(`${API_BASE}/Operator/get-dashboard/${operatorId}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Could not load dashboard data (status ${response.status}).`);
  }

  const data = await response.json();

  renderOperator(data.operator);
  renderHawkerCentres(data.hawkerCentres || []);
  renderOperatorStalls(data.stalls || []);
  renderComplaints(data.complaints || []);
  renderOperatorInspections(data.inspections || []);
  renderOperatorStats(
    data.stats,
    (data.hawkerCentres || []).length,
    (data.stalls || []).length
  );
}

// ---------------------------------------------------------------
// LOAD / ROUTER
// Checks userType (set in sessionStorage right after login) and
// calls the matching loader. Defaults to Stall Owner if unset.
// ---------------------------------------------------------------
async function loadDashboard() {
  const id = getOwnerId();
  const userType = getUserType();

  try {
    if (userType === 'Operator') {
      await loadOperatorDashboard(id);
    } else {
      document.getElementById('stallOwnerView').classList.add('active');
      await loadStallOwnerDashboard(id);
    }

  } catch (error) {
    showError(error.message || 'Something went wrong loading your dashboard. Please try again.');

    if (userType === 'Operator') {
      document.getElementById('ownerLabel').textContent = 'Operator';
      document.getElementById('greetingName').textContent = 'Welcome back';
      renderHawkerCentres([]);
      renderOperatorStalls([]);
      renderComplaints([]);
      renderOperatorInspections([]);
      renderOperatorStats({});
    } else {
      document.getElementById('ownerLabel').textContent = 'Stall Owner';
      document.getElementById('greetingName').textContent = 'Welcome back';
      renderStalls([]);
      renderMenuItems([]);
      renderFeedback([]);
      renderPromotions([]);
      renderInspections([]);
      renderStats({});
    }
  }
}

document.getElementById('ownerLabel').addEventListener('click', function() {
  window.location.href = '/profile';
});

document.getElementById('logoutBtn').addEventListener('click', async function() {
  console.log("logging out...");
  sessionStorage.clear("userId");
  localStorage.clear("jwtToken");

  window.location.href = '/login';
});

loadDashboard();