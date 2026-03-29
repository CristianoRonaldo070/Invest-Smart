import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp } from "@/lib/auth";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    if (isSignUp && !form.name.trim()) e.name = "Name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(form.name, form.email, form.password);
        toast({ title: "Account created! 🎉", description: "Welcome to InvestSmart" });
      } else {
        const user = await signIn(form.email, form.password);
        toast({ title: "Welcome back! 👋", description: `Hello, ${user.name}` });
      }
      navigate("/home");
    } catch (err: any) {
      const message = err?.message || "Something went wrong";
      if (message.includes("already registered") || message.includes("already been registered")) {
        setErrors({ email: "Email already registered" });
      } else if (message.includes("Invalid login")) {
        setErrors({ email: "Invalid email or password" });
      } else {
        setErrors({ email: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-glow-muted/5 blur-[100px]" />

      <motion.div
        className="w-full max-w-md glass rounded-2xl p-8 glow-border relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-display font-bold">
            Invest<span className="text-primary">Smart</span>
          </h1>
        </div>

        <div className="flex mb-6 bg-secondary rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isSignUp ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setIsSignUp(false); setErrors({}); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isSignUp ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setIsSignUp(true); setErrors({}); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </motion.div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" />
            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-secondary border-border pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait...</>
            ) : (
              isSignUp ? "Create Account" : "Login"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
