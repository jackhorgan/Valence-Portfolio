# Valence Portfolio Tracker

A responsive, single-file portfolio tracker MVP.

## Included
- Dashboard with total portfolio value, invested capital, unrealized P/L and projected annual dividends
- Open holdings with shares, average cost, current price, value, P/L and portfolio weight
- Transaction journal for Buy / Sell / Dividend entries
- Weekly/monthly portfolio snapshots and performance history
- Interactive allocation donut and portfolio growth chart
- Mobile-responsive layout with collapsible navigation
- Local browser storage so edits persist on the device
- JSON export/import for moving data between devices
- Demo data included so the app is populated on first launch

## Run
Open `valence.html` in a modern browser.

## Phone
Host the file on a simple static site (for example GitHub Pages, Netlify, or Cloudflare Pages) and add it to your phone home screen. The UI is designed to behave like a lightweight app.

## Important MVP limitation
The current build uses manually entered current prices. It does not yet connect to a live market-price provider or cloud account. That is deliberate so the app works immediately without API credentials.

## Next production upgrades
- Live stock/ETF/crypto price API
- Cloud sync/login so desktop and phone share one portfolio automatically
- Broker CSV import
- True time-weighted / money-weighted return calculations
- S&P 500 / benchmark comparison
- Dividend calendar and income history
- Target allocation + drift alerts
- Price alerts and portfolio notifications
- NZD base currency and multi-currency support
