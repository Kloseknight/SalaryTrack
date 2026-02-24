
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
            text: `Extract salary data exactly as printed on the document.
            IMPORTANT: Do not calculate your own totals. Use the document's provided totals.
            1. Basic info: source (employer), date (YYYY-MM-DD), currency (3-letter ISO).
            2. Summary Fields (Extract directly from summary section):
               - grossAmount: Total Earnings/Gross Pay.
               - amount: Net Pay/Take-home.
               - tax: Total Tax withheld.
               - deductions: Total of non-tax deductions (benefits, pension, etc.).
            3. Detailed Items: List every entry for earnings/deductions. 
               - items: {name, amount, ytd, type: 'earning'|'deduction'|'benefit'}.
            4. Career: jobTitle, department.`,
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
            jobTitle: { type: Type.STRING },
            department: { type: Type.STRING },
            workedHours: { type: Type.NUMBER },
            grossAmount: { type: Type.NUMBER },
            amount: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            deductions: { type: Type.NUMBER },
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
    if (entries.length === 0) return "No data for analysis.";

    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const growthRate = first.grossAmount && last.grossAmount 
      ? (((last.grossAmount - first.grossAmount) / first.grossAmount) * 100).toFixed(1) 
      : "0";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this salary profile. Period: ${first.date} to ${last.date}. Growth: ${growthRate}%. 
      Identify trends in specific earnings items or deductions. Note any changes in tax percentage or benefits allocation.
      Keep it brief and professional.`,
      config: {
        systemInstruction: "You are a professional payroll analyst. Use bullet points.",
      }
    });

    return response.text || "Insights pending.";
  }
};
