/* ============================
   RentEase Main JavaScript
   ============================ */

/* Basic sample data */
let SAMPLE_PROPERTIES = [
  { id:'p1', title:'Sunny 2BR Apartment near Downtown', location:'Dagupan, Pangasinan', price:18500, beds:2, baths:1, img:'https://images.unsplash.com/photo-1572120360610-d971b9b4f72a?auto=format&fit=crop&w=1000&q=60', verified:true, description:'Bright and airy 2-bedroom apartment, walking distance to shops and parks.' },
  { id:'p2', title:'Cozy Studio with Balcony', location:'Laoag, Ilocos Norte', price:9500, beds:0, baths:1, img:'https://images.unsplash.com/photo-1560448075-93bdd7aab53d?auto=format&fit=crop&w=1000&q=60', verified:true, description:'Compact studio perfect for singles or students.' },
  { id:'p3', title:'Modern 3BR House with Yard', location:'San Fernando, La Union', price:32000, beds:3, baths:2, img:'https://images.unsplash.com/photo-1600585154340-be6161b88a09?auto=format&fit=crop&w=1000&q=60', verified:false, description:'Spacious family house, quiet neighborhood.' },
  { id:'p4', title:'Luxury Condo with Pool Access', location:'Vigan, Ilocos Sur', price:42000, beds:2, baths:2, img:'https://images.unsplash.com/photo-1600585153749-cc8b1d3f8d64?auto=format&fit=crop&w=1000&q=60', verified:true, description:'High-rise living with gym and pool.' }
];

const SAMPLE_LOCATIONS = [
  { id:'l1', name:'Dagupan', region:'Ilocos Region', img:'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1000&q=60' },
  { id:'l2', name:'Laoag', region:'Ilocos Norte', img:'https://images.unsplash.com/photo-1505842465776-3a91b1cc04b7?auto=format&fit=crop&w=1000&q=60' },
  { id:'l3', name:'San Fernando', region:'La Union', img:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=60' },
  { id:'l4', name:'Vigan', region:'Ilocos Sur', img:'https://images.unsplash.com/photo-1501959915551-4e8e3c30b2c6?auto=format&fit=crop&w=1000&q=60' }
];

/* DOM refs */
const featuredContainer = document.getElementById('featuredProperties');
const locationsContainer = document.getElementById('locationsList');
const searchForm = document.getElementById('searchForm');
const subscribeForm = document.getElementById('subscribeForm');
const subscribeEmail = document.getElementById('email');

const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const exploreMoreNav = document.getElementById('exploreMoreNav');

const notifBtn = document.getElementById('notifBtn');
const notifBadge = document.getElementById('notifBadge');

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

let notifications = [];
let currentUser = null;

/* Utilities */
function formatPrice(n){ return '₱' + Number(n).toLocaleString(); }

/* Create DOM cards */
function createCardForProperty(p){
  const div = document.createElement('article');
  div.className = 'card';
  div.tabIndex = 0;
  div.setAttribute('role','button');
  div.setAttribute('aria-label',`Open details for ${p.title}`);
  div.innerHTML = `
    <img src="${p.img}" alt="${p.title}">
    <div class="card-body">
      <h3>${p.title}</h3>
      <div class="meta"><span>${p.location}</span><span class="price">${formatPrice(p.price)}</span></div>
      <div class="meta" aria-hidden="true"><span>${p.beds} beds · ${p.baths} baths</span><span>${p.verified ? 'Verified' : 'Unverified'}</span></div>
      <div class="actions">
        <button class="btn btn-outline details-btn" data-id="${p.id}" type="button">View</button>
        <button class="btn btn-primary book-btn" data-id="${p.id}" type="button">Book</button>
      </div>
    </div>
  `;
  return div;
}

function createCardForLocation(l){
  const div = document.createElement('article');
  div.className = 'card';
  div.tabIndex = 0;
  div.setAttribute('role','button');
  div.setAttribute('aria-label',`Explore ${l.name}`);
  div.innerHTML = `
    <img src="${l.img}" alt="${l.name}">
    <div class="card-body">
      <h3>${l.name}</h3>
      <div class="meta"><span>${l.region}</span><span></span></div>
      <div class="actions"><button class="btn btn-primary explore-btn" data-name="${l.name}" type="button">Explore</button></div>
    </div>
  `;
  return div;
}

/* Renderers */
function renderFeatured(properties=SAMPLE_PROPERTIES){
  if(!featuredContainer) return;
  featuredContainer.innerHTML = '';
  if(!properties.length){
    const p = document.createElement('p'); p.textContent = 'No properties found for your search.'; featuredContainer.appendChild(p); return;
  }
  const frag = document.createDocumentFragment();
  properties.forEach(x => frag.appendChild(createCardForProperty(x)));
  featuredContainer.appendChild(frag);
}

function renderLocations(locations=SAMPLE_LOCATIONS){
  if(!locationsContainer) return;
  locationsContainer.innerHTML = '';
  const frag = document.createDocumentFragment();
  locations.forEach(x => frag.appendChild(createCardForLocation(x)));
  locationsContainer.appendChild(frag);
}

/* Modal helper */
let lastFocused = null;
function showModal(contentHtml, focusSelector){
  lastFocused = document.activeElement;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.tabIndex = -1;
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${contentHtml}</div>`;
  document.body.appendChild(backdrop);
  const focusEl = backdrop.querySelector(focusSelector) || backdrop.querySelector('button, input, a');
  if (focusEl) focusEl.focus();
  function closeModal(){
    const b = document.querySelector('.modal-backdrop'); if(b) b.remove();
    if(lastFocused) lastFocused.focus();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){ if(e.key === 'Escape') closeModal(); }
  document.addEventListener('keydown', onKey);
  backdrop.addEventListener('click', (e)=> { if(e.target === backdrop) closeModal(); });
  return { close: closeModal, root: backdrop };
}

/* Property modal */
function openPropertyModal(prop){
  const content = `
    <div class="modal-grid">
      <div><img src="${prop.img}" alt="${prop.title}"></div>
      <div>
        <h2 id="modalTitle">${prop.title}</h2>
        <p style="color:#6b7280;">${prop.location} · <strong>${formatPrice(prop.price)}</strong></p>
        <p style="margin-top:10px;">${prop.description}</p>
        <ul style="margin-top:10px; color:#6b7280;">
          <li>Beds: ${prop.beds}</li>
          <li>Baths: ${prop.baths}</li>
          <li>${prop.verified ? 'Listing is verified' : 'Listing not verified'}</li>
        </ul>
        <div style="margin-top:12px; display:flex; gap:8px;">
          <button class="btn btn-primary modal-book" data-id="${prop.id}" type="button">Book Now</button>
          <button class="btn btn-outline modal-close" type="button">Close</button>
        </div>
      </div>
    </div>
  `;
  const modal = showModal(content, '.modal-close');
  modal.root.querySelector('.modal-close').addEventListener('click', modal.close);
  modal.root.querySelector('.modal-book').addEventListener('click', (e)=> { alert(`Booking initiated for "${prop.title}".`); modal.close(); });
}

/* Users & auth helpers (demo only) */
function getStoredUsers(){
  try { return JSON.parse(localStorage.getItem('rentease_users_v1') || '[]'); } catch { return []; }
}
function saveStoredUsers(users){ localStorage.setItem('rentease_users_v1', JSON.stringify(users)); }

let currentUserStored = null;

/* Register modal */
function openRegisterModal(){
  const content = `
    <div>
      <h2>Register</h2>
      <form id="registerForm" style="margin-top:10px; display:flex; flex-direction:column; gap:8px;" enctype="multipart/form-data" novalidate>
        <label for="regName">Full name</label>
        <input id="regName" name="regName" type="text" placeholder="Jane Doe" required>

        <label for="regEmail">Email</label>
        <input id="regEmail" name="regEmail" type="email" placeholder="you@example.com" required>

        <label for="regAddress">Address</label>
        <textarea id="regAddress" name="regAddress" rows="2" placeholder="Street, City, Region" required></textarea>

        <label for="regPassword">Password</label>
        <input id="regPassword" name="regPassword" type="password" placeholder="Choose a strong password" required>

        <label for="regPassword2">Re-enter password</label>
        <input id="regPassword2" name="regPassword2" type="password" placeholder="Confirm password" required>

        <label for="regIdUpload">Upload ID PNG JPG max 4MB</label>
        <input id="regIdUpload" name="regIdUpload" type="file" accept="image/png, image/jpeg" aria-describedby="idHelpReg">
        <div id="idHelpReg" style="color:#6b7280; font-size:13px;">Used to verify your account for bookings. File stays in browser for demo.</div>
        <img id="regIdPreview" class="id-preview" alt="ID preview" style="display:none;">

        <div style="display:flex; gap:8px; margin-top:6px;">
          <button type="submit" class="btn btn-primary">Create account</button>
          <button type="button" class="btn btn-outline modal-close">Cancel</button>
        </div>
      </form>
    </div>
  `;
  const modal = showModal(content, '#regName');
  const root = modal.root;
  const form = root.querySelector('#registerForm');
  const name = root.querySelector('#regName');
  const email = root.querySelector('#regEmail');
  const address = root.querySelector('#regAddress');
  const pw = root.querySelector('#regPassword');
  const pw2 = root.querySelector('#regPassword2');
  const idUpload = root.querySelector('#regIdUpload');
  const idPreview = root.querySelector('#regIdPreview');

  idUpload.addEventListener('change', () => {
    const f = idUpload.files && idUpload.files[0];
    if(!f){ idPreview.style.display = 'none'; idPreview.src = ''; return; }
    if(f.size > 4 * 1024 * 1024){ alert('File too large. Max 4MB.'); idUpload.value = ''; idPreview.style.display = 'none'; return; }
    idPreview.src = URL.createObjectURL(f);
    idPreview.style.display = 'block';
  });

  root.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', modal.close));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!name.value.trim() || !email.value.trim() || !address.value.trim() || !pw.value || !pw2.value){ alert('Complete all fields.'); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())){ alert('Enter valid email.'); email.focus(); return; }
    if(pw.value.length < 6){ alert('Password must be at least 6 chars.'); pw.focus(); return; }
    if(pw.value !== pw2.value){ alert('Passwords do not match.'); pw2.focus(); return; }

    const users = getStoredUsers();
    if(users.find(u => u.email === email.value.trim().toLowerCase())){ alert('An account with that email exists. Please log in.'); return; }

    const user = { id: 'u_' + Date.now(), name: name.value.trim(), email: email.value.trim().toLowerCase(), address: address.value.trim(), createdAt: new Date().toISOString() };

    const file = idUpload.files && idUpload.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () => { user.idFileData = reader.result; finalizeRegistration(user, pw.value, modal); };
      reader.onerror = () => { alert('Failed to read ID. Registering without ID.'); finalizeRegistration(user, pw.value, modal); };
      reader.readAsDataURL(file);
    } else {
      finalizeRegistration(user, pw.value, modal);
    }
  });

  function finalizeRegistration(user, password, modalRef){
    const users = getStoredUsers();
    user.password = password; // demo only
    users.push(user);
    saveStoredUsers(users);
    currentUser = user;
    alert(`Account created and signed in as ${currentUser.email}`);
    updateProfileMenuState();
    modalRef.close();
  }
}

/* Login modal */
function openLoginModal(){
  const content = `
    <div>
      <h2>Log In</h2>
      <form id="loginForm" style="margin-top:10px; display:flex; flex-direction:column; gap:8px;" novalidate>
        <label for="loginEmail">Email</label>
        <input id="loginEmail" type="email" placeholder="you@example.com" required>

        <label for="loginPassword">Password</label>
        <input id="loginPassword" type="password" placeholder="Your password" required>

        <div style="display:flex; gap:8px; margin-top:6px;">
          <button type="submit" class="btn btn-primary">Sign in</button>
          <button type="button" class="btn btn-outline modal-close">Cancel</button>
        </div>
      </form>
    </div>
  `;
  const modal = showModal(content, '#loginEmail');
  const root = modal.root;
  root.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', modal.close));
  const form = root.querySelector('#loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = root.querySelector('#loginEmail').value.trim().toLowerCase();
    const pw = root.querySelector('#loginPassword').value;
    if(!email || !pw){ alert('Enter email and password.'); return; }
    const users = getStoredUsers();
    const user = users.find(u => u.email === email && u.password === pw);
    if(!user){ alert('Invalid credentials.'); return; }
    currentUser = user;
    alert(`Signed in as ${currentUser.email}`);
    updateProfileMenuState();
    modal.close();
  });
}

/* Booking history and profile */
function openBookingHistoryModal(){
  if(!currentUser){ openLoginModal(); return; }
  const content = `
    <div>
      <h2>Booking History</h2>
      <p style="color:#6b7280; margin-top:8px;">Recent bookings for <strong>${currentUser.email}</strong></p>
      <ul style="margin-top:12px; color:#6b7280;"><li>No bookings yet (demo)</li></ul>
      <div style="margin-top:12px;"><button class="btn btn-outline modal-close" type="button">Close</button></div>
    </div>
  `;
  const modal = showModal(content);
  modal.root.querySelector('.modal-close').addEventListener('click', modal.close);
}

function openProfileModal(){
  if(!currentUser){ openLoginModal(); return; }
  const content = `
    <div>
      <h2>Profile</h2>
      <p style="color:#6b7280; margin-top:8px;">Name: <strong>${currentUser.name}</strong></p>
      <p style="color:#6b7280;">Email: <strong>${currentUser.email}</strong></p>
      <p style="color:#6b7280;">Address: <strong>${currentUser.address}</strong></p>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button class="btn btn-outline" id="signOutBtn" type="button">Sign Out</button>
        <button class="btn btn-outline modal-close" type="button">Close</button>
      </div>
    </div>
  `;
  const modal = showModal(content);
  modal.root.querySelector('.modal-close').addEventListener('click', modal.close);
  modal.root.querySelector('#signOutBtn').addEventListener('click', ()=> {
    currentUser = null;
    alert('Signed out');
    updateProfileMenuState();
    modal.close();
  });
}

/* Update profile button appearance */
function updateProfileMenuState(){
  if(!profileBtn) return;
  if(currentUser){
    profileBtn.setAttribute('title', `Account: ${currentUser.email}`);
    profileBtn.style.background = '#eaf2ff';
    const img = document.getElementById('profileIcon');
    if(img && currentUser.name) img.setAttribute('aria-label', currentUser.name);
  } else {
    profileBtn.setAttribute('title', 'Account');
    profileBtn.style.background = '#fff';
  }
}

/* Notification menu (simple list) */
function wireNotificationMenu(){
  let notifMenu = null;
  function openNotifMenu(){
    if(!notifMenu){
      notifMenu = document.createElement('div');
      notifMenu.id = notifMenuId;
      notifMenu.className = 'profile-menu';
      notifMenu.setAttribute('role','menu');
      notifMenu.innerHTML = `<div style="padding:8px;"><strong>Notifications</strong></div><div id="notifList" style="max-height:240px; overflow:auto; padding:8px;"></div>`;
      document.body.appendChild(notifMenu);
      const rect = notifBtn.getBoundingClientRect();
      notifMenu.style.position = 'absolute';
      notifMenu.style.top = (rect.bottom + 8) + 'px';
      notifMenu.style.right = (window.innerWidth - rect.right + 16) + 'px';
      notifMenu.setAttribute('aria-hidden','false');
    }
    renderNotifications();
    document.addEventListener('click', onDocClickNotif);
    document.addEventListener('keydown', onKeyNotif);
    notifBtn.setAttribute('aria-expanded','true');
  }
  function closeNotifMenu(){
    if(notifMenu) { notifMenu.setAttribute('aria-hidden','true'); notifMenu.remove(); notifMenu = null; }
    document.removeEventListener('click', onDocClickNotif);
    document.removeEventListener('keydown', onKeyNotif);
    notifBtn.setAttribute('aria-expanded','false');
  }
  function toggleNotifMenu(e){ e.stopPropagation(); const open = notifBtn.getAttribute('aria-expanded') === 'true'; if(open) closeNotifMenu(); else openNotifMenu(); }
  function onDocClickNotif(e){ if(notifMenu && !notifMenu.contains(e.target) && e.target !== notifBtn) closeNotifMenu(); }
  function onKeyNotif(e){ if(e.key === 'Escape') closeNotifMenu(); }
  function renderNotifications(){
    const list = document.getElementById('notifList');
    if(!list) return;
    list.innerHTML = '';
    if(!notifications.length) list.innerHTML = '<div style="color:#6b7280">No notifications</div>';
    notifications.slice().reverse().forEach((n)=>{
      const item = document.createElement('div');
      item.style.padding = '8px 4px';
      item.style.borderBottom = '1px solid #f2f4f8';
      item.style.color = '#07204a';
      item.textContent = n;
      list.appendChild(item);
    });
  }
  notifBtn.addEventListener('click', toggleNotifMenu);
  return {
    push(note){
      notifications.push(note);
      if(notifBadge) notifBadge.textContent = notifications.length;
    }
  };
}

/* Profile menu wiring */
function wireProfileMenu(){
  if(!profileBtn || !profileMenu) return;

  function openMenu(){
    profileMenu.setAttribute('aria-hidden','false');
    profileBtn.setAttribute('aria-expanded','true');
    const first = profileMenu.querySelector('.menu-item');
    if(first) first.focus();
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
  }
  function closeMenu(){
    profileMenu.setAttribute('aria-hidden','true');
    profileBtn.setAttribute('aria-expanded','false');
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKeyDown);
  }
  function toggleMenu(e){
    e.stopPropagation();
    const hidden = profileMenu.getAttribute('aria-hidden') === 'true';
    if(hidden) openMenu(); else closeMenu();
  }
  function onDocClick(e){
    if(!profileMenu.contains(e.target) && e.target !== profileBtn) closeMenu();
  }
  function onKeyDown(e){
    if(e.key === 'Escape') closeMenu();
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      const items = Array.from(profileMenu.querySelectorAll('.menu-item'));
      if(!items.length) return;
      const idx = items.indexOf(document.activeElement);
      let next;
      if(e.key === 'ArrowDown') next = items[(idx + 1) % items.length];
      else next = items[(idx - 1 + items.length) % items.length];
      next.focus();
    }
  }

  profileBtn.addEventListener('click', toggleMenu);
  profileBtn.addEventListener('keydown', (e)=> { if(e.key === 'ArrowDown'){ e.preventDefault(); profileMenu.setAttribute('aria-hidden','false'); profileBtn.setAttribute('aria-expanded','true'); profileMenu.querySelector('.menu-item').focus(); } });

  profileMenu.addEventListener('click', (e)=> {
    const btn = e.target.closest('.menu-item');
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === 'profile') openProfileModal();
    if(action === 'bookings') openBookingHistoryModal();
    if(action === 'login') openLoginModal();
    if(action === 'register') openRegisterModal();
    if(action === 'logout'){ currentUser = null; updateProfileMenuState(); alert('Logged out'); }
    profileMenu.setAttribute('aria-hidden','true');
    profileBtn.setAttribute('aria-expanded','false');
  });
}

/* Card interactions */
function wireCardActions(){
  document.body.addEventListener('click',(e)=> {
    const detailsBtn = e.target.closest('.details-btn');
    if(detailsBtn){ const id = detailsBtn.dataset.id; const prop = SAMPLE_PROPERTIES.find(p => p.id === id); if(prop) openPropertyModal(prop); return; }
    const bookBtn = e.target.closest('.book-btn');
    if(bookBtn){ const id = bookBtn.dataset.id; const prop = SAMPLE_PROPERTIES.find(p => p.id === id); if(prop){ const ok = confirm(`You chose to book "${prop.title}" for ${formatPrice(prop.price)}. Proceed?`); if(ok) alert('Booking request submitted.'); } return; }
    const exploreBtn = e.target.closest('.explore-btn');
    if(exploreBtn){ const name = exploreBtn.dataset.name; const filtered = SAMPLE_PROPERTIES.filter(p => p.location.toLowerCase().includes(name.toLowerCase())); renderFeatured(filtered); featuredContainer.setAttribute('tabindex','-1'); featuredContainer.focus(); return; }
  });

  document.body.addEventListener('keydown',(e)=> {
    if(e.key === 'Enter'){ const el = document.activeElement; if(el && el.classList && el.classList.contains('card')){ const btn = el.querySelector('.details-btn'); if(btn) btn.click(); } }
  });
}

/* Search handler */
function handleSearch(e){
  e.preventDefault();
  const locationInput = document.getElementById('location').value.trim();
  const moveIn = document.getElementById('movein').value;
  const tenants = Number(document.getElementById('tenants').value || 1);

  if(!locationInput){ alert('Please enter a location to search.'); return; }
  if(!moveIn){ alert('Please choose a move-in date.'); return; }
  if(tenants < 1){ alert('Please enter at least 1 tenant.'); return; }

  const results = SAMPLE_PROPERTIES.filter(p => {
    const locationMatch = p.location.toLowerCase().includes(locationInput.toLowerCase());
    const capacity = p.beds > 0 ? p.beds : 1;
    const capacityOk = capacity >= tenants;
    return locationMatch && capacityOk;
  });

  const btn = searchForm.querySelector('.search-btn');
  btn.setAttribute('aria-busy','true');
  setTimeout(()=> { renderFeatured(results); btn.removeAttribute('aria-busy'); featuredContainer.setAttribute('tabindex','-1'); featuredContainer.focus(); }, 300);
}

/* Subscribe */
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function handleSubscribe(e){
  e.preventDefault();
  const email = subscribeEmail.value.trim();
  if(!validEmail(email)){ alert('Please enter a valid email address.'); subscribeEmail.focus(); return; }
  const key = 'rentease_subscribers_v1';
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  if(stored.includes(email)){ alert('You are already subscribed with this email.'); } else { stored.push(email); localStorage.setItem(key, JSON.stringify(stored)); alert('Thanks! You have been subscribed to RentEase updates.'); subscribeEmail.value = ''; }
}

/* Explore More action: append 20 generated units and show them */
function generateMoreUnits(count = 20){
  const baseCount = SAMPLE_PROPERTIES.length;
  for(let i=1;i<=count;i++){
    const idx = baseCount + i;
    SAMPLE_PROPERTIES.push({
      id: 'gen' + idx,
      title: `Generated Unit ${idx}`,
      location: ['Dagupan, Pangasinan','Laoag, Ilocos Norte','San Fernando, La Union','Vigan, Ilocos Sur'][idx % 4],
      price: 8000 + (idx * 1200),
      beds: (idx % 4),
      baths: 1 + (idx % 2),
      img: 'https://images.unsplash.com/photo-1560184897-6f6c7f6b6f6f?auto=format&fit=crop&w=1000&q=60',
      verified: (idx % 3 === 0),
      description: 'Auto-generated listing to explore more units.'
    });
  }
  renderFeatured();
  document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
}

/* Init */
function init(){
  renderFeatured();
  renderLocations();
  wireCardActions();
  wireProfileMenu();
  updateProfileMenuState();
  searchForm.addEventListener('submit', handleSearch);
  subscribeForm.addEventListener('submit', handleSubscribe);
  if(exploreMoreNav) exploreMoreNav.addEventListener('click', ()=> generateMoreUnits(20));

  const notifController = wireNotificationMenu();
  // demo push a sample notification after load
  setTimeout(()=> { notifController.push('New verified listing added near you'); }, 800);
  setTimeout(()=> { notifController.push('20+ new units available — Explore More'); }, 1400);

  // menu toggle
  if(menuToggle && navLinks){
    menuToggle.addEventListener('click', ()=> {
      const shown = navLinks.classList.toggle('show');
      menuToggle.setAttribute('aria-expanded', String(shown));
    });
  }

  setTimeout(()=> document.querySelectorAll('.card').forEach(c=> c.setAttribute('tabindex','0')), 0);
}

document.addEventListener('DOMContentLoaded', init);
