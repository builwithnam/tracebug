import { describe, it, expect } from "vitest";
import { groupTracesByMessageId } from "../src/response.js";
import type { MessageData } from "../src/types.js";

describe("groupTracesByMessageId", () => {
  it("should return empty array when traces is empty", () => {
    const result = groupTracesByMessageId([]);
    expect(result).toEqual([]);
  });

  it("should return one trace per message_data record", () => {
    const traces: MessageData[] = [
      {
        id: 1,
        session_id: "session-123",
        user_journey: null,
        querier: JSON.stringify({ test: "data1" }),
        router: null,
        scenario_selector: null,
        agent: null,
        generator: null,
        questioner: null,
        stat: null,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: 2,
        session_id: "session-123",
        user_journey: null,
        querier: JSON.stringify({ test: "data2" }),
        router: null,
        scenario_selector: null,
        agent: null,
        generator: null,
        questioner: null,
        stat: null,
        created_at: new Date("2024-01-01T01:00:00.000Z"),
      },
    ];

    const result = groupTracesByMessageId(traces);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[0].created_at).toBe("2024-01-01T00:00:00.000Z");
    expect(result[1].created_at).toBe("2024-01-01T01:00:00.000Z");
  });

  it("should parse stages for each trace independently", () => {
    const traces: MessageData[] = [
      {
        id: 1,
        session_id: "session-123",
        user_journey: null,
        querier: JSON.stringify({
          message: {
            kwargs: {
              additional_kwargs: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        intent: "service",
                        language: "vi",
                      }),
                    },
                  },
                ],
                context: { traceId: "trace-1" },
              },
              response_metadata: {
                model_name: "gpt-4",
                tokenUsage: { totalTokens: 100 },
              },
            },
          },
        }),
        router: null,
        scenario_selector: null,
        agent: null,
        generator: null,
        questioner: null,
        stat: null,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: 2,
        session_id: "session-123",
        user_journey: null,
        querier: JSON.stringify({
          message: {
            kwargs: {
              additional_kwargs: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        intent: "doctor",
                        language: "vi",
                      }),
                    },
                  },
                ],
                context: { traceId: "trace-2" },
              },
              response_metadata: {
                model_name: "gpt-4",
                tokenUsage: { totalTokens: 200 },
              },
            },
          },
        }),
        router: null,
        scenario_selector: null,
        agent: null,
        generator: null,
        questioner: null,
        stat: null,
        created_at: new Date("2024-01-01T01:00:00.000Z"),
      },
    ];

    const result = groupTracesByMessageId(traces);

    expect(result).toHaveLength(2);
    expect(result[0].stages.querier?.summary).toEqual({
      intent: "service",
      language: "vi",
      model: "gpt-4",
      tokenUsage: {
        promptTokens: null,
        completionTokens: null,
        totalTokens: 100,
      },
      traceId: "trace-1",
    });
    expect(result[1].stages.querier?.summary).toEqual({
      intent: "doctor",
      language: "vi",
      model: "gpt-4",
      tokenUsage: {
        promptTokens: null,
        completionTokens: null,
        totalTokens: 200,
      },
      traceId: "trace-2",
    });
  });

  it("should handle null stages", () => {
    const traces: MessageData[] = [
      {
        id: 1,
        session_id: "session-123",
        user_journey: null,
        querier: null,
        router: null,
        scenario_selector: null,
        agent: null,
        generator: null,
        questioner: null,
        stat: null,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
      },
    ];

    const result = groupTracesByMessageId(traces);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].stages.querier).toBeNull();
  });
});
