import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setProgress(p => Math.min(p + 2, 100)), 50);
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-glow-muted/10 blur-[80px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Chart animation */}
        <div className="flex items-end gap-2 h-32">
          {[40, 60, 45, 75, 55, 90, 70, 100].map((h, i) => (
            <motion.div
              key={i}
              className="w-4 rounded-t-md gradient-primary"
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.1 * i, duration: 0.8, ease: "easeOut" }}
            />
          ))}
        </div>

        {/* Floating icons */}
        <div className="relative w-64 h-16">
          <motion.div className="absolute left-0 top-0" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <DollarSign className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.div className="absolute left-1/2 -translate-x-1/2 top-0" animate={{ y: [0, -12, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <TrendingUp className="w-10 h-10 text-primary glow-text" />
          </motion.div>
          <motion.div className="absolute right-0 top-0" animate={{ y: [0, -8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <BarChart3 className="w-8 h-8 text-primary" />
          </motion.div>
        </div>

        <motion.h1
          className="text-5xl md:text-6xl font-display font-bold text-foreground glow-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Invest<span className="text-primary">Smart</span>
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Your smart investment companion
        </motion.p>

        {/* Progress bar */}
        <motion.div
          className="w-48 h-1 rounded-full bg-secondary overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div
            className="h-full gradient-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Splash;
