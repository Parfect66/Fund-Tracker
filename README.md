# Scottish Widows Fund Tracker

Enter a Scottish Widows pension fund and see its **top 10 holdings** with each
one's move vs the previous day's close, plus a top-10 weighted daily move.

- **Holdings** come from the fund's Trustnet factsheet (curated in `funds.mjs`).
  They only change monthly/quarterly, so you refresh the map when a new factsheet
  lands — see below.
- **Prices** are live from Yahoo Finance (no API key).

## Run locally

```
py dev_server.py
```

Then open http://localhost:4173. `dev_server.py` serves the site and proxies
Yahoo at `/api/quote` (so no CORS proxy needed). Requires Python 3.7+.

## Deploy (Vercel)

Push the folder to Vercel exactly like the previous dashboard. `api/quote.js`
is the serverless version of the same proxy, so the front end's `/api/quote`
calls work unchanged. No environment variables needed.

## Add / update a fund

Edit `funds.mjs`. Each fund is one entry:

```js
"SW <fund name as you'll type it>": {
  citicode: "XXXX",                       // Trustnet citicode
  factsheet: "https://www.trustnet.com/...",
  asAt: "29 May 2026",                    // 'holdings as at' date on the factsheet
  holdings: [
    { rank: 1, name: "Vertex Pharmaceuticals", ticker: "VRTX", weight: 7.09 },
    // ... 10 rows
  ],
}
```

`ticker` must be the **Yahoo Finance** symbol: US listings are plain (`VRTX`,
`GILD`); London listings use a `.L` suffix (`AZN.L`, `SHEL.L`); other exchanges
have their own suffixes. The fund name becomes an autocomplete option in the
search box automatically.

## Notes

- The scaffold fund (SW AXA Framlington Biotech CS8) wraps the underlying
  *AXA Framlington Biotech Z Acc GBP* fund; its top 10 are US-listed biotech.
- "Top-10 weighted daily move" is the fund-weighted average move of the ten
  listed holdings only — a proxy for the biggest positions' effect today, not
  the full-portfolio return.
- Not investment advice.
