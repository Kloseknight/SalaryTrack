
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialEntry } from "../types";

const getApiKey = () => {
  // 1. Try platform-injected key (AI Studio Preview)
  const userKey = process.env.API_KEY;
  if (userKey && userKey !== 'undefined') {
    return userKey;
  }
  
  // 2. Try manual key from localStorage (Shared App URL fallback)
  const manualKey = localStorage.getItem('salarytrack_manual_key');
  if (manualKey) {
    return manualKey;
  }

  return "";
};

const getAiInstance = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  extractSalaryFromImage: async (base64Data: string, mimeType: string = "image/jpeg"): Promise<any> => {
    const ai = getAiInstance();
    if (!ai) {
      throw new Error("API Key is missing. Please configure GEMINI_API_KEY or connect your own key.");
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
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
                totalBenefits: { type: Type.NUMBER },
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
                      bankName: { type: Type.STRING },
                      bankCode: { type: Type.STRING },
                      accountNo: { type: Type.STRING },
                      amount: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          },
        });

        return JSON.parse(response.text || "{}");
      } catch (error: any) {
        attempts++;
        const isRetryable = error.message?.includes("503") || error.message?.toLowerCase().includes("high demand");
        
        if (isRetryable && attempts < maxAttempts) {
          console.warn(`Gemini busy (Attempt ${attempts}/${maxAttempts}). Retrying in 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        console.error("Gemini Extraction Error:", error);
        if (error.message?.includes("API_KEY_INVALID")) {
          throw new Error("Invalid API Key. Please check your Gemini API configuration.");
        }
        throw error;
      }
    }
  }
};
