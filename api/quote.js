// Yahoo Finance chart-endpoint proxy.
//
// The browser can't call Yahoo directly (CORS), so this serverless function
// fetches on its behalf and returns just the fields we need. No API key.
//
// range=3mo&interval=1d gives ~90 days of daily closes. We return:
//   price          latest price (meta.regularMarketPrice)
//   previousClose  the prior trading day's close (second-last close in series)
//   series         the daily closes, for the 90-day sparkline
//
// Note: with a 3mo range, meta.chartPreviousClose is the close from ~3 months
// ago (the day before the window), NOT yesterday — so we derive previousClose
// from the closes array instead.

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol || !/^[A-Za-z0-9.\-]{1,15}$/.test(symbol)) {
    return res.status(400).json({ error: "Invalid symbol" });
  }

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=3mo&interval=1d`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") {
      throw new Error("No quote in Yahoo response");
    }

    const rawCloses = result?.indicators?.quote?.[0]?.close || [];
    const series = rawCloses.filter((v) => typeof v === "number");

    const price = meta.regularMarketPrice;
    const previousClose =
      series.length >= 2
        ? series[series.length - 2]
        : (typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : null);

    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json({
      symbol: meta.symbol || symbol,
      price,
      previousClose,
      currency: meta.currency || null,
      time: meta.regularMarketTime || null,
      series,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
