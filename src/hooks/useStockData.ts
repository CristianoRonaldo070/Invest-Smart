import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────
export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: string;
  marketCap: string;
  sparkline: number[];
  lastTick: number;
  loading?: boolean;
  isReal?: boolean; // true if data is from Yahoo Finance
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Indian Stock Universe (NSE) ────────────────────────
const STOCKS_INFO: Record<string, { name: string; sector: string; marketCap: string; yahoo: string }> = {
  RELIANCE: { name: "Reliance Industries", sector: "Energy", marketCap: "₹19.8L Cr", yahoo: "RELIANCE.NS" },
  TCS: { name: "Tata Consultancy Services", sector: "IT", marketCap: "₹15.2L Cr", yahoo: "TCS.NS" },
  HDFCBANK: { name: "HDFC Bank Ltd.", sector: "Banking", marketCap: "₹13.5L Cr", yahoo: "HDFCBANK.NS" },
  INFY: { name: "Infosys Ltd.", sector: "IT", marketCap: "₹7.4L Cr", yahoo: "INFY.NS" },
  ICICIBANK: { name: "ICICI Bank Ltd.", sector: "Banking", marketCap: "₹9.1L Cr", yahoo: "ICICIBANK.NS" },
  HINDUNILVR: { name: "Hindustan Unilever", sector: "FMCG", marketCap: "₹5.8L Cr", yahoo: "HINDUNILVR.NS" },
  SBIN: { name: "State Bank of India", sector: "Banking", marketCap: "₹7.2L Cr", yahoo: "SBIN.NS" },
  BHARTIARTL: { name: "Bharti Airtel Ltd.", sector: "Telecom", marketCap: "₹8.9L Cr", yahoo: "BHARTIARTL.NS" },
  ITC: { name: "ITC Ltd.", sector: "FMCG", marketCap: "₹5.6L Cr", yahoo: "ITC.NS" },
  KOTAKBANK: { name: "Kotak Mahindra Bank", sector: "Banking", marketCap: "₹3.9L Cr", yahoo: "KOTAKBANK.NS" },
  LT: { name: "Larsen & Toubro", sector: "Infrastructure", marketCap: "₹5.1L Cr", yahoo: "LT.NS" },
  HCLTECH: { name: "HCL Technologies", sector: "IT", marketCap: "₹4.1L Cr", yahoo: "HCLTECH.NS" },
  AXISBANK: { name: "Axis Bank Ltd.", sector: "Banking", marketCap: "₹3.6L Cr", yahoo: "AXISBANK.NS" },
  SUNPHARMA: { name: "Sun Pharmaceutical", sector: "Pharma", marketCap: "₹4.3L Cr", yahoo: "SUNPHARMA.NS" },
  MARUTI: { name: "Maruti Suzuki India", sector: "Auto", marketCap: "₹3.8L Cr", yahoo: "MARUTI.NS" },
  TATAMOTORS: { name: "Tata Motors Ltd.", sector: "Auto", marketCap: "₹3.1L Cr", yahoo: "TATAMOTORS.NS" },
  WIPRO: { name: "Wipro Ltd.", sector: "IT", marketCap: "₹2.6L Cr", yahoo: "WIPRO.NS" },
  NTPC: { name: "NTPC Ltd.", sector: "Energy", marketCap: "₹3.5L Cr", yahoo: "NTPC.NS" },
  TATASTEEL: { name: "Tata Steel Ltd.", sector: "Metal", marketCap: "₹1.9L Cr", yahoo: "TATASTEEL.NS" },
  POWERGRID: { name: "Power Grid Corp.", sector: "Energy", marketCap: "₹2.8L Cr", yahoo: "POWERGRID.NS" },
  BAJFINANCE: { name: "Bajaj Finance Ltd.", sector: "Financial", marketCap: "₹4.6L Cr", yahoo: "BAJFINANCE.NS" },
  DRREDDY: { name: "Dr. Reddy's Labs", sector: "Pharma", marketCap: "₹1.1L Cr", yahoo: "DRREDDY.NS" },
  ADANIENT: { name: "Adani Enterprises", sector: "Infrastructure", marketCap: "₹3.4L Cr", yahoo: "ADANIENT.NS" },
  TITAN: { name: "Titan Company Ltd.", sector: "Consumer", marketCap: "₹3.2L Cr", yahoo: "TITAN.NS" },
};

export const ALL_SYMBOLS = Object.keys(STOCKS_INFO);

// ─── Fallback simulated prices in INR ───────────────────
const SIM_PRICES: Record<string, number> = {
  RELIANCE: 2945.50, TCS: 3812.75, HDFCBANK: 1685.30, INFY: 1542.60,
  ICICIBANK: 1265.45, HINDUNILVR: 2410.80, SBIN: 812.35, BHARTIARTL: 1678.90,
  ITC: 435.60, KOTAKBANK: 1842.15, LT: 3520.40, HCLTECH: 1625.70,
  AXISBANK: 1178.55, SUNPHARMA: 1745.20, MARUTI: 12450.60, TATAMOTORS: 978.45,
  WIPRO: 462.30, NTPC: 365.80, TATASTEEL: 152.65, POWERGRID: 312.40,
  BAJFINANCE: 6845.90, DRREDDY: 6320.15, ADANIENT: 2875.30, TITAN: 3245.70,
};

// ─── CORS Proxies (try multiple for reliability) ────────
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

let activeProxyIndex = 0;

function getProxyUrl(url: string): string {
  const proxy = CORS_PROXIES[activeProxyIndex % CORS_PROXIES.length];
  return proxy + encodeURIComponent(url);
}

function rotateProxy(): void {
  activeProxyIndex = (activeProxyIndex + 1) % CORS_PROXIES.length;
}

// ─── Helper: format volume ──────────────────────────────
function fmtVolume(v: number): string {
  if (v >= 1e7) return (v / 1e7).toFixed(2) + " Cr";
  if (v >= 1e5) return (v / 1e5).toFixed(2) + " L";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}

// ─── Format Market Cap in Indian style ──────────────────
function fmtMarketCap(v: number): string {
  if (v >= 1e12) return "₹" + (v / 1e12).toFixed(2) + "L Cr";
  if (v >= 1e7) return "₹" + (v / 1e7).toFixed(2) + " Cr";
  if (v >= 1e5) return "₹" + (v / 1e5).toFixed(2) + " L";
  return "₹" + v.toLocaleString("en-IN");
}

// ─── Yahoo Finance API Functions ────────────────────────

async function fetchYahooQuote(yahooSymbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

  // Try each proxy
  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const proxyUrl = getProxyUrl(url);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        rotateProxy();
        continue;
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        rotateProxy();
        continue;
      }

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];

      if (!meta || !meta.regularMarketPrice) {
        rotateProxy();
        continue;
      }

      const currentPrice = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;

      // Get today's OHLCV from the quote data
      let todayHigh = currentPrice;
      let todayLow = currentPrice;
      let todayOpen = prevClose;
      let todayVolume = 0;

      if (quote) {
        const highs = quote.high?.filter((v: number | null) => v != null) || [];
        const lows = quote.low?.filter((v: number | null) => v != null) || [];
        const opens = quote.open?.filter((v: number | null) => v != null) || [];
        const volumes = quote.volume?.filter((v: number | null) => v != null) || [];

        if (highs.length > 0) todayHigh = Math.max(...highs);
        if (lows.length > 0) todayLow = Math.min(...lows);
        if (opens.length > 0) todayOpen = opens[0];
        if (volumes.length > 0) todayVolume = volumes.reduce((a: number, b: number) => a + b, 0);
      }

      const change = parseFloat((currentPrice - prevClose).toFixed(2));
      const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2));

      return {
        price: parseFloat(currentPrice.toFixed(2)),
        change,
        changePercent,
        high: parseFloat(todayHigh.toFixed(2)),
        low: parseFloat(todayLow.toFixed(2)),
        open: parseFloat(todayOpen.toFixed(2)),
        previousClose: parseFloat(prevClose.toFixed(2)),
        volume: todayVolume,
        marketCap: meta.marketCap || 0,
      };
    } catch (err) {
      console.log(`Yahoo fetch failed for ${yahooSymbol} (proxy ${activeProxyIndex}):`, err);
      rotateProxy();
      continue;
    }
  }

  return null;
}

// ─── Fetch Historical Candles from Yahoo Finance ────────
export async function fetchCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number
): Promise<CandleData[]> {
  const info = STOCKS_INFO[symbol];
  if (!info) return generateSimCandles(SIM_PRICES[symbol] || 1000, resolution);

  // Map resolution to Yahoo Finance params
  let interval = "1d";
  let range = "1mo";

  if (resolution === "5" || resolution === "15") {
    interval = resolution + "m";
    range = "1d";
  } else if (resolution === "D") {
    interval = "1d";
    // Calculate range from days
    const days = Math.round((to - from) / 86400);
    if (days <= 7) range = "5d";
    else if (days <= 30) range = "1mo";
    else if (days <= 90) range = "3mo";
    else range = "6mo";
  } else if (resolution === "W") {
    interval = "1wk";
    range = "1y";
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${info.yahoo}?interval=${interval}&range=${range}`;

  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(getProxyUrl(url), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        rotateProxy();
        continue;
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result || !result.timestamp) {
        rotateProxy();
        continue;
      }

      const timestamps = result.timestamp;
      const quote = result.indicators?.quote?.[0];
      if (!quote) {
        rotateProxy();
        continue;
      }

      const candles: CandleData[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (quote.close[i] == null) continue;

        const t = new Date(timestamps[i] * 1000);
        const timeLabel = interval.includes("m")
          ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : t.toLocaleDateString([], { month: "short", day: "numeric" });

        candles.push({
          time: timeLabel,
          open: quote.open[i] || quote.close[i],
          high: quote.high[i] || quote.close[i],
          low: quote.low[i] || quote.close[i],
          close: quote.close[i],
          volume: quote.volume[i] || 0,
        });
      }

      if (candles.length > 0) return candles;
      rotateProxy();
    } catch (err) {
      console.log(`Candle fetch failed for ${symbol}:`, err);
      rotateProxy();
    }
  }

  // Fallback to simulated candles
  return generateSimCandles(SIM_PRICES[symbol] || 1000, resolution);
}

function generateSimCandles(basePrice: number, resolution: string): CandleData[] {
  const count = resolution === "D" ? 30 : resolution === "W" ? 52 : resolution === "M" ? 12 : 78;
  const candles: CandleData[] = [];
  let price = basePrice * (0.92 + Math.random() * 0.06);

  for (let i = 0; i < count; i++) {
    const vol = basePrice * 0.005;
    const o = price;
    const change1 = (Math.random() - 0.47) * vol;
    const c = parseFloat((o + change1).toFixed(2));
    const h = parseFloat((Math.max(o, c) + Math.random() * vol * 0.5).toFixed(2));
    const l = parseFloat((Math.min(o, c) - Math.random() * vol * 0.5).toFixed(2));
    price = c;

    const t = new Date();
    if (resolution === "D") t.setDate(t.getDate() - (count - i));
    else if (resolution === "W") t.setDate(t.getDate() - (count - i) * 7);
    else if (resolution === "M") t.setMonth(t.getMonth() - (count - i));
    else t.setMinutes(t.getMinutes() - (count - i) * 5);

    candles.push({
      time: resolution === "D" || resolution === "W" || resolution === "M"
        ? t.toLocaleDateString([], { month: "short", day: "numeric" })
        : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: Math.floor(Math.random() * 5e6 + 1e6),
    });
  }

  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
  }
  return candles;
}

// ─── Generate sparkline from sim prices ─────────────────
function genSparkline(price: number): number[] {
  const pts: number[] = [];
  let p = price * (0.96 + Math.random() * 0.03);
  for (let i = 0; i < 20; i++) {
    p += (Math.random() - 0.47) * price * 0.003;
    pts.push(parseFloat(p.toFixed(2)));
  }
  pts.push(price);
  return pts;
}

// ─── Build initial stock state ──────────────────────────
function buildInitialStocks(): StockQuote[] {
  return ALL_SYMBOLS.map((sym) => {
    const info = STOCKS_INFO[sym];
    const price = SIM_PRICES[sym];
    const changeAmt = parseFloat(((Math.random() - 0.45) * price * 0.02).toFixed(2));
    const open = parseFloat((price - changeAmt).toFixed(2));
    return {
      symbol: sym,
      name: info.name,
      sector: info.sector,
      price,
      previousClose: open,
      change: changeAmt,
      changePercent: parseFloat(((changeAmt / open) * 100).toFixed(2)),
      high: parseFloat((price + Math.random() * price * 0.015).toFixed(2)),
      low: parseFloat((price - Math.random() * price * 0.015).toFixed(2)),
      open,
      volume: price > 3000
        ? (Math.random() * 20 + 5).toFixed(1) + " L"
        : (Math.random() * 60 + 10).toFixed(1) + " L",
      marketCap: info.marketCap,
      sparkline: genSparkline(price),
      lastTick: Date.now(),
      loading: true,
      isReal: false,
    };
  });
}

// ─── Main Hook ──────────────────────────────────────────
export function useStockData() {
  const [stocks, setStocks] = useState<StockQuote[]>(() => buildInitialStocks());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const hasRealDataRef = useRef(false);

  // ── Fetch real quotes from Yahoo Finance ──
  const fetchAllQuotes = useCallback(async () => {
    let anySuccess = false;

    for (let i = 0; i < ALL_SYMBOLS.length; i++) {
      const sym = ALL_SYMBOLS[i];
      const info = STOCKS_INFO[sym];

      try {
        const quote = await fetchYahooQuote(info.yahoo);

        if (quote && quote.price > 0) {
          anySuccess = true;
          setStocks((prev) =>
            prev.map((s) => {
              if (s.symbol !== sym) return s;
              const newSparkline = [...s.sparkline.slice(-19), quote.price];
              return {
                ...s,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
                high: quote.high,
                low: quote.low,
                open: quote.open,
                previousClose: quote.previousClose,
                volume: fmtVolume(quote.volume),
                marketCap: quote.marketCap > 0 ? fmtMarketCap(quote.marketCap) : s.marketCap,
                sparkline: newSparkline,
                lastTick: Date.now(),
                loading: false,
                isReal: true,
              };
            })
          );
        } else {
          // Mark as not loading even if we failed
          setStocks((prev) =>
            prev.map((s) => (s.symbol === sym ? { ...s, loading: false } : s))
          );
        }
      } catch (err) {
        console.log(`Failed to fetch ${sym}:`, err);
        setStocks((prev) =>
          prev.map((s) => (s.symbol === sym ? { ...s, loading: false } : s))
        );
      }

      // Small delay between requests to avoid rate limits (300ms)
      if (i < ALL_SYMBOLS.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (anySuccess) {
      hasRealDataRef.current = true;
      setIsLive(true);
      setApiError(null);
    } else {
      if (!hasRealDataRef.current) {
        setApiError("Using simulated data. Real prices update every minute.");
      }
      // Mark all as not loading
      setStocks((prev) => prev.map((s) => ({ ...s, loading: false })));
    }
    setLastUpdate(new Date());
  }, []);

  // ── Simulated ticks for smooth movement between real data refreshes ──
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => {
          // Smaller movement for real data (just visual smoothing)
          // Larger movement for simulated data
          const volatility = s.isReal ? 0.0003 : 0.0012;
          const vol = s.price * volatility;
          const delta = (Math.random() - 0.48) * vol;
          const newPrice = parseFloat((s.price + delta).toFixed(2));
          const change = parseFloat((newPrice - (s.isReal ? s.previousClose : s.open)).toFixed(2));
          const base = s.isReal ? s.previousClose : s.open;
          const changePercent = parseFloat(((change / base) * 100).toFixed(2));

          return {
            ...s,
            price: newPrice,
            change,
            changePercent,
            high: Math.max(s.high, newPrice),
            low: Math.min(s.low, newPrice),
            sparkline: [...s.sparkline.slice(-19), newPrice],
            lastTick: Date.now(),
          };
        })
      );
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ── Initial fetch + periodic refresh ──
  useEffect(() => {
    fetchAllQuotes();

    // Re-fetch real quotes every 60 seconds
    const quotesInterval = setInterval(fetchAllQuotes, 60000);

    return () => {
      clearInterval(quotesInterval);
    };
  }, [fetchAllQuotes]);

  return {
    stocks,
    lastUpdate,
    isLive,
    hasApiKey: true, // We don't need API key for Yahoo Finance
    apiError,
  };
}
