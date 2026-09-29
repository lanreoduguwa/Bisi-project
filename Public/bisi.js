const WA = "2347010389864";   // whatsapp number for customer to reach out
const PIN = "beecee2026";      // admin PIN (client-side only — change this)
const PAYMENT = {
  bankName: "Guaranty Trust bank(GTB)",
  bankAccountName: "Olabisi Ayomide Lemboye",
  bankAccountNumber: "0431369665",
  opayAccountName: "Olabisi Ayomide Lemboye",
  opayAccountNumber: "7010389864"
};
// ========================

const CATS = ["Perfume", "Body Spray", "Body Mist", "Perfume Oil", "Diffuser"];
const KEY = "beecee_products_v1", RKEY = "beecee_reviews_v1", CKEY = "beecee_cart_v1";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const naira = n => "₦" + Number(n).toLocaleString();
function toast(t) { const e = $("toast"); e.textContent = t; e.classList.add("s"); setTimeout(() => e.classList.remove("s"), 2400); }

// ---------- Illustrated fallback bottle (used when a product has no photo, or its photo fails to load) ----------
function bottle(cat, i) {
  const g = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs>`;
  const shapes = {
    "Perfume": `<rect x="70" y="90" width="60" height="70" rx="10" fill="url(#g)"/><rect x="90" y="65" width="20" height="25" fill="#1e3a8a"/><rect x="82" y="55" width="36" height="12" rx="3" fill="#0b1b3a"/>`,
    "Body Spray": `<rect x="80" y="65" width="40" height="100" rx="8" fill="url(#g)"/><rect x="90" y="48" width="20" height="17" fill="#1e3a8a"/><rect x="96" y="40" width="20" height="8" rx="2" fill="#0b1b3a"/>`,
    "Body Mist": `<rect x="76" y="70" width="48" height="90" rx="14" fill="url(#g)"/><rect x="88" y="52" width="24" height="18" fill="#38bdf8"/><rect x="84" y="44" width="32" height="8" rx="3" fill="#0b1b3a"/>`,
    "Perfume Oil": `<rect x="78" y="95" width="44" height="65" rx="8" fill="url(#g)"/><rect x="92" y="72" width="16" height="23" fill="#1e3a8a"/><circle cx="100" cy="66" r="10" fill="#0b1b3a"/>`,
    "Diffuser": `<path d="M65 100h70l-8 60H73z" fill="url(#g)"/><rect x="88" y="90" width="24" height="10" fill="#1e3a8a"/><path d="M96 90L80 40M100 90l2-52M104 90l20-48" stroke="#0b1b3a" stroke-width="3"/>`
  };
  const bg = ["#e0f2fe", "#dbeafe", "#cffafe", "#eff6ff"][i % 4];
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/>${g}${shapes[cat] || shapes.Perfume}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(s);
}

function resize(file, m = 600) {
  return new Promise(res => {
    if (!file) return res("");
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, m / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = im.width * k; c.height = im.height * k;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", .8));
      };
      im.onerror = () => res(""); im.src = r.result;
    };
    r.onerror = () => res(""); r.readAsDataURL(file);
  });
}

// ---------- Products ----------
const seed = [
  // [ name, category, price, description, image path or URL ]
  ["Imperio Prive", "Perfume", 3500, "Elegance. Power. Exclusivity.", "Images/Imperio prive.jpeg"],
  ["Sugar Oud For Glory", "Perfume", 5800, "Light, airy daily freshness.", "Images/Sugar OUD FOR GLORY.jpeg"],
  ["Daliya", "Perfume", 5000, "Deep woody notes for evenings.", "Images/DALIYA.jpeg"],
  ["My Dear Body Cucumber", "Body Spray", 3700, "Freshness & Protection.", "Images/Dear Body cucumber body spray.jpeg"],
  ["Pure Seduction", "Perfume Oil", 13500, "Alcohol-free oil, rich and warm.", "Images/PURE SEDUCTION OIL.jpeg"],
  ["KAY LIA", "Body Spray", 4000, "24hrs Freshness and Protection.", "Images/KAY LIA BODY SPRAY.jpeg"],
  ["Shaghaf Oud Tonka", "Perfume", 70000, "Gourmand. Luxurious. Seductive.", "Images/SHAGHAF.jpeg"],
  ["Badee AI Oud Series", "Perfume", 34000, "Rich. Oriental. Luxurious.", "Images/BADEE AL OUD.jpeg"]
].map((a, i) => ({ id: i + 1, name: a[0], cat: a[1], price: a[2], desc: a[3], img: a[4] }));

let items, filter = "All", cart = [];
function load() { try { const r = localStorage.getItem(KEY); items = r ? JSON.parse(r) : seed; } catch (e) { items = seed; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { toast("Could not save (storage full?)"); } }
function loadCart() { try { const r = localStorage.getItem(CKEY); cart = r ? JSON.parse(r) : []; } catch (e) { cart = []; } }
function saveCart() { try { localStorage.setItem(CKEY, JSON.stringify(cart)); } catch (e) {} }

function render() {
  $("chips").innerHTML = ["All", ...CATS].map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
  const list = items.filter(p => filter === "All" || p.cat === filter);
  $("grid").innerHTML = list.length ? list.map(p => {
    const fb = bottle(p.cat, p.id);
    return `<div class="card"><img alt="${esc(p.name)}" src="${p.img || fb}" onerror="this.onerror=null;this.src='${fb}'"><div class="b"><div class="tag">${esc(p.cat)}</div><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="row"><span class="price">${naira(p.price)}</span><button class="btn" data-add="${p.id}">Add to cart</button></div></div></div>`;
  }).join("") : `<p style="text-align:center;grid-column:1/-1;color:var(--mut)">No products in this category yet.</p>`;
  $("list").innerHTML = items.map(p => `<div class="item"><span>${esc(p.name)} <small style="color:var(--mut)">· ${esc(p.cat)}</small></span><button data-d="${p.id}">Delete</button></div>`).join("");
}
$("chips").onclick = e => { const c = e.target.dataset.c; if (c) { filter = c; render(); } };
$("grid").onclick = e => {
  const id = e.target.dataset.add; if (!id) return;
  const c = cart.find(x => x.id == id);
  c ? c.qty = Math.min(20, c.qty + 1) : cart.push({ id: +id, qty: 1 });
  saveCart(); renderCart(); toast("Added to cart");
  $("payBox").classList.add("hide"); $("co").classList.remove("hide");
};
$("list").onclick = e => {
  const d = e.target.dataset.d;
  if (d && confirm("Delete this product?")) { items = items.filter(p => p.id != d); save(); render(); toast("Product deleted"); }
};
$("c").innerHTML = CATS.map(c => `<option>${c}</option>`).join("");

$("f").onsubmit = async e => {
  e.preventDefault();
  const img = await resize($("im").files[0]);
  items.unshift({ id: Date.now(), name: $("n").value.trim(), cat: $("c").value, price: +$("p").value, desc: $("d").value.trim(), img });
  save(); filter = "All"; render(); $("f").reset(); toast("Product posted!"); $("shop").scrollIntoView();
};
$("unlock").onclick = () => { if ($("pin").value === PIN) { $("gate").classList.add("hide"); $("adm").classList.remove("hide"); } else toast("Wrong PIN"); };

// ---------- Cart + checkout (bank transfer / Opay) ----------
function renderCart() {
  let total = 0, n = 0;
  $("cartItems").innerHTML = cart.length ? cart.map(c => {
    const p = items.find(x => x.id == c.id); if (!p) return "";
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
  const c = cart.find(x => x.id == id); if (!c) return;
  if (d.inc) c.qty = Math.min(20, c.qty + 1);
  if (d.dec) c.qty--;
  if (d.rm || c.qty < 1) cart = cart.filter(x => x.id != id);
  renderCart();
};
$("co").onsubmit = e => {
  e.preventDefault();
  $("cerr").textContent = "";
  const name = $("con").value.trim(), phone = $("cop").value.trim(), address = $("coa").value.trim();
  if (!name || !phone || !address || !cart.length) { $("cerr").textContent = "Please fill in every field."; return; }
  const total = cart.reduce((s, c) => { const p = items.find(x => x.id == c.id); return s + (p ? p.price * c.qty : 0); }, 0);
  const reference = "BS-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  showPaymentInfo(reference, total);
  $("co").classList.add("hide");
  cart = []; renderCart();
};
function showPaymentInfo(reference, amount) {
  $("poRef").textContent = reference;
  $("poAmt").textContent = naira(amount);
  const rows = [
    ["Bank", PAYMENT.bankName], ["Account name", PAYMENT.bankAccountName], ["Account number", PAYMENT.bankAccountNumber],
    ["Opay", PAYMENT.opayAccountName], ["Opay number", PAYMENT.opayAccountNumber]
  ];
  $("poDetails").innerHTML = rows.map(([l, v]) => `<div class="pd-row"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join("");
  const msg = encodeURIComponent(`Hello Beecee_specials Scents, I have made payment for order ${reference} (${naira(amount)}). Attached is my payment screenshot.`);
  $("poWa").href = `https://wa.me/${WA}?text=${msg}`;
  $("payBox").classList.remove("hide");
}
$("newOrder").onclick = () => { $("payBox").classList.add("hide"); $("co").classList.remove("hide"); $("co").reset(); };

// ---------- Reviews ----------
const rseed = [
  { id: 1, name: "Olanrewaju O.", stars: 5, text: "Ramz Gold gets compliments everywhere I go. Long-lasting and so classy!" },
  { id: 2, name: "Unknown.", stars: 5, text: "Fast delivery and the Karis smells heavenly." }
];
let revs;
function loadR() { try { const r = localStorage.getItem(RKEY); revs = r ? JSON.parse(r) : rseed; } catch (e) { revs = rseed; } }
function saveR() { try { localStorage.setItem(RKEY, JSON.stringify(revs)); } catch (e) { toast("Could not save review (storage full?)"); } }
function renderR() {
  $("rgrid").innerHTML = revs.map(r => `<div class="card rv"><div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><p>"${esc(r.text)}"</p>${r.img ? `<img alt="Customer screenshot" src="${r.img}" data-z="1">` : ""}<b>${esc(r.name)}</b></div>`).join("");
  $("rlist").innerHTML = revs.map(r => `<div class="item"><span>${esc(r.name)} <small style="color:var(--mut)">· ${"★".repeat(r.stars)}</small></span><button data-r="${r.id}">Delete</button></div>`).join("");
}
$("rgrid").onclick = e => { if (e.target.dataset.z) { $("lb").innerHTML = `<img src="${e.target.src}" alt="">`; $("lb").classList.remove("hide"); } };
$("lb").onclick = () => $("lb").classList.add("hide");
$("rlist").onclick = e => {
  const d = e.target.dataset.r;
  if (d && confirm("Delete this review?")) { revs = revs.filter(r => r.id != d); saveR(); renderR(); toast("Review deleted"); }
};
$("rf").onsubmit = async e => {
  e.preventDefault();
  const img = await resize($("ri").files[0], 800);
  revs.unshift({ id: Date.now(), name: $("rn").value.trim(), stars: +$("rr").value, text: $("rt").value.trim(), img });
  saveR(); renderR(); $("rf").reset(); toast("Thank you for your review!");
};

// ---------- Hidden admin: only opens at yoursite.com/#/manage ----------
function gate() {
  const on = location.hash === "#/manage";
  $("admin").classList.toggle("hide", !on);
  if (on) setTimeout(() => $("admin").scrollIntoView(), 50);
}
window.addEventListener("hashchange", gate);

// ---------- Hero slideshow ----------
// Add or change these paths to any photos in your Images folder — these are the
// pictures that rotate behind "Wear a scent that speaks before you do."
const HERO_IMAGES = [
  "Images/Imperio prive.jpeg",
  "Images/Sugar OUD FOR GLORY.jpeg",
  "Images/SHAGHAF.jpeg",
  "Images/BADEE AL OUD.jpeg"
];
function initHeroSlides() {
  const wrap = $("heroSlides"), dots = $("heroDots");
  wrap.innerHTML = HERO_IMAGES.map((src, i) => `<div class="slide${i === 0 ? " on" : ""}" style="background-image:url('${encodeURI(src)}')"></div>`).join("");
  dots.innerHTML = HERO_IMAGES.map((_, i) => `<button data-i="${i}" class="${i === 0 ? "on" : ""}" aria-label="Slide ${i + 1}"></button>`).join("");
  const slides = [...wrap.children], dotEls = [...dots.children];
  let i = 0, timer;
  function show(n) {
    i = (n + HERO_IMAGES.length) % HERO_IMAGES.length;
    slides.forEach((el, k) => el.classList.toggle("on", k === i));
    dotEls.forEach((el, k) => el.classList.toggle("on", k === i));
  }
  function play() { clearInterval(timer); timer = setInterval(() => show(i + 1), 4200); }
  dots.onclick = e => { const n = e.target.dataset.i; if (n !== undefined) { show(+n); play(); } };
  play();
}

// ---------- Init ----------
$("wa2").href = "https://wa.me/" + WA;
$("y").textContent = new Date().getFullYear();
load(); loadCart(); loadR();
render(); renderCart(); renderR();
initHeroSlides(); gate();