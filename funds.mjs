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

  "SW Schroder US Smaller Companies CS8": {
    citicode: "r73q",
    factsheet: "https://www.trustnet.com/factsheets/P/r73q/sw-schroder-us-smaller-companies-pn-cs8/",
    asAt: "30 Apr 2026",
    holdings: [
      { rank: 1,  name: "Viavi Solutions",             ticker: "VIAV", weight: 2.8 },
      { rank: 2,  name: "ICU Medical",                 ticker: "ICUI", weight: 2.0 },
      { rank: 3,  name: "Semtech",                     ticker: "SMTC", weight: 1.8 },
      { rank: 4,  name: "Ciena",                       ticker: "CIEN", weight: 1.8 },
      { rank: 5,  name: "Perella Weinberg Partners",   ticker: "PWP",  weight: 1.8 },
      { rank: 6,  name: "Modine Manufacturing",        ticker: "MOD",  weight: 1.8 },
      { rank: 7,  name: "Moog Inc",                    ticker: "MOG-A", weight: 1.7 },
      { rank: 8,  name: "Hexcel",                      ticker: "HXL",  weight: 1.7 },
      { rank: 9,  name: "McGrath RentCorp",            ticker: "MGRC", weight: 1.7 },
      { rank: 10, name: "MACOM Technology Solutions",  ticker: "MTSI", weight: 1.7 },
    ],
  },

  "SW Schroder Global Cities Real Estate CS8": {
    citicode: "r6o9",
    factsheet: "https://www.trustnet.com/factsheets/P/r6o9/sw-schroder-global-cities-real-estate-cs7-pn/",
    asAt: "30 Apr 2026",
    holdings: [
      { rank: 1,  name: "Welltower",              ticker: "WELL",   weight: 8.1 },
      { rank: 2,  name: "Equinix",                ticker: "EQIX",   weight: 6.4 },
      { rank: 3,  name: "Prologis",               ticker: "PLD",    weight: 5.6 },
      { rank: 4,  name: "Digital Realty Trust",   ticker: "DLR",    weight: 4.5 },
      { rank: 5,  name: "Simon Property Group",   ticker: "SPG",    weight: 3.8 },
      { rank: 6,  name: "Goodman Group",          ticker: "GMG.AX", weight: 3.4 },
      { rank: 7,  name: "Realty Income",          ticker: "O",      weight: 3.2 },
      { rank: 8,  name: "Ventas",                 ticker: "VTR",    weight: 3.0 },
      { rank: 9,  name: "Public Storage",         ticker: "PSA",    weight: 2.5 },
      { rank: 10, name: "Mitsubishi Estate",      ticker: "8802.T", weight: 2.2 },
    ],
  },

  "SW Artemis UK Select CS8": {
    citicode: "bv04",
    factsheet: "https://www.trustnet.com/factsheets/p/bv04/sw-artemis-uk-select-pension",
    asAt: "31 Mar 2026",
    holdings: [
      { rank: 1,  name: "Barclays",                       ticker: "BARC.L", weight: 5.9 },
      { rank: 2,  name: "Standard Chartered",             ticker: "STAN.L", weight: 5.9 },
      { rank: 3,  name: "Lloyds Banking Group",           ticker: "LLOY.L", weight: 5.0 },
      { rank: 4,  name: "Rolls-Royce Holdings",           ticker: "RR.L",   weight: 4.9 },
      { rank: 5,  name: "Marks & Spencer Group",          ticker: "MKS.L",  weight: 4.7 },
      { rank: 6,  name: "NatWest Group",                  ticker: "NWG.L",  weight: 4.6 },
      { rank: 7,  name: "Intl Consolidated Airlines (IAG)", ticker: "IAG.L", weight: 4.1 },
      { rank: 8,  name: "HSBC Holdings",                  ticker: "HSBA.L", weight: 3.9 },
      { rank: 9,  name: "Shell",                          ticker: "SHEL.L", weight: 3.4 },
      { rank: 10, name: "3i Group",                       ticker: "III.L",  weight: 3.2 },
    ],
  },

  "SW Artemis US Select CS8": {
    citicode: "R6ZO",
    factsheet: "https://www.trustnet.com/factsheets/P/R6ZO/sw-artemis-us-select-pn-cs8/",
    asAt: "31 Mar 2026",
    holdings: [
      { rank: 1,  name: "NVIDIA",               ticker: "NVDA",  weight: 8.8 },
      { rank: 2,  name: "Alphabet (Class A)",   ticker: "GOOGL", weight: 4.4 },
      { rank: 3,  name: "Bank of New York Mellon", ticker: "BK", weight: 4.3 },
      { rank: 4,  name: "Apple",                ticker: "AAPL",  weight: 4.3 },
      { rank: 5,  name: "Goldman Sachs Group",  ticker: "GS",    weight: 3.8 },
      { rank: 6,  name: "Cardinal Health",      ticker: "CAH",   weight: 3.7 },
      { rank: 7,  name: "Targa Resources",      ticker: "TRGP",  weight: 3.3 },
      { rank: 8,  name: "Walmart",              ticker: "WMT",   weight: 3.2 },
      { rank: 9,  name: "Broadcom",             ticker: "AVGO",  weight: 3.1 },
      { rank: 10, name: "Parker-Hannifin",      ticker: "PH",    weight: 3.0 },
    ],
  },

  "SW BlackRock Gold & General CS8": {
    citicode: "r70c",
    factsheet: "https://www.trustnet.com/factsheets/P/r70c/sw-blackrock-gold-&-general-pn-cs8/",
    asAt: "30 Apr 2026",
    holdings: [
      { rank: 1,  name: "Barrick Mining",           ticker: "B",      weight: 8.3 },
      { rank: 2,  name: "Newmont",                  ticker: "NEM",    weight: 6.9 },
      { rank: 3,  name: "AngloGold Ashanti",        ticker: "AU",     weight: 6.4 },
      { rank: 4,  name: "Wheaton Precious Metals",  ticker: "WPM",    weight: 5.4 },
      { rank: 5,  name: "Northern Star Resources",  ticker: "NST.AX", weight: 5.2 },
      { rank: 6,  name: "Kinross Gold",             ticker: "KGC",    weight: 4.8 },
      { rank: 7,  name: "Endeavour Mining",         ticker: "EDV.TO", weight: 4.7 },
      { rank: 8,  name: "Franco-Nevada",            ticker: "FNV",    weight: 4.5 },
      { rank: 9,  name: "Agnico Eagle Mines",       ticker: "AEM",    weight: 4.2 },
      { rank: 10, name: "Alamos Gold",              ticker: "AGI",    weight: 3.9 },
    ],
  },

  "SW Fidelity Asia CS8": {
    citicode: "r71t",
    factsheet: "https://www.trustnet.com/factsheets/P/r71t/sw-fidelity-asia-pn-cs8/",
    asAt: "31 May 2026",
    holdings: [
      { rank: 1,  name: "SK Hynix",                 ticker: "000660.KS", weight: 11.0 },
      { rank: 2,  name: "Samsung Electronics",      ticker: "005930.KS", weight: 10.2 },
      { rank: 3,  name: "Taiwan Semiconductor",     ticker: "2330.TW",   weight: 9.9 },
      { rank: 4,  name: "MediaTek",                 ticker: "2454.TW",   weight: 4.2 },
      { rank: 5,  name: "Tencent Holdings",         ticker: "0700.HK",   weight: 4.1 },
      { rank: 6,  name: "Samsung Electro-Mechanics", ticker: "009150.KS", weight: 3.5 },
      { rank: 7,  name: "Unimicron Technology",     ticker: "3037.TW",   weight: 3.4 },
      { rank: 8,  name: "Elite Material",           ticker: "2383.TW",   weight: 2.9 },
      { rank: 9,  name: "Alibaba Group Holding",    ticker: "9988.HK",   weight: 2.8 },
      { rank: 10, name: "AIA Group",                ticker: "1299.HK",   weight: 2.6 },
    ],
  },

  "Scottish Widows UK Real Estate CS8": {
    citicode: "er96",
    factsheet: "https://www.trustnet.com/factsheets/n/er96/scottish-widows-uk-real-estate",
    asAt: "listed REIT holdings",
    holdings: [
      { rank: 1,  name: "SEGRO",                    ticker: "SGRO.L", weight: 19.26 },
      { rank: 2,  name: "Land Securities Group",    ticker: "LAND.L", weight: 9.10 },
      { rank: 3,  name: "LondonMetric Property",    ticker: "LMP.L",  weight: 9.01 },
      { rank: 4,  name: "British Land",             ticker: "BLND.L", weight: 7.66 },
      { rank: 5,  name: "Tritax Big Box",           ticker: "BBOX.L", weight: 7.65 },
      { rank: 6,  name: "Primary Health Properties", ticker: "PHP.L", weight: 5.07 },
      { rank: 7,  name: "Unite Group",              ticker: "UTG.L",  weight: 4.76 },
      { rank: 8,  name: "Shaftesbury Capital",      ticker: "SHC.L",  weight: 4.15 },
      { rank: 9,  name: "Derwent London",           ticker: "DLN.L",  weight: 3.89 },
      { rank: 10, name: "Big Yellow Group",         ticker: "BYG.L",  weight: 3.47 },
    ],
  },

  "SW Veritas Asian CS8": {
    citicode: "r77i",
    factsheet: "https://www.trustnet.com/factsheets/P/r77i/sw-veritas-asian-pn-cs8/",
    asAt: "31 May 2026",
    holdings: [
      { rank: 1,  name: "Samsung Electronics",       ticker: "005930.KS", weight: 10.2 },
      { rank: 2,  name: "Taiwan Semiconductor",      ticker: "2330.TW",   weight: 9.9 },
      { rank: 3,  name: "Delta Electronics",         ticker: "2308.TW",   weight: 7.2 },
      { rank: 4,  name: "SK Hynix",                  ticker: "000660.KS", weight: 6.9 },
      { rank: 5,  name: "Hon Hai Precision (Foxconn)", ticker: "2317.TW", weight: 5.3 },
      { rank: 6,  name: "HD Hyundai Heavy Industries", ticker: "329180.KS", weight: 4.1 },
      { rank: 7,  name: "Elite Material",            ticker: "2383.TW",   weight: 4.0 },
      { rank: 8,  name: "Accton Technology",         ticker: "2345.TW",   weight: 3.8 },
      { rank: 9,  name: "MediaTek",                  ticker: "2454.TW",   weight: 3.6 },
      { rank: 10, name: "Shengyi Technology (A)",    ticker: "600183.SS", weight: 3.2 },
    ],
  },
};
