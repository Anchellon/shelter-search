import type { Service, Message, Group, ConversationSnapshot } from "@/app/store/slices/chatSlice";

export type { ConversationSnapshot };

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

// ---------- Auth token getter ----------

let tokenGetter: (() => Promise<string>) | null = null;

export function setTokenGetter(fn: () => Promise<string>) {
  tokenGetter = fn;
}

async function authHeaders(): Promise<HeadersInit> {
  if (!tokenGetter) return {};
  const token = await tokenGetter();
  return { Authorization: `Bearer ${token}` };
}

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
// Parses the SSE stream correctly per spec: events are separated by blank lines (\n\n),
// and a single event may span multiple `data:` lines (concatenated with \n).
// Processes events as they stream in rather than buffering the full response.

function emitEvent(rawEvent: string): SSEEvent | null {
  const dataLines: string[] = [];
  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("data: ")) {
      dataLines.push(line.slice(6));
    }
    // Intentionally ignore `event:`, `id:`, `retry:` fields for now
  }
  if (dataLines.length === 0) return null;
  const data = dataLines.join("\n").trim();
  if (!data || data === "[DONE]") return null;
  try {
    return JSON.parse(data) as SSEEvent;
  } catch {
    return null;
  }
}

async function* parseSSE(res: Response): AsyncGenerator<SSEEvent> {
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Yield each complete event (blank-line delimited) as it arrives
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = emitEvent(rawEvent);
      if (event) yield event;
    }
  }

  // Flush decoder and handle any final event not terminated by \n\n
  buffer += decoder.decode();
  if (buffer.trim()) {
    const event = emitEvent(buffer);
    if (event) yield event;
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
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ conversation_id: conversationId, action: "cancel", answers: {} }),
  });
  // Consume the body to free the connection
  if (res.body) await res.body.cancel();
}

// ---------- Conversations ----------

export interface ConversationSummary {
  id: string;
  title: string;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.conversations;
}

export async function getConversation(id: string): Promise<ConversationSnapshot> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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

// Re-export domain types used by consumers of this module
export type { Service, Message, Group };
