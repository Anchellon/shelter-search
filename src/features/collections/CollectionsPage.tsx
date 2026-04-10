import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Sidebar from "@/shared/components/Sidebar";
import MSO from "@/shared/components/MSO";
import { ROUTES } from "@/app/router/routes";
import { listReferrals, starReferral } from "@/services/api";
import type { ReferralSummary } from "@/services/api";
import ReferralCard from "./components/ReferralCard";
import ResultsView from "./components/ResultsView";
import ContextMenu from "./components/ContextMenu";

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();

  const [referrals, setReferrals] = useState<ReferralSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [selected, setSelected] = useState<ReferralSummary | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    listReferrals()
      .then(setReferrals)
      .catch(() => setError("Failed to load referrals."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  function handleOpen(referral: ReferralSummary, index: number) {
    setSelected(referral);
    setSelectedIndex(index);
  }

  function handleDelete(id: string) {
    setContextMenu(null);
    starReferral(id, false)
      .then(() => setReferrals((prev) => prev.filter((r) => r.id !== id)))
      .catch(() => setError("Failed to remove referral."));
  }

  function handleMoreClick(e: React.MouseEvent<HTMLButtonElement>, id: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ id, x: rect.left, y: rect.bottom + 4 });
  }

  const filtered = referrals.filter((r) =>
    r.title.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="px-10 pt-12 pb-8 flex-shrink-0">
          <div className="max-w-[860px] mx-auto w-full">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[22px] font-bold text-grey-9 tracking-tight">Referrals</h1>
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-grey-9 text-white text-[13px] font-semibold rounded hover:bg-[#1a2224] transition-colors"
              >
                <MSO icon="add" size={16} className="text-white" />
                New Search
              </button>
            </div>

            <p className="text-[13px] text-grey-5 mb-9 max-w-[580px]">
              Your saved referrals — each containing the matched services for a set of identified needs.
            </p>

            <div className="flex items-center gap-2 border-[1.5px] border-brand-light rounded-md px-4 py-2.5 bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(39,108,229,0.09)]">
              <MSO icon="search" size={18} className="text-grey-5 flex-shrink-0" />
              <input
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter referrals…"
                className="border-none outline-none bg-transparent text-sm text-grey-9 flex-1 placeholder:text-[#b8b8b8]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-10 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-2 [&::-webkit-scrollbar-thumb]:rounded">
          <div className="flex flex-col gap-2 max-w-[860px] mx-auto w-full">
            {!isAuthenticated && (
              <div className="text-[13px] text-grey-5 py-8 text-center">
                Sign in to view your referrals.
              </div>
            )}
            {isAuthenticated && loading && (
              <div className="text-[13px] text-grey-5 py-8 text-center">Loading…</div>
            )}
            {isAuthenticated && error && (
              <div className="text-[13px] text-danger-text py-8 text-center">{error}</div>
            )}
            {isAuthenticated && !loading && filtered.length === 0 && !error && (
              <div className="text-[13px] text-grey-5 py-8 text-center">
                {filterQuery ? "No referrals match your filter." : "No saved referrals yet."}
              </div>
            )}
            {filtered.map((referral, i) => (
              <ReferralCard
                key={referral.id}
                referral={referral}
                index={i}
                onOpen={() => handleOpen(referral, i)}
                onMoreClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMoreClick(e, referral.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <ResultsView
        referral={selected}
        index={selectedIndex}
        onClose={() => setSelected(null)}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDelete(contextMenu.id)}
        />
      )}
    </div>
  );
}
