// Multi-source quote API: tries Finnhub first, then FMP, Marketstack, Yahoo.
//
// Finnhub: primary source, good free tier, global coverage
// FMP: fallback if Finnhub doesn't have symbol or reaches limits
// Marketstack: reliable for international symbols (.L, .T, .KS, .TW, .DE, etc)
// Yahoo Finance: final fallback for everything

async function fetchFinnhubQuote(symbol) {
  const key = process.env.FINNHUB_KEY;
  if (!key) throw new Error('Finnhub key not configured');

  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Finnhub HTTP ' + response.status);

  const data = await response.json();
  if (typeof data.c !== 'number' || typeof data.pc !== 'number') {
    throw new Error(`Finnhub: missing price data for ${symbol}`);
  }

  // Finnhub includes after-hours data in the extended response
  // Check for after-hours close (aftC) or after-hours change fields
  let afterHoursChange = null;
  let afterHoursChangePercent = null;
  if (typeof data.aftC === 'number' && typeof data.c === 'number') {
    afterHoursChange = data.aftC - data.c;
    afterHoursChangePercent = (afterHoursChange / data.c) * 100;
  }

  return {
    price: data.c,
    previousClose: data.pc,
    time: data.t || Math.floor(Date.now() / 1000),
    series: [data.pc],
    afterHoursChange,
    afterHoursChangePercent,
  };
}

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

  const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('FMP HTTP ' + response.status);

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`FMP: no data for ${symbol}`);
  }

  const quote = data[0];
  if (!quote.price || typeof quote.previousClose !== 'number') {
    throw new Error(`FMP: missing price data for ${symbol}`);
  }

  // Fetch after-hours data from FMP's dedicated aftermarket endpoint
  let afterHoursChangePercent = null;
  try {
    const ahUrl = `https://financialmodelingprep.com/stable/aftermarket-trade?symbol=${symbol}&apikey=${key}`;
    const ahResponse = await fetch(ahUrl);
    if (ahResponse.ok) {
      const ahData = await ahResponse.json();
      if (Array.isArray(ahData) && ahData.length > 0) {
        const ahTrade = ahData[0];
        // FMP returns after-hours price, calculate % change from regular market price
        if (typeof ahTrade.price === 'number' && typeof quote.price === 'number') {
          afterHoursChangePercent = ((ahTrade.price - quote.price) / quote.price) * 100;
        }
      }
    }
  } catch {
    // After-hours data not available, continue with null
  }

  return {
    price: quote.price,
    previousClose: quote.previousClose,
    time: quote.timestamp || Math.floor(Date.now() / 1000),
    series: [quote.previousClose],
    afterHoursChangePercent,
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

    // For Asia-Pacific symbols, use Marketstack first (more reliable for regional exchanges)
    const isAsiaPacific = shouldUseMarketstack(symbol);

    if (isAsiaPacific) {
      try {
        quote = await fetchMarketstackQuote(symbol);
        source = "Marketstack";
      } catch (e) {
        console.log(`Marketstack failed for ${symbol}: ${e.message}`);
        try {
          quote = await fetchFmpQuote(symbol);
          source = "FMP";
        } catch (e2) {
          console.log(`FMP failed for ${symbol}: ${e2.message}`);
          quote = await fetchYahooQuote(symbol);
          source = "Yahoo";
        }
      }
    } else {
      // For other symbols, try Finnhub first
      try {
        quote = await fetchFinnhubQuote(symbol);
        source = "Finnhub";
      } catch (e) {
        console.log(`Finnhub failed for ${symbol}: ${e.message}`);
        try {
          quote = await fetchFmpQuote(symbol);
          source = "FMP";
        } catch (e2) {
          console.log(`FMP failed for ${symbol}: ${e2.message}`);
          quote = await fetchYahooQuote(symbol);
          source = "Yahoo";
        }
      }
    }

    if (!quote || typeof quote.price !== "number") {
      throw new Error("Failed to fetch quote from any source");
    }

    // Always try to fetch after-hours data from FMP, even if other source was used for price
    if (!quote.afterHoursChangePercent) {
      try {
        const fmpQuote = await fetchFmpQuote(symbol);
        if (typeof fmpQuote.afterHoursChangePercent === 'number') {
          quote.afterHoursChangePercent = fmpQuote.afterHoursChangePercent;
        }
      } catch {
        // After-hours data not available
      }
    }

    // Always fetch full series from Yahoo for 1w/4w/8w calculations, even if price came from another source
    if (!quote.series || quote.series.length < 10) {
      try {
        const yahooQuote = await fetchYahooQuote(symbol);
        if (yahooQuote.series && yahooQuote.series.length > 10) {
          quote.series = yahooQuote.series;
        }
      } catch {
        // If Yahoo fails, keep whatever series we have
      }
    }

    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({
      symbol: symbol,
      price: quote.price,
      previousClose: quote.previousClose,
      currency: null,
      time: quote.time,
      series: quote.series || [],
      afterHoursChangePercent: quote.afterHoursChangePercent || null,
      _source: source, // Debug: shows which source was used
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
