/* ========== Modern Dashboard Script ========== */
/* Keep this file as script.js in same folder as index.html */

/* ========= Mock data ========= */
const properties = [
  {id:'p1', name:'Seaside Villa', type:'Villa'},
  {id:'p2', name:'City Loft', type:'Apartment'},
  {id:'p3', name:'Mountain Cabin', type:'Cabin'},
  {id:'p4', name:'Beach Bungalow', type:'Bungalow'},
];

let users = [
  {id:'u1', name:'Ava Santos', email:'ava@example.com', role:'manager', status:'active', joinedAt:'2023-02-12', lifetimeRevenue:12000},
  {id:'u2', name:'Carlos Reyes', email:'carlos@example.com', role:'staff', status:'active', joinedAt:'2024-01-10', lifetimeRevenue:4200},
  {id:'u3', name:'Maya Cruz', email:'maya@example.com', role:'readonly', status:'inactive', joinedAt:'2022-11-02', lifetimeRevenue:0},
  {id:'u4', name:'Jon Paul', email:'jon@example.com', role:'staff', status:'active', joinedAt:'2024-05-22', lifetimeRevenue:800},
];

const bookings = [
  {id:'B-1001', guest:'John Doe', propertyId:'p1', checkIn:'2025-10-25', checkOut:'2025-10-29', nights:4, amount:480, status:'confirmed', paymentStatus:'paid', createdAt:'2025-08-21'},
  {id:'B-1002', guest:'Sarah Lee', propertyId:'p2', checkIn:'2025-10-30', checkOut:'2025-11-02', nights:3, amount:300, status:'cancelled', paymentStatus:'refunded', createdAt:'2025-09-05'},
  {id:'B-1003', guest:'Mike Tan', propertyId:'p4', checkIn:'2025-11-01', checkOut:'2025-11-03', nights:2, amount:180, status:'confirmed', paymentStatus:'pending', createdAt:'2025-09-15'},
  {id:'B-1004', guest:'Liza Gomez', propertyId:'p3', checkIn:'2025-09-20', checkOut:'2025-09-25', nights:5, amount:625, status:'checked_out', paymentStatus:'paid', createdAt:'2025-07-20'},
];

const rentals = [
  {id:'R-2001', bookingId:'B-1004', propertyId:'p3', periodStart:'2025-09-20', periodEnd:'2025-09-25', nights:5, gross:625, fees:125, net:500},
  {id:'R-2002', bookingId:'B-1001', propertyId:'p1', periodStart:'2025-10-25', periodEnd:'2025-10-29', nights:4, gross:480, fees:96, net:384},
];

const transactions = [
  {id:'T-3001', userId:'u1', date:'2025-09-25', type:'Payout', amount:500, bookingId:'B-1004', note:'September payout'},
  {id:'T-3002', userId:'u1', date:'2025-10-29', type:'Payout', amount:384, bookingId:'B-1001', note:'October payout'},
  {id:'T-3003', userId:'u2', date:'2025-08-15', type:'Refund', amount:-50, bookingId:'B-0990', note:'Partial refund'},
  {id:'T-3004', userId:'u4', date:'2025-09-05', type:'Payout', amount:200, bookingId:'B-0988', note:'August payout'},
];

/* ========= Helpers ========= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function uid(prefix='u'){ return prefix + Math.random().toString(36).slice(2,9); }
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatCurrency(n){
  const v = Number(n) || 0;
  const cur = localStorage.getItem('md_currency') || 'USD';
  return (cur === 'PHP') ? '₱' + v.toLocaleString() : '$' + v.toLocaleString();
}

/* Settings */
const settings = {
  darkMode: (localStorage.getItem('md_dark') === '1'),
  emailNotifications: (localStorage.getItem('md_email_notif') !== '0'),
  currency: localStorage.getItem('md_currency') || 'USD'
};

function applySettingsToUI(){
  document.documentElement.classList.toggle('dark', settings.darkMode);
  $('#darkModeSwitch')?.classList.toggle('on', settings.darkMode);
  $('#darkModeSwitchSettings')?.classList.toggle('on', settings.darkMode);
  $('#defaultCurrency') && ($('#defaultCurrency').value = settings.currency);
}
function persistSettings(){ localStorage.setItem('md_dark', settings.darkMode ? '1' : '0'); localStorage.setItem('md_email_notif', settings.emailNotifications ? '1' : '0'); localStorage.setItem('md_currency', settings.currency); }

/* Chart instances */
let revenueChartInstance = null;
let occupancyChartInstance = null;
let revenuePieChartInstance = null;

/* ========= Start / Init ========= */
function init(){
  // if Chart not present (rare), attempt local fallback loader
  if(typeof Chart === 'undefined'){
    console.warn('Chart.js not found via CDN. Attempting to load local fallback js/chart.umd.min.js');
    const s = document.createElement('script');
    s.src = 'js/chart.umd.min.js';
    s.onload = () => { console.info('Loaded local Chart.js fallback'); continueInit(); };
    s.onerror = () => { console.error('Failed to load Chart.js. Some charts will not render.'); continueInit(); };
    document.head.appendChild(s);
  } else {
    continueInit();
  }
}

function continueInit(){
  attachNav();
  renderAuthArea();
  populatePropertyFilter();
  populateRentalPropertyFilter();
  renderKPIs();
  renderRevenueChart();
  renderOccupancyChart();
  renderRevenuePieChart();
  fillUpcoming();
  renderAllRoleTables();
  populateBookingsAndRentals();
  attachListeners();
  updateNotifBadge();
  applySettingsToUI();
}

/* Run on DOM ready */
document.addEventListener('DOMContentLoaded', init);

/* ========= NAV & UI ========= */
function attachNav(){
  $$('#nav button').forEach(b=>{
    b.addEventListener('click', ()=>{
      $$('#nav button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const view = b.dataset.view;
      ['overview','users','bookings','reports','settings'].forEach(v=>{
        const el = document.getElementById('view-'+v);
        if(!el) return;
        el.style.display = (v === view ? '' : 'none');
      });
      document.querySelector('main')?.scrollTo({top:0, behavior:'smooth'});
    });
  });
}

/* ========= Select population ========= */
function populatePropertyFilter(){
  const top = $('#propertyFilterTop');
  if(top){
    top.innerHTML = '<option value="">All properties</option>';
    properties.forEach(p=> { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; top.appendChild(o); });
  }
}
function populateRentalPropertyFilter(){
  const sel = $('#rentalPropertyFilter');
  if(!sel) return;
  sel.innerHTML = '<option value="">All properties</option>';
  properties.forEach(p=> { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; sel.appendChild(o); });
}

/* ========= KPIs ========= */
function calculateKPIs(){
  const totalProperties = properties.length;
  const activeBookings = bookings.filter(b=>['confirmed','checked_in'].includes(b.status)).length;
  const occupancyRate = Math.round((activeBookings / Math.max(totalProperties,1)) * 100);
  const monthlyRevenue = rentals.reduce((s,r)=>s + (r.gross||0), 0);
  return {totalProperties, activeBookings, occupancyRate, monthlyRevenue};
}
function renderKPIs(){
  const k = calculateKPIs(); const container = $('#kpiRow'); if(!container) return;
  container.innerHTML = '';
  const cards = [
    {label:'Total Properties', value:k.totalProperties, trend:'+2'},
    {label:'Active Bookings', value:k.activeBookings, trend:'+1'},
    {label:'Occupancy Rate', value:k.occupancyRate + '%', trend:'+3%'},
    {label:'Monthly Revenue', value: formatCurrency(k.monthlyRevenue), trend:'+8%'},
  ];
  cards.forEach(c=>{
    const d = document.createElement('div'); d.className='kpi';
    d.innerHTML = `<div class="label">${escapeHtml(c.label)}</div><div class="value">${escapeHtml(String(c.value))}</div><div class="delta">${escapeHtml(c.trend)}</div>`;
    container.appendChild(d);
  });
  $('#revenueTotal') && ($('#revenueTotal').textContent = formatCurrency(k.monthlyRevenue));
}

/* ========= CHARTS ========= */
function renderRevenueChart(dataOverride){
  const el = $('#revenueChart'); if(!el || typeof Chart === 'undefined') return;
  const ctx = el.getContext('2d');

  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const baseData = dataOverride || [200,240,260,300,320,360,400,420,380,460,500,520];

  // gradient fill
  const gradient = ctx.createLinearGradient(0,0,0,el.height || 260);
  gradient.addColorStop(0, 'rgba(99,102,241,0.28)');
  gradient.addColorStop(0.6, 'rgba(99,102,241,0.08)');
  gradient.addColorStop(1, 'rgba(99,102,241,0)');

  if(revenueChartInstance){
    revenueChartInstance.data.labels = labels;
    revenueChartInstance.data.datasets[0].data = baseData;
    revenueChartInstance.update();
    return;
  }

  revenueChartInstance = new Chart(ctx, {
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'Monthly Revenue',
        data: baseData,
        borderColor: '#6366f1',
        backgroundColor: gradient,
        fill:true,
        tension:0.36,
        pointRadius:4,
        pointHoverRadius:7,
        borderWidth:2
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        tooltip:{ mode:'index', intersect:false, callbacks:{
          label: ctx => formatCurrency(ctx.raw)
        }}
      },
      scales:{
        x:{ grid:{ display:false } },
        y:{ beginAtZero:true, ticks:{ callback: v => formatCurrency(v) } }
      },
      interaction:{ mode:'nearest', axis:'x', intersect:false }
    }
  });
}

function renderOccupancyChart(){
  const el = $('#occupancyChart'); if(!el || typeof Chart === 'undefined') return;
  const ctx = el.getContext('2d');

  const types = [...new Set(properties.map(p=>p.type))];
  const data = types.map((t,i)=> 30 + i*12 + Math.floor(Math.random()*25));
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

  if(occupancyChartInstance){
    occupancyChartInstance.data.labels = types;
    occupancyChartInstance.data.datasets[0].data = data;
    occupancyChartInstance.update();
    return;
  }

  occupancyChartInstance = new Chart(ctx, {
    type:'bar',
    data:{ labels: types, datasets:[{ label:'Occupancy (%)', data, backgroundColor: types.map((_,i)=>colors[i%colors.length]), borderRadius:6 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } }
  });

  // legend
  const legend = $('#occupancyLegend'); if(legend){
    legend.innerHTML = '';
    types.forEach((t,i)=> {
      const el = document.createElement('div'); el.style.display='flex'; el.style.gap='8px'; el.style.alignItems='center'; el.style.marginBottom='8px';
      el.innerHTML = `<span style="width:14px;height:14px;background:${colors[i%colors.length]};border-radius:4px;display:inline-block"></span><div class="muted-sm">${t} — ${data[i]}%</div>`;
      legend.appendChild(el);
    });
  }
}

function renderRevenuePieChart(){
  const el = $('#revenuePieChart'); if(!el || typeof Chart === 'undefined') return;
  const ctx = el.getContext('2d');
  const map = {};
  rentals.forEach(r => {
    const p = properties.find(x=>x.id===r.propertyId);
    if(p) map[p.name] = (map[p.name]||0) + (r.gross||0);
  });
  const labels = Object.keys(map); const data = Object.values(map);
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

  if(revenuePieChartInstance){
    revenuePieChartInstance.data.labels = labels;
    revenuePieChartInstance.data.datasets[0].data = data;
    revenuePieChartInstance.update();
    return;
  }

  revenuePieChartInstance = new Chart(ctx, {
    type:'pie',
    data:{ labels, datasets:[{ data, backgroundColor: labels.map((_,i)=>colors[i%colors.length]) }]},
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
  });
}

// ==========================
// 🏨 PROPERTIES SECTION (exclusive to Properties page)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  if (!main) return;

  // --- Prepare Properties Section ---
  let propertiesSection;

  // --- Sidebar Button ---
  const propBtn = document.querySelector('[data-view="properties"]');
  if (propBtn) {
    propBtn.addEventListener("click", () => {
      // Hide all other sections
      document.querySelectorAll(".view").forEach((v) => {
        v.style.display = "none";
        v.setAttribute("aria-hidden", "true");
      });

      // Create or show Properties Section
      if (!propertiesSection) {
        propertiesSection = document.createElement("section");
        propertiesSection.className = "view card";
        propertiesSection.id = "view-properties";
        propertiesSection.setAttribute("aria-hidden", "false");
        propertiesSection.style.display = "block";

        propertiesSection.innerHTML = `
          <div class="section-head">
            <div>
              <div class="muted">Properties</div>
              <h2>Manage Properties</h2>
            </div>
            <button id="addPropertyBtn" class="btn">Add Property</button>
          </div>

          <div class="card elevated" style="overflow-x:auto;">
            <table id="propertiesTable" class="table" style="width:100%;">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Rooms</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        `;
        main.appendChild(propertiesSection);

        // --- Logic only loads when Properties is opened ---
        let properties = JSON.parse(localStorage.getItem("properties") || "[]");
        const tableBody = propertiesSection.querySelector("#propertiesTable tbody");

        const saveAndRender = () => {
          localStorage.setItem("properties", JSON.stringify(properties));
          renderProperties();
        };

        const renderProperties = () => {
          tableBody.innerHTML = "";
          if (properties.length === 0) {
            tableBody.innerHTML = `
              <tr><td colspan="7" class="muted-sm" style="text-align:center;">No properties added yet.</td></tr>
            `;
            return;
          }
          properties.forEach((p, i) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${p.id}</td>
              <td><img src="${p.image || "https://via.placeholder.com/80"}" alt="${p.name}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;"></td>
              <td>${p.name}</td>
              <td>${p.type}</td>
              <td>${p.location}</td>
              <td>${p.rooms}</td>
              <td>
                <button class="btn ghost edit-btn" data-index="${i}">Edit</button>
                <button class="btn ghost danger delete-btn" data-index="${i}">Delete</button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        };
        renderProperties();

        // --- Modal Form ---
        const openPropertyForm = (editIndex = null) => {
          const editing = editIndex !== null;
          const existing = editing ? properties[editIndex] : {};

          const overlay = document.createElement("div");
          overlay.className = "modal-overlay";
          overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(6px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          `;

          const dark = document.body.classList.contains("dark-mode");
          const bg = dark ? "#1f1f1f" : "#fff";
          const fg = dark ? "#f2f2f2" : "#111";
          const border = dark ? "#333" : "#ccc";

          const form = document.createElement("div");
          form.style.cssText = `
            background:${bg};
            color:${fg};
            border:1px solid ${border};
            padding:24px;
            border-radius:16px;
            width:90%;
            max-width:440px;
            box-shadow:0 6px 24px rgba(0,0,0,0.4);
            animation:fadeInScale .25s ease;
          `;
          form.innerHTML = `
            <h3 style="text-align:center;margin-bottom:12px;">${editing ? "Edit Property" : "Add Property"}</h3>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <label>ID</label>
              <input id="propID" class="input" value="${editing ? existing.id : Date.now()}" readonly />
              <label>Name</label>
              <input id="propName" class="input" value="${existing.name || ""}" placeholder="Property Name" />
              <label>Type</label>
              <input id="propType" class="input" value="${existing.type || ""}" placeholder="Hotel, Condo, etc." />
              <label>Location</label>
              <input id="propLoc" class="input" value="${existing.location || ""}" placeholder="Location" />
              <label>Rooms</label>
              <input id="propRooms" class="input" type="number" value="${existing.rooms || 0}" placeholder="Rooms" />
              <label>Image</label>
              <div class="image-upload" style="text-align:center;">
                <label for="propImg" class="btn ghost" style="cursor:pointer;">📷 Upload Image</label>
                <input id="propImg" type="file" accept="image/*" style="display:none;">
                <div id="previewImg" style="margin-top:10px;">
                  <img src="${existing.image || "https://via.placeholder.com/150"}" style="width:120px;height:90px;border-radius:10px;object-fit:cover;border:1px solid ${border};">
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
                <button id="cancelPropForm" class="btn ghost">Cancel</button>
                <button id="savePropForm" class="btn">${editing ? "Update" : "Save"}</button>
              </div>
            </div>
          `;
          overlay.appendChild(form);
          document.body.appendChild(overlay);

          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
          });
          form.querySelector("#cancelPropForm").onclick = () => overlay.remove();

          const preview = form.querySelector("#previewImg img");
          const fileInput = form.querySelector("#propImg");
          fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => (preview.src = reader.result);
              reader.readAsDataURL(file);
            }
          };

          form.querySelector("#savePropForm").onclick = () => {
            const id = form.querySelector("#propID").value.trim();
            const name = form.querySelector("#propName").value.trim();
            const type = form.querySelector("#propType").value.trim() || "Hotel";
            const location = form.querySelector("#propLoc").value.trim() || "Unknown";
            const rooms = form.querySelector("#propRooms").value.trim() || "0";
            const image = preview.src;

            if (!name) return alert("Please enter property name.");

            const data = { id, name, type, location, rooms, image };
            if (editing) properties[editIndex] = data;
            else properties.push(data);

            saveAndRender();
            overlay.remove();
          };
        };

        // Add Property
        propertiesSection.querySelector("#addPropertyBtn").addEventListener("click", () => openPropertyForm());

        // Edit/Delete
        tableBody.addEventListener("click", (e) => {
          const i = e.target.dataset.index;
          if (e.target.classList.contains("edit-btn")) openPropertyForm(i);
          if (e.target.classList.contains("delete-btn")) {
            if (confirm("Delete this property?")) {
              properties.splice(i, 1);
              saveAndRender();
            }
          }
        });
      } else {
        // Just show existing section
        propertiesSection.style.display = "block";
        propertiesSection.setAttribute("aria-hidden", "false");
      }
    });
  }
});

/* ========= Upcoming checks ========= */
function fillUpcoming(){
  const tbody = $('#upcomingChecks tbody'); if(!tbody) return;
  tbody.innerHTML = '';
  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.checkIn) >= now && (new Date(b.checkIn)-now) < (1000*60*60*24*30)).slice(0,5);
  if(!upcoming.length){ tbody.innerHTML = '<tr><td colspan="2" class="muted-sm">No upcoming check-ins</td></tr>'; return; }
  upcoming.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(u.guest)}</td><td class="muted-sm">${escapeHtml(u.checkIn)}</td>`;
    tbody.appendChild(tr);
  });
}

/* ========= Role tables ========= */
function renderAllRoleTables(filter=''){
  const f = (filter||'').toLowerCase();
  renderRoleTable('manager','#managerTable tbody', f);
  renderRoleTable('staff','#staffTable tbody', f);
  renderRoleTable('readonly','#readTable tbody', f);
}
function renderRoleTable(role, selector, filterLower){
  const tbody = document.querySelector(selector); if(!tbody) return; tbody.innerHTML = '';
  users.filter(u => u.role === role && (!filterLower || u.name.toLowerCase().includes(filterLower) || u.email.toLowerCase().includes(filterLower))).forEach(u=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width:36px"><input type="checkbox" class="user-checkbox" data-uid="${u.id}" /></td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="switch ${u.status==='active' ? 'on' : ''}" data-uid="${u.id}" role="switch" aria-checked="${u.status==='active'}"><span class="knob"></span></span></td>
      <td class="row-actions"><button class="view-user" data-id="${u.id}">View</button><button class="edit-user" data-id="${u.id}">Edit</button><button class="delete-user" data-id="${u.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });

  // attach handlers
  $$(selector + ' .view-user').forEach(b=> b.addEventListener('click', ()=> openUserView(b.dataset.id)));
  $$(selector + ' .edit-user').forEach(b=> b.addEventListener('click', ()=> alert('Edit (demo): ' + b.dataset.id)));
  $$(selector + ' .delete-user').forEach(b=> b.addEventListener('click', ()=> deleteUser(b.dataset.id)));
  $$(selector + ' .switch').forEach(sw=> sw.addEventListener('click', ()=> toggleUserStatus(sw.dataset.uid)));
  $$(selector + ' .user-checkbox').forEach(cb=> cb.addEventListener('change', ()=> cb.closest('tr')?.classList.toggle('selected', cb.checked)));
}

/* ========= CRUD helpers ========= */
function createUser(data){ const u = {id:uid('u'), name:data.name, email:data.email, role:data.role||'staff', status:data.status||'active', joinedAt: new Date().toISOString().slice(0,10), lifetimeRevenue:data.lifetimeRevenue||0}; users.unshift(u); renderAllRoleTables($('#userSearch')?.value||''); }
function updateUser(id, updates){ const u = users.find(x=>x.id===id); if(!u) return; Object.assign(u, updates); renderAllRoleTables($('#userSearch')?.value||''); }
function deleteUser(id){ users = users.filter(x=>x.id!==id); renderAllRoleTables($('#userSearch')?.value||''); }
function toggleUserStatus(id){ const u = users.find(x=>x.id===id); if(!u) return; u.status = (u.status === 'active') ? 'inactive' : 'active'; renderAllRoleTables($('#userSearch')?.value||''); }

/* ========= User slide / transactions ========= */
function openUserView(id){
  const u = users.find(x=>x.id===id); if(!u) return;
  const userTx = transactions.filter(t=>t.userId===id).sort((a,b)=> new Date(b.date)-new Date(a.date));
  const txHtml = userTx.length ? userTx.map(tx=> `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--border)"><div><strong>${escapeHtml(tx.type)}</strong><div class="muted-sm">${escapeHtml(tx.date)} • ${escapeHtml(tx.note||'')}</div></div><div style="text-align:right"><div style="font-weight:700">${formatCurrency(tx.amount)}</div><div class="muted-sm">${escapeHtml(tx.bookingId||'')}</div></div></div>`).join('') : '<div class="muted-sm">No transactions</div>';

  const html = `<div style="margin-bottom:8px"><strong>${escapeHtml(u.name)}</strong></div>
    <div class="muted-sm">Email: ${escapeHtml(u.email)}</div>
    <div class="muted-sm">Role: ${escapeHtml(u.role)}</div>
    <div class="muted-sm">Status: ${escapeHtml(u.status)}</div>
    <div style="margin-top:12px;display:flex;gap:8px"><button id="impersonateBtn" class="btn">Impersonate</button><button id="openTxBtn" class="btn ghost">Transactions</button><button id="editFromViewBtn" class="btn warn">Edit</button></div>
    <div style="margin-top:12px"><div style="font-weight:600;margin-bottom:8px">Recent transactions</div>${txHtml}</div>`;

  openSlide('User: ' + u.name, html);
  setTimeout(()=>{
    $('#impersonateBtn')?.addEventListener('click', ()=> alert('Impersonate demo: ' + u.email));
    $('#openTxBtn')?.addEventListener('click', ()=> openTransactionsPanel(u.id));
    $('#editFromViewBtn')?.addEventListener('click', ()=> { closeSlide(); alert('Edit demo'); });
  },60);
}

function openTransactionsPanel(userId){
  const u = users.find(x=>x.id===userId); if(!u) return;
  const userTx = transactions.filter(t=>t.userId===userId).sort((a,b)=> new Date(b.date)-new Date(a.date));
  $('#txnPanelTitle') && ($('#txnPanelTitle').textContent = `Transactions — ${u.name}`);
  $('#txnPanelSub') && ($('#txnPanelSub').textContent = `Showing ${userTx.length} transaction(s)`);
  const container = $('#txnList'); if(!container) return;
  container.innerHTML = '';
  if(!userTx.length){ container.innerHTML = '<div class="muted-sm">No transactions found</div>'; $('#userTransactionsPanel').style.display = ''; return; }
  userTx.forEach(tx => {
    const div = document.createElement('div'); div.className = 'txn-item';
    div.innerHTML = `<div><div style="font-weight:600">${escapeHtml(tx.type)}</div><div class="muted-sm">${escapeHtml(tx.date)} • ${escapeHtml(tx.note||'')}</div></div><div style="text-align:right"><div style="font-weight:700">${formatCurrency(tx.amount)}</div><div class="muted-sm">${escapeHtml(tx.bookingId||'')}</div></div>`;
    container.appendChild(div);
  });
  $('#userTransactionsPanel').style.display = '';
  $('#userTransactionsPanel').scrollIntoView({behavior:'smooth', block:'center'});
}
$('#closeTxnPanel')?.addEventListener('click', ()=> { $('#userTransactionsPanel').style.display = 'none'; });

/* ========= Bookings & rentals ========= */
function populateBookingsAndRentals(){
  populateBookingsTable();
  populateRentalsTable();
  $('#bookingsCount') && ($('#bookingsCount').textContent = bookings.length);
  $('#rentalsCount') && ($('#rentalsCount').textContent = rentals.length);
}
function populateBookingsTable(){
  const tbody = $('#bookingsTable tbody'); if(!tbody) return; tbody.innerHTML = '';
  bookings.forEach(b=>{
    const prop = properties.find(p=>p.id===b.propertyId) || {name:'Unknown'};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${prop.name}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`;
    tbody.appendChild(tr);
  });

  $$('.view-booking').forEach(b=> b.addEventListener('click', ()=> {
    const id = b.dataset.id; const booking = bookings.find(x=>x.id===id); if(!booking) return;
    const prop = properties.find(p=>p.id===booking.propertyId) || {};
    const html = `<div style="margin-bottom:8px"><strong>${booking.id}</strong></div>
      <div class="muted-sm">Guest: ${escapeHtml(booking.guest)}</div>
      <div class="muted-sm">Property: ${prop.name || ''}</div>
      <div class="muted-sm">Period: ${booking.checkIn} → ${booking.checkOut} (${booking.nights} nights)</div>
      <div style="margin-top:8px; font-weight:700">${formatCurrency(booking.amount)}</div>
      <div style="margin-top:12px"><button id="checkInBtn" class="btn">Mark as checked-in</button><button id="cancelBookingBtn" class="btn ghost">Cancel</button></div>`;
    openSlide('Booking ' + booking.id, html);
    setTimeout(()=> {
      $('#checkInBtn')?.addEventListener('click', ()=> { booking.status = 'checked_in'; populateBookingsAndRentals(); renderKPIs(); fillUpcoming(); closeSlide(); updateNotifBadge(); });
      $('#cancelBookingBtn')?.addEventListener('click', ()=> { booking.status = 'cancelled'; populateBookingsAndRentals(); renderKPIs(); fillUpcoming(); closeSlide(); updateNotifBadge(); });
    },60);
  }));
}

function populateRentalsTable(){
  const tbody = $('#rentalsTable tbody'); if(!tbody) return; tbody.innerHTML = '';
  rentals.forEach(r=>{
    const prop = properties.find(p=>p.id===r.propertyId) || {};
    const booking = bookings.find(b=>b.id===r.bookingId) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${prop.name || ''}</td><td>${escapeHtml(booking.guest || '')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`;
    tbody.appendChild(tr);
  });
}

/* ========= status rendering ========= */
function renderStatus(s){
  const cls = s === 'cancelled' ? 'danger' : (s === 'checked_in' ? 'success' : 'warn');
  return `<span class="pill ${cls}">${s.replace('_',' ')}</span>`;
}

/* ========= Slide panel ========= */
function openSlide(title, html){
  $('#slideTitle') && ($('#slideTitle').textContent = title);
  $('#slideBody') && ($('#slideBody').innerHTML = html);
  $('#slide')?.classList.add('open');
  $('#overlay')?.classList.add('show');
  $('#slide')?.setAttribute('aria-hidden','false');
}
function closeSlide(){ $('#slide')?.classList.remove('open'); $('#overlay')?.classList.remove('show'); $('#slide')?.setAttribute('aria-hidden','true'); }
$('#closeSlide')?.addEventListener('click', closeSlide); $('#overlay')?.addEventListener('click', closeSlide);

// ==========================
// 🏨 PROPERTIES SECTION (exclusive to Properties page)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  if (!main) return;

  // --- Helper: Hide all sections/views ---
  const hideAllViews = () => {
    document.querySelectorAll(".view").forEach((v) => {
      v.style.display = "none";
      v.setAttribute("aria-hidden", "true");
    });
  };

  // --- Sidebar Button ---
  const propBtn = document.querySelector('[data-view="properties"]');
  let propertiesSection;

  if (propBtn) {
    propBtn.addEventListener("click", () => {
      hideAllViews(); // 🔹 Hide all other pages first

      // Create or show Properties Section
      if (!propertiesSection) {
        propertiesSection = document.createElement("section");
        propertiesSection.className = "view card";
        propertiesSection.id = "view-properties";
        propertiesSection.setAttribute("aria-hidden", "false");
        propertiesSection.style.display = "block";

        propertiesSection.innerHTML = `
          <div class="section-head">
            <div>
              <div class="muted">Properties</div>
              <h2>Manage Properties</h2>
            </div>
            <button id="addPropertyBtn" class="btn">Add Property</button>
          </div>

          <div class="card elevated" style="overflow-x:auto;">
            <table id="propertiesTable" class="table" style="width:100%;">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Rooms</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        `;
        main.appendChild(propertiesSection);

        // --- Load and render property data ---
        let properties = JSON.parse(localStorage.getItem("properties") || "[]");
        const tableBody = propertiesSection.querySelector("#propertiesTable tbody");

        const saveAndRender = () => {
          localStorage.setItem("properties", JSON.stringify(properties));
          renderProperties();
        };

        const renderProperties = () => {
          tableBody.innerHTML = "";
          if (properties.length === 0) {
            tableBody.innerHTML = `
              <tr><td colspan="7" class="muted-sm" style="text-align:center;">No properties added yet.</td></tr>
            `;
            return;
          }
          properties.forEach((p, i) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${p.id}</td>
              <td><img src="${p.image || "https://via.placeholder.com/80"}" alt="${p.name}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;"></td>
              <td>${p.name}</td>
              <td>${p.type}</td>
              <td>${p.location}</td>
              <td>${p.rooms}</td>
              <td>
                <button class="btn ghost edit-btn" data-index="${i}">Edit</button>
                <button class="btn ghost danger delete-btn" data-index="${i}">Delete</button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        };
        renderProperties();

        // --- Modal Form Function ---
        const openPropertyForm = (editIndex = null) => {
          const editing = editIndex !== null;
          const existing = editing ? properties[editIndex] : {};

          const overlay = document.createElement("div");
          overlay.className = "modal-overlay";
          overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(6px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          `;

          const dark = document.body.classList.contains("dark-mode");
          const bg = dark ? "#1f1f1f" : "#fff";
          const fg = dark ? "#f2f2f2" : "#111";
          const border = dark ? "#333" : "#ccc";

          const form = document.createElement("div");
          form.style.cssText = `
            background:${bg};
            color:${fg};
            border:1px solid ${border};
            padding:24px;
            border-radius:16px;
            width:90%;
            max-width:440px;
            box-shadow:0 6px 24px rgba(0,0,0,0.4);
            animation:fadeInScale .25s ease;
          `;
          form.innerHTML = `
            <h3 style="text-align:center;margin-bottom:12px;">${editing ? "Edit Property" : "Add Property"}</h3>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <label>ID</label>
              <input id="propID" class="input" value="${editing ? existing.id : Date.now()}" readonly />
              <label>Name</label>
              <input id="propName" class="input" value="${existing.name || ""}" placeholder="Property Name" />
              <label>Type</label>
              <input id="propType" class="input" value="${existing.type || ""}" placeholder="Hotel, Condo, etc." />
              <label>Location</label>
              <input id="propLoc" class="input" value="${existing.location || ""}" placeholder="Location" />
              <label>Rooms</label>
              <input id="propRooms" class="input" type="number" value="${existing.rooms || 0}" placeholder="Rooms" />
              <label>Image</label>
              <div class="image-upload" style="text-align:center;">
                <label for="propImg" class="btn ghost" style="cursor:pointer;">📷 Upload Image</label>
                <input id="propImg" type="file" accept="image/*" style="display:none;">
                <div id="previewImg" style="margin-top:10px;">
                  <img src="${existing.image || "https://via.placeholder.com/150"}" style="width:120px;height:90px;border-radius:10px;object-fit:cover;border:1px solid ${border};">
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
                <button id="cancelPropForm" class="btn ghost">Cancel</button>
                <button id="savePropForm" class="btn">${editing ? "Update" : "Save"}</button>
              </div>
            </div>
          `;
          overlay.appendChild(form);
          document.body.appendChild(overlay);

          // --- Modal Events ---
          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
          });
          form.querySelector("#cancelPropForm").onclick = () => overlay.remove();

          const preview = form.querySelector("#previewImg img");
          const fileInput = form.querySelector("#propImg");
          fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => (preview.src = reader.result);
              reader.readAsDataURL(file);
            }
          };

          // --- Save/Update ---
          form.querySelector("#savePropForm").onclick = () => {
            const id = form.querySelector("#propID").value.trim();
            const name = form.querySelector("#propName").value.trim();
            const type = form.querySelector("#propType").value.trim() || "Hotel";
            const location = form.querySelector("#propLoc").value.trim() || "Unknown";
            const rooms = form.querySelector("#propRooms").value.trim() || "0";
            const image = preview.src;

            if (!name) return alert("Please enter property name.");

            const data = { id, name, type, location, rooms, image };
            if (editing) properties[editIndex] = data;
            else properties.push(data);

            saveAndRender();
            overlay.remove();
          };
        };

        // --- Button Events ---
        propertiesSection.querySelector("#addPropertyBtn").addEventListener("click", () => openPropertyForm());
        tableBody.addEventListener("click", (e) => {
          const i = e.target.dataset.index;
          if (e.target.classList.contains("edit-btn")) openPropertyForm(i);
          if (e.target.classList.contains("delete-btn")) {
            if (confirm("Delete this property?")) {
              properties.splice(i, 1);
              saveAndRender();
            }
          }
        });
      } else {
        // Just show existing section if already created
        propertiesSection.style.display = "block";
        propertiesSection.setAttribute("aria-hidden", "false");
      }
    });
  }

  // --- Hide properties when navigating elsewhere ---
  document.querySelectorAll("[data-view]").forEach((btn) => {
    if (btn.dataset.view !== "properties") {
      btn.addEventListener("click", () => {
        if (propertiesSection) {
          propertiesSection.style.display = "none";
          propertiesSection.setAttribute("aria-hidden", "true");
        }
      });
    }
  });
});

/* ========= CSV export ========= */
function exportCSV(filename, rows){
  const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename || 'export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ========= Listeners ========= */
function attachListeners(){
  // Create shortcuts
  $('#addUserBtn')?.addEventListener('click', openCreateUser);
  $('#openCreateUser')?.addEventListener('click', openCreateUser);
  $('#addBookingBtn')?.addEventListener('click', openModalNewBooking);
  $('#newBooking')?.addEventListener('click', openModalNewBooking);

  // Search / filters
  $('#userSearch')?.addEventListener('input', e => renderAllRoleTables(e.target.value || ''));
  $('#roleFilter')?.addEventListener('change', ()=> filterByRole($('#roleFilter')?.value || ''));

  $('#exportUsers')?.addEventListener('click', ()=> {
    const rows = [['Name','Email','Role','Status','JoinedAt','LifetimeRevenue']];
    users.forEach(u => rows.push([u.name,u.email,u.role,u.status,u.joinedAt||'',u.lifetimeRevenue||0]));
    exportCSV('users.csv', rows);
  });

  $('#exportCSV')?.addEventListener('click', ()=> {
    const rows=[['Booking ID','Guest','Property','Check-in','Check-out','Nights','Amount','Status']];
    bookings.forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId) || {}; rows.push([b.id,b.guest,p.name||'',b.checkIn,b.checkOut,b.nights,b.amount,b.status]); });
    exportCSV('bookings.csv', rows);
  });

  $('#exportBookingsRentals')?.addEventListener('click', ()=> {
    const rows=[['Type','ID','Property','Guest','Period','Nights','Gross/Amount','Net/Status']];
    bookings.forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId) || {}; rows.push(['Booking',b.id,p.name||'',b.guest,b.checkIn + ' → ' + b.checkOut,b.nights,b.amount,b.status]); });
    rentals.forEach(r=>{ const p = properties.find(x=>x.id===r.propertyId) || {}; const b = bookings.find(x=>x.id===r.bookingId) || {}; rows.push(['Rental',r.id,p.name||'',b.guest||'', r.periodStart + ' → ' + r.periodEnd, r.nights, r.gross, r.net]); });
    exportCSV('bookings_rentals.csv', rows);
  });

  // Bulk actions
  $('#managerEnable')?.addEventListener('click', ()=> { const ids = getSelectedIdsIn('#managerTable'); if(ids.length) bulkSet(ids,'active'); else alert('Select managers'); });
  $('#managerDisable')?.addEventListener('click', ()=> { const ids = getSelectedIdsIn('#managerTable'); if(ids.length) bulkSet(ids,'inactive'); else alert('Select managers'); });
  $('#staffEnable')?.addEventListener('click', ()=> { const ids = getSelectedIdsIn('#staffTable'); if(ids.length) bulkSet(ids,'active'); else alert('Select staff'); });
  $('#staffDisable')?.addEventListener('click', ()=> { const ids = getSelectedIdsIn('#staffTable'); if(ids.length) bulkSet(ids,'inactive'); else alert('Select staff'); });
  $('#readEnable')?.addEventListener('click', ()=> { const ids = getSelectedIdsIn('#readTable'); if(ids.length) bulkSet(ids,'active'); else alert('Select read-only users'); });
  $('#readDisable')?.addEventListener('click', ()=> { const ids = getSelectedIdsIn('#readTable'); if(ids.length) bulkSet(ids,'inactive'); else alert('Select read-only users'); });

  // select-all
  $('#selectAllManager')?.addEventListener('change', e => selectAllIn('#managerTable', e.target.checked));
  $('#selectAllStaff')?.addEventListener('change', e => selectAllIn('#staffTable', e.target.checked));
  $('#selectAllRead')?.addEventListener('change', e => selectAllIn('#readTable', e.target.checked));

  // booking search / filters
  $('#bookingSearch')?.addEventListener('input', e => {
    const q = (e.target.value || '').toLowerCase();
    const tbodyB = $('#bookingsTable tbody'); const tbodyR = $('#rentalsTable tbody');
    if(tbodyB) tbodyB.innerHTML = '';
    if(tbodyR) tbodyR.innerHTML = '';
    bookings.filter(b=> b.id.toLowerCase().includes(q) || b.guest.toLowerCase().includes(q) || (properties.find(p=>p.id===b.propertyId)?.name || '').toLowerCase().includes(q)).forEach(b=>{
      const p = properties.find(x=>x.id===b.propertyId)||{};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${p.name||''}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`;
      tbodyB && tbodyB.appendChild(tr);
    });

    rentals.filter(r=> r.id.toLowerCase().includes(q) || (bookings.find(b=>b.id===r.bookingId)?.guest || '').toLowerCase().includes(q) || (properties.find(p=>p.id===r.propertyId)?.name || '').toLowerCase().includes(q)).forEach(r=>{
      const p = properties.find(x=>x.id===r.propertyId)||{}; const b = bookings.find(x=>x.id===r.bookingId)||{};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.id}</td><td>${p.name||''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`;
      tbodyR && tbodyR.appendChild(tr);
    });
  });

  $('#bookingStatusFilter')?.addEventListener('change', e => {
    const val = e.target.value; const tbodyB = $('#bookingsTable tbody'); if(!tbodyB) return; tbodyB.innerHTML = '';
    bookings.filter(b=> !val || b.status === val).forEach(b=> {
      const p = properties.find(x=>x.id===b.propertyId)||{};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${p.name||''}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`;
      tbodyB.appendChild(tr);
    });
  });

  $('#propertyFilterTop')?.addEventListener('change', e=>{
    const pid = e.target.value; const tbodyB = $('#bookingsTable tbody'); const tbodyR = $('#rentalsTable tbody');
    if(tbodyB) tbodyB.innerHTML = ''; if(tbodyR) tbodyR.innerHTML = '';
    bookings.filter(b=> !pid || b.propertyId === pid).forEach(b=> {
      const p = properties.find(x=>x.id===b.propertyId)||{};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${p.name||''}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`;
      tbodyB.appendChild(tr);
    });

    rentals.filter(r=> !pid || r.propertyId === pid).forEach(r=>{
      const p = properties.find(x=>x.id===r.propertyId)||{}; const b = bookings.find(x=>x.id===r.bookingId)||{};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.id}</td><td>${p.name||''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`;
      tbodyR && tbodyR.appendChild(tr);
    });
  });

  // rental export filter (if exists)
  $('#rentalPropertyFilter')?.addEventListener('change', e=>{
    const pid = e.target.value; const tbody = $('#rentalsFullTable tbody'); if(!tbody) return; tbody.innerHTML = '';
    rentals.filter(r=> !pid || r.propertyId === pid).forEach(r=> { const p = properties.find(x=>x.id===r.propertyId)||{}; const b = bookings.find(x=>x.id===r.bookingId)||{}; const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.id}</td><td>${r.bookingId}</td><td>${p.name||''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`; tbody.appendChild(tr); });
  });

  // keyboard shortcut: Ctrl/Cmd+N -> new user
  document.addEventListener('keydown', e => { if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'n'){ e.preventDefault(); openCreateUser(); } });

  // notifications
  $('#notifBtn')?.addEventListener('click', ()=> {
    const alerts = getAlerts();
    const html = `<div style="font-weight:700;margin-bottom:8px">Notifications</div><div class="muted-sm">${alerts.length} notification(s)</div><div style="margin-top:12px">${alerts.length ? alerts.map(a=>`<div style="padding:8px;border-bottom:1px dashed var(--border)"><div style="font-weight:600">${escapeHtml(a.title)}</div><div class="muted-sm">${escapeHtml(a.body)}</div></div>`).join('') : '<div class="muted-sm">No notifications</div>'}</div>`;
    openSlide('Notifications', html);
  });

  // settings toggles
  $('#darkModeSwitch')?.addEventListener('click', ()=> { settings.darkMode = !settings.darkMode; persistSettings(); applySettingsToUI(); });
  $('#darkModeSwitchSettings')?.addEventListener('click', ()=> { settings.darkMode = !settings.darkMode; persistSettings(); applySettingsToUI(); });
  $('#emailNotifSwitch')?.addEventListener('click', ()=> { settings.emailNotifications = !settings.emailNotifications; persistSettings(); });

  $('#defaultCurrency')?.addEventListener('change', e=> { settings.currency = e.target.value; persistSettings(); renderKPIs(); populateBookingsAndRentals(); });

  // randomize / reset chart actions
  $('#randomizeChart')?.addEventListener('click', ()=> {
    const arr = Array.from({length:12}, ()=> Math.round(150 + Math.random()*450));
    renderRevenueChart(arr);
  });
  $('#resetChart')?.addEventListener('click', ()=> renderRevenueChart());

  // sidebar toggle (mobile)
  $('#hamburger')?.addEventListener('click', ()=> { const sb = $('#sidebar'); if(sb) sb.style.display = (sb.style.display === 'none' ? '' : 'none'); });
  $('#sidebarClose')?.addEventListener('click', ()=> { const sb = $('#sidebar'); if(sb) sb.style.display = 'none'; });

  // booking / create modals wired in small helpers below
}

/* ========= Bulk helpers ========= */
function getSelectedIdsIn(tableSelector){ return Array.from(document.querySelectorAll(tableSelector + ' .user-checkbox')).filter(c=>c.checked).map(c=>c.dataset.uid); }
function bulkSet(ids, status){ ids.forEach(id => { const u = users.find(x=>x.id===id); if(u) u.status = status; }); renderAllRoleTables($('#userSearch')?.value || ''); }
function selectAllIn(tableSelector, checked){ Array.from(document.querySelectorAll(tableSelector + ' .user-checkbox')).forEach(cb=>{ cb.checked = checked; cb.dispatchEvent(new Event('change')); }); }

/* ========= Alerts ========= */
function getAlerts(){
  const alerts = []; const now = new Date();
  bookings.forEach(b => {
    const diff = (new Date(b.checkIn) - now) / (1000*60*60*24);
    if(diff >= 0 && diff <= 7 && b.status === 'confirmed') alerts.push({title:`Upcoming check-in: ${b.guest}`, body:`${b.id} • ${b.checkIn}`});
    if(b.status === 'cancelled') alerts.push({title:`Cancelled booking: ${b.id}`, body: b.guest});
  });
  return alerts;
}
function updateNotifBadge(){
  const alerts = getAlerts(); const badge = $('#notifBadge'); if(!badge) return;
  if(alerts.length){ badge.style.display = 'inline-block'; badge.textContent = String(alerts.length); } else { badge.style.display = 'none'; }
}

/* ========= small UI helpers ========= */
function openCreateUser(){
  const html = `<div style="font-weight:700;margin-bottom:8px">Create user</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <input id="cu_name" class="input" placeholder="Name" />
      <input id="cu_email" class="input" placeholder="Email" />
      <select id="cu_role" class="select"><option value="staff">Staff</option><option value="manager">Manager</option><option value="readonly">Read-only</option></select>
      <div style="display:flex;gap:8px"><button id="cu_create" class="btn">Create</button><button id="cu_cancel" class="btn ghost">Cancel</button></div>
    </div>`;
  openSlide('New user', html);
  setTimeout(()=> {
    $('#cu_cancel')?.addEventListener('click', closeSlide);
    $('#cu_create')?.addEventListener('click', ()=> {
      const name = ($('#cu_name')?.value || '').trim(), email = ($('#cu_email')?.value || '').trim().toLowerCase();
      if(!name || !email){ alert('Enter name and email'); return; }
      createUser({name,email,role:$('#cu_role')?.value}); closeSlide();
    });
  },60);
}

function openModalNewBooking(){
  const html = `<div style="font-weight:700;margin-bottom:8px">New booking</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <input id="nb_guest" class="input" placeholder="Guest name" />
      <select id="nb_property" class="select">${properties.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select>
      <input id="nb_checkin" class="input" placeholder="Check-in YYYY-MM-DD" />
      <input id="nb_checkout" class="input" placeholder="Check-out YYYY-MM-DD" />
      <div style="display:flex;gap:8px"><button id="nb_create" class="btn">Create</button><button id="nb_cancel" class="btn ghost">Cancel</button></div>
    </div>`;
  openSlide('New booking', html);
  setTimeout(()=> {
    $('#nb_cancel')?.addEventListener('click', closeSlide);
    $('#nb_create')?.addEventListener('click', ()=> {
      const guest = ($('#nb_guest')?.value||'').trim(); const pid = $('#nb_property')?.value; const ci = ($('#nb_checkin')?.value||'').trim(); const co = ($('#nb_checkout')?.value||'').trim();
      if(!guest || !pid || !ci || !co){ alert('Complete fields'); return; }
      const nights = Math.max(1, Math.round((new Date(co) - new Date(ci)) / (1000*60*60*24)) || 1);
      const amount = 100 * nights;
      const id = 'B-' + (Math.random().toString().slice(2,7));
      bookings.unshift({id,guest,propertyId:pid,checkIn:ci,checkOut:co,nights,amount,status:'confirmed',paymentStatus:'pending',createdAt:new Date().toISOString().slice(0,10)});
      populateBookingsAndRentals(); renderKPIs(); fillUpcoming(); updateNotifBadge(); closeSlide();
    });
  },60);
}

/* ========= role filtering ========= */
function filterByRole(role){
  if(!role){ renderAllRoleTables($('#userSearch')?.value || ''); document.querySelectorAll('.role-card').forEach(el=>el.style.display=''); return; }
  renderAllRoleTables('');
  document.querySelectorAll('.role-card').forEach(el=>{
    const id = el.querySelector('table')?.id;
    if((role==='manager' && id==='managerTable') || (role==='staff' && id==='staffTable') || (role==='readonly' && id==='readTable')) el.style.display=''; else el.style.display='none';
  });
}

/* ========= initial render helper ========= */
function renderAllData(){
  renderKPIs(); renderRevenueChart(); renderOccupancyChart(); renderRevenuePieChart(); fillUpcoming(); renderAllRoleTables(); populateBookingsAndRentals(); updateNotifBadge();
}

/* ========= attach listeners and initial render ========= */
attachListeners();
renderAllData();
