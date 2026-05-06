import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  addAssistantMessage,
  addUserMessage,
  appendPendingDelta,
  clearIntakeRequest,
  commitReferralMessage,
  commitPendingMessage,
  mergeServicesCache,
  setClientContext,
  setConversationId,
  setCurrentReferral,
  setGroupPage,
  setGroupResults,
  setGroups,
  setIntakeRequest,
  streamError,
  streamingBegin,
  streamingEnd,
} from "@/app/store/slices/chatSlice";
import type { Group, IntakeStep } from "@/app/store/slices/chatSlice";
import { openAuthModal, openResultsPanel, setActiveGroupId, setActiveReferralId } from "@/app/store/slices/uiSlice";
import * as api from "@/services/api";
import type { SSEEvent } from "@/services/api";

const DEFAULT_PAGE_SIZE = 10;

// Runtime validators for SSE payloads that arrive as unknown[]
function parseGroups(raw: unknown): Group[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): boolean => {
      if (!g || typeof g !== "object") return false;
      const x = g as Record<string, unknown>;
      return (
        (typeof x.group_id === "number" || typeof x.group_id === "string") &&
        typeof x.what === "string" &&
        typeof x.where === "string"
      );
    })
    .map((g) => {
      const x = g as Record<string, unknown>;
      return { ...x, group_id: Number(x.group_id) } as Group;
    });
}

function parseSteps(raw: unknown): IntakeStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is IntakeStep => {
    if (!s || typeof s !== "object") return false;
    const x = s as Record<string, unknown>;
    return (
      typeof x.dimension === "string" &&
      typeof x.question === "string" &&
      (x.type === "multi_select" || x.type === "single_select")
    );
  });
}

export function useChat() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth0();
  const conversationId = useAppSelector((s) => s.chat.conversationId);
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const groupResults = useAppSelector((s) => s.chat.groupResults);
  const servicesCache = useAppSelector((s) => s.chat.servicesCache);

  // Fetches a page of services for a group key, only requesting IDs not already in cache.
  // groupKey is a compound key: `${referralId}_${groupId}` (or legacy `${groupId}`).
  // Pass groupData when calling immediately after setGroupResults dispatch (closure would be stale).
  const fetchServicesPage = useCallback(
    async (
      groupKey: string,
      page: number,
      groupData?: { serviceIds: number[]; pageSize: number }
    ) => {
      const gr = groupData ?? groupResults[groupKey];
      if (!gr) return;

      const { serviceIds, pageSize } = gr;
      const start = (page - 1) * pageSize;
      const pageIds = serviceIds.slice(start, start + pageSize);
      const missing = pageIds.filter((id) => !(id in servicesCache));

      if (missing.length > 0) {
        try {
          const services = await api.fetchServicesBatch(missing);
          dispatch(mergeServicesCache(services));
        } catch (e) {
          console.error("Failed to fetch services batch:", e);
        }
      }

      dispatch(setGroupPage({ groupKey, page }));
    },
    [dispatch, groupResults, servicesCache]
  );

  const processStream = useCallback(
    async (generator: AsyncGenerator<SSEEvent>) => {
      let streamEnded = false;
      for await (const event of generator) {
        switch (event.type) {
          case "__conversation_id":
            dispatch(setConversationId(event.conversationId));
            break;

          case "text-start":
            dispatch(streamingBegin());
            break;

          case "text-delta":
            dispatch(appendPendingDelta(event.delta));
            break;

          case "text-end":
            // Don't commit yet — wait for finish or format_complete
            break;

          case "intake_request":
            // Flush any buffered AI text before showing the intake card
            dispatch(commitPendingMessage());
            dispatch(
              setIntakeRequest({
                group_id: event.group_id,
                group_label: event.group_label,
                steps: parseSteps(event.steps),
              })
            );
            break;

          case "groups_identified": {
            const groups = parseGroups(event.groups);
            dispatch(setGroups(groups));
            if (groups.length > 0) {
              dispatch(setActiveGroupId(groups[0].group_id));
            }
            break;
          }

          case "format_complete": {
            const groups = parseGroups(event.groups);
            if (groups.length > 0) {
              dispatch(setGroups(groups));
            }
            dispatch(commitPendingMessage());

            const referralId = event.referral_id;
            if (referralId) {
              // Create a referral message keyed by referralId — results are stored
              // under compound keys so multiple turns never collide.
              dispatch(commitReferralMessage(referralId));
              dispatch(setGroupResults({ formatted: event.formatted, referralId }));
              dispatch(setCurrentReferral(referralId));

              const firstGroupId = Object.keys(event.formatted)[0];
              if (firstGroupId) {
                const groupKey = `${referralId}_${firstGroupId}`;
                dispatch(setActiveReferralId(referralId));
                dispatch(setActiveGroupId(Number(firstGroupId)));
                dispatch(openResultsPanel());
                fetchServicesPage(groupKey, 1, {
                  serviceIds: event.formatted[firstGroupId].service_ids,
                  pageSize: DEFAULT_PAGE_SIZE,
                });
              }
            }
            break;
          }

          case "context_updated":
            dispatch(setClientContext(event.client_context));
            break;

          case "clarify_request":
            dispatch(commitPendingMessage());
            dispatch(addAssistantMessage(event.question));
            break;

          case "finish":
            // Pure chat turn (no search) — commit buffered text and end streaming
            dispatch(commitPendingMessage());
            dispatch(streamingEnd());
            streamEnded = true;
            break;

          case "error":
            dispatch(streamError(event.errorText));
            streamEnded = true;
            break;
        }
      }

      // Cleanup: if the stream closed without a finish/error event, flush and stop
      if (!streamEnded) {
        dispatch(commitPendingMessage());
        dispatch(streamingEnd());
      }
    },
    [dispatch, fetchServicesPage]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;
      if (!isAuthenticated) {
        dispatch(openAuthModal());
        return;
      }

      dispatch(addUserMessage(trimmed));

      try {
        await processStream(
          api.chat({ message: trimmed, conversationId, currentTime: api.getCurrentTime() })
        );
      } catch (e) {
        dispatch(streamError(String(e)));
      }
    },
    [dispatch, isAuthenticated, isStreaming, conversationId, processStream]
  );

  const submitIntake = useCallback(
    async (answers: Record<string, string[]>) => {
      if (!conversationId) return;
      if (!isAuthenticated) {
        dispatch(openAuthModal());
        return;
      }
      dispatch(clearIntakeRequest());
      dispatch(streamingBegin());

      try {
        await processStream(api.resume({ conversationId, action: "submit", answers }));
      } catch (e) {
        dispatch(streamError(String(e)));
      }
    },
    [dispatch, isAuthenticated, conversationId, processStream]
  );

  const cancelIntake = useCallback(async () => {
    if (!conversationId) return;
    dispatch(clearIntakeRequest());
    dispatch(addUserMessage("I'll describe my needs in the message box below."));

    try {
      // Notify backend to clear interrupted state — fire-and-forget, response is discarded
      await api.cancelResume(conversationId);
    } catch {
      // Non-critical — UI already recovered
    }
  }, [dispatch, conversationId]);

  return { sendMessage, submitIntake, cancelIntake, isStreaming, fetchServicesPage };
}
