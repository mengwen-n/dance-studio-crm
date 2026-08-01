const seedData = {
  leads: [
    { id: 'LD-1042', name: 'Aisha Rahman', initials: 'AR', phone: '+60 12 448 9201', interest: 'Adult Beginner', trial: 'Today, 7:00 PM', status: 'Trial booked', statusClass: 'blue', source: 'Instagram', last: '12 min ago', avatar: '' },
    { id: 'LD-1041', name: 'Daniel Tan', initials: 'DT', phone: '+60 17 229 4410', interest: 'Kids Ballet', trial: 'Tomorrow, 5:30 PM', status: 'New lead', statusClass: 'orange', source: 'WhatsApp', last: '34 min ago', avatar: 'alt-1' },
    { id: 'LD-1039', name: 'Mei Ling Wong', initials: 'MW', phone: '+60 11 872 0091', interest: 'Hip Hop', trial: '30 Jul, 7:00 PM', status: 'Follow-up due', statusClass: 'red', source: 'Walk-in', last: 'Yesterday', avatar: 'alt-2' },
    { id: 'LD-1038', name: 'Nadia Aziz', initials: 'NA', phone: '+60 16 902 3384', interest: 'Private coaching', trial: '28 Jul, 6:00 PM', status: 'Converted', statusClass: 'green', source: 'Referral', last: '2 days ago', avatar: 'alt-3' },
    { id: 'LD-1037', name: 'Jason Lim', initials: 'JL', phone: '+60 12 611 4772', interest: 'Adult Beginner', trial: '27 Jul, 7:00 PM', status: 'Trial attended', statusClass: 'green', source: 'Facebook', last: '3 days ago', avatar: '' },
    { id: 'LD-1035', name: 'Siti Hajar', initials: 'SH', phone: '+60 19 331 8142', interest: 'Kids Ballet', trial: '25 Jul, 5:30 PM', status: 'Follow-up due', statusClass: 'red', source: 'Instagram', last: '5 days ago', avatar: 'alt-1' }
  ],
  members: [
    { name: 'Nadia Aziz', initials: 'NA', plan: 'Unlimited monthly', class: 'Private coaching', renewal: '02 Aug 2026', status: 'Renewal due', statusClass: 'orange', attendance: '92%', avatar: 'alt-3' },
    { name: 'Farah Kamal', initials: 'FK', plan: '8 classes / month', class: 'Adult Beginner', renewal: '08 Aug 2026', status: 'Active', statusClass: 'green', attendance: '88%', avatar: 'alt-1' },
    { name: 'Jason Lim', initials: 'JL', plan: 'Unlimited monthly', class: 'Hip Hop', renewal: '12 Aug 2026', status: 'Active', statusClass: 'green', attendance: '76%', avatar: '' },
    { name: 'Olivia Ng', initials: 'ON', plan: '4 classes / month', class: 'Kids Ballet', renewal: '15 Aug 2026', status: 'Active', statusClass: 'green', attendance: '95%', avatar: 'alt-2' },
    { name: 'Amir Hakim', initials: 'AH', plan: '8 classes / month', class: 'Hip Hop', renewal: '18 Aug 2026', status: 'At risk', statusClass: 'red', attendance: '41%', avatar: 'alt-1' },
    { name: 'Chloe Lee', initials: 'CL', plan: 'Unlimited monthly', class: 'Adult Beginner', renewal: '22 Aug 2026', status: 'Active', statusClass: 'green', attendance: '83%', avatar: 'alt-2' }
  ],
  attendance: [
    { class: 'Adult Beginner', detail: 'Studio A · 6:00 PM', instructor: 'Marcus', booked: 18, present: 15, status: 'In progress' },
    { class: 'Kids Ballet', detail: 'Studio B · 5:30 PM', instructor: 'Sofia', booked: 14, present: 14, status: 'Completed' },
    { class: 'Hip Hop Foundations', detail: 'Studio A · 7:00 PM', instructor: 'Marcus', booked: 20, present: 16, status: 'Upcoming' },
    { class: 'Private Coaching', detail: 'Studio C · 8:30 PM', instructor: 'Sofia', booked: 3, present: 2, status: 'Upcoming' }
  ],
  logs: [
    { icon: '✓', text: 'Trial reminder sent to Aisha Rahman', time: '12 min ago' },
    { icon: '✓', text: 'Renewal alert created for Nadia Aziz', time: '1 hr ago' },
    { icon: '✓', text: 'Daily owner summary generated', time: 'Yesterday' }
  ],
  automations: [
    { id: 'trial', icon: '↗', title: 'Trial follow-up', description: 'Send a friendly WhatsApp prompt 2 hours after a trial class.', trigger: 'After trial ends', result: '6 runs this week', on: true },
    { id: 'renewal', icon: '↻', title: 'Renewal guard', description: 'Alert the owner 7 days before a membership expires.', trigger: '7 days before renewal', result: '8 members watched', on: true },
    { id: 'attendance', icon: '✓', title: 'Attendance check-in', description: 'Mark attendance and notify parents when a class is missed.', trigger: 'Class start time', result: '4 runs today', on: true },
    { id: 'summary', icon: '▤', title: 'Owner daily summary', description: 'Deliver revenue, leads, and issues in one morning digest.', trigger: 'Every day at 9:00 AM', result: 'Last sent today', on: false }
  ]
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const saved = localStorage.getItem('danceflow-demo');
const state = saved ? JSON.parse(saved) : clone(seedData);
let currentPage = 'dashboard';
let toastTimer;

const pageTitles = { dashboard: 'Overview', leads: 'Leads & trials', members: 'Members', attendance: 'Attendance', automations: 'Automations', reports: 'Reports', settings: 'Settings' };
const pageContainer = document.getElementById('pageContainer');

function persist() { localStorage.setItem('danceflow-demo', JSON.stringify(state)); }
function initials(name) { return name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase(); }
function esc(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function showToast(message) {
  document.getElementById('toastMessage').textContent = message;
  document.getElementById('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => document.getElementById('toast').classList.remove('show'), 3200);
}
function saveLog(text) {
  state.logs.unshift({ icon: '✓', text, time: 'Just now' });
  state.logs = state.logs.slice(0, 5);
  persist();
}
function goTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.page === page));
  document.getElementById('breadcrumbCurrent').textContent = pageTitles[page];
  document.getElementById('sidebar').classList.remove('open');
  render();
}
function avatarMarkup(person, className = 'person-avatar') {
  return `<div class="${className} ${person.avatar || ''}">${esc(person.initials || initials(person.name))}</div>`;
}
function pageHeading(eyebrow, title, description, action = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="heading-description">${description}</p></div>${action}</div>`;
}
function statusPill(text, type) { return `<span class="status-pill ${type}">${esc(text)}</span>`; }

function renderDashboard() {
  const activityRows = state.logs.slice(0, 3).map((log, index) => `<tr><td><div class="activity-who"><div class="mini-avatar ${index === 1 ? 'green' : index === 2 ? 'blue' : ''}">${index === 0 ? 'AR' : index === 1 ? 'NA' : 'DF'}</div>${esc(log.text.replace(/ sent.*| created.*| generated.*/i, ''))}</div></td><td class="activity-type">Automation</td><td class="activity-time">${esc(log.time)}</td></tr>`).join('');
  return `${pageHeading('SATURDAY, 31 JULY 2026', 'Good morning, studio admin.', 'Here’s what needs your attention today. <strong>3 automations are ready to run.</strong>', '<div class="header-actions"><button class="button button-secondary" data-action="export">↧ Export report</button><button class="button button-primary" data-open-modal>＋ New lead</button></div>')}
    <section class="stat-grid">
      <article class="stat-card"><div class="stat-label">Monthly revenue <span class="stat-icon">↗</span></div><div class="stat-value">RM 18,640</div><div class="stat-foot"><span class="trend-up">↗ 12.4%</span><span>vs last month</span></div></article>
      <article class="stat-card"><div class="stat-label">Active members <span class="stat-icon">♧</span></div><div class="stat-value">126</div><div class="stat-foot"><span class="trend-up">↗ 8.7%</span><span>6 new this month</span></div></article>
      <article class="stat-card"><div class="stat-label">Trial classes <span class="stat-icon">✦</span></div><div class="stat-value">14</div><div class="stat-foot"><span class="trend-up">↗ 4.2%</span><span>this month</span></div></article>
      <article class="stat-card"><div class="stat-label">At-risk renewals <span class="stat-icon">!</span></div><div class="stat-value">8</div><div class="stat-foot"><span class="trend-warn">Action needed</span><span>next 7 days</span></div></article>
    </section>
    <section class="automation-banner"><div class="banner-left"><div class="banner-icon">✦</div><div class="banner-copy"><strong>Automation saved an estimated <span>4.5 hours</span> this week</strong><p>6 follow-ups, 8 renewal checks, and 4 attendance updates handled automatically.</p></div></div><button class="button banner-button" data-page="automations">Manage automations <span>→</span></button></section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Trial conversion pipeline</h2><p class="panel-subtitle">From first enquiry to paid member</p></div><select class="range-select"><option>Last 30 days</option><option>Last 7 days</option></select></div><div class="pipeline"><div class="pipeline-stage"><div class="pipeline-number">42</div><div class="pipeline-bar-wrap"><div class="pipeline-bar" style="height: 38%"></div></div><div class="pipeline-label">New leads</div></div><div class="pipeline-stage"><div class="pipeline-number">18</div><div class="pipeline-bar-wrap"><div class="pipeline-bar" style="height: 53%"></div></div><div class="pipeline-label">Trial booked</div></div><div class="pipeline-stage"><div class="pipeline-number">12</div><div class="pipeline-bar-wrap"><div class="pipeline-bar" style="height: 68%"></div></div><div class="pipeline-label">Attended</div></div><div class="pipeline-stage"><div class="pipeline-number">7</div><div class="pipeline-bar-wrap"><div class="pipeline-bar" style="height: 86%"></div></div><div class="pipeline-label">Converted</div></div></div><div class="pipeline-caption"><strong>16.7% conversion</strong> from trial to membership · target is 20%</div></article>
      <article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Today’s schedule</h2><p class="panel-subtitle">4 classes · 55 bookings</p></div><button class="link-button" data-page="attendance">View all →</button></div><div class="schedule-list"><div class="schedule-item"><span class="schedule-time">5:30 PM</span><span class="schedule-track"></span><div class="schedule-info"><strong>Kids Ballet</strong><span>Studio B · Sofia</span></div><span class="schedule-status">14 booked</span></div><div class="schedule-item"><span class="schedule-time">6:00 PM</span><span class="schedule-track"></span><div class="schedule-info"><strong>Adult Beginner</strong><span>Studio A · Marcus</span></div><span class="schedule-status live">Live now</span></div><div class="schedule-item"><span class="schedule-time">7:00 PM</span><span class="schedule-track"></span><div class="schedule-info"><strong>Hip Hop Foundations</strong><span>Studio A · Marcus</span></div><span class="schedule-status">20 booked</span></div><div class="schedule-item"><span class="schedule-time">8:30 PM</span><span class="schedule-track"></span><div class="schedule-info"><strong>Private Coaching</strong><span>Studio C · Sofia</span></div><span class="schedule-status">3 booked</span></div></div></article>
    </section>
    <section class="lower-grid"><article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Recent activity</h2><p class="panel-subtitle">What’s moving in your studio</p></div><button class="link-button" data-page="automations">Automation log →</button></div><table class="activity-table"><thead><tr><th>ACTIVITY</th><th>TYPE</th><th>WHEN</th></tr></thead><tbody>${activityRows}</tbody></table></article><article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Studio health</h2><p class="panel-subtitle">Key signals this month</p></div><span class="eyebrow">ON TRACK</span></div><div class="health-list"><div class="health-row"><div><div class="health-name">Trial attendance</div><div class="health-meta">12 of 18 booked</div></div><div class="progress-track"><div class="progress-bar" style="width: 68%"></div></div><div class="health-percent">68%</div></div><div class="health-row"><div><div class="health-name">Renewal rate</div><div class="health-meta">24 of 28 members</div></div><div class="progress-track"><div class="progress-bar" style="width: 86%"></div></div><div class="health-percent">86%</div></div><div class="health-row"><div><div class="health-name">Monthly capacity</div><div class="health-meta">55 of 72 slots</div></div><div class="progress-track"><div class="progress-bar" style="width: 76%"></div></div><div class="health-percent">76%</div></div><div class="health-row"><div><div class="health-name">Follow-ups on time</div><div class="health-meta">38 of 42 leads</div></div><div class="progress-track"><div class="progress-bar" style="width: 90%"></div></div><div class="health-percent">90%</div></div></div></article></section>`;
}

function renderLeads() {
  const rows = state.leads.map((lead) => `<tr data-searchable="${esc(`${lead.name} ${lead.phone} ${lead.interest} ${lead.status}`.toLowerCase())}"><td><div class="person-cell">${avatarMarkup(lead)}<div class="person-copy"><strong>${esc(lead.name)}</strong><span>${esc(lead.phone)}</span></div></div></td><td>${esc(lead.interest)}</td><td>${esc(lead.trial)}</td><td>${statusPill(lead.status, lead.statusClass)}</td><td>${esc(lead.source)}</td><td><button class="table-action" data-followup="${esc(lead.name)}">Follow up</button></td></tr>`).join('');
  return `${pageHeading('PIPELINE', 'Leads & trials', 'One place for every enquiry, trial, and follow-up.', '<div class="header-actions"><button class="button button-secondary" data-action="run-followups">✦ Run follow-ups</button><button class="button button-primary" data-open-modal>＋ New lead</button></div>')}<section class="subpage-grid"><article class="panel table-panel"><div class="table-toolbar"><div class="toolbar-left"><input class="filter-input" id="leadFilter" placeholder="Search leads..." /><select class="filter-select" id="leadStatusFilter"><option value="">All statuses</option><option>New lead</option><option>Trial booked</option><option>Follow-up due</option><option>Converted</option></select></div><span class="eyebrow">${state.leads.length} TOTAL LEADS</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>LEAD</th><th>INTEREST</th><th>TRIAL DATE</th><th>STATUS</th><th>SOURCE</th><th></th></tr></thead><tbody id="leadsTable">${rows}</tbody></table></div></article></section>`;
}

function renderMembers() {
  const cards = state.members.map((member) => `<article class="member-card"><div class="member-card-top"><div>${avatarMarkup(member)}</div>${statusPill(member.status, member.statusClass)}</div><h3>${esc(member.name)}</h3><p>${esc(member.plan)}</p><div class="member-detail"><div>Class<strong>${esc(member.class)}</strong></div><div>Renewal<strong>${esc(member.renewal)}</strong></div><div>Attendance<strong>${esc(member.attendance)}</strong></div></div></article>`).join('');
  return `${pageHeading('MEMBER DIRECTORY', 'Members', 'See who is engaged, who is renewing, and who needs a nudge.', '<div class="header-actions"><button class="button button-secondary" data-action="export">↧ Export members</button><button class="button button-primary" data-action="member-added">＋ Add member</button></div>')}<section class="member-grid">${cards}</section>`;
}

function renderAttendance() {
  const present = state.attendance.reduce((sum, item) => sum + item.present, 0);
  const booked = state.attendance.reduce((sum, item) => sum + item.booked, 0);
  const rows = state.attendance.map((item, index) => `<div class="attendance-row"><div class="attendance-class"><strong>${esc(item.class)}</strong><span>${esc(item.detail)}</span></div><div class="attendance-value">${esc(item.instructor)}</div><div class="attendance-value">${item.present} / ${item.booked} present</div><div class="attendance-buttons"><button class="attendance-button ${item.status === 'Completed' ? 'active' : ''}" data-attendance="${index}">✓ Mark present</button><button class="attendance-button" data-attendance-late="${index}">Late</button></div></div>`).join('');
  return `${pageHeading('TODAY · 31 JULY', 'Attendance', 'A two-click check-in for every class, with no paper roll calls.', '<div class="header-actions"><button class="button button-secondary" data-action="attendance-summary">✦ Send attendance summary</button></div>')}<section class="attendance-summary"><article class="stat-card"><div class="stat-label">Booked today</div><div class="stat-value">${booked}</div><div class="stat-foot"><span>across 4 classes</span></div></article><article class="stat-card"><div class="stat-label">Checked in</div><div class="stat-value">${present}</div><div class="stat-foot"><span class="trend-up">${Math.round((present / booked) * 100)}%</span><span>attendance rate</span></div></article><article class="stat-card"><div class="stat-label">No-shows</div><div class="stat-value">${booked - present}</div><div class="stat-foot"><span class="trend-warn">Follow up</span><span>automated tonight</span></div></article><article class="stat-card"><div class="stat-label">Classes left</div><div class="stat-value">2</div><div class="stat-foot"><span>next at 7:00 PM</span></div></article></section><article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Class roll call</h2><p class="panel-subtitle">Update attendance as students arrive</p></div><span class="eyebrow">LIVE TODAY</span></div><div class="attendance-list">${rows}</div></article>`;
}

function renderAutomations() {
  const cards = state.automations.map((automation) => `<article class="automation-card"><div class="automation-card-head"><div class="automation-icon">${automation.icon}</div><button class="toggle ${automation.on ? 'on' : ''}" data-toggle="${automation.id}" aria-label="Toggle ${esc(automation.title)}"></button></div><h3>${esc(automation.title)}</h3><p>${esc(automation.description)}</p><div class="automation-meta"><span>${esc(automation.trigger)}</span><button class="run-button" data-run="${automation.id}">Run now ↗</button></div><div class="automation-meta"><span>Impact</span><strong>${esc(automation.result)}</strong></div></article>`).join('');
  const logs = state.logs.map((log) => `<div class="log-item"><div class="log-check">${log.icon}</div><span>${esc(log.text)}</span><span class="log-time">${esc(log.time)}</span></div>`).join('');
  return `${pageHeading('WORKFLOW PLAYBOOK', 'Automations', 'Small, reliable workflows that give the owner time back.', '<div class="header-actions"><button class="button button-secondary" data-action="automation-guide">? How this works</button></div>')}<section class="automation-grid">${cards}</section><article class="panel automation-log"><div class="panel-heading"><div><h2 class="panel-title">Automation activity</h2><p class="panel-subtitle">A clear audit trail of everything the system handled</p></div><span class="eyebrow">LAST 5 EVENTS</span></div>${logs}</article>`;
}

function renderReports() {
  return `${pageHeading('OWNER REPORTING', 'Reports', 'Turn the daily data into one clear decision for the owner.', '<div class="header-actions"><button class="button button-primary" data-action="export">↧ Export report</button></div>')}<section class="report-card"><div class="report-callout"><div class="eyebrow">WEEKLY OWNER DIGEST</div><h2>Studio is growing steadily.</h2><p>Revenue is up 12.4% month on month. Your biggest opportunity is converting more trial attendees: 5 students attended but have not joined yet.</p><div class="report-metrics"><div class="report-metric"><strong>RM 4,820</strong><span>Revenue this week</span></div><div class="report-metric"><strong>7 / 42</strong><span>New leads converted</span></div><div class="report-metric"><strong>4.5 hrs</strong><span>Estimated time saved</span></div></div></div><article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Recommended next actions</h2><p class="panel-subtitle">Prioritized so the owner knows what to do next</p></div></div><div class="log-item"><div class="log-check">1</div><span>Follow up with 2 trial attendees within the next 24 hours.</span><button class="link-button" data-page="leads">Open leads →</button></div><div class="log-item"><div class="log-check">2</div><span>Offer a renewal incentive to 3 members expiring next week.</span><button class="link-button" data-page="members">View members →</button></div><div class="log-item"><div class="log-check">3</div><span>Review the under-filled Private Coaching slot.</span><button class="link-button" data-page="attendance">View schedule →</button></div></article></section>`;
}

function renderSettings() {
  return `${pageHeading('WORKSPACE SETTINGS', 'Settings', 'Keep the system simple, transparent, and easy to hand over.', '<button class="button button-primary" data-action="settings-saved">Save changes</button>')}<section class="settings-card"><article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Studio profile</h2><p class="panel-subtitle">The details used in owner summaries</p></div></div><div class="settings-row"><div><strong>Studio name</strong><p>Shown on dashboards and messages</p></div><input class="filter-input" value="Studio Sol" /></div><div class="settings-row"><div><strong>Timezone</strong><p>Used for classes and scheduled automations</p></div><select class="filter-select"><option>Asia/Kuala Lumpur (GMT+8)</option></select></div><div class="settings-row"><div><strong>Owner summary delivery</strong><p>Every morning at 9:00 AM</p></div><button class="toggle on" aria-label="Toggle owner summary"></button></div></article><article class="panel"><div class="panel-heading"><div><h2 class="panel-title">Low-cost data connection</h2><p class="panel-subtitle">The recommended next step for a real deployment</p></div><span class="status-pill blue">Demo mode</span></div><div class="settings-row"><div><strong>Google Sheets</strong><p>Use one shared sheet as the source of truth for leads, members, and attendance.</p></div><span class="eyebrow">READY TO CONNECT</span></div><div class="settings-row"><div><strong>Apps Script</strong><p>Runs reminders, status updates, and daily reports without a monthly software bill.</p></div><span class="eyebrow">NEXT PHASE</span></div></article></section>`;
}

function render() {
  const pages = { dashboard: renderDashboard, leads: renderLeads, members: renderMembers, attendance: renderAttendance, automations: renderAutomations, reports: renderReports, settings: renderSettings };
  pageContainer.innerHTML = pages[currentPage]();
  bindPageEvents();
}

function openModal() { document.getElementById('leadModal').classList.add('open'); document.getElementById('leadModal').setAttribute('aria-hidden', 'false'); }
function closeModal() { document.getElementById('leadModal').classList.remove('open'); document.getElementById('leadModal').setAttribute('aria-hidden', 'true'); }
function bindPageEvents() {
  document.querySelectorAll('[data-page]').forEach((element) => element.addEventListener('click', () => goTo(element.dataset.page)));
  document.querySelectorAll('[data-open-modal]').forEach((element) => element.addEventListener('click', openModal));
  document.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', () => handleAction(element.dataset.action)));
  document.querySelectorAll('[data-toggle]').forEach((element) => element.addEventListener('click', () => toggleAutomation(element.dataset.toggle)));
  document.querySelectorAll('[data-run]').forEach((element) => element.addEventListener('click', () => runAutomation(element.dataset.run)));
  document.querySelectorAll('[data-followup]').forEach((element) => element.addEventListener('click', () => { saveLog(`Manual follow-up queued for ${element.dataset.followup}`); showToast(`Follow-up queued for ${element.dataset.followup}`); render(); }));
  document.querySelectorAll('[data-attendance]').forEach((element) => element.addEventListener('click', () => updateAttendance(Number(element.dataset.attendance), false)));
  document.querySelectorAll('[data-attendance-late]').forEach((element) => element.addEventListener('click', () => updateAttendance(Number(element.dataset.attendanceLate), true)));
  const leadFilter = document.getElementById('leadFilter');
  const statusFilter = document.getElementById('leadStatusFilter');
  if (leadFilter) { leadFilter.addEventListener('input', filterLeads); statusFilter.addEventListener('change', filterLeads); }
}
function filterLeads() {
  const query = document.getElementById('leadFilter').value.toLowerCase();
  const status = document.getElementById('leadStatusFilter').value;
  document.querySelectorAll('#leadsTable tr').forEach((row) => row.style.display = row.dataset.searchable.includes(query) && (!status || row.textContent.includes(status)) ? '' : 'none');
}
function toggleAutomation(id) {
  const automation = state.automations.find((item) => item.id === id);
  automation.on = !automation.on;
  persist();
  showToast(`${automation.title} ${automation.on ? 'enabled' : 'paused'}`);
  render();
}
function runAutomation(id) {
  const automation = state.automations.find((item) => item.id === id);
  const messages = { trial: 'Trial follow-ups sent to 2 leads', renewal: 'Renewal check completed — 3 alerts created', attendance: 'Attendance sync completed for today', summary: 'Owner daily summary generated' };
  saveLog(messages[id]);
  showToast(messages[id]);
  render();
}
function updateAttendance(index, late) {
  const item = state.attendance[index];
  if (item.present < item.booked) item.present += 1;
  if (item.present >= item.booked) item.status = 'Completed';
  saveLog(`${late ? 'Late check-in' : 'Attendance updated'} for ${item.class}`);
  showToast(`${item.class}: ${late ? 'late arrival recorded' : 'student marked present'}`);
  render();
}
function handleAction(action) {
  const messages = { 'run-followups': '2 overdue follow-ups sent via WhatsApp', export: 'Report export prepared for download', 'member-added': 'Member capture form is ready for the next phase', 'attendance-summary': 'Attendance summary sent to the owner', 'automation-guide': 'Every workflow runs from a simple trigger → action rule', 'settings-saved': 'Workspace settings saved' };
  if (action === 'run-followups') saveLog('2 overdue follow-ups sent via WhatsApp');
  showToast(messages[action] || 'Action completed');
  if (action === 'run-followups') render();
}

document.querySelectorAll('.nav-item').forEach((element) => element.addEventListener('click', () => goTo(element.dataset.page)));
document.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeModal));
document.getElementById('leadModal').addEventListener('click', (event) => { if (event.target.id === 'leadModal') closeModal(); });
document.getElementById('leadForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = form.get('name');
  state.leads.unshift({ id: `LD-${1043 + state.leads.length}`, name, initials: initials(name), phone: form.get('phone'), interest: form.get('interest'), trial: 'New booking', status: 'New lead', statusClass: 'orange', source: 'Manual entry', last: 'Just now', avatar: '' });
  saveLog(`New lead captured: ${name}`);
  event.target.reset();
  closeModal();
  showToast(`${name} added to your lead pipeline`);
  goTo('leads');
});
document.getElementById('mobileMenu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('notificationButton').addEventListener('click', () => showToast('3 items need your attention today'));
document.getElementById('globalSearch').addEventListener('keydown', (event) => { if (event.key === 'Enter') { const query = event.target.value.toLowerCase(); if (query.includes('lead') || query.includes('trial')) goTo('leads'); else if (query.includes('member') || query.includes('renew')) goTo('members'); else if (query.includes('attendance')) goTo('attendance'); else if (query.includes('automation')) goTo('automations'); else showToast('Try searching for leads, members, attendance, or automations'); } });
render();
