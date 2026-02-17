
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  extractSalaryFromImage: async (base64Data: string, mimeType: string = "image/jpeg"): Promise<any> => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data.split(',')[1] || base64Data,
            },
          },
          {
            text: `Extract ALL salary details from this document. 
            Be extremely granular. Extract:
            1. Basic info: source (employer), date (YYYY-MM-DD), currency, taxCode.
            2. Career info: jobTitle, department.
            3. Metrics: workedHours.
            4. Summary: grossAmount, amount (net), tax, deductions.
            5. YTD: ytdGross, ytdNet.
            6. Line Items: {name, amount, ytd, type: 'earning'|'deduction'|'benefit'}.
            7. Disbursements: {bankCode, bankName, accountNo, amount}.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING },
            date: { type: Type.STRING },
            currency: { type: Type.STRING },
            taxCode: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            department: { type: Type.STRING },
            workedHours: { type: Type.NUMBER },
            grossAmount: { type: Type.NUMBER },
            amount: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            deductions: { type: Type.NUMBER },
            ytdGross: { type: Type.NUMBER },
            ytdNet: { type: Type.NUMBER },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  ytd: { type: Type.NUMBER },
                  type: { type: Type.STRING }
                }
              }
            },
            disbursements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bankCode: { type: Type.STRING },
                  bankName: { type: Type.STRING },
                  accountNo: { type: Type.STRING },
                  amount: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      },
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Extraction failed", e);
      return {};
    }
  },

  getFinancialInsights: async (entries: FinancialEntry[]): Promise<string> => {
    if (entries.length === 0) return "Add some transactions to see your financial growth analysis.";

    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const growthRate = first.grossAmount && last.grossAmount 
      ? (((last.grossAmount - first.grossAmount) / first.grossAmount) * 100).toFixed(1) 
      : "N/A";
    
    const avgHourly = sorted.filter(e => (e.workedHours ?? 0) > 0)
      .reduce((acc, e) => acc + ((e.grossAmount || 0) / (e.workedHours || 1)), 0) / (sorted.filter(e => (e.workedHours ?? 0) > 0).length || 1);

    const taxEfficiency = sorted.reduce((acc, e) => acc + (e.amount / (e.grossAmount || e.amount)), 0) / sorted.length;

    // Aggregate disbursement channels for AI analysis
    const channelTotals: Record<string, number> = {};
    entries.forEach(e => {
      e.disbursements?.forEach(d => {
        channelTotals[d.bankName] = (channelTotals[d.bankName] || 0) + d.amount;
      });
    });

    const summary = sorted.slice(-12).map(e => {
      return `${e.date}: Gross ${e.grossAmount}, Net ${e.amount}, Hours ${e.workedHours}, Job: ${e.jobTitle}`;
    }).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are an elite Career & Wealth Strategist. Analyze this specific data profile:
      
      STATISTICAL SUMMARY:
      - Period: ${first.date} to ${last.date}
      - Total Gross Growth: ${growthRate}%
      - Avg Hourly Rate (Gross): ${avgHourly.toFixed(2)}
      - Tax/Deduction Leakage: ${((1 - taxEfficiency) * 100).toFixed(1)}%
      - Wealth Distribution: ${JSON.stringify(channelTotals)}

      DETAILED HISTORY:
      ${summary}

      TASK: Provide 4 high-impact, data-driven insights. Focus on:
      1. Career Velocity (Is the value of your hour increasing faster than inflation?)
      2. Tax Optimization (Flag any increase in deduction leakage percentages)
      3. Wealth Flow Diversification (Analyze the distribution across your bank channels. Is the allocation to savings/investment accounts growing?)
      4. Strategy Recommendation (Concrete advice on negotiation or allocation based on this momentum)`,
      config: {
        systemInstruction: "You are a clinical wealth analyst. Use numbers and hard logic. Be brief but punchy.",
      }
    });

    return response.text || "No insights available.";
  }
};
