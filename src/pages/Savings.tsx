import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Lightbulb, DollarSign, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { getInvestmentSuggestions, FinancialContext } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

const expenseCategories = ["Food", "Rent", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Education", "Other"];
const incomeCategories = ["Salary", "Freelance", "Business", "Investment Returns", "Other"];

const Savings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", amount: "", category: "", description: "" });
  const [addingTx, setAddingTx] = useState(false);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<string>("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");

  // Fetch transactions from Supabase
  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(
        (data || []).map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          category: t.category,
          description: t.description || "",
          date: new Date(t.date || t.created_at).toLocaleDateString(),
        }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;

  const addTransaction = async () => {
    if (!form.amount || !form.category || !user) return;
    setAddingTx(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: form.type,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: "Added! ✅", description: `${form.type === "income" ? "Income" : "Expense"} of ₹${parseFloat(form.amount).toLocaleString()} recorded` });
      setForm({ ...form, amount: "", category: "", description: "" });
      await fetchTransactions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add transaction", variant: "destructive" });
    } finally {
      setAddingTx(false);
    }
  };

  const removeTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
      toast({ title: "Deleted", description: "Transaction removed" });
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const getAISuggestions = async () => {
    if (savings <= 0) return;
    setLoadingSuggestions(true);
    setSuggestionsError("");
    setAiSuggestions("");

    const context: FinancialContext = {
      totalIncome,
      totalExpenses: totalExpense,
      netSavings: savings,
      transactions: transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      })),
    };

    try {
      const result = await getInvestmentSuggestions(context);
      setAiSuggestions(result);
    } catch (err: any) {
      setSuggestionsError("Failed to get AI suggestions. Please try again.");
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
        <motion.h1 className="text-3xl md:text-4xl font-display font-bold mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Savings & <span className="text-primary">Expenses</span>
        </motion.h1>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Income", value: totalIncome, icon: TrendingUp, color: "text-green-400" },
            { label: "Total Expenses", value: totalExpense, icon: TrendingDown, color: "text-red-400" },
            { label: "Net Savings", value: savings, icon: Wallet, color: savings >= 0 ? "text-primary" : "text-red-400" },
          ].map((c, i) => (
            <motion.div key={c.label} className="glass rounded-xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex items-center gap-3 mb-2">
                <c.icon className={`w-5 h-5 ${c.color}`} />
                <span className="text-muted-foreground text-sm">{c.label}</span>
              </div>
              <p className={`text-2xl font-display font-bold ${c.color}`}>₹{c.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        {totalIncome > 0 && (
          <div className="glass rounded-xl p-6 mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Savings Rate</span>
              <span className="text-primary font-medium">{Math.max(0, Math.round((savings / totalIncome) * 100))}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, (savings / totalIncome) * 100))}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add transaction form */}
          <motion.div className="glass rounded-xl p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-xl font-display font-semibold mb-4">Add Transaction</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["income", "expense"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t, category: "" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.type === t ? (t === "income" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30") : "bg-secondary text-muted-foreground"}`}
                  >
                    {t === "income" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input placeholder="Add a note..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
              </div>
              <Button onClick={addTransaction} className="w-full gradient-primary text-primary-foreground" disabled={addingTx}>
                {addingTx ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add {form.type === "income" ? "Income" : "Expense"}
              </Button>
            </div>
          </motion.div>

          {/* Transactions list */}
          <motion.div className="glass rounded-xl p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-xl font-display font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet. Start adding!</p>
              ) : transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {t.type === "income" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.category}</p>
                      <p className="text-xs text-muted-foreground">{t.description || t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                    </span>
                    <button onClick={() => removeTransaction(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Investment Suggestions */}
        {savings > 0 && (
          <motion.div className="mt-8 glass rounded-xl p-6 glow-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold">AI Investment Suggestions</h2>
                  <p className="text-muted-foreground text-sm">Powered by Google Gemini • Based on your savings of ₹{savings.toLocaleString()}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={getAISuggestions}
                disabled={loadingSuggestions}
                className="gap-2"
              >
                {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
            </div>

            {loadingSuggestions && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium">AI is analyzing your finances...</p>
                  <p className="text-muted-foreground text-sm">Generating personalized investment plan</p>
                </div>
              </div>
            )}

            {suggestionsError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                <p className="text-destructive text-sm">{suggestionsError}</p>
                <Button variant="outline" size="sm" onClick={getAISuggestions} className="mt-2">
                  Try Again
                </Button>
              </div>
            )}

            {aiSuggestions && !loadingSuggestions && (
              <div className="prose prose-sm prose-invert max-w-none 
                [&_h1]:text-xl [&_h1]:font-display [&_h1]:text-foreground [&_h1]:mb-3
                [&_h2]:text-lg [&_h2]:font-display [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3
                [&_h3]:text-base [&_h3]:font-display [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2
                [&_p]:text-muted-foreground [&_p]:text-sm [&_p]:leading-relaxed
                [&_li]:text-muted-foreground [&_li]:text-sm
                [&_strong]:text-foreground
                [&_table]:text-sm [&_th]:text-primary [&_th]:text-left [&_th]:pb-2 [&_th]:pr-4
                [&_td]:text-muted-foreground [&_td]:py-1.5 [&_td]:pr-4 [&_td]:border-t [&_td]:border-border/30
                [&_blockquote]:border-l-primary [&_blockquote]:text-muted-foreground
                [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:rounded
              ">
                <ReactMarkdown>{aiSuggestions}</ReactMarkdown>
              </div>
            )}

            {!aiSuggestions && !loadingSuggestions && !suggestionsError && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">Click refresh to get AI-powered investment suggestions</p>
                <Button onClick={getAISuggestions} className="gradient-primary text-primary-foreground gap-2">
                  <Sparkles className="w-4 h-4" /> Get AI Suggestions
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Savings;
