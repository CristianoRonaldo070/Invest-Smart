const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface FinancialContext {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactions: Array<{
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
}

const SYSTEM_PROMPT = `You are InvestSmart AI — a friendly, knowledgeable personal investment advisor and financial assistant. 

Your personality:
- Warm, approachable, and encouraging
- You explain complex financial concepts in simple terms
- You use emojis tastefully to make conversations engaging
- You format responses with markdown (headers, bold, tables, bullet points) for readability

Your expertise:
- Indian investment options: Mutual Funds, Stocks, Fixed Deposits, Gold, PPF, NPS, Real Estate, Crypto
- Budgeting strategies (50/30/20 rule, zero-based budgeting)
- Tax-saving investments (Section 80C, 80D)
- Risk assessment and portfolio allocation
- Compound interest calculations
- Emergency fund planning

Rules:
- Always give specific, actionable advice with numbers and percentages
- When you have the user's financial data, personalize ALL suggestions based on their actual income/expenses/savings
- Recommend allocation percentages that add up to 100%
- Include expected returns for each recommendation
- If the user asks about non-financial topics, you can chat casually but gently steer back to finance
- Always include a disclaimer that this is educational advice, not professional financial advice
- Use ₹ for Indian Rupee amounts`;

function buildContextPrompt(context?: FinancialContext): string {
  if (!context || (context.totalIncome === 0 && context.totalExpenses === 0)) {
    return '';
  }

  const savingsRate = context.totalIncome > 0 
    ? Math.round((context.netSavings / context.totalIncome) * 100) 
    : 0;

  // Summarize spending by category
  const expenseByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  
  context.transactions.forEach(t => {
    if (t.type === 'expense') {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    } else {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    }
  });

  const expenseSummary = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toLocaleString()}`)
    .join('\n');

  const incomeSummary = Object.entries(incomeByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toLocaleString()}`)
    .join('\n');

  return `

USER'S CURRENT FINANCIAL DATA:
- Total Income: ₹${context.totalIncome.toLocaleString()}
- Total Expenses: ₹${context.totalExpenses.toLocaleString()}
- Net Savings: ₹${context.netSavings.toLocaleString()}
- Savings Rate: ${savingsRate}%
- Number of Transactions: ${context.transactions.length}

Income Breakdown:
${incomeSummary || '  No income recorded yet'}

Expense Breakdown:
${expenseSummary || '  No expenses recorded yet'}

Use this data to personalize your advice. Reference their specific numbers when giving suggestions.`;
}

// Intelligent fallback responses when API is completely unavailable
const FALLBACK_RESPONSES = [
  "⚠️ **API rate limit reached** — Google's free Gemini tier has per-minute request limits. Here are some **investment tips** while the limit resets (usually 1-2 minutes):\n\n📊 **Quick Investment Tips:**\n- Start with a **SIP in index funds** (Nifty 50/Sensex) — even ₹500/month\n- Keep **6 months of expenses** as emergency fund in liquid funds\n- Use **PPF** for guaranteed tax-free returns (Section 80C)\n- Consider **ELSS funds** for tax saving with market-linked returns\n\n💡 Try again in **1-2 minutes** and it should work! 🔄",
  "⚠️ **Too many requests** — The AI needs a brief cooldown. Here's what I can share right now:\n\n💡 **Smart Money Moves:**\n- **50/30/20 Rule**: 50% needs, 30% wants, 20% savings\n- **NPS** offers additional ₹50,000 tax deduction under 80CCD(1B)\n- Start **SIPs early** — compounding is your best friend\n- **Gold ETFs** are better than physical gold for investment\n\n⏰ Wait **1-2 minutes** then try again! 🔄",
  "⚠️ **Rate limited** — Please wait a moment before retrying. Here are quick insights:\n\n🎯 **Beginner's Investment Checklist:**\n1. Build an **emergency fund** first (3-6 months expenses)\n2. Get **term insurance** and **health insurance**\n3. Start **SIP in a diversified mutual fund**\n4. Maximize **Section 80C** deductions (₹1.5L limit)\n5. Consider **PPF** for long-term debt allocation\n\n⏰ Try again in **1-2 minutes**! 🔄",
];

let fallbackIndex = 0;

function getSmartFallback(): string {
  const response = FALLBACK_RESPONSES[fallbackIndex % FALLBACK_RESPONSES.length];
  fallbackIndex++;
  return response;
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 429 && attempt < maxRetries) {
        // Rate limited — wait longer with exponential backoff + jitter
        const waitTime = Math.pow(2, attempt + 2) * 1000 + Math.random() * 3000;
        console.log(`Rate limited, retrying in ${Math.round(waitTime / 1000)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (response.status >= 500 && attempt < maxRetries) {
        // Server error — retry with backoff
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Server error ${response.status}, retrying in ${Math.round(waitTime / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (err: any) {
      lastError = err;
      
      if (err.name === 'AbortError') {
        console.log(`Request timed out (attempt ${attempt + 1}/${maxRetries + 1})`);
      } else {
        console.log(`Network error (attempt ${attempt + 1}/${maxRetries + 1}):`, err.message);
      }
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export async function chatWithGemini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  financialContext?: FinancialContext
): Promise<string> {
  if (!GEMINI_API_KEY) {
    // No API key — return helpful fallback instead of crashing
    return getSmartFallback();
  }

  const contextPrompt = buildContextPrompt(financialContext);
  const fullSystemPrompt = SYSTEM_PROMPT + contextPrompt;

  // Convert messages to Gemini format
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const requestBody = {
    system_instruction: {
      parts: [{ text: fullSystemPrompt }],
    },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  // Try multiple models as fallback
  for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
    const model = GEMINI_MODELS[modelIndex];
    const apiUrl = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Gemini API error (${model}):`, errorData);
        
        // If model not found or invalid, try next model
        if (response.status === 404 || response.status === 400) {
          console.log(`Model ${model} failed, trying next...`);
          continue;
        }
        
        // For other errors, try next model too
        if (modelIndex < GEMINI_MODELS.length - 1) {
          console.log(`Model ${model} returned ${response.status}, trying next...`);
          continue;
        }
        
        // All models failed — return smart fallback
        return getSmartFallback();
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        // Safety filter or empty response — try next model
        if (modelIndex < GEMINI_MODELS.length - 1) {
          console.log(`Model ${model} returned empty, trying next...`);
          continue;
        }
        return getSmartFallback();
      }

      return text;
    } catch (err: any) {
      console.error(`Error with model ${model}:`, err);
      
      if (modelIndex < GEMINI_MODELS.length - 1) {
        console.log(`Model ${model} errored, trying next...`);
        continue;
      }
      
      // All models exhausted — return smart fallback instead of throwing
      return getSmartFallback();
    }
  }

  // Should never reach here, but just in case
  return getSmartFallback();
}

export async function getInvestmentSuggestions(context: FinancialContext): Promise<string> {
  const prompt = `I have ₹${context.netSavings.toLocaleString()} in net savings available to invest. Give me a COMPLETE and DETAILED personalized investment plan.

You MUST include ALL of the following sections with FULL detail — do NOT cut short or summarize:

## 1. Portfolio Allocation Table
Create a markdown table with these EXACT columns:
| Investment | Allocation % | Amount (₹) | Risk Level | Expected Returns (p.a.) | Lock-in Period |

Include at least 5-6 different investments. All allocation percentages MUST add up to 100%. Calculate exact ₹ amounts based on my ₹${context.netSavings.toLocaleString()} savings.

## 2. Detailed Breakdown
For EACH investment in the table above, provide:
- What it is and how it works (1-2 lines)
- Specific fund/stock names to invest in (e.g., "Nifty 50 Index Fund - UTI/HDFC/SBI")
- Exact platform to use (Groww, Zerodha, Bank, etc.)
- Why it suits my financial profile
- Monthly SIP amount if applicable

## 3. Investment Timeline
Create a clear timeline:
- **Immediate (This Week):** What to do right now
- **Short-term (0-2 years):** Which investments and how much
- **Medium-term (2-5 years):** Which investments and how much  
- **Long-term (5+ years):** Which investments and how much

## 4. Risk Assessment
- Overall portfolio risk rating
- What % is in safe vs aggressive investments
- Worst-case and best-case scenario in 5 years

## 5. Expected Returns Summary
Create a table showing projected portfolio value:
| Time Period | Conservative | Moderate | Aggressive |
| 1 Year | ₹ | ₹ | ₹ |
| 3 Years | ₹ | ₹ | ₹ |
| 5 Years | ₹ | ₹ | ₹ |
| 10 Years | ₹ | ₹ | ₹ |

## 6. Action Steps
Numbered list of exact steps to start investing TODAY.

IMPORTANT: Complete ALL sections fully. Do not truncate or skip any section. Use Indian investment options only (₹).`;

  return chatWithGemini(
    [{ role: 'user', content: prompt }],
    context
  );
}
