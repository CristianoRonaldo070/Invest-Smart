import { TrendingUp, Linkedin, Mail, Github, Shield, BarChart3, Lightbulb, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-16 border-t border-border/40">
      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-14">

          {/* Brand / About Us */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg text-foreground">
                Invest<span className="text-primary">Smart</span>
              </span>
            </div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-3">About Us</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md">
              InvestSmart was built with a simple belief — everyone deserves access to smart
              financial tools, not just Wall Street. We combine real-time market data with
              AI-powered insights to help you make confident investment decisions, whether
              you're a first-time investor saving ₹500 a month or a seasoned trader managing
              a diverse portfolio.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Our mission is to demystify investing and make wealth-building accessible,
              transparent, and stress-free for everyone across the globe.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="/home" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Market Dashboard
                </a>
              </li>
              <li>
                <a href="/savings" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Savings & Expenses
                </a>
              </li>
              <li>
                <a href="/home" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  AI Investment Advisor
                </a>
              </li>
            </ul>

            <h3 className="text-sm font-display font-semibold text-foreground mt-8 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  📈 Stock Market Basics
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  💡 Investment Strategies
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  🛡️ Risk Management
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">Contact</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Have questions, feedback, or just want to say hello? Reach out — we'd love to hear from you.
            </p>

            <div className="space-y-3">
              <a
                href="https://www.linkedin.com/in/akshit-pawar-a0b952286/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#0A66C2]/10 border border-[#0A66C2]/20 flex items-center justify-center group-hover:bg-[#0A66C2]/20 transition-colors">
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Akshit Pawar</p>
                  <p className="text-xs text-muted-foreground">Connect on LinkedIn</p>
                </div>
              </a>

              <a
                href="mailto:webnario7@gmail.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Email Us</p>
                  <p className="text-xs text-muted-foreground">webnario7@gmail.com</p>
                </div>
              </a>

              <a
                href="https://github.com/CristianoRonaldo070"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Github className="w-4 h-4 text-foreground/70" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">GitHub</p>
                  <p className="text-xs text-muted-foreground">View source code</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-border/30 py-5">
          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed max-w-3xl mx-auto">
            <strong className="text-muted-foreground/80">Disclaimer:</strong> InvestSmart provides
            informational content and AI-generated suggestions only. This is not financial advice.
            All investments carry risk. Past performance does not guarantee future results.
            Please consult a certified financial advisor before making investment decisions.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/20 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/50">
            © {currentYear} InvestSmart. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by Akshit Pawar
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
