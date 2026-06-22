/** Public chat job shape returned by the standalone API. */

export type PublicRagAnalysis = {
  category: string | null;
  answerable: string | null;
  intent: string | null;
};

export type PublicChatJobResponse = {
  id: string;
  status: string;
  taskType: string;
  question: string | null;
  ragAnalysis: PublicRagAnalysis | null;
  model: string;
  maxTokens: number;
  useDeepSeek: boolean | null;
  result: {
    text: string | null;
    json: unknown;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  error: { message: string | null; code: string | null } | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RagInsightsExportSummary = {
  totalQueries: number;
  answerableYes: number;
  answerableNo: number;
  answerablePartial: number;
  topCategories: Array<{ category: string; count: number }>;
  weakAnswers: Array<{
    jobId: string;
    question: string;
    answerable: string | null;
    intent: string | null;
    category: string | null;
    finishedAt: string | null;
  }>;
};
