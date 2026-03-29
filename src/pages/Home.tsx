import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BarChart3,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MarketTicker from "@/components/MarketTicker";
import StockCard from "@/components/StockCard";
import StockDetailModal from "@/components/StockDetailModal";
import Footer from "@/components/Footer";
import { useStockData } from "@/hooks/useStockData";
import type { StockQuote } from "@/hooks/useStockData";

const SECTORS = [
  "All",
  "IT",
  "Banking",
  "Financial",
  "Energy",
  "FMCG",
  "Pharma",
  "Auto",
  "Telecom",
  "Metal",
  "Infrastructure",
  "Consumer",
];

const Home = () => {
  const { stocks, lastUpdate } = useStockData();
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [activeSector, setActiveSector] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "price" | "change" | "percent">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Market summary stats
  const marketStats = useMemo(() => {
    const gainers = stocks.filter((s) => s.change > 0).length;
    const losers = stocks.filter((s) => s.change < 0).length;
    const topGainer = [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
    const topLoser = [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
    return { gainers, losers, topGainer, topLoser };
  }, [stocks]);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    let result = stocks.filter((s) => {
      const matchesSearch =
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase());
      const matchesSector = activeSector === "All" || s.sector === activeSector;
      return matchesSearch && matchesSector;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "change":
          cmp = a.change - b.change;
          break;
        case "percent":
          cmp = a.changePercent - b.changePercent;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [stocks, search, activeSector, sortBy, sortDir]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  // Keep selected stock data up-to-date with live ticks
  const liveSelectedStock = selectedStock
    ? stocks.find((s) => s.symbol === selectedStock.symbol) || selectedStock
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16" id="home-page">
        {/* Market Ticker */}
        <MarketTicker stocks={stocks} />

        {/* Hero / Market Overview */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-primary/6 blur-[150px]" />
            <div className="absolute top-10 right-1/4 w-[400px] h-[300px] rounded-full bg-green-500/4 blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 pb-6">
            {/* Status bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Market
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>

            {/* Market summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <motion.div
                className="glass rounded-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Gainers</span>
                </div>
                <p className="text-2xl font-display font-bold text-green-400">
                  {marketStats.gainers}
                </p>
              </motion.div>

              <motion.div
                className="glass rounded-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Losers</span>
                </div>
                <p className="text-2xl font-display font-bold text-red-400">
                  {marketStats.losers}
                </p>
              </motion.div>

              <motion.div
                className="glass rounded-xl p-4 cursor-pointer hover:glow-border transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                onClick={() =>
                  marketStats.topGainer && setSelectedStock(marketStats.topGainer)
                }
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Top Gainer</span>
                </div>
                <p className="text-lg font-display font-bold text-foreground">
                  {marketStats.topGainer?.symbol}
                </p>
                <p className="text-xs text-green-400 font-medium">
                  +{marketStats.topGainer?.changePercent.toFixed(2)}%
                </p>
              </motion.div>

              <motion.div
                className="glass rounded-xl p-4 cursor-pointer hover:glow-border transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() =>
                  marketStats.topLoser && setSelectedStock(marketStats.topLoser)
                }
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Top Loser</span>
                </div>
                <p className="text-lg font-display font-bold text-foreground">
                  {marketStats.topLoser?.symbol}
                </p>
                <p className="text-xs text-red-400 font-medium">
                  {marketStats.topLoser?.changePercent.toFixed(2)}%
                </p>
              </motion.div>
            </div>

            {/* Search Bar */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="relative max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="stock-search"
                    type="text"
                    placeholder="Search stocks by name or symbol... (e.g. RELIANCE, TCS)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-12 rounded-xl bg-card/60 backdrop-blur-xl border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search results count */}
                {search && (
                  <motion.p
                    className="text-xs text-muted-foreground mt-2 ml-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {filteredStocks.length} result{filteredStocks.length !== 1 ? "s" : ""}{" "}
                    found for "{search}"
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Sector Filter + Sort Controls */}
            <motion.div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Sector pills */}
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setActiveSector(sector)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeSector === sector
                        ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary bg-card/40 border border-border/30"
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Sort
                </button>
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      className="flex gap-1"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      {(
                        [
                          { key: "name", label: "Name" },
                          { key: "price", label: "Price" },
                          { key: "change", label: "Change" },
                          { key: "percent", label: "%" },
                        ] as const
                      ).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => toggleSort(key)}
                          className={`text-xs px-2 py-1 rounded transition-all ${
                            sortBy === key
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {label}
                          {sortBy === key && (
                            <span className="ml-0.5">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Stock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
              <AnimatePresence mode="popLayout">
                {filteredStocks.map((stock, i) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    index={i}
                    onClick={() => setSelectedStock(stock)}
                  />
                ))}
              </AnimatePresence>

              {filteredStocks.length === 0 && (
                <motion.div
                  className="col-span-full text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg font-display">
                    No stocks found
                  </p>
                  <p className="text-muted-foreground/60 text-sm mt-1">
                    Try a different search term or sector filter
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

        {/* Stock Detail Modal */}
        <AnimatePresence>
          {liveSelectedStock && (
            <StockDetailModal
              stock={liveSelectedStock}
              onClose={() => setSelectedStock(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Home;
