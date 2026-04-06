import type { Service } from "@/app/store/slices/chatSlice";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

const headers = () => ({
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
});

// ---------- SSE event types ----------

export type SSEEvent =
  | { type: "__conversation_id"; conversationId: string }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "tool-start"; tool: string; status: string }
  | { type: "tool-end"; tool: string }
  | { type: "groups_identified"; groups: unknown[] }
  | { type: "intake_request"; group_id: number; group_label: string; steps: unknown[] }
  | { type: "format_complete"; formatted: Record<string, { rationale: string; service_ids: number[] }> }
  | { type: "finish"; finishReason: string }
  | { type: "error"; errorText: string };

// ---------- SSE parser ----------

async function* parseSSE(res: Response): AsyncGenerator<SSEEvent> {
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data) as SSEEvent;
      } catch {
        // malformed line — skip
      }
    }
  }
}

// ---------- /chat ----------

export interface ChatOptions {
  message: string;
  conversationId: string | null;
  currentTime: string;
}

export async function* chat(options: ChatOptions): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      message: options.message,
      conversation_id: options.conversationId,
      current_time: options.currentTime,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const convId = res.headers.get("X-Conversation-Id");
  if (convId) {
    yield { type: "__conversation_id", conversationId: convId };
  }

  yield* parseSSE(res);
}

// ---------- /chat/resume ----------

export interface ResumeOptions {
  conversationId: string;
  action: "submit" | "cancel";
  answers: Record<string, string[]>;
}

export async function* resume(options: ResumeOptions): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${BASE_URL}/chat/resume`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      conversation_id: options.conversationId,
      action: options.action,
      answers: options.answers,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  yield* parseSSE(res);
}

// ---------- /services/batch ----------

export async function fetchServicesBatch(serviceIds: number[]): Promise<Service[]> {
  if (serviceIds.length === 0) return [];

  const res = await fetch(`${BASE_URL}/services/batch`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ service_ids: serviceIds }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.services as Service[];
}

// ---------- /chat/resume (cancel, fire-and-forget) ----------

export async function cancelResume(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/resume`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ conversation_id: conversationId, action: "cancel", answers: {} }),
  });
  // Consume the body to free the connection
  if (res.body) await res.body.cancel();
}

// ---------- Helpers ----------

export function getCurrentTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
