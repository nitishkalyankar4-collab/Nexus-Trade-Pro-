
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TradeSetup } from "../types";

const INSTITUTIONAL_ICT_PROTOCOL = `
PROTOCOL: INSTITUTIONAL VISUAL EXECUTION ENGINE (ADVANCED ICT).
INPUT: RAW CHART IMAGE.
OBJECTIVE: EXTRACT VISUAL DATA & SYNTHESIZE TRADING SETUP.

*** VISUAL IDENTIFICATION (STEP 1 - CRITICAL) ***
You are an OCR-First Analyst. Before analyzing structure, you MUST identify the asset:
1. **SCAN TOP LEFT**: Look for text like "XRPUSDT", "BTCUSD", "ETHUSD", "GBPUSD".
2. **SCAN BACKGROUND**: Look for large faint watermarks (e.g., "XRP", "BITCOIN").
3. **VERIFY WITH PRICE**: 
   - Check the Right Axis numbers.
   - Example: If price is 0.50 - 1.00, it is likely XRP, ADA, or MATIC. It is NOT Bitcoin.
   - Example: If price is 2000 - 3000, it is likely ETH.
   - Example: If price is 1.0500 - 1.1000, it is likely EURUSD.
   - **IF TICKER SAYS 'XRP' AND PRICE IS '0.60', IT IS XRP. DO NOT SAY IT IS GOLD.**

*** TIME & SESSION CALIBRATION ***
1. **TIMEZONE**: Mentally convert visible chart time to **NEW YORK LOCAL TIME (EST/EDT)**.
2. **SESSION**: Identify the session based on the *latest* candles visible.
   - **ASIA RANGE**: 20:00 - 00:00 NY.
   - **LONDON OPEN**: 02:00 - 05:00 NY.
   - **NEW YORK OPEN**: 07:00 - 10:00 NY.
   - **LONDON CLOSE**: 10:00 - 12:00 NY.

*** AGGRESSIVE ENTRY MANDATE (USER REQUEST) ***
- **DO NOT WAIT FOR CONFIRMATION**. The user demands an IMMEDIATE, ACTIONABLE SETUP.
- Provide LIMIT ORDER coordinates based on the *current* visible structure.
- If the chart shows a high probability (>60%) setup, generate a full trade plan.
- If NO setup is currently valid, explicitly state "NO TRADE FOUND" in the analysis.

STRICT OUTPUT FORMAT:
1. MARKDOWN ANALYSIS.
   - **Start with a Header**: "# VISUAL CONFIRMATION: [ASSET FOUND] @ [CURRENT PRICE]"
   - Then proceed with Bias, Structure, Entry, Risk.
2. APPEND THE FOLLOWING DATA PACKET AT THE END (for parsing):
---ICT_DATA_PACKET---
SESSION: [ASIA / LONDON / NY / LONDON_CLOSE / PM_SESSION / UNDETERMINED]
PHASE: [ACCUMULATION / MANIPULATION / DISTRIBUTION / RETRACEMENT]
KILLZONE: [ACTIVE - Name / INACTIVE]
LEVEL: [TYPE: BSL/SSL/PDH/PDL/FVG/OB] | [PRICE] | [BRIEF LABEL]
LEVEL: [TYPE: BSL/SSL/PDH/PDL/FVG/OB] | [PRICE] | [BRIEF LABEL]
LEVEL: [TYPE: BSL/SSL/PDH/PDL/FVG/OB] | [PRICE] | [BRIEF LABEL]
---END_PACKET---

3. IF A VALID TRADE EXISTS, APPEND THIS JSON BLOCK (Minified, Single Line preferred) AFTER THE PACKET:
---TRADE_SETUP_JSON---
{
  "id": "IMG_SCAN_01",
  "asset": "VISUALLY_DETECTED_NAME",
  "timeframe": "VISUALLY_DETECTED_TF",
  "direction": "BUY" | "SELL",
  "confidenceScore": 85,
  "accuracyProbability": "High",
  "status": "PENDING",
  "entryZone": "1234.50 - 1230.00",
  "optimalEntry": "1232.00",
  "entryConfirmation": "Aggressive Limit",
  "stopLoss": "1225.00",
  "slJustification": "Below Swing Low",
  "tpLevels": [{"level": "1250.00", "allocation": "50%", "target": "Swing High"}],
  "trailingStop": "Breakeven at TP1",
  "riskReward": "1:3.5",
  "positionSize": "Calculate based on 1% risk",
  "riskPerTrade": "1%",
  "profitPotential": "3.5%",
  "mfe": "N/A",
  "confluences": ["MSS", "FVG Tap", "OTE"],
  "marketStructure": "Bullish",
  "executionPlan": ["Set Limit", "Set Alerts"],
  "riskWarnings": ["News Event Pending"],
  "timestamp": 123456789
}
---END_SETUP---
`;

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeChart(imageBase64: string): Promise<string> {
    const ai = this.getClient();
    const now = new Date();
    
    // Updated prompt with "Identity Check" enforcement
    const visualPrompt = `
    [CRITICAL IDENTITY CHECK]
    1. READ the text in the Top Left Corner. (Is it XRP? BTC? ETH?)
    2. READ the price axis on the right. (Is it 0.50? 60,000? 2,000?)
    3. **COMBINE THEM**: If Text=XRP and Price=0.60, IT IS XRP. 
       If you are unsure, describe the price level first (e.g., "Asset trading at 0.60").
    
    [ICT EXECUTION]
    - Analyze the LAST candle relative to recent structure.
    - Identify Liquidity Sweeps (XRP often sweeps 15m lows before expanding).
    - Session Context: Real-world UTC is ${now.toISOString()}. Convert to NY Time.
    
    [LEVEL IDENTIFICATION]
    - Identify KEY Liquidity Pools (BSL/SSL).
    - Identify Fair Value Gaps (FVG).
    - Return them in the ---ICT_DATA_PACKET--- with correct types.
    `;

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
            text: `${visualPrompt}\n\nEXECUTE INSTITUTIONAL PROTOCOL.`,
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

  async generateTradeSetup(context: string): Promise<TradeSetup> {
    const ai = this.getClient();
    
    // Schema definition strictly matching the TradeSetup interface
    const schema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        asset: { type: Type.STRING },
        timeframe: { type: Type.STRING },
        direction: { type: Type.STRING, enum: ["BUY", "SELL"] },
        confidenceScore: { type: Type.NUMBER },
        accuracyProbability: { type: Type.STRING },
        status: { type: Type.STRING },
        entryZone: { type: Type.STRING },
        optimalEntry: { type: Type.STRING },
        entryConfirmation: { type: Type.STRING },
        stopLoss: { type: Type.STRING },
        slJustification: { type: Type.STRING },
        tpLevels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING },
              allocation: { type: Type.STRING },
              target: { type: Type.STRING }
            }
          }
        },
        trailingStop: { type: Type.STRING },
        riskReward: { type: Type.STRING },
        positionSize: { type: Type.STRING },
        riskPerTrade: { type: Type.STRING },
        profitPotential: { type: Type.STRING },
        mfe: { type: Type.STRING },
        confluences: { type: Type.ARRAY, items: { type: Type.STRING } },
        marketStructure: { type: Type.STRING },
        executionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        riskWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        timestamp: { type: Type.NUMBER }
      },
      required: [
        "id", "asset", "direction", "confidenceScore", "entryZone", 
        "stopLoss", "tpLevels", "riskReward", "confluences", "riskWarnings"
      ]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `CONTEXT: ${context || "Crypto Market General"}. 
      TASK: Generate a high-probability institutional trade setup based on ICT/SMC principles. 
      If no specific asset is mentioned, default to BTC or ETH. 
      Ensure strict risk management parameters.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    return JSON.parse(response.text || "{}");
  }
}

export const geminiService = new GeminiService();
