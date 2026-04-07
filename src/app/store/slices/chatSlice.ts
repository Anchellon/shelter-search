import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// ---------- Domain types (mirror the backend's NavigatorState) ----------

export interface Group {
  group_id: number;
  what: string;
  who: string | null;
  where: string;
  when: string | null;
  open_now: boolean;
  categories: string[];
  eligibilities: string[];
  lat: number | null;
  lng: number | null;
}

export interface IntakeStep {
  dimension: string;
  type: "multi_select" | "single_select";
  question: string;
  // flat list for "what", grouped dict for "who"
  options: string[] | Record<string, string[]>;
}

export interface IntakeRequest {
  group_id: number;
  group_label: string;
  steps: IntakeStep[];
}

export interface Service {
  service_id: number;
  name: string;
  long_description: string | null;
  resource_id: number;
  org_name: string;
  address_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
}

// ---------- Message types ----------

export type MessageRole = "user" | "assistant";
export type MessageType = "text" | "group-cards";

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  groups?: Group[];   // only for type === "group-cards"
}

// ---------- Conversation snapshot (from GET /conversations/{id}) ----------

export interface ConversationSnapshot {
  id: string;
  messages: Message[];
  groups: Group[];
  formatted: Record<string, { rationale: string; service_ids: number[] }>;
}

// ---------- Per-group results with pagination ----------

export interface GroupResults {
  rationale: string;
  serviceIds: number[];   // all IDs from format_complete, ordered by backend rank
  currentPage: number;
  pageSize: number;
}

// ---------- Slice state ----------

export interface ChatState {
  conversationId: string | null;
  messages: Message[];
  groups: Group[];
  intakeRequest: IntakeRequest | null;
  groupResults: Record<string, GroupResults>;   // key: group_id as string
  servicesCache: Record<number, Service>;        // key: service_id
  isStreaming: boolean;
  pendingText: string;   // AI text buffer — invisible until committed via commitPendingMessage
  error: string | null;
}

const initialState: ChatState = {
  conversationId: null,
  messages: [],
  groups: [],
  intakeRequest: null,
  groupResults: {},
  servicesCache: {},
  isStreaming: false,
  pendingText: "",
  error: null,
};

// ---------- Slice ----------

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // --- Conversation ---
    setConversationId(state, action: PayloadAction<string>) {
      state.conversationId = action.payload;
    },
    resetConversation() {
      return { ...initialState };
    },

    // --- Streaming lifecycle ---
    streamingBegin(state) {
      state.isStreaming = true;
      state.error = null;
    },
    appendPendingDelta(state, action: PayloadAction<string>) {
      state.pendingText += action.payload;
    },
    commitPendingMessage: {
      reducer(state, action: PayloadAction<{ id: string }>) {
        if (state.pendingText.trim()) {
          state.messages.push({
            id: action.payload.id,
            role: "assistant",
            type: "text",
            content: state.pendingText,
          });
        }
        state.pendingText = "";
      },
      prepare() {
        return { payload: { id: `ai_${Date.now()}` } };
      },
    },
    streamingEnd(state) {
      state.isStreaming = false;
      state.pendingText = "";
    },
    streamError(state, action: PayloadAction<string>) {
      state.isStreaming = false;
      state.pendingText = "";
      state.error = action.payload;
    },

    // --- User messages ---
    addUserMessage: {
      reducer(state, action: PayloadAction<{ id: string; content: string }>) {
        state.messages.push({
          id: action.payload.id,
          role: "user",
          type: "text",
          content: action.payload.content,
        });
      },
      prepare(content: string) {
        return { payload: { id: `user_${Date.now()}`, content } };
      },
    },

    // --- Groups ---
    setGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload;
    },
    commitGroupCards: {
      reducer(state, action: PayloadAction<{ id: string }>) {
        if (state.groups.length === 0) return;
        state.messages.push({
          id: action.payload.id,
          role: "assistant",
          type: "group-cards",
          content: "",
          groups: state.groups,
        });
      },
      prepare() {
        return { payload: { id: `groups_${Date.now()}` } };
      },
    },

    // --- Intake ---
    setIntakeRequest(state, action: PayloadAction<IntakeRequest>) {
      state.intakeRequest = action.payload;
    },
    clearIntakeRequest(state) {
      state.intakeRequest = null;
    },

    // --- Results ---
    setGroupResults(
      state,
      action: PayloadAction<Record<string, { rationale: string; service_ids: number[] }>>
    ) {
      for (const [gid, data] of Object.entries(action.payload)) {
        state.groupResults[gid] = {
          rationale: data.rationale,
          serviceIds: data.service_ids,
          currentPage: 1,
          pageSize: 10,
        };
      }
    },
    setGroupPage(
      state,
      action: PayloadAction<{ groupId: string; page: number }>
    ) {
      const gr = state.groupResults[action.payload.groupId];
      if (gr) gr.currentPage = action.payload.page;
    },

    // --- Load saved conversation ---
    loadConversation(state, action: PayloadAction<ConversationSnapshot>) {
      const { id, messages, groups, formatted } = action.payload;
      state.conversationId = id;
      state.groups = groups;

      // The backend only stores text messages. Synthesize the group-cards message
      // (normally created by commitGroupCards during a live stream) and inject it
      // right after the first assistant run — i.e. immediately before the first
      // follow-up user message (or at the end if there are no follow-up turns).
      if (groups.length > 0) {
        // Walk forward: once we've seen at least one assistant message, the next
        // user message marks the boundary. Insert the card just before it.
        let insertAt = messages.length;
        let seenAssistant = false;
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].role === "assistant") {
            seenAssistant = true;
          } else if (seenAssistant && messages[i].role === "user") {
            insertAt = i;
            break;
          }
        }
        const groupCardsMsg: Message = {
          id: "groups_restored",
          role: "assistant",
          type: "group-cards",
          content: "",
          groups,
        };
        state.messages = [
          ...messages.slice(0, insertAt),
          groupCardsMsg,
          ...messages.slice(insertAt),
        ];
      } else {
        state.messages = messages;
      }

      state.groupResults = {};
      for (const [gid, data] of Object.entries(formatted)) {
        state.groupResults[gid] = {
          rationale: data.rationale,
          serviceIds: data.service_ids,
          currentPage: 1,
          pageSize: 10,
        };
      }
      state.servicesCache = {};
      state.intakeRequest = null;
      state.isStreaming = false;
      state.pendingText = "";
      state.error = null;
    },

    // --- Services cache ---
    mergeServicesCache(state, action: PayloadAction<Service[]>) {
      for (const svc of action.payload) {
        state.servicesCache[svc.service_id] = svc;
      }
    },
  },
});

export const {
  setConversationId,
  resetConversation,
  loadConversation,
  streamingBegin,
  appendPendingDelta,
  commitPendingMessage,
  streamingEnd,
  streamError,
  addUserMessage,
  setGroups,
  commitGroupCards,
  setIntakeRequest,
  clearIntakeRequest,
  setGroupResults,
  setGroupPage,
  mergeServicesCache,
} = chatSlice.actions;

export default chatSlice.reducer;
