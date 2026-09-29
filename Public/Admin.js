const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const naira = n => '₦' + Number(n).toLocaleString();
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('s'); setTimeout(() => e.classList.remove('s'), 2400); }
async function api(u, o) {
  const r = await fetch(u, o), j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && u !== '/api/admin/login') showLogin(); throw new Error(j.error || 'Something went wrong'); }
  return j;
}
const J = { 'Content-Type': 'application/json' };
function showLogin() { $('login').classList.remove('hide'); $('dash').classList.add('hide'); }
async function showDash() { $('login').classList.add('hide'); $('dash').classList.remove('hide'); loadProducts(); loadReviews(); loadOrders(); }

$('lf').onsubmit = async e => {
  e.preventDefault(); $('lerr').textContent = '';
  try { await api('/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }); e.target.reset(); showDash(); }
  catch (er) { $('lerr').textContent = er.message; }
};
$('out').onclick = async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => {}); showLogin(); };
document.querySelector('.tabs').onclick = e => {
  const t = e.target.dataset.t; if (!t) return;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b === e.target));
  ['products', 'reviews', 'orders'].forEach(x => $('t-' + x).classList.toggle('hide', x !== t));
};

async function loadProducts() {
  const ps = await api('/api/products');
  $('plist').innerHTML = ps.map(p => `<div class="item"><span style="display:flex;gap:10px;align-items:center">${p.image ? `<img alt="" src="${esc(p.image)}">` : ''}<span>${esc(p.name)}<br><small>${esc(p.category)} · ${naira(p.price)} ${p.inStock ? '' : '· SOLD OUT'}</small></span></span>
    <span class="g"><button class="link" data-stock="${p._id}">${p.inStock ? 'Mark sold out' : 'Mark in stock'}</button><button class="link d" data-delp="${p._id}">Delete</button></span></div>`).join('') || '<p class="msg">No products yet.</p>';
}
$('pf').onsubmit = async e => {
  e.preventDefault(); $('pbtn').disabled = true; $('pmsg').className = 'msg';
  try { await api('/api/admin/products', { method: 'POST', body: new FormData(e.target) }); e.target.reset(); $('pmsg').textContent = ''; toast('Product posted'); loadProducts(); }
  catch (er) { $('pmsg').textContent = er.message; $('pmsg').className = 'msg err'; }
  $('pbtn').disabled = false;
};
$('plist').onclick = async e => {
  const d = e.target.dataset;
  if (d.stock) { await api(`/api/admin/products/${d.stock}/stock`, { method: 'PATCH' }); loadProducts(); }
  if (d.delp && confirm('Delete this product?')) { await api('/api/admin/products/' + d.delp, { method: 'DELETE' }); loadProducts(); }
};

async function loadReviews() {
  const rs = await api('/api/admin/reviews');
  $('t-reviews').innerHTML = rs.map(r => `<div class="item"><span style="display:flex;gap:10px;align-items:center">${r.image ? `<img alt="" src="${esc(r.image)}">` : ''}<span><b>${esc(r.name)}</b> <span class="stars">${'★'.repeat(r.stars)}</span> <span class="pill ${r.approved ? 'ok' : ''}">${r.approved ? 'live' : 'pending'}</span><br><small>${esc(r.text)}</small></span></span>
    <span class="g">${r.approved ? '' : `<button class="link" data-ap="${r._id}">Approve</button>`}<button class="link d" data-delr="${r._id}">Delete</button></span></div>`).join('') || '<p class="msg">No reviews yet.</p>';
}
$('t-reviews').onclick = async e => {
  const d = e.target.dataset;
  if (d.ap) { await api(`/api/admin/reviews/${d.ap}/approve`, { method: 'PATCH' }); loadReviews(); toast('Review is live'); }
  if (d.delr && confirm('Delete this review?')) { await api('/api/admin/reviews/' + d.delr, { method: 'DELETE' }); loadReviews(); }
};

async function loadOrders() {
  const os = await api('/api/admin/orders');
  $('t-orders').innerHTML = os.map(o => `<div class="item"><span><b>${esc(o.customer.name)}</b> <span class="pill ${o.status}">${o.status}</span><br><small>${esc(o.customer.phone)}<br>${esc(o.customer.address)}<br>${o.items.map(i => `${esc(i.name)} ×${i.qty}`).join(', ')}<br>${esc(o.reference)} · ${new Date(o.createdAt).toLocaleString()}</small></span>
    <span style="text-align:right"><b>${naira(o.amount)}</b><br><span class="g" style="margin-top:6px">
    ${o.status !== 'paid' ? `<button class="link" data-paid="${o._id}">Mark paid</button>` : ''}
    ${o.status !== 'cancelled' ? `<button class="link d" data-cancel="${o._id}">Cancel</button>` : ''}
    </span></span></div>`).join('') || '<p class="msg">No orders yet.</p>';
}
$('t-orders').onclick = async e => {
  const d = e.target.dataset;
  if (d.paid) { await api(`/api/admin/orders/${d.paid}/status`, { method: 'PATCH', headers: J, body: JSON.stringify({ status: 'paid' }) }); loadOrders(); toast('Order marked paid'); }
  if (d.cancel && confirm('Cancel this order?')) { await api(`/api/admin/orders/${d.cancel}/status`, { method: 'PATCH', headers: J, body: JSON.stringify({ status: 'cancelled' }) }); loadOrders(); }
};
api('/api/admin/me').then(showDash).catch(showLogin);
