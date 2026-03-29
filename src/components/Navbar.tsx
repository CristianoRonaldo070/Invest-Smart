import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TrendingUp, Home, PiggyBank, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/savings", label: "Savings & Expenses", icon: PiggyBank },
  ];

  const logout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "See you soon! 👋" });
      navigate("/login");
    } catch (err) {
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg">Invest<span className="text-primary">Smart</span></span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === l.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground ml-2">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-border/50 p-4 space-y-2">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${location.pathname === l.to ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              <l.icon className="w-4 h-4" /> {l.label}
            </Link>
          ))}
          <button onClick={logout} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-muted-foreground w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
