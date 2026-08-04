"""
Local dev server for the Scottish Widows Fund Tracker.

Serves the static site AND implements /api/quote using Marketstack, FMP, and
Yahoo Finance with a fallback system. This mirrors the Vercel serverless function
in api/quote.js.

Run:  py dev_server.py         (defaults to port 4173)
      py dev_server.py 8000    (custom port)

For production you deploy to Vercel, which uses api/quote.js instead — this file
is dev-only.
"""

import functools
import json
import os
import re
import sys
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = os.path.dirname(os.path.abspath(__file__))
SYMBOL_RE = re.compile(r"^[A-Za-z0-9.\-]{1,15}$")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

# Load .env file if it exists
ENV_FILE = os.path.join(ROOT, ".env.local")
if os.path.exists(ENV_FILE):
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, _, val = line.partition("=")
                if key:
                    os.environ[key.strip()] = val.strip()


def fetch_marketstack_quote(symbol):
    key = os.environ.get("MARKETSTACK_KEY")
    if not key:
        raise ValueError("Marketstack key not configured")

    url = f"https://api.marketstack.com/v2/eod?symbols={symbol}&access_key={key}&limit=2"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)

    if not data.get("data") or len(data["data"]) == 0:
        raise ValueError(f"Marketstack: no data for {symbol}")

    latest = data["data"][0]
    previous = data["data"][1] if len(data["data"]) > 1 else latest

    return {
        "price": latest.get("adj_close") or latest.get("close"),
        "previousClose": previous.get("adj_close") or previous.get("close"),
        "time": int(datetime.strptime(latest["date"], "%Y-%m-%d").timestamp()),
        "series": [previous.get("adj_close") or previous.get("close")],
    }


def fetch_fmp_quote(symbol):
    key = os.environ.get("FMP_KEY")
    if not key:
        raise ValueError("FMP key not configured")

    url = f"https://financialmodelingprep.com/api/v3/quote/{symbol}?apikey={key}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)

    if not isinstance(data, list) or len(data) == 0:
        raise ValueError(f"FMP: no data for {symbol}")

    quote = data[0]
    if not quote.get("price") or not quote.get("previousClose"):
        raise ValueError(f"FMP: missing price data for {symbol}")

    return {
        "price": quote["price"],
        "previousClose": quote["previousClose"],
        "time": int(quote.get("timestamp", 0) * 1000),
        "series": [quote["previousClose"]],
    }


def fetch_yahoo_quote(symbol):
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
           f"?range=3mo&interval=1d")
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)

    result = data["chart"]["result"][0]
    meta = result["meta"]
    price = meta.get("regularMarketPrice")
    if not isinstance(price, (int, float)):
        raise ValueError("No price in Yahoo response")

    raw_closes = (result.get("indicators", {}).get("quote", [{}])[0]
                  .get("close", []))
    series = [c for c in raw_closes if isinstance(c, (int, float))]

    if len(series) >= 2:
        prev = series[-2]
    else:
        prev = meta.get("chartPreviousClose")

    return {
        "price": price,
        "previousClose": prev if isinstance(prev, (int, float)) else None,
        "time": meta.get("regularMarketTime"),
        "series": series,
    }


def should_use_marketstack(symbol):
    return re.search(r"\.(L|T|KS|TW|DE|PA|MI|AX|TO|SS|HK|SI|NZ)$", symbol, re.I)


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/quote":
            return self.handle_quote(parse_qs(parsed.query))
        return super().do_GET()

    def end_headers(self):
        # Disable caching for .mjs (module) files to ensure fresh code
        if self.path.endswith(".mjs"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_quote(self, qs):
        symbol = (qs.get("symbol") or [""])[0]
        if not SYMBOL_RE.match(symbol):
            return self._json(400, {"error": "Invalid symbol"})

        try:
            quote = None

            # Try FMP first for all symbols (conserve Marketstack's 100 calls/month)
            try:
                quote = fetch_fmp_quote(symbol)
            except Exception as e:
                try:
                    # Fall back to Marketstack for international symbols FMP couldn't handle
                    if should_use_marketstack(symbol):
                        quote = fetch_marketstack_quote(symbol)
                    else:
                        raise e  # Re-throw to fall through to Yahoo
                except Exception as e2:
                    quote = fetch_yahoo_quote(symbol)

            if not quote or not isinstance(quote.get("price"), (int, float)):
                raise ValueError("Failed to fetch quote from any source")

            return self._json(200, {
                "symbol": symbol,
                "price": quote["price"],
                "previousClose": quote["previousClose"],
                "currency": None,
                "time": quote["time"],
                "series": quote.get("series", []),
            })
        except Exception as e:  # noqa: BLE001 - dev server, surface anything
            return self._json(502, {"error": str(e)})

    def log_message(self, *args):  # quieter console
        pass


if __name__ == "__main__":
    print(f"SW Fund Tracker dev server -> http://localhost:{PORT}  (serving {ROOT})")
    handler = functools.partial(Handler, directory=ROOT)
    ThreadingHTTPServer(("0.0.0.0", PORT), handler).serve_forever()
