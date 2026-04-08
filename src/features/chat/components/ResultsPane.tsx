import { useEffect, useState } from "react";
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
import { starReferral } from "@/services/api";

function ServiceCard({ service }: { service: Service }) {
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
          aria-label={`Bookmark ${service.name}`}
          className="w-9 h-9 border border-grey-2 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 transition-colors"
        >
          <MSO icon="bookmark" size={16} />
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

export default function ResultsPane() {
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
            <ServiceCard key={svc.service_id} service={svc} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPage={handlePage} />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-grey-2 flex items-center gap-2 flex-shrink-0">
        <button
          aria-label="Print results"
          className="flex items-center gap-1.5 text-[12px] text-grey-6 hover:text-grey-9 px-2 py-1.5 rounded hover:bg-grey-2 transition-colors"
        >
          <MSO icon="print" size={15} />
          Print
        </button>
        <button
          aria-label="Export results"
          className="flex items-center gap-1.5 text-[12px] text-grey-6 hover:text-grey-9 px-2 py-1.5 rounded hover:bg-grey-2 transition-colors"
        >
          <MSO icon="download" size={15} />
          Export
        </button>
        <div className="flex-1" />
        {currentReferralId && (
          <button
            aria-label="Save referral"
            disabled={currentReferralSaved || saving}
            onClick={() => {
              setSaving(true);
              starReferral(currentReferralId)
                .then(() => dispatch(setCurrentReferralSaved()))
                .catch(console.error)
                .finally(() => setSaving(false));
            }}
            className={[
              "flex items-center gap-1.5 text-[12px] font-semibold px-2 py-1.5 rounded transition-colors",
              currentReferralSaved
                ? "text-brand cursor-default"
                : "text-grey-6 hover:text-brand hover:bg-brand-verylight",
            ].join(" ")}
          >
            <MSO icon={currentReferralSaved ? "bookmark" : "bookmark_add"} size={15} />
            {currentReferralSaved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
