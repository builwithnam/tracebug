import { MessageData } from "../db.js";

export interface ParsedStage {
  raw: unknown;
  summary: Record<string, unknown> | null;
  error?: string;
}

export interface LangChainAIMessage {
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
  const toolCalls = safeGet<unknown[]>(parsed, [
    "message",
    "kwargs",
    "additional_kwargs",
    "tool_calls",
  ]);
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
  const responseMetadata = safeGet<Record<string, unknown>>(parsed, [
    "message",
    "kwargs",
    "response_metadata",
  ]);

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

  // Support both camelCase (tokenUsage) and snake_case (token_usage) key formats
  const tokenUsage =
    safeGet<Record<string, unknown>>(parsed, [
      "message",
      "kwargs",
      "response_metadata",
      "tokenUsage",
    ]) ??
    safeGet<Record<string, unknown>>(parsed, [
      "message",
      "kwargs",
      "response_metadata",
      "token_usage",
    ]);
  if (tokenUsage) {
    summary.tokenUsage = {
      promptTokens:
        (tokenUsage["promptTokens"] as number | undefined) ??
        (tokenUsage["prompt_tokens"] as number | undefined) ??
        null,
      completionTokens:
        (tokenUsage["completionTokens"] as number | undefined) ??
        (tokenUsage["completion_tokens"] as number | undefined) ??
        null,
      totalTokens:
        (tokenUsage["totalTokens"] as number | undefined) ??
        (tokenUsage["total_tokens"] as number | undefined) ??
        null,
    };
  }

  // traceId may live in additional_kwargs.context or at the top level of the stage object
  const context = safeGet<Record<string, unknown>>(parsed, [
    "message",
    "kwargs",
    "additional_kwargs",
    "context",
  ]);
  const traceId =
    context?.["traceId"] ??
    (parsed != null && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)["traceId"]
      : undefined);
  if (traceId) {
    summary.traceId = traceId;
  }

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractRouterSummary(parsed: unknown): Record<string, unknown> | null {
  // Router raw may be an array of router run objects; use the first element
  const item: unknown = Array.isArray(parsed) ? parsed[0] : parsed;

  const context = safeGet<Record<string, unknown>>(item, [
    "message",
    "kwargs",
    "additional_kwargs",
    "context",
  ]);
  const toolCalls = safeGet<unknown[]>(item, [
    "message",
    "kwargs",
    "additional_kwargs",
    "tool_calls",
  ]);

  // Try to extract from tool_calls arguments (JSON string)
  let toolCallArgs: Record<string, unknown> | null = null;
  const firstCall = toolCalls?.[0] as Record<string, unknown> | undefined;
  if (firstCall?.["function"]) {
    const fn = firstCall["function"] as Record<string, unknown>;
    if (typeof fn["arguments"] === "string") {
      try {
        toolCallArgs = JSON.parse(fn["arguments"]) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }
  }

  // Also try to extract from scenarioSelectorOutputs (newer format)
  const scenarioSelectorOutputs = safeGet<Array<Record<string, unknown>>>(item, [
    "scenarioSelectorOutputs",
  ]);
  const firstSelector = scenarioSelectorOutputs?.[0];
  const selectorArgs = firstSelector?.["toolCall"]
    ? ((firstSelector["toolCall"] as Record<string, unknown>)["args"] as
        | Record<string, unknown>
        | undefined)
    : null;
  const scenarioObj = firstSelector?.["scenario"] as Record<string, unknown> | undefined;

  const summary: Record<string, unknown> = {};

  const scenarioName =
    context?.["scenarioName"] ??
    scenarioObj?.["name"] ??
    toolCallArgs?.["scenario"] ??
    toolCallArgs?.["scenarioName"];
  if (scenarioName) summary.scenarioName = scenarioName;

  const flowId =
    context?.["flowId"] ??
    scenarioObj?.["flowId"] ??
    toolCallArgs?.["flow_id"] ??
    toolCallArgs?.["flowId"];
  if (flowId) summary.flowId = flowId;

  const intent =
    context?.["intent"] ??
    selectorArgs?.["intent"] ??
    toolCallArgs?.["intent"];
  if (intent) summary.intent = intent;

  const searchType =
    context?.["searchType"] ??
    selectorArgs?.["search_type"] ??
    selectorArgs?.["searchType"] ??
    toolCallArgs?.["search_type"] ??
    toolCallArgs?.["searchType"];
  if (searchType) summary.searchType = searchType;

  const cypherQuery =
    context?.["cypherQuery"] ??
    selectorArgs?.["cypher_query"] ??
    selectorArgs?.["cypherQuery"] ??
    toolCallArgs?.["cypher_query"] ??
    toolCallArgs?.["cypherQuery"];
  if (cypherQuery) {
    const cypherStr =
      typeof cypherQuery === "string" ? cypherQuery : JSON.stringify(cypherQuery);
    summary.cypherQuery = truncate(cypherStr, 200);
  }

  summary.toolCallsCount = toolCalls?.length ?? (Array.isArray(parsed) ? parsed.length : 0);

  return Object.keys(summary).length > 0 ? summary : null;
}

function extractScenarioSelectorSummary(parsed: unknown): Record<string, unknown> | null {
  const context = safeGet<Record<string, unknown>>(parsed, [
    "message",
    "kwargs",
    "additional_kwargs",
    "context",
  ]);

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
  const context = safeGet<Record<string, unknown>>(parsed, [
    "message",
    "kwargs",
    "additional_kwargs",
    "context",
  ]);

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
  // Support two formats:
  // 1. LangChain message format: message.kwargs.content + message.kwargs.additional_kwargs.context
  // 2. Flat object format: { summary, sources, memory, language, specialties, ... }
  const content = safeGet<string>(parsed, ["message", "kwargs", "content"]);
  const context = safeGet<Record<string, unknown>>(parsed, [
    "message",
    "kwargs",
    "additional_kwargs",
    "context",
  ]);
  const flat =
    parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;

  const summary: Record<string, unknown> = {};

  // Summary text: from LangChain content or flat.summary
  const summaryText =
    content ??
    (typeof flat?.["summary"] === "string" ? (flat["summary"] as string) : null);
  if (summaryText) {
    summary.summary = truncate(summaryText, 500);
  }

  // Language
  const language = context?.["language"] ?? flat?.["language"];
  if (language) summary.language = language;

  // Source count: explicit field or derived from sources array
  const sourceCount =
    context?.["sourceCount"] ??
    (Array.isArray(flat?.["sources"]) ? (flat!["sources"] as unknown[]).length : null);
  if (sourceCount != null) {
    summary.sourceCount = sourceCount;
  }

  // Memory fields: from context object or flat.memory object
  const memorySource = (context ?? flat?.["memory"]) as Record<string, unknown> | null;
  const memory: Record<string, unknown> = {};
  if (memorySource?.["province"]) memory.province = memorySource["province"];
  if (memorySource?.["service"]) memory.service = memorySource["service"];
  if (memorySource?.["bookingState"]) memory.bookingState = memorySource["bookingState"];
  if (memorySource?.["turnCount"] != null) memory.turnCount = memorySource["turnCount"];
  if (Object.keys(memory).length > 0) {
    summary.memory = memory;
  }

  // Specialties
  const specialties = context?.["specialties"] ?? flat?.["specialties"];
  if (specialties && Array.isArray(specialties) && specialties.length > 0) {
    summary.specialties = specialties;
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

function extractSummaryForStage(
  stageName: string,
  parsed: unknown,
): Record<string, unknown> | null {
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

const STAGE_NAMES = [
  "querier",
  "router",
  "scenario_selector",
  "agent",
  "generator",
  "questioner",
] as const;

export function parseAllStages(traces: MessageData[]): ParsedAllStages {
  const stages: Record<string, ParsedStage | null> = {};

  // Each row has one column per stage; use the first (most recent) row.
  const trace = traces[0] ?? null;

  for (const stageName of STAGE_NAMES) {
    const raw = trace ? (trace[stageName as keyof MessageData] as string | null) : null;
    stages[stageName] = parseStage(stageName, raw);
  }

  return {
    stages,
    stat: parseStat(trace ? trace.stat : null),
  };
}
