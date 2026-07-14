// ---------------------------------------------------------------------------
// Curated Scottish Widows fund -> top-10 holdings map.
//
// Holdings are seeded from each fund's Trustnet / FE fundinfo factsheet. They
// only change monthly/quarterly, so this map just needs a refresh when a new
// factsheet lands. Live prices come from Yahoo Finance at runtime (api/quote.js).
//
// To add a fund by hand: copy a block, set the Trustnet citicode + factsheet
// URL, the "as at" date printed on the factsheet, and the top-10 rows. Or drop
// a factsheet PDF in ./factsheets and run:  py ingest_factsheet.py factsheets/xxx.pdf
//
// `ticker` must be the Yahoo Finance symbol:
//   US        -> plain            (VRTX, NVDA)
//   London    -> .L  (pence/GBp)  (BARC.L, SHEL.L)
//   Australia -> .AX              (NST.AX)
//   Tokyo     -> .T               (8802.T)
//   Taiwan    -> .TW              (2330.TW)
//   Korea     -> .KS              (005930.KS)
//   Hong Kong -> .HK              (0700.HK)
//   Toronto   -> .TO              (EDV.TO)
//   Shanghai  -> .SS              (600183.SS)
// Prices show in each holding's local currency (mixed within a fund is fine —
// the daily % change is currency-independent).
// ---------------------------------------------------------------------------

export const FUNDS = {
  "SW AXA Framlington Biotech CS8": {
    citicode: "W3ZN",
    factsheet: "https://www.trustnet.com/factsheets/P/W3ZN/sw-axa-framlington-biotech-cs8-pn/",
    asAt: "29 May 2026",
    holdings: [
      { rank: 1,  name: "Vertex Pharmaceuticals",    ticker: "VRTX", weight: 7.09 },
      { rank: 2,  name: "Gilead Sciences",           ticker: "GILD", weight: 6.28 },
      { rank: 3,  name: "Amgen",                     ticker: "AMGN", weight: 6.09 },
      { rank: 4,  name: "Regeneron Pharmaceuticals", ticker: "REGN", weight: 5.90 },
      { rank: 5,  name: "argenx SE",                 ticker: "ARGX", weight: 4.64 },
      { rank: 6,  name: "United Therapeutics",       ticker: "UTHR", weight: 3.90 },
      { rank: 7,  name: "Insmed",                    ticker: "INSM", weight: 3.57 },
      { rank: 8,  name: "Ionis Pharmaceuticals",     ticker: "IONS", weight: 3.51 },
      { rank: 9,  name: "Revolution Medicines",      ticker: "RVMD", weight: 3.24 },
      { rank: 10, name: "Alnylam Pharmaceuticals",   ticker: "ALNY", weight: 3.05 },
    ],
  },

  "SW BNY Mellon UK Income CS8": {
    citicode: "R70Q",
    factsheet: "https://www.trustnet.com/factsheets/P/R70Q/sw-bny-mellon-uk-income-cs8-pn/",
    asAt: "31 Mar 2026",
    holdings: [
      { rank: 1,  name: "HSBC Holdings",             ticker: "HSBA.L", weight: 10.21 },
      { rank: 2,  name: "Shell",                     ticker: "SHEL.L", weight: 9.98 },
      { rank: 3,  name: "GSK",                       ticker: "GSK.L",  weight: 8.00 },
      { rank: 4,  name: "Barclays",                  ticker: "BARC.L", weight: 5.51 },
      { rank: 5,  name: "Lloyds Banking Group",      ticker: "LLOY.L", weight: 4.27 },
      { rank: 6,  name: "Standard Chartered",        ticker: "STAN.L", weight: 4.25 },
      { rank: 7,  name: "Land Securities Group",     ticker: "LAND.L", weight: 3.95 },
      { rank: 8,  name: "Glencore",                  ticker: "GLEN.L", weight: 3.78 },
      { rank: 9,  name: "Volkswagen (Pref)",         ticker: "VOW3.DE", weight: 3.45 },
      { rank: 10, name: "BNP Paribas",               ticker: "BNPP.PA", weight: 2.91 },
    ],
  },

  "SW L&G FTSE Developed Core Infrastructure Index CS8": {
    citicode: "V3UR",
    factsheet: "https://www.trustnet.com/factsheets/P/V3UR/sw-l-g-ftse-developed-core-infrastructure-index-cs8-pn/",
    asAt: "31 Mar 2026",
    holdings: [
      { rank: 1,  name: "NextEra Energy",            ticker: "NEE",     weight: 6.46 },
      { rank: 2,  name: "Union Pacific",             ticker: "UNP",     weight: 4.84 },
      { rank: 3,  name: "Enbridge",                  ticker: "ENB.TO",  weight: 3.94 },
      { rank: 4,  name: "Southern Company",          ticker: "SO",      weight: 3.54 },
      { rank: 5,  name: "Duke Energy",               ticker: "DUK",     weight: 3.39 },
      { rank: 6,  name: "Williams Companies",        ticker: "WMB",     weight: 2.96 },
      { rank: 7,  name: "National Grid",             ticker: "NGG",     weight: 2.77 },
      { rank: 8,  name: "American Tower",            ticker: "AMT",     weight: 2.70 },
      { rank: 9,  name: "CSX",                       ticker: "CSX",     weight: 2.57 },
      { rank: 10, name: "Canadian Pacific Kansas City", ticker: "CP.TO", weight: 2.37 },
    ],
  },

  "SW Blackrock ACS Climate Transition Screened World Equity CS8": {
    citicode: "LBZE",
    factsheet: "https://www.trustnet.com/factsheets/P/LBZE/sw-blackrock-acs-climate-transition-screened-and-optimised-world-equity-cs8-pn/",
    asAt: "31 Mar 2026",
    holdings: [
      { rank: 1,  name: "NVIDIA",                    ticker: "NVDA",   weight: 5.34 },
      { rank: 2,  name: "Apple",                     ticker: "AAPL",   weight: 5.07 },
      { rank: 3,  name: "Microsoft",                 ticker: "MSFT",   weight: 3.31 },
      { rank: 4,  name: "Amazon",                    ticker: "AMZN",   weight: 2.60 },
      { rank: 5,  name: "Alphabet (Class A)",        ticker: "GOOGL",  weight: 2.16 },
      { rank: 6,  name: "Alphabet (Class C)",        ticker: "GOOG",   weight: 1.81 },
      { rank: 7,  name: "Broadcom",                  ticker: "AVGO",   weight: 1.71 },
      { rank: 8,  name: "Mastercard",                ticker: "MA",     weight: 1.47 },
      { rank: 9,  name: "Meta Platforms",            ticker: "META",   weight: 1.47 },
      { rank: 10, name: "Tesla",                     ticker: "TSLA",   weight: 1.43 },
    ],
  },

  "SW SSGA International Equity Index CS8": {
    citicode: "R75K",
    factsheet: "https://www.trustnet.com/factsheets/P/R75K/sw-ssga-international-equity-index-cs8-pn/",
    asAt: "31 Mar 2026",
    holdings: [
      { rank: 1,  name: "NVIDIA",                    ticker: "NVDA",   weight: 5.17 },
      { rank: 2,  name: "Apple",                     ticker: "AAPL",   weight: 4.63 },
      { rank: 3,  name: "Microsoft",                 ticker: "MSFT",   weight: 3.48 },
      { rank: 4,  name: "Amazon",                    ticker: "AMZN",   weight: 2.53 },
      { rank: 5,  name: "Alphabet (Class A)",        ticker: "GOOGL",  weight: 2.12 },
      { rank: 6,  name: "Broadcom",                  ticker: "AVGO",   weight: 1.81 },
      { rank: 7,  name: "Alphabet (Class C)",        ticker: "GOOG",   weight: 1.72 },
      { rank: 8,  name: "Taiwan Semiconductor",      ticker: "2330.TW", weight: 1.70 },
      { rank: 9,  name: "Meta Platforms",            ticker: "META",   weight: 1.58 },
      { rank: 10, name: "Tesla",                     ticker: "TSLA",   weight: 1.33 },
    ],
  },

  "SW Artemis US Select CS8": {
    citicode: "R6ZO",
    factsheet: "https://www.trustnet.com/factsheets/P/R6ZO/sw-artemis-us-select-pn-cs8/",
    asAt: "31 May 2026",
    holdings: [
      { rank: 1,  name: "NVIDIA",                    ticker: "NVDA",   weight: 7.7 },
      { rank: 2,  name: "Advanced Micro Devices",    ticker: "AMD",    weight: 6.5 },
      { rank: 3,  name: "Alphabet (Class A)",        ticker: "GOOGL",  weight: 6.0 },
      { rank: 4,  name: "Amazon",                    ticker: "AMZN",   weight: 5.3 },
      { rank: 5,  name: "Goldman Sachs Group",       ticker: "GS",     weight: 4.2 },
      { rank: 6,  name: "Bank of New York Mellon",   ticker: "BNY",     weight: 4.1 },
      { rank: 7,  name: "J.B. Hunt Transport",       ticker: "JBHT",   weight: 3.1 },
      { rank: 8,  name: "Micron Technology",         ticker: "MU",     weight: 3.0 },
      { rank: 9,  name: "Cardinal Health",           ticker: "CAH",    weight: 2.8 },
      { rank: 10, name: "Eli Lilly & Co",            ticker: "LLY",    weight: 2.7 },
    ],
  },

  "SW Baillie Gifford Japanese Equity CS8": {
    citicode: "R75D",
    factsheet: "https://www.trustnet.com/factsheets/P/R75D/sw-baillie-gifford-japanese-equity-pn-cs8/",
    asAt: "30 Jun 2026",
    holdings: [
      { rank: 1,  name: "SoftBank Group",            ticker: "9984.T", weight: 6.7 },
      { rank: 2,  name: "Sumitomo Mitsui Trust",     ticker: "8233.T", weight: 5.4 },
      { rank: 3,  name: "Sony",                      ticker: "6758.T", weight: 3.7 },
      { rank: 4,  name: "SBI Holdings",              ticker: "8473.T", weight: 3.6 },
      { rank: 5,  name: "FANUC",                     ticker: "6954.T", weight: 3.5 },
      { rank: 6,  name: "SMC",                       ticker: "6273.T", weight: 3.3 },
      { rank: 7,  name: "Rakuten",                   ticker: "4755.T", weight: 3.1 },
      { rank: 8,  name: "Recruit Holdings",          ticker: "6098.T", weight: 3.1 },
      { rank: 9,  name: "CyberAgent",                ticker: "4751.T", weight: 2.8 },
      { rank: 10, name: "Keyence",                   ticker: "6861.T", weight: 2.7 },
    ],
  },
};
