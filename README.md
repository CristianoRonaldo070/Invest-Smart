# 🚀 InvestSmart — AI-Powered Investment Platform

<div align="center">

![InvestSmart Banner](https://img.shields.io/badge/InvestSmart-AI%20Powered-blue?style=for-the-badge&logo=trending-up)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

**Your smart investment companion — track stocks, manage finances, and get AI-powered advice.**

[Live Demo](#) · [Report Bug](https://github.com/CristianoRonaldo070/investiq7/issues) · [Request Feature](https://github.com/CristianoRonaldo070/investiq7/issues)

</div>

---

## ✨ Features

### 📈 Real-Time Stock Market Dashboard
- **Live stock tracking** for 24+ major stocks (AAPL, MSFT, GOOGL, NVDA, TSLA, META, and more)
- **Real-time price updates** with live ticking prices and sparkline mini-charts
- **Interactive stock detail modal** — click any stock to view full charts (1D/1W/1M/3M/1Y timeframes), open/high/low/close, volume, market cap, and sector info
- **Scrolling market ticker** displaying all stock prices in real-time
- **Market summary cards** showing gainers, losers, top gainer, and top loser at a glance

### 🔍 Search & Filter
- **Instant search** — find any stock by name or symbol
- **Sector filtering** — filter stocks by Technology, Financial, Consumer, Healthcare, Energy, Entertainment, Automotive, Industrial
- **Sort controls** — sort by name, price, change, or percentage

### 🤖 AI-Powered Investment Advisor
- **Google Gemini AI chatbot** integrated for personalized investment suggestions
- Context-aware financial advice based on your portfolio and savings data
- Available on every page via floating chat button

### 💰 Savings & Expense Tracker
- Track your income, expenses, and savings
- Visual breakdown of your financial health
- Smart insights to optimize your spending

### 🔐 Secure Authentication
- **Supabase Auth** for secure user login/signup
- Protected routes ensuring data privacy
- Session management with auto-redirect

### 🎨 Premium UI/UX
- Dark theme with glassmorphism design
- Smooth animations powered by Framer Motion
- Fully responsive — works on desktop, tablet, and mobile
- Custom favicon with upward-trending graph icon

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Frontend framework |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **Recharts** | Interactive stock charts |
| **Supabase** | Authentication & database |
| **Google Gemini AI** | AI chatbot & investment suggestions |
| **Shadcn/UI** | Pre-built UI components |
| **Lucide React** | Modern icon library |

---

## 📸 Screenshots

### Stock Market Dashboard
> Real-time stock prices with sparkline charts, market summary, and search functionality.

### Stock Detail Modal
> Click any stock to view interactive charts with multiple timeframes and detailed financial info.

### AI Chatbot
> Get personalized investment advice powered by Google Gemini AI.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **bun**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CristianoRonaldo070/investiq7.git
   cd investiq7
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:8080
   ```

### Optional: Real-Time Stock Data
To get real market data from Finnhub API (free):
1. Sign up at [finnhub.io](https://finnhub.io/register)
2. Add to your `.env`:
   ```env
   VITE_FINNHUB_API_KEY=your_finnhub_api_key
   ```

---

## 📁 Project Structure

```
investiq7/
├── public/
│   ├── favicon.svg          # Custom graph favicon
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── AIChatbot.tsx     # Gemini AI chatbot
│   │   ├── Footer.tsx        # Footer with about/contact
│   │   ├── MarketTicker.tsx  # Scrolling stock ticker
│   │   ├── Navbar.tsx        # Navigation bar
│   │   ├── StockCard.tsx     # Stock card with sparkline
│   │   ├── StockDetailModal.tsx  # Full stock detail modal
│   │   └── ui/              # Shadcn UI components
│   ├── hooks/
│   │   └── useStockData.ts   # Real-time stock data hook
│   ├── pages/
│   │   ├── Home.tsx          # Stock market dashboard
│   │   ├── Login.tsx         # Auth page
│   │   ├── Savings.tsx       # Expense tracker
│   │   └── Splash.tsx        # Loading screen
│   ├── lib/                  # Utilities & auth helpers
│   ├── App.tsx               # Routes & providers
│   └── index.css             # Global styles & design tokens
├── .env                      # Environment variables
├── tailwind.config.ts        # Tailwind configuration
└── vite.config.ts            # Vite configuration
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/CristianoRonaldo070/investiq7/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📬 Contact

**Akshit Pawar**

- 💼 LinkedIn: [akshit-pawar](https://www.linkedin.com/in/akshit-pawar-a0b952286/)
- 📧 Email: webnario7@gmail.com
- 🐙 GitHub: [@CristianoRonaldo070](https://github.com/CristianoRonaldo070)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by **Akshit Pawar**

⭐ Star this repo if you found it helpful!

</div>
