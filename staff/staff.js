/* ========= Mock data ========= */
let bookings = [
  {id:'B-1001', guest:'John Doe', propertyId:'p1', checkIn:'2025-10-25', checkOut:'2025-10-29', nights:4, amount:480, status:'confirmed'},
  {id:'B-1002', guest:'Sarah Lee', propertyId:'p2', checkIn:'2025-10-30', checkOut:'2025-11-02', nights:3, amount:300, status:'cancelled'}
];
let rentals = [
  {id:'R-2001', bookingId:'B-1001', propertyId:'p1', periodStart:'2025-10-25', periodEnd:'2025-10-29', nights:4, gross:480, net:384}
];
let properties = [
  {id:'p1', name:'Seaside Villa'}, {id:'p2', name:'City Loft'}
];

/* ========= Helpers ========= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function formatCurrency(n){ return '$' + (Number(n)||0).toLocaleString(); }

/* ========= Init ========= */
document.addEventListener('DOMContentLoaded', init);
function init(){
  attachNav();
  renderKPIs();
  renderRevenueChart();
  fillUpcoming();
  populateBookingsAndRentals();
  attachListeners();
  applySettingsToUI();
}

/* ========= NAV ========= */
function attachNav(){
  $$('#nav button').forEach(b=>{
    b.addEventListener('click', ()=>{
      $$('#nav button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const view = b.dataset.view;
      ['overview','bookings','settings'].forEach(v=>{
        const el = document.getElementById('view-'+v);
        if(el) el.style.display = (v===view?'':'none');
      });
    });
  });
}

/* ========= KPIs ========= */
function renderKPIs(){
  const container = $('#kpiRow');
  container.innerHTML = '';
  const cards = [
    {label:'Total Bookings', value: bookings.length},
    {label:'Total Rentals', value: rentals.length}
  ];
  cards.forEach(c=>{
    const d = document.createElement('div');
    d.className='kpi';
    d.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
    container.appendChild(d);
  });
}

/* ========= Charts ========= */
function renderRevenueChart(){
  const el = $('#revenueChart'); if(!el) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type:'line',
    data:{ labels:['Jan','Feb','Mar'], datasets:[{label:'Revenue', data:[200,300,400], borderColor:'#016B61'}]},
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

/* ========= Upcoming ========= */
function fillUpcoming(){
  const tbody = $('#upcomingChecks tbody'); tbody.innerHTML='';
  const now = new Date();
  const upcoming = bookings.filter(b=> new Date(b.checkIn)>=now).slice(0,5);
  if(!upcoming.length){ tbody.innerHTML='<tr><td colspan="2">No upcoming</td></tr>'; return; }
  upcoming.forEach(u=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${u.guest}</td><td>${u.checkIn}</td>`;
    tbody.appendChild(tr);
  });
}

/* ========= CRUD ========= */
function createBooking(data){
  const b={id:'B-'+Math.floor(Math.random()*9000+1000),...data,status:'confirmed'};
  bookings.unshift(b);
  populateBookingsAndRentals();
  renderKPIs();
  fillUpcoming();
}
function updateBooking(id,updates){
  const b=bookings.find(x=>x.id===id); if(!b) return;
  Object.assign(b,updates);
  populateBookingsAndRentals();
}
function deleteBooking(id){
  bookings=bookings.filter(x=>x.id!==id);
  populateBookingsAndRentals();
  renderKPIs();
}

/* ========= Tables ========= */
function populateBookingsAndRentals(){
  // --- Bookings ---
  const tbody=$('#bookingsTable tbody'); tbody.innerHTML='';
  bookings.forEach(b=>{
    const prop=properties.find(p=>p.id===b.propertyId)||{};
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${b.id}</td>
      <td>${b.guest}</td>
      <td>${prop.name||''}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td>${b.nights}</td>
      <td>${formatCurrency(b.amount)}</td>
      <td>${b.status}</td>
      <td>
        <button class="btn ghost view-booking" data-id="${b.id}">View</button>
        <button class="btn danger delete-booking" data-id="${b.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // attach booking actions
  $$('.view-booking').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.id;
      const b=bookings.find(x=>x.id===id);
      if(!b) return;
      const prop=properties.find(p=>p.id===b.propertyId)||{};
      openSlide('Booking '+b.id,`
        <div><strong>${b.guest}</strong></div>
        <div class="muted-sm">Property: ${prop.name||''}</div>
        <div class="muted-sm">Period: ${b.checkIn} → ${b.checkOut}</div>
        <div style="margin-top:8px;font-weight:700">${formatCurrency(b.amount)}</div>
        <div style="margin-top:12px">
          <button id="checkInBtn" class="btn">Mark Checked-in</button>
          <button id="cancelBtn" class="btn ghost">Cancel</button>
        </div>
      `);
      setTimeout(()=>{
        $('#checkInBtn')?.addEventListener('click',()=>{ updateBooking(id,{status:'checked_in'}); closeSlide(); });
        $('#cancelBtn')?.addEventListener('click',()=>{ updateBooking(id,{status:'cancelled'}); closeSlide(); });
      },50);
    });
  });
  $$('.delete-booking').forEach(btn=>{
    btn.addEventListener('click',()=> deleteBooking(btn.dataset.id));
  });

  // --- Rentals ---
  const rtbody=$('#rentalsTable tbody'); rtbody.innerHTML='';
  rentals.forEach(r=>{
    const prop=properties.find(p=>p.id===r.propertyId)||{};
    const booking=bookings.find(b=>b.id===r.bookingId)||{};
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${r.id}</td>
      <td>${prop.name||''}</td>
      <td>${booking.guest||''}</td>
      <td>${r.periodStart} → ${r.periodEnd}</td>
      <td>${r.nights}</td>
      <td>${formatCurrency(r.gross)}</td>
      <td>${formatCurrency(r.net)}</td>`;
    rtbody.appendChild(tr);
  });

  $('#bookingsCount').textContent = bookings.length;
  $('#rentalsCount').textContent = rentals.length;
}

/* ========= Slide Panel ========= */
function openSlide(title,html){
  $('#slideTitle').textContent=title;
  $('#slideBody').innerHTML=html;
  $('#slide').classList.add('open');
}
function closeSlide(){
  $('#slide').classList.remove('open');
}
$('#closeSlide')?.addEventListener('click',closeSlide);

/* ========= Listeners ========= */
function attachListeners(){
  $('#addBookingBtn')?.addEventListener('click',()=>{
    const guest=prompt('Guest name?');
    const propertyId=prompt('Property ID? (p1/p2)');
    const checkIn=prompt('Check-in date (YYYY-MM-DD)?');
    const checkOut=prompt('Check-out date (YYYY-MM-DD)?');
    const nights=prompt('Nights?');
    const amount=prompt('Amount?');
    if(guest && propertyId && checkIn && checkOut){
      createBooking({guest,propertyId,checkIn,checkOut,nights,amount});
    }
  });
}

/* ========= Settings ========= */
const settings = {
  darkMode: localStorage.getItem('md_dark') === '1',
  emailNotifications: localStorage.getItem('md_email_notif') !== '0',
  currency: localStorage.getItem('md_currency') || 'USD'
};

function applySettingsToUI(){
  // Apply theme class to the root
  document.documentElement.classList.toggle('dark', settings.darkMode);
  // Reflect in the settings switch UI if present
  const dmSwitch = document.getElementById('darkModeSwitchSettings');
  if (dmSwitch) {
    dmSwitch.classList.toggle('on', settings.darkMode);
    dmSwitch.setAttribute('aria-checked', settings.darkMode ? 'true' : 'false');
  }
  // Set currency dropdown value
  const cur = document.getElementById('defaultCurrency');
  if (cur) cur.value = settings.currency;
}

function persistSettings(){
  localStorage.setItem('md_dark', settings.darkMode ? '1' : '0');
  localStorage.setItem('md_email_notif', settings.emailNotifications ? '1' : '0');
  localStorage.setItem('md_currency', settings.currency);
}

// Attach listeners once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Settings switch in the Settings page
  const dmSwitch = document.getElementById('darkModeSwitchSettings');
  if (dmSwitch) {
    dmSwitch.addEventListener('click', () => {
      settings.darkMode = !settings.darkMode;
      persistSettings();
      applySettingsToUI();
    });
  }

  // Optional topbar quick toggle
  const dmTopbar = document.getElementById('darkModeTopbarToggle');
  if (dmTopbar) {
    dmTopbar.addEventListener('click', () => {
      settings.darkMode = !settings.darkMode;
      persistSettings();
      applySettingsToUI();
    });
  }

  // Email notifications
  const emailSwitch = document.getElementById('emailNotifSwitch');
  if (emailSwitch) {
    // Initialize the UI state
    emailSwitch.classList.toggle('on', settings.emailNotifications);
    emailSwitch.setAttribute('aria-checked', settings.emailNotifications ? 'true' : 'false');
    // Toggle handler
    emailSwitch.addEventListener('click', () => {
      settings.emailNotifications = !settings.emailNotifications;
      emailSwitch.classList.toggle('on', settings.emailNotifications);
      emailSwitch.setAttribute('aria-checked', settings.emailNotifications ? 'true' : 'false');
      persistSettings();
    });
  }

  // Currency dropdown
  const currencySelect = document.getElementById('defaultCurrency');
  if (currencySelect) {
    currencySelect.value = settings.currency;
    currencySelect.addEventListener('change', (e) => {
      settings.currency = e.target.value;
      persistSettings();
    });
  }

  // Initial apply (in case this runs before your main init)
  applySettingsToUI();
});
