import { useState, useEffect, useCallback, useRef } from "react";

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || "";
const BASE = "https://finnhub.io/api/v1";

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
  lastTick: number; // timestamp of last price update
  loading?: boolean;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Stock Universe ──────────────────────────────────────
const STOCKS_INFO: Record<string, { name: string; sector: string; marketCap: string }> = {
  AAPL:  { name: "Apple Inc.",              sector: "Technology",    marketCap: "2.78T" },
  MSFT:  { name: "Microsoft Corp.",         sector: "Technology",    marketCap: "3.10T" },
  GOOGL: { name: "Alphabet Inc.",           sector: "Technology",    marketCap: "1.93T" },
  AMZN:  { name: "Amazon.com Inc.",         sector: "Consumer",      marketCap: "1.93T" },
  NVDA:  { name: "NVIDIA Corp.",            sector: "Technology",    marketCap: "2.15T" },
  META:  { name: "Meta Platforms",          sector: "Technology",    marketCap: "1.29T" },
  TSLA:  { name: "Tesla Inc.",              sector: "Automotive",    marketCap: "558B" },
  JPM:   { name: "JPMorgan Chase",          sector: "Financial",     marketCap: "571B" },
  V:     { name: "Visa Inc.",               sector: "Financial",     marketCap: "573B" },
  WMT:   { name: "Walmart Inc.",            sector: "Consumer",      marketCap: "453B" },
  JNJ:   { name: "Johnson & Johnson",       sector: "Healthcare",    marketCap: "376B" },
  PG:    { name: "Procter & Gamble",        sector: "Consumer",      marketCap: "383B" },
  XOM:   { name: "Exxon Mobil",             sector: "Energy",        marketCap: "420B" },
  UNH:   { name: "UnitedHealth Group",      sector: "Healthcare",    marketCap: "487B" },
  HD:    { name: "Home Depot",              sector: "Consumer",      marketCap: "348B" },
  DIS:   { name: "Walt Disney Co.",         sector: "Entertainment", marketCap: "205B" },
  NFLX:  { name: "Netflix Inc.",            sector: "Entertainment", marketCap: "272B" },
  INTC:  { name: "Intel Corp.",             sector: "Technology",    marketCap: "132B" },
  AMD:   { name: "Advanced Micro Devices",  sector: "Technology",    marketCap: "263B" },
  CRM:   { name: "Salesforce Inc.",         sector: "Technology",    marketCap: "263B" },
  BA:    { name: "Boeing Co.",              sector: "Industrial",    marketCap: "121B" },
  PYPL:  { name: "PayPal Holdings",         sector: "Financial",     marketCap: "68B" },
  UBER:  { name: "Uber Technologies",       sector: "Technology",    marketCap: "149B" },
  SQ:    { name: "Block Inc.",              sector: "Financial",     marketCap: "46B" },
};

export const ALL_SYMBOLS = Object.keys(STOCKS_INFO);

// ─── Simulated fallback prices (used when no API key) ───
const SIM_PRICES: Record<string, number> = {
  AAPL: 178.72, MSFT: 417.88, GOOGL: 155.72, AMZN: 185.60,
  NVDA: 875.28, META: 505.15, TSLA: 175.34, JPM: 198.45,
  V: 279.35, WMT: 167.82, JNJ: 156.20, PG: 162.45,
  XOM: 105.72, UNH: 527.18, HD: 348.90, DIS: 112.35,
  NFLX: 628.40, INTC: 31.25, AMD: 162.80, CRM: 272.55,
  BA: 195.20, PYPL: 63.28, UBER: 72.15, SQ: 78.42,
};

// ─── Helper: format volume ──────────────────────────────
function fmtVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}

// ─── API Functions ──────────────────────────────────────
async function fetchQuote(symbol: string): Promise<{
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number;
} | null> {
  try {
    const res = await fetch(`${BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.c === 0) return null; // invalid
    return data;
  } catch {
    return null;
  }
}

export async function fetchCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number
): Promise<CandleData[]> {
  if (!FINNHUB_KEY) return generateSimCandles(SIM_PRICES[symbol] || 100, resolution);

  try {
    const res = await fetch(
      `${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
    if (!res.ok) return generateSimCandles(SIM_PRICES[symbol] || 100, resolution);
    const data = await res.json();
    if (data.s !== "ok" || !data.c) return generateSimCandles(SIM_PRICES[symbol] || 100, resolution);

    return data.c.map((_: number, i: number) => ({
      time: new Date(data.t[i] * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));
  } catch {
    return generateSimCandles(SIM_PRICES[symbol] || 100, resolution);
  }
}

function generateSimCandles(basePrice: number, resolution: string): CandleData[] {
  const count = resolution === "D" ? 30 : resolution === "W" ? 52 : resolution === "M" ? 12 : 78;
  const candles: CandleData[] = [];
  let price = basePrice * (0.92 + Math.random() * 0.06);

  for (let i = 0; i < count; i++) {
    const vol = basePrice * 0.005;
    const o = price;
    const change1 = (Math.random() - 0.47) * vol;
    const change2 = (Math.random() - 0.47) * vol;
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

  // make last candle match base price
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
      volume: SIM_PRICES[sym] > 300 ? (Math.random() * 20 + 5).toFixed(1) + "M" : (Math.random() * 60 + 10).toFixed(1) + "M",
      marketCap: info.marketCap,
      sparkline: genSparkline(price),
      lastTick: Date.now(),
      loading: !!FINNHUB_KEY, // if we have API key, mark as loading initially
    };
  });
}

// ─── Main Hook ──────────────────────────────────────────
export function useStockData() {
  const [stocks, setStocks] = useState<StockQuote[]>(() => buildInitialStocks());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const priceAccRef = useRef<Record<string, number[]>>({});

  // ── Fetch real quotes from Finnhub ──
  const fetchAllQuotes = useCallback(async () => {
    if (!FINNHUB_KEY) return;

    let anySuccess = false;
    // Batch fetch with delay to avoid rate limits (60/min)
    for (let i = 0; i < ALL_SYMBOLS.length; i++) {
      const sym = ALL_SYMBOLS[i];
      const quote = await fetchQuote(sym);

      if (quote && quote.c > 0) {
        anySuccess = true;
        setStocks((prev) =>
          prev.map((s) => {
            if (s.symbol !== sym) return s;
            const newSparkline = [...s.sparkline.slice(-19), quote.c];
            return {
              ...s,
              price: quote.c,
              change: parseFloat(quote.d.toFixed(2)),
              changePercent: parseFloat(quote.dp.toFixed(2)),
              high: quote.h,
              low: quote.l,
              open: quote.o,
              previousClose: quote.pc,
              sparkline: newSparkline,
              lastTick: Date.now(),
              loading: false,
            };
          })
        );
      } else {
        // Mark as not loading even if we failed
        setStocks((prev) =>
          prev.map((s) => (s.symbol === sym ? { ...s, loading: false } : s))
        );
      }

      // Delay 120ms between requests (≈500/min, well under 60/min... wait, 60 calls/min = 1/sec)
      // Let's do 1.1 seconds between each to be safe
      if (i < ALL_SYMBOLS.length - 1) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    if (anySuccess) {
      setIsLive(true);
      setApiError(null);
    } else {
      setApiError("Could not fetch live data. Showing simulated prices.");
    }
    setLastUpdate(new Date());
  }, []);

  // ── WebSocket for real-time price ticks ──
  const connectWebSocket = useCallback(() => {
    if (!FINNHUB_KEY) return;

    try {
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ALL_SYMBOLS.forEach((sym) => {
          ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
        });
        setIsLive(true);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "trade" && msg.data) {
            // Accumulate trades, batch update every tick
            msg.data.forEach((trade: { s: string; p: number; t: number }) => {
              if (!priceAccRef.current[trade.s]) priceAccRef.current[trade.s] = [];
              priceAccRef.current[trade.s].push(trade.p);
            });
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsLive(false);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {}
  }, []);

  // ── Process accumulated WebSocket trades ──
  useEffect(() => {
    if (!FINNHUB_KEY) return;

    const interval = setInterval(() => {
      const acc = priceAccRef.current;
      const symbols = Object.keys(acc);
      if (symbols.length === 0) return;

      setStocks((prev) =>
        prev.map((s) => {
          const prices = acc[s.symbol];
          if (!prices || prices.length === 0) return s;

          // Use last trade price
          const newPrice = prices[prices.length - 1];
          const change = parseFloat((newPrice - s.previousClose).toFixed(2));
          const changePercent = parseFloat(((change / s.previousClose) * 100).toFixed(2));
          const newSparkline = [...s.sparkline.slice(-19), newPrice];

          return {
            ...s,
            price: parseFloat(newPrice.toFixed(2)),
            change,
            changePercent,
            high: Math.max(s.high, newPrice),
            low: Math.min(s.low, newPrice),
            sparkline: newSparkline,
            lastTick: Date.now(),
          };
        })
      );

      priceAccRef.current = {};
      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // ── Simulated ticks (fallback when no API key) ──
  useEffect(() => {
    if (FINNHUB_KEY) return;

    const interval = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => {
          const vol = s.price * 0.0012;
          const delta = (Math.random() - 0.48) * vol;
          const newPrice = parseFloat((s.price + delta).toFixed(2));
          const change = parseFloat((newPrice - s.open).toFixed(2));
          const changePercent = parseFloat(((change / s.open) * 100).toFixed(2));

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

  // ── Initial fetch + WebSocket connect ──
  useEffect(() => {
    fetchAllQuotes();
    connectWebSocket();

    // Re-fetch quotes every 60 seconds for fresh data
    const quotesInterval = setInterval(fetchAllQuotes, 60000);

    return () => {
      clearInterval(quotesInterval);
      wsRef.current?.close();
    };
  }, [fetchAllQuotes, connectWebSocket]);

  return {
    stocks,
    lastUpdate,
    isLive,
    hasApiKey: !!FINNHUB_KEY,
    apiError,
  };
}
