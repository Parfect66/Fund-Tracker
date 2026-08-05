let FUNDS = null;
let fundPromise = null;

// Dynamic import with cache-busting to ensure fresh module loads
async function loadFunds() {
  if (!fundPromise) {
    fundPromise = (async () => {
      if (!FUNDS) {
        const now = Date.now();
        const module = await import(`./funds.mjs?t=${now}`);
        FUNDS = module.FUNDS;
      }
      return FUNDS;
    })();
  }
  return fundPromise;
}

// Ensure FUNDS is loaded before any fund operations
async function ensureFundsLoaded() {
  if (!FUNDS) {
    await loadFunds();
  }
  return FUNDS;
}

let currentFund = null;
let lastHoldings = null;
let lastQuotes = null;

// Trading days in each range
const TRADING_DAYS_1W = 5;
const TRADING_DAYS_4W = 22;
const TRADING_DAYS_8W = 40;

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
  const deleted = JSON.parse(localStorage.getItem("deletedFunds") || "[]");
  select.innerHTML = Object.keys(FUNDS)
    .filter(name => !deleted.includes(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
  // Load automatically when the selection changes.
  select.removeEventListener("change", loadSelectedFund);
  select.addEventListener("change", loadSelectedFund);
  updateRestoreButton();
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

    // Extract after-hours data if available from Finnhub response
    let afterHoursPct = null;
    if (typeof data.afterHoursChange === "number" && typeof data.price === "number") {
      afterHoursPct = (data.afterHoursChange / data.price) * 100;
    } else if (typeof data.afterHoursChangePercent === "number") {
      afterHoursPct = data.afterHoursChangePercent;
    }

    return {
      ...data,
      afterHoursChangePercent: afterHoursPct,
    };
  } catch {
    return null;
  }
}

async function fetchViaCorsProxy(symbol) {
  const yahoo =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=3mo&interval=1d`;
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahoo)}`;
  try {
    const res = await fetch(proxied);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") throw new Error("no meta");
    const rawCloses = result?.indicators?.quote?.[0]?.close || [];
    const series = rawCloses.filter((v) => typeof v === "number");

    // After-hours data - try multiple field name variations Yahoo uses
    let ahPct = null;
    if (typeof meta.postMarketChangePercent === "number") {
      ahPct = meta.postMarketChangePercent;
    } else if (typeof meta.regularMarketChangePercent === "number" && meta.postMarketPrice) {
      // If we have post-market price but not percent, calculate it
      const postPrice = typeof meta.postMarketPrice === "number" ? meta.postMarketPrice : null;
      if (postPrice && typeof meta.regularMarketPrice === "number") {
        ahPct = ((postPrice - meta.regularMarketPrice) / meta.regularMarketPrice) * 100;
      }
    }

    return {
      symbol: meta.symbol || symbol,
      price: meta.regularMarketPrice,
      previousClose:
        series.length >= 2
          ? series[series.length - 2]
          : (typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : null),
      currency: meta.currency || null,
      series,
      afterHoursPrice: meta.postMarketPrice || null,
      afterHoursChangePercent: ahPct,
    };
  } catch {
    return null;
  }
}

// Calculate % change over a specified number of trading days.
function calcPercentChange(series, tradingDays) {
  if (!Array.isArray(series) || series.length < tradingDays + 1) return null;
  const oldPrice = series[series.length - tradingDays - 1];
  const newPrice = series[series.length - 1];
  if (typeof oldPrice !== 'number' || typeof newPrice !== 'number') return null;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

// ------------------------------
// LOAD A FUND
// ------------------------------
async function loadSelectedFund() {
  await ensureFundsLoaded();
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
        <td class="num price">…</td>
        <td class="num pct">…</td>
        <td class="num ah">…</td>
        <td class="num pct-1w">…</td>
        <td class="num pct-4w">…</td>
        <td class="num pct-8w">…</td>
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
      row.querySelector(".ah").textContent = "n/a";
      row.querySelector(".pct").textContent = "n/a";
      return;
    }

    const change = q.price - q.previousClose;
    const pct = (change / q.previousClose) * 100;
    const cls = changeClass(change);

    row.querySelector(".price").textContent = fmtPrice(q.price, q.currency);

    // After-hours display
    const ahCell = row.querySelector(".ah");
    const ahPct = q.afterHoursChangePercent !== null && typeof q.afterHoursChangePercent === "number"
      ? q.afterHoursChangePercent
      : null;
    ahCell.textContent = ahPct !== null ? fmtPct(ahPct) : "–";
    ahCell.className = `num ah ${changeClass(ahPct)}`;

    const pctCell = row.querySelector(".pct");
    pctCell.textContent = fmtPct(pct);
    pctCell.className = `num pct ${cls}`;

    // Calculate % changes for 1w, 4w, 8w
    const pct1w = calcPercentChange(q.series, TRADING_DAYS_1W);
    const pct4w = calcPercentChange(q.series, TRADING_DAYS_4W);
    const pct8w = calcPercentChange(q.series, TRADING_DAYS_8W);

    const pct1wCell = row.querySelector(".pct-1w");
    pct1wCell.textContent = pct1w !== null ? fmtPct(pct1w) : "n/a";
    pct1wCell.className = `num pct-1w ${changeClass(pct1w)}`;

    const pct4wCell = row.querySelector(".pct-4w");
    pct4wCell.textContent = pct4w !== null ? fmtPct(pct4w) : "n/a";
    pct4wCell.className = `num pct-4w ${changeClass(pct4w)}`;

    const pct8wCell = row.querySelector(".pct-8w");
    pct8wCell.textContent = pct8w !== null ? fmtPct(pct8w) : "n/a";
    pct8wCell.className = `num pct-8w ${changeClass(pct8w)}`;

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

  // Store quotes for future use.
  lastHoldings = fund.holdings;
  lastQuotes = quotes;

  document.getElementById("lastUpdated").textContent =
    "Prices updated: " + new Date().toLocaleString();

  // Show/hide remove button
  document.getElementById("removeBtn").style.display = "inline-block";
}

// Remove a fund from the tracker (stores in localStorage for persistence).
function removeFund() {
  if (!currentFund) return;
  const deleted = JSON.parse(localStorage.getItem("deletedFunds") || "[]");
  if (!deleted.includes(currentFund)) {
    deleted.push(currentFund);
    localStorage.setItem("deletedFunds", JSON.stringify(deleted));
  }
  populateFundList();
  updateRestoreButton();
  const select = document.getElementById("fundSelect");
  if (select.value === currentFund) {
    select.value = select.options[0]?.value || "";
    if (select.value) loadSelectedFund();
  }
  document.getElementById("removeBtn").style.display = "none";
  document.getElementById("fundMeta").style.display = "none";
  document.getElementById("holdingsBody").innerHTML =
    '<tr><td colspan="10" class="empty">Pick a fund above to load its holdings.</td></tr>';
}

// Update restore button visibility based on deleted funds.
function updateRestoreButton() {
  const deleted = JSON.parse(localStorage.getItem("deletedFunds") || "[]");
  document.getElementById("restoreBtn").style.display = deleted.length > 0 ? "inline-block" : "none";
}

// Open restore modal with list of hidden funds.
function openRestoreModal() {
  const deleted = JSON.parse(localStorage.getItem("deletedFunds") || "[]");
  const listContainer = document.getElementById("restoreList");
  listContainer.innerHTML = deleted
    .map((fundName) =>
      `<div class="modal-item" onclick="restoreFund('${fundName.replace(/'/g, "\\'")}')">${fundName}</div>`
    )
    .join("");
  document.getElementById("restoreModal").style.display = "flex";
}

// Close restore modal.
function closeRestoreModal() {
  document.getElementById("restoreModal").style.display = "none";
}

// Restore a specific deleted fund.
function restoreFund(fundName) {
  const deleted = JSON.parse(localStorage.getItem("deletedFunds") || "[]");
  const filtered = deleted.filter(f => f !== fundName);
  localStorage.setItem("deletedFunds", JSON.stringify(filtered));
  populateFundList();
  updateRestoreButton();
  closeRestoreModal();
}

// ------------------------------
// INIT + EXPOSE
// ------------------------------
// Wait for FUNDS to load, then initialize
ensureFundsLoaded().then(() => {
  populateFundList();

  // Preload the first fund so there's something on screen immediately.
  const firstFund = document.getElementById("fundSelect").value;
  if (firstFund) {
    currentFund = firstFund;
    renderFund(firstFund);
  }

  window.loadSelectedFund = loadSelectedFund;
  window.refreshCurrent = refreshCurrent;
  window.removeFund = removeFund;
  window.openRestoreModal = openRestoreModal;
  window.closeRestoreModal = closeRestoreModal;
  window.restoreFund = restoreFund;
});
