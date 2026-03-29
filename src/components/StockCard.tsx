import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockQuote } from "@/hooks/useStockData";

interface StockCardProps {
  stock: StockQuote;
  index: number;
  onClick: () => void;
}

// Tiny sparkline SVG rendered from price array
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `M${pad},${h} L${points
    .split(" ")
    .map((p, i) => (i === 0 ? p : ` L${p}`))
    .join("")} L${w - pad},${h} Z`;

  const color = positive ? "#22c55e" : "#ef4444";
  const gradientId = positive ? "sparkGreen" : "sparkRed";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const StockCard = memo(function StockCard({ stock, index, onClick }: StockCardProps) {
  const isPositive = stock.change >= 0;

  const formattedPrice = useMemo(
    () =>
      stock.price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    [stock.price]
  );

  return (
    <motion.div
      id={`stock-card-${stock.symbol}`}
      className="glass rounded-xl p-4 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:glow-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Flash overlay on price change */}
      <motion.div
        key={stock.lastTick}
        className={`absolute inset-0 ${isPositive ? "bg-green-500/5" : "bg-red-500/5"}`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-foreground">
                {stock.symbol}
              </h3>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                  isPositive
                    ? "bg-green-500/15 text-green-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {stock.name}
            </p>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="mb-3">
          <Sparkline data={stock.sparkline} positive={isPositive} />
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-display font-bold text-foreground leading-none">
              {formattedPrice}
            </p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {stock.change.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground leading-tight">
              Vol: {stock.volume}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {stock.sector}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default StockCard;
