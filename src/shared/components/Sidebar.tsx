import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setSidebarOpen, toggleSidebar } from "@/app/store/slices/uiSlice";
import { ROUTES } from "@/app/router/routes";
import MSO from "./MSO";
import ShelterTechLogo from "./ShelterTechLogo";

// TODO: replace with real conversation history from the store
const STATIC_RECENTS = [
  "Shelter near Larkin St for 3 groups",
  "HIV resources Tenderloin — youth",
  "Urgent medical care SoMa adult male",
  "Women's shelter Mission District",
  "Food pantry + case management SoMa",
  "Family resources near Civic Center",
  "Mental health services Tenderloin",
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const user = useAppSelector((s) => s.user.user);
  const navigate = useNavigate();

  const avatarInitial = user?.avatarInitial ?? "M";
  const userName = user?.name ?? "Marcus T.";

  const iconBtn =
    "w-[30px] h-[30px] rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors flex-shrink-0";

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar — fixed on mobile/tablet, relative on desktop */}
      <aside
        className={[
          "h-screen bg-grey-1 border-r border-grey-2 flex-shrink-0 overflow-hidden z-50",
          "transition-[width,transform] duration-200 ease-in-out",
          // mobile/tablet: fixed overlay, slides in/out
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
            <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-grey-9 text-sm hover:bg-grey-2 transition-colors">
              <MSO icon="bookmark" size={18} className="text-grey-5" />
              Collections
            </button>
          </div>

          <div className="h-px bg-grey-2 mx-3 mb-2" />

          {/* Recents */}
          <div className="flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-4 [&::-webkit-scrollbar-thumb]:rounded">
            <div className="text-[11px] font-semibold text-grey-5 uppercase tracking-[0.06em] px-2.5 py-1.5">
              Recents
            </div>
            {STATIC_RECENTS.map((label) => (
              <button
                key={label}
                className="w-full text-left px-2.5 py-1.5 rounded-sm text-grey-6 text-[13px] truncate hover:bg-grey-2 hover:text-grey-9 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 pt-3 mt-2 border-t border-grey-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
              {avatarInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-semibold text-grey-9 truncate">{userName}</div>
              <div className="text-[11px] text-grey-5">Case Worker</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Collapsed icon strip — desktop only, shown when sidebar is closed */}
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
        <button title="Collections" aria-label="Collections" className={iconBtn}>
          <MSO icon="bookmark" />
        </button>
      </div>
    </>
  );
}
