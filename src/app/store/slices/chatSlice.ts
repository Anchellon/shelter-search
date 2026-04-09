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
export type MessageType = "text" | "referral";

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  groups?: Group[];      // present on type === "group-cards" | "referral"
  referralId?: string;   // present on type === "referral"
}

// ---------- Conversation snapshot (from GET /conversations/{id}) ----------

export interface ConversationSnapshot {
  id: string;
  messages: Message[];
  groups: Group[];
  formatted: Record<string, { rationale: string; service_ids: number[] }>;
  referrals: import("@/services/api").ReferralSummary[];
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
  groupResults: Record<string, GroupResults>;   // key: `${referralId}_${groupId}`
  servicesCache: Record<number, Service>;        // key: service_id
  isStreaming: boolean;
  pendingText: string;   // AI text buffer — invisible until committed via commitPendingMessage
  error: string | null;
  currentReferralId: string | null;   // id of the currently-active referral (for Save button)
  currentReferralSaved: boolean;      // true once user has starred it
  referralSavedMap: Record<string, boolean>;  // persists saved state across card clicks
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
  currentReferralId: null,
  currentReferralSaved: false,
  referralSavedMap: {},
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
      state.currentReferralId = null;
      state.currentReferralSaved = false;
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

    // Referral message commit — creates a "referral" type message keyed by referralId
    commitReferralMessage: {
      reducer(state, action: PayloadAction<{ id: string; referralId: string }>) {
        if (state.groups.length === 0) return;
        // Idempotent: remove any existing message for this referralId before pushing
        state.messages = state.messages.filter(
          (m) => !(m.type === "referral" && m.referralId === action.payload.referralId)
        );
        state.messages.push({
          id: action.payload.id,
          role: "assistant",
          type: "referral",
          content: "",
          groups: state.groups,
          referralId: action.payload.referralId,
        });
      },
      prepare(referralId: string) {
        return { payload: { id: `referral_${Date.now()}`, referralId } };
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
    // groupResults keyed by `${referralId}_${groupId}` to avoid collisions across turns
    setGroupResults(
      state,
      action: PayloadAction<{
        formatted: Record<string, { rationale: string; service_ids: number[] }>;
        referralId: string;
      }>
    ) {
      const { formatted, referralId } = action.payload;
      for (const [gid, data] of Object.entries(formatted)) {
        state.groupResults[`${referralId}_${gid}`] = {
          rationale: data.rationale,
          serviceIds: data.service_ids,
          currentPage: 1,
          pageSize: 10,
        };
      }
    },
    setGroupPage(
      state,
      action: PayloadAction<{ groupKey: string; page: number }>
    ) {
      const gr = state.groupResults[action.payload.groupKey];
      if (gr) gr.currentPage = action.payload.page;
    },

    // --- Load saved conversation ---
    loadConversation(state, action: PayloadAction<ConversationSnapshot>) {
      const { id, messages, groups, formatted, referrals } = action.payload;
      state.conversationId = id;
      state.groups = groups;

      // Insert a "referral" message after each corresponding assistant text message.
      // Pair by order: 1st referral → after 1st assistant message, etc.
      // Cards are not pre-selected — user clicks to activate.
      if (referrals && referrals.length > 0) {
        const augmented: Message[] = [];
        let refIdx = 0;
        for (const msg of messages) {
          augmented.push(msg);
          if (msg.role === "assistant" && refIdx < referrals.length) {
            const ref = referrals[refIdx];
            augmented.push({
              id: `referral_restored_${refIdx}`,
              role: "assistant",
              type: "referral",
              content: "",
              groups: ref.groups as Group[],
              referralId: ref.id,
            });
            refIdx++;
          }
        }
        state.messages = augmented;
      } else {
        state.messages = messages;
      }

      // Populate groupResults from each referral's group data
      state.groupResults = {};
      for (const ref of (referrals ?? [])) {
        for (const group of ref.groups) {
          const sids = (group as { service_ids?: number[] }).service_ids;
          if (sids && sids.length > 0) {
            state.groupResults[`${ref.id}_${group.group_id}`] = {
              rationale: (group as { rationale?: string | null }).rationale ?? "",
              serviceIds: sids,
              currentPage: 1,
              pageSize: 10,
            };
          }
        }
      }

      // Fallback: use snapshot.formatted for the last referral in case service_ids
      // were not included in the referral groups (list vs detail response shapes)
      if (referrals && referrals.length > 0 && formatted) {
        const lastRef = referrals[referrals.length - 1];
        for (const [gid, data] of Object.entries(formatted)) {
          const key = `${lastRef.id}_${gid}`;
          if (!state.groupResults[key]) {
            state.groupResults[key] = {
              rationale: data.rationale,
              serviceIds: data.service_ids,
              currentPage: 1,
              pageSize: 10,
            };
          }
        }
      }

      state.servicesCache = {};
      state.intakeRequest = null;
      state.isStreaming = false;
      state.pendingText = "";
      state.error = null;
      state.currentReferralId = null;
      state.currentReferralSaved = false;
      state.referralSavedMap = Object.fromEntries(
        (action.payload.referrals ?? []).map((r) => [r.id, r.saved])
      );
    },

    // --- Referral ---
    setCurrentReferral(state, action: PayloadAction<string>) {
      state.currentReferralId = action.payload;
      state.currentReferralSaved = state.referralSavedMap[action.payload] ?? false;
    },
    setCurrentReferralSaved(state, action: PayloadAction<boolean>) {
      state.currentReferralSaved = action.payload;
      if (state.currentReferralId) {
        state.referralSavedMap[state.currentReferralId] = action.payload;
      }
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
  commitReferralMessage,
  setIntakeRequest,
  clearIntakeRequest,
  setGroupResults,
  setGroupPage,
  setCurrentReferral,
  setCurrentReferralSaved,
  mergeServicesCache,
} = chatSlice.actions;

export default chatSlice.reducer;
