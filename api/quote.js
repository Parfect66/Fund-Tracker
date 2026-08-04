// Multi-source quote API: tries Marketstack first, then FMP, falls back to Yahoo.
//
// Marketstack: reliable for international symbols (.L, .T, .KS, .TW, .DE, etc)
// FMP: fallback for international if Marketstack fails
// Yahoo Finance: final fallback for everything, but known to have stale data issues

async function fetchMarketstackQuote(symbol) {
  const key = process.env.MARKETSTACK_KEY;
  if (!key) throw new Error('Marketstack key not configured');

  const url = `https://api.marketstack.com/v2/eod?symbols=${symbol}&access_key=${key}&limit=2`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Marketstack HTTP ' + response.status);

  const data = await response.json();
  if (!data.data || data.data.length === 0) {
    throw new Error(`Marketstack: no data for ${symbol}`);
  }

  const latest = data.data[0];
  const previous = data.data.length > 1 ? data.data[1] : latest;

  return {
    price: latest.adj_close || latest.close,
    previousClose: previous.adj_close || previous.close,
    time: Math.floor(new Date(latest.date).getTime() / 1000),
    series: [previous.adj_close || previous.close], // simplified series for sparkline
  };
}

async function fetchFmpQuote(symbol) {
  const key = process.env.FMP_KEY;
  if (!key) throw new Error('FMP key not configured');

  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('FMP HTTP ' + response.status);

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`FMP: no data for ${symbol}`);
  }

  const quote = data[0];
  if (!quote.price || !quote.previousClose) {
    throw new Error(`FMP: missing price data for ${symbol}`);
  }

  return {
    price: quote.price,
    previousClose: quote.previousClose,
    time: Math.floor(quote.timestamp * 1000),
    series: [quote.previousClose],
  };
}

async function fetchYahooQuote(symbol) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=3mo&interval=1d`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("Yahoo HTTP " + response.status);

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") {
    throw new Error("No quote in Yahoo response");
  }

  const rawCloses = result?.indicators?.quote?.[0]?.close || [];
  const series = rawCloses.filter((v) => typeof v === "number");

  return {
    price: meta.regularMarketPrice,
    previousClose: typeof meta.previousClose === "number"
      ? meta.previousClose
      : (typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : null),
    time: meta.regularMarketTime || null,
    series,
  };
}

// Determine if a ticker should use Marketstack for better international coverage
function shouldUseMarketstack(symbol) {
  return /\.(L|T|KS|TW|DE|PA|MI|AX|TO|SS|HK|SI|NZ)$/i.test(symbol);
}

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol || !/^[A-Za-z0-9.\-]{1,15}$/.test(symbol)) {
    return res.status(400).json({ error: "Invalid symbol" });
  }

  try {
    let quote = null;
    let source = "unknown";

    // Try FMP first for all symbols (conserve Marketstack's 100 calls/month)
    try {
      quote = await fetchFmpQuote(symbol);
      source = "FMP";
    } catch (e) {
      console.log(`FMP failed for ${symbol}: ${e.message}`);
      try {
        // Fall back to Marketstack for international symbols FMP couldn't handle
        if (shouldUseMarketstack(symbol)) {
          quote = await fetchMarketstackQuote(symbol);
          source = "Marketstack";
        } else {
          throw e; // Re-throw to fall through to Yahoo
        }
      } catch (e2) {
        console.log(`Marketstack failed for ${symbol}: ${e2.message}`);
        quote = await fetchYahooQuote(symbol);
        source = "Yahoo";
      }
    }

    if (!quote || typeof quote.price !== "number") {
      throw new Error("Failed to fetch quote from any source");
    }

    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({
      symbol: symbol,
      price: quote.price,
      previousClose: quote.previousClose,
      currency: null,
      time: quote.time,
      series: quote.series || [],
      _source: source, // Debug: shows which source was used
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
