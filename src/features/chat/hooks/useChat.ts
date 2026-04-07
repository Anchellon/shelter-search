import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  addUserMessage,
  appendPendingDelta,
  clearIntakeRequest,
  commitGroupCards,
  commitPendingMessage,
  mergeServicesCache,
  setConversationId,
  setGroupPage,
  setGroupResults,
  setGroups,
  setIntakeRequest,
  streamError,
  streamingBegin,
  streamingEnd,
} from "@/app/store/slices/chatSlice";
import type { Group, IntakeStep } from "@/app/store/slices/chatSlice";
import { openAuthModal, openResultsPanel, setActiveGroupId } from "@/app/store/slices/uiSlice";
import * as api from "@/services/api";
import type { SSEEvent } from "@/services/api";

const DEFAULT_PAGE_SIZE = 10;

// Runtime validators for SSE payloads that arrive as unknown[]
function parseGroups(raw: unknown[]): Group[] {
  return raw.filter((g): g is Group => {
    if (!g || typeof g !== "object") return false;
    const x = g as Record<string, unknown>;
    return (
      typeof x.group_id === "number" &&
      typeof x.what === "string" &&
      typeof x.where === "string"
    );
  });
}

function parseSteps(raw: unknown[]): IntakeStep[] {
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

  // Fetches a page of services for a group, only requesting IDs not already in cache.
  // Pass groupData when calling immediately after setGroupResults dispatch (closure would be stale).
  const fetchServicesPage = useCallback(
    async (
      groupId: string,
      page: number,
      groupData?: { serviceIds: number[]; pageSize: number }
    ) => {
      const gr = groupData ?? groupResults[groupId];
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

      dispatch(setGroupPage({ groupId, page }));
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

          case "groups_identified": {
            const groups = parseGroups(event.groups);
            dispatch(setGroups(groups));
            if (groups.length > 0) {
              dispatch(setActiveGroupId(groups[0].group_id));
            }
            break;
          }

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

          case "format_complete": {
            // Flush buffered AI text + group cards, then reveal results together
            dispatch(commitPendingMessage());
            dispatch(commitGroupCards());
            dispatch(setGroupResults(event.formatted));
            dispatch(openResultsPanel());
            // Fetch the first page of the first group. Pass data directly from the event
            // because groupResults in the closure is pre-dispatch (stale at this point).
            const firstGroupId = Object.keys(event.formatted)[0];
            if (firstGroupId) {
              const first = event.formatted[firstGroupId];
              fetchServicesPage(firstGroupId, 1, {
                serviceIds: first.service_ids,
                pageSize: DEFAULT_PAGE_SIZE,
              });
            }
            break;
          }

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
