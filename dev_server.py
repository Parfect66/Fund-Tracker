"""
Local dev server for the Scottish Widows Fund Tracker.

Serves the static site AND implements /api/quote by proxying Yahoo Finance,
mirroring the Vercel serverless function in api/quote.js. This lets you preview
the app locally with live prices and no third-party CORS proxy.

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

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = os.path.dirname(os.path.abspath(__file__))
SYMBOL_RE = re.compile(r"^[A-Za-z0-9.\-]{1,15}$")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/quote":
            return self.handle_quote(parse_qs(parsed.query))
        return super().do_GET()

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

        url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
               f"?range=1d&interval=1d")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA,
                                                       "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.load(resp)
            meta = data["chart"]["result"][0]["meta"]
            price = meta.get("regularMarketPrice")
            if not isinstance(price, (int, float)):
                raise ValueError("no price in Yahoo response")
            prev = meta.get("chartPreviousClose")
            if not isinstance(prev, (int, float)):
                prev = meta.get("previousClose")
            return self._json(200, {
                "symbol": meta.get("symbol", symbol),
                "price": price,
                "previousClose": prev if isinstance(prev, (int, float)) else None,
                "currency": meta.get("currency"),
                "time": meta.get("regularMarketTime"),
            })
        except Exception as e:  # noqa: BLE001 - dev server, surface anything
            return self._json(502, {"error": str(e)})

    def log_message(self, *args):  # quieter console
        pass


if __name__ == "__main__":
    print(f"SW Fund Tracker dev server -> http://localhost:{PORT}  (serving {ROOT})")
    handler = functools.partial(Handler, directory=ROOT)
    ThreadingHTTPServer(("0.0.0.0", PORT), handler).serve_forever()
