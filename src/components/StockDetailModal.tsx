import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  DollarSign,
  Activity,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { StockQuote, CandleData } from "@/hooks/useStockData";
import { fetchCandles } from "@/hooks/useStockData";

interface StockDetailModalProps {
  stock: StockQuote | null;
  onClose: () => void;
}

const TIMEFRAMES = [
  { label: "1D", resolution: "5", days: 1 },
  { label: "1W", resolution: "15", days: 7 },
  { label: "1M", resolution: "D", days: 30 },
  { label: "3M", resolution: "D", days: 90 },
  { label: "1Y", resolution: "W", days: 365 },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-border/60 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-display font-bold text-foreground">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export default function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
  const [timeframe, setTimeframe] = useState(0);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    if (!stock) return;

    setLoadingChart(true);
    const tf = TIMEFRAMES[timeframe];
    const to = Math.floor(Date.now() / 1000);
    const from = to - tf.days * 86400;

    fetchCandles(stock.symbol, tf.resolution, from, to).then((data) => {
      setCandles(data);
      setLoadingChart(false);
    });
  }, [stock, timeframe]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!stock) return null;

  const isPositive = stock.change >= 0;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";
  const chartGradient = isPositive ? "chartGreen" : "chartRed";

  const chartData = candles.map((c) => ({
    time: c.time,
    price: c.close,
  }));

  const firstPrice = chartData[0]?.price || stock.open;
  const lastPrice = chartData[chartData.length - 1]?.price || stock.price;
  const chartChange = lastPrice - firstPrice;
  const chartChangePercent = ((chartChange / firstPrice) * 100).toFixed(2);
  const chartPositive = chartChange >= 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl border border-border/50 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 glass rounded-t-2xl border-b border-border/50 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    {stock.symbol}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
                      isPositive
                        ? "bg-green-500/15 text-green-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {isPositive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {stock.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price */}
            <div className="mt-3">
              <span className="text-3xl font-display font-bold text-foreground">
                ${stock.price.toFixed(2)}
              </span>
              <span
                className={`ml-3 text-base font-medium ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {stock.change.toFixed(2)} ({isPositive ? "+" : ""}
                {stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="px-6 py-4 space-y-5">
            {/* Timeframe Pills */}
            <div className="flex gap-2">
              {TIMEFRAMES.map((tf, i) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(i)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeframe === i
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="relative h-64 rounded-xl overflow-hidden bg-card/40 border border-border/30">
              {loadingChart ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  {/* Chart period change indicator */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md ${
                        chartPositive
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {chartPositive ? "+" : ""}
                      {chartChangePercent}% ({TIMEFRAMES[timeframe].label})
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 30, right: 10, bottom: 5, left: 10 }}>
                      <defs>
                        <linearGradient id={chartGradient} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={40}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                        tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2}
                        fill={`url(#${chartGradient})`}
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* Stock Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoTile
                icon={<DollarSign className="w-4 h-4" />}
                label="Open"
                value={`$${stock.open.toFixed(2)}`}
              />
              <InfoTile
                icon={<TrendingUp className="w-4 h-4" />}
                label="High"
                value={`$${stock.high.toFixed(2)}`}
                highlight="green"
              />
              <InfoTile
                icon={<TrendingDown className="w-4 h-4" />}
                label="Low"
                value={`$${stock.low.toFixed(2)}`}
                highlight="red"
              />
              <InfoTile
                icon={<Clock className="w-4 h-4" />}
                label="Prev Close"
                value={`$${stock.previousClose.toFixed(2)}`}
              />
              <InfoTile
                icon={<BarChart3 className="w-4 h-4" />}
                label="Volume"
                value={stock.volume}
              />
              <InfoTile
                icon={<Activity className="w-4 h-4" />}
                label="Market Cap"
                value={stock.marketCap}
              />
              <InfoTile
                icon={<Building2 className="w-4 h-4" />}
                label="Sector"
                value={stock.sector}
              />
              <InfoTile
                icon={
                  isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )
                }
                label="Change"
                value={`${isPositive ? "+" : ""}$${stock.change.toFixed(2)}`}
                highlight={isPositive ? "green" : "red"}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoTile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: "green" | "red";
}) {
  return (
    <div className="bg-card/50 rounded-lg p-3 border border-border/30">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p
        className={`text-sm font-display font-semibold ${
          highlight === "green"
            ? "text-green-400"
            : highlight === "red"
            ? "text-red-400"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
