// ====== EDIT THIS ======
// Shown in the footer "Order via WhatsApp" link. Should match WHATSAPP_NUMBER in your .env.
const WA_FOOTER = "2347010389864";
// ========================

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const naira = n => "₦" + Number(n).toLocaleString();
function toast(t) { const e = $("toast"); e.textContent = t; e.classList.add("s"); setTimeout(() => e.classList.remove("s"), 2400); }
async function api(url, opts) {
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j;
}

// ---------- Illustrated fallback (shown if a product has no photo, or its photo fails to load) ----------
function bottle(cat) {
  const g = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs>`;
  const shapes = {
    "Perfume": `<rect x="70" y="90" width="60" height="70" rx="10" fill="url(#g)"/><rect x="90" y="65" width="20" height="25" fill="#1e3a8a"/><rect x="82" y="55" width="36" height="12" rx="3" fill="#0b1b3a"/>`,
    "Body Spray": `<rect x="80" y="65" width="40" height="100" rx="8" fill="url(#g)"/><rect x="90" y="48" width="20" height="17" fill="#1e3a8a"/><rect x="96" y="40" width="20" height="8" rx="2" fill="#0b1b3a"/>`,
    "Body Mist": `<rect x="76" y="70" width="48" height="90" rx="14" fill="url(#g)"/><rect x="88" y="52" width="24" height="18" fill="#38bdf8"/><rect x="84" y="44" width="32" height="8" rx="3" fill="#0b1b3a"/>`,
    "Perfume Oil": `<rect x="78" y="95" width="44" height="65" rx="8" fill="url(#g)"/><rect x="92" y="72" width="16" height="23" fill="#1e3a8a"/><circle cx="100" cy="66" r="10" fill="#0b1b3a"/>`,
    "Diffuser": `<path d="M65 100h70l-8 60H73z" fill="url(#g)"/><rect x="88" y="90" width="24" height="10" fill="#1e3a8a"/><path d="M96 90L80 40M100 90l2-52M104 90l20-48" stroke="#0b1b3a" stroke-width="3"/>`
  };
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e0f2fe"/>${g}${shapes[cat] || shapes.Perfume}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(s);
}

// If a product photo fails to load, swap in the illustrated bottle.
// Registered ONCE. The "true" is needed because image error events don't bubble.
document.addEventListener("error", e => {
  const img = e.target;
  if (img.tagName === "IMG" && img.dataset.cat && !img.dataset.failed) {
    img.dataset.failed = "1";
    img.src = bottle(img.dataset.cat);
  }
}, true);

// ---------- Products ----------
let products = [], filter = "All", cart = [];
try { cart = JSON.parse(localStorage.getItem("bs_cart")) || []; } catch {}
const saveCart = () => { try { localStorage.setItem("bs_cart", JSON.stringify(cart)); } catch {} };

function renderShop() {
  const CATS = ["Perfume", "Body Spray", "Body Mist", "Perfume Oil", "Diffuser"];
  $("chips").innerHTML = ["All", ...CATS].map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
  const list = products.filter(p => filter === "All" || p.category === filter);
  $("grid").innerHTML = list.length ? list.map(p => {
    const fb = bottle(p.category);
    return `<div class="card">${p.inStock ? "" : '<span class="sold">Sold out</span>'}<img alt="${esc(p.name)}" src="${esc(p.image || fb)}" data-cat="${esc(p.category)}"><div class="b"><div class="tag">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="row"><span class="price">${naira(p.price)}</span><button class="btn" data-add="${p._id}" ${p.inStock ? "" : "disabled"}>Add to cart</button></div></div></div>`;
  }).join("") : `<p style="text-align:center;grid-column:1/-1;color:var(--mut)">No products in this category yet.</p>`;
}
$("chips").onclick = e => { if (e.target.dataset.c) { filter = e.target.dataset.c; renderShop(); } };
$("grid").onclick = e => {
  const id = e.target.dataset.add; if (!id) return;
  const c = cart.find(x => x.id === id); c ? c.qty = Math.min(20, c.qty + 1) : cart.push({ id, qty: 1 });
  $("payBox").classList.add("hide"); $("co").classList.remove("hide");
  renderCart(); toast("Added to cart");
};

// ---------- Cart + checkout (bank transfer / Opay) ----------
function renderCart() {
  let total = 0, n = 0;
  $("cartItems").innerHTML = cart.length ? cart.map(c => {
    const p = products.find(x => x._id === c.id); if (!p) return "";
    total += p.price * c.qty; n += c.qty;
    return `<div class="ci"><span>${esc(p.name)}<br><small>${naira(p.price)}</small></span><span><button data-dec="${c.id}">−</button> ${c.qty} <button data-inc="${c.id}">+</button> <button data-rm="${c.id}">✕</button></span></div>`;
  }).join("") : `<p class="msg">Your cart is empty.</p>`;
  $("total").textContent = naira(total); $("cc").textContent = n; $("pay").disabled = !cart.length;
  saveCart();
}
const openCart = o => { $("drawer").classList.toggle("open", o); $("scrim").classList.toggle("hide", !o); };
$("cartBtn").onclick = () => openCart(true);
$("closeCart").onclick = $("scrim").onclick = () => openCart(false);
$("cartItems").onclick = e => {
  const d = e.target.dataset, id = d.inc || d.dec || d.rm; if (!id) return;
  const c = cart.find(x => x.id === id); if (!c) return;
  if (d.inc) c.qty = Math.min(20, c.qty + 1);
  if (d.dec) c.qty--;
  if (d.rm || c.qty < 1) cart = cart.filter(x => x.id !== id);
  renderCart();
};
$("co").onsubmit = async e => {
  e.preventDefault(); $("cerr").textContent = "";
  $("pay").disabled = true; $("pay").textContent = "Placing order…";
  try {
    const body = { name: $("con").value.trim(), phone: $("cop").value.trim(), address: $("coa").value.trim(), items: cart };
    const r = await api("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    showPaymentInfo(r);
    $("co").classList.add("hide");
    cart = []; renderCart();
  } catch (er) { $("cerr").textContent = er.message; }
  $("pay").disabled = !cart.length; $("pay").textContent = "Place order";
};
function showPaymentInfo(r) {
  $("poRef").textContent = r.reference;
  $("poAmt").textContent = naira(r.amount);
  const p = r.payment, rows = [];
  if (p.bankAccountNumber) rows.push(["Bank", p.bankName], ["Account name", p.bankAccountName], ["Account number", p.bankAccountNumber]);
  if (p.opayAccountNumber) rows.push(["Opay", p.opayAccountName], ["Opay number", p.opayAccountNumber]);
  $("poDetails").innerHTML = rows.map(([l, v]) => `<div class="pd-row"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join("");
  const msg = encodeURIComponent(`Hello Beecee_specials Scents, I have made payment for order ${r.reference} (${naira(r.amount)}). Attached is my payment screenshot.`);
  $("poWa").href = `https://wa.me/${r.whatsapp}?text=${msg}`;
  $("payBox").classList.remove("hide");
}
$("newOrder").onclick = () => { $("payBox").classList.add("hide"); $("co").classList.remove("hide"); $("co").reset(); };

// ---------- Reviews ----------
async function loadReviews() {
  try {
    const rs = await api("/api/reviews");
    $("rgrid").innerHTML = rs.length ? rs.map(r => `<div class="card rv"><div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><p>"${esc(r.text)}"</p>${r.image ? `<img alt="Customer screenshot" src="${esc(r.image)}" data-z="1">` : ""}<b>${esc(r.name)}</b></div>`).join("")
      : `<p style="text-align:center;grid-column:1/-1;color:var(--mut)">Be the first to leave a review.</p>`;
  } catch { $("rgrid").innerHTML = ""; }
}
$("rgrid").onclick = e => { if (e.target.dataset.z) { $("lb").innerHTML = `<img alt="" src="${esc(e.target.src)}">`; $("lb").classList.remove("hide"); } };
$("lb").onclick = () => $("lb").classList.add("hide");
$("rf").onsubmit = async e => {
  e.preventDefault(); $("rbtn").disabled = true;
  try {
    await api("/api/reviews", { method: "POST", body: new FormData(e.target) });
    e.target.reset(); toast("Thank you! Your review will appear once approved.");
  } catch (er) { toast(er.message); }
  $("rbtn").disabled = false;
};

// ---------- Hero slideshow (uses your real product photos once posted) ----------
function heroFallback(bg1, bg2, shape) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <linearGradient id="bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#bfe4ff"/></linearGradient></defs>
    <rect width="900" height="500" fill="url(#g)"/>${shape}
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
const HERO_FALLBACKS = [
  heroFallback("#7dd3fc", "#1d4ed8", `<rect x="390" y="190" width="120" height="150" rx="18" fill="url(#bl)"/><rect x="420" y="150" width="60" height="45" fill="#1e3a8a"/>`),
  heroFallback("#38bdf8", "#0b3fa0", `<rect x="360" y="210" width="90" height="150" rx="26" fill="url(#bl)"/><rect x="470" y="230" width="90" height="150" rx="26" fill="#eaf6ff" opacity=".9"/>`),
  heroFallback("#93e0ff", "#1d4ed8", `<path d="M370 220h160l-16 150H386z" fill="url(#bl)"/>`),
  heroFallback("#5fc9fb", "#123f9e", `<rect x="400" y="170" width="100" height="180" rx="14" fill="url(#bl)"/>`)
];
let heroTimer;
function initHeroSlides(slides) {
  const wrap = $("heroSlides"), dots = $("heroDots");
  wrap.innerHTML = "";
  slides.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "slide" + (i === 0 ? " on" : "");
    // Set via the DOM so data: URIs and Cloudinary URLs are used as-is (no double-encoding).
    el.style.backgroundImage = `url("${String(s).replace(/"/g, "%22")}")`;
    wrap.appendChild(el);
  });
  dots.innerHTML = slides.map((_, i) => `<button data-i="${i}" class="${i === 0 ? "on" : ""}" aria-label="Slide ${i + 1}"></button>`).join("");
  const els = [...wrap.children], dotEls = [...dots.children];
  let i = 0;
  function show(n) { i = (n + slides.length) % slides.length; els.forEach((el, k) => el.classList.toggle("on", k === i)); dotEls.forEach((el, k) => el.classList.toggle("on", k === i)); }
  function play() { clearInterval(heroTimer); heroTimer = setInterval(() => show(i + 1), 4200); }
  dots.onclick = e => { const n = e.target.dataset.i; if (n !== undefined) { show(+n); play(); } };
  play();
}

// ---------- Init ----------
$("wa2").href = "https://wa.me/" + WA_FOOTER;
$("y").textContent = new Date().getFullYear();
(async () => {
  let loaded = false;
  try { products = await api("/api/products"); loaded = true; }
  catch { $("grid").innerHTML = `<p style="text-align:center;grid-column:1/-1;color:var(--mut)">Could not load products.</p>`; }
  // Only clean the saved cart when products actually loaded, so a network hiccup doesn't wipe it.
  if (loaded) cart = cart.filter(c => products.some(p => p._id === c.id && p.inStock));
  // Hero shows your real product photos as soon as at least one exists; otherwise the illustrated fallback.
  const withPhotos = products.filter(p => p.image).map(p => p.image);
  initHeroSlides(withPhotos.length ? withPhotos.slice(0, 5) : HERO_FALLBACKS);
  if (loaded) renderShop();
  renderCart(); loadReviews();
})();