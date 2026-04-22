/* ===================================================================
   Mama's Journey — Pregnancy Planner
   All logic: navigation, pregnancy calc, weekly data, health logs,
   appointments, checklists, nutrition, AI chat.
   Data persisted in localStorage.
   =================================================================== */

// ── STATE ──────────────────────────────────────────────────────────
let state = {
    lmpDate:        null,
    dueDate:        null,
    momName:        '',
    partnerName:    '',
    partnerTitle:   '',
    currentWeek:    0,
    selectedWeek:   1,
    weights:        [],   // [{date, value}]
    symptoms:       [],   // [{date, items[], notes}]
    appointments:   [],   // [{id, date, time, doctor, type, notes}]
    checklists:     {},   // {listKey: {itemKey: bool}}
    activeChecklist: 'hospital',
};

let weightChart = null;

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    setupNav();
    setTodayOnInputs();
    renderNutrition();
    renderWeeklyData();
    renderAppointments();
    renderSymptomHistory();
    renderWeightHistory();
    showChecklist('hospital', document.querySelector('.tab-btn'));
    initChat();

    if (state.dueDate) {
        showDashboard();
    }
});

// ── NAVIGATION ─────────────────────────────────────────────────────
function setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.dataset.section;
            showSection(id);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            // close mobile menu
            document.getElementById('navLinks').classList.remove('open');
        });
    });
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    // sync nav highlight
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.section === id);
    });
}

function toggleNav() {
    document.getElementById('navLinks').classList.toggle('open');
}

function setTodayOnInputs() {
    const today = new Date().toISOString().split('T')[0];
    ['symptomDate','weightDate','apptDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });
}

// ── STORAGE ────────────────────────────────────────────────────────
function saveToStorage() {
    localStorage.setItem('mpState', JSON.stringify({
        lmpDate:      state.lmpDate  ? state.lmpDate.toISOString()  : null,
        dueDate:      state.dueDate  ? state.dueDate.toISOString()  : null,
        momName:      state.momName,
        partnerName:  state.partnerName,
        partnerTitle: state.partnerTitle,
        weights:      state.weights,
        symptoms:     state.symptoms,
        appointments: state.appointments,
        checklists:   state.checklists,
    }));
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem('mpState');
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.lmpDate) state.lmpDate = new Date(saved.lmpDate);
        if (saved.dueDate) state.dueDate = new Date(saved.dueDate);
        state.momName      = saved.momName      || '';
        state.partnerName  = saved.partnerName  || '';
        state.partnerTitle = saved.partnerTitle || '';
        state.weights      = saved.weights      || [];
        state.symptoms     = saved.symptoms     || [];
        state.appointments = saved.appointments || [];
        state.checklists   = saved.checklists   || {};
    } catch(e) { /* ignore */ }
}

// ── PREGNANCY SETUP ────────────────────────────────────────────────
// ── PARTNER TOGGLE ─────────────────────────────────────────────────
function togglePartnerFields() {
    const checked = document.getElementById('partnerToggle').checked;
    document.getElementById('partnerFields').style.display = checked ? 'block' : 'none';
}

function setupPregnancy() {
    const lmpVal       = document.getElementById('lmpDate').value;
    const dueVal       = document.getElementById('dueDateInput').value;
    const name         = document.getElementById('momName').value.trim();
    const hasPartner   = document.getElementById('partnerToggle').checked;
    const partnerName  = hasPartner ? document.getElementById('partnerName').value.trim()  : '';
    const partnerTitle = hasPartner ? document.getElementById('partnerTitle').value         : '';

    if (!lmpVal && !dueVal) {
        alert('Please enter your LMP date or due date.');
        return;
    }

    state.momName      = name;
    state.partnerName  = partnerName;
    state.partnerTitle = partnerTitle;

    if (lmpVal) {
        state.lmpDate = new Date(lmpVal + 'T12:00:00');
        state.dueDate = new Date(state.lmpDate);
        state.dueDate.setDate(state.dueDate.getDate() + 280);
    } else {
        state.dueDate = new Date(dueVal + 'T12:00:00');
        state.lmpDate = new Date(state.dueDate);
        state.lmpDate.setDate(state.lmpDate.getDate() - 280);
    }

    saveToStorage();
    showDashboard();
}

function resetSetup() {
    state.lmpDate = null;
    state.dueDate = null;
    saveToStorage();
    document.getElementById('setupCard').style.display     = 'block';
    document.getElementById('dashboardGrid').style.display = 'none';
    document.getElementById('resetArea').style.display     = 'none';
}

function getCurrentWeek() {
    if (!state.lmpDate) return 1;
    const ms   = Date.now() - state.lmpDate.getTime();
    const days = Math.floor(ms / 86400000);
    return Math.max(1, Math.min(40, Math.floor(days / 7) + 1));
}

function showDashboard() {
    if (!state.dueDate) return;

    const week      = getCurrentWeek();
    state.currentWeek   = week;
    state.selectedWeek  = week;

    const today    = new Date();
    const daysLeft = Math.ceil((state.dueDate - today) / 86400000);
    const tri      = week <= 13 ? '1st' : week <= 26 ? '2nd' : '3rd';
    const pct      = Math.round(Math.min(100, (week / 40) * 100));

    setText('weekNum',        Math.min(week, 40));
    setText('trimesterNum',   tri);
    setText('daysLeft',       Math.max(0, daysLeft));
    setText('dueDateDisplay', fmtDate(state.dueDate));
    document.getElementById('progressBar').style.width = pct + '%';
    setText('progressPercent', pct + '% complete');

    const data = weeklyData[Math.min(40, Math.max(1, week))];
    if (data) {
        setText('dashFruit',       data.fruit);
        setText('dashFruitName',   data.fruitName);
        setText('dashDevelopment', data.baby);
    }

    // Couple banner
    const momLabel     = state.momName  ? state.momName  : 'mama';
    const partnerLabel = state.partnerName ? ` & ${state.partnerName}` : '';
    setText('coupleNames', `${momLabel}${partnerLabel}'s journey 💕`);
    setText('dueDateLabel', `due ${fmtDate(state.dueDate)}`);

    // Partner bento card
    const partnerCard = document.getElementById('partnerCard');
    if (state.partnerName) {
        partnerCard.style.display = 'flex';
        setText('partnerDisplayName',  state.partnerName);
        setText('partnerDisplayTitle', state.partnerTitle || 'Partner');
    } else {
        partnerCard.style.display = 'none';
    }

    document.getElementById('setupCard').style.display     = 'none';
    document.getElementById('dashboardGrid').style.display = 'grid';
    document.getElementById('resetArea').style.display     = 'block';

    renderWeeklyData();
}

// ── WEEKLY TRACKER ─────────────────────────────────────────────────
function changeWeek(delta) {
    state.selectedWeek = Math.max(1, Math.min(40, state.selectedWeek + delta));
    renderWeeklyData();
}

function jumpToWeek(w) {
    state.selectedWeek = Math.max(1, Math.min(40, w));
    renderWeeklyData();
}

function jumpToCurrentWeek() {
    state.selectedWeek = state.currentWeek || getCurrentWeek();
    renderWeeklyData();
}

function renderWeeklyData() {
    const w    = state.selectedWeek;
    const data = weeklyData[w];
    if (!data) return;

    setText('selectedWeek',    w);
    setText('weekTitle',       `Week ${w}`);
    setText('fruitEmoji',      data.fruit);
    setText('fruitName',       data.fruitName);
    setText('weekMeasurements', data.measurements ? `📏 ${data.measurements}` : '');
    setText('babyDevelopment', data.baby);
    setText('momSymptoms',     data.mom);
    setText('weekTip',         data.tip);

    // Update trimester chip in sidebar
    const tri = w <= 13 ? '1st Trimester' : w <= 26 ? '2nd Trimester' : '3rd Trimester';
    setText('trimChip', tri);

    // Build week jump grid (1–40)
    const grid = document.getElementById('weekJumpGrid');
    if (grid && !grid.dataset.built) {
        let html = '';
        for (let i = 1; i <= 40; i++) {
            html += `<button class="wj-btn${i === w ? ' active' : ''}" onclick="jumpToWeek(${i})">${i}</button>`;
        }
        grid.innerHTML = html;
        grid.dataset.built = 'yes';
    } else if (grid) {
        grid.querySelectorAll('.wj-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx + 1 === w);
        });
    }
}

// ── HEALTH — SYMPTOMS ──────────────────────────────────────────────
function logSymptoms() {
    const date  = document.getElementById('symptomDate').value;
    const notes = document.getElementById('symptomNotes').value.trim();
    const boxes = document.querySelectorAll('.sym input[type=checkbox]');
    const items = [];
    boxes.forEach(b => { if (b.checked) items.push(b.value); });

    if (!date) { alert('Pick a date.'); return; }
    if (items.length === 0 && !notes) { alert('Select at least one symptom or add a note.'); return; }

    state.symptoms.unshift({ date, items, notes });
    saveToStorage();
    boxes.forEach(b => b.checked = false);
    document.getElementById('symptomNotes').value = '';
    renderSymptomHistory();
}

function renderSymptomHistory() {
    const el = document.getElementById('symptomHistory');
    if (!state.symptoms.length) {
        el.innerHTML = '<div class="empty-state"><div class="icon">📋</div>No logs yet</div>';
        return;
    }
    el.innerHTML = state.symptoms.slice(0, 10).map((s, i) => `
        <div class="sym-entry">
            <div>
                <strong>${s.date}</strong>
                <div style="font-size:.8rem;color:var(--text-light)">${s.items.join(', ') || '—'}${s.notes ? ' · ' + s.notes : ''}</div>
            </div>
            <button class="delete-btn" onclick="deleteSymptom(${i})">✕</button>
        </div>
    `).join('');
}

function deleteSymptom(i) {
    state.symptoms.splice(i, 1);
    saveToStorage();
    renderSymptomHistory();
}

// ── HEALTH — WEIGHT ────────────────────────────────────────────────
function logWeight() {
    const date  = document.getElementById('weightDate').value;
    const value = parseFloat(document.getElementById('weightValue').value);
    if (!date || isNaN(value) || value < 50 || value > 400) {
        alert('Enter a valid date and weight (50–400 lbs).');
        return;
    }
    state.weights.push({ date, value });
    state.weights.sort((a, b) => a.date.localeCompare(b.date));
    saveToStorage();
    document.getElementById('weightValue').value = '';
    renderWeightHistory();
    renderWeightChart();
}

function renderWeightHistory() {
    const el = document.getElementById('weightHistory');
    if (!state.weights.length) {
        el.innerHTML = '<div class="empty-state"><div class="icon">⚖️</div>No weight logs yet</div>';
        return;
    }
    el.innerHTML = [...state.weights].reverse().slice(0, 8).map((w, i) => `
        <div class="weight-entry">
            <span>${w.date} — <strong>${w.value} lbs</strong></span>
            <button class="delete-btn" onclick="deleteWeight(${state.weights.length - 1 - i})">✕</button>
        </div>
    `).join('');
    renderWeightChart();
}

function deleteWeight(i) {
    state.weights.splice(i, 1);
    saveToStorage();
    renderWeightHistory();
}

function renderWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;

    if (weightChart) { weightChart.destroy(); weightChart = null; }

    if (state.weights.length < 2) {
        canvas.parentElement.style.display = 'none';
        return;
    }
    canvas.parentElement.style.display = 'block';

    weightChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: state.weights.map(w => w.date),
            datasets: [{
                label: 'Weight (lbs)',
                data: state.weights.map(w => w.value),
                borderColor: '#E8A0BF',
                backgroundColor: 'rgba(232,160,191,.15)',
                borderWidth: 2,
                pointBackgroundColor: '#BA90C6',
                tension: .35,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { font: { size: 11 } }, grid: { color: '#F0D6E8' } },
                x: { ticks: { font: { size: 10 }, maxTicksLimit: 6 }, grid: { display: false } },
            }
        }
    });
}

// ── APPOINTMENTS ───────────────────────────────────────────────────
function addAppointment() {
    const date   = document.getElementById('apptDate').value;
    const time   = document.getElementById('apptTime').value;
    const doctor = document.getElementById('apptDoctor').value.trim();
    const type   = document.getElementById('apptType').value;
    const notes  = document.getElementById('apptNotes').value.trim();

    if (!date) { alert('Please set an appointment date.'); return; }

    state.appointments.push({
        id: Date.now(),
        date, time, doctor, type, notes,
    });
    state.appointments.sort((a, b) => a.date.localeCompare(b.date));
    saveToStorage();
    ['apptDate','apptTime','apptDoctor','apptNotes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('apptType').value = '';
    setTodayOnInputs();
    renderAppointments();
}

function deleteAppointment(id) {
    state.appointments = state.appointments.filter(a => a.id !== id);
    saveToStorage();
    renderAppointments();
}

function renderAppointments() {
    const el    = document.getElementById('appointmentsList');
    const today = new Date().toISOString().split('T')[0];

    if (!state.appointments.length) {
        el.innerHTML = '<div class="card empty-state"><div class="icon">📆</div>No appointments yet — add one above!</div>';
        return;
    }

    const upcoming = state.appointments.filter(a => a.date >= today);
    const past     = state.appointments.filter(a => a.date <  today);

    const renderGroup = (list, isPast) => list.map(a => `
        <div class="appt-card${isPast ? ' past' : ''}">
            <div class="appt-meta">
                <div><strong>${a.type || 'Appointment'}</strong> ${a.doctor ? '· ' + a.doctor : ''}</div>
                <div class="appt-when">📅 ${fmtDate(new Date(a.date + 'T12:00:00'))}${a.time ? ' at ' + fmtTime(a.time) : ''}</div>
                ${a.notes ? `<div class="appt-notes">📝 ${a.notes}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem">
                <span class="appt-type-badge">${isPast ? '✓ Past' : '⏳ Upcoming'}</span>
                <button class="delete-btn" onclick="deleteAppointment(${a.id})">✕ Delete</button>
            </div>
        </div>
    `).join('');

    el.innerHTML =
        (upcoming.length ? `<h3 style="margin:1rem 0 .5rem;color:var(--purple-dark)">Upcoming (${upcoming.length})</h3>` + renderGroup(upcoming, false) : '') +
        (past.length     ? `<h3 style="margin:1rem 0 .5rem;color:var(--text-light)">Past (${past.length})</h3>` + renderGroup(past, true) : '');
}

// ── CHECKLISTS ─────────────────────────────────────────────────────
const checklistData = {
    hospital: {
        title: '🏥 Hospital Bag',
        groups: {
            'For Mom': [
                'Insurance card & ID', 'Birth plan copies (3+)', 'Comfortable robe or nightgown',
                'Nursing bra & breast pads', 'Comfortable underwear (5+ pairs)', 'Socks & slippers',
                'Toiletries (shampoo, toothbrush, etc.)', 'Hair ties / headband',
                'Lip balm', 'Phone charger + portable battery',
                'Snacks for labor', 'Pillow from home', 'Change of clothes for going home',
                'Entertainment (tablet, books, playlist)',
            ],
            'For Baby': [
                '2–3 onesies (newborn & 0–3 mo)', 'Going-home outfit', 'Sleepers / footed PJs (2)',
                'Newborn diapers & wipes', 'Muslin swaddle blanket (2)',
                'Infant car seat (installed!)', 'Baby hat & mittens', 'Pacifier (optional)',
            ],
            'For Partner / Support Person': [
                'Change of clothes (2 days)', 'Snacks & drinks', 'Phone charger',
                'Camera', 'Pillow', 'Cash & cards',
            ],
            'Documents': [
                'Insurance card', 'Hospital pre-registration', 'Photo ID',
                'Pediatrician info', 'Birth plan', 'Baby name list',
            ],
        }
    },
    nursery: {
        title: '🍼 Nursery Setup',
        groups: {
            'Sleep': [
                'Crib or bassinet', 'Firm, flat mattress', '2–3 fitted crib sheets',
                'Baby monitor', 'White noise machine', 'Blackout curtains',
                'Swaddle blankets (5+)', 'Sleep sacks (2+)',
            ],
            'Feeding': [
                'Nursing pillow', 'Breast pump + accessories', 'Nursing pads (washable & disposable)',
                '6–8 baby bottles', 'Bottle brush', 'Formula (if not breastfeeding)',
                'Burp cloths (10+)', 'Bib set', 'High chair (for 6 months+)',
            ],
            'Diapering': [
                'Changing table or mat', 'Diapers — newborn (1 pack) & size 1 (3 packs)',
                'Baby wipes (unscented)', 'Diaper rash cream', 'Diaper pail',
            ],
            'Bath & Health': [
                'Baby bathtub', 'Baby washcloths (6)', 'Gentle baby wash & shampoo',
                'Baby nail clippers or file', 'Digital thermometer', 'Nasal aspirator',
                'Baby lotion (fragrance-free)', 'First aid kit',
            ],
            'Clothing': [
                'Onesies: newborn (5), 0–3 mo (8)', 'Sleepers/footed PJs (5)',
                'Baby socks (8 pairs)', 'Hats (3)', 'Mittens (2 pairs)',
                'Seasonal outerwear', 'Laundry detergent (fragrance-free)',
            ],
        }
    },
    birthplan: {
        title: '📋 Birth Plan Checklist',
        groups: {
            'Labor Preferences': [
                'Preferred birth environment noted (lighting, music, etc.)',
                'Pain management preference decided (epidural / natural / nitrous)',
                'Laboring positions discussed with provider',
                'Freedom to move during labor requested',
                'IV vs. hep-lock preference noted',
                'Who will be in the room decided',
                'Birth photographer / videographer arranged',
            ],
            'During Delivery': [
                'Pushing preferences discussed (coached vs. spontaneous)',
                'Episiotomy preference noted (avoid if possible)',
                'Mirror to watch delivery — yes/no decided',
                'Partner cutting cord — yes/no decided',
                'Cord blood banking decided',
                'Delayed cord clamping requested',
                'Skin-to-skin immediately after birth requested',
            ],
            'After Delivery': [
                'Placenta preferences noted', 'Golden hour (uninterrupted skin-to-skin) requested',
                'Breastfeeding support requested from nurses',
                'Vitamin K shot — yes/no decided',
                'Eye ointment — yes/no decided',
                'Hepatitis B vaccine decision made',
                'Circumcision decision made (if applicable)',
                'Rooming-in preference noted',
            ],
            'In Case of C-Section': [
                'Clear drape requested if possible',
                'Skin-to-skin in OR requested',
                'Partner present in OR requested',
                'Music preference for OR noted',
            ],
        }
    },
    firstmonth: {
        title: '🧸 First Month Prep',
        groups: {
            'Before Baby Arrives': [
                'Pediatrician selected & first appointment scheduled',
                'Freezer meals prepped (10+ meals)', 'House deep-cleaned',
                'Laundry done — all baby items washed',
                'Car seat installed & inspected',
                'Older children / pets prepared',
                'Support network organized (meal train, help schedule)',
                'Postpartum care items purchased',
            ],
            'Postpartum Recovery Items': [
                'Peri bottle', 'Witch hazel pads (Tucks)', 'Stool softeners (ask OB)',
                'Maxi pads (heavy)', 'Comfortable high-waist underwear',
                'Nipple cream (lanolin)', 'Nursing pads',
                'Postpartum belly wrap (optional)',
            ],
            'Admin': [
                'Parental leave paperwork submitted', 'Insurance updated to add baby',
                'Birth certificate application ready', 'Social Security card application ready',
                'Beneficiaries updated', 'Will / guardianship paperwork started',
                'Childcare / daycare waitlist joined (if needed)',
            ],
        }
    },
};

let activeChecklistKey = 'hospital';

function showChecklist(key, btn) {
    activeChecklistKey = key;
    if (btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderChecklistContent();
}

function renderChecklistContent() {
    const key  = activeChecklistKey;
    const data = checklistData[key];
    const el   = document.getElementById('checklistContent');
    const title = document.getElementById('checklistTitle');
    if (!data) return;

    title.textContent = data.title;

    if (!state.checklists[key]) state.checklists[key] = {};

    const allItems  = Object.values(data.groups).flat();
    const doneCount = allItems.filter(item => state.checklists[key][item]).length;
    const total     = allItems.length;
    const pct       = total ? Math.round((doneCount / total) * 100) : 0;

    // Update sidebar progress card
    setText('clProgressPct',   pct + '%');
    setText('clProgressCount', `${doneCount} of ${total} items`);
    const clBar = document.getElementById('clProgressBar');
    if (clBar) clBar.style.width = pct + '%';

    let html = `
        <div class="checklist-progress">
            <span>${doneCount}/${total} packed</span>
            <div class="mini-bar"><div class="mini-fill" style="width:${pct}%"></div></div>
            <span>${pct}%</span>
        </div>
    `;

    for (const [group, items] of Object.entries(data.groups)) {
        html += `<div class="checklist-group"><div class="checklist-group-title">${group}</div>`;
        items.forEach(item => {
            const checked = state.checklists[key][item] || false;
            const safeId  = CSS.escape(item);
            html += `
                <label class="check-item${checked ? ' checked' : ''}">
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleCheckItem('${key}', \`${item.replace(/`/g,"'")}\`, this.checked)">
                    ${item}
                </label>
            `;
        });
        html += '</div>';
    }

    el.innerHTML = html;
}

function toggleCheckItem(key, item, checked) {
    if (!state.checklists[key]) state.checklists[key] = {};
    state.checklists[key][item] = checked;
    saveToStorage();
    renderChecklistContent();
}

function resetChecklist() {
    if (!confirm('Reset all items in this checklist?')) return;
    state.checklists[activeChecklistKey] = {};
    saveToStorage();
    renderChecklistContent();
}

// ── NUTRITION ──────────────────────────────────────────────────────
const nutritionData = {
    safe: [
        { icon: '🥦', name: 'Leafy greens & vegetables', note: 'Spinach, kale, broccoli — rich in folate and iron' },
        { icon: '🍗', name: 'Lean cooked meats', note: 'Chicken, turkey — great protein source; always cook thoroughly' },
        { icon: '🐟', name: 'Low-mercury fish', note: 'Salmon, sardines, trout — excellent omega-3s; up to 2–3 servings/week' },
        { icon: '🥚', name: 'Fully cooked eggs', note: 'Excellent choline for baby\'s brain; no runny yolks' },
        { icon: '🫘', name: 'Legumes', note: 'Lentils, chickpeas, beans — folate, protein, fiber' },
        { icon: '🥛', name: 'Pasteurized dairy', note: 'Milk, yogurt, cheese — calcium and probiotics' },
        { icon: '🍠', name: 'Sweet potatoes', note: 'High in beta-carotene (vitamin A precursor)' },
        { icon: '🥑', name: 'Avocado', note: 'Healthy fats, folate, potassium — great for brain development' },
        { icon: '🍓', name: 'Berries', note: 'Antioxidants, vitamin C, fiber — great low-sugar fruit' },
        { icon: '🌾', name: 'Whole grains', note: 'Oats, quinoa, brown rice — sustained energy and fiber' },
        { icon: '🥜', name: 'Nuts & seeds', note: 'Walnuts (omega-3), almonds (E), chia seeds (calcium)' },
        { icon: '💊', name: 'Prenatal vitamin', note: 'Folic acid (400–800 mcg), iron, DHA — take daily' },
        { icon: '💧', name: 'Water', note: '8–10 glasses/day — hydration supports all functions' },
        { icon: '🧀', name: 'Hard/pasteurized cheeses', note: 'Cheddar, Swiss, mozzarella — safe; great calcium source' },
        { icon: '🫐', name: 'Dried fruits', note: 'Dates, apricots — iron and energy; watch portion sizes' },
        { icon: '🌽', name: 'Fortified cereals', note: 'Added iron and folate — great for first trimester' },
    ],
    avoid: [
        { icon: '🍣', name: 'Raw / undercooked fish & sushi', note: 'Risk of listeria, salmonella, and parasites' },
        { icon: '🥩', name: 'Undercooked meat / deli meat (cold)', note: 'Risk of listeria — heat deli meat until steaming hot' },
        { icon: '🐟', name: 'High-mercury fish', note: 'Shark, swordfish, king mackerel, tilefish, bigeye tuna' },
        { icon: '🧀', name: 'Soft unpasteurized cheeses', note: 'Brie, camembert, queso fresco, feta (unless pasteurized)' },
        { icon: '🥛', name: 'Unpasteurized milk / juices', note: 'Risk of listeria and E. coli' },
        { icon: '🥚', name: 'Raw eggs', note: 'Cookie dough, hollandaise, homemade mayo — salmonella risk' },
        { icon: '🍷', name: 'Alcohol', note: 'No safe amount during pregnancy — causes fetal alcohol spectrum disorders' },
        { icon: '☕', name: 'Excess caffeine', note: 'Limit to <200 mg/day (≈1 small coffee); energy drinks — avoid' },
        { icon: '🌱', name: 'Raw sprouts', note: 'Alfalfa, clover, radish, mung bean — bacteria risk' },
        { icon: '🫙', name: 'Unpasteurized honey', note: 'Risk of botulism spores (less risk for mom, but avoid)' },
        { icon: '🍖', name: 'Pâté & meat spreads', note: 'Listeria risk; canned versions are ok' },
        { icon: '🐡', name: 'Smoked seafood (refrigerated)', note: 'Lox, nova-style, kippered — listeria risk; canned ok' },
        { icon: '🍦', name: 'Soft-serve ice cream', note: 'Machine contamination risk; opt for packaged instead' },
        { icon: '🌿', name: 'Herbal supplements', note: 'Many untested in pregnancy — check with your OB first' },
        { icon: '🥗', name: 'Pre-made salads (store)', note: 'Chicken / seafood salads from deli — listeria risk' },
        { icon: '🍟', name: 'Excessive processed/junk food', note: 'High sodium, saturated fat — ok occasionally, not daily' },
    ]
};

function renderNutrition() {
    const renderList = (items, id) => {
        document.getElementById(id).innerHTML = items.map(f => `
            <div class="food-item" data-name="${f.name.toLowerCase()} ${f.note.toLowerCase()}">
                <span class="food-icon">${f.icon}</span>
                <div>
                    <div class="food-name">${f.name}</div>
                    <div class="food-why">${f.note}</div>
                </div>
            </div>
        `).join('');
    };
    renderList(nutritionData.safe,  'safeList');
    renderList(nutritionData.avoid, 'avoidList');

    // Update food counts
    setText('safeCount',  nutritionData.safe.length  + ' foods');
    setText('avoidCount', nutritionData.avoid.length + ' items');
}

function filterNutrition() {
    const q = document.getElementById('nutritionSearch').value.toLowerCase().trim();
    document.querySelectorAll('.food-item').forEach(item => {
        item.classList.toggle('hidden', q && !item.dataset.name.includes(q));
    });
}

// ── AI CHAT ────────────────────────────────────────────────────────
function initChat() {
    const key = localStorage.getItem('mp_api_key');
    if (key) {
        showChatUI(key);
    }
}

function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key.startsWith('sk-ant-')) {
        alert('Please enter a valid Anthropic API key (starts with sk-ant-).');
        return;
    }
    localStorage.setItem('mp_api_key', key);
    showChatUI(key);
}

function skipApiSetup() {
    document.getElementById('apiSetup').style.display  = 'none';
    document.getElementById('chatWrapper').style.display = 'block';
    document.getElementById('apiKeyBar').style.display  = 'none';
    document.getElementById('apiKeyStatus').textContent = '⚪ No AI key — responses disabled';
}

function showChatUI(key) {
    document.getElementById('apiSetup').style.display    = 'none';
    document.getElementById('chatWrapper').style.display = 'block';
    document.getElementById('apiKeyStatus').textContent  = '🟢 AI connected';
}

function clearApiKey() {
    localStorage.removeItem('mp_api_key');
    document.getElementById('apiSetup').style.display    = 'block';
    document.getElementById('chatWrapper').style.display = 'none';
    document.getElementById('apiKeyInput').value = '';
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const msg   = input.value.trim();
    if (!msg) return;

    const key = localStorage.getItem('mp_api_key');

    appendMsg(msg, 'user');
    input.value = '';

    const typingEl = appendTyping();

    // Build context from user's pregnancy
    let context = '';
    if (state.dueDate) {
        const w = getCurrentWeek();
        context = `The user is ${w} weeks pregnant with a due date of ${fmtDate(state.dueDate)}.`;
    }

    // Build message history from DOM (last 10)
    const bubbles  = document.querySelectorAll('.msg-bubble');
    const messages = [];
    bubbles.forEach(b => {
        const isUser = b.closest('.user-msg');
        const text   = b.textContent.trim();
        if (text && !text.startsWith('●')) {
            messages.push({ role: isUser ? 'user' : 'assistant', content: text });
        }
    });
    // Last message is the one we just added; already appended

    try {
        let reply;
        if (key) {
            reply = await callAnthropicDirect(key, messages, context);
        } else {
            reply = await callLocalProxy(messages, context);
        }
        typingEl.remove();
        appendMsg(reply, 'bot');
    } catch(err) {
        typingEl.remove();
        appendMsg('Sorry, I couldn\'t connect. Check your API key or run the local Flask server (python main.py). Error: ' + err.message, 'bot');
    }
}

async function callAnthropicDirect(apiKey, messages, context) {
    // Keep last 20 messages to avoid token limits
    const history = messages.slice(-20);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: `You are a warm, knowledgeable pregnancy assistant. Provide helpful, accurate information about pregnancy, symptoms, nutrition, baby development, and what to expect. Always remind users to consult their healthcare provider for medical decisions. Be supportive and encouraging. ${context}`,
            messages: history,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text;
}

async function callLocalProxy(messages, context) {
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.slice(-20), context }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.content;
}

function handleChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
}

function appendMsg(text, type) {
    const el = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `msg ${type === 'user' ? 'user-msg' : 'bot-msg'}`;
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
}

function appendTyping() {
    const el  = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg bot-msg typing';
    div.innerHTML = '<div class="msg-bubble"></div>';
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
}

// ── HELPERS ────────────────────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function fmtDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm   = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── WEEKLY DATA (all 40 weeks) ─────────────────────────────────────
const weeklyData = {
    1:  { fruit:'🌱', fruitName:'Poppy seed',        measurements:'< 1 mm',      baby:'Fertilization is occurring. The fertilized egg is dividing rapidly as it travels toward the uterus.',                                                                                    mom:'You may not know you\'re pregnant yet. Your body is preparing for implantation — hormones are already shifting.',                                                   tip:'If you\'re planning a pregnancy, start prenatal vitamins with 400–800 mcg folic acid immediately.' },
    2:  { fruit:'🌱', fruitName:'Poppy seed',        measurements:'< 1 mm',      baby:'The blastocyst is implanting into the uterine wall. Cells are differentiating into those that will become the baby vs. the placenta.',                                                   mom:'Implantation can cause light spotting. Your body is ramping up hCG hormone production — the pregnancy hormone.',                                                   tip:'Avoid alcohol, smoking, and unnecessary medications. Now is the most critical time for fetal development.' },
    3:  { fruit:'🫘', fruitName:'Sesame seed',       measurements:'1–2 mm',      baby:'Three foundational layers form (ectoderm, mesoderm, endoderm) — these will become every organ, tissue, and structure in your baby\'s body.',                                             mom:'Breasts may feel tender. Fatigue can start. You likely won\'t have a positive test quite yet.',                                                                     tip:'Schedule your first prenatal appointment for around 8–10 weeks.' },
    4:  { fruit:'🌰', fruitName:'Poppy seed',        measurements:'2 mm',        baby:'The neural tube is forming — the precursor to the brain and spinal cord. The heart has begun forming too.',                                                                              mom:'Missed period! A home pregnancy test will likely show positive. Nausea, fatigue, and breast tenderness may begin.',                                                 tip:'Take a home pregnancy test. Avoid ibuprofen and aspirin — use acetaminophen (Tylenol) only if needed.' },
    5:  { fruit:'🫘', fruitName:'Sesame seed',       measurements:'2–3 mm',      baby:'The heart begins beating! Major organs including kidneys, liver, and lungs start forming. The neural tube is closing.',                                                                  mom:'Morning sickness may intensify. Fatigue, frequent urination, and food aversions are very common now.',                                                              tip:'Eat small, frequent meals every 2–3 hours to combat nausea. Ginger tea and crackers can help.' },
    6:  { fruit:'🫘', fruitName:'Lentil',            measurements:'4–6 mm',      baby:'Arm and leg buds appear. Facial features begin — eyes, nostrils, and ear canals forming. The brain is developing at an astonishing rate.',                                              mom:'Morning sickness peaks for many women. Mood swings from hormonal changes are completely normal.',                                                                   tip:'Stay hydrated even if nauseous. Sip water throughout the day rather than large amounts at once. Electrolytes help.' },
    7:  { fruit:'🫐', fruitName:'Blueberry',         measurements:'8–10 mm',     baby:'Hands and feet are forming paddle-shapes. All major organs are present in basic form. Baby has a face with dark spots where eyes will be.',                                             mom:'Nausea and vomiting may be at their worst this week. Your uterus has doubled in size.',                                                                             tip:'Vitamin B6 (10–25 mg, 3x/day) is proven to help morning sickness. Ask your doctor before starting.' },
    8:  { fruit:'🫘', fruitName:'Kidney bean',       measurements:'1.6 cm',      baby:'Fingers and toes are forming! Baby has distinct facial features. Eyelids form but remain fused shut. The tail disappears.',                                                              mom:'Your pants may feel tighter from bloating. Heightened sense of smell can make nausea worse.',                                                                       tip:'Great time for your first ultrasound to confirm pregnancy, check location, and hear the heartbeat.' },
    9:  { fruit:'🍇', fruitName:'Grape',             measurements:'2.3 cm',      baby:'Baby is now officially called a fetus. Tiny muscles forming. Baby can make small, jerky movements — though you won\'t feel them yet.',                                                  mom:'Frequent urination continues. Heartburn may start. Mood swings are very normal — be kind to yourself.',                                                             tip:'Start Kegel exercises to strengthen pelvic floor muscles. These help during delivery and postpartum recovery.' },
    10: { fruit:'🍊', fruitName:'Kumquat',           measurements:'3.1 cm',      baby:'All vital organs are formed. Baby can bend tiny limbs. Fingernails and hair follicles are forming. Tooth buds appear under the gums.',                                                  mom:'Morning sickness may start to ease for some. Energy levels might begin improving slightly.',                                                                        tip:'Discuss genetic testing options with your doctor — NIPT, quad screen, or nuchal translucency ultrasound.' },
    11: { fruit:'🍇', fruitName:'Fig',               measurements:'4.1 cm',      baby:'Baby is almost fully formed! Genitals are developing. Baby can yawn, stretch, and hiccup. Irises of eyes are forming.',                                                                mom:'Your uterus is growing out of the pelvis. You\'ll need maternity clothes soon — especially for pants.',                                                              tip:'Book your first trimester screening (nuchal translucency + blood work) — it needs to happen by week 13.' },
    12: { fruit:'🍋', fruitName:'Lime',              measurements:'5.4 cm',      baby:'Baby\'s reflexes are developing. Digestive system is practicing contractions. Bone marrow is making white blood cells.',                                                                mom:'Risk of miscarriage drops significantly — many couples share their news! Nausea often starts to ease.',                                                             tip:'Now is a popular time to announce your pregnancy. Consider telling your employer to plan for maternity leave.' },
    13: { fruit:'🍋', fruitName:'Lemon',             measurements:'7.4 cm',      baby:'Baby can suck their thumb! Fingerprints are forming. Intestines have moved from the umbilical cord into the abdomen. Vocal cords forming.',                                              mom:'Welcome to the 2nd trimester! Energy often returns. Round ligament pain (sharp twinges) may begin.',                                                                tip:'Start thinking about childbirth classes, hospital tours, and your birth plan. Don\'t leave it too late!' },
    14: { fruit:'🍑', fruitName:'Peach',             measurements:'8.7 cm',      baby:'Baby is growing fine hair called lanugo. Liver makes bile; spleen makes red blood cells. Baby is making facial expressions.',                                                           mom:'The "honeymoon phase" — more energy, less nausea for most moms. Baby bump may start showing.',                                                                     tip:'Safe pregnancy exercises: swimming, walking, prenatal yoga, and stationary cycling. Aim for 150 min/week.' },
    15: { fruit:'🍎', fruitName:'Apple',             measurements:'10.1 cm',     baby:'Baby can sense light even with eyes fused shut. Taste buds are forming. Bones are hardening from cartilage to bone.',                                                                   mom:'Nosebleeds and bleeding gums are common due to increased blood flow — totally normal. Stay hydrated.',                                                              tip:'Aim for 8–10 glasses of water daily. Good hydration helps prevent preterm contractions and UTIs.' },
    16: { fruit:'🥑', fruitName:'Avocado',           measurements:'11.6 cm',     baby:'Baby is pumping 25 quarts of blood per day. Sleep and wake patterns are developing. Baby\'s muscles are getting stronger.',                                                             mom:'You may feel the first flutters of baby movement called quickening — like bubbles or butterflies!',                                                                 tip:'Sleep on your left side — it optimizes blood flow to baby and your kidneys. A pregnancy pillow helps enormously.' },
    17: { fruit:'🍐', fruitName:'Pear',              measurements:'13 cm',       baby:'Baby can hear! Cartilage is turning to bone. Brown fat is forming to help regulate temperature after birth.',                                                                           mom:'Back pain becomes more common as your center of gravity shifts. Your heart works 40–50% harder now!',                                                               tip:'Wear supportive, low-heeled shoes. High heels worsen back pain and affect your balance.' },
    18: { fruit:'🫑', fruitName:'Bell pepper',       measurements:'14.2 cm',     baby:'Baby is very active — stretching, rolling, kicking. Ears are fully formed and functional. Baby hears your heartbeat and voice!',                                                        mom:'Time for your mid-pregnancy anatomy scan (18–20 wk). You may learn the gender if you choose!',                                                                     tip:'Talk, read, and sing to your baby — they recognize your voice and this bonding begins now.' },
    19: { fruit:'🍅', fruitName:'Tomato',            measurements:'15.3 cm',     baby:'Vernix caseosa (waxy protective coating) forms on baby\'s skin. Sensory development is progressing rapidly — touch, taste, smell.',                                                     mom:'Round ligament pain is common. Your belly button may start to push outward. Back pain peaks for many.',                                                             tip:'If you plan to breastfeed, now is a good time to start researching. Consider a lactation consultant.' },
    20: { fruit:'🍌', fruitName:'Banana',            measurements:'25.6 cm (head to toe)', baby:'Halfway! Baby is swallowing amniotic fluid and practicing feeding. Nails have grown to fingertips. Baby has a sleep/wake cycle.',                                              mom:'Your uterus reaches your belly button — you\'ve hit the halfway point! Heartburn and indigestion are common.',                                                      tip:'Choose your pediatrician now — popular ones fill up fast. Look for someone accepting new patients.' },
    21: { fruit:'🥕', fruitName:'Carrot',            measurements:'26.7 cm',     baby:'Baby is more active than ever. Eyebrows and lids fully present. Baby can taste what you eat through the amniotic fluid!',                                                              mom:'Stretch marks may appear on belly, breasts, or hips. Skin can feel itchy as it stretches.',                                                                        tip:'Moisturize your bump daily with shea butter or coconut oil — it won\'t prevent marks but soothes itching.' },
    22: { fruit:'🥒', fruitName:'Spaghetti squash',  measurements:'27.8 cm',     baby:'Baby looks like a miniature newborn. Eyes are fully formed but irises lack pigment. Lips are distinct. Grip is forming.',                                                               mom:'Braxton Hicks contractions may begin — practice contractions preparing your uterus. They shouldn\'t be painful.',                                                   tip:'Braxton Hicks are normal. Call your doctor if they become regular, painful, more than 4/hour, or don\'t stop.' },
    23: { fruit:'🍊', fruitName:'Grapefruit',        measurements:'28.9 cm',     baby:'Baby has a sense of movement and can feel when you exercise. Nipples are forming. Blood vessels in the lungs are developing.',                                                          mom:'You may feel more breathless as your uterus pushes against your diaphragm. Constipation is common.',                                                                tip:'Enroll in a childbirth class now if you haven\'t. Hospital and independent classes fill up 6–8 weeks early.' },
    24: { fruit:'🌽', fruitName:'Ear of corn',       measurements:'30 cm',       baby:'Baby is considered viable outside the womb (premature but survivable with NICU care). Lungs are producing surfactant to prevent them collapsing.',                                        mom:'Your blood pressure may drop when standing quickly — rise slowly to avoid dizziness. Swelling begins.',                                                             tip:'Schedule your glucose tolerance test (24–28 wk) to screen for gestational diabetes — don\'t skip this.' },
    25: { fruit:'🥦', fruitName:'Cauliflower head',  measurements:'34.6 cm',     baby:'Baby is gaining fat rapidly. Hair is visible and has color. Nostrils are opening. Baby responds to your voice and touch.',                                                              mom:'Heartburn and indigestion peak as baby pushes against your stomach. Hemorrhoids may develop.',                                                                      tip:'Eat smaller, more frequent meals and don\'t lie down right after eating. Prop yourself up to sleep.' },
    26: { fruit:'🥬', fruitName:'Head of lettuce',   measurements:'35.6 cm',     baby:'Eyes are beginning to open! Baby can respond to sounds with increased heart rate or a kick. Immune system is developing.',                                                              mom:'Symphysis pubis pain (pelvic girdle pain) may develop. Carpal tunnel syndrome is common in pregnancy.',                                                             tip:'Do daily kick counts — baby should move at least 10 times in 2 hours. Contact your doctor if less.' },
    27: { fruit:'🍆', fruitName:'Eggplant',          measurements:'36.6 cm',     baby:'3rd trimester begins! Baby\'s brain is developing billions of neurons. Sleep cycles now include REM sleep — baby may dream!',                                                           mom:'Welcome to the 3rd trimester! Fatigue often returns. Sleeping becomes harder. Heartburn peaks.',                                                                   tip:'Finalize your birth plan and hospital bag list. Start thinking about postpartum support — it\'s not too early.' },
    28: { fruit:'🍆', fruitName:'Eggplant',          measurements:'37.6 cm',     baby:'Baby can blink and has eyelashes. Gaining weight rapidly — about half a pound per week from now on. Brain developing fast.',                                                            mom:'Appointments switch to every 2 weeks. Swelling in feet and ankles is very common now.',                                                                            tip:'Sleep on your left side — it optimizes circulation. A body pillow or pregnancy pillow is a game-changer.' },
    29: { fruit:'🍠', fruitName:'Butternut squash',  measurements:'38.6 cm',     baby:'Baby\'s muscles and lungs continue maturing. Bones are hardening. Baby is likely head-down now, preparing for birth.',                                                                 mom:'Back pain, sciatica (shooting leg pain), and shortness of breath are very common. You may feel very tired.',                                                        tip:'Pack your hospital bag this week. Have it by the door by week 36.' },
    30: { fruit:'🥬', fruitName:'Cabbage',           measurements:'39.9 cm',     baby:'Brain is developing rapidly with more complex brain wave activity. Baby can regulate own body temperature. Toenails fully grown.',                                                       mom:'Pelvic pressure increases. Colostrum (early breast milk) may start leaking — this is completely normal.',                                                           tip:'Order or rent a breast pump — many insurance plans cover it. Check with your provider.' },
    31: { fruit:'🥥', fruitName:'Coconut',           measurements:'41.1 cm',     baby:'Baby can turn head side to side. Major development is now about maturing existing organs. Brain connections multiplying rapidly.',                                                       mom:'Shortness of breath and heartburn peak as baby takes up maximum space. Sleep is increasingly difficult.',                                                           tip:'Do kick counts daily — baby should move at least 10 times in 2 hours. Contact your doctor if less than that.' },
    32: { fruit:'🫚', fruitName:'Jicama',            measurements:'42.4 cm',     baby:'Baby\'s toenails, fingernails, and hair keep growing. Practicing breathing movements 40% of the time. All 5 senses are working.',                                                       mom:'Weight gain is near peak. Nesting instinct may kick in — you\'ll want to organize and clean everything.',                                                           tip:'Pre-register at your hospital or birth center now to streamline check-in when labor begins.' },
    33: { fruit:'🍍', fruitName:'Pineapple',         measurements:'43.7 cm',     baby:'Baby\'s skull bones remain soft and flexible to fit through the birth canal. Immune system is strengthening through your antibodies.',                                                  mom:'Pelvic pressure intensifies as baby settles lower. Braxton Hicks may feel stronger.',                                                                              tip:'Discuss the signs of labor with your provider — know exactly when to call and when to go to the hospital.' },
    34: { fruit:'🍈', fruitName:'Cantaloupe',        measurements:'45 cm',       baby:'Baby\'s central nervous system and lungs are nearly mature. If born now, baby would almost certainly thrive with minimal intervention.',                                                 mom:'Frequent urination is back in full force. Fatigue is at its peak. Fingers and ankles swell. Almost there!',                                                        tip:'Install the car seat this week and get it inspected by a certified technician (free at fire stations).' },
    35: { fruit:'🍈', fruitName:'Honeydew melon',    measurements:'46.2 cm',     baby:'Kidneys are fully developed. Liver can process waste. Most physical development is complete — the rest is weight gain.',                                                                mom:'Baby may "drop" (lightening) this week — breathing gets easier but pelvic pressure dramatically increases.',                                                        tip:'Your GBS (Group B Strep) test happens weeks 35–36. Don\'t skip — results determine antibiotics during labor.' },
    36: { fruit:'🥬', fruitName:'Romaine lettuce',   measurements:'47.4 cm',     baby:'Baby is gaining an ounce per day. Sucking reflex is very strong. Gums are firm. Baby is running out of room to move.',                                                                  mom:'You\'re now "early term." Appointments are weekly. Cervical checks may begin. Nesting instinct peaks.',                                                             tip:'Finish the nursery setup. Wash all baby clothes in fragrance-free detergent. Meal prep for the freezer!' },
    37: { fruit:'🥬', fruitName:'Swiss chard bunch', measurements:'48.6 cm',     baby:'Baby is considered full term! Continuously practices breathing, sucking, and swallowing. Brain and lungs are fully developed.',                                                          mom:'You may notice bloody show (blood-tinged mucus) or lose your mucus plug. Increased discharge is normal.',                                                           tip:'Know labor signs: regular contractions that intensify and get closer, water breaking, bloody show.' },
    38: { fruit:'🧅', fruitName:'Leek',              measurements:'49.8 cm',     baby:'Baby may have up to an inch of hair! Body fat is about 15% of body weight. All organs are fully functional and ready.',                                                                 mom:'Pelvic pressure is intense. Walking may feel waddling. Every day feels like a week — rest as much as possible.',                                                   tip:'Rest, rest, rest. You need your energy for labor, which can last 12–24+ hours for first-time moms.' },
    39: { fruit:'🍉', fruitName:'Mini watermelon',   measurements:'50.7 cm',     baby:'Baby is building up antibodies from your blood to protect them after birth. Fully developed and just gaining final weight.',                                                             mom:'So close! Baby can come any day. Stay patient — only 5% of babies arrive on their due date.',                                                                      tip:'Natural ways to encourage labor (ask your OB first): walking, sex, bouncing on a birth ball, nipple stimulation.' },
    40: { fruit:'🎃', fruitName:'Small pumpkin',     measurements:'51 cm · ~7.6 lbs avg', baby:'Baby is fully ready to meet the world! The average newborn is 19–21 inches and 6.5–8.5 lbs. Everything is developed and perfect.',                                              mom:'Due date day! Try to stay calm — labor will come when baby is ready. Walk, rest, and enjoy the last moments.',                                                      tip:'If you go past 40 weeks, your doctor will discuss options. Induction is typically offered at 41–42 weeks.' },
};
