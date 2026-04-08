import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  setSidebarOpen,
  toggleSidebar,
  openAuthModal,
  closeResultsPanel,
} from "@/app/store/slices/uiSlice";
import { loadConversation } from "@/app/store/slices/chatSlice";
import { setConversations, setConversationsLoading } from "@/app/store/slices/conversationsSlice";
import { listConversations, getConversation } from "@/services/api";
import { ROUTES } from "@/app/router/routes";
import MSO from "./MSO";
import ShelterTechLogo from "./ShelterTechLogo";

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth0();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const { conversations, loading } = useAppSelector((s) => s.conversations);
  const navigate = useNavigate();
  const location = useLocation();
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch (or re-fetch) conversations whenever the user logs in
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(setConversationsLoading(true));
    listConversations()
      .then((data) => dispatch(setConversations(data)))
      .catch(() => {})
      .finally(() => dispatch(setConversationsLoading(false)));
  }, [isAuthenticated, dispatch]);

  async function handleConversationClick(id: string) {
    setLoadError(null);
    try {
      const snapshot = await getConversation(id);
      dispatch(loadConversation(snapshot));
      dispatch(closeResultsPanel());
      navigate(ROUTES.CHAT);
    } catch {
      setLoadError("Failed to load conversation. Please try again.");
    }
  }

  const iconBtn =
    "w-[30px] h-[30px] rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors flex-shrink-0";

  const avatarInitial = user?.name ? user.name[0].toUpperCase() : "?";
  const userName = user?.name ?? user?.email ?? "Account";

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "h-screen bg-grey-1 border-r border-grey-2 flex-shrink-0 overflow-hidden z-50",
          "transition-[width,transform] duration-200 ease-in-out",
          "fixed lg:relative",
          sidebarOpen
            ? "w-[260px] translate-x-0"
            : "w-[260px] -translate-x-full lg:translate-x-0 lg:w-0",
        ].join(" ")}
      >
        <div className="w-[260px] h-full flex flex-col py-3">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand rounded flex items-center justify-center flex-shrink-0">
                <ShelterTechLogo />
              </div>
              <span className="text-[17px] font-bold text-grey-9 tracking-tight">
                Navigator
              </span>
            </div>
            <button
              onClick={() => dispatch(toggleSidebar())}
              title="Close sidebar"
              aria-label="Close sidebar"
              className={iconBtn}
            >
              <MSO icon="menu" />
            </button>
          </div>

          {/* Nav */}
          <div className="px-2 pb-2">
            <button
              onClick={() => { navigate(ROUTES.HOME); dispatch(setSidebarOpen(false)); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-brand text-sm font-semibold hover:bg-grey-2 transition-colors"
            >
              <span className="w-[22px] h-[22px] rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                <MSO icon="add" size={14} className="text-white" />
              </span>
              New Search
            </button>
            <button
              onClick={() => { navigate(ROUTES.COLLECTIONS); dispatch(setSidebarOpen(false)); }}
              className={["w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm transition-colors",
                location.pathname === ROUTES.COLLECTIONS
                  ? "bg-brand-verylight text-brand font-semibold"
                  : "text-grey-9 hover:bg-grey-2",
              ].join(" ")}
            >
              <MSO icon="bookmark" size={18} className={location.pathname === ROUTES.COLLECTIONS ? "text-brand" : "text-grey-5"} />
              Collections
            </button>
          </div>

          <div className="h-px bg-grey-2 mx-3 mb-2" />

          {/* Recents */}
          <div className="flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-4 [&::-webkit-scrollbar-thumb]:rounded">
            <div className="text-[11px] font-semibold text-grey-5 uppercase tracking-[0.06em] px-2.5 py-1.5">
              Recents
            </div>
            {loadError && (
              <div className="px-2.5 py-1.5 text-[12px] text-red-500">{loadError}</div>
            )}
            {!isAuthenticated && (
              <div className="px-2.5 py-1.5 text-[13px] text-grey-5">
                Sign in to see recent searches
              </div>
            )}
            {isAuthenticated && loading && (
              <div className="px-2.5 py-1.5 text-[13px] text-grey-5">Loading...</div>
            )}
            {isAuthenticated && !loading && conversations.length === 0 && (
              <div className="px-2.5 py-1.5 text-[13px] text-grey-5">No recent searches</div>
            )}
            {isAuthenticated && conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-sm text-grey-6 text-[13px] truncate hover:bg-grey-2 hover:text-grey-9 transition-colors"
              >
                {conv.title}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 pt-3 mt-2 border-t border-grey-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={userName}
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                    {avatarInitial}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="text-[13px] font-semibold text-grey-9 truncate">{userName}</div>
                  <div className="text-[11px] text-grey-5">Case Worker</div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => dispatch(openAuthModal())}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-brand text-[13px] font-semibold hover:bg-grey-2 transition-colors"
              >
                <MSO icon="login" size={18} className="text-brand" />
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Collapsed icon strip — desktop only */}
      <div
        className={[
          "hidden lg:flex flex-col items-center py-3 gap-1 flex-shrink-0",
          "h-screen bg-grey-1 border-r border-grey-2 overflow-hidden transition-[width] duration-200",
          sidebarOpen ? "w-0" : "w-[52px]",
        ].join(" ")}
      >
        <button onClick={() => dispatch(toggleSidebar())} title="Open sidebar" aria-label="Open sidebar" className={iconBtn}>
          <MSO icon="menu" />
        </button>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          title="New search"
          aria-label="New search"
          className="w-[30px] h-[30px] rounded-full bg-brand flex items-center justify-center text-white hover:bg-brand-dark transition-colors"
        >
          <MSO icon="add" size={18} className="text-white" />
        </button>
        <button onClick={() => navigate(ROUTES.COLLECTIONS)} title="Collections" aria-label="Collections" className={iconBtn}>
          <MSO icon="bookmark" />
        </button>
        {!isAuthenticated && (
          <button
            onClick={() => dispatch(openAuthModal())}
            title="Sign In"
            aria-label="Sign In"
            className={iconBtn}
          >
            <MSO icon="login" />
          </button>
        )}
      </div>
    </>
  );
}
