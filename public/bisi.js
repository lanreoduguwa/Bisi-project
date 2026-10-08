// ====== EDIT THIS ======
// Shown in the footer "Order via WhatsApp" link. Should match WHATSAPP_NUMBER in your .env.
const WA_FOOTER = "2347010389864";
// ========================

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const naira = n => "₦" + Number(n).toLocaleString();
// Ask Cloudinary for a smaller, compressed copy (faster on phones). Other URLs are left alone.
const cl = (url, w) => String(url).includes("res.cloudinary.com")
  ? String(url).replace("/upload/", `/upload/w_${w},q_auto,f_auto/`) : url;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
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
let products = [], filter = "All", query = "", ready = false, cart = [];
try { cart = JSON.parse(localStorage.getItem("bs_cart")) || []; } catch {}
const saveCart = () => { try { localStorage.setItem("bs_cart", JSON.stringify(cart)); } catch {} };

// One product card. i = its position on the page, used to stagger the slide-in.
function cardHTML(p, i = 0) {
  const fb = bottle(p.category);
  return `<div class="card" style="--d:${i * 120}ms">${p.inStock ? "" : '<span class="sold">Sold out</span>'}<img decoding="async" alt="${esc(p.name)}" src="${esc(p.image ? cl(p.image, 500) : fb)}" data-cat="${esc(p.category)}"><div class="b"><div class="tag">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="row"><span class="price">${naira(p.price)}</span><button class="btn" data-add="${p._id}" ${p.inStock ? "" : "disabled"}>Add to cart</button></div></div></div>`;
}

// ---------- Collection carousel (same behaviour as the reviews) ----------
let colList = [], colPage = 0, colBusy = false;
const colPer = () => innerWidth > 900 ? 4 : innerWidth > 600 ? 3 : 2;

// restart the progress bar; when it finishes, the next page is shown.
// It does not run while someone has a search typed in, so results stay put while they read.
function colRestartBar() {
  const bar = $("cbar");
  bar.classList.remove("run"); void bar.offsetWidth;
  if (!reducedMotion() && colList.length > colPer() && !query.trim()) bar.classList.add("run");
}

function drawCollection(dir = 1) {
  const box = $("grid"), n = colPer(), len = colList.length, searching = !!query.trim();

  if (!len) {
    box.className = "cl-page";
    box.innerHTML = `<p class="empty">${searching
      ? `No items match “${esc(query.trim())}”. Try another name, or choose All.`
      : "No products in this category yet."}</p>`;
    $("colCtrl").classList.add("hide");
    $("cbar").classList.remove("run");
    return;
  }

  const pages = Math.max(1, Math.ceil(len / n));
  colPage = (colPage + pages) % pages;
  // Browsing: if the last page is short, fill it from the start so it never looks half empty.
  // Searching: show only the real matches.
  const slice = len <= n ? colList
    : searching ? colList.slice(colPage * n, colPage * n + n)
    : Array.from({ length: n }, (_, k) => colList[(colPage * n + k) % len]);

  box.style.setProperty("--n", n);
  box.dataset.dir = dir;
  box.innerHTML = slice.map(cardHTML).join("");
  box.classList.remove("rv-anim", "rv-leave"); void box.offsetWidth; box.classList.add("rv-anim");
  box.className = "cl-page rv-anim";

  $("cdots").innerHTML = pages > 1
    ? Array.from({ length: pages }, (_, i) => `<button type="button" data-p="${i}" class="${i === colPage ? "on" : ""}" aria-label="Products page ${i + 1}"></button>`).join("") : "";
  $("colCtrl").classList.toggle("hide", pages < 2);
  colRestartBar();
}

// fade the current cards out, then swap in the next page
function goCollection(p, dir = 1) {
  if (colBusy || colList.length <= colPer()) return;
  colBusy = true;
  const box = $("grid");
  if (reducedMotion()) { colPage = p; drawCollection(dir); colBusy = false; return; }
  $("cbar").classList.remove("run");
  box.classList.remove("rv-anim"); box.classList.add("rv-leave");
  setTimeout(() => { colPage = p; drawCollection(dir); colBusy = false; }, 280);
}

function renderShop() {
  const CATS = ["Perfume", "Body Spray", "Body Mist", "Perfume Oil", "Diffuser"];
  $("chips").innerHTML = ["All", ...CATS].map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");

  // Every word typed must appear in the product's name, category or description.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  colList = products.filter(p =>
    (filter === "All" || p.category === filter) &&
    words.every(w => `${p.name} ${p.category} ${p.description || ""}`.toLowerCase().includes(w)));
  $("sCount").textContent = words.length && colList.length ? `${colList.length} item${colList.length > 1 ? "s" : ""} found` : "";

  colPage = 0;
  drawCollection(1);
}

// the progress bar finishing is what advances to the next page
$("cbar").addEventListener("animationend", () => goCollection(colPage + 1, 1));
$("cnext").onclick = () => goCollection(colPage + 1, 1);
$("cprev").onclick = () => goCollection(colPage - 1, -1);
$("cdots").onclick = e => { const p = e.target.dataset.p; if (p !== undefined) goCollection(+p, +p > colPage ? 1 : -1); };

// swipe left / right on a phone to change page
let swX = 0, swY = 0;
$("colWrap").addEventListener("touchstart", e => { swX = e.touches[0].clientX; swY = e.touches[0].clientY; }, { passive: true });
$("colWrap").addEventListener("touchend", e => {
  const t = e.changedTouches[0], dx = t.clientX - swX, dy = t.clientY - swY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goCollection(colPage + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
}, { passive: true });

// products per page changes with screen size, so rebuild when the window is resized
let colRz;
addEventListener("resize", () => { clearTimeout(colRz); colRz = setTimeout(() => { if (ready) { colPage = 0; drawCollection(1); } }, 250); });

// ---------- Filters + search ----------
$("chips").onclick = e => { if (e.target.dataset.c) { filter = e.target.dataset.c; renderShop(); } };
$("q").oninput = () => { query = $("q").value; if (ready) renderShop(); };
$("searchForm").onsubmit = e => {
  e.preventDefault();
  query = $("q").value;
  if (!ready) return;
  renderShop();
  if (query.trim()) {
    if (document.activeElement) document.activeElement.blur();   // hides the phone keyboard
    $("colWrap").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};
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

// ---------- Reviews (animated carousel) ----------
let rvs = [], rvPage = 0, rvBusy = false;
const rvPer = () => innerWidth > 900 ? 3 : innerWidth > 600 ? 2 : 1;
const rvReduced = reducedMotion;

function reviewCard(r, i) {
  return `<div class="card rv" style="--d:${i * 120}ms"><div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><p>"${esc(r.text)}"</p>${r.image ? `<img loading="lazy" alt="Customer screenshot" src="${esc(r.image)}" data-z="1">` : ""}<b>${esc(r.name)}</b></div>`;
}

// restart the progress bar; when it finishes, the next page is shown
function restartBar() {
  const bar = $("rbar");
  bar.classList.remove("run"); void bar.offsetWidth;
  if (!rvReduced() && rvs.length > rvPer()) bar.classList.add("run");
}

function renderReviewPage(dir = 1) {
  const n = rvPer(), box = $("rgrid"), len = rvs.length;
  const pages = Math.max(1, Math.ceil(len / n));
  rvPage = (rvPage + pages) % pages;
  // when the last page is short, fill it from the start so it never looks half empty
  const slice = len <= n ? rvs : Array.from({ length: n }, (_, k) => rvs[(rvPage * n + k) % len]);
  box.style.setProperty("--n", Math.min(n, len));
  box.dataset.dir = dir;
  box.innerHTML = slice.map(reviewCard).join("");
  box.classList.remove("rv-anim", "rv-leave"); void box.offsetWidth; box.classList.add("rv-anim");
  $("rdots").innerHTML = pages > 1
    ? Array.from({ length: pages }, (_, i) => `<button type="button" data-p="${i}" class="${i === rvPage ? "on" : ""}" aria-label="Reviews page ${i + 1}"></button>`).join("") : "";
  $("rvCtrl").classList.toggle("hide", pages < 2);
  restartBar();
}

// fade the current cards out, then swap in the next page
function goReviews(p, dir = 1) {
  if (rvBusy || rvs.length <= rvPer()) return;
  rvBusy = true;
  const box = $("rgrid");
  if (rvReduced()) { rvPage = p; renderReviewPage(dir); rvBusy = false; return; }
  $("rbar").classList.remove("run");
  box.classList.remove("rv-anim"); box.classList.add("rv-leave");
  setTimeout(() => { rvPage = p; renderReviewPage(dir); rvBusy = false; }, 280);
}

async function loadReviews() {
  try {
    rvs = await api("/api/reviews");
    if (!rvs.length) {
      $("rgrid").style.setProperty("--n", 1);
      $("rgrid").innerHTML = `<p style="text-align:center;color:var(--mut)">Be the first to leave a review.</p>`;
      $("rvCtrl").classList.add("hide"); return;
    }
    rvPage = 0; renderReviewPage();
  } catch { $("rgrid").innerHTML = ""; $("rvCtrl").classList.add("hide"); }
}

// the progress bar finishing is what advances to the next page
$("rbar").addEventListener("animationend", () => goReviews(rvPage + 1, 1));
$("rnext").onclick = () => goReviews(rvPage + 1, 1);
$("rprev").onclick = () => goReviews(rvPage - 1, -1);
$("rdots").onclick = e => { const p = e.target.dataset.p; if (p !== undefined) goReviews(+p, +p > rvPage ? 1 : -1); };

// cards per page changes with screen size, so rebuild when the window is resized
let rvRz;
addEventListener("resize", () => { clearTimeout(rvRz); rvRz = setTimeout(() => { if (rvs.length) { rvPage = 0; renderReviewPage(); } }, 250); });

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
  clearInterval(heroTimer);
  wrap.innerHTML = "";
  slides.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "slide" + (i === 0 ? " on" : "");
    // Set via the DOM so data: URIs and Cloudinary URLs are used as-is (no double-encoding).
    el.style.backgroundImage = `url("${String(s).replace(/"/g, "%22")}")`;
    wrap.appendChild(el);
  });
  // One photo only: no dots and no timer needed.
  if (slides.length < 2) { dots.innerHTML = ""; return; }
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
  catch {
    $("grid").className = "cl-page";
    $("grid").innerHTML = `<p class="empty">Could not load products.</p>`;
    $("colCtrl").classList.add("hide");
  }
  // Only clean the saved cart when products actually loaded, so a network hiccup doesn't wipe it.
  if (loaded) cart = cart.filter(c => products.some(p => p._id === c.id && p.inStock));
  // Hero shows your real product photos as soon as one exists; otherwise the illustrated fallback.
  const withPhotos = products.filter(p => p.image).map(p => cl(p.image, 1400));
  initHeroSlides(withPhotos.length ? withPhotos.slice(0, 5) : HERO_FALLBACKS);
  if (loaded) { ready = true; query = $("q").value; renderShop(); }
  renderCart(); loadReviews();
})();