import { memo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockQuote } from "@/hooks/useStockData";

interface MarketTickerProps {
  stocks: StockQuote[];
}

const MarketTicker = memo(function MarketTicker({ stocks }: MarketTickerProps) {
  // Double the stocks for seamless infinite scroll
  const items = [...stocks, ...stocks];

  return (
    <div className="w-full overflow-hidden bg-card/40 border-b border-border/30 py-2">
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {items.map((stock, i) => {
          const isPositive = stock.change >= 0;
          return (
            <div
              key={`${stock.symbol}-${i}`}
              className="flex items-center gap-2 flex-shrink-0 px-2"
            >
              <span className="text-xs font-display font-bold text-foreground">
                {stock.symbol}
              </span>
              <span className="text-xs text-muted-foreground">
                ${stock.price.toFixed(2)}
              </span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-medium ${
                  isPositive ? "text-green-400" : "text-red-400"
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
              <span className="text-border/80 text-xs select-none">│</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
});

export default MarketTicker;
