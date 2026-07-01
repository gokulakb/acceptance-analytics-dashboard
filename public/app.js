const metricsGrid = document.getElementById('metricsGrid');
const offersTableBody = document.getElementById('offersTableBody');
const verificationStatus = document.getElementById('verificationStatus');
const lastUpdated = document.getElementById('lastUpdated');
const offerForm = document.getElementById('offerForm');
const exportCsv = document.getElementById('exportCsv');
const activityList = document.getElementById('activityList');
const qualityPanel = document.getElementById('qualityPanel');
const verificationHistoryList = document.getElementById('verificationHistoryList');
const verifyModal = document.getElementById('verifyModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

let funnelChart;
let decisionChart;
let timelineChart;

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function renderMetrics(data) {
  metricsGrid.innerHTML = '';
  const cards = [
    { title: 'Total Offers', value: data.totalOffers },
    { title: 'Accepted', value: data.accepted },
    { title: 'Rejected', value: data.rejected },
    { title: 'Expired', value: data.expired },
    { title: 'Acceptance Rate', value: `${data.acceptanceRate}%` },
    { title: 'Current Pipeline', value: `${data.activePipeline} Active Offers` },
    { title: 'Average Acceptance Time', value: `${data.averageAcceptanceTime} days` },
    {
      title: 'Verification Summary',
      verifiedOffers: data.verificationSummary?.verifiedOffers ?? 0,
      tamperedOffers: data.verificationSummary?.tamperedOffers ?? 0,
      verificationSuccessRate: data.verificationSummary?.verificationSuccessRate ?? 0
    }
  ];

  cards.forEach((card) => {
    const el = document.createElement('article');
    el.className = 'card';
    if (card.title === 'Verification Summary') {
      el.innerHTML = `
        <div class="metric-title">${card.title}</div>
        <div class="metric-value">${card.verifiedOffers}</div>
        <div class="metric-subtle">Verified</div>
        <div class="metric-subtle">${card.tamperedOffers} Tampered</div>
        <div class="metric-subtle">${card.verificationSuccessRate}% Success</div>
      `;
    } else {
      el.innerHTML = `<div class="metric-title">${card.title}</div><div class="metric-value">${card.value}</div>`;
    }
    metricsGrid.appendChild(el);
  });
}

function renderStageChart(data) {
  const labels = data.map((item) => item.stage.replace(/_/g, ' '));
  const counts = data.map((item) => item.count);
  if (funnelChart) funnelChart.destroy();
  funnelChart = new Chart(document.getElementById('funnelChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Offers by stage', data: counts, backgroundColor: ['#4cc9f0', '#2ec4b6', '#f4a261', '#8b5cf6', '#f59e0b', '#f87171', '#34d399'] }]
    },
    options: { scales: { y: { beginAtZero: true, ticks: { color: '#f4f7fb' } } }, plugins: { legend: { labels: { color: '#f4f7fb' } } } }
  });
}

function renderDecisionChart(data) {
  const labels = data.map((item) => item.decision_status);
  const counts = data.map((item) => item.count);
  if (decisionChart) decisionChart.destroy();
  decisionChart = new Chart(document.getElementById('decisionChart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: counts, backgroundColor: ['#4cc9f0', '#4ade80', '#f87171', '#f59e0b'] }]
    },
    options: { plugins: { legend: { labels: { color: '#f4f7fb' } } } }
  });
}

function renderTimelineChart(data) {
  const labels = data.map((item) => item.week_label);
  const counts = data.map((item) => item.count);
  if (timelineChart) timelineChart.destroy();
  timelineChart = new Chart(document.getElementById('timelineChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Offers created', data: counts, borderColor: '#4cc9f0', backgroundColor: 'rgba(76,201,240,0.18)', fill: true, tension: 0.25 }]
    },
    options: { scales: { y: { beginAtZero: true, ticks: { color: '#f4f7fb' } }, x: { ticks: { color: '#f4f7fb' } } }, plugins: { legend: { labels: { color: '#f4f7fb' } } } }
  });
}

function getStageLabel(stage) {
  return stage.replace(/_/g, ' ');
}

function getStatusPill(status) {
  const mapping = {
    accepted: 'active',
    rejected: 'closed',
    expired: 'closed',
    active: 'in-progress'
  };
  return `<span class="pill ${mapping[status] || 'in-progress'}">${status}</span>`;
}

function renderOffers(offers) {
  offersTableBody.innerHTML = '';
  offers.forEach((offer) => {
    const progressionSteps = ['Application', 'Offer Generated', 'Offer Viewed', 'Offer Signed', 'Offer Accepted'];
    const stageIndex = progressionSteps.findIndex((step) => step.toLowerCase().replace(/ /g, '_') === offer.stage);
    const progressItems = progressionSteps.map((step, index) => {
      const key = step.toLowerCase().replace(/ /g, '_');
      const isCurrent = key === offer.stage;
      const isComplete = index < (stageIndex >= 0 ? stageIndex : 0);
      const className = isCurrent ? 'progress-pill current' : isComplete ? 'progress-pill complete' : 'progress-pill';
      return `<span class="${className}">${step}</span>`;
    }).join('');

    const verificationBadge = offer.verificationStatus === 'Verified' ? '🟢 Verified' : '🔴 Tampered';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${offer.candidate_name}</td>
      <td>${offer.role}</td>
      <td>${offer.department}</td>
      <td>${offer.application_date}</td>
      <td>${getStageLabel(offer.stage)}</td>
      <td>${getStatusPill(offer.decision_status)}</td>
      <td>$${Number(offer.offer_value).toLocaleString()}</td>
      <td><div>${verificationBadge}</div><div class="metric-subtle">${offer.integrity_hash.slice(0, 12)}…</div></td>
      <td>
        <div class="action-group">
          <button class="action-button" data-id="${offer.id}" data-action="advance">Advance</button>
          <button class="action-button" data-id="${offer.id}" data-action="accept">Accept</button>
          <button class="action-button" data-id="${offer.id}" data-action="reject">Reject</button>
          <button class="action-button" data-id="${offer.id}" data-action="expire">Expire</button>
          <button class="pill-button" data-id="${offer.id}" data-action="verify">Verify</button>
        </div>
        <div class="progress-row">${progressItems}</div>
      </td>
    `;
    offersTableBody.appendChild(tr);
  });
}

function renderActivity(activity) {
  activityList.innerHTML = '';
  if (!activity.length) {
    activityList.innerHTML = '<li>No activity yet.</li>';
    return;
  }

  activity.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.title}</strong><div>${item.candidate_name}</div><div>${new Date(item.timestamp).toLocaleString()}</div>`;
    activityList.appendChild(li);
  });
}

function renderQuality(quality) {
  qualityPanel.innerHTML = '';
  const items = [
    { label: 'Database Status', value: quality.databaseStatus },
    { label: 'Duplicate Records', value: quality.duplicateRecords },
    { label: 'Null Records', value: quality.nullRecords },
    { label: 'Latest Event Timestamp', value: quality.latestEventTimestamp || '—' }
  ];
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'quality-item';
    div.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
    qualityPanel.appendChild(div);
  });
}

function renderVerificationHistory(history) {
  verificationHistoryList.innerHTML = '';
  if (!history.length) {
    verificationHistoryList.innerHTML = '<li>No verification history yet.</li>';
    return;
  }
  history.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.result}</strong>
      <div>Candidate: ${item.candidate}</div>
      <div>Offer ID: ${item.offerId}</div>
      <div>${new Date(item.verificationTime).toLocaleString()}</div>
    `;
    verificationHistoryList.appendChild(li);
  });
}

function setVerificationState(result) {
  verificationStatus.textContent = result.verified ? 'Integrity is intact' : 'Integrity issue detected';
  verificationStatus.style.color = result.verified ? '#4ade80' : '#f87171';
}

function openModal(result) {
  modalBody.innerHTML = `
    <div class="modal-title">Offer Integrity Verification</div>
    <div class="modal-row"><span>Candidate Name</span><strong>${result.candidate || result.candidateName || '—'}</strong></div>
    <div class="modal-row"><span>Offer ID</span><strong>${result.offerId || '—'}</strong></div>
    <div class="modal-row"><span>Stored SHA-256 Hash</span><strong>${result.storedHash || '—'}</strong></div>
    <div class="modal-row"><span>Current SHA-256 Hash</span><strong>${result.currentHash || '—'}</strong></div>
    <div class="modal-row"><span>Verification Status</span><strong class="status-pill ${result.verified ? 'verified' : 'tampered'}">${result.icon || ''} ${result.status}</strong></div>
    <div class="modal-row"><span>Verified Timestamp</span><strong>${new Date(result.verifiedAt || result.verificationTime).toLocaleString()}</strong></div>
    <div class="modal-row"><span>Message</span><strong>${result.message || 'Verification completed.'}</strong></div>
  `;
  verifyModal.classList.remove('hidden');
  verifyModal.setAttribute('aria-hidden', 'false');
}

function closeVerificationModal() {
  verifyModal.classList.add('hidden');
  verifyModal.setAttribute('aria-hidden', 'true');
}

async function refreshDashboard() {
  try {
    const [overview, stageBreakdown, statusBreakdown, timeline, offers, verification, activity, quality] = await Promise.all([
      fetchJson('/api/analytics/overview'),
      fetchJson('/api/analytics/stages'),
      fetchJson('/api/analytics/statuses'),
      fetchJson('/api/analytics/timeline'),
      fetchJson('/api/offers'),
      fetchJson('/api/verification'),
      fetchJson('/api/analytics/activity'),
      fetchJson('/api/analytics/quality')
    ]);

    renderMetrics(overview);
    renderStageChart(stageBreakdown);
    renderDecisionChart(statusBreakdown);
    renderTimelineChart(timeline);
    renderOffers(offers);
    renderActivity(activity);
    renderQuality(quality);
    renderVerificationHistory(verification.history || []);
    lastUpdated.textContent = `Last updated: ${new Date(overview.lastUpdated).toLocaleString()}`;
    setVerificationState(verification);
  } catch (error) {
    verificationStatus.textContent = 'Dashboard unavailable';
    verificationStatus.style.color = '#f87171';
    console.error(error);
  }
}

offerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(offerForm);
  const payload = Object.fromEntries(formData.entries());
  payload.offer_value = Number(payload.offer_value);

  await fetch('/api/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  offerForm.reset();
  await refreshDashboard();
});

offersTableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');

  if (action === 'verify') {
    const result = await fetchJson(`/api/verification/${id}`);
    openModal(result);
    await refreshDashboard();
    return;
  }

  await fetch(`/api/offers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  await refreshDashboard();
});

closeModal.addEventListener('click', closeVerificationModal);
verifyModal.addEventListener('click', (event) => {
  if (event.target === verifyModal) {
    closeVerificationModal();
  }
});

exportCsv.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = exportCsv.getAttribute('href');
});

refreshDashboard();
