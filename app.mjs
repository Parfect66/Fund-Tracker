import { FUNDS } from "./funds.mjs";

let currentFund = null;

// ------------------------------
// UI HELPERS
// ------------------------------
function setError(msg) {
  document.getElementById("errorBox").textContent = msg || "";
}

function fmtPct(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "–";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  const dp = Math.abs(n) >= 1000 ? 0 : 2;
  return n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function fmtPrice(n, currency) {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  return currency ? `${fmtNum(n)} ${currency}` : fmtNum(n);
}

function changeClass(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "";
  if (v > 0) return "up";
  if (v < 0) return "down";
  return "flat";
}

// ------------------------------
// POPULATE FUND PICKER
// ------------------------------
function populateFundList() {
  const select = document.getElementById("fundSelect");
  select.innerHTML = Object.keys(FUNDS)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
  // Load automatically when the selection changes.
  select.addEventListener("change", loadSelectedFund);
}

// ------------------------------
// QUOTES
// ------------------------------
// Primary path: our serverless proxy (/api/quote) — used when deployed to Vercel.
// Fallback path: call Yahoo directly through a public CORS proxy — lets the app
// work as a plain static page / local preview with no backend running.
async function fetchQuote(symbol) {
  const viaApi = await fetchViaApi(symbol);
  if (viaApi) return viaApi;
  return fetchViaCorsProxy(symbol);
}

async function fetchViaApi(symbol) {
  try {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (typeof data.price !== "number") throw new Error("no price");
    return data; // { price, previousClose, currency, ... }
  } catch {
    return null;
  }
}

async function fetchViaCorsProxy(symbol) {
  const yahoo =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=1d&interval=1d`;
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahoo)}`;
  try {
    const res = await fetch(proxied);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") throw new Error("no meta");
    return {
      symbol: meta.symbol || symbol,
      price: meta.regularMarketPrice,
      previousClose:
        typeof meta.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : (typeof meta.previousClose === "number" ? meta.previousClose : null),
      currency: meta.currency || null,
    };
  } catch {
    return null;
  }
}

// ------------------------------
// LOAD A FUND
// ------------------------------
function loadSelectedFund() {
  const name = document.getElementById("fundSelect").value;
  if (!FUNDS[name]) {
    setError(`"${name}" isn't in the tracker yet.`);
    return;
  }
  currentFund = name;
  renderFund(name);
}

async function refreshCurrent() {
  if (currentFund) renderFund(currentFund);
}

async function renderFund(name) {
  setError("");
  const fund = FUNDS[name];

  // Fund meta
  document.getElementById("fundMeta").style.display = "block";
  document.getElementById("fundName").textContent = name;
  document.getElementById("asAt").textContent = fund.asAt;
  document.getElementById("fundSource").innerHTML =
    `Source: <a href="${fund.factsheet}" target="_blank" rel="noopener">Trustnet factsheet</a> (Citicode ${fund.citicode}) · prices: Yahoo Finance`;
  document.getElementById("weightedMove").textContent = "loading…";

  const body = document.getElementById("holdingsBody");

  // Skeleton rows while quotes load.
  body.innerHTML = fund.holdings
    .map(
      (h) => `
      <tr data-ticker="${h.ticker}">
        <td class="col-rank">${h.rank}</td>
        <td>${h.name}</td>
        <td class="ticker">${h.ticker}</td>
        <td class="num">${typeof h.weight === "number" ? h.weight.toFixed(2) + "%" : "n/a"}</td>
        <td class="num price">…</td>
        <td class="num chg">…</td>
        <td class="num pct">…</td>
      </tr>`
    )
    .join("");

  // Fetch all quotes in parallel.
  const quotes = await Promise.all(
    fund.holdings.map((h) => fetchQuote(h.ticker))
  );

  let weightedSum = 0;
  let weightAvailable = 0;
  let pctSum = 0;
  let pctCount = 0;

  fund.holdings.forEach((h, i) => {
    const q = quotes[i];
    const row = body.querySelector(`tr[data-ticker="${CSS.escape(h.ticker)}"]`);
    if (!row) return;

    if (!q || typeof q.previousClose !== "number") {
      row.querySelector(".price").textContent = q ? fmtPrice(q.price, q.currency) : "n/a";
      row.querySelector(".chg").textContent = "n/a";
      row.querySelector(".pct").textContent = "n/a";
      return;
    }

    const change = q.price - q.previousClose;
    const pct = (change / q.previousClose) * 100;
    const cls = changeClass(change);

    row.querySelector(".price").textContent = fmtPrice(q.price, q.currency);
    const chgCell = row.querySelector(".chg");
    chgCell.textContent = `${change >= 0 ? "+" : ""}${fmtNum(change)}`;
    chgCell.className = `num chg ${cls}`;
    const pctCell = row.querySelector(".pct");
    pctCell.textContent = fmtPct(pct);
    pctCell.className = `num pct ${cls}`;

    pctSum += pct;
    pctCount += 1;
    if (typeof h.weight === "number") {
      weightedSum += h.weight * pct;
      weightAvailable += h.weight;
    }
  });

  // Weighted move across the holdings we priced. Fall back to a simple average
  // when the fund has no per-holding weights.
  const hasWeights = weightAvailable > 0;
  const wm = hasWeights
    ? weightedSum / weightAvailable
    : (pctCount > 0 ? pctSum / pctCount : null);
  const wmEl = document.getElementById("weightedMove");
  wmEl.textContent = fmtPct(wm);
  wmEl.className = `metric-value ${changeClass(wm)}`;
  document.getElementById("weightedMoveLabel").textContent = hasWeights
    ? "Top-10 weighted daily move"
    : "Top-10 average daily move (equal-weighted)";

  document.getElementById("lastUpdated").textContent =
    "Prices updated: " + new Date().toLocaleString();
}

// ------------------------------
// INIT + EXPOSE
// ------------------------------
populateFundList();

// Preload the first fund so there's something on screen immediately.
const firstFund = document.getElementById("fundSelect").value;
if (firstFund) {
  currentFund = firstFund;
  renderFund(firstFund);
}

window.loadSelectedFund = loadSelectedFund;
window.refreshCurrent = refreshCurrent;
