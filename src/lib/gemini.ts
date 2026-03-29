const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429 && attempt < maxRetries) {
      // Rate limited — wait with exponential backoff
      const waitTime = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
      console.log(`Rate limited, retrying in ${Math.round(waitTime / 1000)}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}

export async function chatWithGemini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  financialContext?: FinancialContext
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
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
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text;
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
