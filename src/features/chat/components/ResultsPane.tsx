import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  closeResultsPanel,
  setActiveGroupId,
  toggleResultsPanelExpanded,
} from "@/app/store/slices/uiSlice";
import { setCurrentReferralSaved } from "@/app/store/slices/chatSlice";
import { useChat } from "../hooks/useChat";
import { groupLabel } from "@/shared/utils/groupLabel";
import MSO from "@/shared/components/MSO";
import RationaleCard from "@/shared/components/RationaleCard";
import type { Service } from "@/app/store/slices/chatSlice";
import { starReferral, fetchServicesBatch, saveService, unsaveService } from "@/services/api";

function ServiceCard({
  service,
  saved,
  saving,
  onBookmark,
}: {
  service: Service;
  saved: boolean;
  saving: boolean;
  onBookmark: () => void;
}) {
  const [hoveringBookmark, setHoveringBookmark] = useState(false);
  const address = [service.address_1, service.city, service.state_province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border border-grey-2 rounded-md p-4 bg-white hover:border-brand-light hover:shadow-card transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-sm bg-success-bg text-success-text">
            Matched
          </span>
        </div>
      </div>

      <div className="text-[14px] font-bold text-grey-9 mb-1">{service.name}</div>
      {service.org_name && service.org_name !== service.name && (
        <div className="text-[11px] text-grey-5 mb-1.5">{service.org_name}</div>
      )}
      {service.long_description && (
        <p className="text-[12px] text-grey-5 leading-relaxed mb-3 line-clamp-3">
          {service.long_description}
        </p>
      )}

      <div className="flex flex-col gap-1 mb-3">
        {address && (
          <div className="flex items-center gap-1.5 text-[11px] text-grey-5">
            <MSO icon="location_on" size={13} className="text-grey-4" />
            {address}
          </div>
        )}
        {service.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-grey-5">
            <MSO icon="phone" size={13} className="text-grey-4" />
            {service.phone}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={`https://sfserviceguide.org/services/${service.service_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-3 py-2 bg-brand text-white text-[12px] font-semibold rounded text-center hover:bg-brand-dark transition-colors"
        >
          View Details
        </a>
        <button
          onClick={onBookmark}
          disabled={saving}
          onMouseEnter={() => setHoveringBookmark(true)}
          onMouseLeave={() => setHoveringBookmark(false)}
          aria-label={saved ? `Unsave ${service.name}` : `Save ${service.name}`}
          className={[
            "w-9 h-9 rounded flex items-center justify-center transition-colors disabled:opacity-50",
            saved
              ? hoveringBookmark
                ? "bg-danger-bg text-danger-text"
                : "bg-yellow-400 text-white"
              : "border border-grey-2 text-grey-5 hover:text-yellow-500 hover:bg-yellow-50",
          ].join(" ")}
        >
          <MSO icon={saved ? (hoveringBookmark ? "bookmark_remove" : "bookmark") : "bookmark_add"} size={16} />
        </button>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Results pages" className="flex items-center justify-center gap-1 py-2">
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-8 h-8 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 disabled:opacity-30 transition-colors"
      >
        <MSO icon="chevron_left" size={18} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          aria-label={`Page ${p}`}
          aria-current={p === currentPage ? "page" : undefined}
          className={[
            "w-8 h-8 rounded text-[13px] font-semibold transition-colors",
            p === currentPage
              ? "bg-brand text-white"
              : "text-grey-6 hover:bg-grey-2",
          ].join(" ")}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="w-8 h-8 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 disabled:opacity-30 transition-colors"
      >
        <MSO icon="chevron_right" size={18} />
      </button>
    </nav>
  );
}

export default function ResultsPane({ onSaveClick }: { onSaveClick: () => void }) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages);
  const groupResults = useAppSelector((s) => s.chat.groupResults);
  const servicesCache = useAppSelector((s) => s.chat.servicesCache);
  const activeGroupId = useAppSelector((s) => s.ui.activeGroupId);
  const activeReferralId = useAppSelector((s) => s.ui.activeReferralId);
  const expanded = useAppSelector((s) => s.ui.resultsPanelExpanded);
  const currentReferralId = useAppSelector((s) => s.chat.currentReferralId);
  const currentReferralSaved = useAppSelector((s) => s.chat.currentReferralSaved);
  const conversationId = useAppSelector((s) => s.chat.conversationId);
  const { fetchServicesPage } = useChat();
  const [saving, setSaving] = useState(false);
  const [hoveringBookmark, setHoveringBookmark] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  async function handleBookmark(serviceId: number) {
    const isSaved = savedIds.has(serviceId);
    setSavingIds((prev) => new Set(prev).add(serviceId));
    try {
      if (isSaved) {
        await unsaveService(serviceId);
        setSavedIds((prev) => { const n = new Set(prev); n.delete(serviceId); return n; });
      } else {
        await saveService(serviceId);
        setSavedIds((prev) => new Set(prev).add(serviceId));
      }
    } catch {
      // no-op
    } finally {
      setSavingIds((prev) => { const n = new Set(prev); n.delete(serviceId); return n; });
    }
  }
  const [printServices, setPrintServices] = useState<Service[] | null>(null);

  useEffect(() => {
    if (printServices === null) return;
    const id = setTimeout(() => {
      document.body.classList.add("printing");
      window.print();
      document.body.classList.remove("printing");
      setPrintServices(null);
    }, 50);
    return () => clearTimeout(id);
  }, [printServices]);

  async function handlePrint() {
    if (serviceIds.length === 0) return;
    try {
      const services = await fetchServicesBatch(serviceIds);
      setPrintServices(services);
    } catch {
      // no-op
    }
  }

  // Compound key: referralId_groupId
  const activeKey = activeReferralId && activeGroupId != null
    ? `${activeReferralId}_${activeGroupId}`
    : activeGroupId != null
      ? Object.keys(groupResults).find((k) => k.endsWith(`_${activeGroupId}`)) ?? Object.keys(groupResults)[0]
      : Object.keys(groupResults)[0];

  const gr = activeKey ? groupResults[activeKey] : null;

  const { currentPage = 1, pageSize = 10, serviceIds = [], rationale = "" } = gr ?? {};
  const totalPages = Math.ceil(serviceIds.length / pageSize);
  const pageIds = serviceIds.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageServices = pageIds.map((id) => servicesCache[id]).filter(Boolean) as Service[];

  // Groups to show in the header pills — use the active referral message's groups
  const activeReferralGroups = activeReferralId
    ? (messages.find((m) => m.type === "referral" && m.referralId === activeReferralId)?.groups ?? [])
    : [];

  // When the active key or conversation changes, fetch services if not already cached
  useEffect(() => {
    if (!activeKey || !gr) return;
    const firstPageIds = gr.serviceIds.slice(0, gr.pageSize);
    const hasMissing = firstPageIds.some((id) => !(id in servicesCache));
    if (hasMissing) fetchServicesPage(activeKey, 1);
  }, [activeKey, conversationId]);

  function handlePage(page: number) {
    if (!activeKey) return;
    fetchServicesPage(activeKey, page);
  }

  return (
    <div
      className={[
        "flex flex-col bg-white border-l border-grey-2 overflow-hidden transition-all duration-200 flex-shrink-0",
        "absolute inset-0 lg:relative lg:inset-auto",
        expanded ? "lg:w-full" : "lg:w-[340px]",
        "z-10",
      ].join(" ")}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-grey-2 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-grey-9">Matched Services</h2>
            <p className="text-[11px] text-grey-5 mt-0.5">
              {serviceIds.length} result{serviceIds.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => dispatch(toggleResultsPanelExpanded())}
              title={expanded ? "Collapse" : "Expand"}
              aria-label={expanded ? "Collapse results panel" : "Expand results panel"}
              className="hidden lg:flex w-7 h-7 rounded items-center justify-center text-grey-5 hover:bg-grey-2 transition-colors"
            >
              <MSO icon={expanded ? "close_fullscreen" : "open_in_full"} size={16} />
            </button>
            <button
              onClick={() => dispatch(closeResultsPanel())}
              aria-label="Close results panel"
              className="w-7 h-7 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 transition-colors"
            >
              <MSO icon="close" size={18} />
            </button>
          </div>
        </div>

        {/* Group pills — shown when the active referral has multiple groups */}
        {activeReferralGroups.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mt-3" role="group" aria-label="Switch group">
            {activeReferralGroups.map((g) => {
              const isActive = String(g.group_id) === String(activeGroupId);
              return (
                <button
                  key={g.group_id}
                  onClick={() => dispatch(setActiveGroupId(g.group_id))}
                  aria-pressed={isActive}
                  className={[
                    "text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors",
                    isActive
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-grey-6 border-grey-2 hover:border-brand-light hover:text-brand",
                  ].join(" ")}
                >
                  Group {groupLabel(g.group_id)} · {g.what}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-2 [&::-webkit-scrollbar-thumb]:rounded">
        {rationale && <div className="mb-3"><RationaleCard rationale={rationale} /></div>}

        {pageServices.length === 0 && pageIds.length > 0 && (
          <p className="text-[13px] text-grey-5 text-center py-8">Loading services...</p>
        )}
        {pageServices.length === 0 && pageIds.length === 0 && (
          <p className="text-[13px] text-grey-5 text-center py-8">No services found.</p>
        )}

        <div className="flex flex-col gap-3">
          {pageServices.map((svc) => (
            <ServiceCard
              key={svc.service_id}
              service={svc}
              saved={savedIds.has(svc.service_id)}
              saving={savingIds.has(svc.service_id)}
              onBookmark={() => handleBookmark(svc.service_id)}
            />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPage={handlePage} />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-grey-2 flex items-center gap-2 flex-shrink-0">
        <button
          aria-label="Print results"
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-[12px] text-grey-6 hover:text-grey-9 px-2 py-1.5 rounded hover:bg-grey-2 transition-colors"
        >
          <MSO icon="print" size={15} />
          Print
        </button>
        <div className="flex-1" />
        {currentReferralId && (
          <button
            aria-label={currentReferralSaved ? "Unsave referral" : "Save referral"}
            disabled={saving}
            onMouseEnter={() => setHoveringBookmark(true)}
            onMouseLeave={() => setHoveringBookmark(false)}
            onClick={() => {
              if (currentReferralSaved) {
                setSaving(true);
                starReferral(currentReferralId, false)
                  .then(() => dispatch(setCurrentReferralSaved(false)))
                  .catch(console.error)
                  .finally(() => setSaving(false));
              } else {
                onSaveClick();
              }
            }}
            className={[
              "flex items-center gap-1.5 text-[12px] font-semibold px-2 py-1.5 rounded transition-colors",
              currentReferralSaved
                ? hoveringBookmark
                  ? "bg-danger-bg text-danger-text"
                  : "bg-brand text-white"
                : "text-grey-6 hover:text-brand hover:bg-brand-verylight",
            ].join(" ")}
          >
            <MSO icon={currentReferralSaved ? (hoveringBookmark ? "bookmark_remove" : "bookmark") : "bookmark_add"} size={15} />
            {saving ? "Saving…" : currentReferralSaved ? (hoveringBookmark ? "Unsave" : "Saved") : "Save"}
          </button>
        )}
      </div>

      {/* Print portal — fetches all results and renders as direct child of body so only it shows during print */}
      {printServices !== null && createPortal(
        <div className="print-portal">
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Matched Services</h1>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
            {printServices.length} result{printServices.length !== 1 ? "s" : ""} found
          </p>

          {rationale && (
            <p style={{ fontSize: 12, fontStyle: "italic", marginBottom: 20, padding: "10px 12px", background: "#f0f4ff", borderLeft: "3px solid #6b7de8", borderRadius: 2 }}>
              {rationale}
            </p>
          )}

          <div>
            {printServices.map((svc) => {
              const address = [svc.address_1, svc.city, svc.state_province].filter(Boolean).join(", ");
              return (
                <div key={svc.service_id} style={{ borderBottom: "1px solid #eee", paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{svc.name}</div>
                  {svc.org_name && svc.org_name !== svc.name && (
                    <div style={{ fontSize: 11, color: "#888" }}>{svc.org_name}</div>
                  )}
                  {svc.long_description && (
                    <p style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{svc.long_description}</p>
                  )}
                  {address && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{address}</div>}
                  {svc.phone && <div style={{ fontSize: 11, color: "#888" }}>{svc.phone}</div>}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
