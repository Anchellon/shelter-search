import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch } from "@/app/store/hooks";
import { loadConversation } from "@/app/store/slices/chatSlice";
import { closeResultsPanel } from "@/app/store/slices/uiSlice";
import Sidebar from "@/shared/components/Sidebar";
import MSO from "@/shared/components/MSO";
import { ROUTES } from "@/app/router/routes";
import { listConversations, getConversation } from "@/services/api";
import type { ConversationSummary } from "@/services/api";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function RecentsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth0();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch (reset) when search changes or on mount
  const fetchConversations = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listConversations({ q: q || undefined });
      setConversations(data.conversations);
      setHasMore(data.has_more);
    } catch {
      setError("Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchConversations(debouncedQ);
  }, [isAuthenticated, debouncedQ, fetchConversations]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const data = await listConversations({
        q: debouncedQ || undefined,
        offset: conversations.length,
      });
      setConversations((prev) => [...prev, ...data.conversations]);
      setHasMore(data.has_more);
    } catch {
      setError("Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleOpen(id: string) {
    try {
      const snapshot = await getConversation(id);
      dispatch(loadConversation(snapshot));
      dispatch(closeResultsPanel());
      navigate(ROUTES.CHAT);
    } catch {
      setError("Failed to load conversation. Please try again.");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-10 pt-12 pb-8 flex-shrink-0">
          <div className="max-w-[860px] mx-auto w-full">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[22px] font-bold text-grey-9 tracking-tight">Chats</h1>
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-grey-9 text-white text-[13px] font-semibold rounded hover:bg-[#1a2224] transition-colors"
              >
                <MSO icon="add" size={16} className="text-white" />
                New Search
              </button>
            </div>

            <div className="flex items-center gap-2 border-[1.5px] border-brand-light rounded-md px-4 py-2.5 bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(39,108,229,0.09)]">
              <MSO icon="search" size={18} className="text-grey-5 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your chats..."
                className="border-none outline-none bg-transparent text-sm text-grey-9 flex-1 placeholder:text-[#b8b8b8]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-grey-4 hover:text-grey-7">
                  <MSO icon="close" size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-10 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-2 [&::-webkit-scrollbar-thumb]:rounded">
          <div className="max-w-[860px] mx-auto w-full">
            {!isAuthenticated && (
              <div className="text-[13px] text-grey-5 py-8 text-center">
                Sign in to view your recent searches.
              </div>
            )}
            {isAuthenticated && loading && (
              <div className="text-[13px] text-grey-5 py-8 text-center">Loading…</div>
            )}
            {isAuthenticated && error && (
              <div className="text-[13px] text-red-500 py-8 text-center">{error}</div>
            )}
            {isAuthenticated && !loading && conversations.length === 0 && !error && (
              <div className="text-[13px] text-grey-5 py-8 text-center">
                {searchQuery ? "No chats match your search." : "No recent searches yet."}
              </div>
            )}

            {isAuthenticated && conversations.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-grey-5 uppercase tracking-[0.06em] mb-2">
                  Your searches
                </p>
                <div className="border-t border-grey-2">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="border-b border-grey-2">
                      <button
                        onClick={() => handleOpen(conv.id)}
                        className="w-full text-left px-1 py-3 hover:bg-grey-1 rounded transition-colors"
                      >
                        <div className="text-[14px] font-semibold text-grey-9 truncate">
                          {conv.title}
                        </div>
                        <div className="text-[12px] text-grey-5 mt-0.5">
                          Last message {timeAgo(conv.updated_at)}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full mt-4 py-2.5 border border-grey-3 rounded text-[13px] text-grey-7 hover:bg-grey-1 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Show more"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
