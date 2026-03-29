import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { chatWithGemini, FinancialContext } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/ProtectedRoute";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

const quickReplies = [
  "How should I invest my savings?",
  "What's the 50/30/20 rule?",
  "Best investment for beginners?",
  "Analyze my spending habits",
  "How to save more money?",
  "Tax saving tips for this year",
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Hey! 👋 I'm your **InvestSmart AI Assistant** powered by Google Gemini. I can see your financial data and give you personalized advice!\n\nAsk me anything about investing, saving, budgeting, or financial planning.",
};

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [financialContext, setFinancialContext] = useState<FinancialContext | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFailedMsgRef = useRef<string | null>(null);

  // Fetch user's financial data for context
  useEffect(() => {
    if (!user) return;
    fetchFinancialContext();
  }, [user]);

  // Load chat history from Supabase (silent fail if table doesn't exist)
  useEffect(() => {
    if (!user) return;
    loadChatHistory();
  }, [user]);

  const fetchFinancialContext = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        const txs = data.map((t: any) => ({
          type: t.type,
          amount: parseFloat(t.amount),
          category: t.category,
          description: t.description || "",
          date: new Date(t.date || t.created_at).toLocaleDateString(),
        }));

        const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

        setFinancialContext({
          totalIncome: income,
          totalExpenses: expenses,
          netSavings: income - expenses,
          transactions: txs,
        });
      }
    } catch (err) {
      // Silently fail — context is optional
      console.log("Financial context not available:", err);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);

      // If table doesn't exist or any error, silently skip
      if (error) {
        console.log("Chat history not available:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const history: Message[] = data.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages([WELCOME_MSG, ...history]);
      }
    } catch (err) {
      console.log("Chat history load skipped:", err);
    }
  };

  const saveChatMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    try {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      // Silently fail — saving history is optional
      console.log("Chat message save skipped:", err);
    }
  };

  const clearChatHistory = async () => {
    if (!user) return;
    try {
      await supabase.from("chat_messages").delete().eq("user_id", user.id);
    } catch (err) {
      console.log("Chat clear skipped:", err);
    }
    setMessages([
      { role: "assistant", content: "Hey! 👋 Chat history cleared! I'm ready to help you with your investment questions." },
    ]);
    lastFailedMsgRef.current = null;
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;
    setInput("");
    lastFailedMsgRef.current = null;

    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    // Save user message (silently)
    saveChatMessage("user", msg);

    try {
      // Refresh financial context (non-blocking)
      fetchFinancialContext();

      // Send only actual conversation messages (skip the welcome message)
      const conversationMessages = updatedMessages
        .slice(1)
        .filter(m => !m.isError)
        .map(m => ({ role: m.role, content: m.content }));
      
      const response = await chatWithGemini(conversationMessages, financialContext);

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      saveChatMessage("assistant", response);
    } catch (err: any) {
      console.error("Chat error:", err);
      // This should rarely happen now since gemini.ts returns fallbacks
      // But just in case, show a friendly message with retry
      lastFailedMsgRef.current = msg;
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having a small hiccup! 😅 Don't worry, just tap **Retry** below and I'll try again right away.",
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const retryLastMessage = () => {
    if (!lastFailedMsgRef.current) return;
    const msg = lastFailedMsgRef.current;
    // Remove the error message
    setMessages(prev => prev.filter(m => !m.isError));
    sendMessage(msg);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg glow-border"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] glass rounded-2xl glow-border flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">AI Investment Advisor</p>
                  <p className="text-xs text-green-400">● Powered by Gemini</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={clearChatHistory} className="text-muted-foreground h-8 w-8" title="Clear chat">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-muted-foreground h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Context indicator */}
            {financialContext && financialContext.totalIncome > 0 && (
              <div className="px-4 py-2 bg-primary/5 border-b border-border/30 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-xs text-muted-foreground">
                  AI has access to your financial data • Savings: <span className="text-primary font-medium">₹{financialContext.netSavings.toLocaleString()}</span>
                </p>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "gradient-primary" : "bg-secondary"}`}>
                    {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-primary-foreground" /> : <User className="w-3.5 h-3.5 text-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-base [&_h2]:mt-1 [&_h2]:mb-2 [&_h3]:text-sm [&_p]:text-xs [&_li]:text-xs [&_table]:text-xs [&_blockquote]:text-xs [&_strong]:text-foreground [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:rounded">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Retry button when error occurred */}
              {lastFailedMsgRef.current && !isTyping && (
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <button
                    onClick={retryLastMessage}
                    className="flex items-center gap-2 text-xs bg-primary/15 hover:bg-primary/25 text-primary rounded-full px-4 py-2 transition-colors font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Message
                  </button>
                </motion.div>
              )}

              {isTyping && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-xl px-4 py-3 flex gap-1.5 items-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickReplies.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-secondary hover:bg-primary/20 hover:text-primary rounded-full px-3 py-1.5 text-muted-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about investing, savings..."
                  className="bg-secondary border-border text-sm flex-1"
                  disabled={isTyping}
                />
                <Button type="submit" size="icon" className="gradient-primary h-10 w-10 flex-shrink-0" disabled={!input.trim() || isTyping}>
                  <Send className="w-4 h-4 text-primary-foreground" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
