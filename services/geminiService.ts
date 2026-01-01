
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const INSTITUTIONAL_ICT_PROTOCOL = `
PROTOCOL: INSTITUTIONAL EXECUTION ENGINE (ADVANCED ICT).
INPUT: CHART DATA / IMAGE.
OBJECTIVE: PROFESSIONAL-GRADE SMC/ICT STRUCTURAL & TEMPORAL ANALYSIS.

CRITICAL CALIBRATION RULES (ZERO TOLERANCE):
1. **TIMEZONE**: ALL ANALYSIS MUST BE BASED ON **NEW YORK LOCAL TIME (EST/EDT)**.
   - You must mentally convert Chart Time (if UTC) to NY Time.
   - Example: 07:00 UTC = 02:00 EST (London Open).
   - Example: 13:30 UTC = 08:30 EST (News Injection).

2. **SESSION DEFINITIONS (NY TIME)**:
   - **ASIA RANGE**: 20:00 - 00:00 NY.
   - **LONDON OPEN (KILLZONE)**: 02:00 - 05:00 NY.
   - **NEW YORK OPEN (KILLZONE)**: 07:00 - 10:00 NY.
   - **LONDON CLOSE**: 10:00 - 12:00 NY.
   - **CBDR**: 14:00 - 20:00 NY.

3. **KEY REFERENCE PRICE LEVELS**:
   - **NMO (New York Midnight Open)**: The EXACT opening price of the 00:00 NY candle.
   - **8:30 OPEN**: The EXACT opening price of the 08:30 NY candle.
   - **NDOG (New Day Opening Gap)**: Gap between Friday close and Sunday open.

MANDATORY ANALYSIS LAYERS:
1. STRUCTURE: HTF Bias, MSS (Market Structure Shift), BOS.
2. LIQUIDITY: BSL (Buy Side), SSL (Sell Side), EQH/EQL.
3. IMBALANCE: FVG (Fair Value Gaps), VI (Volume Imbalance).
4. POWER OF 3 (AMD CYCLE):
   - **A**ccumulation: Usually Asia Range.
   - **M**anipulation: Judas Swing (often London Open).
   - **D**istribution: Expansion (often NY Open).

STRICT OUTPUT FORMAT:
1. MARKDOWN ANALYSIS (Headers: Bias, Structure, Entry, Risk).
2. APPEND THE FOLLOWING DATA PACKET AT THE VERY END (for parsing):
---ICT_DATA_PACKET---
SESSION: [ASIA / LONDON / NY / LONDON_CLOSE / PM_SESSION / UNDETERMINED]
PHASE: [ACCUMULATION / MANIPULATION / DISTRIBUTION / RETRACEMENT]
KILLZONE: [ACTIVE - Name / INACTIVE]
LEVEL: [NY Midnight Open] | [Exact Price or N/A]
LEVEL: [08:30 Open] | [Exact Price or N/A]
LEVEL: [Key FVG] | [Price Range]
LEVEL: [Order Block] | [Price Range]
---END_PACKET---
`;

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeChart(imageBase64: string): Promise<string> {
    const ai = this.getClient();
    const now = new Date();
    const timeContext = `CONTEXT: Real-world UTC Time is ${now.toISOString()}. 
    INSTRUCTION: Look at the LAST candle on the chart. Determine the SESSION of that specific candle based on NY Time. 
    Do not use the current real-world time if the chart is historical. 
    If time axis is not visible, infer from price action characteristics or state 'UNDETERMINED'.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
          {
            text: `EXECUTE DEEP ICT PROTOCOL. ${timeContext}`,
          },
        ],
      },
      config: {
        systemInstruction: INSTITUTIONAL_ICT_PROTOCOL,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    return response.text || "PROTOCOL_FAILURE: NO_CONTENT";
  }

  async getRealTimePrices(): Promise<{btc: number, eth: number}> {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Current live USD price for Bitcoin and Ethereum. Return JSON numeric values only.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              btc: { type: Type.NUMBER },
              eth: { type: Type.NUMBER }
            },
            required: ["btc", "eth"]
          }
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { btc: 0, eth: 0 };
    }
  }

  async getMarketSentiment(): Promise<{text: string, chunks?: any[]}> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Aggregate global macro-bias. DXY, Yields, and BTC flow. Provide concise institutional narrative.",
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Execute macro strategy scan. Direct, technical data only. Cite sources.",
      },
    });

    return {
      text: response.text || "Unable to aggregate macro flow.",
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  }

  async chat(message: string, history: Array<{role: string, text: string}>): Promise<string> {
    const ai = this.getClient();
    const geminiHistory = history.map(item => ({
      role: item.role === 'ai' ? 'model' : 'user',
      parts: [{ text: item.text }]
    }));

    const chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      history: geminiHistory,
      config: {
        systemInstruction: "You are the NEXUS ADVISOR CORE. Provide technical structural advice based on SMC/ICT. Clinical logic only. STRICTLY adhere to NY Timezone for all session references.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text || "LOGIC_ERROR";
  }
}

export const geminiService = new GeminiService();
