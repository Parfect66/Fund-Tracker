# Drop factsheets here

To add more Scottish Widows funds to the dashboard:

1. **Drop the fund's factsheet PDF into this folder.**
   Get it from Trustnet (the "Factsheet PDF" link) or the FE fundinfo /
   feprecisionplus factsheet. Any series of the fund works (CS8, Series 2, Life,
   etc.) — the top-10 holdings are identical across wrappers.

2. **Tell Claude** *"add the fund(s) in the factsheets folder"* (or name the file).

Claude then reads the PDF, maps each holding to its correct Yahoo Finance ticker
(handling London `.L`, Taiwan `.TW`, Korea `.KS`, Hong Kong `.HK`, Australia
`.AX`, Toronto `.TO`, Tokyo `.T`, Shanghai `.SS` suffixes, ADRs, and ticker
changes), and appends the fund to `../funds.mjs`. Once it's in `funds.mjs` it
**appears in the dropdown automatically** on the next page load.

## Why not fully automatic?

Dropping a PDF here doesn't self-populate the dashboard. The blocker isn't
reading the PDF — it's turning "BARRICK MINING CORP" into the *right* live
ticker (`B`, not the old `GOLD`), or "SK Hynix" into `000660.KS`. That mapping
needs checking against live data, which is the step Claude does for you. Holdings
only change quarterly, so this is an occasional, quick task.

## Funds already loaded

See `../funds.mjs`. Currently: AXA Framlington Biotech, Schroder US Smaller
Companies, Schroder Global Cities Real Estate, Artemis UK Select, Artemis US
Select, BlackRock Gold & General, Fidelity Asia, Veritas Asian, UK Real Estate.

## Note: funds without tradeable holdings

A fund only works here if its top-10 are **listed companies with a ticker**.
A *direct/physical* property fund (holding actual buildings) or a bond fund
holding individual gilts has no per-holding market price, so it can't show a
daily move. (Scottish Widows UK Real Estate turned out to hold listed REIT
*shares* — SEGRO, Land Securities, etc. — so it works fine.)
