
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ANALYSIS = 'ANALYSIS',
  SENTIMENT = 'SENTIMENT',
  CHAT = 'CHAT'
}

export interface TradeSetup {
  id: string;
  asset: string;
  timeframe: string;
  direction: 'BUY' | 'SELL';
  confidenceScore: number;
  accuracyProbability: string;
  status: string;
  entryZone: string;
  optimalEntry: string;
  entryConfirmation: string;
  stopLoss: string;
  slJustification: string;
  tpLevels: Array<{
    level: string;
    allocation: string;
    target: string;
  }>;
  trailingStop: string;
  riskReward: string;
  positionSize: string;
  riskPerTrade: string;
  profitPotential: string;
  mfe: string;
  confluences: string[];
  marketStructure: string;
  executionPlan: string[];
  riskWarnings: string[];
  timestamp: number;
}

export interface MarketSentiment {
  fearGreedIndex: string;
  trendingAssets: string[];
  macroSummary: string;
  sources: Array<{ web: { uri: string; title: string } }>;
}
