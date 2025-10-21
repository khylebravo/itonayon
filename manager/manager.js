// Mock data
const properties = [
  {id:'p1', name:'Seaside Villa', type:'Villa', location:'Urdaneta', capacity:6},
  {id:'p2', name:'City Loft', type:'Apartment', location:'Manila', capacity:2},
  {id:'p3', name:'Mountain Cabin', type:'Cabin', location:'Baguio', capacity:4},
  {id:'p4', name:'Beach Bungalow', type:'Bungalow', location:'Urdaneta', capacity:4},
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

// Utilities
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function formatCurrency(n){ return '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:0}); }
function uid(prefix='u'){ return prefix + Math.random().toString(36).slice(2,9); }
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Simple auth (demo only, stored in sessionStorage)
const authKey = 'md_current_user';
function getCurrentUser(){ try { return JSON.parse(sessionStorage.getItem(authKey)); } catch(e){ return null; } }
function setCurrentUser(user){ sessionStorage.setItem(authKey, JSON.stringify(user)); }
function clearCurrentUser(){ sessionStorage.removeItem(authKey); }

// Settings defaults / persistence
const settings = {
  darkMode: (localStorage.getItem('md_dark') === '1'),
  emailNotifications: (localStorage.getItem('md_email_notif') !== '0'),
  autoExport: localStorage.getItem('md_auto_export') || 'off',
  currency: localStorage.getItem('md_currency') || 'USD',
  timezone: localStorage.getItem('md_tz') || 'Asia/Manila'
};

function applySettingsToUI(){
  if(settings.darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  const dm = $('#darkModeSwitch'); if(dm){ dm.setAttribute('aria-checked', settings.darkMode); if(settings.darkMode) dm.classList.add('on'); else dm.classList.remove('on'); }
  const en = $('#emailNotifSwitch'); if(en){ en.setAttribute('aria-checked', settings.emailNotifications); if(settings.emailNotifications) en.classList.add('on'); else en.classList.remove('on'); }
  $('#autoExportFreq') && ($('#autoExportFreq').value = settings.autoExport);
  $('#defaultCurrency') && ($('#defaultCurrency').value = settings.currency);
  $('#timezoneSelect') && ($('#timezoneSelect').value = settings.timezone);
}
function persistSettings(){
  localStorage.setItem('md_dark', settings.darkMode ? '1' : '0');
  localStorage.setItem('md_email_notif', settings.emailNotifications ? '1' : '0');
  localStorage.setItem('md_auto_export', settings.autoExport);
  localStorage.setItem('md_currency', settings.currency);
  localStorage.setItem('md_tz', settings.timezone);
}

// Chart instances (keeps references)
let revenueChartInstance = null;
let occupancyChartInstance = null;
let revenuePieChartInstance = null;

// Init
function init(){
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

// Navigation
function attachNav(){
  $$('#nav button').forEach(b=>{
    b.addEventListener('click', ()=>{
      $$('#nav button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const view = b.dataset.view;
      ['overview','users','bookings','reports','settings'].forEach(v=>{
        const el = document.getElementById('view-'+v);
        if(el) el.style.display = (v===view ? '' : 'none');
      });
    });
  });
}

// Populate property selects
function populatePropertyFilter(){
  const top = document.getElementById('propertyFilterTop');
  if(top){ top.innerHTML = '<option value="">All properties</option>'; properties.forEach(p=>{ const opt=document.createElement('option'); opt.value=p.id; opt.textContent=p.name; top.appendChild(opt); }); }
}
function populateRentalPropertyFilter(){
  const sel = $('#rentalPropertyFilter'); if(!sel) return;
  sel.innerHTML = '<option value="">All properties</option>';
  properties.forEach(p=>{ const opt=document.createElement('option'); opt.value=p.id; opt.textContent=p.name; sel.appendChild(opt); });
}

// KPIs and charts
function calculateKPIs(){
  const totalProperties = properties.length;
  const activeBookings = bookings.filter(b=>['confirmed','checked_in'].includes(b.status)).length;
  const occupancyRate = Math.round((activeBookings / Math.max(totalProperties,1)) * 100);
  const monthlyRevenue = rentals.reduce((s,r)=>s+r.gross,0);
  return {totalProperties, activeBookings, occupancyRate, monthlyRevenue};
}
function renderKPIs(){
  const k = calculateKPIs(); const container = $('#kpiRow'); container.innerHTML='';
  const cards = [
    {label:'Total Properties', value:k.totalProperties, trend:'+2'},
    {label:'Active Bookings', value:k.activeBookings, trend:'+1'},
    {label:'Occupancy Rate', value: k.occupancyRate + '%', trend:'+3%'},
    {label:'Monthly Revenue', value: formatCurrency(k.monthlyRevenue), trend:'+8%'},
  ];
  cards.forEach(c=>{ const div=document.createElement('div'); div.className='kpi card'; div.innerHTML=`<div class="label">${c.label}</div><div class="value">${c.value}</div><div class="delta">${c.trend}</div>`; container.appendChild(div); });
  $('#revenueTotal').textContent = formatCurrency(k.monthlyRevenue);
}

// Chart.js: revenue line chart
function renderRevenueChart(){
  const ctx = document.getElementById('revenueChart');
  if(!ctx) return;
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = [200,240,260,300,320,360,400,420,380,460,500,520];
  if(revenueChartInstance){ revenueChartInstance.data.labels = labels; revenueChartInstance.data.datasets[0].data = data; revenueChartInstance.update(); return; }
  revenueChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Revenue',
        data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.16)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { enabled: true, mode: 'index', intersect: false },
        legend: { display: false }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Chart.js: occupancy bar chart
function renderOccupancyChart(){
  const ctx = document.getElementById('occupancyChart');
  if(!ctx) return;
  const types = [...new Set(properties.map(p=>p.type))];
  const data = types.map((t,i)=> 40 + i*15 + Math.floor(Math.random()*20));
  const colors = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  if(occupancyChartInstance){
    occupancyChartInstance.data.labels = types;
    occupancyChartInstance.data.datasets[0].data = data;
    occupancyChartInstance.data.datasets[0].backgroundColor = types.map((_,i)=>colors[i%colors.length]);
    occupancyChartInstance.update();
  } else {
    occupancyChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: types,
        datasets: [{
          label: 'Occupancy Rate (%)',
          data,
          backgroundColor: types.map((_,i)=>colors[i%colors.length])
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { enabled: true },
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }

  const legend = $('#occupancyLegend');
  if(legend){
    legend.innerHTML = '';
    types.forEach((t,i)=>{
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '8px';
      el.innerHTML = `<span style="display:inline-block;width:12px;height:12px;background:${colors[i%colors.length]};border-radius:3px"></span><span class="txt-sm">${t} — ${data[i]}%</span>`;
      legend.appendChild(el);
    });
  }
}

// Revenue pie chart (by property)
function renderRevenuePieChart(){
  // optional: create a small canvas in reports if not present; here we skip if not found
  const el = document.getElementById('revenuePieChart');
  if(!el) return;
  const ctx = el.getContext('2d');
  const revenueByProperty = {};
  rentals.forEach(r=>{
    const prop = properties.find(p=>p.id===r.propertyId);
    if(prop) revenueByProperty[prop.name] = (revenueByProperty[prop.name]||0) + r.gross;
  });
  const labels = Object.keys(revenueByProperty);
  const data = Object.values(revenueByProperty);
  const colors = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  if(revenuePieChartInstance){
    revenuePieChartInstance.data.labels = labels;
    revenuePieChartInstance.data.datasets[0].data = data;
    revenuePieChartInstance.update();
    return;
  }
  revenuePieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label:'Revenue by Property',
        data,
        backgroundColor: labels.map((_,i)=>colors[i%colors.length])
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{position:'bottom'} }
    }
  });
}

function fillUpcoming(){
  const tbody = $('#upcomingChecks tbody'); if(!tbody) return;
  tbody.innerHTML=''; const now=new Date();
  const upcoming = bookings.filter(b=> new Date(b.checkIn) >= now && (new Date(b.checkIn)-now) < (1000*60*60*24*30)).slice(0,5);
  if(!upcoming.length){ tbody.innerHTML = '<tr><td colspan="2" class="muted-sm">No upcoming check-ins</td></tr>'; return; }
  upcoming.forEach(u=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${escapeHtml(u.guest)}</td><td class="muted-sm">${escapeHtml(u.checkIn)}</td>`; tbody.appendChild(tr); });
  const aside = $('#upcomingChecksAside tbody'); if(aside){ aside.innerHTML=''; upcoming.forEach(u=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${escapeHtml(u.guest)}</td><td class="muted-sm">${escapeHtml(u.checkIn)}</td>`; aside.appendChild(tr); }); }
}

// Render role-specific tables with CRUD controls
function renderAllRoleTables(filter=''){
  const f=(filter||'').toLowerCase();
  renderRoleTable('manager','#managerTable tbody',f);
  renderRoleTable('staff','#staffTable tbody',f);
  renderRoleTable('readonly','#readTable tbody',f);
}
function renderRoleTable(role, selector, filterLower){
  const tbody = document.querySelector(selector); if(!tbody) return; tbody.innerHTML = '';
  users.filter(u => u.role===role && (!filterLower || u.name.toLowerCase().includes(filterLower) || u.email.toLowerCase().includes(filterLower)))
    .forEach(u => {
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td style="width:36px"><input type="checkbox" data-uid="${u.id}" class="user-checkbox" /></td>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="switch ${u.status==='active' ? 'on' : ''}" data-uid="${u.id}" role="switch" aria-checked="${u.status==='active'}"><span class="knob"></span></span></td>
        <td class="row-actions">
          <button class="view-user" data-id="${u.id}">View</button>
          <button class="edit-user" data-id="${u.id}">Edit</button>
          <button class="delete-user" data-id="${u.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  $$(selector + ' .view-user').forEach(b=> b.addEventListener('click', ()=> openUserView(b.dataset.id)));
  $$(selector + ' .edit-user').forEach(b=> b.addEventListener('click', ()=> window.openUserEdit ? window.openUserEdit(b.dataset.id) : alert('Edit handler not implemented')));
  $$(selector + ' .delete-user').forEach(b=> b.addEventListener('click', ()=> window.openUserDelete ? window.openUserDelete(b.dataset.id) : deleteUser(b.dataset.id)));
  $$(selector + ' .switch').forEach(sw=> sw.addEventListener('click', ()=> toggleUserStatus(sw.dataset.uid)));
  $$(selector + ' .user-checkbox').forEach(cb=> cb.addEventListener('change', ()=> {
    const row = cb.closest('tr'); if(cb.checked) row.classList.add('selected'); else row.classList.remove('selected');
  }));
}

// CRUD helpers
function createUser(data){ const newUser={id:uid('u'),name:data.name,email:data.email,role:data.role||'staff',status:data.status||'active',joinedAt:new Date().toISOString().slice(0,10),lifetimeRevenue:data.lifetimeRevenue||0}; users.unshift(newUser); renderAllRoleTables($('#userSearch').value||''); }
function updateUser(id,updates){ const u=users.find(x=>x.id===id); if(!u) return; Object.assign(u,updates); renderAllRoleTables($('#userSearch').value||''); }
function deleteUser(id){ users = users.filter(x=>x.id!==id); renderAllRoleTables($('#userSearch').value||''); }
function toggleUserStatus(id){ const u = users.find(x=>x.id===id); if(!u) return; u.status = (u.status === 'active') ? 'inactive' : 'active'; renderAllRoleTables($('#userSearch').value || ''); }

// User slide / transactions
function openUserView(id){
  const u = users.find(x=>x.id===id); if(!u) return;
  const userTx = transactions.filter(t=>t.userId===id).sort((a,b)=> new Date(b.date)-new Date(a.date));
  const txHtml = userTx.length ? userTx.map(tx=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f1f5f9"><div><strong>${escapeHtml(tx.type)}</strong><div class="muted-sm">${escapeHtml(tx.date)} • ${escapeHtml(tx.note||'')}</div></div><div style="text-align:right"><div style="font-weight:700">${formatCurrency(tx.amount)}</div><div class="muted-sm">${escapeHtml(tx.bookingId||'')}</div></div></div>`).join('') : '<div class="muted-sm">No transactions for this user</div>';
  const html = `
    <div style="margin-bottom:8px"><strong>${escapeHtml(u.name)}</strong></div>
    <div class="muted-sm">Email: ${escapeHtml(u.email)}</div>
    <div class="muted-sm">Role: ${escapeHtml(u.role)}</div>
    <div class="muted-sm">Status: ${escapeHtml(u.status)}</div>
    <div style="margin-top:12px;display:flex;gap:8px;">
      <button class="btn" id="impersonateBtn">Impersonate</button>
      <button class="btn ghost" id="openTxBtn">Transactions</button>
      <button class="btn warn" id="editFromViewBtn">Edit</button>
    </div>
    <div style="margin-top:12px">
      <div style="font-weight:600;margin-bottom:8px">Recent transactions</div>
      <div>${txHtml}</div>
    </div>`;
  openSlide('User: ' + u.name, html);
  setTimeout(()=> {
    $('#impersonateBtn')?.addEventListener('click', ()=> alert('Impersonation demo: ' + u.email));
    $('#openTxBtn')?.addEventListener('click', ()=> openTransactionsPanel(u.id));
    $('#editFromViewBtn')?.addEventListener('click', ()=> { closeSlide(); if(window.openUserEdit) window.openUserEdit(u.id); else alert('Edit handler not implemented'); });
  },50);
}

function openTransactionsPanel(userId){
  const u = users.find(x=>x.id===userId); if(!u) return;
  const userTx = transactions.filter(t=>t.userId===userId).sort((a,b)=> new Date(b.date)-new Date(a.date));
  $('#txnPanelTitle').textContent = `Transactions — ${u.name}`;
  $('#txnPanelSub').textContent = `Showing ${userTx.length} transaction(s)`;
  const container = $('#txnList'); container.innerHTML = '';
  if(!userTx.length){ container.innerHTML = '<div class="muted-sm">No transactions found</div>'; $('#userTransactionsPanel').style.display = ''; return; }
  userTx.forEach(tx => {
    const div = document.createElement('div'); div.className='txn-item';
    div.innerHTML = `<div><div style="font-weight:600">${escapeHtml(tx.type)}</div><div class="muted-sm">${escapeHtml(tx.date)} • ${escapeHtml(tx.note||'')}</div></div><div style="text-align:right"><div style="font-weight:700">${formatCurrency(tx.amount)}</div><div class="muted-sm">${escapeHtml(tx.bookingId||'')}</div></div>`;
    container.appendChild(div);
  });
  $('#userTransactionsPanel').style.display = '';
  $('#userTransactionsPanel').scrollIntoView({behavior:'smooth', block:'center'});
}
$('#closeTxnPanel').addEventListener('click', ()=> { $('#userTransactionsPanel').style.display = 'none'; });

// Bookings & rentals population
function populateBookingsAndRentals(){
  populateBookingsTable();
  populateRentalsTable();
  $('#bookingsCount').textContent = bookings.length;
  $('#rentalsCount').textContent = rentals.length;
  const top = document.getElementById('topProperties'); if(top){ const counts = {}; rentals.concat(bookings).forEach(r=>{ const pid = r.propertyId; if(pid) counts[pid] = (counts[pid]||0)+1; }); top.innerHTML = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).slice(0,5).map(id=>{ const p = properties.find(x=>x.id===id); return `<li>${p ? p.name : id} — ${counts[id]}</li>`; }).join('') || '<li class="muted-sm">No data</li>'; }
}

function populateBookingsTable(){
  const tbody = $('#bookingsTable tbody'); if(!tbody) return; tbody.innerHTML='';
  bookings.forEach(b=>{
    const prop = properties.find(p=>p.id===b.propertyId) || {name:'Unknown'};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${prop.name}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`;
    tbody.appendChild(tr);
  });
  $$('.view-booking').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; const booking = bookings.find(x=>x.id===id); if(!booking) return; const prop = properties.find(p=>p.id===booking.propertyId) || {}; const html = `<div style="margin-bottom:8px"><strong>${booking.id}</strong></div><div class="muted-sm">Guest: ${escapeHtml(booking.guest)}</div><div class="muted-sm">Property: ${prop.name || ''}</div><div class="muted-sm">Period: ${booking.checkIn} → ${booking.checkOut} (${booking.nights} nights)</div><div style="margin-top:8px; font-weight:700">${formatCurrency(booking.amount)}</div><div style="margin-top:12px"><button class="btn" id="checkInBtn">Mark as checked-in</button><button class="btn ghost" id="cancelBookingBtn">Cancel</button></div>`; openSlide('Booking ' + booking.id, html); setTimeout(()=> { $('#checkInBtn')?.addEventListener('click', ()=>{ booking.status='checked_in'; populateBookingsTable(); renderKPIs(); fillUpcoming(); closeSlide(); }); $('#cancelBookingBtn')?.addEventListener('click', ()=>{ booking.status='cancelled'; populateBookingsTable(); renderKPIs(); fillUpcoming(); closeSlide(); }); },50); }));
}

function populateRentalsTable(){
  const tbody = $('#rentalsTable tbody'); if(!tbody) return; tbody.innerHTML='';
  rentals.forEach(r=>{
    const prop = properties.find(p=>p.id===r.propertyId) || {};
    const booking = bookings.find(b=>b.id===r.bookingId) || {};
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.id}</td><td>${prop.name || ''}</td><td>${escapeHtml(booking.guest || '')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`; tbody.appendChild(tr);
  });
  const tbodyFull = $('#rentalsFullTable tbody'); if(tbodyFull){ tbodyFull.innerHTML=''; rentals.forEach(r=>{ const prop = properties.find(p=>p.id===r.propertyId) || {}; const b = bookings.find(x=>x.id===r.bookingId) || {}; const tr=document.createElement('tr'); tr.innerHTML = `<td>${r.id}</td><td>${r.bookingId}</td><td>${prop.name || ''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`; tbodyFull.appendChild(tr); }); }
}

function renderStatus(s){ const cls = s==='cancelled' ? 'danger' : (s==='checked_in' ? 'success' : 'warn'); return `<span class="pill ${cls}">${s.replace('_',' ')}</span>`; }

// Slide controls
function openSlide(title, html){ $('#slideTitle').textContent = title; $('#slideBody').innerHTML = html; $('#slide').classList.add('open'); $('#overlay').classList.add('show'); $('#slide').setAttribute('aria-hidden','false'); }
function closeSlide(){ $('#slide').classList.remove('open'); $('#overlay').classList.remove('show'); $('#slide').setAttribute('aria-hidden','true'); }
$('#closeSlide').addEventListener('click', closeSlide); $('#overlay').addEventListener('click', closeSlide);

// CSV export helper
function exportCSV(filename, rows){
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename||'export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// Auth UI
function renderAuthArea(){
  const authArea = $('#authArea'); if(!authArea) return;
  const user = getCurrentUser();
  authArea.innerHTML = '';
  if(user){
    const span = document.createElement('div'); span.className='small-muted'; span.textContent = user.name + ' (' + user.role + ')';
    const btn = document.createElement('button'); btn.className='btn ghost'; btn.id='logoutBtn'; btn.textContent='Logout';
    authArea.appendChild(span); authArea.appendChild(btn);
    $('#logoutBtn').addEventListener('click', ()=> { clearCurrentUser(); renderAuthArea(); });
  } else {
    const loginBtn = document.createElement('button'); loginBtn.className='btn'; loginBtn.id='loginBtn'; loginBtn.textContent='Login';
    authArea.appendChild(loginBtn);
    $('#loginBtn').addEventListener('click', openLoginModal);
  }
}

function openLoginModal(){
  const html = `<div style="font-weight:700;margin-bottom:8px">Sign in</div>
    <div class="form-row"><div class="col"><input id="li_email" class="input" placeholder="Email" /></div></div>
    <div class="form-row"><div class="col"><input id="li_password" class="input" placeholder="Password" type="password" /></div></div>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" id="doLogin">Sign in</button><button class="btn ghost" id="cancelLogin">Cancel</button></div>
    <div class="muted-sm" style="margin-top:10px">Demo sign-in: use any email from mock users list (no real auth)</div>`;
  openSlide('Login', html);
  setTimeout(()=> {
    $('#cancelLogin')?.addEventListener('click', closeSlide);
    $('#doLogin')?.addEventListener('click', ()=> {
      const email = ($('#li_email').value || '').trim().toLowerCase();
      if(!email){ alert('Enter email'); return; }
      const u = users.find(x => x.email.toLowerCase() === email) || {id: uid('u'), name: email.split('@')[0], email, role:'readonly', status:'active'};
      setCurrentUser({id:u.id, name:u.name, email:u.email, role:u.role});
      closeSlide();
      renderAuthArea();
    });
  },50);
}

// Attach listeners and wire CRUD buttons + bulk actions + settings + auth
function attachListeners(){
  $('#addUserBtn').addEventListener('click', openCreateUser);
  $('#openCreateUser').addEventListener('click', openCreateUser);
  $('#addBookingBtn').addEventListener('click', ()=> openModalNewBooking());
  $('#newBooking').addEventListener('click', ()=> openModalNewBooking());

  $('#userSearch').addEventListener('input', e=> renderAllRoleTables(e.target.value || ''));
  $('#roleFilter').addEventListener('change', ()=> filterByRole($('#roleFilter').value));

  $('#exportUsers').addEventListener('click', ()=> {
    const rows=[['Name','Email','Role','Status','JoinedAt','LifetimeRevenue']]; users.forEach(u=> rows.push([u.name,u.email,u.role,u.status,u.joinedAt||'',u.lifetimeRevenue||0])); exportCSV('users.csv', rows);
  });
  $('#exportCSV').addEventListener('click', ()=> {
    const rows=[['Booking ID','Guest','Property','Check-in','Check-out','Nights','Amount','Status']]; bookings.forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId) || {}; rows.push([b.id,b.guest,p.name||'',b.checkIn,b.checkOut,b.nights,b.amount,b.status]); }); exportCSV('bookings.csv', rows);
  });
  $('#exportBookingsRentals').addEventListener('click', ()=> {
    const rows=[['Type','ID','Property','Guest','Period','Nights','Gross/Amount','Net/Status']];
    bookings.forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId) || {}; rows.push(['Booking',b.id,p.name||'',b.guest, b.checkIn + ' → ' + b.checkOut, b.nights, b.amount, b.status]); });
    rentals.forEach(r=>{ const p = properties.find(x=>x.id===r.propertyId) || {}; const b = bookings.find(x=>x.id===r.bookingId) || {}; rows.push(['Rental',r.id,p.name||'', b.guest||'', r.periodStart + ' → ' + r.periodEnd, r.nights, r.gross, r.net]); });
    exportCSV('bookings_rentals.csv', rows);
  });

  // Bulk per panel
  $('#managerEnable').addEventListener('click', ()=> { const ids = getSelectedIdsIn('#managerTable'); if(ids.length) bulkSet(ids,'active'); else alert('Select managers'); });
  $('#managerDisable').addEventListener('click', ()=> { const ids = getSelectedIdsIn('#managerTable'); if(ids.length) bulkSet(ids,'inactive'); else alert('Select managers'); });
  $('#staffEnable').addEventListener('click', ()=> { const ids = getSelectedIdsIn('#staffTable'); if(ids.length) bulkSet(ids,'active'); else alert('Select staff'); });
  $('#staffDisable').addEventListener('click', ()=> { const ids = getSelectedIdsIn('#staffTable'); if(ids.length) bulkSet(ids,'inactive'); else alert('Select staff'); });
  $('#readEnable').addEventListener('click', ()=> { const ids = getSelectedIdsIn('#readTable'); if(ids.length) bulkSet(ids,'active'); else alert('Select read-only users'); });
  $('#readDisable').addEventListener('click', ()=> { const ids = getSelectedIdsIn('#readTable'); if(ids.length) bulkSet(ids,'inactive'); else alert('Select read-only users'); });

  // Select-all checkboxes
  $('#selectAllManager').addEventListener('change', e=> selectAllIn('#managerTable', e.target.checked));
  $('#selectAllStaff').addEventListener('change', e=> selectAllIn('#staffTable', e.target.checked));
  $('#selectAllRead').addEventListener('change', e=> selectAllIn('#readTable', e.target.checked));

  // Booking & rentals search & filter (combined)
  $('#bookingSearch').addEventListener('input', e=>{
    const q=e.target.value.toLowerCase(); const tbodyB=$('#bookingsTable tbody'); const tbodyR=$('#rentalsTable tbody');
    tbodyB.innerHTML=''; tbodyR.innerHTML='';
    bookings.filter(b=> b.id.toLowerCase().includes(q) || b.guest.toLowerCase().includes(q) || (b.propertyId && properties.find(p=>p.id===b.propertyId).name.toLowerCase().includes(q))).forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId)||{}; const tr=document.createElement('tr'); tr.innerHTML=`<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${p.name||''}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`; tbodyB.appendChild(tr); });
    rentals.filter(r=> r.id.toLowerCase().includes(q) || (r.bookingId && bookings.find(b=>b.id===r.bookingId)?.guest.toLowerCase().includes(q)) || (r.propertyId && properties.find(p=>p.id===r.propertyId).name.toLowerCase().includes(q))).forEach(r=>{ const p = properties.find(x=>x.id===r.propertyId)||{}; const b = bookings.find(x=>x.id===r.bookingId)||{}; const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.id}</td><td>${p.name||''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`; tbodyR.appendChild(tr); });
  });
  $('#bookingStatusFilter').addEventListener('change', e=>{
    const val=e.target.value; const tbodyB=$('#bookingsTable tbody'); tbodyB.innerHTML='';
    bookings.filter(b=> !val || b.status===val).forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId)||{}; const tr=document.createElement('tr'); tr.innerHTML=`<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${p.name||''}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`; tbodyB.appendChild(tr); });
  });

  $('#propertyFilterTop')?.addEventListener('change', e=>{
    const pid = e.target.value; const tbodyB=$('#bookingsTable tbody'); const tbodyR=$('#rentalsTable tbody'); tbodyB.innerHTML=''; tbodyR.innerHTML='';
    bookings.filter(b=> !pid || b.propertyId===pid).forEach(b=>{ const p = properties.find(x=>x.id===b.propertyId)||{}; const tr=document.createElement('tr'); tr.innerHTML=`<td>${b.id}</td><td>${escapeHtml(b.guest)}</td><td>${p.name||''}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.nights}</td><td>${formatCurrency(b.amount)}</td><td>${renderStatus(b.status)}</td><td class="row-actions"><button data-id="${b.id}" class="view-booking">Details</button></td>`; tbodyB.appendChild(tr); });
    rentals.filter(r=> !pid || r.propertyId===pid).forEach(r=>{ const p = properties.find(x=>x.id===r.propertyId)||{}; const b = bookings.find(x=>x.id===r.bookingId)||{}; const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.id}</td><td>${p.name||''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`; tbodyR.appendChild(tr); });
  });

  // Rentals full export filter
  $('#rentalPropertyFilter')?.addEventListener('change', e=>{
    const pid=e.target.value; const tbody = $('#rentalsFullTable tbody'); if(!tbody) return; tbody.innerHTML='';
    rentals.filter(r=> !pid || r.propertyId===pid).forEach(r=>{ const p = properties.find(x=>x.id===r.propertyId) || {}; const b = bookings.find(x=>x.id===r.bookingId) || {}; const tr=document.createElement('tr'); tr.innerHTML = `<td>${r.id}</td><td>${r.bookingId}</td><td>${p.name || ''}</td><td>${escapeHtml(b.guest||'')}</td><td>${r.periodStart} → ${r.periodEnd}</td><td>${r.nights}</td><td>${formatCurrency(r.gross)}</td><td>${formatCurrency(r.net)}</td>`; tbody.appendChild(tr); });
  });

  // Create booking/user shortcuts
  document.addEventListener('keydown', e=> { if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='n'){ e.preventDefault(); openCreateUser(); } });

  // Notification button
  $('#notifBtn')?.addEventListener('click', ()=> {
    const alerts = getAlerts();
    const html = `<div style="font-weight:700;margin-bottom:8px">Notifications</div>
      <div class="muted-sm">${alerts.length} notification(s)</div>
      <div style="margin-top:12px">${alerts.length ? alerts.map(a=>`<div style="padding:8px;border-bottom:1px dashed #f1f5f9"><div style="font-weight:600">${escapeHtml(a.title)}</div><div class="muted-sm">${escapeHtml(a.body)}</div></div>`).join('') : '<div class="muted-sm">No notifications</div>'}</div>`;
    openSlide('Notifications', html);
  });

  // Settings controls
  $('#darkModeSwitch')?.addEventListener('click', ()=>{
    settings.darkMode = !settings.darkMode; persistSettings(); applySettingsToUI();
  });
  $('#emailNotifSwitch')?.addEventListener('click', ()=>{
    settings.emailNotifications = !settings.emailNotifications; persistSettings(); applySettingsToUI();
  });
  $('#autoExportFreq')?.addEventListener('change', e=>{ settings.autoExport = e.target.value; persistSettings(); });
  $('#defaultCurrency')?.addEventListener('change', e=>{ settings.currency = e.target.value; persistSettings(); });
  $('#timezoneSelect')?.addEventListener('change', e=>{ settings.timezone = e.target.value; persistSettings(); });

  // Export rentals
  $('#exportRentals')?.addEventListener('click', ()=> {
    const rows=[['Rental ID','Booking ID','Property','Guest','Period','Nights','Gross','Net']]; rentals.forEach(r=>{ const p = properties.find(x=>x.id===r.propertyId)||{}; const b = bookings.find(x=>x.id===r.bookingId)||{}; rows.push([r.id,r.bookingId,p.name||'', b.guest||'', r.periodStart + ' → ' + r.periodEnd, r.nights, r.gross, r.net]); }); exportCSV('rentals.csv', rows);
  });

  // Refresh
  $('#refreshBtn')?.addEventListener('click', ()=> { renderAllRoleTables($('#userSearch').value || ''); populateBookingsAndRentals(); renderKPIs(); });
}

// Bulk helpers & others
function getSelectedIdsIn(tableSelector){ return Array.from(document.querySelectorAll(tableSelector + ' .user-checkbox')).filter(c=>c.checked).map(c=>c.dataset.uid); }
function bulkSet(ids, status){ ids.forEach(id => { const u = users.find(x=>x.id===id); if(u) u.status = status; }); renderAllRoleTables($('#userSearch').value || ''); }
function bulkDelete(ids){ users = users.filter(u => !ids.includes(u.id)); renderAllRoleTables($('#userSearch').value || ''); }
function selectAllIn(tableSelector, checked){ Array.from(document.querySelectorAll(tableSelector + ' .user-checkbox')).forEach(cb=>{ cb.checked=checked; cb.dispatchEvent(new Event('change')); }); }

// Alerts / notifications
function getAlerts(){
  const alerts = []; const now = new Date();
  bookings.forEach(b => { const diff = (new Date(b.checkIn) - now) / (1000*60*60*24); if(diff >=0 && diff <= 7 && b.status === 'confirmed') alerts.push({title:`Upcoming check-in: ${b.guest}`, body:`${b.id} • ${b.checkIn}`}); if(b.status === 'cancelled') alerts.push({title:`Cancelled booking: ${b.id}`, body: `${b.guest}`}); });
  return alerts;
}
function updateNotifBadge(){ const alerts = getAlerts(); const badge = $('#notifBadge'); if(!badge) return; if(alerts.length){ badge.style.display='inline-block'; badge.textContent = String(alerts.length); } else { badge.style.display='none'; } }

// Small helpers & placeholders for missing UI pieces
function openCreateUser(){
  const html = `<div style="font-weight:700;margin-bottom:8px">Create user</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <input id="cu_name" class="input" placeholder="Name" />
      <input id="cu_email" class="input" placeholder="Email" />
      <select id="cu_role" class="select"><option value="staff">Staff</option><option value="manager">Manager</option><option value="readonly">Read-only</option></select>
      <div style="display:flex;gap:8px"><button class="btn" id="cu_create">Create</button><button class="btn ghost" id="cu_cancel">Cancel</button></div>
    </div>`;
  openSlide('New user', html);
  setTimeout(()=>{
    $('#cu_cancel')?.addEventListener('click', closeSlide);
    $('#cu_create')?.addEventListener('click', ()=>{
      const name = ($('#cu_name').value||'').trim(); const email = ($('#cu_email').value||'').trim().toLowerCase();
      if(!name || !email){ alert('Enter name and email'); return; }
      createUser({name,email,role:$('#cu_role').value}); closeSlide();
    });
  },50);
}
function openModalNewBooking(){
  const html = `<div style="font-weight:700;margin-bottom:8px">New booking</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <input id="nb_guest" class="input" placeholder="Guest name" />
      <select id="nb_property" class="select">${properties.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select>
      <input id="nb_checkin" class="input" placeholder="Check-in YYYY-MM-DD" />
      <input id="nb_checkout" class="input" placeholder="Check-out YYYY-MM-DD" />
      <div style="display:flex;gap:8px"><button class="btn" id="nb_create">Create</button><button class="btn ghost" id="nb_cancel">Cancel</button></div>
    </div>`;
  openSlide('New booking', html);
  setTimeout(()=>{
    $('#nb_cancel')?.addEventListener('click', closeSlide);
    $('#nb_create')?.addEventListener('click', ()=>{
      const guest = ($('#nb_guest').value||'').trim(); const pid = $('#nb_property').value; const ci = ($('#nb_checkin').value||'').trim(); const co = ($('#nb_checkout').value||'').trim();
      if(!guest||!pid||!ci||!co){ alert('Complete fields'); return; }
      const nights = Math.max(1, (new Date(co) - new Date(ci))/(1000*60*60*24) || 1);
      const amount = 100 * nights;
      const id = 'B-' + (Math.random().toString().slice(2,7));
      bookings.unshift({id,guest,propertyId:pid,checkIn:ci,checkOut:co,nights,amount,status:'confirmed',paymentStatus:'pending',createdAt:new Date().toISOString().slice(0,10)});
      populateBookingsAndRentals(); renderKPIs(); fillUpcoming(); closeSlide();
    });
  },50);
}
function filterByRole(role){
  if(!role){ renderAllRoleTables($('#userSearch').value||''); return; }
  renderAllRoleTables('');
  // hide panels that are not the selected role for clarity (optional)
  ['managerTable','staffTable','readTable'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    if((role==='manager' && id==='managerTable') || (role==='staff' && id==='staffTable') || (role==='readonly' && id==='readTable')) el.closest('.card').style.display='';
    else el.closest('.card').style.display='none';
  });
}

// Init
init();
