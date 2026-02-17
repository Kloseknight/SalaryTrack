
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
            1. Basic info: source (employer), date (YYYY-MM-DD), currency (Must be 3-letter ISO code like USD, GBP, EUR), taxCode.
            2. Career info: jobTitle (e.g. Senior Engineer), department (e.g. Sales).
            3. Metrics: workedHours (number of hours worked).
            4. Summary: grossAmount (current), amount (net pay current), tax (current), deductions (total current).
            5. YTD: ytdGross, ytdNet.
            6. Line Items: An array of objects with {name, amount, ytd, type: 'earning'|'deduction'|'benefit'}.
            7. Disbursements: An array of objects from the bank details table with {bankCode, bankName, accountNo, amount}. This describes where the net pay was sent.`,
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

    const summary = entries.slice(0, 10).map(e => {
      const lineSummary = e.lineItems ? e.lineItems.map(li => `${li.name}: ${li.amount}`).join(', ') : '';
      return `${e.date} [${e.type.toUpperCase()}] ${e.source}: ${e.amount} (Role: ${e.jobTitle || 'N/A'}, Dept: ${e.department || 'N/A'}, Hours: ${e.workedHours || 'N/A'}). Items: ${lineSummary}`;
    }).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a high-end wealth strategist. Analyze these career and financial entries. 
      Focus on income growth, hourly rate trends (if hours provided), and career progression.
      Provide 4 powerful insights.
      
      History:
      ${summary}`,
      config: {
        systemInstruction: "You are an elite personal wealth manager. Provide high-impact, brief, and actionable advice.",
      }
    });

    return response.text || "No insights available.";
  }
};
