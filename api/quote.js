// Yahoo Finance chart-endpoint proxy.
//
// The browser can't call Yahoo directly (CORS), so this serverless function
// fetches on its behalf and returns just the fields we need. No API key.
//
// range=1d&interval=1d gives us meta.regularMarketPrice (latest / today's close)
// and meta.chartPreviousClose (the prior trading day's close) — exactly what we
// need for a daily % change.

export default async function handler(req, res) {
  const { symbol } = req.query;

  // Symbols come from our own curated fund map, but validate the shape anyway.
  if (!symbol || !/^[A-Za-z0-9.\-]{1,15}$/.test(symbol)) {
    return res.status(400).json({ error: "Invalid symbol" });
  }

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=1d&interval=1d`;

  try {
    const response = await fetch(url, {
      headers: {
        // Yahoo rejects requests without a browser-like UA.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") {
      throw new Error("No quote in Yahoo response");
    }

    res.setHeader("Cache-Control", "s-maxage=30");
    res.status(200).json({
      symbol: meta.symbol || symbol,
      price: meta.regularMarketPrice,
      previousClose:
        typeof meta.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : (typeof meta.previousClose === "number" ? meta.previousClose : null),
      currency: meta.currency || null,
      time: meta.regularMarketTime || null,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
