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
    commitPendingMessage(state) {
      if (state.pendingText.trim()) {
        state.messages.push({
          id: `ai_${Date.now()}`,
          role: "assistant",
          type: "text",
          content: state.pendingText,
        });
      }
      state.pendingText = "";
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
    addUserMessage(state, action: PayloadAction<string>) {
      state.messages.push({
        id: `user_${Date.now()}`,
        role: "user",
        type: "text",
        content: action.payload,
      });
    },

    // --- Groups ---
    setGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload;
    },
    commitGroupCards(state) {
      if (state.groups.length === 0) return;
      state.messages.push({
        id: `groups_${Date.now()}`,
        role: "assistant",
        type: "group-cards",
        content: "",
        groups: state.groups,
      });
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
