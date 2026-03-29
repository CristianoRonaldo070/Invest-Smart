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

// ─── Indian Stock Universe (NSE) ────────────────────────
const STOCKS_INFO: Record<string, { name: string; sector: string; marketCap: string }> = {
  RELIANCE:   { name: "Reliance Industries",       sector: "Energy",       marketCap: "₹19.8L Cr" },
  TCS:        { name: "Tata Consultancy Services",  sector: "IT",           marketCap: "₹15.2L Cr" },
  HDFCBANK:   { name: "HDFC Bank Ltd.",             sector: "Banking",      marketCap: "₹13.5L Cr" },
  INFY:       { name: "Infosys Ltd.",               sector: "IT",           marketCap: "₹7.4L Cr" },
  ICICIBANK:  { name: "ICICI Bank Ltd.",            sector: "Banking",      marketCap: "₹9.1L Cr" },
  HINDUNILVR: { name: "Hindustan Unilever",         sector: "FMCG",         marketCap: "₹5.8L Cr" },
  SBIN:       { name: "State Bank of India",        sector: "Banking",      marketCap: "₹7.2L Cr" },
  BHARTIARTL: { name: "Bharti Airtel Ltd.",         sector: "Telecom",      marketCap: "₹8.9L Cr" },
  ITC:        { name: "ITC Ltd.",                   sector: "FMCG",         marketCap: "₹5.6L Cr" },
  KOTAKBANK:  { name: "Kotak Mahindra Bank",        sector: "Banking",      marketCap: "₹3.9L Cr" },
  LT:         { name: "Larsen & Toubro",            sector: "Infrastructure", marketCap: "₹5.1L Cr" },
  HCLTECH:    { name: "HCL Technologies",           sector: "IT",           marketCap: "₹4.1L Cr" },
  AXISBANK:   { name: "Axis Bank Ltd.",             sector: "Banking",      marketCap: "₹3.6L Cr" },
  SUNPHARMA:  { name: "Sun Pharmaceutical",         sector: "Pharma",       marketCap: "₹4.3L Cr" },
  MARUTI:     { name: "Maruti Suzuki India",         sector: "Auto",         marketCap: "₹3.8L Cr" },
  TATAMOTORS: { name: "Tata Motors Ltd.",            sector: "Auto",         marketCap: "₹3.1L Cr" },
  WIPRO:      { name: "Wipro Ltd.",                  sector: "IT",           marketCap: "₹2.6L Cr" },
  NTPC:       { name: "NTPC Ltd.",                   sector: "Energy",       marketCap: "₹3.5L Cr" },
  TATASTEEL:  { name: "Tata Steel Ltd.",             sector: "Metal",        marketCap: "₹1.9L Cr" },
  POWERGRID:  { name: "Power Grid Corp.",            sector: "Energy",       marketCap: "₹2.8L Cr" },
  BAJFINANCE: { name: "Bajaj Finance Ltd.",          sector: "Financial",    marketCap: "₹4.6L Cr" },
  DRREDDY:    { name: "Dr. Reddy's Labs",            sector: "Pharma",       marketCap: "₹1.1L Cr" },
  ADANIENT:   { name: "Adani Enterprises",           sector: "Infrastructure", marketCap: "₹3.4L Cr" },
  TITAN:      { name: "Titan Company Ltd.",           sector: "Consumer",     marketCap: "₹3.2L Cr" },
};

export const ALL_SYMBOLS = Object.keys(STOCKS_INFO);

// ─── Simulated prices in INR ────────────────────────────
const SIM_PRICES: Record<string, number> = {
  RELIANCE: 2945.50, TCS: 3812.75, HDFCBANK: 1685.30, INFY: 1542.60,
  ICICIBANK: 1265.45, HINDUNILVR: 2410.80, SBIN: 812.35, BHARTIARTL: 1678.90,
  ITC: 435.60, KOTAKBANK: 1842.15, LT: 3520.40, HCLTECH: 1625.70,
  AXISBANK: 1178.55, SUNPHARMA: 1745.20, MARUTI: 12450.60, TATAMOTORS: 978.45,
  WIPRO: 462.30, NTPC: 365.80, TATASTEEL: 152.65, POWERGRID: 312.40,
  BAJFINANCE: 6845.90, DRREDDY: 6320.15, ADANIENT: 2875.30, TITAN: 3245.70,
};

// ─── Helper: format volume ──────────────────────────────
function fmtVolume(v: number): string {
  if (v >= 1e7) return (v / 1e7).toFixed(1) + " Cr";
  if (v >= 1e5) return (v / 1e5).toFixed(1) + " L";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}

// ─── Candle generation for charts ───────────────────────
export async function fetchCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number
): Promise<CandleData[]> {
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
      volume: price > 3000
        ? (Math.random() * 20 + 5).toFixed(1) + " L"
        : (Math.random() * 60 + 10).toFixed(1) + " L",
      marketCap: info.marketCap,
      sparkline: genSparkline(price),
      lastTick: Date.now(),
    };
  });
}

// ─── Main Hook ──────────────────────────────────────────
export function useStockData() {
  const [stocks, setStocks] = useState<StockQuote[]>(() => buildInitialStocks());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ── Simulated ticks (realistic Indian market movement) ──
  useEffect(() => {
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

  return {
    stocks,
    lastUpdate,
    isLive: false,
    hasApiKey: false,
    apiError: null,
  };
}
