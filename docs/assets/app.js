/* Rukh concept mock. Vanilla JS, no requests, nothing leaves the browser. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private window */ } }
  };
  var PRICE = 12; // sample price per tree, USD
  var toastEl;

  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }
  var money = function (n) { return "$" + n.toFixed(2).replace(/\.00$/, ""); };

  /* theme */
  var saved = store.get("rukh-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  var tt = $("[data-theme-toggle]");
  if (tt) tt.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var dark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next); store.set("rukh-theme", next);
  });

  /* mobile nav */
  var mb = $("[data-menu-btn]"), mn = $("#mobile-nav");
  if (mb && mn) mb.addEventListener("click", function () {
    var open = mn.classList.toggle("open"); mb.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* cookie notice (the mock sets no cookies and loads no trackers) */
  var ck = $("#cookie");
  if (ck && !store.get("rukh-cookie")) ck.hidden = false;
  $$("[data-cookie]").forEach(function (b) { b.addEventListener("click", function () { store.set("rukh-cookie", b.getAttribute("data-cookie")); ck.hidden = true; }); });

  /* copy buttons */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var sel = b.getAttribute("data-copy");
      var text = sel === "url" ? location.href : ($(sel) ? $(sel).textContent.trim() : "");
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("Copied"); }, function () { toast("Copy failed"); });
      else toast("Copy not available here");
    });
  });
  $$("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });

  /* mock forms: nothing is sent or stored */
  $$("[data-mock-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); toast("Mock: nothing was sent or stored."); });
  });

  /* tabs */
  $$(".tabs").forEach(function (t) {
    var tabs = $$("[role=tab]", t), panels = $$("[role=tabpanel]", t);
    function show(i, focus) {
      tabs.forEach(function (x, j) { x.setAttribute("aria-selected", j === i ? "true" : "false"); x.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (x, i) {
      x.addEventListener("click", function () { show(i); });
      x.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); show((i + 1) % tabs.length, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); show((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    function fromHash() {
      var h = location.hash.replace("#", ""), idx = tabs.findIndex(function (x) { return x.id === h || x.id === "tab-" + h; });
      show(idx > -1 ? idx : 0);
    }
    fromHash(); window.addEventListener("hashchange", fromHash);
  });

  /* updates feed sort */
  var sort = $("[data-sort]");
  if (sort) sort.addEventListener("change", function () {
    var feed = $("#feed"), key = sort.value;
    var items = $$("article", feed).sort(function (a, b) { return Number(b.getAttribute("data-" + key)) - Number(a.getAttribute("data-" + key)); });
    items.forEach(function (i) { feed.appendChild(i); });
  });

  /* register filter */
  $$("[data-filter]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var q = inp.value.toLowerCase(), t = $(inp.getAttribute("data-filter")), shown = 0;
      $$("tbody tr", t).forEach(function (r) { var ok = r.textContent.toLowerCase().indexOf(q) > -1; r.hidden = !ok; if (ok) shown++; });
      var c = $("#filter-count"); if (c) c.textContent = shown + " shown";
    });
  });

  /* quick plant widget on the home page */
  var qw = $("[data-quick]");
  if (qw) {
    var qty = 5, freq = "once", link = $("[data-quick-go]");
    var upd = function () { link.href = "plant.html?qty=" + qty + "&freq=" + freq; $("[data-quick-total]").textContent = money(qty * PRICE) + (freq === "monthly" ? " a month" : ""); };
    $$("[data-qty]", qw).forEach(function (b) { b.addEventListener("click", function () { qty = Number(b.getAttribute("data-qty")); $$("[data-qty]", qw).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); upd(); }); });
    $$("[data-freq]", qw).forEach(function (b) { b.addEventListener("click", function () { freq = b.getAttribute("data-freq"); $$("[data-freq]", qw).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); upd(); }); });
    upd();
  }

  /* plant page: calculator, gift and certificate preview, basket */
  var pf = $("[data-plant]");
  if (pf) {
    var q = new URLSearchParams(location.search);
    var state = { qty: Number(q.get("qty")) || 5, freq: q.get("freq") === "monthly" ? "monthly" : "once" };
    var qi = $("#qty"), proj = function () { return $("input[name=project]:checked", pf); };
    function render() {
      var p = proj(), unit = Number(p.getAttribute("data-price")), total = state.qty * unit;
      qi.value = state.qty;
      $$("[data-qty]", pf).forEach(function (b) { b.setAttribute("aria-pressed", Number(b.getAttribute("data-qty")) === state.qty ? "true" : "false"); });
      $$("[data-freq]", pf).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-freq") === state.freq ? "true" : "false"); });
      $("#sum-project").textContent = p.getAttribute("data-name");
      $("#sum-qty").textContent = state.qty + " tree" + (state.qty === 1 ? "" : "s");
      $("#sum-total").textContent = money(total) + (state.freq === "monthly" ? " / month" : "");
      var parts = [["Planting and 3 years of care", .55], ["Platform and payments", .20], ["Monitoring", .15], ["Replacement reserve", .10]];
      $("#sum-break").innerHTML = parts.map(function (x) { return "<tr><td>" + x[0] + "</td><td class=\"num\">" + money(total * x[1]) + "</td></tr>"; }).join("");
      $("#cert-qty").textContent = state.qty + " tree" + (state.qty === 1 ? "" : "s") + " in " + p.getAttribute("data-place");
    }
    $$("[data-qty]", pf).forEach(function (b) { b.addEventListener("click", function () { state.qty = Number(b.getAttribute("data-qty")); render(); }); });
    $$("[data-freq]", pf).forEach(function (b) { b.addEventListener("click", function () { state.freq = b.getAttribute("data-freq"); render(); }); });
    qi.addEventListener("input", function () { var n = Math.max(1, Math.min(1000, Math.floor(Number(qi.value) || 1))); state.qty = n; render(); });
    $$("input[name=project]", pf).forEach(function (r) { r.addEventListener("change", render); });
    var gift = $("#gift"), gb = $("#gift-fields");
    gift.addEventListener("change", function () { gb.hidden = !gift.checked; $("#cert").hidden = !gift.checked; });
    function bind(id, out, fallback) { var i = $(id), o = $(out); i.addEventListener("input", function () { o.textContent = i.value.trim() || fallback; }); }
    bind("#to", "#cert-to", "Your friend"); bind("#msg", "#cert-msg", "A tree for you."); bind("#from", "#cert-from", "From a friend");
    $("#occasion").addEventListener("change", function (e) { $("#cert-occ").textContent = e.target.value; });
    $("#add").addEventListener("click", function () {
      var p = proj();
      store.set("rukh-basket", JSON.stringify({ project: p.getAttribute("data-name"), place: p.getAttribute("data-place"), unit: Number(p.getAttribute("data-price")), qty: state.qty, freq: state.freq, gift: gift.checked, to: $("#to").value.trim() }));
      location.href = "checkout.html";
    });
    render();
  }

  /* basket badge and checkout summary */
  var basket = null;
  try { basket = JSON.parse(store.get("rukh-basket") || "null"); } catch (e) { basket = null; }
  $$("[data-basket-count]").forEach(function (el) { el.textContent = basket ? basket.qty : 0; });
  var co = $("[data-checkout]");
  if (co) {
    var b = basket || { project: "Sample project", place: "Nepal", unit: PRICE, qty: 5, freq: "once", gift: false };
    $("#co-line").textContent = b.qty + " x tree, " + b.project;
    $("#co-total").textContent = money(b.qty * b.unit) + (b.freq === "monthly" ? " / month" : "");
    $("#co-gift").textContent = b.gift ? "Gift" + (b.to ? " for " + b.to : "") : "For you";
    $("#co-form").addEventListener("submit", function (e) { e.preventDefault(); location.href = "thanks.html"; });
  }

  /* single-series column chart drawn from its table (the table stays as the text view) */
  $$("table[data-chart]").forEach(function (t) {
    var rows = $$("tbody tr", t).map(function (r) { var c = r.children; return { label: c[0].textContent.trim(), value: Number(c[1].textContent.replace(/[^0-9.]/g, "")) }; });
    var host = $(t.getAttribute("data-chart")), W = 640, H = 260, L = 44, B = 30, T = 24, R = 8;
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; })), top = Math.ceil(max / 200) * 200, ticks = [];
    for (var v = 0; v <= top; v += top / 4) ticks.push(v);
    var ph = H - B - T, band = (W - L - R) / rows.length, bw = Math.min(24, band * 0.5);
    var y = function (v) { return T + ph - (v / top) * ph; };
    var s = "<svg viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"" + host.getAttribute("data-title") + "\">";
    ticks.forEach(function (v) { s += "<line class=\"gridline\" x1=\"" + L + "\" x2=\"" + (W - R) + "\" y1=\"" + y(v) + "\" y2=\"" + y(v) + "\"/><text class=\"tick\" x=\"" + (L - 8) + "\" y=\"" + (y(v) + 4) + "\" text-anchor=\"end\">" + v + "</text>"; });
    s += "<line class=\"axis\" x1=\"" + L + "\" x2=\"" + (W - R) + "\" y1=\"" + y(0) + "\" y2=\"" + y(0) + "\"/>";
    rows.forEach(function (r, i) {
      var x = L + band * i + (band - bw) / 2, h = Math.max(2, y(0) - y(r.value)), yt = y(0) - h, rad = 4;
      var d = "M" + x + "," + y(0) + " V" + (yt + rad) + " Q" + x + "," + yt + " " + (x + rad) + "," + yt + " H" + (x + bw - rad) + " Q" + (x + bw) + "," + yt + " " + (x + bw) + "," + (yt + rad) + " V" + y(0) + " Z";
      s += "<path class=\"bar\" tabindex=\"0\" data-i=\"" + i + "\" d=\"" + d + "\" aria-label=\"" + r.label + ": " + r.value + " trees\"/>";
      s += "<text class=\"tick\" x=\"" + (x + bw / 2) + "\" y=\"" + (H - 8) + "\" text-anchor=\"middle\">" + r.label + "</text>";
      if (i === rows.length - 1) s += "<text class=\"cap\" x=\"" + (x + bw / 2) + "\" y=\"" + (yt - 6) + "\" text-anchor=\"middle\">" + r.value + "</text>";
    });
    host.innerHTML = s + "</svg>";
    var tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; host.appendChild(tip);
    function showTip(el) {
      var r = rows[Number(el.getAttribute("data-i"))], hb = host.getBoundingClientRect(), eb = el.getBoundingClientRect();
      tip.textContent = r.label + ": " + r.value + " trees (sample)"; tip.hidden = false;
      tip.style.left = Math.max(0, eb.left - hb.left + eb.width / 2 - tip.offsetWidth / 2) + "px"; tip.style.top = (eb.top - hb.top - 34) + "px";
    }
    $$(".bar", host).forEach(function (el) {
      el.addEventListener("mouseenter", function () { showTip(el); }); el.addEventListener("focus", function () { showTip(el); });
      el.addEventListener("mouseleave", function () { tip.hidden = true; }); el.addEventListener("blur", function () { tip.hidden = true; });
    });
    var tb = $(t.getAttribute("data-toggle")), wrap = t.closest(".tablewrap");
    wrap.hidden = true; tb.hidden = false;
    tb.addEventListener("click", function () { wrap.hidden = !wrap.hidden; tb.textContent = wrap.hidden ? "Show as table" : "Hide table"; });
  });

  var yr = $("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();
})();
