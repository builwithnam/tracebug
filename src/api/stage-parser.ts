import { MessageData } from "../db.js";

export interface ParsedStage {
  raw: unknown;
  summary: Record<string, unknown> | null;
  error?: string;
}

interface LangChainAIMessage {
  message?: {
    kwargs?: {
      additional_kwargs?: {
        tool_calls?: unknown[];
        context?: Record<string, unknown>;
      };
      response_metadata?: {
        model_name?: string;
        token_usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };
      content?: string;
    };
  };
}

interface StatTiming {
  querierDuration: number | null;
  routerDuration: number | null;
  scenarioSelectorDuration: number | null;
  agentDuration: number | null;
  generatorDuration: number | null;
  questionerDuration: number | null;
}

export interface ParsedAllStages {
  stages: Record<string, ParsedStage | null>;
  stat: StatTiming;
}

function truncate(str: string | null | undefined, maxLen: number): string | null {
  if (str == null) return null;
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function safeGet<T>(obj: unknown, path: string[]): T | null {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== "object") {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current as T | null;
}

function extractToolCallArgs(parsed: unknown): Record<string, unknown> | null {
  const toolCalls = safeGet<unknown[]>(parsed, ["message", "kwargs", "additional_kwargs", "tool_calls"]);
  if (!toolCalls || toolCalls.length === 0) return null;

  const firstCall = toolCalls[0];
  if (firstCall && typeof firstCall === "object") {
    const functionArgs = safeGet<string>(firstCall, ["function", "arguments"]);
    if (functionArgs) {
      try {
        return JSON.parse(functionArgs) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function extractQuerierSummary(parsed: unknown): Record<string, unknown> | null {
  const toolCallArgs = extractToolCallArgs(parsed);
  const responseMetadata = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "response_metadata"]);

  const summary: Record<string, unknown> = {};

  if (toolCallArgs?.["language"]) {
    summary.language = toolCallArgs["language"];
  }
  if (toolCallArgs?.["intent"]) {
    summary.intent = toolCallArgs["intent"];
  }

  if (responseMetadata?.["model_name"]) {
    summary.model = responseMetadata["model_name"];
  }

  const tokenUsage = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "response_metadata", "token_usage"]);
  if (tokenUsage) {
    summary.tokenUsage = {
      promptTokens: tokenUsage["prompt_tokens"] ?? null,
      completionTokens: tokenUsage["completion_tokens"] ?? null,
      totalTokens: tokenUsage["total_tokens"] ?? null,
    };
  }

  const context = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "additional_kwargs", "context"]);
  if (context?.["traceId"]) {
    summary.traceId = context["traceId"];
  }

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractRouterSummary(parsed: unknown): Record<string, unknown> | null {
  const context = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "additional_kwargs", "context"]);
  const toolCalls = safeGet<unknown[]>(parsed, ["message", "kwargs", "additional_kwargs", "tool_calls"]);

  // Try to extract from tool_calls arguments (JSON string)
  let args: Record<string, unknown> | null = null;
  const firstCall = toolCalls?.[0] as Record<string, unknown> | undefined;
  if (firstCall?.["function"]) {
    const fn = firstCall["function"] as Record<string, unknown>;
    if (typeof fn["arguments"] === "string") {
      try { args = JSON.parse(fn["arguments"]); } catch { /* ignore */ }
    }
  }

  const summary: Record<string, unknown> = {};

  const scenarioName = context?.["scenarioName"] ?? args?.["scenario"] ?? args?.["scenarioName"];
  if (scenarioName) summary.scenarioName = scenarioName;

  const flowId = context?.["flowId"] ?? args?.["flow_id"] ?? args?.["flowId"];
  if (flowId) summary.flowId = flowId;

  const intent = context?.["intent"] ?? args?.["intent"];
  if (intent) summary.intent = intent;

  const searchType = context?.["searchType"] ?? args?.["search_type"] ?? args?.["searchType"];
  if (searchType) summary.searchType = searchType;

  const cypherQuery = context?.["cypherQuery"] ?? args?.["cypher_query"] ?? args?.["cypherQuery"];
  if (cypherQuery) summary.cypherQuery = truncate(String(cypherQuery), 200);

  summary.toolCallsCount = toolCalls?.length ?? 0;

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractScenarioSelectorSummary(parsed: unknown): Record<string, unknown> | null {
  const context = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "additional_kwargs", "context"]);

  const summary: Record<string, unknown> = {};

  if (context?.["scenarioName"]) {
    summary.scenarioName = context["scenarioName"];
  }
  if (context?.["flowId"]) {
    summary.flowId = context["flowId"];
  }
  if (context?.["answerPrompt"]) {
    summary.answerPrompt = truncate(String(context["answerPrompt"]), 200);
  }

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractAgentSummary(parsed: unknown): Record<string, unknown> | null {
  const context = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "additional_kwargs", "context"]);

  const summary: Record<string, unknown> = {};

  if (context?.["entities"] && Array.isArray(context["entities"])) {
    summary.entities = (context["entities"] as Array<Record<string, unknown>>).map((e) => ({
      name: e["name"] ?? null,
      id: e["id"] ?? null,
    }));
  }

  if (context?.["sourceCount"] != null) {
    summary.sourceCount = context["sourceCount"];
  }

  if (context?.["cypherQuery"]) {
    summary.cypherQuerySummary = truncate(String(context["cypherQuery"]), 200);
  }

  if (context?.["answerPrompt"]) {
    summary.answerPromptSummary = truncate(String(context["answerPrompt"]), 200);
  }

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractGeneratorSummary(parsed: unknown): Record<string, unknown> | null {
  const content = safeGet<string>(parsed, ["message", "kwargs", "content"]);
  const context = safeGet<Record<string, unknown>>(parsed, ["message", "kwargs", "additional_kwargs", "context"]);

  const summary: Record<string, unknown> = {};

  if (content) {
    summary.summary = truncate(content, 500);
  }

  if (context?.["sourceCount"] != null) {
    summary.sourceCount = context["sourceCount"];
  }

  const memory: Record<string, unknown> = {};
  if (context?.["province"]) {
    memory.province = context["province"];
  }
  if (context?.["service"]) {
    memory.service = context["service"];
  }
  if (context?.["bookingState"]) {
    memory.bookingState = context["bookingState"];
  }
  if (context?.["turnCount"] != null) {
    memory.turnCount = context["turnCount"];
  }
  if (Object.keys(memory).length > 0) {
    summary.memory = memory;
  }

  if (context?.["specialties"] && Array.isArray(context["specialties"])) {
    summary.specialties = context["specialties"];
  }

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractQuestionerSummary(parsed: unknown): Record<string, unknown> | null {
  const content = safeGet<string>(parsed, ["message", "kwargs", "content"]);

  if (content) {
    return { question: truncate(content, 500) };
  }

  return null;
}

function extractSummaryForStage(stageName: string, parsed: unknown): Record<string, unknown> | null {
  switch (stageName) {
    case "querier":
      return extractQuerierSummary(parsed);
    case "router":
      return extractRouterSummary(parsed);
    case "scenario_selector":
      return extractScenarioSelectorSummary(parsed);
    case "agent":
      return extractAgentSummary(parsed);
    case "generator":
      return extractGeneratorSummary(parsed);
    case "questioner":
      return extractQuestionerSummary(parsed);
    default:
      return null;
  }
}

export function parseStage(stageName: string, rawValue: string | null): ParsedStage | null {
  if (rawValue === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    const summary = extractSummaryForStage(stageName, parsed);
    return { raw: parsed, summary };
  } catch (error) {
    return {
      raw: rawValue,
      summary: null,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

export function parseStat(rawValue: string | null): StatTiming {
  const defaultTiming: StatTiming = {
    querierDuration: null,
    routerDuration: null,
    scenarioSelectorDuration: null,
    agentDuration: null,
    generatorDuration: null,
    questionerDuration: null,
  };

  if (rawValue === null) {
    return defaultTiming;
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return {
      querierDuration: (parsed["querierDuration"] as number) ?? null,
      routerDuration: (parsed["routerDuration"] as number) ?? null,
      scenarioSelectorDuration: (parsed["scenarioSelectorDuration"] as number) ?? null,
      agentDuration: (parsed["agentDuration"] as number) ?? null,
      generatorDuration: (parsed["generatorDuration"] as number) ?? null,
      questionerDuration: (parsed["questionerDuration"] as number) ?? null,
    };
  } catch {
    return defaultTiming;
  }
}

const STAGE_NAMES = ["querier", "router", "scenario_selector", "agent", "generator", "questioner"] as const;

export function parseAllStages(traces: MessageData[]): ParsedAllStages {
  const stages: Record<string, ParsedStage | null> = {};
  let statPayload: string | null = null;

  for (const trace of traces) {
    const rawPayload = typeof trace.payload === "string" ? trace.payload : JSON.stringify(trace.payload);

    if (trace.stage === "stat") {
      statPayload = rawPayload;
      continue;
    }

    if (STAGE_NAMES.includes(trace.stage as any)) {
      stages[trace.stage] = parseStage(trace.stage, rawPayload);
    }
  }

  // Ensure all stages are present (even if null)
  for (const stageName of STAGE_NAMES) {
    stages[stageName] ??= null;
  }

  return {
    stages,
    stat: parseStat(statPayload),
  };
}
